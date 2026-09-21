/* Odyssey Studio mechanics verification v1.0: swipe/drag design decisions + exact wording. */
(function(root){
  'use strict';
  const VERSION='1.0';
  const PREFIX='mechanics-v1:';
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const datasetId=()=>String((typeof ODYSSEY_DATASET!=='undefined'&&ODYSSEY_DATASET.datasetVersion)||'unversioned');
  const storageKey=()=>`odyssey-mechanics-verification-v1:${datasetId()}`;
  let state={schema:'odyssey-mechanics-verification/v1',datasetVersion:datasetId(),startedAt:null,updatedAt:null,decisions:{}};
  let currentNumber=null, drag=null, lastOption=null;
  const ORDEAL_PLAN={
    93:{name:'Ordeal of the Bow',cost:'{1}{W}',payoff:'Create two 1/1 white Human Sailor creature tokens.',theme:'loyal household / crew'},
    17:{name:'Ordeal of the Sirens',cost:'{1}{U}',payoff:'Manifest fate.',theme:'Manifest Fate / exile'},
    280:{name:'Ordeal of the Dead',cost:'{1}{B}',payoff:'Return up to two target creature cards from your graveyard to your hand.',theme:'graveyard / cards leaving graveyards'},
    282:{name:'Ordeal of the Narrow Sea',cost:'{1}{R}',payoff:'Exile the top two cards of your library. You may play them until the end of your next turn.',theme:'cast from exile'},
    166:{name:'Ordeal of the Cyclops',cost:'{1}{G}',payoff:'Search your library for a basic land card, put it onto the battlefield tapped, then shuffle. Create a Food token.',theme:'Food / journey ramp'}
  };

  function load(){
    try{
      const raw=localStorage.getItem(storageKey());
      if(raw){
        const parsed=JSON.parse(raw);
        if(parsed&&parsed.schema===state.schema&&parsed.decisions&&typeof parsed.decisions==='object') state=Object.assign(state,parsed);
      }
    }catch(_){}
    if(!state.startedAt) state.startedAt=new Date().toISOString();
  }
  function persist(){
    state.datasetVersion=datasetId();
    state.updatedAt=new Date().toISOString();
    localStorage.setItem(storageKey(),JSON.stringify(state));
  }
  function cardKey(n){
    const b=baseCard(n);
    return String(b?.id||n);
  }
  function signature(n){
    const m=model(n);
    return JSON.stringify([m.displayName,m.mana,m.type,m.rules,m.pt,m.rarity,m.mechanics,m.archetypes,m.layout]);
  }
  function disposition(n){
    const value=String(model(n).designDisposition||'');
    return value.startsWith(PREFIX)?value.slice(PREFIX.length):'';
  }
  function record(n){return state.decisions[cardKey(n)]||null}
  function isCurrentDecision(n){
    const r=record(n);
    if(r&&r.signature===signature(n)) return true;
    return !!disposition(n)&&!r;
  }
  function counts(){
    let done=0;
    CARDS.forEach(c=>{if(isCurrentDecision(c.number))done++});
    return {done,pending:CARDS.length-done,total:CARDS.length};
  }
  function nextPending(from=currentNumber||selected,step=1){
    const start=Math.max(1,Number(from)||1);
    for(let i=1;i<=CARDS.length;i++){
      const n=((start-1+(i*step))%CARDS.length+CARDS.length)%CARDS.length+1;
      if(!isCurrentDecision(n)) return n;
    }
    return null;
  }
  function detectTheme(m){
    const hay=((m.mechanics||'')+' '+(m.rules||'')).toLowerCase();
    const ordered=[
      ['survival','Survival','larger Survival payoff'],
      ['manifest fate','Manifest Fate','Manifest Fate / exile payoff'],
      ['vehicle','Vehicles','cleaner Vehicle payoff'],
      ['heroic','Heroic','stronger targeting payoff'],
      ['constellation','Constellation','enchantment payoff'],
      ['escape','Escape','graveyard-to-exile payoff'],
      ['foretell','Foretell','cast-from-exile payoff'],
      ['adventure','Adventure','tighter two-part Adventure'],
      ['prepare','Prepare','clearer prepared-spell payoff'],
      ['saga','Saga','cleaner chapter progression'],
      ['food','Food','stronger Food payoff'],
      ['treasure','Treasure','stronger resource payoff']
    ];
    for(const [needle,label,direction] of ordered) if(hay.includes(needle)) return {label,direction,id:needle.replace(/\s+/g,'-')};
    const mech=String(m.mechanics||'').split(/[\/;,]/).map(x=>x.trim()).filter(Boolean)[0];
    if(mech) return {label:mech,direction:`push ${mech} as the card's main job`,id:'primary-mechanic'};
    return {label:'set theme',direction:'give it a clearer set-theme job',id:'theme'};
  }
  function optionsFor(n){
    const m=model(n), theme=detectTheme(m), role=String(m.archetypes||'').trim(), ordeal=ORDEAL_PLAN[n];
    const out=[
      {id:'keep',title:'Keep',detail:'Mechanics read correctly as written.'},
      {id:'wording',title:'Exact wording',detail:'Keep the design; specify the rules text directly.',editor:true},
      {id:'tune',title:'Tune',detail:'Keep the structure; adjust cost, rate, P/T or numbers.'},
      {id:'simplify',title:'Simplify',detail:'Keep its job but remove a clause, rider or competing idea.'},
      {id:'push-'+theme.id,title:'Push '+theme.label,detail:'Keep the slot and '+theme.direction+'.',dynamic:true},
      {id:'rebuild',title:'Rebuild',detail:role?'Rebuild while preserving its draft role: '+role+'.':'The slot is useful, but this mechanical execution should be replaced.'}
    ];
    if(ordeal){
      out[4]={id:'replace-ordeal',title:'Replace → '+ordeal.name,detail:ordeal.cost+' Aura · three Survival-timing trials · payoff: '+ordeal.payoff+' Theme: '+ordeal.theme+'.',dynamic:true};
    }else if(String(m.origin||'').toUpperCase().includes('REPRINT')){
      out[4]={id:'preserve-reprint',title:'Preserve reprint',detail:'Keep Oracle function intact; solve flavour through name, art or treatment.',dynamic:true};
    }else if(/\bsurvival\b/i.test((m.mechanics||'')+' '+(m.rules||''))&&!/\bSurvivor\b/.test(m.type||'')){
      out[4]={id:'survivor-identity',title:'Survivor identity',detail:'Keep Survival, but add Survivor to the creature type and make the payoff the card’s clearest job.',dynamic:true};
    }
    return out;
  }
  function writeDisposition(n,id){
    const m=model(n);
    m.designDisposition=PREFIX+id;
    diffOverride(n,m);
  }
  function choose(option){
    if(!currentNumber||!option)return;
    if(option.editor){openWording();return}
    writeDisposition(currentNumber,option.id);
    const m=model(currentNumber);
    state.decisions[cardKey(currentNumber)]={
      cardId:cardKey(currentNumber),number:currentNumber,name:m.displayName||m.name,
      decision:option.id,label:option.title,detail:option.detail,at:new Date().toISOString(),signature:signature(currentNumber)
    };
    persist();
    renderPreview();
    advance();
  }
  function clearDecision(){
    if(!currentNumber)return;
    delete state.decisions[cardKey(currentNumber)];
    const m=model(currentNumber);
    if(String(m.designDisposition||'').startsWith(PREFIX)){m.designDisposition='';diffOverride(currentNumber,m)}
    persist();refresh();
  }
  function previousCard(){
    if(!currentNumber)return;
    const n=currentNumber<=1?CARDS.length:currentNumber-1;
    showCard(n);
  }
  function advance(){
    const next=nextPending(currentNumber,1);
    if(next===null){refresh();toast('Mechanics pass complete');return}
    showCard(next);
  }
  function showCard(n){
    currentNumber=Math.max(1,Math.min(CARDS.length,Number(n)||1));
    selectCard(currentNumber);
    requestAnimationFrame(refresh);
  }
  function renderCardClone(){
    const host=$('mechanicsCardHost');
    if(!host)return;
    host.replaceChildren();
    const source=document.querySelector('#previewShell .render-card');
    if(!source){host.textContent='Card preview unavailable.';return}
    const shell=document.createElement('div');
    shell.className='mechanics-drag-card';
    shell.tabIndex=0;
    shell.setAttribute('role','button');
    shell.setAttribute('aria-label','Drag this card onto a design direction');
    const clone=source.cloneNode(true);
    clone.querySelectorAll('button,input,textarea,select,a').forEach(el=>{el.tabIndex=-1;el.style.pointerEvents='none'});
    shell.appendChild(clone);
    host.appendChild(shell);
    shell.addEventListener('pointerdown',startDrag);
    shell.addEventListener('keydown',e=>{
      if(e.key==='Enter'||e.key===' '){e.preventDefault();$('mechanicsOptions')?.querySelector('[data-mech-option]')?.focus()}
    });
  }
  function renderOptions(){
    const host=$('mechanicsOptions'); if(!host)return;
    const existing=disposition(currentNumber), rec=record(currentNumber);
    host.innerHTML=optionsFor(currentNumber).map((o,i)=>`
      <button type="button" class="mechanics-option ${existing===o.id?'selected':''}" data-mech-option="${esc(o.id)}" data-index="${i}">
        <strong>${esc(o.title)}</strong><span>${esc(o.detail)}</span>
      </button>`).join('');
    host.querySelectorAll('[data-mech-option]').forEach(b=>b.onclick=()=>choose(optionsFor(currentNumber)[+b.dataset.index]));
    const status=$('mechanicsDecisionStatus');
    if(status){
      const label=rec?.label||(existing?optionsFor(currentNumber).find(o=>o.id===existing)?.title:'');
      status.textContent=label?'Recorded: '+label:'No mechanics decision recorded yet.';
    }
  }
  function refresh(){
    if(!$('mechanicsReviewDialog')?.open||!currentNumber)return;
    const m=model(currentNumber), c=counts();
    $('mechanicsTitle').textContent=`${String(currentNumber).padStart(3,'0')} · ${m.displayName}`;
    $('mechanicsMeta').textContent=`${m.mana||'—'} · ${m.type} · ${m.rarity} · ${m.mechanics||'No mechanic label'}`;
    $('mechanicsProgress').textContent=`${c.done} / ${c.total} verified · ${c.pending} remaining`;
    $('mechanicsStory').textContent=m.story||m.storyTarget||'';
    renderCardClone();renderOptions();
  }
  function optionUnderPoint(x,y){
    for(const el of document.elementsFromPoint(x,y)){
      const b=el.closest?.('[data-mech-option]');
      if(b)return b;
    }
    return null;
  }
  function setHot(el){
    if(lastOption===el)return;
    lastOption?.classList.remove('hot');lastOption=el;lastOption?.classList.add('hot');
  }
  function startDrag(e){
    if(e.button!==undefined&&e.button!==0)return;
    const card=e.currentTarget;
    drag={card,pointerId:e.pointerId,x:e.clientX,y:e.clientY,dx:0,dy:0};
    card.setPointerCapture?.(e.pointerId);card.classList.add('dragging');
    card.addEventListener('pointermove',moveDrag);
    card.addEventListener('pointerup',endDrag,{once:true});
    card.addEventListener('pointercancel',endDrag,{once:true});
  }
  function moveDrag(e){
    if(!drag||e.pointerId!==drag.pointerId)return;
    drag.dx=e.clientX-drag.x;drag.dy=e.clientY-drag.y;
    drag.card.style.transform=`translate3d(${drag.dx}px,${drag.dy}px,0) rotate(${Math.max(-7,Math.min(7,drag.dx/40))}deg)`;
    setHot(optionUnderPoint(e.clientX,e.clientY));
  }
  function endDrag(e){
    if(!drag)return;
    const option=optionUnderPoint(e.clientX,e.clientY);
    const card=drag.card;
    card.releasePointerCapture?.(drag.pointerId);
    card.removeEventListener('pointermove',moveDrag);
    card.classList.remove('dragging');
    card.style.transform='';
    setHot(null);drag=null;
    if(option)choose(optionsFor(currentNumber)[+option.dataset.index]);
  }
  function openWording(){
    const m=model(currentNumber), panel=$('mechanicsWordingPanel');
    $('mechanicsWordingBefore').textContent=m.rules||'';
    $('mechanicsWordingInput').value=m.rules||'';
    $('mechanicsWordingNote').value=record(currentNumber)?.note||'';
    panel.hidden=false;
    $('mechanicsWordingInput').focus();
  }
  function closeWording(){$('mechanicsWordingPanel').hidden=true}
  function applyWording(){
    const m=model(currentNumber), before=m.rules||'';
    let next=$('mechanicsWordingInput').value.trim();
    if(root.OdysseyPolish?.normalizeRules)next=root.OdysseyPolish.normalizeRules(next);
    m.rules=next;m.designDisposition=PREFIX+'exact-wording';
    diffOverride(currentNumber,m);
    state.decisions[cardKey(currentNumber)]={
      cardId:cardKey(currentNumber),number:currentNumber,name:m.displayName||m.name,
      decision:'exact-wording',label:'Exact wording',detail:'Rules wording supplied directly in mechanics pass.',
      beforeRules:before,afterRules:next,note:$('mechanicsWordingNote').value.trim(),
      at:new Date().toISOString(),signature:signature(currentNumber)
    };
    persist();closeWording();renderPreview();advance();
  }
  function saveNoteOnly(){
    const m=model(currentNumber), r=record(currentNumber)||{};
    state.decisions[cardKey(currentNumber)]=Object.assign({},r,{
      cardId:cardKey(currentNumber),number:currentNumber,name:m.displayName||m.name,
      note:$('mechanicsWordingNote').value.trim(),at:new Date().toISOString(),
      signature:r.signature||''
    });
    persist();closeWording();refresh();
  }
  function exportReport(){
    const c=counts();
    const rows=CARDS.map(card=>{
      const n=card.number,m=model(n),r=record(n),choice=disposition(n);
      return {number:n,id:card.id,name:m.displayName,verified:isCurrentDecision(n),decision:r?.decision||choice||'',label:r?.label||'',note:r?.note||'',beforeRules:r?.beforeRules,afterRules:r?.afterRules,currentRules:m.rules,mechanics:m.mechanics,archetypes:m.archetypes};
    });
    const payload={schema:state.schema,exportedAt:new Date().toISOString(),datasetVersion:datasetId(),summary:c,cards:rows};
    if(typeof download==='function')download(`odyssey-mechanics-verification-${datasetId()}.json`,JSON.stringify(payload,null,2));
  }
  function open(){
    const dialog=$('mechanicsReviewDialog');if(!dialog)return;
    const first=nextPending(selected-1,1)??selected;
    currentNumber=first;
    if(!dialog.open)dialog.showModal();
    document.body.classList.add('mechanics-review-open');
    showCard(currentNumber);
  }
  function close(){
    const dialog=$('mechanicsReviewDialog');if(dialog?.open)dialog.close();
    document.body.classList.remove('mechanics-review-open');
  }
  function install(){
    if(root.OdysseyMechanicsReviewInstalled||typeof CARDS==='undefined'||typeof model!=='function'||typeof diffOverride!=='function')return;
    root.OdysseyMechanicsReviewInstalled=true;load();
    const button=document.createElement('button');
    button.id='openMechanicsReview';button.type='button';button.className='btn secondary';button.textContent='Mechanics pass';
    (document.querySelector('.top-actions')||document.querySelector('.topbar')||document.body).appendChild(button);
    const dialog=document.createElement('dialog');
    dialog.id='mechanicsReviewDialog';dialog.className='mechanics-review-dialog';
    dialog.innerHTML=`
      <div class="mechanics-review-shell">
        <header class="mechanics-review-head">
          <div><h2>Mechanics verification</h2><div id="mechanicsProgress"></div></div>
          <div class="mechanics-head-actions">
            <button type="button" class="btn secondary small" id="mechanicsBack">Previous</button>
            <button type="button" class="btn secondary small" id="mechanicsExact">Exact wording</button>
            <button type="button" class="btn secondary small" id="mechanicsClear">Clear choice</button>
            <button type="button" class="btn secondary small" id="mechanicsExport">Export</button>
            <button type="button" class="btn small" id="mechanicsClose">Close</button>
          </div>
        </header>
        <div class="mechanics-review-copy">
          <div><h3 id="mechanicsTitle"></h3><div id="mechanicsMeta"></div></div>
          <p id="mechanicsStory"></p>
          <p class="mechanics-instruction">Drag the card onto the direction you want. A choice advances automatically.</p>
        </div>
        <main class="mechanics-review-main">
          <div id="mechanicsCardHost" class="mechanics-card-host"></div>
          <div id="mechanicsOptions" class="mechanics-options" aria-label="Design direction options"></div>
        </main>
        <div id="mechanicsDecisionStatus" class="mechanics-decision-status" role="status" aria-live="polite"></div>
        <section id="mechanicsWordingPanel" class="mechanics-wording-panel" hidden>
          <div class="mechanics-wording-head"><div><h3>Exact rules wording</h3><p>Write the version you want on the card. Saving applies it directly to the Studio card override.</p></div><button type="button" class="btn secondary small" id="mechanicsWordingCancel">Back</button></div>
          <div class="mechanics-wording-grid">
            <div><label>Current wording</label><pre id="mechanicsWordingBefore"></pre></div>
            <div><label for="mechanicsWordingInput">Your wording</label><textarea id="mechanicsWordingInput" spellcheck="true"></textarea></div>
          </div>
          <label class="mechanics-note-label" for="mechanicsWordingNote">Optional design note</label>
          <textarea id="mechanicsWordingNote" class="mechanics-note" placeholder="Why this change, balance concern, alternative to test…"></textarea>
          <div class="mechanics-wording-actions">
            <button type="button" class="btn secondary" id="mechanicsNoteOnly">Save note only</button>
            <button type="button" class="btn" id="mechanicsWordingApply">Apply wording + verify</button>
          </div>
        </section>
      </div>`;
    document.body.appendChild(dialog);
    button.onclick=open;$('mechanicsClose').onclick=close;$('mechanicsBack').onclick=previousCard;
    $('mechanicsExact').onclick=openWording;$('mechanicsClear').onclick=clearDecision;$('mechanicsExport').onclick=exportReport;
    $('mechanicsWordingCancel').onclick=closeWording;$('mechanicsWordingApply').onclick=applyWording;$('mechanicsNoteOnly').onclick=saveNoteOnly;
    dialog.addEventListener('cancel',e=>{e.preventDefault();close()});
    dialog.addEventListener('close',()=>document.body.classList.remove('mechanics-review-open'));
    root.addEventListener('storage',e=>{if(e.key===storageKey()){load();refresh()}});
    root.OdysseyMechanicsReview={open,close,refresh,exportReport,counts,optionsFor,getState:()=>state};
  }
  if(typeof document!=='undefined'){
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
  }
})(typeof window==='undefined'?globalThis:window);
