import core from '../public/mtgtools/odyssey/art-sync-core.js';

const API = '/mtgtools/odyssey/api/art-sync';
const NOTES_API = '/mtgtools/odyssey/api/review-notes';
const NOTES_SCHEMA = 'odyssey-review-notes/v1';
const json = (value, status = 200) => new Response(JSON.stringify(value), {
  status,
  headers:{
    'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'no-store',
    'X-Content-Type-Options':'nosniff',
    'Referrer-Policy':'no-referrer'
  }
});

async function boundedJSON(request) {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new Error('Use application/json.');
  if (+request.headers.get('content-length') > 131072) throw new Error('Request too large.');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Missing request body.');
  const chunks = []; let length = 0;
  for (;;) {
    const {done,value} = await reader.read(); if (done) break;
    length += value.byteLength;
    if (length > 131072) { await reader.cancel(); throw new Error('Request too large.'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk,offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder().decode(bytes));
}

function sameOrigin(request, url) {
  const origin = request.headers.get('origin');
  return !((origin && origin !== url.origin) || request.headers.get('sec-fetch-site') === 'cross-site');
}

async function hexDigest(prefix, value) {
  const digest = await crypto.subtle.digest('SHA-256',new TextEncoder().encode(prefix + value));
  return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
}

function validNotesKey(value) {
  return /^[a-f0-9]{64}$/.test(String(value || ''));
}

function cleanText(value, max) {
  const text = String(value == null ? '' : value).replace(/\r\n?/g,'\n').trim();
  if (!text || text.length > max) throw new Error('Invalid note text.');
  return text;
}

function cleanOptional(value, max) {
  const text = String(value == null ? '' : value).replace(/\r\n?/g,'\n').trim();
  if (text.length > max) throw new Error('Invalid note metadata.');
  return text;
}

function cleanId(value, label) {
  const text = String(value || '').trim();
  if (!/^[A-Za-z0-9_.-]{1,100}$/.test(text)) throw new Error('Invalid '+label+'.');
  return text;
}

function validateNoteAction(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Invalid note request.');
  const action = body.action === 'status' ? 'status' : body.action === 'append' ? 'append' : '';
  if (!action) throw new Error('Unknown note action.');
  const datasetVersion = cleanId(body.datasetVersion,'dataset version');
  const cardId = cleanId(body.cardId,'card id');
  const number = Number(body.number);
  if (!Number.isInteger(number) || number < 1 || number > 10000) throw new Error('Invalid card number.');
  const name = cleanOptional(body.name,200);
  if (action === 'append') {
    return {
      action,datasetVersion,cardId,number,name,
      text:cleanText(body.text,4000),
      context:cleanOptional(body.context,800)
    };
  }
  const status = body.status === 'RESOLVED' ? 'RESOLVED' : body.status === 'OPEN' ? 'OPEN' : '';
  if (!status) throw new Error('Invalid note status.');
  return {action,datasetVersion,cardId,number,name,status};
}

function noteStorageKey(datasetVersion, cardId) {
  return 'note:'+datasetVersion+':'+cardId;
}

export async function handleSync(request, env) {
  const url = new URL(request.url);
  const isArt = url.pathname === API || url.pathname === API + '/health';
  const isNotes = url.pathname === NOTES_API || url.pathname === NOTES_API + '/health';
  if (!isArt && !isNotes) return null;
  if (!sameOrigin(request,url)) return json({error:'Cross-origin requests are not allowed.'},403);

  if (isNotes) {
    if (url.pathname.endsWith('/health')) {
      return request.method === 'GET'
        ? json({schema:NOTES_SCHEMA,available:!!env.ODYSSEY_ART_SYNC},env.ODYSSEY_ART_SYNC?200:503)
        : json({error:'Method not allowed.'},405);
    }
    if (!['GET','POST'].includes(request.method)) return json({error:'Method not allowed.'},405);
    if (!env.ODYSSEY_ART_SYNC) return json({error:'Shared storage is not deployed. Notes remain in the browser cache.'},503);
    const id = env.ODYSSEY_ART_SYNC.idFromName('odyssey-review-notes-v1');
    try { return await env.ODYSSEY_ART_SYNC.get(id).fetch(request); }
    catch (_) { return json({error:'Review-note storage is temporarily unavailable.'},503); }
  }

  if (url.pathname.endsWith('/health')) {
    return request.method === 'GET'
      ? json({schema:'odyssey-art-sync/v1',available:!!env.ODYSSEY_ART_SYNC},env.ODYSSEY_ART_SYNC?200:503)
      : json({error:'Method not allowed.'},405);
  }
  if (!['GET','PATCH'].includes(request.method)) return json({error:'Method not allowed.'},405);
  const token = /^Bearer ([a-f0-9]{64})$/.exec(request.headers.get('authorization') || '')?.[1];
  if (!token) return json({error:'A private device-pairing key is required.'},401);
  if (!env.ODYSSEY_ART_SYNC) return json({error:'Shared storage is not deployed. Your local edits are safe.'},503);
  const id = await hexDigest('odyssey-art-sync/v1:',token);
  const headers = new Headers(request.headers); headers.delete('authorization');
  const forwarded = new Request(request,{headers});
  try { return await env.ODYSSEY_ART_SYNC.get(env.ODYSSEY_ART_SYNC.idFromName(id)).fetch(forwarded); }
  catch (_) { return json({error:'Shared storage is temporarily unavailable. Your local edits are safe.'},503); }
}

export class OdysseyArtWorkspace {
  constructor(ctx) { this.ctx = ctx; }

  async fetchNotes(request) {
    let body = null;
    if (request.method === 'POST') {
      try { body = validateNoteAction(await boundedJSON(request)); }
      catch (error) { return json({error:error.message},400); }
    } else if (request.method !== 'GET') return json({error:'Method not allowed.'},405);

    try {
      const result = await this.ctx.storage.transaction(async txn => {
        const minute = Math.floor(Date.now()/60000), rate = await txn.get('notes-rate') || {minute,count:0};
        const count = rate.minute === minute ? rate.count+1 : 1;
        if (count > 180) return {limited:true};
        await txn.put('notes-rate',{minute,count});

        if (request.method === 'GET') {
          const stored = await txn.list({prefix:'note:',limit:4000});
          const notes = [...stored.values()].filter(row=>row && typeof row === 'object');
          notes.sort((a,b)=>(a.number||0)-(b.number||0)||String(a.cardId||'').localeCompare(String(b.cardId||'')));
          return {schema:NOTES_SCHEMA,notes};
        }

        const writeKey = request.headers.get('x-odyssey-notes-key') || '';
        if (!validNotesKey(writeKey)) return {auth:true};
        const ownerHash = await hexDigest('odyssey-review-notes-owner/v1:',writeKey);
        const storedOwner = await txn.get('notes-owner');
        if (storedOwner && storedOwner !== ownerHash) return {forbidden:true};
        if (!storedOwner) await txn.put('notes-owner',ownerHash);

        const key = noteStorageKey(body.datasetVersion,body.cardId);
        const current = await txn.get(key) || {
          datasetVersion:body.datasetVersion,
          cardId:body.cardId,
          number:body.number,
          name:body.name,
          status:'OPEN',
          entries:[],
          createdAt:new Date().toISOString(),
          updatedAt:new Date().toISOString()
        };
        if (!Array.isArray(current.entries)) current.entries = [];
        current.number = body.number;
        current.name = body.name || current.name || '';
        current.datasetVersion = body.datasetVersion;
        current.cardId = body.cardId;

        if (body.action === 'append') {
          current.entries.push({at:new Date().toISOString(),text:body.text,context:body.context});
          if (current.entries.length > 200) current.entries = current.entries.slice(-200);
          current.status = 'OPEN';
        } else {
          current.status = body.status;
        }
        current.updatedAt = new Date().toISOString();
        await txn.put(key,current);
        return {schema:NOTES_SCHEMA,note:current};
      });
      if (result.limited) return json({error:'Notes rate limit reached. Retry shortly.'},429);
      if (result.auth) return json({error:'A private notes key is required.'},401);
      if (result.forbidden) return json({error:'This notes workspace is paired to another browser key.'},403);
      return json(result);
    } catch (error) {
      return json({error:error.message},400);
    }
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === NOTES_API) return this.fetchNotes(request);

    let changes;
    if (request.method === 'PATCH') {
      try { changes = (await boundedJSON(request)).changes; core.applyChanges({},changes); }
      catch (error) { return json({error:error.message},400); }
    } else if (request.method !== 'GET') return json({error:'Method not allowed.'},405);
    try {
      const result = await this.ctx.storage.transaction(async txn => {
        const minute = Math.floor(Date.now()/60000), rate = await txn.get('rate') || {minute,count:0};
        const count = rate.minute === minute ? rate.count+1 : 1;
        if (count > 120) return {limited:true};
        await txn.put('rate',{minute,count});
        const stored = await txn.list({prefix:'row:',limit:core.MAX_RECORDS+1});
        const records = Object.fromEntries([...stored].map(([key,value])=>[key.slice(4),value]));
        if (!core.validRecords(records)) throw new Error('Stored workspace is invalid.');
        if (!changes) return {schema:'odyssey-art-sync/v1',records};
        const applied = core.applyChanges(records,changes);
        for (const [key,row] of Object.entries(applied.accepted)) if (!core.equal(row,records[key])) await txn.put('row:'+key,row);
        return {schema:'odyssey-art-sync/v1',...applied};
      });
      return result.limited ? json({error:'Sync rate limit reached. Retry shortly.'},429) : json(result);
    } catch (error) { return json({error:error.message},400); }
  }
}
