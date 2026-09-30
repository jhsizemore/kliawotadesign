/* Island Together spatial logistics and local-impact layer.
   This extends the original card rules without requiring a new engine. */
const legacyStartGame = startGame;
const legacyResolveRound = resolveRound;
const legacyAdvance = advance;
const legacySnapshot = snapshot;

function activeScenarioData(){
  return typeof ISLAND_SCENARIOS!=='undefined' ? ISLAND_SCENARIOS[ACTIVE_SCENARIO_ID] : null;
}
function scenarioNodeData(id){ return activeScenarioData()?.nodes?.find(n=>n.id===id) || null; }
function ensureSpatialState(){
  if(!state) return;
  state.placements ??= [];
  state.construction ??= [];
  state.zoneStress ??= {};
  state.logistics ??= {caches:{},history:[],lastSeason:[]};
  state.logistics.caches ??= {};
  state.logistics.history ??= [];
  state.logistics.lastSeason ??= [];
}
function isRemoteLocation(zoneId){
  const n=scenarioNodeData(zoneId);
  if(!n) return false;
  return (n.island && n.island!=='main') || n.kind==='outer';
}
function projectCard(id){ return CARDS.find(c=>c.id===id); }
function reservedActiveSlots(){
  ensureSpatialState();
  return state.construction.filter(q=>projectCard(q.cardId)?.tag).length;
}
function localCache(zoneId){
  ensureSpatialState();
  return Math.max(0,Number(state.logistics.caches[zoneId]||0));
}
function changeLocalCache(zoneId,delta){
  ensureSpatialState();
  state.logistics.caches[zoneId]=Math.max(0,localCache(zoneId)+delta);
}
function completedProjectAt(zoneId,cardId){
  ensureSpatialState();
  return state.placements.some(p=>p.zoneId===zoneId&&p.cardId===cardId);
}
function completeSpatialProject(card,zoneId,startedRound=state.round,source='local'){
  ensureSpatialState();
  let effect={...card.effect};
  if(card.id==='stock'&&isRemoteLocation(zoneId)){
    const stored=Math.max(0,effect.supplies||0);
    delete effect.supplies;
    if(stored) changeLocalCache(zoneId,stored);
  }
  changeStats(effect);
  if(card.tag&&!state.active.includes(card.id)) state.active.push(card.id);
  else if(!card.tag&&!state.discard.includes(card.id)) state.discard.push(card.id);
  state.tags=state.active.map(id=>projectCard(id)?.tag).filter(Boolean);
  if(zoneId&&!state.placements.some(p=>p.cardId===card.id&&p.zoneId===zoneId)){
    state.placements.push({cardId:card.id,zoneId,round:state.round,startedRound,source});
  }
  if(zoneId&&state.zoneStress[zoneId]>0){
    state.zoneStress[zoneId]=Math.max(0,state.zoneStress[zoneId]-1);
  }
  const place=scenarioNodeData(zoneId)?.label;
  state.log.unshift({
    title:card.name,
    detail:`Project completed in round ${state.round}${place?' at '+place:''}.`
  });
}
function queueSpatialProject(card,zoneId,materialFromPort,cacheUsed){
  ensureSpatialState();
  state.construction.push({
    cardId:card.id,zoneId,startedRound:state.round,eta:1,status:'in-transit',
    materialFromPort,cacheUsed,delays:0
  });
  const place=scenarioNodeData(zoneId)?.label||'outer island';
  state.log.unshift({
    title:`${card.name} dispatched`,
    detail:`${materialFromPort} material${materialFromPort===1?'':'s'} sent from the main wharf to ${place}. The project will begin when freight arrives.`
  });
}
function playSpatialCard(id,retireId,zoneId){
  if(!state||state.phase!=='play') throw Error('Start a game first.');
  ensureSpatialState();
  if(state.played.length>=2) throw Error('The crew has already completed two projects this round.');
  if(!state.hand.includes(id)) throw Error('That project is not in the current hand.');
  const card=projectCard(id), baseCost=effectiveCost(card);
  const remote=isRemoteLocation(zoneId);
  const cached=remote?Math.min(baseCost[1],localCache(zoneId)):0;
  const portMaterial=Math.max(0,baseCost[1]-cached);
  if(state.stats.budget<baseCost[0]||state.stats.supplies<portMaterial) throw Error('Not enough funds or available materials.');
  const reserved=reservedActiveSlots();
  if(card.tag&&!state.active.includes(id)&&state.active.length+reserved>=ACTIVE_LIMIT){
    if(!retireId){
      state.pendingRetire={mode:'replace',newId:id,zoneId};
      save();render();return snapshot();
    }
    if(!state.active.includes(retireId)) throw Error('Choose an active project to retire.');
    retireProject(retireId);
  }
  state.pendingRetire=null;
  state.stats.budget-=baseCost[0];
  state.stats.supplies-=portMaterial;
  if(cached) changeLocalCache(zoneId,-cached);
  state.hand=state.hand.filter(x=>x!==id);
  state.played.push(id);

  const needsFreight=remote&&portMaterial>0;
  if(needsFreight) queueSpatialProject(card,zoneId,portMaterial,cached);
  else completeSpatialProject(card,zoneId,state.round,cached?'local-cache':'local');

  save();render();return snapshot();
}

// Spatial callers provide zoneId. Non-spatial callers retain the legacy card behavior.
const legacyPlayCard = playCard;
playCard = function(id,retireId,zoneId){
  if(zoneId) return playSpatialCard(id,retireId,zoneId);
  return legacyPlayCard(id,retireId);
};

function projectLocallyProtects(hazardId,zoneId){
  ensureSpatialState();
  const protectionTags=new Set((SHIELDS[hazardId]||[]).map(([tag])=>tag));
  const placed=state.placements.filter(p=>p.zoneId===zoneId);
  const protectors=[];
  for(const p of placed){
    const c=projectCard(p.cardId);
    if(!c?.tag||!protectionTags.has(c.tag)||!state.active.includes(c.id)) continue;
    protectors.push(c.name);
  }
  if(hazardId==='shipping'&&state.active.includes('wharf')&&completedProjectAt('port','wharf')){
    protectors.push('Maintained wharf');
  }
  return [...new Set(protectors)];
}
function applyLocalHazard(hazardId){
  ensureSpatialState();
  const scenario=activeScenarioData();
  const targets=scenario?.hazardTargets?.[hazardId]||[];
  const local=[];
  for(const zoneId of targets){
    const protectors=projectLocallyProtects(hazardId,zoneId);
    if(!protectors.length) state.zoneStress[zoneId]=Math.min(3,Number(state.zoneStress[zoneId]||0)+1);
    local.push({zoneId,protectedBy:protectors,stress:Number(state.zoneStress[zoneId]||0)});
  }
  state.lastEvent.local=local;
  return local;
}

resolveRound = function(){
  const result=legacyResolveRound();
  if(state?.phase==='event'&&state.lastEvent?.id){
    const local=applyLocalHazard(state.lastEvent.id);
    const protectedCount=local.filter(x=>x.protectedBy.length).length;
    const hitCount=local.length-protectedCount;
    state.logistics.lastSeason=[{
      type:'hazard-map',
      text:`${hitCount} place${hitCount===1?'':'s'} under local pressure${protectedCount?'; '+protectedCount+' protected by local projects':''}.`
    }];
    save();render();
  }
  return snapshot();
};

function freightIsDisrupted(item,hazardId){
  if(!isRemoteLocation(item.zoneId)) return false;
  if(hazardId==='cyclone') return true;
  if(hazardId==='shipping'){
    const maintained=state.active.includes('wharf')&&completedProjectAt('port','wharf');
    return !maintained;
  }
  return false;
}
function progressConstruction(hazardId){
  ensureSpatialState();
  const remaining=[],seasonNotes=[];
  for(const item of state.construction){
    const card=projectCard(item.cardId), place=scenarioNodeData(item.zoneId)?.label||item.zoneId;
    if(freightIsDisrupted(item,hazardId)){
      item.delays=(item.delays||0)+1;
      item.status='delayed';
      remaining.push(item);
      const msg=`${card.name} delayed en route to ${place} by ${HAZARDS.find(h=>h.id===hazardId)?.name||'bad conditions'}.`;
      seasonNotes.push({type:'delay',cardId:item.cardId,zoneId:item.zoneId,text:msg});
      state.log.unshift({title:'Freight delayed',detail:msg});
      continue;
    }
    item.eta=Math.max(0,(item.eta||1)-1);
    if(item.eta<=0){
      completeSpatialProject(card,item.zoneId,item.startedRound,'freight');
      const msg=`${card.name} materials arrived at ${place}; the project is now operating.`;
      seasonNotes.push({type:'arrival',cardId:item.cardId,zoneId:item.zoneId,text:msg});
    }else{
      item.status='in-transit';
      remaining.push(item);
    }
  }
  state.construction=remaining;
  if(seasonNotes.length) state.logistics.lastSeason=seasonNotes;
  state.logistics.history.push(...seasonNotes.map(x=>({...x,round:state.round})));
}

advance = function(){
  const previousRound=state?.round;
  const hazardId=state?.lastEvent?.id;
  const result=legacyAdvance();
  if(state?.phase==='play'&&state.round===previousRound+1){
    ensureSpatialState();
    progressConstruction(hazardId);
    save();render();
  }
  return snapshot();
};

startGame = function(n=selectedPlayers){
  const result=legacyStartGame(n);
  ensureSpatialState();
  state.scenarioId=ACTIVE_SCENARIO_ID;
  save();render();
  return snapshot();
};

snapshot = function(){
  const base=legacySnapshot();
  if(!state) return base;
  ensureSpatialState();
  return {
    ...base,
    scenarioId:state.scenarioId||ACTIVE_SCENARIO_ID,
    construction:state.construction.map(x=>({...x})),
    placements:state.placements.map(x=>({...x})),
    zoneStress:{...state.zoneStress},
    localCaches:{...state.logistics.caches}
  };
};

ensureSpatialState();
if(state){ state.scenarioId??=ACTIVE_SCENARIO_ID; save(); }
