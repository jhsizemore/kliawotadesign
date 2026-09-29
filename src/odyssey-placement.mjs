/* Google is the write authority; only validated placement fields become public.
 * OAuth tokens are request-local, forwarded only to this fixed spreadsheet,
 * and never stored in the Durable Object, a log, or a public response. */
import P from '../public/mtgtools/odyssey/art-placement-core.js';
const STORE='published-art-placement/v1',LIMIT=240000,BASE='https://sheets.googleapis.com/v4/spreadsheets/'+P.SHEET_ID;
const response=(v,status=200)=>new Response(JSON.stringify(v),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
async function body(request){if(Number(request.headers.get('content-length')||0)>LIMIT)throw Error('Placement request too large.');const reader=request.body?.getReader();if(!reader)throw Error('Missing placement request.');const chunks=[];let n=0;for(;;){const {value,done}=await reader.read();if(done)break;n+=value.length;if(n>LIMIT){await reader.cancel();throw Error('Placement request too large.');}chunks.push(value);}const bytes=new Uint8Array(n);let at=0;for(const c of chunks){bytes.set(c,at);at+=c.length;}return JSON.parse(new TextDecoder().decode(bytes));}
export async function routePlacements(request,env){const url=new URL(request.url);if(url.pathname!==P.API)return null;if(!['GET','POST'].includes(request.method))return response({error:'Method not allowed.'},405);const origin=request.headers.get('origin');if((origin&&origin!==url.origin)||(request.method==='POST'&&origin!==url.origin))return response({error:'Same-origin access is required.'},403);if(request.method==='POST'&&!/^Bearer [A-Za-z0-9._~+\/-]{10,4096}$/.test(request.headers.get('authorization')||''))return response({error:'Connect Google to publish artwork placements.'},401);if(!env.ODYSSEY_ART_SYNC)return response({error:'Placement storage is unavailable. Local edits are safe.'},503);try{return await env.ODYSSEY_ART_SYNC.get(env.ODYSSEY_ART_SYNC.idFromName(STORE)).fetch(request);}catch(_){return response({error:'Placement sync is temporarily unavailable. Local edits are safe.'},503);}}
export async function placementWorkspace(request,storage,fetcher=fetch){
 if(request.method==='GET')return response(P.snapshot(await storage.get(STORE)||P.empty()));
 let input;try{input=await body(request);if(!['review','publish','refresh'].includes(input.action))throw Error('Unknown placement action.');P.analyze({},input.changes||[]);if(input.action==='refresh'&&(input.changes||[]).length)throw Error('Sheet refresh cannot include local changes.');}catch(e){return response({error:e.message},400);}
 const authorization=request.headers.get('authorization');if(!/^Bearer [A-Za-z0-9._~+\/-]{10,4096}$/.test(authorization||''))return response({error:'Google authorization required.'},401);
 async function google(path,opt={}){const r=await fetcher(BASE+path,{...opt,headers:{Authorization:authorization,'Content-Type':'application/json'},signal:AbortSignal.timeout(15000)});const v=await r.json().catch(()=>({}));if(!r.ok){const e=Error(r.status===401?'Google authorization expired. Connect again.':r.status===403?'Google denied access. An editor account is required to write placements.':'Google Sheets could not complete placement sync ('+r.status+').');e.status=r.status===401||r.status===403?r.status:502;throw e;}return v;}
 const range="'"+P.TAB+"'!A1:M2001";
 async function read(){const meta=await google('?fields=sheets(properties(sheetId,title,gridProperties))');const sheet=meta.sheets?.find(s=>s.properties.title===P.TAB);if(!sheet)return{...P.parseRows([P.HEADERS]),missing:true};const v=await google('/values/'+encodeURIComponent(range)+'?valueRenderOption=UNFORMATTED_VALUE');return{...P.parseRows(v.values||[]),sheetId:sheet.properties.sheetId};}
 try{
  let live=await read();const plan=P.analyze(live.records,input.changes||[]);
  if(input.action==='review')return response({schema:P.SCHEMA,records:live.records,missing:!!live.missing,...plan});
  if(plan.conflicts.length)return response({error:'Sheet placements changed. Review the conflicts before publishing.',...plan,records:live.records},409);
  if(input.action==='refresh'&&live.missing)throw Error('No Artwork Placement tab exists yet. Publish saved crops first.');
  const writes=plan.writes,at=new Date().toISOString();
  if(input.action==='publish'&&writes.length){
   if(live.missing){await google(':batchUpdate',{method:'POST',body:JSON.stringify({requests:[{addSheet:{properties:{title:P.TAB,gridProperties:{rowCount:2001,columnCount:13,frozenRowCount:1}}}}]})});await google('/values:batchUpdate',{method:'POST',body:JSON.stringify({valueInputOption:'RAW',data:[{range:"'"+P.TAB+"'!A1:M1",values:[P.HEADERS]}]})});live=await read();const again=P.analyze(live.records,input.changes||[]);if(again.conflicts.length)return response({error:'Sheet changed during setup.',...again},409);}
   let nextRow=live.lastRow+1;const sent=writes.map(c=>({...c.after,revision:(live.records[P.key(c.after)]?.revision||0)+1,updatedAt:at}));
   const data=sent.map(r=>{const row=live.positions[P.key(r)]||nextRow++;if(row>2001)throw Error('Placement tab is full.');return{range:"'"+P.TAB+"'!A"+row+':M'+row,values:[P.toRow(r)]};});
   await google('/values:batchUpdate',{method:'POST',body:JSON.stringify({valueInputOption:'RAW',data})});
   const verified=await read();if(sent.some(r=>!P.equal(r,verified.records[P.key(r)])))throw Error('Sheet read-back differs. Public placements were not changed; review the Sheet before retrying.');live=verified;
  }
  // Refresh publishes only the fixed Sheet's verified values, never request data.
  const previous=P.snapshot(await storage.get(STORE)||P.empty());const changed=JSON.stringify(previous.records)!==JSON.stringify(live.records);
  const published={schema:P.SCHEMA,revision:previous.revision+(changed?1:0),records:live.records};if(changed)await storage.put(STORE,published);return response({...published,written:writes.length,verified:true});
 }catch(e){return response({error:e.message||'Placement sync failed.'},e.status||502);}
}
