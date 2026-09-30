/* Island Together spatial logistics and local-impact layer.
   This extends the original card rules without requiring a new engine. */
const legacyStartGame = startGame;
const legacyResolveRound = resolveRound;
const legacyAdvance = advance;
const legacySnapshot = snapshot;

const PROJECT_BUILD_TIME = Object.freeze({
  tank:1, spring:1, beds:1, roofs:1, school:1, drain:1, paths:1, wharf:1
});
function projectBuildTime(card){ return Math.max(0,PROJECT_BUILD_TIME[card?.id]||0); }

function activeScenarioData(){
  const id=state?.scenarioId || (typeof selectedScenarioId!=='undefined'?selectedScenarioId:ACTIVE_SCENARIO_ID);
  return typeof ISLAND_SCENARIOS!=='undefined' ? ISLAND_SCENARIOS[id] : null;
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
  const special=activeScenarioData()?.special;
  if(special?.kind==='relocation'){
    state.relocation ??= {households:special.households||3,moved:0,sites:{},usedThisSeason:false,unplannedEvents:0,lastForcedRound:null};
    state.relocation.sites ??= {};
    state.relocation.households ??= special.households||3;
    state.relocation.moved ??= Object.values(state.relocation.sites).reduce((a,b)=>a+Number(b||0),0);
    state.relocation.usedThisSeason ??= false;
    state.relocation.unplannedEvents ??= 0;
  }
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
function relocationReadiness(zoneId){
  ensureSpatialState();
  const special=activeScenarioData()?.special;
  if(special?.kind!=='relocation'||!special.candidates?.includes(zoneId)) return null;
  const have=new Set(special.baseline?.[zoneId]||[]);
  for(const p of state.placements.filter(p=>p.zoneId===zoneId)){
    const card=projectCard(p.cardId);
    if(card?.type==='Water') have.add('water');
    if(card?.type==='Shelter') have.add('shelter');
    if(card?.type==='Community'||card?.type==='Logistics') have.add('access');
  }
  const required=['water','shelter','access'];
  return {zoneId,have:[...have],required,ready:required.every(x=>have.has(x)),missing:required.filter(x=>!have.has(x))};
}
function moveRelocationHousehold(zoneId){
  if(!state||state.phase!=='play') throw Error('Relocation decisions happen during planning.');
  ensureSpatialState();
  const special=activeScenarioData()?.special,ready=relocationReadiness(zoneId);
  if(special?.kind!=='relocation'||!ready) throw Error('This is not a receiving site.');
  if(!ready.ready) throw Error('The receiving site still needs water, shelter and access.');
  if(state.relocation.moved>=state.relocation.households) throw Error('All households in this scenario already have a planned pathway.');
  if(state.relocation.usedThisSeason) throw Error('Only one household transition can be supported per season.');
  if(state.played.length>=2) throw Error('The council has already used both actions this season.');
  if(state.stats.budget<1) throw Error('Supporting a household transition needs 1 fund.');
  state.stats.budget-=1;
  state.played.push(`relocation:${zoneId}`);
  state.relocation.usedThisSeason=true;
  state.relocation.sites[zoneId]=Number(state.relocation.sites[zoneId]||0)+1;
  state.relocation.moved+=1;
  const place=scenarioNodeData(zoneId)?.label||zoneId;
  state.log.unshift({title:'Planned transition',detail:`One household moved through a prepared pathway to ${place}.`});
  save();render();return snapshot();
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
    materialFromPort,cacheUsed,delays:0,buildRemaining:projectBuildTime(card)
  });
  const place=scenarioNodeData(zoneId)?.label||'outer island';
  state.log.unshift({
    title:`${card.name} dispatched`,
    detail:`${materialFromPort} material${materialFromPort===1?'':'s'} sent from the main wharf to ${place}. The project will begin when freight arrives.`
  });
}
function queueLocalConstruction(card,zoneId,cacheUsed){
  ensureSpatialState();
  const eta=projectBuildTime(card);
  state.construction.push({
    cardId:card.id,zoneId,startedRound:state.round,eta,status:'building',
    materialFromPort:0,cacheUsed,delays:0,buildRemaining:0
  });
  const place=scenarioNodeData(zoneId)?.label||'site';
  state.log.unshift({title:`${card.name} started`,detail:`Work began at ${place}. The project should come online next season.`});
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

  const needsFreight=remote&&(portMaterial>0||card.id==='stock');
  const freightPayload=card.id==='stock'&&remote?Math.max(1,card.effect?.supplies||2):portMaterial;
  const buildTime=projectBuildTime(card);
  if(needsFreight) queueSpatialProject(card,zoneId,freightPayload,cached);
  else if(buildTime>0) queueLocalConstruction(card,zoneId,cached);
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
  if(state.lastEvent) state.lastEvent.local=local;
  return local;
}

const NETWORK_RULES=Object.freeze({
  port:{stat:'supplies',loss:1,label:'Port bottleneck',detail:'Critical pressure at the main landing costs 1 incoming material next season.'},
  town:{stat:'budget',loss:1,label:'Market disruption',detail:'Critical pressure at the main settlement costs 1 fund next season.'},
  source:{stat:'water',loss:1,label:'Water system failure',detail:'Critical pressure at the freshwater source costs 1 water next season.'},
  gardens:{stat:'food',loss:1,label:'Food-system loss',detail:'Critical pressure at the gardens costs 1 food next season.'},
  clinic:{stat:'community',loss:1,label:'Health services strained',detail:'Critical pressure at the clinic costs 1 community next season.'},
  school:{stat:'shelter',loss:1,label:'Safe shelter unavailable',detail:'Critical pressure at the school/shelter costs 1 shelter next season.'}
});
function networkStrains(){
  ensureSpatialState();
  return Object.entries(NETWORK_RULES).map(([zoneId,rule])=>({zoneId,rule,stress:Number(state.zoneStress?.[zoneId]||0)})).filter(x=>x.stress>=2);
}
function applyNetworkConsequences(){
  ensureSpatialState();
  const critical=networkStrains().filter(x=>x.stress>=3),notes=[];
  for(const item of critical){
    const before=Number(state.stats?.[item.rule.stat]||0);
    if(before<=0) continue;
    changeStats({[item.rule.stat]:-item.rule.loss});
    const place=scenarioNodeData(item.zoneId)?.label||item.zoneId;
    const text=`${place}: ${item.rule.detail}`;
    notes.push({type:'network',zoneId:item.zoneId,text});
    state.log.unshift({title:item.rule.label,detail:text});
  }
  if(notes.length){state.logistics.lastSeason=notes;state.logistics.history.push(...notes.map(x=>({...x,round:state.round})));}
  return notes;
}
function recoverSpatialZone(zoneId){
  if(!state||state.phase!=='play') throw Error('Recovery happens during planning.');
  ensureSpatialState();
  const stress=Number(state.zoneStress?.[zoneId]||0);
  if(stress<=0) throw Error('This place has no local pressure to recover.');
  if(state.recoveryUsed||state.played.length>=2) throw Error('Community recovery is available once per season and uses one project action.');
  state.zoneStress[zoneId]=Math.max(0,stress-1);
  state.recoveryUsed=true;
  state.played.push('effort');
  const place=scenarioNodeData(zoneId)?.label||zoneId;
  state.log.unshift({title:'Community recovery',detail:`People restored local capacity at ${place}; pressure fell by 1.`});
  save();render();return snapshot();
}

resolveRound = function(){
  const result=legacyResolveRound();
  if(state?.phase==='event'&&state.lastEvent?.id){
    const local=applyLocalHazard(state.lastEvent.id);
    const special=activeScenarioData()?.special;
    if(special?.kind==='relocation'&&Number(state.zoneStress?.[special.sourceZone]||0)>=3&&state.relocation?.lastForcedRound!==state.round){
      state.relocation.lastForcedRound=state.round;
      state.relocation.unplannedEvents=Number(state.relocation.unplannedEvents||0)+1;
      changeStats({community:-1});
      state.log.unshift({title:'Unplanned displacement',detail:'Severe pressure at the home community forced an unplanned temporary move. Community capacity fell by 1.'});
      state.lastEvent.displacement={zoneId:special.sourceZone,communityLoss:1};
    }
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
    if((item.status==='in-transit'||item.status==='delayed')&&freightIsDisrupted(item,hazardId)){
      item.delays=(item.delays||0)+1;
      item.status='delayed';
      remaining.push(item);
      const msg=`${card.name} delayed en route to ${place} by ${HAZARDS.find(h=>h.id===hazardId)?.name||'bad conditions'}.`;
      seasonNotes.push({type:'delay',cardId:item.cardId,zoneId:item.zoneId,text:msg});
      state.log.unshift({title:'Freight delayed',detail:msg});
      continue;
    }

    item.eta=Math.max(0,(item.eta||1)-1);

    if(item.status==='building'){
      if(item.eta<=0){
        completeSpatialProject(card,item.zoneId,item.startedRound,'construction');
        const msg=`${card.name} finished at ${place}; the project is now operating.`;
        seasonNotes.push({type:'complete',cardId:item.cardId,zoneId:item.zoneId,text:msg});
      }else remaining.push(item);
      continue;
    }

    if(item.eta<=0){
      if((item.buildRemaining||0)>0){
        item.status='building';
        item.eta=item.buildRemaining;
        item.buildRemaining=0;
        remaining.push(item);
        const msg=`${card.name} materials reached ${place}; local construction is underway.`;
        seasonNotes.push({type:'arrival',cardId:item.cardId,zoneId:item.zoneId,text:msg});
        state.log.unshift({title:'Materials arrived',detail:msg});
      }else{
        completeSpatialProject(card,item.zoneId,item.startedRound,'freight');
        const msg=`${card.name} materials arrived at ${place}; the project is now operating.`;
        seasonNotes.push({type:'complete',cardId:item.cardId,zoneId:item.zoneId,text:msg});
      }
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
    if(state.relocation) state.relocation.usedThisSeason=false;
    applyNetworkConsequences();
    save();render();
  }
  return snapshot();
};

startGame = function(n=selectedPlayers){
  const result=legacyStartGame(n);
  ensureSpatialState();
  state.scenarioId=(typeof selectedScenarioId!=='undefined'?selectedScenarioId:ACTIVE_SCENARIO_ID);
  state.workshopMode=(typeof selectedPlayMode!=='undefined'&&selectedPlayMode==='workshop');
  state.workshopReadyRound=null;
  save();render();
  return snapshot();
};

snapshot = function(){
  const base=legacySnapshot();
  if(!state) return base;
  ensureSpatialState();
  return {
    ...base,
    scenarioId:state.scenarioId||(typeof selectedScenarioId!=='undefined'?selectedScenarioId:ACTIVE_SCENARIO_ID),
    construction:state.construction.map(x=>({...x})),
    placements:state.placements.map(x=>({...x})),
    zoneStress:{...state.zoneStress},
    localCaches:{...state.logistics.caches},
    relocation:state.relocation?JSON.parse(JSON.stringify(state.relocation)):null
  };
};

ensureSpatialState();
if(state){ state.scenarioId??=(typeof selectedScenarioId!=='undefined'?selectedScenarioId:ACTIVE_SCENARIO_ID); save(); }
