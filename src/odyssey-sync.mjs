import core from '../public/mtgtools/odyssey/art-sync-core.js';
const API = '/mtgtools/odyssey/api/art-sync';
const json = (value, status = 200) => new Response(JSON.stringify(value), {status, headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
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
export async function handleSync(request, env) {
  const url = new URL(request.url);
  if (url.pathname !== API && url.pathname !== API + '/health') return null;
  const origin = request.headers.get('origin');
  if ((origin && origin !== url.origin) || request.headers.get('sec-fetch-site') === 'cross-site') return json({error:'Cross-origin requests are not allowed.'},403);
  if (url.pathname.endsWith('/health')) return request.method === 'GET' ? json({schema:'odyssey-art-sync/v1',available:!!env.ODYSSEY_ART_SYNC},env.ODYSSEY_ART_SYNC?200:503) : json({error:'Method not allowed.'},405);
  if (!['GET','PATCH'].includes(request.method)) return json({error:'Method not allowed.'},405);
  const token = /^Bearer ([a-f0-9]{64})$/.exec(request.headers.get('authorization') || '')?.[1];
  if (!token) return json({error:'A private device-pairing key is required.'},401);
  if (!env.ODYSSEY_ART_SYNC) return json({error:'Shared storage is not deployed. Your local edits are safe.'},503);
  // The bearer key never appears in URLs, logs, responses, or stored rows.
  const digest = await crypto.subtle.digest('SHA-256',new TextEncoder().encode('odyssey-art-sync/v1:' + token));
  const id = [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
  const headers = new Headers(request.headers); headers.delete('authorization');
  const forwarded = new Request(request,{headers});
  try { return await env.ODYSSEY_ART_SYNC.get(env.ODYSSEY_ART_SYNC.idFromName(id)).fetch(forwarded); }
  catch (_) { return json({error:'Shared storage is temporarily unavailable. Your local edits are safe.'},503); }
}
export class OdysseyArtWorkspace {
  constructor(ctx) { this.ctx = ctx; }
  async fetch(request) {
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
