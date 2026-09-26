(function(root){
'use strict';

const VERSION='1.0';
const API='/mtgtools/odyssey/api/finishing';
const SCHEMA='odyssey-finishing-queue/v1';
const STORAGE_PREFIX='odyssey-finishing-local-v1';
const PREFS_KEY='odyssey-finishing-prefs-v1';
const ART_STATES=['REVIEWING','LOCKED','NEEDS_ART'];
const CONFIDENCE_LABELS=['Recast','Redesign','Rework','Close / iterate','Soft details','Locked'];
const SORT_OPTIONS=[
  ['number','Number'],['confidence-low','Confidence · low first'],['confidence-high','Confidence · high first'],
  ['cycle','Cycle'],['suite','Suite / program'],['color','Color'],['rarity','Rarity'],['mv','Mana value'],
  ['layout','Layout'],['art-state','Artwork state'],['changed-first','Changed first'],['name','Name'],['status','Card status']
];
const QUICK_FIELDS={
  displayName:{label:'Card name',selector:'.name',kind:'input'},
  mana:{label:'Mana cost',selector:'.mana',kind:'input'},
  type:{label:'Type line',selector:'.type-text',kind:'input'},
  rules:{label:'Rules text',selector:'.rules',kind:'textarea'},
  flavor:{label:'Flavor text',selector:'.flavor',kind:'textarea'},
  pt:{label:'Power / toughness / defense',selector:'.pt',kind:'input'}
};

let state={cards:{}};
let prefs={enabled:true,sort:'number',confidenceFilter:'',cycleFilter:'',suiteFilter:''};
let shared=new Map();
let syncTimers=new Map();
let quickDialog=null,artDialog=null,queueDialog=null,dock=null;
let mounted=false,loadingShared=false,lastSyncMessage='';
let lastOverrideSig=new Map(),lastArtSig=new Map();

function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function datasetVersion(){return String(root.ODYSSEY_DATASET?.datasetVersion||'unversioned')}
function storageKey(){return STORAGE_PREFIX+':'+datasetVersion()}
function baseId(n){const b=baseCard(Number(n))||{};return String(b.id||b.cardId||('ODY-'+String(n).padStart(3,'0')))}
function cardName(n){const m=model(Number(n));return String(m?.displayName||m?.name||('Card '+n))}
function clone(value){return value==null?value:JSON.parse(JSON.stringify(value))}
function cleanObject(value){return value&&typeof value==='object'&&!Array.isArray(value)?value:{}}

function loadLocal(){
  try{state=Object.assign({cards:{}},JSON.parse(localStorage.getItem(storageKey())||'{}'));state.cards=cleanObject(state.cards)}catch(_){state={cards:{}}}
  try{prefs=Object.assign({enabled:true,sort:'number',confidenceFilter:'',cycleFilter:'',suiteFilter:''},JSON.parse(localStorage.getItem(PREFS_KEY)||'{}'))}catch(_){prefs={enabled:true,sort:'number',confidenceFilter:'',cycleFilter:'',suiteFilter:''}}
}
function saveLocal(){
  try{localStorage.setItem(storageKey(),JSON.stringify(state));localStorage.setItem(PREFS_KEY,JSON.stringify(prefs))}catch(_){}
}
function localCard(n){
  n=Number(n);if(!state.cards[n])state.cards[n]={artState:defaultArtState(n),updatedAt:new Date().toISOString()};
  return state.cards[n];
}
function defaultArtState(n){const m=model(Number(n));return m&&(!m.artId&&!m.imageUrl)?'NEEDS_ART':'REVIEWING'}
function artState(n){const s=state.cards[Number(n)]?.artState;return ART_STATES.includes(s)?s:defaultArtState(n)}
function setArtState(n,value,{sync=true}={}){
  n=Number(n);if(!ART_STATES.includes(value))value='REVIEWING';
  const c=localCard(n);c.artState=value;c.updatedAt=new Date().toISOString();saveLocal();
  paint();if(sync)scheduleSync(n,true);
}
function suggestedConfidence(n){
  const m=model(Number(n))||{},text=[m.designDisposition,m.changeStatus,m.status].filter(Boolean).join(' ').toUpperCase();
  if(/\b(RECAST|CUT)\b/.test(text))return 0;
  if(/\bREDESIGN\b/.test(text)||m.status==='PROTOTYPE')return 1;
  if(/\b(REWORK|MAJOR)\b/.test(text)||m.status==='REVISE'||m.storyRethemeRequired)return 2;
  if(m.status==='REPRINT TEST')return 3;
  if(m.status==='KEEP')return 4;
  return 3;
}
function confidenceExplicit(n){return Number.isInteger(state.cards[Number(n)]?.confidence)}
function confidence(n){const v=state.cards[Number(n)]?.confidence;return Number.isInteger(v)&&v>=0&&v<=5?v:suggestedConfidence(n)}
function confidenceLabel(v){v=Math.max(0,Math.min(5,Number(v)||0));return CONFIDENCE_LABELS[v]}
function setConfidence(n,value){
  n=Number(n);value=Math.max(0,Math.min(5,Number(value)));
  const c=localCard(n);c.confidence=value;c.updatedAt=new Date().toISOString();saveLocal();
  scheduleSync(n,true);renderList();paint();toast(value+' · '+confidenceLabel(value));
}
function listValues(value){return Array.isArray(value)?value.filter(Boolean).map(String):String(value||'').split(/[;,]/).map(x=>x.trim()).filter(Boolean)}
function cycleValues(n){return listValues(model(Number(n))?.cycleIds)}
function cycleKey(n){return cycleValues(n)[0]||''}
function suiteKey(n){
  const m=model(Number(n))||{},show=listValues(m.showcase);
  return show[0]||String(m.productLayer||'').trim()||String(m.signpostPair||'').trim()||listValues(m.archetypes)[0]||'';
}

function changeKeys(n){return Object.keys(cleanObject(overrides[Number(n)]))}
function artSnapshot(n){
  const m=model(Number(n));
  return {
    artId:String(m.artId||''),imageUrl:String(m.imageUrl||''),credit:String(m.credit||''),source:String(m.source||''),
    fit:String(m.fit||'cover'),zoom:Number(m.zoom)||1,focusX:Number(m.focusX)||0,focusY:Number(m.focusY)||0,
    layout:String(m.layout||'standard'),artHeight:String(m.artHeight||'normal'),frameStyle:String(m.frameStyle||'standard')
  };
}
function overrideSignature(n){return JSON.stringify(cleanObject(overrides[Number(n)]))}
function artSignature(n){return JSON.stringify(artSnapshot(Number(n)))}
function seedSignatures(){CARDS.forEach(c=>{const n=Number(c.number);lastOverrideSig.set(n,overrideSignature(n));lastArtSig.set(n,artSignature(n))})}
function observeCardChange(n){
  n=Number(n);const nextOverride=overrideSignature(n),nextArt=artSignature(n),prevOverride=lastOverrideSig.get(n),prevArt=lastArtSig.get(n);
  if(prevOverride===undefined||prevArt===undefined){lastOverrideSig.set(n,nextOverride);lastArtSig.set(n,nextArt);return}
  if(prevOverride===nextOverride&&prevArt===nextArt)return;
  if(prevArt!==nextArt&&artState(n)==='LOCKED'){const c=localCard(n);c.artState='REVIEWING';c.updatedAt=new Date().toISOString();saveLocal()}
  lastOverrideSig.set(n,nextOverride);lastArtSig.set(n,nextArt);if(prefs.enabled)scheduleSync(n)
}
function actionable(n){return changeKeys(n).length>0||artState(n)!=='REVIEWING'||confidenceExplicit(n)}
function recordFor(n){
  n=Number(n);return {
    schema:SCHEMA,datasetVersion:datasetVersion(),cardId:baseId(n),number:n,name:cardName(n),
    artState:artState(n),confidence:confidence(n),confidenceExplicit:confidenceExplicit(n),workState:confidenceLabel(confidence(n)),
    cycle:cycleKey(n),suite:suiteKey(n),changes:clone(cleanObject(overrides[n])),art:artSnapshot(n),
    updatedAt:new Date().toISOString()
  };
}
function pendingNumbers(){
  return CARDS.map(c=>Number(c.number)).filter(n=>actionable(n));
}
function statusCounts(){
  let locked=0,needed=0,changed=0,recast=0,redesign=0,confidenceLocked=0;
  CARDS.forEach(c=>{const n=Number(c.number),s=artState(n),cf=confidence(n);if(s==='LOCKED')locked++;else if(s==='NEEDS_ART')needed++;if(changeKeys(n).length)changed++;if(confidenceExplicit(n)){if(cf===0)recast++;if(cf===1)redesign++;if(cf===5)confidenceLocked++}});
  return{locked,needed,changed,recast,redesign,confidenceLocked,pending:pendingNumbers().length};
}

async function request(method,body){
  const headers={'Accept':'application/json'};if(body)headers['Content-Type']='application/json';
  const response=await fetch(API,{method:method||'GET',cache:'no-store',credentials:'same-origin',referrerPolicy:'no-referrer',headers,body:body?JSON.stringify(body):undefined,signal:(AbortSignal.timeout?AbortSignal.timeout(9000):undefined)});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw Error(data.error||('Finishing queue returned HTTP '+response.status+'.'));
  if(data.schema!==SCHEMA)throw Error('Unexpected finishing-queue response.');
  return data;
}
function mergeRemoteIntoEmptyLocal(record){
  const n=Number(record.number);if(!cardByNum[n]||record.datasetVersion!==datasetVersion())return;
  const remoteChanges=cleanObject(record.changes),localChanges=cleanObject(overrides[n]);
  if(!Object.keys(localChanges).length&&Object.keys(remoteChanges).length){
    const m=model(n);Object.assign(m,clone(remoteChanges));diffOverride(n,m);
  }
  if(!state.cards[n]&&ART_STATES.includes(record.artState))state.cards[n]={artState:record.artState,updatedAt:record.updatedAt||new Date().toISOString()};
  if(record.confidenceExplicit===true&&!confidenceExplicit(n)){
    const c=localCard(n),v=Number(record.confidence);if(Number.isInteger(v)&&v>=0&&v<=5)c.confidence=v;
  }
}
async function refreshShared({apply=true,quiet=false}={}){
  if(loadingShared)return;loadingShared=true;paintSync('Loading shared finishing queue…','loading');
  try{
    const data=await request('GET');shared=new Map();
    (data.records||[]).forEach(r=>{if(r&&r.datasetVersion===datasetVersion()){shared.set(Number(r.number),r);if(apply)mergeRemoteIntoEmptyLocal(r)}});
    saveLocal();if(apply){seedSignatures();renderPreview();renderList()}
    paint();paintSync('Shared finishing queue connected','ok');
    if(!quiet)toast('Finishing queue refreshed');
  }catch(error){paintSync('Working locally — shared queue unavailable: '+(error.message||error),'error');if(!quiet)toast('Finishing queue is offline; local edits are safe')}
  finally{loadingShared=false}
}
function scheduleSync(n,immediate=false){
  n=Number(n);clearTimeout(syncTimers.get(n));syncTimers.set(n,setTimeout(()=>syncCard(n),immediate?20:800));
  paintSync('Saving finishing changes…','loading');
}
async function syncCard(n){
  syncTimers.delete(n);n=Number(n);
  try{
    let data;
    if(actionable(n))data=await request('POST',{action:'upsert',record:recordFor(n)});
    else data=await request('POST',{action:'delete',record:{datasetVersion:datasetVersion(),cardId:baseId(n),number:n,name:cardName(n)}});
    if(data.record)shared.set(n,data.record);else shared.delete(n);
    paint();paintSync('Saved to shared finishing queue','ok');
  }catch(error){paintSync('Saved locally; shared sync failed: '+(error.message||error),'error')}
}
function syncAll(){pendingNumbers().forEach(n=>scheduleSync(n,true))}

function applyField(n,key,value){
  n=Number(n);const m=model(n);m[key]=value;diffOverride(n,m);localCard(n).updatedAt=new Date().toISOString();saveLocal();
  renderPreview();renderList();scheduleSync(n);paint();
}
function resetField(n,key){
  n=Number(n);const current=cleanObject(overrides[n]);if(!Object.prototype.hasOwnProperty.call(current,key))return;
  const m=model(n);const d=defaultsFor(n);m[key]=d[key];diffOverride(n,m);renderPreview();renderList();scheduleSync(n);paint();
}

function injectStyle(){
  if(document.getElementById('od-finishing-style'))return;
  const s=document.createElement('style');s.id='od-finishing-style';s.textContent=`
  #odFinishMode.active{background:#d2b66f;color:#211b11;border-color:#d2b66f}
  #odFinishDock{width:min(100%,720px);display:none;margin:0 0 12px;border:1px solid #4a513f;background:#171a14;border-radius:12px;padding:10px;color:#e8e7de;box-shadow:0 12px 28px #0005}
  body.od-finish-on #odFinishDock{display:block}
  .od-fin-row{display:flex;gap:7px;align-items:center;flex-wrap:wrap}.od-fin-row+.od-fin-row{margin-top:8px}.od-fin-grow{flex:1}.od-fin-title{font:800 11px/1.2 system-ui,sans-serif;letter-spacing:.04em;text-transform:uppercase;color:#d8c485}.od-fin-help{font:10px/1.4 system-ui,sans-serif;color:#9ea493}
  .od-fin-chip{appearance:none;border:1px solid #4a513f;background:#24291f;color:#dfe1d6;border-radius:999px;padding:5px 8px;font:800 9px/1 system-ui,sans-serif;cursor:pointer}.od-fin-chip:hover{border-color:#8c957c}.od-fin-chip.active{background:#d2b66f;color:#211b11;border-color:#d2b66f}.od-fin-chip.need.active{background:#7e4934;color:#fff1e8;border-color:#a86a4c}.od-fin-chip.lock.active{background:#385631;color:#e9f5dc;border-color:#66845a}.od-fin-chip.confidence{min-width:58px}.od-fin-chip.c0.active,.od-confidence-badge.c0{background:#7b3028;color:#ffe8e1;border-color:#a75245}.od-fin-chip.c1.active,.od-confidence-badge.c1{background:#8a4a2e;color:#ffeadc;border-color:#ad6847}.od-fin-chip.c2.active,.od-confidence-badge.c2{background:#765b2d;color:#fff0bf;border-color:#9a7b42}.od-fin-chip.c3.active,.od-confidence-badge.c3{background:#545d3c;color:#eef3d5;border-color:#707d50}.od-fin-chip.c4.active,.od-confidence-badge.c4{background:#38565a;color:#e1f1f3;border-color:#557d82}.od-fin-chip.c5.active,.od-confidence-badge.c5{background:#385631;color:#e9f5dc;border-color:#66845a}
  .od-fin-sync{font:10px/1.3 system-ui,sans-serif;color:#aeb3a0}.od-fin-sync[data-state=ok]{color:#b9d79d}.od-fin-sync[data-state=error]{color:#f0b0a6}.od-fin-sync[data-state=loading]{color:#dbc98c}
  body.od-finish-on #previewShell .name,body.od-finish-on #previewShell .mana,body.od-finish-on #previewShell .type-text,body.od-finish-on #previewShell .rules,body.od-finish-on #previewShell .pt{cursor:text}
  body.od-finish-on #previewShell .name:hover,body.od-finish-on #previewShell .mana:hover,body.od-finish-on #previewShell .type-text:hover,body.od-finish-on #previewShell .rules:hover,body.od-finish-on #previewShell .pt:hover{outline:1px dashed #e3ca80;outline-offset:2px}
  body.od-finish-on #openSheetPush{display:none!important}
  .od-fin-dialog{width:min(720px,94vw);max-height:90vh;background:#151812;color:#eee;border:1px solid #4b5242;border-radius:14px;padding:0}.od-fin-dialog::backdrop{background:#050605d9;backdrop-filter:blur(6px)}.od-fin-head{display:flex;gap:8px;align-items:center;padding:12px;border-bottom:1px solid #373d32}.od-fin-head h2{margin:0;font:700 18px Georgia}.od-fin-head .grow{flex:1}.od-fin-body{padding:12px;overflow:auto;max-height:72vh}.od-fin-body label{display:block;font:800 10px/1.4 system-ui,sans-serif;color:#b8bda9;margin:0 0 10px}.od-fin-body input,.od-fin-body textarea,.od-fin-body select{width:100%;margin-top:4px;background:#0f110e;color:#f1efe6;border:1px solid #454b3e;border-radius:8px;padding:9px;font:14px/1.45 system-ui,sans-serif}.od-fin-body textarea{min-height:170px;resize:vertical}.od-fin-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}
  .od-fin-queue{display:grid;gap:8px}.od-fin-card{display:grid;grid-template-columns:52px minmax(0,1fr) auto;gap:8px;align-items:center;border:1px solid #3c4235;border-radius:10px;padding:9px;background:#1d211a}.od-fin-card .num{font:800 11px ui-monospace,monospace;color:#d5c58d}.od-fin-card .meta{font:10px/1.4 system-ui,sans-serif;color:#aeb3a0}.od-fin-card strong{font:700 13px Georgia,serif;color:#eee7d4}.od-fin-badge{display:inline-flex;border:1px solid #56604e;border-radius:999px;padding:3px 6px;font:900 8px/1 system-ui,sans-serif;margin-right:4px}.od-fin-badge.lock{border-color:#66845a;color:#cfe8be}.od-fin-badge.need{border-color:#a86a4c;color:#efb79b}.od-fin-badge.change{border-color:#8e7947;color:#ecd995}
  .dot.finish-lock{background:#78a36d;box-shadow:0 0 0 1px #31452c}.dot.finish-need{background:#d37950;box-shadow:0 0 0 1px #633823}.dot.finish-change{background:#d5b85f;box-shadow:0 0 0 1px #665522}.od-confidence-badge{display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;border:1px solid #5b6253;border-radius:999px;padding:0 4px;font:900 9px/1 ui-monospace,monospace;color:#e7e7df}.od-confidence-badge.inferred{opacity:.62}.od-fin-browser-tools{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:8px}.od-fin-browser-tools select{background:#12140f;border:1px solid #40463a;color:#ddd;border-radius:7px;padding:7px;min-width:0}.od-fin-browser-tools .wide{grid-column:1/-1}
  @media(max-width:760px){#odFinishDock{margin:0 8px 10px;width:calc(100% - 16px)}.od-fin-dialog{width:100vw;max-width:none;height:92vh;max-height:92vh;border-radius:16px 16px 0 0;margin:auto 0 0}.od-fin-dialog[open]{position:fixed;inset:auto 0 0}.od-fin-body{max-height:78vh}.od-fin-body input,.od-fin-body textarea{font-size:16px}.od-fin-card{grid-template-columns:42px minmax(0,1fr)}}
  @media print{#odFinishDock,#odFinishMode,#odFinishQueue,.od-fin-dialog{display:none!important}}
  `;document.head.appendChild(s);
}

function ensureDialogs(){
  if(!quickDialog){
    quickDialog=document.createElement('dialog');quickDialog.className='od-fin-dialog';quickDialog.innerHTML='<div class="od-fin-head"><h2 data-title>Edit card</h2><div class="grow"></div><button class="btn secondary small" data-close>Close</button></div><div class="od-fin-body"><label data-field-label></label><div data-control></div><div class="od-fin-actions"><button class="btn" data-done>Done</button><button class="btn secondary" data-reset>Revert this field</button></div><div class="od-fin-help" style="margin-top:9px">Edits save immediately in Studio and sync to the shared finishing queue. No Google authorization is used.</div></div>';
    document.body.appendChild(quickDialog);quickDialog.querySelector('[data-close]').onclick=()=>quickDialog.close();quickDialog.querySelector('[data-done]').onclick=()=>quickDialog.close();
  }
  if(!artDialog){
    artDialog=document.createElement('dialog');artDialog.className='od-fin-dialog';artDialog.innerHTML='<div class="od-fin-head"><h2>Add external artwork</h2><div class="grow"></div><button class="btn secondary small" data-close>Close</button></div><div class="od-fin-body"><div class="od-fin-help" style="margin-bottom:10px">Use this for artwork you found outside the existing Odyssey catalogue. Paste the direct image plus the source page so it can be catalogued properly during the commit pass.</div><label>Direct image URL<input data-image type="url" placeholder="https://…/image.jpg"></label><label>Source / collection page<input data-source type="url" placeholder="https://…"></label><label>Visible credit<input data-credit placeholder="Artist · institution / collection"></label><div class="od-fin-actions"><button class="btn" data-save>Use this artwork</button><button class="btn secondary" data-library>Choose existing library art</button></div><div class="od-fin-sync" data-status></div></div>';
    document.body.appendChild(artDialog);artDialog.querySelector('[data-close]').onclick=()=>artDialog.close();artDialog.querySelector('[data-library]').onclick=()=>{artDialog.close();openArtOptions(selected)};artDialog.querySelector('[data-save]').onclick=saveExternalArt;
  }
  if(!queueDialog){
    queueDialog=document.createElement('dialog');queueDialog.className='od-fin-dialog';queueDialog.innerHTML='<div class="od-fin-head"><h2>Finishing queue</h2><div class="grow"></div><button class="btn secondary small" data-refresh>Refresh shared</button><button class="btn secondary small" data-close>Close</button></div><div class="od-fin-body"><div data-summary class="od-fin-help" style="margin-bottom:10px"></div><div class="od-fin-queue" data-list></div><div class="od-fin-actions"><button class="btn secondary" data-copy>Copy changeset JSON</button><button class="btn secondary" data-download>Download changeset</button><button class="btn" data-sync>Sync all pending</button></div><div class="od-fin-sync" data-status></div></div>';
    document.body.appendChild(queueDialog);queueDialog.querySelector('[data-close]').onclick=()=>queueDialog.close();queueDialog.querySelector('[data-refresh]').onclick=()=>refreshShared({apply:true,quiet:false});queueDialog.querySelector('[data-sync]').onclick=syncAll;queueDialog.querySelector('[data-copy]').onclick=copyChangeset;queueDialog.querySelector('[data-download]').onclick=downloadChangeset;
  }
}

function openQuickEditor(key){
  if(!QUICK_FIELDS[key])return;ensureDialogs();const spec=QUICK_FIELDS[key],m=model(selected),body=quickDialog.querySelector('[data-control]'),label=quickDialog.querySelector('[data-field-label]');
  quickDialog.querySelector('[data-title]').textContent=String(selected).padStart(3,'0')+' · '+cardName(selected);label.textContent=spec.label;
  const tag=spec.kind==='textarea'?'textarea':'input';body.innerHTML=`<${tag} data-value ${tag==='input'?'type="text"':''}></${tag}>`;const input=body.querySelector('[data-value]');input.value=m[key]??'';
  input.addEventListener('input',()=>applyField(selected,key,input.value));quickDialog.querySelector('[data-reset]').onclick=()=>{resetField(selected,key);input.value=model(selected)[key]??''};
  quickDialog.showModal();setTimeout(()=>{input.focus();if(input.setSelectionRange){const l=input.value.length;input.setSelectionRange(l,l)}},40);
}
function openExternalArt(){ensureDialogs();const m=model(selected);artDialog.querySelector('[data-image]').value=/^EXT-/.test(String(m.artId||''))?String(m.imageUrl||''):'';artDialog.querySelector('[data-source]').value=/^EXT-/.test(String(m.artId||''))?String(m.source||''):'';artDialog.querySelector('[data-credit]').value=/^EXT-/.test(String(m.artId||''))?String(m.credit||''):'';artDialog.querySelector('[data-status]').textContent='';artDialog.showModal()}
function saveExternalArt(){
  const image=artDialog.querySelector('[data-image]').value.trim(),source=artDialog.querySelector('[data-source]').value.trim(),credit=artDialog.querySelector('[data-credit]').value.trim(),status=artDialog.querySelector('[data-status]');
  if(!/^https?:\/\//i.test(image)){status.textContent='Paste a direct http(s) image URL first.';status.dataset.state='error';return}
  if(source&&!/^https?:\/\//i.test(source)){status.textContent='The source page must be an http(s) URL.';status.dataset.state='error';return}
  const m=model(selected);m.artId='EXT-'+String(selected).padStart(3,'0');m.imageUrl=image;m.source=source;m.credit=credit||'Art credit pending';m.fit='cover';m.zoom=1;m.focusX=0;m.focusY=0;diffOverride(selected,m);setArtState(selected,'REVIEWING',{sync:false});renderPreview();renderList();scheduleSync(selected,true);paint();artDialog.close();toast('External artwork staged for this card');
}

function queueRecords(){return pendingNumbers().map(n=>recordFor(n)).sort((a,b)=>a.number-b.number)}
function changeset(){return{schema:'odyssey-finishing-changeset/v1',datasetVersion:datasetVersion(),exportedAt:new Date().toISOString(),records:queueRecords()}}
async function copyChangeset(){const text=JSON.stringify(changeset(),null,2);try{await navigator.clipboard.writeText(text);toast('Finishing changeset copied')}catch(_){toast('Clipboard unavailable')}}
function downloadChangeset(){const text=JSON.stringify(changeset(),null,2),a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'application/json'}));a.download='odyssey-finishing-changeset-'+datasetVersion()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast('Finishing changeset downloaded')}
function openQueue(){ensureDialogs();renderQueue();queueDialog.showModal()}
function renderQueue(){
  if(!queueDialog)return;
  const rows=queueRecords(),c=statusCounts();
  queueDialog.querySelector('[data-summary]').textContent=rows.length+' cards in the finishing queue · '+c.changed+' with Studio edits · '+c.recast+' recast · '+c.redesign+' redesign · '+c.confidenceLocked+' design-locked · '+c.needed+' still need art.';
  const list=queueDialog.querySelector('[data-list]');
  list.innerHTML=rows.length?rows.map(r=>{
    const keys=Object.keys(r.changes||{});
    const badges=[
      '<span class="od-fin-badge">'+r.confidence+' · '+esc(r.workState)+'</span>',
      r.artState==='LOCKED'?'<span class="od-fin-badge lock">ART LOCKED</span>':r.artState==='NEEDS_ART'?'<span class="od-fin-badge need">ART NEEDED</span>':'',
      keys.length?'<span class="od-fin-badge change">'+keys.length+' EDIT'+(keys.length===1?'':'S')+'</span>':''
    ].join('');
    const details=[r.cycle?'cycle '+r.cycle:'',r.suite?'suite '+r.suite:'',keys.join(', ')].filter(Boolean).join(' · ')||'finishing status only';
    return '<div class="od-fin-card"><div class="num">'+String(r.number).padStart(3,'0')+'</div><div><strong>'+esc(r.name)+'</strong><div class="meta">'+badges+'<br>'+esc(details)+'</div></div><button class="btn secondary small" data-open="'+r.number+'">Open</button></div>';
  }).join(''):'<div class="od-fin-help">No pending finishing changes yet. Click card text to edit it, set confidence, or mark artwork locked / still needed.</div>';
  list.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>{queueDialog.close();selectCard(+b.dataset.open)});
  const status=queueDialog.querySelector('[data-status]');status.textContent=lastSyncMessage||'Shared queue keeps this batch available for the later commit pass.';
}

function sortText(value){return String(value||'').toLowerCase()}
function compareText(a,b){a=sortText(a)||'\uffff';b=sortText(b)||'\uffff';return a.localeCompare(b)}
function compareCards(a,b,mode){
  const na=Number(a),nb=Number(b),ma=model(na),mb=model(nb);
  let d=0;
  if(mode==='confidence-low')d=confidence(na)-confidence(nb);
  else if(mode==='confidence-high')d=confidence(nb)-confidence(na);
  else if(mode==='cycle')d=compareText(cycleKey(na),cycleKey(nb));
  else if(mode==='suite')d=compareText(suiteKey(na),suiteKey(nb));
  else if(mode==='color'){const order={W:0,U:1,B:2,R:3,G:4,M:5,C:6,L:7};d=(order[ma.frame]??99)-(order[mb.frame]??99)}
  else if(mode==='rarity'){const order={C:0,U:1,R:2,M:3};d=(order[ma.rarity]??99)-(order[mb.rarity]??99)}
  else if(mode==='mv')d=(Number(ma.mv)||0)-(Number(mb.mv)||0);
  else if(mode==='layout')d=compareText(ma.layout,mb.layout);
  else if(mode==='art-state')d=compareText(artState(na),artState(nb));
  else if(mode==='changed-first')d=Number(isModified(nb))-Number(isModified(na));
  else if(mode==='name')d=compareText(ma.displayName,mb.displayName);
  else if(mode==='status')d=compareText(ma.status,mb.status);
  else d=na-nb;
  return d||na-nb;
}
function browserFilterOptions(){
  const cycles=[...new Set(CARDS.flatMap(c=>cycleValues(c.number)))].sort((a,b)=>compareText(a,b));
  const suites=[...new Set(CARDS.map(c=>suiteKey(c.number)).filter(Boolean))].sort((a,b)=>compareText(a,b));
  return{cycles,suites};
}
function buildBrowserTools(){
  const host=document.querySelector('.browser-tools');if(!host||document.getElementById('odFinishBrowserTools'))return;
  const box=document.createElement('div');box.id='odFinishBrowserTools';box.className='od-fin-browser-tools';
  box.innerHTML='<select id="odSortCards" class="wide" aria-label="Sort Odyssey cards"></select><select id="odConfidenceFilter" aria-label="Filter confidence"><option value="">All confidence</option>'+CONFIDENCE_LABELS.map((label,i)=>'<option value="'+i+'">'+i+' · '+esc(label)+'</option>').join('')+'</select><select id="odCycleFilter" aria-label="Filter cycle"><option value="">All cycles</option></select><select id="odSuiteFilter" class="wide" aria-label="Filter suite"><option value="">All suites / programs</option></select>';
  host.appendChild(box);
  const sort=box.querySelector('#odSortCards'),cf=box.querySelector('#odConfidenceFilter'),cy=box.querySelector('#odCycleFilter'),su=box.querySelector('#odSuiteFilter');
  sort.innerHTML=SORT_OPTIONS.map(x=>'<option value="'+x[0]+'">Sort · '+esc(x[1])+'</option>').join('');
  const opts=browserFilterOptions();
  cy.innerHTML='<option value="">All cycles</option>'+opts.cycles.map(x=>'<option value="'+esc(x)+'">'+esc(x)+'</option>').join('');
  su.innerHTML='<option value="">All suites / programs</option>'+opts.suites.map(x=>'<option value="'+esc(x)+'">'+esc(x)+'</option>').join('');
  sort.value=prefs.sort||'number';cf.value=String(prefs.confidenceFilter||'');cy.value=prefs.cycleFilter||'';su.value=prefs.suiteFilter||'';
  sort.onchange=()=>{prefs.sort=sort.value;saveLocal();applyBrowserSortAndFilters()};
  cf.onchange=()=>{prefs.confidenceFilter=cf.value;saveLocal();applyBrowserSortAndFilters()};
  cy.onchange=()=>{prefs.cycleFilter=cy.value;saveLocal();applyBrowserSortAndFilters()};
  su.onchange=()=>{prefs.suiteFilter=su.value;saveLocal();applyBrowserSortAndFilters()};
}
function applyBrowserSortAndFilters(){
  const list=document.getElementById('cardList');if(!list)return;
  const rows=[...list.querySelectorAll('.card-row[data-n]')];
  rows.sort((a,b)=>compareCards(+a.dataset.n,+b.dataset.n,prefs.sort||'number')).forEach(row=>list.appendChild(row));
  let visible=0;
  rows.forEach(row=>{
    const n=+row.dataset.n,matchConfidence=prefs.confidenceFilter===''||confidence(n)===Number(prefs.confidenceFilter),matchCycle=!prefs.cycleFilter||cycleValues(n).includes(prefs.cycleFilter),matchSuite=!prefs.suiteFilter||suiteKey(n)===prefs.suiteFilter;
    const show=matchConfidence&&matchCycle&&matchSuite;row.style.display=show?'':'none';if(show)visible++;
  });
  const count=document.getElementById('browserCount');if(count)count.textContent=visible+' shown · '+CARDS.length+' total';
}

function paintSync(message,stateName){lastSyncMessage=message;const el=document.getElementById('odFinishSync');if(el){el.textContent=message;el.dataset.state=stateName||''}if(queueDialog?.open){const x=queueDialog.querySelector('[data-status]');if(x){x.textContent=message;x.dataset.state=stateName||''}}}
function paintRows(){
  document.querySelectorAll('.card-row[data-n]').forEach(row=>{
    const n=Number(row.dataset.n),dots=row.querySelector('.dots');if(!dots)return;
    dots.querySelectorAll('.dot.finish-lock,.dot.finish-need,.dot.finish-change,.od-confidence-badge').forEach(x=>x.remove());
    const st=artState(n),keys=changeKeys(n),cf=confidence(n),badge=document.createElement('span');
    badge.className='od-confidence-badge c'+cf+(confidenceExplicit(n)?'':' inferred');badge.textContent=cf;badge.title=(confidenceExplicit(n)?'Confidence':'Inferred confidence')+' '+cf+' · '+confidenceLabel(cf);dots.appendChild(badge);
    if(st==='LOCKED'){const d=document.createElement('span');d.className='dot finish-lock';d.title='art locked';dots.appendChild(d)}
    else if(st==='NEEDS_ART'){const d=document.createElement('span');d.className='dot finish-need';d.title='art still needed';dots.appendChild(d)}
    if(keys.length){const d=document.createElement('span');d.className='dot finish-change';d.title=keys.length+' staged finishing edits';dots.appendChild(d)}
  });
}
function paint(){
  if(!mounted)return;
  document.body.classList.toggle('od-finish-on',!!prefs.enabled);
  const mode=document.getElementById('odFinishMode');if(mode){mode.classList.toggle('active',!!prefs.enabled);const c=statusCounts();mode.textContent='Finish · '+c.pending}
  const s=artState(selected),keys=changeKeys(selected),cf=confidence(selected),title=document.getElementById('odFinishCardTitle'),meta=document.getElementById('odFinishMeta');
  if(title)title.textContent=String(selected).padStart(3,'0')+' · '+cardName(selected);
  if(meta)meta.textContent='Confidence '+cf+' · '+confidenceLabel(cf)+(confidenceExplicit(selected)?'':' · inferred')+' · '+(keys.length?keys.length+' staged edit'+(keys.length===1?'':'s'):'no text/layout edits')+' · art '+(s==='LOCKED'?'locked':s==='NEEDS_ART'?'still needed':'reviewing');
  document.querySelectorAll('[data-fin-confidence]').forEach(b=>b.classList.toggle('active',Number(b.dataset.finConfidence)===cf));
  document.querySelectorAll('[data-fin-art-state]').forEach(b=>b.classList.toggle('active',b.dataset.finArtState===s));
  const sync=document.getElementById('odFinishSync');if(sync&&!sync.textContent)sync.textContent='Autosave on · shared finishing queue';
  paintRows();applyBrowserSortAndFilters();if(queueDialog?.open)renderQueue();
}


function toggleMode(){prefs.enabled=!prefs.enabled;saveLocal();paint();toast(prefs.enabled?'Finishing mode on — click card text to edit':'Finishing mode off')}
function onPreviewClick(event){
  if(!prefs.enabled||event.defaultPrevented)return;const target=event.target;if(target.closest('button,.artbox'))return;
  const order=['flavor','displayName','mana','type','pt','rules'];
  for(const key of order){const selector=key==='flavor'?'.flavor':QUICK_FIELDS[key]?.selector;if(selector&&target.closest(selector)){event.preventDefault();event.stopPropagation();openQuickEditor(key);return}}
}

function buildDock(){
  const stage=document.querySelector('.stage'),toolbar=document.querySelector('.preview-toolbar');if(!stage||!toolbar)return;
  dock=document.createElement('div');dock.id='odFinishDock';
  const confidenceButtons=CONFIDENCE_LABELS.map((label,i)=>'<button class="od-fin-chip confidence c'+i+'" data-fin-confidence="'+i+'" title="Set confidence '+i+' · '+esc(label)+'">'+i+' '+esc(label)+'</button>').join('');
  dock.innerHTML='<div class="od-fin-row"><span class="od-fin-title" id="odFinishCardTitle"></span><span class="od-fin-grow"></span><button class="od-fin-chip" data-quick="displayName">Name</button><button class="od-fin-chip" data-quick="mana">Mana</button><button class="od-fin-chip" data-quick="type">Type</button><button class="od-fin-chip" data-quick="rules">Rules</button><button class="od-fin-chip" data-quick="flavor">Flavor</button><button class="od-fin-chip" data-quick="pt">P/T</button></div><div class="od-fin-row" id="odFinishConfidence"><span class="od-fin-title">Confidence</span>'+confidenceButtons+'</div><div class="od-fin-row"><span class="od-fin-title">Artwork</span><button class="od-fin-chip" data-fin-art-state="REVIEWING">Reviewing</button><button class="od-fin-chip lock" data-fin-art-state="LOCKED">Locked ✓</button><button class="od-fin-chip need" data-fin-art-state="NEEDS_ART">Still needed</button><button class="btn secondary small" data-library>Library art</button><button class="btn secondary small" data-external>External art</button><span class="od-fin-grow"></span><button class="btn secondary small" data-queue>Queue</button><button class="btn small" data-next>Next →</button></div><div class="od-fin-row"><span class="od-fin-help" id="odFinishMeta"></span><span class="od-fin-grow"></span><span class="od-fin-sync" id="odFinishSync">Autosave on · shared finishing queue</span></div>';
  toolbar.insertAdjacentElement('afterend',dock);
  dock.querySelectorAll('[data-quick]').forEach(b=>b.onclick=()=>openQuickEditor(b.dataset.quick));
  dock.querySelectorAll('[data-fin-confidence]').forEach(b=>b.onclick=()=>setConfidence(selected,+b.dataset.finConfidence));
  dock.querySelectorAll('[data-fin-art-state]').forEach(b=>b.onclick=()=>setArtState(selected,b.dataset.finArtState));
  dock.querySelector('[data-library]').onclick=()=>openArtOptions(selected);dock.querySelector('[data-external]').onclick=openExternalArt;dock.querySelector('[data-queue]').onclick=openQueue;dock.querySelector('[data-next]').onclick=()=>selectCard(cardNumberAtOffset(selected,1));
}

function mountTopButton(){const top=document.querySelector('.top-actions');if(!top)return;const b=document.createElement('button');b.type='button';b.className='btn';b.id='odFinishMode';b.onclick=toggleMode;top.insertBefore(b,top.firstChild)}
function wrapRenderers(){
  const diff=diffOverride;diffOverride=function(n,data){const r=diff.apply(this,arguments);queueMicrotask(()=>observeCardChange(Number(n)));return r};
  const preview=renderPreview;renderPreview=function(){const r=preview.apply(this,arguments);queueMicrotask(paint);return r};
  const list=renderList;renderList=function(){const r=list.apply(this,arguments);queueMicrotask(()=>{paintRows();applyBrowserSortAndFilters()});return r};
}
function onConfidenceHotkey(event){
  const tag=(event.target&&event.target.tagName||'').toLowerCase();if(!prefs.enabled||!event.altKey||['input','textarea','select'].includes(tag))return;
  if(/^[0-5]$/.test(event.key)){event.preventDefault();setConfidence(selected,+event.key)}
}
function mount(){
  if(mounted||typeof model!=='function'||typeof diffOverride!=='function')return;
  mounted=true;loadLocal();seedSignatures();injectStyle();ensureDialogs();buildDock();buildBrowserTools();mountTopButton();wrapRenderers();
  document.getElementById('previewShell')?.addEventListener('click',onPreviewClick,true);document.addEventListener('keydown',onConfidenceHotkey);
  renderList();paint();refreshShared({apply:true,quiet:true});
}


const api={VERSION,API,SCHEMA,mount,refresh:refreshShared,syncAll,recordFor,changeset,artState,setArtState,openQueue,openExternalArt,openQuickEditor};
root.OdysseyFinishing=api;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();

})(window);
