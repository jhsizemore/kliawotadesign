/* Private, opt-in art-direction sync. Current and named candidates use isolated scopes; card design and uploaded image bytes stay local. */
(function (root) {
  'use strict';
  const KEY = 'odyssey-art-sync-v1', BACKUP = KEY + '-before-pull';
  const API = '/mtgtools/odyssey/api/art-sync';
  const clone = o => JSON.parse(JSON.stringify(o));
  function parseKey(value) {
    const s = String(value || '').trim();
    if (/^[a-f0-9]{64}$/.test(s)) return s;
    try { const u = new URL(s); return /^[a-f0-9]{64}$/.test(u.hash.slice(1).replace(/^odyssey-sync=/,'')) && u.hash.startsWith('#odyssey-sync=') ? u.hash.slice(14) : ''; }
    catch (_) { return ''; }
  }
  function writeBatch(storage, writes) {
    const before = Object.keys(writes).map(k => [k,storage.getItem(k)]);
    try { Object.entries(writes).forEach(([k,v]) => storage.setItem(k,JSON.stringify(v))); }
    catch (error) {
      before.forEach(([k]) => storage.removeItem(k));
      before.forEach(([k,v]) => { if (v !== null) storage.setItem(k,v); });
      throw error;
    }
  }
  function mount(state) {
    if (root.OdysseyArtSyncInstalled || !state || !root.OdysseySyncCore) return;
    root.OdysseyArtSyncInstalled = true;
    const core = root.OdysseySyncCore, storage = state.storage;
    const read = k => { const o = JSON.parse(storage.getItem(k) || '{}'); if (!o || Array.isArray(o) || typeof o !== 'object') throw new Error('Invalid local art settings.'); return o; };
    const scopes = [{name:'current',keys:root.OdysseyArtTransfer.BASE,cards:state.baseline.cards}];
    const candidateScope = state.candidate ? (state.candidateVersion || state.active?.datasetVersion || '') : '';
    if (candidateScope) scopes.push({name:candidateScope,keys:state.keys,cards:state.active.cards});
    // Unknown custom datasets must not share a production workspace by collector number.
    const supported = state.active === state.baseline || /^analysis-candidate-v[12]$/.test(candidateScope);
    scopes.forEach(s => {
      s.byId = new Map(); s.byNumber = new Map();
      s.cards.forEach(c => { if (c.id) s.byId.set(c.id,s.byId.has(c.id)?null:c); s.byNumber.set(String(c.number),c); });
    });
    let config = {token:'',base:{}}, conflicts = [], timer, running = false, rerun = false, generation = 0, pointerDown = false;
    let invalid = new Set(), message = 'Edits are saved in this browser. Device sync is off.';
    try { const saved = read(KEY); if (parseKey(saved.token) && core.validRecords(saved.base)) config = saved; }
    catch (_) { message = 'Saved sync metadata could not be read. Local artwork has not been changed.'; }
    const button = document.createElement('button');
    button.id = 'odysseySyncDevices'; button.type = 'button'; button.className = 'btn secondary small od-sync-button'; button.textContent = 'Sync devices';
    (document.querySelector('.top-actions') || document.querySelector('.topbar') || document.body).appendChild(button);
    const dialog = document.createElement('dialog'); dialog.className = 'od-sync-dialog'; dialog.id = 'odysseySyncDialog';
    dialog.innerHTML = `<h2>Artwork across devices</h2><p>Sync artwork choices, hosted image links, positioning, zoom, frame treatment and shared crops. Current set, Analysis candidate v1 and Candidate 2 remain separate. Rules, names, mana costs and structural layouts are not shared.</p><p class="od-sync-warning">The pairing link is an editing key. Anyone with it can edit this workspace. Keep it private. Uploaded image files are not transferred; use a hosted image link for those.</p><p id="odSyncStatus" class="od-sync-status" role="status" aria-live="polite"></p><div class="od-sync-actions"><button type="button" class="btn" id="odSyncCreate">Enable device sync</button><button type="button" class="btn secondary" id="odSyncNow">Sync now</button><button type="button" class="btn secondary" id="odSyncPair">Pair another device</button><button type="button" class="btn secondary" id="odSyncBackup">Export local art backup</button></div><div id="odSyncPairing" hidden><label for="odSyncLink">Private pairing link</label><input id="odSyncLink" readonly autocomplete="off" spellcheck="false"><button type="button" class="btn secondary" id="odSyncCopy">Copy private link</button></div><details id="odSyncJoinDetails"><summary>Connect using a pairing link</summary><label for="odSyncJoinInput">Paste the private link from your other device</label><input id="odSyncJoinInput" type="password" autocomplete="off" spellcheck="false"><button type="button" class="btn secondary" id="odSyncJoin">Connect this device</button></details><div id="odSyncConflicts"></div><div class="od-sync-actions"><button type="button" class="btn secondary" id="odSyncDisconnect">Disconnect this device</button><button type="button" class="btn" id="odSyncClose">Close</button></div>`;
    document.body.appendChild(dialog);
    const el = id => document.getElementById(id);
    function show() { if (!dialog.open) dialog.showModal(); paint(); }
    function setStatus(text) { message = text; paint(); }
    function label(key) {
      const [scope,kind,...parts] = key.split(':');
      const id = parts.join(':'), c = scopes.find(s=>s.name===scope)?.byId.get(id);
      const scopeLabel=scope==='current'?'Current set':scope==='analysis-candidate-v2'?'Candidate 2':'Analysis candidate v1';
      return scopeLabel+' · '+(kind==='card'?(c?.displayName||c?.name||id):id);
    }
    function paint() {
      button.textContent = conflicts.length ? `Sync · ${conflicts.length} conflicts` : running ? 'Syncing…' : config.token ? 'Sync devices · on' : 'Sync devices';
      button.title = message;
      el('odSyncStatus').textContent = message + (invalid.size ? ` ${invalid.size} unsupported art record(s) stayed local.` : '') + (typeof localImageUrls !== 'undefined' && Object.keys(localImageUrls).length ? ' Session-uploaded images are not shared.' : '');
      el('odSyncCreate').hidden = !!config.token; el('odSyncCreate').disabled = !supported;
      ['odSyncNow','odSyncPair','odSyncDisconnect'].forEach(id=>el(id).disabled=!config.token || !supported);
      el('odSyncJoin').disabled = !supported;
      const host = el('odSyncConflicts'); host.replaceChildren();
      if (conflicts.length) {
        const h = document.createElement('h3'); h.textContent = `${conflicts.length} edits need a decision`; host.appendChild(h);
        conflicts.forEach(c => {
          const row=document.createElement('div'); row.className='od-sync-conflict';
          const title=document.createElement('strong'); title.textContent=label(c.key); row.appendChild(title);
          const values=document.createElement('pre'); values.textContent='This device: '+JSON.stringify(c.local)+'\nShared: '+JSON.stringify(c.remote.value); row.appendChild(values);
          for (const [text,useRemote] of [['Keep this device',false],['Use shared edit',true]]) {
            const b=document.createElement('button'); b.type='button'; b.className='btn secondary small'; b.textContent=text;
            b.disabled=running; b.onclick=()=>resolveConflict(c,useRemote); row.appendChild(b);
          }
          host.appendChild(row);
        });
      }
    }
    function snapshot() {
      const records = {}; invalid = new Set();
      for (const s of scopes) {
        const saved = read(s.keys.overrides), crops = read(s.keys.crops);
        for (const [number,o] of Object.entries(saved)) {
          const card=s.byNumber.get(number); if (!card || s.byId.get(card.id)!==card) continue;
          const key=`${s.name}:card:${card.id}`, value={};
          core.ART_KEYS.forEach(k=>{if(core.own(o,k))value[k]=o[k]});
          if (!core.validValue(key,value)) invalid.add(key);
          else if (Object.keys(value).length) records[key]=value;
        }
        for (const [id,p] of Object.entries(crops)) {
          const key=`${s.name}:crop:${id}`;
          if (!core.validValue(key,p)) invalid.add(key); else records[key]=p;
        }
      }
      return records;
    }
    function inScope(key) {
      const [scope,kind,...parts]=key.split(':'), s=scopes.find(x=>x.name===scope);
      return !!s && !invalid.has(key) && (kind==='crop' || !!s.byId.get(parts.join(':')));
    }
    const scoped = records => Object.fromEntries(Object.entries(records).filter(([k])=>inScope(k)));
    function localBackup() {
      return {schema:'odyssey-local-art-backup/v1',savedAt:new Date().toISOString(),stores:Object.fromEntries(scopes.flatMap(s=>Object.values(s.keys)).map(k=>[k,read(k)]))};
    }
    function commit(merged, changedKeys) {
      const writes = {}, backup = changedKeys.length ? localBackup() : null;
      for (const key of changedKeys) {
        const [scope,kind,...parts]=key.split(':'), s=scopes.find(x=>x.name===scope), id=parts.join(':');
        if (!s) continue;
        const store=kind==='card'?s.keys.overrides:s.keys.crops;
        const rows=writes[store] ||= read(store), value=merged.local[key] ?? null;
        if (kind==='card') {
          const card=s.byId.get(id); if(!card)continue;
          const row={...(rows[card.number]||{})}; core.ART_KEYS.forEach(k=>delete row[k]);
          Object.assign(row,value||{});
          if(Object.keys(row).length)rows[card.number]=row;else delete rows[card.number];
        } else if(value===null)delete rows[id];else rows[id]=value;
      }
      const next={token:config.token,base:{...config.base,...merged.base}};
      if(backup)writes[BACKUP]=backup;
      writes[KEY]=next; writeBatch(storage,writes); config=next;
      if(changedKeys.length){overrides=read(state.keys.overrides);cropProfiles=read(state.keys.crops);root.renderPreview();root.updateReviewTop?.();}
    }
    function editing() { return pointerDown || /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName||'') && !dialog.contains(document.activeElement) || document.activeElement?.isContentEditable; }
    function schedule(delay=900) { clearTimeout(timer); if(config.token&&supported)timer=setTimeout(()=>sync(),delay); }
    async function request(method, token, changes) {
      const response=await fetch(API,{method,cache:'no-store',referrerPolicy:'no-referrer',credentials:'omit',headers:{Authorization:'Bearer '+token,...(changes?{'Content-Type':'application/json'}:{})},body:changes?JSON.stringify({changes}):undefined,signal:AbortSignal.timeout(20000)});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||`Sync returned HTTP ${response.status}.`);
      if(data.schema!=='odyssey-art-sync/v1'||!core.validRecords(data.records)||data.accepted&&!core.validRecords(data.accepted))throw new Error('Invalid shared response. Local artwork was not replaced.');
      return data;
    }
    async function sync() {
      if(!config.token||!supported)return;
      if(running){rerun=true;return}
      if(editing()){schedule(1600);return}
      if(!navigator.onLine){setStatus('Offline. Edits remain saved here and will sync when connected.');return}
      const token=config.token, gen=generation; running=true;setStatus('Checking shared artwork…');
      try {
        let remote=(await request('GET',token)).records;
        for(let pass=0;pass<6;pass++){
          if(gen!==generation||config.token!==token)return;
          if(editing()){rerun=true;break}
          const local=snapshot(), merge=core.reconcile(scoped(config.base),local,scoped(remote));
          commit(merge,merge.downloaded); conflicts=merge.conflicts;
          if(!merge.pending.length)break;
          const changes=[];
          for(const change of merge.pending){if(changes.length>=48||JSON.stringify({changes:[...changes,change]}).length>110000)break;changes.push(change)}
          const result=await request('PATCH',token,changes);
          if(gen!==generation||config.token!==token)return;
          // Acknowledge exactly the values sent, not edits made while this request ran.
          const next={...config,base:{...config.base,...result.accepted}};
          writeBatch(storage,{[KEY]:next});config=next;remote=result.records;
          if(pass===5)rerun=true;
        }
        const local=snapshot(), remaining=core.reconcile(scoped(config.base),local,scoped(remote));
        conflicts=remaining.conflicts;
        if(remaining.pending.length||remaining.downloaded.length)rerun=true;
        setStatus(conflicts.length?`${conflicts.length} conflicting edits kept separate. Choose which version to use below.`:rerun?'Local changes saved; finishing sync…':`Artwork synced at ${new Date().toLocaleTimeString()}. Other devices update while the builder is open.`);
      }catch(error){rerun=false;setStatus('Sync paused: '+error.message+' Local edits remain saved here.');}
      finally{running=false;paint();if(rerun){rerun=false;schedule(1800)}}
    }
    function resolveConflict(conflict,useRemote){
      if(running)return;
      try{
        const local=snapshot(), key=conflict.key;
        if(!core.equal(local[key]??null,conflict.local)){setStatus('This edit changed again. Sync now to review the latest versions.');return}
        if(useRemote){if(conflict.remote.value===null)delete local[key];else local[key]=conflict.remote.value;}
        commit({local,base:{[key]:conflict.remote}},useRemote?[key]:[]);
        conflicts=conflicts.filter(x=>x.key!==key);setStatus('Choice saved. Checking for newer shared edits…');schedule(0);
      }catch(error){setStatus('Choice was not applied: '+error.message)}
    }
    function connect(token){
      if(!supported)return setStatus('Device sync is supported for Current set, Analysis candidate v1 and Candidate 2 only.');
      if(!token)return setStatus('Paste a complete private pairing link.');
      if(config.token && config.token!==token && !confirm('Switch shared workspaces? Local art is kept and conflicts will need a decision.'))return;
      try{
        const next=config.token===token?config:{token,base:{}};
        writeBatch(storage,{[KEY+'-before-connect']:localBackup(),[KEY]:next});
        generation++;config=next;conflicts=[];el('odSyncJoinInput').value='';el('odSyncJoinDetails').open=false;el('odSyncPairing').hidden=true;el('odSyncLink').value='';
        setStatus('Connected. Your existing local artwork is backed up; conflicts will not be overwritten.');schedule(0);
      }catch(error){setStatus('Could not connect: '+error.message)}
    }
    button.onclick=show;el('odSyncClose').onclick=()=>dialog.close();
    el('odSyncCreate').onclick=()=>{const bytes=crypto.getRandomValues(new Uint8Array(32));connect([...bytes].map(n=>n.toString(16).padStart(2,'0')).join(''))};
    el('odSyncJoin').onclick=()=>connect(parseKey(el('odSyncJoinInput').value));el('odSyncNow').onclick=()=>sync();
    el('odSyncPair').onclick=()=>{el('odSyncPairing').hidden=false;el('odSyncLink').value=location.origin+'/mtgtools/odyssey/#odyssey-sync='+config.token};
    el('odSyncCopy').onclick=async()=>{try{await navigator.clipboard.writeText(el('odSyncLink').value);setStatus('Private pairing link copied. Open it on your other device.')}catch(_){el('odSyncLink').select();setStatus('Select and copy the private link above.')}};
    el('odSyncBackup').onclick=()=>{try{root.download('odyssey-local-art-backup.json',JSON.stringify(localBackup(),null,2))}catch(error){setStatus('Backup failed: '+error.message)}};
    el('odSyncDisconnect').onclick=()=>{if(!confirm('Disconnect this device? Your local edits and shared workspace will be kept.'))return;try{storage.removeItem(KEY);generation++;config={token:'',base:{}};conflicts=[];clearTimeout(timer);el('odSyncPairing').hidden=true;el('odSyncLink').value='';setStatus('Disconnected. Local artwork has been kept.')}catch(error){setStatus(error.message)}};
    for(const name of ['save','saveCropProfiles']){const original=root[name];if(typeof original==='function')root[name]=function(){const result=original.apply(this,arguments);schedule();return result};}
    // Copy-from-Current and imports may write stores directly rather than use save().
    setInterval(()=>{if(document.visibilityState==='visible')schedule(0)},20000);
    root.addEventListener('online',()=>schedule(0));root.addEventListener('focus',()=>schedule(0));
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')schedule(0)});
    document.addEventListener('pointerdown',()=>{pointerDown=true},true);
    ['pointerup','pointercancel'].forEach(event=>document.addEventListener(event,()=>{pointerDown=false},true));
    root.addEventListener('blur',()=>{pointerDown=false});
    root.addEventListener('storage',event=>{
      if(event.key===KEY){try{const next=read(KEY);if(parseKey(next.token)&&core.validRecords(next.base)){if(next.token!==config.token)generation++;config=next;}else{generation++;config={token:'',base:{}}}paint();}catch(_){}}
      if(scopes.some(s=>[s.keys.overrides,s.keys.crops].includes(event.key))){if(!editing()){overrides=read(state.keys.overrides);cropProfiles=read(state.keys.crops);root.renderPreview()}schedule()}
    });
    if(!supported)setStatus('Custom dataset open. Device sync is paused; Current set and candidate settings are unchanged.');
    let incoming=root.OdysseyIncomingSyncKey||'';
    if(!incoming&&location.hash.startsWith('#odyssey-sync=')){incoming=location.hash.slice(14);history.replaceState(null,'',location.pathname+location.search)}
    delete root.OdysseyIncomingSyncKey;
    if(parseKey(incoming)&&incoming!==config.token){el('odSyncJoinInput').value=incoming;el('odSyncJoinDetails').open=true;show();setStatus('Pairing link received. Select Connect this device to join this private artwork workspace.');}
    paint();schedule(700);
    root.OdysseyArtSyncController={sync,show,snapshot,getStatus:()=>({connected:!!config.token,running,conflicts:conflicts.length,message})};
  }
  root.OdysseyArtSync={mount,parseKey,writeBatch};
  if(typeof module!=='undefined'&&module.exports)module.exports=root.OdysseyArtSync;
})(typeof window==='undefined'?globalThis:window);
