/* Map-first vertical slice.
   This layer intentionally sits on top of the existing rules so the spatial
   presentation can be tested before the rules engine is fully migrated. */
let worldDrawer = null;
let worldZoneId = null;
let pendingPlacementCard = null;
let pendingPlacementZone = null;

function worldScenario(){ return ISLAND_SCENARIOS[ACTIVE_SCENARIO_ID]; }
function worldNode(id){ return worldScenario().nodes.find(n=>n.id===id); }
function worldNodeIcon(kind){
  return ({port:'shipping',town:'community',clinic:'health',school:'shelter',gardens:'food',water:'water',village:'shelter',outer:'outrigger'})[kind] || 'community';
}
function builtProjectIds(){
  if(!state) return [];
  const builtNames = new Set((state.log||[]).filter(x=>String(x.detail||'').startsWith('Project completed')).map(x=>x.title));
  return CARDS.filter(c=>builtNames.has(c.name)).map(c=>c.id);
}
function projectTargetsFor(id){ return worldScenario().projectTargets[id] || []; }
function projectsAtZone(zoneId){
  const placed=(state?.placements||[]).filter(p=>p.zoneId===zoneId).map(p=>p.cardId);
  if(placed.length) return [...new Set(placed)];
  // Older saves predate spatial placement. Keep them visible at their first sensible target.
  return builtProjectIds().filter(id=>(projectTargetsFor(id)[0]||'')===zoneId);
}
function constructionAtZone(zoneId){
  return (state?.construction||[]).filter(q=>q.zoneId===zoneId);
}
function zoneCondition(zone){
  if(!state) return 3;
  const keys=zone.stats.filter(k=>state.stats[k]!==undefined);
  const base=keys.length?Math.min(...keys.map(k=>state.stats[k])):3;
  const stress=Number(state.zoneStress?.[zone.id]||0);
  return Math.max(0,base-stress);
}
function zoneStateClass(zone){
  const v=zoneCondition(zone);
  return v<=1?'critical':v<=2?'stressed':v>=5?'strong':'steady';
}
function riskZones(hazardIds){
  const out=new Set();
  (hazardIds||[]).forEach(id=>(worldScenario().hazardTargets[id]||[]).forEach(z=>out.add(z)));
  return out;
}
function worldLinkPath(a,b){
  const n1=worldNode(a),n2=worldNode(b);
  const x1=n1.x*10.8,y1=n1.y*7.2,x2=n2.x*10.8,y2=n2.y*7.2;
  const mx=(x1+x2)/2, lift=Math.abs(x2-x1)>.24*1080?-70:-20;
  return `M ${x1} ${y1} Q ${mx} ${(y1+y2)/2+lift} ${x2} ${y2}`;
}
function worldMapMarkup(opts={}){
  const s=worldScenario(), hazardIds=opts.hazardId?[opts.hazardId]:(state?.forecast||[]);
  const risks=riskZones(hazardIds);
  const placementTargets=new Set(pendingPlacementCard?projectTargetsFor(pendingPlacementCard):[]);
  const shippingRisk=hazardIds.some(id=>['shipping','cyclone','fuel'].includes(id));
  return `<section class="world-board ${opts.resolving?'resolving':''}" aria-label="${s.name} map">
    <svg class="world-map-art" viewBox="0 0 1080 720" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="ocean" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b4050"/><stop offset="1" stop-color="#062b38"/></linearGradient>
        <linearGradient id="land" x1="0" y1="0" x2="0.9" y2="1"><stop offset="0" stop-color="#87b77e"/><stop offset=".58" stop-color="#4e8c6d"/><stop offset="1" stop-color="#2e675b"/></linearGradient>
        <linearGradient id="highland" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#557e61"/><stop offset="1" stop-color="#275b54"/></linearGradient>
        <filter id="shadow"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#001b23" flood-opacity=".45"/></filter>
      </defs>
      <rect width="1080" height="720" fill="url(#ocean)"/>
      <g class="sea-lines" fill="none" stroke="#5fb7bb" stroke-opacity=".11" stroke-width="2">
        <path d="M0 110 C210 90 290 145 470 122 S790 92 1080 118"/>
        <path d="M0 190 C180 175 330 220 520 194 S850 165 1080 196"/>
        <path d="M0 610 C250 580 360 640 590 610 S875 574 1080 604"/>
      </g>
      <g filter="url(#shadow)">
        <path class="island reef-ring" d="M238 178 C330 110 480 90 655 126 C783 152 866 235 838 330 C815 411 746 454 712 530 C672 616 552 637 446 590 C351 548 292 489 278 409 C264 333 190 287 238 178Z" fill="none" stroke="#6ad0c0" stroke-opacity=".30" stroke-width="25"/>
        <path class="island main-island" d="M250 179 C337 118 474 105 641 137 C754 159 826 235 806 317 C786 396 714 446 687 519 C661 590 560 607 465 568 C371 529 317 474 302 401 C289 336 221 276 250 179Z" fill="url(#land)"/>
        <path d="M395 185 C472 133 585 145 664 190 C715 219 734 263 708 304 C682 344 621 335 588 372 C548 417 511 450 454 418 C401 388 368 326 356 266 C349 231 366 205 395 185Z" fill="url(#highland)" opacity=".74"/>
        <path d="M570 200 C546 249 532 298 522 355 C516 394 503 431 469 472" fill="none" stroke="#71c4d0" stroke-width="11" stroke-linecap="round" opacity=".64"/>
        <path class="island reef-ring" d="M90 104 C145 66 235 78 273 128 C304 169 277 231 226 256 C171 284 89 261 63 207 C43 166 55 129 90 104Z" fill="none" stroke="#6ad0c0" stroke-opacity=".27" stroke-width="19"/>
        <path class="island north-island" d="M95 115 C145 83 220 90 250 132 C276 169 252 217 211 237 C164 260 101 239 80 201 C62 168 67 134 95 115Z" fill="url(#land)"/>
        <path class="island reef-ring" d="M865 405 C933 379 1010 409 1033 468 C1055 523 1010 583 945 597 C884 610 824 568 820 510 C817 463 831 423 865 405Z" fill="none" stroke="#6ad0c0" stroke-opacity=".27" stroke-width="20"/>
        <path class="island east-island" d="M873 421 C929 399 987 420 1007 469 C1026 515 991 561 941 572 C891 582 846 550 842 506 C839 468 848 435 873 421Z" fill="url(#land)"/>
      </g>
      <g class="roads" fill="none" stroke="#e8ddaf" stroke-opacity=".75" stroke-width="6" stroke-linecap="round" stroke-dasharray="2 9">
        <path d="M464 482 Q527 404 562 353 Q622 315 691 309"/>
        <path d="M562 353 Q688 368 734 412"/>
        <path d="M562 353 Q516 286 508 239"/>
        <path d="M562 353 Q420 344 335 338"/>
      </g>
      <g class="routes ${shippingRisk?'route-risk':''}" fill="none">
        ${s.links.filter(l=>l.mode==='boat').map(l=>`<path d="${worldLinkPath(l.a,l.b)}" class="boat-route"/>`).join('')}
      </g>
      <g class="map-decor" opacity=".8">
        <circle cx="523" cy="188" r="5" fill="#d6e9a4"/><circle cx="550" cy="167" r="4" fill="#d6e9a4"/><circle cx="609" cy="205" r="5" fill="#d6e9a4"/>
        <circle cx="930" cy="508" r="4" fill="#d6e9a4"/><circle cx="169" cy="173" r="4" fill="#d6e9a4"/>
      </g>
    </svg>
    <div class="world-scenario-label"><span>Scenario</span><strong>${s.name}</strong><small>${s.strap}</small></div>
    ${s.nodes.map(z=>{
      const projects=projectsAtZone(z.id), risk=risks.has(z.id), buildTarget=placementTargets.has(z.id);
      return `<button class="world-node ${zoneStateClass(z)} ${risk?'at-risk':''} ${projects.length?'developed':''} ${buildTarget?'build-target':''}" style="--x:${z.x}%;--y:${z.y}%;" data-world-zone="${z.id}" aria-label="${z.label}. ${risk?'Forecast risk. ':''}${buildTarget?'Valid project location. ':''}${projects.length?projects.length+' project present. ':''}">
        <span class="node-pin">${icon(worldNodeIcon(z.kind))}</span>
        <span class="node-label">${z.short}</span>
        ${projects.length?`<span class="node-project-count">+${projects.length}</span>`:''}
      </button>`;
    }).join('')}
    <div class="map-legend"><span><i class="risk-dot"></i> forecast exposure</span><span><i class="project-dot"></i> project built</span></div>
  </section>`;
}
function worldResourceStrip(){
  return `<div class="world-resource-strip" aria-label="Island conditions">
    ${CONDITIONS.map(k=>`<button data-panel="conditions" style="--stat:${COLORS[k]}" aria-label="${LABELS[k]} ${state.stats[k]} of 6">${icon(STAT_ICONS[k])}<b>${state.stats[k]}</b><small>/6</small></button>`).join('')}
    <button data-panel="conditions" class="shared">${icon('funds')}<b>${state.stats.budget}</b></button>
    <button data-panel="conditions" class="shared">${icon('materials')}<b>${state.stats.supplies}</b></button>
  </div>`;
}
function worldProjectSheet(){
  if(worldDrawer!=='projects') return '';
  const slots=2-state.played.length;
  return `<section class="world-sheet project-sheet" aria-label="Project hand">
    <header><div><span class="eyebrow">Council project hand</span><strong>${slots} action${slots===1?'':'s'} left this season</strong></div><button data-world-action="close" aria-label="Close projects">×</button></header>
    <div class="world-focus-zone"><button class="cycle-button" data-focus="-1" aria-label="Previous project">‹</button>${focusedProject()}<button class="cycle-button" data-focus="1" aria-label="Next project">›</button></div>
    <div class="world-project-tabs">${state.hand.map((id,i)=>`<button data-card-index="${i}" aria-pressed="${i===((focusIndex%state.hand.length)+state.hand.length)%state.hand.length}"><span>${String(i+1).padStart(2,'0')}</span><b>${CARDS.find(c=>c.id===id).name}</b></button>`).join('')}</div>
  </section>`;
}
function worldPlacementSheet(){
  if(worldDrawer!=='placement'||!pendingPlacementCard) return '';
  const card=CARDS.find(c=>c.id===pendingPlacementCard);
  const targets=projectTargetsFor(card.id).map(worldNode).filter(Boolean);
  return `<section class="world-sheet placement-sheet" aria-label="Choose where to build">
    <header><div><span class="eyebrow">Place this project</span><strong>${card.name}</strong></div><button data-world-action="close" aria-label="Cancel placement">×</button></header>
    <div class="placement-copy"><span class="placement-icon">${icon(TYPE_ICONS[card.type])}</span><p>Choose the community or site where this project will operate. Its marker will stay on the island after it is built.</p></div>
    <div class="placement-options">${targets.map(z=>`<button data-world-zone="${z.id}" class="placement-option">${icon(worldNodeIcon(z.kind))}<span><b>${z.label}</b><small>${z.note}</small></span></button>`).join('')}</div>
  </section>`;
}
function worldPlaceAndBuild(cardId,zoneId,retireId){
  pendingPlacementZone=zoneId;
  pendingPlacementCard=cardId;
  worldDrawer=null;
  playCard(cardId,retireId,zoneId);
  if(state.pendingRetire){
    // Replacement is still unresolved; keep the intended location until the player retires a project.
    return;
  }
  pendingPlacementCard=null;
  pendingPlacementZone=null;
  save();
  render();
}
function worldZoneSheet(){
  if(worldDrawer!=='zone'||!worldZoneId) return '';
  const z=worldNode(worldZoneId), projects=projectsAtZone(z.id), value=zoneCondition(z);
  const relevant=CARDS.filter(c=>projectTargetsFor(c.id).includes(z.id)).slice(0,4);
  return `<section class="world-sheet zone-sheet" aria-label="${z.label}">
    <header><div><span class="eyebrow">${z.kind==='outer'?'Outer-island community':'Island place'}</span><strong>${z.label}</strong></div><button data-world-action="close" aria-label="Close place">×</button></header>
    <div class="zone-state-row"><span class="zone-big-icon">${icon(worldNodeIcon(z.kind))}</span><div><b class="zone-condition ${zoneStateClass(z)}">${value<=1?'Critical':value<=2?'Under pressure':value>=5?'Strong':'Holding'}</b><p>${z.note}</p></div></div>
    <div class="zone-projects"><span>Projects here</span>${projects.length?projects.map(id=>`<b>${CARDS.find(c=>c.id===id).name}</b>`).join(''):'<small>Nothing built here yet.</small>'}</div>
    <div class="zone-relevant"><span>Useful options in the deck</span><div>${relevant.map(c=>`<button data-world-action="projects" data-world-focus-id="${c.id}">${icon(TYPE_ICONS[c.type])}<span>${c.name}</span></button>`).join('')}</div></div>
  </section>`;
}
function worldBottomBar(){
  const role=currentRole(),slots=2-state.played.length,i=(state.round-1)%state.players;
  return `<footer class="world-action-bar">
    <button class="world-role" data-panel="leader" style="--role:${roleArt(role).color}"><span>${roleIconMarkup(role)}</span><small>P${i+1} leads</small></button>
    <button class="world-project-button" data-world-action="projects"><span>${icon('materials')}</span><b>Projects</b><small>${slots} action${slots===1?'':'s'} left</small></button>
    <button class="world-effort-button" data-panel="effort" ${state.recoveryUsed||slots===0?'disabled':''}><span>${icon('effort')}</span><b>Community</b></button>
    <button class="primary world-face-button" data-action="resolve"><span>${icon('warning')}</span><b>Face the season</b></button>
  </footer>`;
}
gameHtml = function(){
  const watches=state.forecast.map(id=>HAZARDS.find(h=>h.id===id).watch);
  return `<div class="frame world-game">${compactHeader()}<main class="world-stage">
    ${worldMapMarkup()}
    ${worldResourceStrip()}
    <button class="world-forecast" data-panel="forecast">${icon('forecast')}<span><small>Forecast · one arrives</small><b>${watches.join(' · ')}</b></span></button>
    <button class="world-service" data-panel="active"><small>In service</small><b>${state.active.length}/${ACTIVE_LIMIT}</b></button>
  </main>${worldBottomBar()}${worldProjectSheet()}${worldZoneSheet()}${worldPlacementSheet()}</div>`;
};

eventHtml = function(){
  const e=HAZARDS.find(x=>x.id===state.lastEvent.id),r=state.lastEvent;
  if(state.eventStage==='reveal'){
    return `<div class="frame world-game world-event">${compactHeader()}<main class="world-stage">${worldMapMarkup({hazardId:e.id,resolving:true})}
      <section class="world-hazard-card"><span class="hazard-glyph">${icon('warning')}</span><div><span class="eyebrow">The season turns</span><h1>${e.name}</h1><p>${e.story}</p></div><button class="primary" data-action="impact">See the impact</button></section>
    </main></div>`;
  }
  return `<div class="frame world-game world-event world-impact">${compactHeader()}<main class="world-stage">${worldMapMarkup({hazardId:e.id,resolving:true})}
    <section class="world-impact-sheet"><header><div><span class="eyebrow">Season ${state.round} impact</span><h1>${e.name}</h1></div></header>
      <div class="impact-mini-grid">${Object.entries(e.base).map(([k])=>`<div>${icon(STAT_ICONS[k])}<span>${LABELS[k]}</span><strong>${r.actual[k]===0?'Held':r.actual[k]}</strong></div>`).join('')}</div>
      <p class="impact-protection">${r.mitigated.length?`Protected by ${r.mitigated.join(', ')}.`:'No active project blocked this hazard.'}</p>
      <div class="impact-actions"><a href="${SOURCES.find(s=>s.id===e.source).url}" target="_blank" rel="noopener noreferrer">Why this matters ↗</a><button class="primary" data-action="advance">${state.round===6?'See score card':'Next season'}</button></div>
    </section>
  </main></div>`;
};

// Spatial build interception runs in capture phase so the legacy card handler
// cannot complete a project before the player has chosen its place.
app.addEventListener('click',e=>{
  const replace=e.target.closest('[data-replace-retire]');
  if(replace&&pendingPlacementCard&&pendingPlacementZone&&state?.pendingRetire){
    e.preventDefault();
    e.stopImmediatePropagation();
    const cardId=pendingPlacementCard,zoneId=pendingPlacementZone;
    worldPlaceAndBuild(cardId,zoneId,replace.dataset.replaceRetire);
    return;
  }
  const play=e.target.closest('[data-play]');
  if(!play||!state||state.phase!=='play') return;
  const id=play.dataset.play, targets=projectTargetsFor(id);
  if(!targets.length) return;
  e.preventDefault();
  e.stopImmediatePropagation();
  if(targets.length===1) worldPlaceAndBuild(id,targets[0]);
  else {
    pendingPlacementCard=id;
    pendingPlacementZone=null;
    worldDrawer='placement';
    worldZoneId=null;
    render();
  }
},true);

app.addEventListener('click',e=>{
  const zone=e.target.closest('[data-world-zone]');
  if(zone){
    if(worldDrawer==='placement'&&pendingPlacementCard){
      const target=zone.dataset.worldZone;
      if(projectTargetsFor(pendingPlacementCard).includes(target)) worldPlaceAndBuild(pendingPlacementCard,target);
      return;
    }
    worldZoneId=zone.dataset.worldZone;
    worldDrawer='zone';
    render();
    return;
  }
  const action=e.target.closest('[data-world-action]');
  if(action){
    if(action.dataset.worldAction==='close'){worldDrawer=null;worldZoneId=null;pendingPlacementCard=null;pendingPlacementZone=null;render();return}
    if(action.dataset.worldAction==='projects'){
      worldDrawer='projects';worldZoneId=null;
      if(action.dataset.worldFocusId){
        const idx=state.hand.indexOf(action.dataset.worldFocusId);
        if(idx>=0)focusIndex=idx;
      }
      render();return;
    }
  }
});
render();
