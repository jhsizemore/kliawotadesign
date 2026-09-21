(function(root){
"use strict";
const VERSION="1.0";
const NOTE_COL="AK",STATUS_COL="AL",UPDATED_COL="AM";
const NOTE_HEADER="Studio Notes",STATUS_HEADER="Studio Note Status",UPDATED_HEADER="Studio Note Updated";
const CACHE_PREFIX="odyssey-studio-notes-v1";
let records={},loaded=false,token="",queueDialog=null,composeDialog=null,activeContext="";

function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function norm(s){return String(s==null?"":s).replace(/\r\n?/g,"\n").trim()}
function datasetTag(){try{return String(ODYSSEY_DATASET&&ODYSSEY_DATASET.datasetVersion||"active")}catch(_){return"active"}}
function cacheKey(){return CACHE_PREFIX+"::"+datasetTag()}
function saveCache(){try{localStorage.setItem(cacheKey(),JSON.stringify({savedAt:new Date().toISOString(),records}))}catch(_){}}
function loadCache(){try{const x=JSON.parse(localStorage.getItem(cacheKey())||"null");if(x&&x.records&&typeof x.records==="object")records=x.records}catch(_){}}
function editor(){return root.OdysseySheetEditor}
function quoted(name){return "'"+String(name||"").replace(/'/g,"''")+"'"}
function a1(range){return quoted(editor().SHEET_NAME)+"!"+range}
function openCount(){return Object.values(records).filter(r=>r&&r.status==="OPEN"&&norm(r.note)).length}
function cardName(n){try{return model(n).displayName||baseCard(n).name||("Card "+n)}catch(_){return"Card "+n}}
function sourceName(n){try{return baseCard(n).name||""}catch(_){return""}}
function rowMatches(n,r){return !!r&&norm(r.sheetName).toLowerCase()===norm(sourceName(n)).toLowerCase()}
function appendEntry(existing,text,context,when){
  const stamp=(when||new Date()).toISOString();
  const body=[norm(context),norm(text)].filter(Boolean).join(" — ");
  if(!body)return norm(existing);
  return [norm(existing),stamp+" — "+body].filter(Boolean).join("\n");
}
function noteFor(n){return records[n]||null}

async function getToken(){
  if(token)return token;
  const e=editor();
  if(!e||typeof e.auth!=="function")throw Error("Odyssey Sheet connection is unavailable.");
  token=await e.auth();
  return token;
}
async function api(path,opt){
  const e=editor();
  if(!e||typeof e.api!=="function")throw Error("Odyssey Sheet connection is unavailable.");
  try{return await e.api(path,opt||{},await getToken())}
  catch(error){if(/expired|401|authoriz/i.test(String(error&&error.message||error)))token="";throw error}
}
function validateHeaders(values){
  const h=(values&&values[0])||[];
  if(norm(h[0])!==NOTE_HEADER||norm(h[1])!==STATUS_HEADER||norm(h[2])!==UPDATED_HEADER)throw Error("Studio note columns on 14A2 no longer match the expected layout.");
}
async function refresh(){
  const e=editor();
  if(!e||!e.SHEET_NAME)throw Error("Odyssey Sheet connection is unavailable.");
  const idRange=a1("A1:B310"),noteRange=a1(NOTE_COL+"1:"+UPDATED_COL+"310");
  const path="/values:batchGet?majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE&ranges="+encodeURIComponent(idRange)+"&ranges="+encodeURIComponent(noteRange);
  const data=await api(path,{method:"GET"});
  const identity=data.valueRanges&&data.valueRanges[0]&&data.valueRanges[0].values||[];
  const noteRows=data.valueRanges&&data.valueRanges[1]&&data.valueRanges[1].values||[];
  validateHeaders(noteRows);
  const next={};
  for(let i=1;i<identity.length;i++){
    const row=identity[i]||[],n=Number(row[0]);
    if(!Number.isInteger(n)||n<1)continue;
    const nr=noteRows[i]||[];
    next[n]={row:i+1,sheetName:norm(row[1]),note:norm(nr[0]),status:norm(nr[1]),updated:norm(nr[2])};
  }
  records=next;loaded=true;saveCache();paintAll();return records;
}
async function ensureRow(n){
  if(!loaded||!records[n]||!records[n].row)await refresh();
  const r=records[n];
  if(!r||!r.row)throw Error("Could not locate card "+n+" in 14A2.");
  if(!rowMatches(n,r))throw Error("Card "+String(n).padStart(3,"0")+" does not match the 14A2 row identity. Nothing was written.");
  return r;
}
async function write(n,note,status){
  const r=await ensureRow(n),updated=new Date().toISOString(),range=a1(NOTE_COL+r.row+":"+UPDATED_COL+r.row);
  const body={valueInputOption:"RAW",includeValuesInResponse:true,data:[{range:range,majorDimension:"ROWS",values:[[note,status,updated]]}]};
  await api("/values:batchUpdate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  const check=await api("/values/"+encodeURIComponent(range)+"?majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE",{method:"GET"});
  const row=(check.values&&check.values[0])||[];
  if(norm(row[0])!==norm(note)||norm(row[1])!==norm(status)||norm(row[2])!==norm(updated))throw Error("The note write could not be verified.");
  records[n]=Object.assign({},r,{note:norm(note),status:norm(status),updated:updated});saveCache();paintAll();return records[n];
}
async function addNote(n,text,context){
  const r=await ensureRow(n),next=appendEntry(r.note,text,context,new Date());
  if(next===norm(r.note))throw Error("Write a note first.");
  return write(n,next,"OPEN");
}
async function resolveNote(n){
  const r=await ensureRow(n);
  if(!norm(r.note))throw Error("This card has no note to resolve.");
  return write(n,r.note,"RESOLVED");
}

function style(){
  if(document.getElementById("odyssey-review-notes-css"))return;
  const s=document.createElement("style");s.id="odyssey-review-notes-css";s.textContent=
".od-note-section textarea{width:100%;min-height:86px;resize:vertical;background:#10120f;color:#f0eee4;border:1px solid #454b3e;border-radius:8px;padding:9px;font-size:12px;line-height:1.4}"+
".od-note-history{white-space:pre-wrap;max-height:180px;overflow:auto;padding:8px;border:1px solid #3c4235;border-radius:8px;background:#151812;color:#d7d5ca;font:10px/1.45 ui-monospace,monospace;margin:7px 0}"+
".od-note-empty{color:#8f9484;font:11px/1.4 system-ui,sans-serif}.od-note-status{display:flex;gap:6px;align-items:center;flex-wrap:wrap;font-size:10px;color:#aeb3a0}"+
".od-note-pill{display:inline-flex;align-items:center;border:1px solid #5b6253;border-radius:999px;padding:3px 7px;font-weight:900;font-size:8px;letter-spacing:.04em}"+
".od-note-pill.open{border-color:#ae7948;color:#efc390;background:#2d2116}.od-note-pill.resolved{border-color:#5f7d4d;color:#cfe1b2;background:#1b2918}"+
".dot.note{background:#e0a154;box-shadow:0 0 0 1px #5c3a18}.card-row.has-studio-note{border-right:2px solid #b87839}"+
".od-note-dialog{width:min(760px,94vw);max-height:88vh;background:#151812;color:#eee;border:1px solid #4b5242;border-radius:14px;padding:0}"+
".od-note-dialog::backdrop{background:#050605d9;backdrop-filter:blur(6px)}.od-note-head{display:flex;align-items:center;gap:8px;padding:12px;border-bottom:1px solid #373d32}"+
".od-note-head h2{margin:0;font:700 18px Georgia,serif}.od-note-head .grow{flex:1}.od-note-body{padding:12px;overflow:auto;max-height:70vh}.od-note-list{display:grid;gap:8px}"+
".od-note-row{border:1px solid #3c4235;border-radius:10px;padding:9px;background:#1d211a}.od-note-row-head{display:flex;gap:8px;align-items:center}.od-note-row-head strong{font:700 13px Georgia,serif}.od-note-row-head .grow{flex:1}"+
".od-note-row pre{white-space:pre-wrap;word-break:break-word;margin:7px 0 0;color:#d8d7cc;font:10px/1.45 ui-monospace,monospace}.od-note-compose-context{font-size:10px;color:#b7bba9;margin-bottom:8px}"+
".od-note-compose textarea{width:100%;min-height:130px;resize:vertical;background:#0f110e;border:1px solid #454b3e;border-radius:8px;color:#f0eee4;padding:10px;font-size:14px;line-height:1.45}"+
".od-note-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:8px}.od-note-sync-state{font-size:9px;color:#989d8c;margin-top:6px}"+
"@media(max-width:760px){.od-note-dialog{width:100vw;max-width:none;height:92vh;max-height:92vh;border-radius:16px 16px 0 0;margin:auto 0 0}.od-note-dialog[open]{position:fixed;inset:auto 0 0}.od-note-body{max-height:78vh}.od-note-compose textarea{font-size:16px}}"+
"@media print{.od-note-dialog,.od-note-section,#odNoteQuick,#odNotesQueue{display:none!important}}";
  document.head.appendChild(s);
}
function setBusy(button,busy,label){
  if(!button)return;button.disabled=!!busy;
  if(label!=null){if(!button.dataset.idle)button.dataset.idle=button.textContent;button.textContent=busy?label:button.dataset.idle}
}
function renderCurrent(){
  const host=document.getElementById("odNoteCurrent");if(!host)return;
  const r=noteFor(selected),has=!!(r&&norm(r.note)),open=has&&r.status==="OPEN";
  host.innerHTML=(has?'<div class="od-note-status"><span class="od-note-pill '+(open?"open":"resolved")+'">'+(open?"OPEN":"RESOLVED")+'</span><span>'+(r.updated?esc(r.updated):"")+'</span></div><div class="od-note-history">'+esc(r.note)+'</div>':'<div class="od-note-empty">No stored review note for this card.</div>') + (!loaded?'<div class="od-note-sync-state">Showing the last local cache. Use Sync notes to read the live 14A2 note columns.</div>':"");
  const resolve=document.getElementById("odResolveNote");if(resolve)resolve.disabled=!has||!open;
}
function updateRows(){
  document.querySelectorAll(".card-row[data-n]").forEach(row=>{
    const n=Number(row.dataset.n),r=noteFor(n),open=!!(r&&r.status==="OPEN"&&norm(r.note));
    row.classList.toggle("has-studio-note",open);
    const dots=row.querySelector(".dots");if(!dots)return;
    let dot=dots.querySelector(".dot.note");
    if(open&&!dot){dot=document.createElement("span");dot.className="dot note";dot.title="open Studio note";dots.appendChild(dot)}
    else if(!open&&dot)dot.remove();
  });
}
function paintTop(){
  const n=openCount(),b=document.getElementById("odNotesQueue"),s=document.getElementById("odNotesTop");
  if(b)b.textContent="Notes · "+n;if(s)s.textContent=n+" open Studio note"+(n===1?"":"s");
}
function queueHTML(){
  const rows=Object.entries(records).filter(pair=>pair[1]&&pair[1].status==="OPEN"&&norm(pair[1].note)).sort((a,b)=>Number(a[0])-Number(b[0]));
  if(!rows.length)return '<div class="od-note-empty">No open Studio notes.</div>';
  return '<div class="od-note-list">'+rows.map(pair=>{
    const n=pair[0],r=pair[1];
    return '<div class="od-note-row"><div class="od-note-row-head"><strong>'+String(n).padStart(3,"0")+' · '+esc(cardName(+n))+'</strong><div class="grow"></div><button class="btn secondary small" data-note-open-card="'+n+'">Open card</button></div><pre>'+esc(r.note)+'</pre></div>';
  }).join("")+'</div>';
}
function renderQueue(){
  if(!queueDialog)return;const body=queueDialog.querySelector("[data-note-list]");if(body)body.innerHTML=queueHTML();
  queueDialog.querySelectorAll("[data-note-open-card]").forEach(b=>b.onclick=()=>{queueDialog.close();selectCard(+b.dataset.noteOpenCard)});
}
function paintAll(){renderCurrent();updateRows();paintTop();renderQueue()}
function message(text){if(root.toast)root.toast(text)}
async function syncFromSheet(button){
  setBusy(button,true,"Syncing…");
  try{await refresh();message("Studio notes synced from 14A2")}
  catch(error){message("Notes sync failed: "+(error.message||error))}
  finally{setBusy(button,false)}
}
async function saveSectionNote(){
  const input=document.getElementById("odNoteInput"),b=document.getElementById("odSaveNote");if(!input)return;
  const text=norm(input.value);if(!text)return message("Write a note first");
  setBusy(b,true,"Saving…");
  try{await addNote(selected,text,"");input.value="";message("Note saved to 14A2")}
  catch(error){message("Note not saved: "+(error.message||error))}
  finally{setBusy(b,false)}
}
async function resolveCurrent(){
  const b=document.getElementById("odResolveNote");setBusy(b,true,"Resolving…");
  try{await resolveNote(selected);message("Card note marked resolved")}
  catch(error){message("Could not resolve note: "+(error.message||error))}
  finally{setBusy(b,false)}
}
function openQueue(){
  if(!queueDialog)return;queueDialog.showModal();renderQueue();
  const refreshButton=queueDialog.querySelector("[data-note-refresh]");
  syncFromSheet(refreshButton);
}
function openComposer(context){
  activeContext=norm(context);
  if(!composeDialog)return;
  composeDialog.querySelector("[data-compose-title]").textContent=String(selected).padStart(3,"0")+" · "+cardName(selected);
  const c=composeDialog.querySelector("[data-compose-context]");c.textContent=activeContext||"General card note";
  const ta=composeDialog.querySelector("textarea");ta.value="";composeDialog.showModal();requestAnimationFrame(()=>ta.focus());
}
async function saveComposer(){
  const ta=composeDialog.querySelector("textarea"),b=composeDialog.querySelector("[data-compose-save]"),text=norm(ta.value);
  if(!text)return message("Write a note first");
  setBusy(b,true,"Saving…");
  try{await addNote(selected,text,activeContext);composeDialog.close();message("Note saved to 14A2")}
  catch(error){message("Note not saved: "+(error.message||error))}
  finally{setBusy(b,false)}
}
function mount(){
  if(root.OdysseyReviewNotesMounted||typeof document==="undefined"||typeof model!=="function")return;
  root.OdysseyReviewNotesMounted=true;style();loadCache();

  const top=document.querySelector(".top-actions")||document.querySelector(".topbar");
  if(top){const q=document.createElement("button");q.type="button";q.className="btn secondary";q.id="odNotesQueue";q.onclick=openQueue;top.appendChild(q)}
  const stats=document.querySelector(".topstats");if(stats){const s=document.createElement("span");s.id="odNotesTop";stats.appendChild(s)}
  const toolbar=document.querySelector(".preview-toolbar");if(toolbar){const b=document.createElement("button");b.type="button";b.className="btn secondary small";b.id="odNoteQuick";b.textContent="Add note";b.onclick=()=>openComposer("");const spacer=toolbar.querySelector(".spacer");toolbar.insertBefore(b,spacer||null)}

  const pane=document.getElementById("pane-card");
  if(pane){
    const section=document.createElement("div");section.className="section od-note-section";
    section.innerHTML='<h3>Studio review notes</h3><div id="odNoteCurrent"></div><textarea id="odNoteInput" maxlength="4000" placeholder="Leave a note for the next design pass…"></textarea><div class="od-note-actions"><button class="btn small" id="odSaveNote">Save note</button><button class="btn secondary small" id="odResolveNote">Resolve</button><button class="btn secondary small" id="odSyncNotes">Sync notes</button></div><div class="od-note-sync-state">Notes are stored in columns AK–AM of the 14A2 Card File, separate from card-design edits.</div>';
    pane.appendChild(section);
    document.getElementById("odSaveNote").onclick=saveSectionNote;
    document.getElementById("odResolveNote").onclick=resolveCurrent;
    document.getElementById("odSyncNotes").onclick=e=>syncFromSheet(e.currentTarget);
  }

  queueDialog=document.createElement("dialog");queueDialog.className="od-note-dialog";
  queueDialog.innerHTML='<div class="od-note-head"><h2>Open Studio notes</h2><div class="grow"></div><button class="btn secondary small" data-note-refresh>Sync notes</button><button class="btn secondary small" data-note-close>Close</button></div><div class="od-note-body" data-note-list></div>';
  document.body.appendChild(queueDialog);
  queueDialog.querySelector("[data-note-close]").onclick=()=>queueDialog.close();
  queueDialog.querySelector("[data-note-refresh]").onclick=e=>syncFromSheet(e.currentTarget);

  composeDialog=document.createElement("dialog");composeDialog.className="od-note-dialog od-note-compose";
  composeDialog.innerHTML='<div class="od-note-head"><h2 data-compose-title>Add note</h2><div class="grow"></div><button class="btn secondary small" data-compose-close>Close</button></div><div class="od-note-body"><div class="od-note-compose-context" data-compose-context></div><textarea maxlength="4000" placeholder="What should change, be checked, or be reconsidered?"></textarea><div class="od-note-actions"><button class="btn" data-compose-save>Save note</button></div></div>';
  document.body.appendChild(composeDialog);
  composeDialog.querySelector("[data-compose-close]").onclick=()=>composeDialog.close();
  composeDialog.querySelector("[data-compose-save]").onclick=saveComposer;

  const oldPreview=root.renderPreview;root.renderPreview=function(){const x=oldPreview.apply(this,arguments);renderCurrent();updateRows();paintTop();return x};
  const oldList=root.renderList;root.renderList=function(){const x=oldList.apply(this,arguments);updateRows();return x};
  paintAll();
}
const api={VERSION,NOTE_COL,STATUS_COL,UPDATED_COL,appendEntry,openCount:()=>openCount(),noteFor,refresh,addNote,resolveNote,openQueue,compose:openComposer,mount};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
root.OdysseyReviewNotes=api;
if(typeof document!=="undefined"){if(document.readyState==="complete")setTimeout(mount,0);else root.addEventListener("load",()=>setTimeout(mount,0),{once:true})}
})(typeof window!=="undefined"?window:globalThis);
