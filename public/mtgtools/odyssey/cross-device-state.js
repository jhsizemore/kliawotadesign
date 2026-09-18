/* Odyssey Studio v3.17: portable cross-device artwork state.
   State travels in a share link or JSON file. No local image blobs or credentials are embedded. */
(function (root) {
  'use strict';
  const VERSION='3.17';
  const SCHEMA='odyssey-cross-device/v1';
  const PENDING='odyssey-cross-device-pending-v1';

  const q=id=>document.getElementById(id);
  const datasetVersion=()=>String((typeof ODYSSEY_DATASET!=='undefined'&&ODYSSEY_DATASET.datasetVersion)||'production');
  function storageMap(){return{
    overrides:STORAGE,
    crops:CROP_PROFILE_STORAGE,
    cardReview:REVIEW_STORAGE,
    profileReview:PROFILE_REVIEW_STORAGE,
    artSeen:ART_SEEN_STORAGE,
    workflow:WORKFLOW_STORAGE
  }}
  function capture(){
    const state={},map=storageMap();
    Object.keys(map).forEach(k=>state[k]=localStorage.getItem(map[k]));
    return{schema:SCHEMA,version:VERSION,datasetVersion:datasetVersion(),createdAt:new Date().toISOString(),state};
  }
  function validate(payload){
    if(!payload||payload.schema!==SCHEMA||!payload.state||typeof payload.state!=='object')throw new Error('Not an Odyssey cross-device state package');
    Object.values(payload.state).forEach(v=>{if(v!==null&&typeof v!=='string')throw new Error('Invalid state value')});
    return payload;
  }
  function bytesToBase64Url(bytes){
    let binary='',step=0x8000;
    for(let i=0;i<bytes.length;i+=step)binary+=String.fromCharCode.apply(null,bytes.subarray(i,i+step));
    return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  }
  function base64UrlToBytes(value){
    let b=String(value||'').replace(/-/g,'+').replace(/_/g,'/');
    while(b.length%4)b+='=';
    const binary=atob(b),out=new Uint8Array(binary.length);
    for(let i=0;i<binary.length;i++)out[i]=binary.charCodeAt(i);
    return out;
  }
  async function encode(payload){
    const bytes=new TextEncoder().encode(JSON.stringify(payload));
    if(typeof root.CompressionStream==='function'){
      const packed=new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new root.CompressionStream('gzip'))).arrayBuffer());
      return'gz.'+bytesToBase64Url(packed);
    }
    return'js.'+bytesToBase64Url(bytes);
  }
  async function decode(value){
    const raw=String(value||''),i=raw.indexOf('.');
    if(i<1)throw new Error('Unrecognized sync link');
    const mode=raw.slice(0,i),packed=base64UrlToBytes(raw.slice(i+1));
    let bytes=packed;
    if(mode==='gz'){
      if(typeof root.DecompressionStream!=='function')throw new Error('This browser cannot unpack the compressed sync link');
      bytes=new Uint8Array(await new Response(new Blob([packed]).stream().pipeThrough(new root.DecompressionStream('gzip'))).arrayBuffer());
    }else if(mode!=='js')throw new Error('Unsupported sync-link version');
    return validate(JSON.parse(new TextDecoder().decode(bytes)));
  }
  function status(message,kind=''){
    const el=q('odSyncStatus');if(!el)return;
    el.textContent=message;el.className='od-sync-status'+(kind?' '+kind:'');
  }
  function open(){const d=q('odSyncDialog');if(d&&!d.open)d.showModal()}
  function close(){const d=q('odSyncDialog');if(d?.open)d.close()}
  function downloadFile(name,text){
    if(typeof download==='function')return download(name,text);
    const href=URL.createObjectURL(new Blob([text],{type:'application/json'})),a=document.createElement('a');
    a.href=href;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(href),1000);
  }
  async function share(){
    status('Packing current artwork state…');
    const encoded=await encode(capture()),url=root.location.href.split('#')[0]+'#ody-sync='+encoded;
    q('odSyncLink').value=url;
    if(url.length>60000){status('This state is too large for a reliable share link. Use Download state instead.','od-sync-warning');return}
    if(navigator.share){
      try{
        await navigator.share({title:'Odyssey artwork state',text:'Open this link to continue the same Odyssey artwork edits on another device.',url});
        status('Shared current artwork state.');return
      }catch(e){if(e?.name==='AbortError'){status('Share cancelled.');return}}
    }
    if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(url);status('Cross-device link copied to clipboard.');}
    else{q('odSyncLink').select();document.execCommand('copy');status('Cross-device link copied to clipboard.');}
  }
  function downloadState(){
    const payload=capture(),safe=datasetVersion().replace(/[^a-z0-9._-]+/gi,'-');
    downloadFile('odyssey-art-state-'+safe+'.json',JSON.stringify(payload,null,2));
    status('Downloaded a portable copy of the current artwork state.');
  }
  function applyState(payload){
    validate(payload);
    const map=storageMap();
    for(const logical of Object.keys(map)){
      const value=payload.state[logical];
      if(value===undefined)continue;
      if(value===null)localStorage.removeItem(map[logical]);
      else{JSON.parse(value);localStorage.setItem(map[logical],value)}
    }
  }
  function setPending(payload){sessionStorage.setItem(PENDING,JSON.stringify(payload))}
  function clearPending(){sessionStorage.removeItem(PENDING)}
  function switchDataset(payload){
    const target=String(payload.datasetVersion||'production'),current=datasetVersion();
    if(target===current)return false;
    setPending(payload);
    if(target==='analysis-candidate-v1'&&typeof loadAnalysisCandidate==='function'){
      status('Switching to Analysis candidate v1 before import…');loadAnalysisCandidate();return true
    }
    if((target==='production'||target==='current'||/^2026-/.test(target))&&typeof DATASET_STORAGE!=='undefined'){
      status('Switching to Current set before import…');localStorage.removeItem(DATASET_STORAGE);root.location.reload();return true
    }
    clearPending();throw new Error('This state belongs to "'+target+'". Load that dataset first.')
  }
  async function importPayload(payload,ask=true){
    payload=validate(payload);
    if(switchDataset(payload))return;
    if(ask&&!root.confirm('Replace this browser’s Odyssey artwork assignment, crop and review state with the state from '+(payload.createdAt?new Date(payload.createdAt).toLocaleString():'another device')+'?'))return;
    applyState(payload);clearPending();
    if(root.location.hash.startsWith('#ody-sync='))history.replaceState(null,'',root.location.href.split('#')[0]);
    status('Imported artwork state. Reloading…');root.location.reload();
  }
  async function importFile(file){
    if(!file)return;
    await importPayload(JSON.parse(await file.text()),true);
  }
  async function importPasted(){
    const value=q('odSyncLink').value.trim();
    if(!value)throw new Error('Paste a sync link first');
    const hash=value.includes('#ody-sync=')?value.split('#ody-sync=')[1]:value.replace(/^#?ody-sync=/,'');
    await importPayload(await decode(hash),true);
  }
  function mount(){
    if(q('odSyncButton')||typeof STORAGE==='undefined')return;
    const actions=document.querySelector('.top-actions');
    if(actions){
      const b=document.createElement('button');b.type='button';b.id='odSyncButton';b.className='btn secondary small od-sync-button';b.textContent='Sync art';b.onclick=open;actions.appendChild(b);
    }
    const d=document.createElement('dialog');d.id='odSyncDialog';d.className='od-sync-dialog';
    d.innerHTML='<h2>Cross-device artwork state</h2>'+
      '<p>Carry artwork assignments, crop/zoom, review status and seen-state between phone and desktop. Local image files themselves are not embedded.</p>'+
      '<div class="od-sync-actions"><button class="btn small" id="odSyncShare" type="button">Share / copy link</button><button class="btn secondary small" id="odSyncDownload" type="button">Download state</button><label class="btn secondary small">Import file<input id="odSyncFile" type="file" accept="application/json,.json" hidden></label><button class="btn secondary small" id="odSyncClose" type="button">Close</button></div>'+
      '<label>Sync link<textarea id="odSyncLink" placeholder="A generated link appears here, or paste one from another device."></textarea></label>'+
      '<div class="od-sync-actions"><button class="btn secondary small" id="odSyncImportLink" type="button">Import pasted link</button></div>'+
      '<div id="odSyncStatus" class="od-sync-status">State is scoped to the selected Odyssey dataset. Importing replaces this browser’s art state for that dataset.</div>';
    document.body.appendChild(d);
    q('odSyncShare').onclick=()=>share().catch(e=>status('Share failed: '+e.message,'od-sync-warning'));
    q('odSyncDownload').onclick=downloadState;
    q('odSyncFile').onchange=e=>{importFile(e.target.files?.[0]).catch(err=>status('Import failed: '+err.message,'od-sync-warning'));e.target.value=''};
    q('odSyncImportLink').onclick=()=>importPasted().catch(e=>status('Import failed: '+e.message,'od-sync-warning'));
    q('odSyncClose').onclick=close;
    d.addEventListener('click',e=>{if(e.target===d)close()});
  }
  async function consumeIncoming(){
    let pending=null;
    try{const raw=sessionStorage.getItem(PENDING);if(raw)pending=validate(JSON.parse(raw))}catch(e){clearPending()}
    if(pending){open();await importPayload(pending,true);return}
    if(!root.location.hash.startsWith('#ody-sync='))return;
    open();
    try{await importPayload(await decode(root.location.hash.slice('#ody-sync='.length)),true)}
    catch(e){status('Sync link could not be imported: '+e.message,'od-sync-warning')}
  }
  function install(){
    mount();
    consumeIncoming();
  }
  const api={capture,encode,decode,applyState,install};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.OdysseyCrossDevice=api;
  if(typeof document!=='undefined'){
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
    else install();
  }
})(typeof window==='undefined'?globalThis:window);
