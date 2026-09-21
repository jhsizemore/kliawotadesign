(function(root){
"use strict";
const VERSION="2.1";
const API="/mtgtools/odyssey/api/review-notes";
const CACHE_PREFIX="odyssey-studio-notes-v2";
let records={},loaded=false,queueDialog=null,composeDialog=null,activeContext="";

function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function norm(s){return String(s==null?"":s).replace(/\r\n?/g,"\n").trim()}
function datasetTag(){try{return String(ODYSSEY_DATASET&&ODYSSEY_DATASET.datasetVersion||"active")}catch(_){return"active"}}
function cacheKey(){return CACHE_PREFIX+"::"+datasetTag()}
function saveCache(){try{localStorage.setItem(cacheKey(),JSON.stringify({savedAt:new Date().toISOString(),records}))}catch(_){}}
function loadCache(){try{const x=JSON.parse(localStorage.getItem(cacheKey())||"null");if(x&&x.records&&typeof x.records==="object")records=x.records}catch(_){}}
function clearLegacyPairingHash(){
  try{if(location.hash.startsWith("#odyssey-notes="))history.replaceState(null,"",location.pathname+location.search)}catch(_){}
}
function cardBase(n){try{return baseCard(n)||{}}catch(_){return{}}}
function cardId(n){const b=cardBase(n);return String(b.id||("ODY-"+String(n).padStart(3,"0")))}
function cardName(n){try{return model(n).displayName||cardBase(n).name||("Card "+n)}catch(_){return cardBase(n).name||("Card "+n)}}
function openCount(){return Object.values(records).filter(r=>r&&r.status==="OPEN"&&Array.isArray(r.entries)&&r.entries.length).length}
function noteFor(n){return records[n]||null}
function noteText(r){
  if(!r||!Array.isArray(r.entries))return"";
  return r.entries.map(e=>[norm(e.at),[norm(e.context),norm(e.text)].filter(Boolean).join(" — ")].filter(Boolean).join(" — ")).join("\n");
}
function appendEntry(existing,text,context,when){
  const stamp=(when||new Date()).toISOString();
  const body=[norm(context),norm(text)].filter(Boolean).join(" — ");
  if(!body)return norm(existing);
  return [norm(existing),stamp+" — "+body].filter(Boolean).join("\n");
}
async function request(method,body){
  const headers=body?{"Content-Type":"application/json"}:{};
  const response=await fetch(API,{method:method||"GET",cache:"no-store",credentials:"same-origin",referrerPolicy:"no-referrer",headers,body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(16000)});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw Error(data.error||("Notes service returned HTTP "+response.status+"."));
  if(data.schema!=="odyssey-review-notes/v1")throw Error("Unexpected notes response.");
  return data;
}
function normalizeRecord(r){
  return {
    datasetVersion:norm(r.datasetVersion),
    cardId:norm(r.cardId),
    number:Number(r.number)||0,
    name:norm(r.name),
    status:r.status==="RESOLVED"?"RESOLVED":"OPEN",
    entries:Array.isArray(r.entries)?r.entries.map(e=>({at:norm(e.at),text:norm(e.text),context:norm(e.context)})).filter(e=>e.text):[],
    createdAt:norm(r.createdAt),
    updatedAt:norm(r.updatedAt)
  };
}
async function refresh(){
  const data=await request("GET");
  const tag=datasetTag(),next={};
  (data.notes||[]).forEach(raw=>{
    const r=normalizeRecord(raw);
    if(r.datasetVersion!==tag||!r.number)return;
    next[r.number]=r;
  });
  records=next;loaded=true;saveCache();paintAll();return records;
}
function actionBase(n){
  return {datasetVersion:datasetTag(),cardId:cardId(n),number:Number(n),name:cardName(n)};
}
async function addNote(n,text,context){
  text=norm(text);context=norm(context);
  if(!text)throw Error("Write a note first.");
  const data=await request("POST",Object.assign(actionBase(n),{action:"append",text,context}));
  records[n]=normalizeRecord(data.note);loaded=true;saveCache();paintAll();return records[n];
}
async function resolveNote(n){
  const r=records[n]||await (async()=>{await refresh();return records[n]})();
  if(!r||!r.entries.length)throw Error("This card has no note to resolve.");
  const data=await request("POST",Object.assign(actionBase(n),{action:"status",status:"RESOLVED"}));
  records[n]=normalizeRecord(data.note);loaded=true;saveCache();paintAll();return records[n];
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
  const r=noteFor(selected),has=!!(r&&r.entries&&r.entries.length),open=has&&r.status==="OPEN";
  host.innerHTML=(has?'<div class="od-note-status"><span class="od-note-pill '+(open?"open":"resolved")+'">'+(open?"OPEN":"RESOLVED")+'</span><span>'+(r.updatedAt?esc(r.updatedAt):"")+'</span></div><div class="od-note-history">'+esc(noteText(r))+'</div>':'<div class="od-note-empty">No stored review note for this card.</div>') + (!loaded?'<div class="od-note-sync-state">Showing the last browser cache while the site note queue loads.</div>':"");
  const resolve=document.getElementById("odResolveNote");if(resolve)resolve.disabled=!has||!open;
}
function updateRows(){
  document.querySelectorAll(".card-row[data-n]").forEach(row=>{
    const n=Number(row.dataset.n),r=noteFor(n),open=!!(r&&r.status==="OPEN"&&r.entries&&r.entries.length);
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
  const rows=Object.entries(records).filter(pair=>pair[1]&&pair[1].status==="OPEN"&&pair[1].entries&&pair[1].entries.length).sort((a,b)=>Number(a[0])-Number(b[0]));
  if(!rows.length)return '<div class="od-note-empty">No open Studio notes.</div>';
  return '<div class="od-note-list">'+rows.map(pair=>{
    const n=pair[0],r=pair[1];
    return '<div class="od-note-row"><div class="od-note-row-head"><strong>'+String(n).padStart(3,"0")+' · '+esc(cardName(+n))+'</strong><div class="grow"></div><button class="btn secondary small" data-note-open-card="'+n+'">Open card</button></div><pre>'+esc(noteText(r))+'</pre></div>';
  }).join("")+'</div>';
}
function renderQueue(){
  if(!queueDialog)return;const body=queueDialog.querySelector("[data-note-list]");if(body)body.innerHTML=queueHTML();
  queueDialog.querySelectorAll("[data-note-open-card]").forEach(b=>b.onclick=()=>{queueDialog.close();selectCard(+b.dataset.noteOpenCard)});
}
function paintAll(){renderCurrent();updateRows();paintTop();renderQueue()}
function message(text){
  const status=document.getElementById("odNoteSaveStatus");
  if(status)status.textContent=text;
  if(root.toast)root.toast(text);
}
async function refreshNotes(button){
  setBusy(button,true,"Refreshing…");
  try{await refresh();message("Studio notes refreshed")}
  catch(error){message("Notes refresh failed: "+(error.message||error))}
  finally{setBusy(button,false)}
}
async function saveSectionNote(){
  const input=document.getElementById("odNoteInput"),b=document.getElementById("odSaveNote");if(!input)return;
  const text=norm(input.value);if(!text)return message("Write a note first");
  setBusy(b,true,"Saving…");
  try{await addNote(selected,text,"");input.value="";message("Saved ✓ This note is now in the shared Odyssey queue.")}
  catch(error){message("Save failed: "+(error.message||error))}
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
  refreshNotes(queueDialog.querySelector("[data-note-refresh]"));
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
  try{await addNote(selected,text,activeContext);composeDialog.close();message("Note saved on Odyssey Studio")}
  catch(error){message("Note not saved: "+(error.message||error))}
  finally{setBusy(b,false)}
}
function mount(){
  if(root.OdysseyReviewNotesMounted||typeof document==="undefined"||typeof model!=="function")return;
  root.OdysseyReviewNotesMounted=true;style();clearLegacyPairingHash();loadCache();

  const top=document.querySelector(".top-actions")||document.querySelector(".topbar");
  if(top){const q=document.createElement("button");q.type="button";q.className="btn secondary";q.id="odNotesQueue";q.onclick=openQueue;top.appendChild(q)}
  const stats=document.querySelector(".topstats");if(stats){const s=document.createElement("span");s.id="odNotesTop";stats.appendChild(s)}
  const toolbar=document.querySelector(".preview-toolbar");if(toolbar){const b=document.createElement("button");b.type="button";b.className="btn secondary small";b.id="odNoteQuick";b.textContent="Add note";b.onclick=()=>openComposer("");const spacer=toolbar.querySelector(".spacer");toolbar.insertBefore(b,spacer||null)}

  const pane=document.getElementById("pane-card");
  if(pane){
    const section=document.createElement("div");section.className="section od-note-section";
    section.innerHTML='<h3>Studio review notes</h3><div id="odNoteCurrent"></div><textarea id="odNoteInput" maxlength="4000" placeholder="Leave a note for the next design pass…"></textarea><div class="od-note-actions"><button class="btn small" id="odSaveNote">Save note</button><button class="btn secondary small" id="odResolveNote">Resolve</button><button class="btn secondary small" id="odRefreshNotes">Refresh</button></div><div id="odNoteSaveStatus" class="od-note-sync-state">Type a note and press Save note. It is stored on Odyssey Studio immediately — no Google login, OAuth ID, or pairing step.</div>';
    pane.appendChild(section);
    document.getElementById("odSaveNote").onclick=saveSectionNote;
    document.getElementById("odResolveNote").onclick=resolveCurrent;
    document.getElementById("odRefreshNotes").onclick=e=>refreshNotes(e.currentTarget);
  }

  queueDialog=document.createElement("dialog");queueDialog.className="od-note-dialog";
  queueDialog.innerHTML='<div class="od-note-head"><h2>Open Studio notes</h2><div class="grow"></div><button class="btn secondary small" data-note-refresh>Refresh</button><button class="btn secondary small" data-note-close>Close</button></div><div class="od-note-body"><div class="od-note-sync-state">Shared project queue. Notes saved from phone or desktop appear here automatically.</div><div data-note-list></div></div>';
  document.body.appendChild(queueDialog);
  queueDialog.querySelector("[data-note-close]").onclick=()=>queueDialog.close();
  queueDialog.querySelector("[data-note-refresh]").onclick=e=>refreshNotes(e.currentTarget);

  composeDialog=document.createElement("dialog");composeDialog.className="od-note-dialog od-note-compose";
  composeDialog.innerHTML='<div class="od-note-head"><h2 data-compose-title>Add note</h2><div class="grow"></div><button class="btn secondary small" data-compose-close>Close</button></div><div class="od-note-body"><div class="od-note-compose-context" data-compose-context></div><textarea maxlength="4000" placeholder="What should change, be checked, or be reconsidered?"></textarea><div class="od-note-actions"><button class="btn" data-compose-save>Save note</button></div></div>';
  document.body.appendChild(composeDialog);
  composeDialog.querySelector("[data-compose-close]").onclick=()=>composeDialog.close();
  composeDialog.querySelector("[data-compose-save]").onclick=saveComposer;

  const oldPreview=root.renderPreview;root.renderPreview=function(){const x=oldPreview.apply(this,arguments);renderCurrent();updateRows();paintTop();return x};
  const oldList=root.renderList;root.renderList=function(){const x=oldList.apply(this,arguments);updateRows();return x};
  paintAll();
  refresh().catch(()=>{});
  root.addEventListener("focus",()=>refresh().catch(()=>{}));
}
const apiObject={VERSION,API,appendEntry,openCount:()=>openCount(),noteFor,refresh,addNote,resolveNote,openQueue,compose:openComposer,clearLegacyPairingHash,mount};
if(typeof module!=="undefined"&&module.exports)module.exports=apiObject;
root.OdysseyReviewNotes=apiObject;
if(typeof document!=="undefined"){if(document.readyState==="complete")setTimeout(mount,0);else root.addEventListener("load",()=>setTimeout(mount,0),{once:true})}
})(typeof window!=="undefined"?window:globalThis);
