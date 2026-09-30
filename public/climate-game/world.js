/* Map-first vertical slice.
   This layer intentionally sits on top of the existing rules so the spatial
   presentation can be tested before the rules engine is fully migrated. */
let worldDrawer = null;
let worldZoneId = null;
let pendingPlacementCard = null;
let pendingPlacementZone = null;

function worldScenario(){ const id=state?.scenarioId || (typeof selectedScenarioId!=='undefined'?selectedScenarioId:ACTIVE_SCENARIO_ID); return ISLAND_SCENARIOS[id] || ISLAND_SCENARIOS[ACTIVE_SCENARIO_ID]; }
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
function scenarioLandSvg(s){
  const land=(s.landforms||[]).map((shape,i)=>{
    const reef=shape.reef?`<path class="island reef-ring" d="${shape.d}" fill="none" stroke="#6ad0c0" stroke-opacity=".28" stroke-width="22"/>`:'';
    return `${reef}<path class="island scenario-island island-${shape.id||i}" d="${shape.d}" fill="url(#land)"/>`;
  }).join('');
  const features=(s.features||[]).map(f=>f.kind==='water'
    ?`<path class="scenario-water" d="${f.d}" fill="none" stroke="#71c4d0" stroke-width="11" stroke-linecap="round" opacity=".64"/>`
    :`<path class="scenario-feature" d="${f.d}" fill="none" stroke="#d8ddb4" stroke-width="5" opacity=".55"/>`).join('');
  return `<g filter="url(#shadow)">${land}</g>${features}`;
}
function scenarioRoadSvg(s){
  return `<g class="roads" fill="none" stroke="#e8ddaf" stroke-opacity=".75" stroke-width="6" stroke-linecap="round" stroke-dasharray="2 9">${(s.links||[]).filter(l=>l.mode!=='boat').map(l=>`<path d="${worldLinkPath(l.a,l.b)}" class="world-${l.mode||'path'}"/>`).join('')}</g>`;
}
function scenarioMiniMap(s){
  const boats=(s.links||[]).filter(l=>l.mode==='boat').map(l=>{const a=s.nodes.find(n=>n.id===l.a),b=s.nodes.find(n=>n.id===l.b);return a&&b?`<path d="M ${a.x*10.8} ${a.y*7.2} L ${b.x*10.8} ${b.y*7.2}" stroke="#91e4d7" stroke-width="5" stroke-dasharray="12 12" fill="none"/>`:''}).join('');
  return `<svg viewBox="0 0 1080 720" aria-hidden="true"><rect width="1080" height="720" fill="#0a3442"/>${(s.landforms||[]).map(x=>`<path d="${x.d}" fill="#5d9672" stroke="#84d0bf" stroke-width="9"/>`).join('')}${boats}</svg>`;
}
function worldMapMarkup(opts={}){
  const s=worldScenario(), hazardIds=opts.hazardId?[opts.hazardId]:(state?.forecast||[]);
  const risks=riskZones(hazardIds);
  const placementTargets=new Set(pendingPlacementCard?projectTargetsFor(pendingPlacementCard):[]);
  const freightTargets=new Set((state?.construction||[]).filter(q=>q.status==='in-transit'||q.status==='delayed').map(q=>q.zoneId));
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
      ${scenarioLandSvg(s)}
      ${scenarioRoadSvg(s)}
      <g class="routes ${shippingRisk?'route-risk':''}" fill="none">
        ${s.links.filter(l=>l.mode==='boat').map(l=>`<path d="${worldLinkPath(l.a,l.b)}" class="boat-route ${freightTargets.has(l.b)?'freight-active':''}"/>`).join('')}
      </g>
      <g class="map-decor" opacity=".8">
        <circle cx="523" cy="188" r="5" fill="#d6e9a4"/><circle cx="550" cy="167" r="4" fill="#d6e9a4"/><circle cx="609" cy="205" r="5" fill="#d6e9a4"/>
        <circle cx="930" cy="508" r="4" fill="#d6e9a4"/><circle cx="169" cy="173" r="4" fill="#d6e9a4"/>
      </g>
    </svg>
    <div class="world-scenario-label"><span>Scenario</span><strong>${s.name}</strong><small>${s.strap}</small></div>
    ${(state?.construction||[]).filter(q=>q.status==='in-transit'||q.status==='delayed').map((q,i)=>{
      const from=worldNode('port'),to=worldNode(q.zoneId);
      if(!from||!to) return '';
      const x=from.x+(to.x-from.x)*.52,y=from.y+(to.y-from.y)*.52;
      return `<button class="freight-boat ${q.status==='delayed'?'delayed':''}" style="--x:${x}%;--y:${y}%;--delay:${i*.18}s" data-world-zone="${q.zoneId}" aria-label="Freight for ${CARDS.find(card=>card.id===q.cardId)?.name||'project'} to ${to.label}">${icon('outrigger')}<span>${q.materialFromPort||1}</span></button>`;
    }).join('')}
    ${s.nodes.map(z=>{
      const projects=projectsAtZone(z.id), construction=constructionAtZone(z.id), risk=risks.has(z.id), buildTarget=placementTargets.has(z.id);
      const cache=Number(state?.logistics?.caches?.[z.id]||0);
      return `<button class="world-node ${zoneStateClass(z)} ${risk?'at-risk':''} ${projects.length?'developed':''} ${construction.length?'constructing':''} ${cache?'cached':''} ${buildTarget?'build-target':''}" style="--x:${z.x}%;--y:${z.y}%;" data-world-zone="${z.id}" aria-label="${z.label}. ${risk?'Forecast risk. ':''}${construction.length?'Freight underway. ':''}${cache?'Local materials '+cache+'. ':''}${buildTarget?'Valid project location. ':''}${projects.length?projects.length+' project present. ':''}">
        <span class="node-pin">${icon(worldNodeIcon(z.kind))}</span>
        <span class="node-label">${z.short}</span>
        ${projects.length?`<span class="node-project-count">+${projects.length}</span>`:''}
        ${construction.length?`<span class="node-construction">${icon('builder')}<b>${construction.length}</b></span>`:''}
        ${cache?`<span class="node-cache">${icon('materials')}<b>${cache}</b></span>`:''}
      </button>`;
    }).join('')}
    <div class="map-legend"><span><i class="risk-dot"></i> forecast exposure</span><span><i class="project-dot"></i> project built</span>${state?.construction?.some(q=>q.status==='in-transit'||q.status==='delayed')?`<span><i class="freight-dot"></i> ${state.construction.filter(q=>q.status==='in-transit'||q.status==='delayed').length} freight at sea</span>`:''}</div>
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
  const targets=projectTargetsFor(card.id).map(worldNode).filter(Boolean), buildTime=typeof projectBuildTime==='function'?projectBuildTime(card):0;
  return `<section class="world-sheet placement-sheet" aria-label="Choose where to build">
    <header><div><span class="eyebrow">Place this project</span><strong>${card.name}</strong></div><button data-world-action="close" aria-label="Cancel placement">×</button></header>
    <div class="placement-copy"><span class="placement-icon">${icon(TYPE_ICONS[card.type])}</span><p>Choose where this project will operate. Outer-island projects that need materials must wait for freight unless a local cache can cover the material cost.</p></div>
    <div class="placement-options">${targets.map(z=>{const cache=Number(state?.logistics?.caches?.[z.id]||0),cost=effectiveCost(card)[1],remote=isRemoteLocation(z.id),needs=Math.max(0,cost-cache);const note=remote&&cost?(cache>=cost?(buildTime?'Local cache · about 1 season to build':'Local cache · build now'):`Needs ${needs} material${needs===1?'':'s'} by boat · ${buildTime?'freight + construction':'about 1 season'}`):(remote?(buildTime?'No freight needed · about 1 season to build':'No material freight needed'):(buildTime?'Road-connected · about 1 season to build':'Road-connected'));return `<button data-world-zone="${z.id}" class="placement-option">${icon(worldNodeIcon(z.kind))}<span><b>${z.label}</b><small>${note}</small></span></button>`}).join('')}</div>
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
  const construction=constructionAtZone(z.id),cache=Number(state?.logistics?.caches?.[z.id]||0),stress=Number(state?.zoneStress?.[z.id]||0);
  const relevant=CARDS.filter(c=>projectTargetsFor(c.id).includes(z.id)).slice(0,4);
  return `<section class="world-sheet zone-sheet" aria-label="${z.label}">
    <header><div><span class="eyebrow">${z.kind==='outer'?'Outer-island community':'Island place'}</span><strong>${z.label}</strong></div><button data-world-action="close" aria-label="Close place">×</button></header>
    <div class="zone-state-row"><span class="zone-big-icon">${icon(worldNodeIcon(z.kind))}</span><div><b class="zone-condition ${zoneStateClass(z)}">${value<=1?'Critical':value<=2?'Under pressure':value>=5?'Strong':'Holding'}</b><p>${z.note}</p></div></div>
    <div class="zone-logistics"><div><span>Local pressure</span><b>${stress?stress+' / 3':'None'}</b></div><div><span>Stored materials</span><b>${cache}</b></div><div><span>Freight / works</span><b>${construction.length}</b></div></div>
    ${construction.length?`<div class="zone-construction"><span>Freight / works</span>${construction.map(q=>`<div>${icon(q.status==='building'?'builder':'shipping')}<b>${CARDS.find(c=>c.id===q.cardId)?.name}</b><small>${q.status==='building'?'Under construction · expected next season':q.status==='delayed'?'Freight delayed by this season':'Materials at sea · expected next season if the route stays open'}</small></div>`).join('')}</div>`:''}
    <div class="zone-projects"><span>Projects here</span>${projects.length?projects.map(id=>`<b>${CARDS.find(c=>c.id===id).name}</b>`).join(''):'<small>Nothing built here yet.</small>'}</div>
    <div class="zone-relevant"><span>Useful options in the deck</span><div>${relevant.map(c=>`<button data-world-action="projects" data-world-focus-id="${c.id}">${icon(TYPE_ICONS[c.type])}<span>${c.name}</span></button>`).join('')}</div></div>
  </section>`;
}
function evaluateScenarioGoal(goal){
  if(!state) return {done:false,value:0};
  if(typeof ensureSpatialState==='function') ensureSpatialState();
  if(goal.kind==='condition'){const value=Number(state.stats?.[goal.key]||0);return {done:value>=goal.target,value};}
  if(goal.kind==='min_condition'){const value=Math.min(...CONDITIONS.map(k=>Number(state.stats?.[k]||0)));return {done:value>=goal.target,value};}
  if(goal.kind==='max_stress'){const value=Math.max(0,...Object.values(state.zoneStress||{}).map(Number));return {done:value<=goal.target,value};}
  if(goal.kind==='remote_projects'){const zones=new Set((state.placements||[]).filter(p=>typeof isRemoteLocation==='function'&&isRemoteLocation(p.zoneId)).map(p=>p.zoneId));return {done:zones.size>=goal.target,value:zones.size};}
  return {done:false,value:0};
}
function scenarioGoalResults(){return (worldScenario().goals||[]).map(goal=>({goal,...evaluateScenarioGoal(goal)}));}
function worldMissionSheet(){
  if(worldDrawer!=='mission') return '';
  const s=worldScenario(),goals=scenarioGoalResults();
  return `<section class="world-sheet mission-sheet" aria-label="${s.name} mission">
    <header><div><span class="eyebrow">Scenario mission</span><strong>${s.name}</strong></div><button data-world-action="close" aria-label="Close mission">×</button></header>
    <p class="mission-briefing">${s.briefing||s.summary}</p>
    <div class="mission-goals">${goals.map(x=>`<div class="${x.done?'complete':''}"><span>${x.done?'✓':'○'}</span><b>${x.goal.label}</b><small>${x.goal.kind==='max_stress'?'Current max pressure '+x.value:'Progress '+x.value+' / '+x.goal.target}</small></div>`).join('')}</div>
    <p class="mission-note">The map is fictional. The scenario combines real categories of Pacific development and climate risk for play and discussion.</p>
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
    ${(()=>{const g=scenarioGoalResults(),done=g.filter(x=>x.done).length;return `<button class="world-mission" data-world-action="mission"><small>Mission</small><b>${done}/${g.length}</b></button>`})()}
    <button class="world-forecast" data-panel="forecast">${icon('forecast')}<span><small>Forecast · one arrives</small><b>${watches.join(' · ')}</b></span></button>
    <button class="world-service" data-panel="active"><small>In service</small><b>${state.active.length}/${ACTIVE_LIMIT}</b></button>
  </main>${worldBottomBar()}${worldProjectSheet()}${worldZoneSheet()}${worldPlacementSheet()}${worldMissionSheet()}</div>`;
};

const legacySetupHtmlWorld=setupHtml;
setupHtml=function(){
  const scenarios=Object.values(ISLAND_SCENARIOS);
  return `<div class="frame scenario-setup-screen"><header class="game-top"><a class="game-brand" href="/"><span class="brand-wave">${icon('outrigger')}</span><span>Island Together</span></a><span class="setup-label">Pacific climate game</span></header>
    <main class="scenario-setup-main"><section class="scenario-intro"><div class="eyebrow">Choose a fictional Pacific scenario</div><h1>Build together before the season turns.</h1><p>Each map changes what matters: distance, freshwater, freight and exposure shape the projects your council needs.</p></section>
    <section class="scenario-picker">${scenarios.map(s=>`<button data-scenario="${s.id}" aria-pressed="${selectedScenarioId===s.id}"><span class="scenario-preview">${scenarioMiniMap(s)}</span><span class="scenario-copy"><small>${s.topology.replaceAll('-',' ')}</small><b>${s.name}</b><em>${s.summary}</em></span></button>`).join('')}</section>
    <section class="setup-controls scenario-controls" aria-label="New game"><span>How many players?</span><div class="player-choice" role="group" aria-label="Players">${[2,3,4].map(n=>`<button data-players="${n}" aria-pressed="${selectedPlayers===n}">${n}</button>`).join('')}</div><button class="primary" data-action="start">Start ${ISLAND_SCENARIOS[selectedScenarioId]?.shortName||'scenario'}</button><small>About 15–25 minutes · pass one device or project it for a group</small></section></main></div>`;
};

const legacyResultHtmlWorld=resultHtml;
resultHtml=function(){
  const s=worldScenario(),goals=scenarioGoalResults(),completed=goals.filter(x=>x.done).length;
  const values=CONDITIONS.map(k=>state.stats[k]),sum=values.reduce((a,b)=>a+b,0),min=Math.min(...values);
  const grade=min===0?'Strained':sum>=19&&min>=3?'Resilient':sum>=12?'Holding on':'Strained';
  return `<div class="frame result-screen world-result"><header class="game-top"><span class="game-brand"><span class="brand-wave">${icon('outrigger')}</span>Island Together</span><span class="season-marker">Six seasons complete</span></header>
    <main class="world-result-main"><div class="eyebrow">${s.name}</div><div class="result-header"><div><span>Island outcome</span><h1>${grade}</h1></div><div class="total-score"><strong>${sum}</strong><span>/ 24</span></div></div>
    <div class="result-grid">${CONDITIONS.map(k=>`<div style="--accent:${COLORS[k]}"><span class="result-name">${icon(STAT_ICONS[k])}${LABELS[k]}</span><strong>${state.stats[k]} <small>/ 6</small></strong><i><em style="width:${state.stats[k]/6*100}%"></em></i></div>`).join('')}</div>
    <section class="result-mission"><div><span>Scenario objectives</span><strong>${completed} / ${goals.length}</strong></div>${goals.map(x=>`<p class="${x.done?'complete':''}"><span>${x.done?'✓':'○'}</span><b>${x.goal.label}</b></p>`).join('')}</section>
    <div class="result-foot"><p>${state.placements?.length||0} projects operating · ${state.construction?.length||0} still in freight or construction</p><p>The score is a game summary, not a real-world resilience assessment. Compare the choices your group made and what the map exposed.</p></div>
    <button class="primary" data-action="restart">Choose another scenario</button></main></div>`;
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
      ${r.local?.length?`<div class="local-impact-summary"><b>${r.local.filter(x=>!x.protectedBy.length).length}</b> places took local pressure · <b>${r.local.filter(x=>x.protectedBy.length).length}</b> protected locally</div>`:''}
      ${state?.logistics?.lastSeason?.some(x=>x.type==='delay')?`<div class="freight-impact">${icon('shipping')}<span><b>Freight interrupted</b><small>${state.logistics.lastSeason.filter(x=>x.type==='delay').map(x=>x.text).join(' ')}</small></span></div>`:''}
      <div class="impact-actions"><a href="${SOURCES.find(s=>s.id===e.source).url}" target="_blank" rel="noopener noreferrer">Why this matters ↗</a><button class="primary" data-action="advance">${state.round===6?'See score card':'Next season'}</button></div>
    </section>
  </main></div>`;
};

// Spatial build interception runs in capture phase so the legacy card handler
// cannot complete a project before the player has chosen its place.
app.addEventListener('click',e=>{
  const scenario=e.target.closest('[data-scenario]');
  if(scenario&&!state){selectedScenarioId=scenario.dataset.scenario;render();return;}
},true);

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
    if(action.dataset.worldAction==='mission'){worldDrawer='mission';worldZoneId=null;render();return}
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
