/* Island Together is a deliberately simplified, fictional teaching game.
   Its resource quantities are game units, not measured climate forecasts. */
const CARDS = [
  {id:'tank',name:'Household rain tanks',type:'Water',cost:[2,1],effect:{water:2},tag:'tank',accent:'#3ba9c4',text:'Store rainfall before a dry spell. Covered tanks also protect drinking water.'},
  {id:'repair',name:'Fix leaking pipes',type:'Water',cost:[1,1],effect:{water:2},accent:'#3ba9c4',text:'Local repairs turn a small supply of materials into dependable water.'},
  {id:'spring',name:'Protect the freshwater source',type:'Water',cost:[2,0],effect:{water:1,community:1},tag:'spring',accent:'#3ba9c4',text:'Agree on a catchment protection plan and keep saltwater out where possible.'},
  {id:'waterplan',name:'Water sharing plan',type:'Water',cost:[1,0],effect:{water:1,community:1},accent:'#3ba9c4',text:'Set fair collection times and priority access before supplies tighten.'},
  {id:'beds',name:'Raised garden beds',type:'Food',cost:[2,1],effect:{food:2},tag:'beds',accent:'#a7bf5f',text:'Lift crops above waterlogged soil and diversify local harvests.'},
  {id:'seeds',name:'Community seed bank',type:'Food',cost:[1,0],effect:{food:1,community:1},tag:'seeds',accent:'#a7bf5f',text:'Store planting material and share varieties suited to local conditions.'},
  {id:'crops',name:'Mix resilient crops',type:'Food',cost:[1,0],effect:{food:2},accent:'#a7bf5f',text:'Do not put the next harvest in just one crop.'},
  {id:'reef',name:'Reef stewardship',type:'Food',cost:[1,0],effect:{food:1,community:1},tag:'reef',accent:'#a7bf5f',text:'Support locally agreed reef management and protect food livelihoods.'},
  {id:'roofs',name:'Brace the roofs',type:'Shelter',cost:[2,2],effect:{shelter:2},tag:'roofs',accent:'#dfaa64',text:'Strengthen vulnerable buildings while the weather is calm.'},
  {id:'school',name:'Safer school shelter',type:'Shelter',cost:[3,1],effect:{shelter:2,community:1},tag:'school',accent:'#dfaa64',text:'Prepare an accessible shelter with supplies and clear responsibilities.'},
  {id:'drain',name:'Clear drainage routes',type:'Shelter',cost:[2,1],effect:{shelter:1,water:1},tag:'drain',accent:'#dfaa64',text:'Maintain drains and protect the water point from dirty runoff.'},
  {id:'paths',name:'Keep safe paths open',type:'Shelter',cost:[1,1],effect:{shelter:1,community:1},accent:'#dfaa64',text:'Improve evacuation routes to the clinic and higher ground.'},
  {id:'radio',name:'Radio check network',type:'Community',cost:[2,1],effect:{community:2},tag:'radio',accent:'#b891d0',text:'Practice warnings and check that every household can receive them.'},
  {id:'training',name:'Train local repair crews',type:'Community',cost:[2,0],effect:{community:1},tag:'training',accent:'#b891d0',text:'Share practical skills so repairs do not wait for a visiting team.'},
  {id:'plan',name:'Practice the response plan',type:'Community',cost:[1,0],effect:{community:2},accent:'#b891d0',text:'Rehearse who checks on neighbours and where people meet.'},
  {id:'health',name:'Health outreach',type:'Community',cost:[1,0],effect:{community:1,water:1},tag:'health',accent:'#b891d0',text:'Prepare hygiene information and identify people needing extra support.'},
  {id:'stock',name:'Pre-position supplies',type:'Logistics',cost:[2,0],effect:{supplies:2,community:1},accent:'#6fb7aa',text:'Buy and store repair materials before shipping is interrupted.'},
  {id:'wharf',name:'Maintain the wharf',type:'Logistics',cost:[3,1],effect:{supplies:1,community:1},tag:'wharf',accent:'#6fb7aa',text:'Improve local unloading and future access to essential freight.'},
  {id:'savings',name:'Community savings pool',type:'Logistics',cost:[1,0],effect:{budget:2,community:1},tag:'savings',accent:'#6fb7aa',text:'Agree on a small shared fund for urgent decisions.'},
  {id:'aid',name:'Mutual aid agreement',type:'Logistics',cost:[1,0],effect:{community:1},tag:'aid',accent:'#6fb7aa',text:'Make an agreement with nearby communities before help is needed.'}
];
const HAZARDS = [
  {id:'dry',name:'Long dry spell',watch:'dry weather',story:'Rain is late. Tanks run low and gardens need water.',base:{water:-2,food:-1},note:'Rainwater dependent communities can face severe water stress during drought. Storage and source protection reduce the strain.',source:'undp-water'},
  {id:'tide',name:'King tide and saltwater',watch:'coastal flooding',story:'Seawater reaches low ground and threatens freshwater and food gardens.',base:{water:-2,food:-1,shelter:-1},note:'Saltwater intrusion can make freshwater difficult to access on small islands. Coastal and water planning need to work together.',source:'undp-water'},
  {id:'cyclone',name:'Cyclone warning',watch:'a cyclone',story:'Strong wind damages buildings and strains the response network.',base:{shelter:-3,community:-1,supplies:-1},note:'Resilient buildings and functioning shelters matter when severe cyclones arrive. A practiced warning network helps people act early.',source:'wb-vanuatu'},
  {id:'shipping',name:'Supply boat delayed',watch:'shipping disruption',story:'Rough seas delay the next delivery of materials and fuel.',base:{supplies:-2,budget:-1},note:'Island transport is a lifeline. Storms and economic shocks can disrupt freight, so local stock and reliable wharves matter.',source:'wb-transport'},
  {id:'rain',name:'Intense rain',watch:'heavy rain',story:'Runoff floods paths, contaminates water and damages low gardens.',base:{shelter:-1,water:-1,food:-1},note:'Drainage and local food systems both shape flood resilience. Maintaining them is an ongoing task.',source:'undp-resilience'},
  {id:'reefheat',name:'Marine heat',watch:'warm seas',story:'Reef stress reduces local food options and worries fishing households.',base:{food:-2,community:-1},note:'Healthy coastal ecosystems help sustain livelihoods and food production. Local management is one part of adaptation.',source:'undp-coast'},
  {id:'fuel',name:'Fuel price surge',watch:'higher fuel costs',story:'Transport and materials become more expensive just when work is needed.',base:{budget:-2,community:-1},note:'Higher fuel and shipping costs create real pressure on Pacific economies and local services.',source:'wb-economy'},
  {id:'illness',name:'Waterborne illness',watch:'a health alert',story:'Unsafe water and stretched care services put neighbours at risk.',base:{water:-1,community:-2},note:'Water security, health and preparedness connect. Adaptation planning works best across services and households.',source:'undp-resilience'}
];
const SHIELDS = {
  dry:[['tank','water'],['seeds','food']],
  tide:[['spring','water'],['reef','food']],
  cyclone:[['roofs','shelter'],['school','shelter'],['radio','community']],
  shipping:[['wharf','supplies']],
  rain:[['drain','water'],['beds','food']],
  reefheat:[['reef','food']],
  fuel:[['savings','budget']],
  illness:[['health','community'],['tank','water']],
};
const SOURCES = [
  {id:'undp-water',label:'UNDP — Water pathways in remote Vanuatu communities',url:'https://www.undp.org/pacific/blog/water-flows-remote-communities-vanuatu-creating-pathways-climate-resilience'},
  {id:'undp-resilience',label:'UNDP — Resilience and sustainable development in the Pacific',url:'https://www.undp.org/pacific/our-focus/resilience-sustainable-development'},
  {id:'undp-coast',label:'UNDP — Adaptation in Vanuatu coastal zones',url:'https://www.undp.org/pacific/projects/adaptation-climate-change-coastal-zones-vanuatu'},
  {id:'wb-vanuatu',label:'World Bank — Improving lives and building resilience in Vanuatu',url:'https://www.worldbank.org/en/results/2024/06/07/improving-lives-and-building-resilience-in-vanuatu'},
  {id:'wb-transport',label:'World Bank — Building a resilient future in the Pacific',url:'https://www.worldbank.org/en/results/2023/12/06/building-a-resilient-future-in-the-pacific'},
  {id:'wb-economy',label:'World Bank — Pacific Economic Updates',url:'https://www.worldbank.org/en/region/eap/publication/pacific-economic-updates'}
];
const LABELS={water:'Water',food:'Food',shelter:'Shelter',community:'Community',budget:'Funds',supplies:'Materials'};
const COLORS={water:'#53bfe0',food:'#bfd878',shelter:'#edb46e',community:'#c49ee1'};
const MAX={water:6,food:6,shelter:6,community:6,budget:8,supplies:6};
const STAT_ICONS={water:'water',food:'food',shelter:'shelter',community:'community',budget:'funds',supplies:'materials'};
const TYPE_ICONS={Water:'water',Food:'food',Shelter:'shelter',Community:'community',Logistics:'materials'};
function icon(name,className=''){return `<svg class="ui-icon${className?' '+className:''}" viewBox="0 0 256 256" aria-hidden="true" focusable="false"><use href="./icons.svg#${name}"></use></svg>`}
function roleIconMarkup(role,className=''){return `<span class="role-icons${className?' '+className:''}">${roleArt(role).icons.map(name=>icon(name)).join('')}</span>`}
const ACTIVE_LIMIT=3;
const ABILITIES={
  tank:{cost:{budget:1},gain:{water:1},label:'Filter water',rule:'Pay 1 fund → +1 water'},
  reef:{cost:{budget:1},gain:{food:1},label:'Support fishers',rule:'Pay 1 fund → +1 food'},
  school:{cost:{supplies:1},gain:{shelter:1},label:'Repair shelter',rule:'Pay 1 material → +1 shelter'},
  savings:{cost:{supplies:1},gain:{budget:2},label:'Use savings',rule:'Pay 1 material → +2 funds'}
};
// Central inventory keeps every image traceable and easy to replace.
const PHOTOS={
  island:{file:'santo-beach.jpg',place:'Espiritu Santo, Vanuatu · 2016',credit:'Simon_sees',license:'CC BY 2.0',url:'https://commons.wikimedia.org/wiki/File:Champagne_Beach_Espiritu_Santo_(28660966453).jpg'},
  water:{file:'water-tank.jpg',place:'Malekula, Vanuatu · 2013',credit:'Conor Ashleigh / Australian DFAT',license:'CC BY 4.0',url:'https://commons.wikimedia.org/wiki/File:An_AusAID_funded_water_tank_at_a_school_on_Malekula_Island_in_Vanuatu._(10666195294).jpg'},
  food:{file:'food-market.jpg',place:'Port Vila, Vanuatu · 2007',credit:'Rob Maccoll / AusAID, Australian DFAT',license:'CC BY 2.0',url:'https://commons.wikimedia.org/wiki/File:Port_Vila_vegetable_market,_Vanuatu_2007._Photo-_Rob_Maccoll_-_AusAID_(10714205816).jpg'},
  shelter:{file:'roof-repair.jpg',place:'Vanuatu · 2007',credit:'Rob Maccoll / AusAID, Australian DFAT',license:'CC BY 2.0',url:'https://commons.wikimedia.org/wiki/File:NiVanuatu_artisan_replaces_a_thatched_roof_on_the_chiefs%27_meeting_hall._Vanuatu_2007._Photo-_Rob_Maccoll_-_AusAID_(10711119296).jpg'},
  cyclone:{file:'cyclone-satellite.jpg',place:'Archive image · Cyclone Pam, March 2015',credit:'NASA / LANCE-MODIS',license:'US public domain',url:'https://commons.wikimedia.org/wiki/File:Cyclone_Pam_Mar_13_2015_0225z.jpg'},
  reefMonitor:{file:'reef-monitoring-samoa.jpg',place:'Tutuila, American Samoa · reef monitoring, 2023',credit:'NOAA Fisheries / Ari Halperin',license:'US public domain',url:'https://commons.wikimedia.org/wiki/File:NOAA_diver_exchanges_temperature_recorders_Tutuila_2023.png'},
  clinic:{file:'village-clinic-png.jpg',place:'Papua New Guinea · village clinic, 2009',credit:'Roger Wheatley / AusAID, Australian DFAT',license:'CC BY 2.0',url:'https://commons.wikimedia.org/wiki/File:Nurse_sets_up_for_a_village_health_clinic._She_is_part_of_an_ausAID-funded_medical_team_that_travels_from_Kokoda_Hospital_to_visit_outlying_villages._PNG_2009._Photo-_Roger_Wheatley_(10711431703).jpg'},
  tide:{file:'high-tide-takuu.jpg',place:'Takuu Atoll, Papua New Guinea · high tide archive',credit:'Professor Richard Moyle',license:'CC BY-SA 3.0',url:'https://commons.wikimedia.org/wiki/File:NukutoaHighTide.JPG'},
  drought:{file:'drought-tuvalu.jpg',place:'Tuvalu · drought response archive',credit:'Australian DFAT',license:'CC BY 2.0',url:'https://commons.wikimedia.org/wiki/File:A_public_water_collection_point_set_up_in_response_to_the_drought,_Tuvalu,_2011._Photo-_DFAT_(12779967324).jpg'},
  cargo:{file:'cargo-vanuatu.jpg',place:'Vanuatu · cargo vessel archive',credit:'Simon_sees',license:'CC BY 2.0',url:'https://commons.wikimedia.org/wiki/File:Vanuatu_cargo_ship_(16557298549).jpg'},
  wharf:{file:'wharf-fiji.jpg',place:'Vanua Balavu, Fiji · wharf operations',credit:'Jaejay77',license:'CC BY-SA 4.0',url:'https://commons.wikimedia.org/wiki/File:Loading_at_Vanua_Balavu_wharf.jpg'},
  bleaching:{file:'coral-bleaching-samoa.jpg',place:'American Samoa · bleached coral',credit:'Wendy Cover / NOAA',license:'US public domain',url:'https://commons.wikimedia.org/wiki/File:NMSAS_-_Coral_Bleaching_(30668757294).jpg'},
  fuel:{file:'fuel-vanuatu.jpg',place:'Luganville, Vanuatu · fuel pump',credit:'Michael Coghlan',license:'CC BY-SA 2.0',url:'https://commons.wikimedia.org/wiki/File:Bowser_-_Unleaded_and_Diesel_(31357104622).jpg'}
};
const PHOTO_USE={Water:'water',Food:'food',Shelter:'shelter',Community:'food',Logistics:'island',
  tank:'water',reef:'reefMonitor',health:'clinic',roofs:'shelter',school:'shelter',wharf:'wharf'};
const HAZARD_ART={dry:'drought',tide:'tide',cyclone:'cyclone',shipping:'cargo',rain:null,reefheat:'bleaching',fuel:'fuel',illness:null};
const HAZARD_GRAPHICS={rain:{symbol:'≋',icon:'rain',label:'Runoff and heavy rain',color:'#5caed2'},illness:{symbol:'✚',icon:'health',label:'Water and health alert',color:'#8ed4b5'}};
const HAZARD_SIGNALS={shipping:{symbol:'⌛',icon:'shipping',label:'Delivery delayed'},fuel:{symbol:'↑',icon:'fuel',label:'Costs rise'}};
function photoFor(kind){return PHOTOS[PHOTO_USE[kind]||kind]||PHOTOS.island}
function photoStyle(kind){return `--photo:url('./photos/${photoFor(kind).file}')`}
function photoLicenseUrl(p){const match=p.license.match(/^CC BY(-SA)? (2\.0|3\.0|4\.0)$/);return match?`https://creativecommons.org/licenses/by${match[1]?'-sa':''}/${match[2]}/`:p.url}
function photoCreditList(){return Object.values(PHOTOS).map(p=>`<li><strong>${p.place}</strong> — ${p.credit}. <a href="${p.url}" target="_blank" rel="noopener noreferrer">Photo source</a> · <a href="${photoLicenseUrl(p)}" target="_blank" rel="noopener noreferrer">${p.license}</a>.<span class="print-url">${p.url}<br>${photoLicenseUrl(p)}</span></li>`).join('')}
const app=document.getElementById('app');
let selectedPlayers=2;
let state;
try { const saved=JSON.parse(localStorage.getItem('island-together-v1')); if(saved && [1,2].includes(saved.version) && ['play','event','result'].includes(saved.phase)){const oldVersion=saved.version;state=saved;state.version=2;state.active??=CARDS.filter(c=>c.tag&&state.tags?.includes(c.tag)).slice(0,ACTIVE_LIMIT).map(c=>c.id);state.tags=state.active.map(id=>CARDS.find(c=>c.id===id).tag);state.activeUsed??=[];state.recoveryUsed??=false;state.pendingRetire??=null;state.eventStage??='impact';selectedPlayers=state.players;if(oldVersion===1){state.deck=state.deck.filter(id=>!state.active.includes(id));state.discard=state.discard.filter(id=>!state.active.includes(id));state.hand=state.hand.filter(id=>!state.active.includes(id));takeCards(state,4)}}} catch(_){}
let infoModal=null;
const shuffle=a=>[...a].sort(()=>Math.random()-.5);
const clamp=(n,k)=>Math.max(0,Math.min(MAX[k],n));
const rolesFor=n=>n===2?[
  {name:'Water & food steward',description:'Share practical water and growing knowledge.',boost:{water:1,food:1}},
  {name:'Builder & coordinator',description:'Keep homes sound and people connected.',boost:{shelter:1,community:1}}
]:n===3?[
  {name:'Water steward',description:'Keep freshwater safe and accessible.',boost:{water:2}},
  {name:'Food grower',description:'Support local harvests.',boost:{food:2}},
  {name:'Builder & coordinator',description:'Keep homes sound and people connected.',boost:{shelter:1,community:1}}
]:[
  {name:'Water steward',description:'Keep freshwater safe and accessible.',boost:{water:2}},
  {name:'Food grower',description:'Support local harvests.',boost:{food:2}},
  {name:'Builder',description:'Strengthen safe places.',boost:{shelter:2}},
  {name:'Coordinator',description:'Make sure people can act together.',boost:{community:2}}
];
function save(){try{if(state)localStorage.setItem('island-together-v1',JSON.stringify(state));else localStorage.removeItem('island-together-v1')}catch(_){}}
function takeCards(s,n){while(s.hand.length<n){if(!s.deck.length){s.deck=shuffle(s.discard);s.discard=[]}if(!s.deck.length)break;s.hand.push(s.deck.pop())}}
function nextForecast(s){if(s.hazards.length<2)s.hazards=shuffle(HAZARDS.map(h=>h.id));let a=s.hazards.pop(),b=s.hazards.pop();s.pendingEvent=Math.random()<.5?a:b;s.hazards.unshift(s.pendingEvent===a?b:a);s.forecast=shuffle([a,b]);}
function startGame(n=selectedPlayers){if(![2,3,4].includes(n))throw Error('Choose 2, 3 or 4 players.');selectedPlayers=n;state={version:2,phase:'play',players:n,round:1,stats:{water:3,food:3,shelter:3,community:3,budget:4,supplies:3},deck:shuffle(CARDS.map(c=>c.id)),discard:[],hand:[],hazards:shuffle(HAZARDS.map(h=>h.id)),forecast:[],pendingEvent:null,tags:[],active:[],activeUsed:[],recoveryUsed:false,pendingRetire:null,roleUsed:Array(n).fill(false),played:[],log:[{title:'The season begins',detail:'Talk together, then choose up to two projects before the hazard arrives.'}],lastEvent:null,eventStage:'reveal'};takeCards(state,4);nextForecast(state);infoModal=null;save();render();return snapshot()}
function currentRole(){return rolesFor(state.players)[(state.round-1)%state.players]}
function changeStats(effect){for(const [k,v] of Object.entries(effect))state.stats[k]=clamp(state.stats[k]+v,k)}
function effectiveCost(card){return [card.cost[0],Math.max(0,card.cost[1]-(state.tags.includes('training')?1:0))]}
function retireProject(id){if(!state.active.includes(id))throw Error('That project is not active.');state.active=state.active.filter(x=>x!==id);state.discard.push(id);state.tags=state.active.map(x=>CARDS.find(c=>c.id===x).tag);state.log.unshift({title:'Project retired',detail:`${CARDS.find(c=>c.id===id).name} leaves the active table; its ongoing benefits end.`})}
function playCard(id,retireId){if(!state||state.phase!=='play')throw Error('Start a game first.');if(state.played.length>=2)throw Error('The crew has already completed two projects this round.');if(!state.hand.includes(id))throw Error('That project is not in the current hand.');const card=CARDS.find(c=>c.id===id),cost=effectiveCost(card);if(state.stats.budget<cost[0]||state.stats.supplies<cost[1])throw Error('Not enough funds or materials.');if(card.tag&&!state.active.includes(id)&&state.active.length>=ACTIVE_LIMIT){if(!retireId){state.pendingRetire={mode:'replace',newId:id};save();render();return snapshot()}if(!state.active.includes(retireId))throw Error('Choose an active project to retire.');retireProject(retireId)}state.pendingRetire=null;state.stats.budget-=cost[0];state.stats.supplies-=cost[1];changeStats(card.effect);if(card.tag&&!state.active.includes(id))state.active.push(id);else state.discard.push(id);state.tags=state.active.map(x=>CARDS.find(c=>c.id===x).tag);state.hand=state.hand.filter(x=>x!==id);state.played.push(id);state.log.unshift({title:card.name,detail:`Project completed in round ${state.round}.`});save();render();return snapshot()}
function useProject(id){if(!state||state.phase!=='play'||!state.active.includes(id))throw Error('This project is not active.');const a=ABILITIES[id];if(!a)throw Error('No activated ability on this project.');if(state.activeUsed.includes(id))throw Error('Ability already used this season.');if(Object.entries(a.cost).some(([k,v])=>state.stats[k]<v))throw Error('Not enough resources to activate.');changeStats(Object.fromEntries(Object.entries(a.cost).map(([k,v])=>[k,-v])));changeStats(a.gain);state.activeUsed.push(id);state.log.unshift({title:a.label,detail:`${CARDS.find(c=>c.id===id).name} activated.`});save();render();return snapshot()}
function communityEffort(key){if(!state||state.phase!=='play'||!['water','food','shelter','community'].includes(key))throw Error('Choose an essential to support.');if(state.recoveryUsed||state.played.length>=2)throw Error('Community effort is available once per season and takes a project slot.');changeStats({[key]:1});state.recoveryUsed=true;state.played.push('effort');state.log.unshift({title:'Community effort',detail:`Neighbours helped restore 1 ${LABELS[key].toLowerCase()}.`});save();render();return snapshot()}
function useAbility(){if(!state||state.phase!=='play')throw Error('Start a game first.');const i=(state.round-1)%state.players;if(state.roleUsed[i])throw Error('This role has already used its one-time contribution.');const role=currentRole();changeStats(role.boost);state.roleUsed[i]=true;state.log.unshift({title:role.name,detail:'Used their one-time contribution.'});save();render();return snapshot()}
function resolveRound(){if(!state||state.phase!=='play')throw Error('There is no round to resolve.');const event=HAZARDS.find(h=>h.id===state.pendingEvent);const before={...state.stats},actual={...event.base},mitigated=[];for(const [tag,key] of SHIELDS[event.id]||[]){if(state.tags.includes(tag)&&actual[key]<0){actual[key]++;mitigated.push(CARDS.find(c=>c.tag===tag)?.name||tag)}}
  if(state.tags.includes('aid')&&actual.community<0){actual.community++;mitigated.push('Mutual aid agreement')}
  changeStats(actual);state.lastEvent={id:event.id,before,actual,mitigated,after:{...state.stats}};state.phase='event';state.eventStage='reveal';state.log.unshift({title:event.name,detail:mitigated.length?`Protection helped: ${mitigated.join(', ')}.`:'The island absorbed the full impact.'});save();render();return snapshot()}
function showImpact(){if(!state||state.phase!=='event')throw Error('No hazard to reveal.');state.eventStage='impact';save();render();return snapshot()}
function advance(){if(!state||state.phase!=='event'||state.eventStage!=='impact')throw Error('View the hazard impact first.');if(state.round===6){state.phase='result'}else{state.discard.push(...state.hand);state.hand=[];state.round++;state.played=[];state.activeUsed=[];state.recoveryUsed=false;changeStats({budget:2,supplies:1});if(state.tags.includes('wharf')&&state.stats.budget>=1){changeStats({budget:-1,supplies:1});state.log.unshift({title:'Wharf upkeep',detail:'Paid 1 fund for 1 extra material.'})}if(state.tags.includes('beds')&&state.stats.water>=1){changeStats({water:-1,food:1});state.log.unshift({title:'Garden water',detail:'Raised beds used 1 water to grow 1 food.'})}takeCards(state,4);nextForecast(state);state.phase='play'}save();render();return snapshot()}
function snapshot(){if(!state)return {phase:'setup'};return {phase:state.phase,round:state.round,players:state.players,stats:{...state.stats},hand:[...state.hand],active:[...state.active],projectsPlayed:state.played.length,forecast:[...state.forecast],lastEvent:state.lastEvent?.id||null,eventStage:state.eventStage}}
function fmtEffect(e){return Object.entries(e).map(([k,v])=>`${v>0?'+':''}${v} ${LABELS[k]}`).join(' · ')}
function art(kind){const p=photoFor(kind);return `<div class="piece-art photo" style="${photoStyle(kind)}" role="img" aria-label="Photograph: ${p.place}"><span class="photo-location">${p.place}</span></div>`}
function statCard(k){const v=state.stats[k];return `<div class="status-card piece ${v<=1?'critical':''}" style="--accent:${COLORS[k]}"><div class="piece-kicker">Island condition</div><div class="status-main"><span>${LABELS[k]}</span><strong>${v}<small>/6</small></strong></div><div class="pips" role="meter" aria-label="${LABELS[k]}" aria-valuenow="${v}" aria-valuemin="0" aria-valuemax="6">${Array.from({length:6},(_,i)=>`<i class="${i<v?'filled':''}"></i>`).join('')}</div><div class="condition-caption">${v===0?'Needs urgent attention':v<=2?'Fragile':v>=5?'Strong':'Steady'}</div></div>`}
function resourceCard(k){const v=state.stats[k];return `<div class="resource-card piece"><div class="piece-kicker">Shared resource</div><span>${LABELS[k]}</span><strong>${v}<small> / ${MAX[k]}</small></strong><div class="pips">${Array.from({length:MAX[k]},(_,i)=>`<i class="${i<v?'filled':''}"></i>`).join('')}</div></div>`}
function frontCard(id){const c=CARDS.find(x=>x.id===id),cost=effectiveCost(c),afford=state.stats.budget>=cost[0]&&state.stats.supplies>=cost[1],space=state.played.length<2,rule=c.id==='beds'?'Each new season: −1 water → +1 food':c.id==='wharf'?'Each new season: pay 1 fund → +1 material':c.id==='training'?'Future projects cost 1 less material':ABILITIES[c.id]?.rule||'Protects against a matching hazard';return `<article class="project-card piece" style="--accent:${c.accent}">${art(PHOTO_USE[c.id]?c.id:c.type)}<div class="project-content"><div class="card-top"><span class="piece-kicker">${c.type} · ${c.tag?'ongoing':'one-time'}</span><span class="cost">${cost[0]} F · ${cost[1]} M</span></div><h3>${c.name}</h3><p class="card-effect">${fmtEffect(c.effect)}</p><p class="project-text">${c.text}</p>${c.tag?`<div class="ongoing-rule"><strong>While active</strong> ${rule}</div>`:''}<button type="button" data-play="${c.id}" ${afford&&space?'':`disabled title="${space?'Not enough resources':'Crew capacity used'}"`}>${!space?'Crew full':afford?'Choose project':'Need resources'}</button></div></article>`}
function activeCard(id){const c=CARDS.find(x=>x.id===id),a=ABILITIES[id],used=state.activeUsed.includes(id),can=a&&!used&&Object.entries(a.cost).every(([k,v])=>state.stats[k]>=v)&&Object.keys(a.gain).some(k=>state.stats[k]<MAX[k]),rule=id==='beds'?'At season start: −1 water → +1 food':id==='wharf'?'At season start: pay 1 fund → +1 material':id==='training'?'All project material costs −1':a?.rule||'Hazard protection';return `<article class="active-card piece" style="--accent:${c.accent}">${art(PHOTO_USE[c.id]?c.id:c.type)}<div class="active-content"><div class="piece-kicker">In service · ${c.type}</div><h3>${c.name}</h3><p>${rule}</p><div class="active-actions">${a?`<button data-project-ability="${id}" ${can?'':'disabled'}>${used?'Used this season':a.label}</button>`:''}<button class="subtle" data-retire-request="${id}">Retire</button></div></div></article>`}
function leaderCard(){const role=currentRole(),i=(state.round-1)%state.players,accent=role.name.includes('Water')?'#58bde0':role.name.includes('Food')?'#b5cf75':role.name.includes('Builder')?'#e2aa6e':'#c199df',symbol=role.name.includes('Water &')?'W + F':role.name.includes('Builder &')?'B + C':role.name.includes('Water')?'W':role.name.includes('Food')?'F':role.name.includes('Builder')?'B':'C';return `<section class="leader-card piece" style="--accent:${accent}"><div class="leader-symbol" aria-hidden="true">${symbol}</div><div class="leader-body"><div class="piece-kicker">Leader card · player ${i+1}</div><h2>${role.name}</h2><p>${role.description}</p><div class="leader-power">Once per game · ${fmtEffect(role.boost)}</div><button data-action="ability" ${state.roleUsed[i]?'disabled':''}>${state.roleUsed[i]?'Contribution used':'Use contribution'}</button></div></section>`}
function forecastCards(){return state.forecast.map((id,i)=>`<div class="forecast-card piece"><div class="forecast-back"><div class="wave-mark" aria-hidden="true">≈</div><span>Season risk</span></div><div class="forecast-label"><small>Watch ${i+1}</small><strong>${HAZARDS.find(h=>h.id===id).watch}</strong></div></div>`).join('')}
function effortCard(){const disabled=state.recoveryUsed||state.played.length>=2;return `<section class="effort-card piece"><div class="piece-kicker">Always available · one per season</div><h3>Community effort</h3><p>Use one project slot to restore <strong>+1</strong> to any essential. It needs no funds or materials.</p><div class="effort-buttons">${['water','food','shelter','community'].map(k=>`<button data-effort="${k}" ${disabled||state.stats[k]===6?'disabled':''}>+1 ${LABELS[k]}</button>`).join('')}</div></section>`}
let focusIndex = 0;
let edgePanel = null;
const CONDITIONS = ['water','food','shelter','community'];

function conditionChip(key){
  const value=state.stats[key], max=MAX[key];
  return `<button class="condition-chip ${value<=1?'urgent':''}" data-panel="conditions" style="--chip:${COLORS[key]}" aria-label="${LABELS[key]} ${value} of ${max}. Open all conditions"><span class="chip-label">${icon(STAT_ICONS[key])}<span class="chip-name">${LABELS[key]}</span></span><strong>${value}<small>/${max}</small></strong><i style="--fill:${value/max*100}%"></i></button>`;
}
function resourceChip(key){
  return `<button class="resource-chip" data-panel="conditions" aria-label="${LABELS[key]} ${state.stats[key]} of ${MAX[key]}. Open all resources"><span class="chip-label">${icon(STAT_ICONS[key])}<span>${LABELS[key]}</span></span><strong>${state.stats[key]}</strong></button>`;
}
function compactHeader(){
  return `<header class="game-top"><a class="game-brand" href="/" aria-label="Kliawota home"><span class="brand-wave">${icon('outrigger')}</span><span>Island Together</span></a><div class="season-marker">Season <b>${state?.round||1}</b> / 6</div><button class="menu-button" data-panel="menu" aria-label="Open game menu">${icon('menu')}</button></header>`;
}
function roleArt(role){
  return role.name==='Water & food steward'?{color:'#58bde0',symbol:'W + F',icons:['water','food']}:role.name==='Builder & coordinator'?{color:'#e2aa6e',symbol:'B + C',icons:['builder','community']}:role.name.includes('Water')?{color:'#58bde0',symbol:'W',icons:['water']}:role.name.includes('Food')?{color:'#b5cf75',symbol:'F',icons:['food']}:role.name.includes('Builder')?{color:'#e2aa6e',symbol:'B',icons:['builder']}:{color:'#c199df',symbol:'C',icons:['community']};
}
function focusedProject(){
  if(!state.hand.length) return `<div class="no-card">The shared hand is empty. Face the season when ready.</div>`;
  focusIndex=((focusIndex%state.hand.length)+state.hand.length)%state.hand.length;
  const c=CARDS.find(card=>card.id===state.hand[focusIndex]);
  const cost=effectiveCost(c),afford=state.stats.budget>=cost[0]&&state.stats.supplies>=cost[1],space=state.played.length<2;
  const rule=c.id==='beds'?'Each new season: −1 water → +1 food':c.id==='wharf'?'Each new season: pay 1 fund → +1 material':c.id==='training'?'Future projects cost 1 less material':ABILITIES[c.id]?.rule||'Protects against a matching hazard';
  return `<article class="focus-card" style="--accent:${c.accent}">
    <div class="focus-photo photo" style="${photoStyle(PHOTO_USE[c.id]?c.id:c.type)}"><span class="photo-location">${photoFor(PHOTO_USE[c.id]?c.id:c.type).place}</span><span class="card-category">${icon(TYPE_ICONS[c.type])}<span>${c.type} · ${c.tag?'Ongoing':'One-time'}</span></span></div>
    <div class="focus-body"><div class="focus-topline"><span>PROJECT ${focusIndex+1} OF ${state.hand.length}</span><span class="cost-badge" aria-label="${cost[0]} funds and ${cost[1]} materials"><span>${icon('funds')}<b>${cost[0]}</b></span><span>${icon('materials')}<b>${cost[1]}</b></span></span></div>
      <h1>${c.name}</h1><p class="focus-effect">${fmtEffect(c.effect)}</p><p class="focus-description">${c.text}</p>
      ${c.tag?`<p class="focus-ongoing"><b>Stays in service</b> ${rule}</p>`:''}
      <button class="choose-button" data-play="${c.id}" ${afford&&space?'':`disabled title="${space?'Not enough funds or materials':'No project slots left'}"`}>${!space?'Crew full':afford?'Build this project':'Need more resources'}</button>
    </div></article>`;
}
function panelMarkup(){
  if(!edgePanel||!state||state.phase!=='play')return '';
  let title='',body='';
  if(edgePanel==='forecast'){
    title='Season forecast';
    body=`<p class="panel-lead">One of these two hazards will arrive after the council acts.</p><div class="panel-list">${state.forecast.map((id,i)=>`<div class="panel-row forecast-row"><span class="panel-row-icon">${icon('forecast')}</span><span class="forecast-number">0${i+1}</span><strong>${HAZARDS.find(h=>h.id===id).watch}</strong></div>`).join('')}</div>`;
  } else if(edgePanel==='leader'){
    const role=currentRole(),used=state.roleUsed[(state.round-1)%state.players];
    body=`<p class="panel-lead">Player ${(state.round-1)%state.players+1} leads this season.</p><div class="role-emblem" style="--role:${roleArt(role).color}">${roleIconMarkup(role)}</div><p>${role.description}</p><p class="panel-power">Once per game · ${fmtEffect(role.boost)}</p><button class="primary panel-primary" data-action="ability" ${used?'disabled':''}>${used?'Contribution used':'Use contribution'}</button>`;
    title=role.name;
  } else if(edgePanel==='active'){
    title=`Projects in service · ${state.active.length}/${ACTIVE_LIMIT}`;
    body=state.active.length?`<div class="panel-list">${state.active.map(id=>{const c=CARDS.find(x=>x.id===id),a=ABILITIES[id],used=state.activeUsed.includes(id),can=a&&!used&&Object.entries(a.cost).every(([k,v])=>state.stats[k]>=v)&&Object.keys(a.gain).some(k=>state.stats[k]<MAX[k]);const rule=id==='beds'?'At season start: −1 water → +1 food':id==='wharf'?'At season start: pay 1 fund → +1 material':id==='training'?'All material costs −1':id==='aid'?'Reduce community loss from any hazard by 1':a?.rule||'Matching hazard protection';return `<article class="service-row" style="--accent:${c.accent}"><div class="service-title">${icon(TYPE_ICONS[c.type])}<h3>${c.name}</h3></div><p>${rule}</p><div class="service-actions">${a?`<button data-project-ability="${id}" ${can?'':'disabled'}>${used?'Used this season':a.label}</button>`:''}<button class="ghost" data-retire-request="${id}">Retire</button></div></article>`}).join('')}</div>`:'<p class="panel-lead">Build an ongoing project to keep its ability or protection. You can keep three.</p>';
  } else if(edgePanel==='effort'){
    const disabled=state.recoveryUsed||state.played.length>=2;
    title='Community effort';
    body=`<p class="panel-lead">Use one project slot to restore +1 to any condition. No funds or materials. Once per season.</p><div class="effort-choices">${CONDITIONS.map(k=>`<button data-effort="${k}" style="--accent:${COLORS[k]}" ${disabled||state.stats[k]===MAX[k]?'disabled':''}>${icon(STAT_ICONS[k])}<span>+1 ${LABELS[k]}</span></button>`).join('')}</div>`;
  } else if(edgePanel==='conditions'){
    title='Island readout';
    body=`<div class="readout-list">${[...CONDITIONS,'budget','supplies'].map(k=>`<div class="readout-row"><span class="readout-name">${icon(STAT_ICONS[k])}<span>${LABELS[k]}</span></span><strong>${state.stats[k]} / ${MAX[k]}</strong><i><em style="width:${state.stats[k]/MAX[k]*100}%;background:${COLORS[k]||'#74d2bd'}"></em></i></div>`).join('')}</div><p class="panel-lead">Each new season brings 2 funds and 1 material. Conditions are scored after season six.</p>`;
  } else {
    title='Game menu';
    body=`<div class="menu-list"><button data-info="rules">How to play</button><button data-info="sources">Research & photo credits</button><a href="?print=1">Print card proof</a><a href="/">Kliawota home</a></div><p class="panel-lead">The island and game units are fictional. Progress stays on this device.</p>`;
  }
  return `<div class="panel-layer"><button class="panel-backdrop" data-close-panel aria-label="Close panel"></button><section class="edge-sheet" role="dialog" aria-modal="true" aria-labelledby="edge-title"><div class="edge-head"><span class="edge-kicker">Council table</span><button data-close-panel aria-label="Close panel">×</button></div><h2 id="edge-title">${title}</h2>${body}</section></div>`;
}
function header(){return compactHeader()}
function setupHtml(){
  return `<div class="frame setup-screen" style="--setup-photo:url('./photos/${PHOTOS.island.file}')"><header class="game-top"><a class="game-brand" href="/"><span class="brand-wave">${icon('outrigger')}</span><span>Island Together</span></a><span class="setup-label">Cooperative game</span></header><main class="setup-main"><div class="setup-copy"><div class="eyebrow">Pacific resilience · six seasons</div><h1>Prepare the island. Face the season.</h1><p>Choose projects together, work with limited resources, and keep water, food, shelter and community strong.</p></div><section class="setup-controls" aria-label="New game"><span>How many players?</span><div class="player-choice" role="group" aria-label="Players">${[2,3,4].map(n=>`<button data-players="${n}" aria-pressed="${selectedPlayers===n}">${n}</button>`).join('')}</div><button class="primary" data-action="start">Start game</button><small>About 15 minutes · pass the device each season</small></section></main><div class="setup-credit">Espiritu Santo, Vanuatu · prototype photo</div></div>`;
}
function gameHtml(){
  const role=currentRole(),slots=2-state.played.length;
  return `<div class="frame game-screen">${compactHeader()}<aside class="status-rail" aria-label="Island conditions and resources">${CONDITIONS.map(conditionChip).join('')}${['budget','supplies'].map(resourceChip).join('')}</aside>
    <main class="choice-stage"><div class="stage-heading"><span>Choose together · Player ${(state.round-1)%state.players+1} leads</span><strong>${slots} project slot${slots===1?'':'s'} left</strong></div><div class="focus-zone"><button class="cycle-button" data-focus="-1" aria-label="Previous project">‹</button>${focusedProject()}<button class="cycle-button" data-focus="1" aria-label="Next project">›</button></div>
      <div class="deck-picker" role="group" aria-label="Choose a card to view">${state.hand.map((id,i)=>`<button data-card-index="${i}" aria-pressed="${i===focusIndex}"><span>${String(i+1).padStart(2,'0')}</span><b>${CARDS.find(c=>c.id===id).name}</b></button>`).join('')}</div>
      <div class="stage-actions"><button class="effort-trigger" data-panel="effort" ${state.recoveryUsed||slots===0?'disabled':''}>${icon('effort')}<span>Community effort</span><b>+1</b></button><button class="primary face-button" data-action="resolve">${icon('warning')}<span>Face the season</span></button></div></main>
    <aside class="side-rail" aria-label="Council tools"><button class="side-item" data-panel="forecast"><span class="side-label">${icon('forecast')} Forecast</span><strong>${state.forecast.map(id=>HAZARDS.find(h=>h.id===id).watch).join(' · ')}</strong><small>One arrives</small></button><button class="side-item leader-item" data-panel="leader" style="--role:${roleArt(role).color}"><span class="side-label">${roleIconMarkup(role,'rail-role')} Leader · Player ${(state.round-1)%state.players+1}</span><strong>${role.name}</strong><small>${state.roleUsed[(state.round-1)%state.players]?'Contribution used':fmtEffect(role.boost)+' available'}</small></button><button class="side-item" data-panel="active"><span class="side-label">${icon('active')} In service</span><strong>${state.active.length} / ${ACTIVE_LIMIT} projects</strong><small>${state.active.length?state.active.map(id=>CARDS.find(c=>c.id===id).name).join(' · '):'No ongoing projects yet'}</small></button></aside></div>`;
}
function eventHtml(){
  const e=HAZARDS.find(x=>x.id===state.lastEvent.id),r=state.lastEvent,kind=HAZARD_ART[e.id],graphic=HAZARD_GRAPHICS[e.id],signal=HAZARD_SIGNALS[e.id];
  const artStyle=graphic?`--event-color:${graphic.color}`:photoStyle(kind);
  const artClass=graphic?' graphic-event':'';
  const caption=graphic?'Illustrated risk · fictional season':`${photoFor(kind).place} · archive context`;
  if(state.eventStage==='reveal')return `<div class="frame event-screen event-reveal-new${artClass}" style="${artStyle}"><div class="event-shade"></div>${graphic?`<div class="event-art-symbol" aria-hidden="true">${icon(graphic.icon)}</div>`:''}${signal?`<div class="event-signal" aria-label="${signal.label}"><strong>${icon(signal.icon)}</strong><span>${signal.label}</span></div>`:''}<div class="event-top"><span>Season ${state.round} / 6</span><span>Hazard revealed</span></div><main class="event-centre"><div class="event-glyph">${icon('warning')}</div><div class="eyebrow">The season turns</div><h1>${e.name}</h1><p>${e.story}</p><button class="primary" data-action="impact">See the impact</button></main><div class="event-credit">${caption}</div></div>`;
  return `<div class="frame impact-screen${artClass}" style="${graphic?artStyle:`--event-image:url('./photos/${photoFor(kind).file}')`}"><header class="game-top"><span class="game-brand"><span class="brand-wave">${icon('outrigger')}</span>Island Together</span><span class="season-marker">Season ${state.round} / 6</span></header><main class="impact-main"><div class="impact-photo">${graphic?`<b class="event-impact-symbol" aria-hidden="true">${icon(graphic.icon)}</b>`:''}${signal?`<div class="event-signal impact-signal"><strong>${icon(signal.icon)}</strong><span>${signal.label}</span></div>`:''}<span>${caption}</span></div><section class="impact-report"><div class="eyebrow">Hazard impact</div><h1>${e.name}</h1><p class="impact-story">${e.story}</p><div class="impact-values">${Object.entries(e.base).map(([k,v])=>`<div>${icon(STAT_ICONS[k])}<span>${LABELS[k]}</span><strong>${r.actual[k]===0?'Held':r.actual[k]}</strong></div>`).join('')}</div><p class="impact-protection">${r.mitigated.length?`Protected by ${r.mitigated.join(', ')}.`:'No active project blocked this hazard.'}</p><div class="impact-current">${CONDITIONS.map(k=>`<span>${icon(STAT_ICONS[k])}${LABELS[k]} <b>${state.stats[k]}</b></span>`).join('')}</div><div class="impact-bottom"><a href="${SOURCES.find(s=>s.id===e.source).url}" target="_blank" rel="noopener noreferrer">Field note ↗</a><button class="primary" data-action="advance">${state.round===6?'See score card':'Next season'}</button></div></section></main></div>`;
}
function resultHtml(){
  const values=CONDITIONS.map(k=>state.stats[k]),sum=values.reduce((a,b)=>a+b,0),min=Math.min(...values),grade=min===0?'Strained':sum>=19&&min>=3?'Resilient':sum>=12?'Holding on':'Strained',tone=grade==='Resilient'?'strong':grade==='Holding on'?'mixed':'fragile';
  return `<div class="frame result-screen ${tone}"><header class="game-top"><span class="game-brand"><span class="brand-wave">${icon('outrigger')}</span>Island Together</span><span class="season-marker">Six seasons complete</span></header><main class="result-main"><div class="result-label">ISLAND SCORE CARD</div><div class="result-header"><div><span>Outcome</span><h1>${grade}</h1></div><div class="total-score"><strong>${sum}</strong><span>/ 24</span></div></div><div class="result-grid">${CONDITIONS.map(k=>`<div style="--accent:${COLORS[k]}"><span class="result-name">${icon(STAT_ICONS[k])}${LABELS[k]}</span><strong>${state.stats[k]} <small>/ 6</small></strong><i><em style="width:${state.stats[k]/6*100}%"></em></i></div>`).join('')}</div><div class="result-foot"><p>${state.log.filter(x=>x.detail?.startsWith('Project completed')).length} projects built · ${state.active.length} remain in service</p><p>${grade==='Resilient'?'Strong capacity across all four essentials.':grade==='Holding on'?'The island made it through; some systems remain fragile.':'One or more essentials needs urgent recovery.'}</p></div><button class="primary" data-action="restart">Play again</button></main></div>`;
}
function footer(){return ''}

function infoHtml(){if(!infoModal&&!state?.pendingRetire)return '';if(state?.pendingRetire){const pending=state.pendingRetire,card=pending.newId&&CARDS.find(c=>c.id===pending.newId);return `<div class="overlay"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="retire-title"><div class="eyebrow">Project decision</div><h2 id="retire-title">${pending.mode==='replace'?`Make room for ${card.name}`:'Retire this project?'}</h2><p>${pending.mode==='replace'?'The table holds three ongoing projects. Choose one to retire before this new project takes its place. Its protection and abilities will end.':'Retiring frees a slot and ends its ongoing benefits. There is no refund.'}</p>${pending.mode==='replace'?`<div class="retire-list">${state.active.map(id=>`<button data-replace-retire="${id}">Retire ${CARDS.find(c=>c.id===id).name}</button>`).join('')}</div>`:`<button class="primary" data-confirm-retire="${pending.id}">Retire ${CARDS.find(c=>c.id===pending.id).name}</button>`}<button class="text-button dark" data-action="cancel-retire">Keep current projects</button></section></div>`}
let body=infoModal==='rules'?`<div class="eyebrow">Rules card</div><h2 id="modal-title">Work as one council</h2><ol class="rules-list"><li>Choose a scenario, then each season take up to <strong>two council actions</strong>: build projects, recover a place under pressure, or use a scenario action such as a planned household transition.</li><li>Projects are placed where they operate. <strong>Freight matters:</strong> road-connected projects use main-wharf materials; remote work may wait for boat delivery, and cyclones or shipping disruption can delay it. Pre-positioned supplies create local redundancy.</li><li>Hazards affect specific places. Unprotected places gain <strong>local pressure</strong>. At pressure 3, important systems can cascade into island-wide losses until the place is repaired or recovered.</li><li>Keep up to <strong>three ongoing projects</strong>. Some give conversions, reduce costs, protect against hazards, or require upkeep. The current leader also has a one-time contribution.</li><li><strong>Community effort</strong> is available once each season. Use an action either to restore +1 to a global essential or, from a stressed place on the map, reduce its local pressure by 1.</li><li>Face the season: one of the two forecast hazards arrives. New funds and materials enter between seasons, construction advances, freight can arrive, and critical systems may impose consequences.</li><li>Each scenario has its own mission objectives. The final score is a game summary for discussion, not a real-world resilience assessment. Workshop mode adds a short facilitated pause before each season resolves.</li></ol>`:`<div class="eyebrow">Research & art</div><h2 id="modal-title">Pacific context</h2><p>This fictional island combines pressures experienced differently across the Pacific. Effects and scores are designed for play, not measured adaptation outcomes.</p><p>Documentary photographs show real places and past events, not the fictional island or a current forecast. Photos are cropped in card frames and resized for this web prototype; source files are linked below. This prototype uses credited CC BY, CC BY-SA, NASA and NOAA imagery. An <a href="https://oceanimagebank.theoceanagency.org/about" target="_blank" rel="noopener noreferrer">Ocean Image Bank</a> reef photo is shortlisted, but its <a href="https://oceanimagebank.theoceanagency.org/terms-of-service" target="_blank" rel="noopener noreferrer">site terms</a> restrict reposting and changes. Ask for written permission before adding it to cards. Confirm subject permissions for identifiable people before a MoCC release.</p><h3>Photo credits</h3><ul class="sources photo-credits">${photoCreditList()}</ul><ul class="sources">${SOURCES.map(s=>`<li><a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.label}</a></li>`).join('')}</ul>`;return `<div class="overlay"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">${body}<button class="primary" data-action="close-info">Back to game</button></section></div>`}
function printFront(item){
  const kind=item.kind, data=item.data, artKind=kind==='project'?(PHOTO_USE[data.id]?data.id:data.type):kind==='hazard'?HAZARD_ART[data.id]:null;
  const role=kind==='role'?roleArt(data):null;
  const trackColors={water:'#58bde0',food:'#b5cf75',shelter:'#e2aa6e',community:'#c199df',budget:'#e8c47c',supplies:'#91bec0'};
  const symbols={water:'≈',food:'✳',shelter:'▰',community:'◎',budget:'◈',supplies:'▦',effort:'✦',score:'★',rules:'≡'};
  const accent=role?.color||((kind==='track')?trackColors[data]:(kind==='hazard'?'#e9a478':(data?.accent||'#50d5bc')));
  let body='';
  if(kind==='project'){
    const c=data,rule=c.id==='beds'?'Upkeep: −1 water → +1 food each season':c.id==='wharf'?'Upkeep: pay 1 fund → +1 material each season':c.id==='training'?'Ongoing: material costs −1':c.id==='aid'?'Reduce community loss from any hazard by 1':ABILITIES[c.id]?.rule||'Ongoing: matching hazard protection';
    body=`<div class="print-kicker">${c.type} · ${c.tag?'ongoing':'one-time'} <b>${c.cost[0]} F · ${c.cost[1]} M</b></div><h3>${c.name}</h3><p><strong>Build:</strong> ${fmtEffect(c.effect)}</p><p>${c.text}</p>${c.tag?`<p class="print-rule">${rule}</p>`:''}`;
  } else if(kind==='hazard'){
    body=`<div class="print-kicker">Season hazard</div><h3>${data.name}</h3><p>${data.story}</p><p class="print-rule">${fmtEffect(data.base)}</p><p class="print-small">${data.note}</p>`;
  } else if(kind==='role'){
    body=`<div class="print-kicker">Leader card</div><h3>${data.name}</h3><p>${data.description}</p><p class="print-rule">Once per game: ${fmtEffect(data.boost)}</p>`;
  } else if(kind==='track'){
    body=`<div class="print-kicker">Condition / resource track</div><h3>${LABELS[data]}</h3><p>Mark the current value on a sleeved card.</p><div class="print-track">${Array.from({length:MAX[data]+1},(_,i)=>`<span>${i}</span>`).join('')}</div>`;
  } else if(kind==='effort'){
    body='<div class="print-kicker">Always available</div><h3>Community effort</h3><p>Use one project slot to restore +1 to one condition.</p><p class="print-rule">No funds or materials. Once per season.</p>';
  } else if(kind==='score'){
    body='<div class="print-kicker">Final score card</div><h3>Six seasons complete</h3><p>Water ___ / 6<br>Food ___ / 6<br>Shelter ___ / 6<br>Community ___ / 6</p><p class="print-total">Total ___ / 24</p><div class="print-grades"><span class="strained"><b>Strained</b> Any 0 or total &lt; 12</span><span class="holding"><b>Holding on</b> 12+ with all above 0; below Resilient</span><span class="resilient"><b>Resilient</b> 19+ and every condition 3+</span></div>';
  } else {
    body='<div class="print-kicker">Rules card</div><h3>Island Together</h3><p>Choose up to 2 projects each season. Keep up to 3 ongoing projects. Reveal 2 hazards as the forecast, turn them face down and mix; draw one to resolve. Use leader powers and active abilities.</p><p class="print-rule">After 6 seasons: keep every condition above 0; 19+ total and all at 3+ earns Resilient.</p>';
  }
  const graphic=kind==='hazard'&&HAZARD_GRAPHICS[data.id],signal=kind==='hazard'&&HAZARD_SIGNALS[data.id];
  const printArt=artKind?`<div class="print-art photo" style="${photoStyle(artKind)}">${signal?`<span class="print-signal"><b>${signal.symbol}</b> ${signal.label}</span>`:''}<span class="photo-location">${photoFor(artKind).place}</span></div>`:
    `<div class="print-art print-graphic ${kind==='role'?'role-graphic':''}" style="--graphic-color:${graphic?.color||accent}"><span class="graphic-symbol" aria-hidden="true">${graphic?.symbol||role?.symbol||symbols[data]||symbols[kind]}</span><span class="graphic-caption">${graphic?.label||role?.name||('Island Together · '+(kind==='track'?'track':kind))}</span></div>`;
  return `<article class="print-card print-front" style="--accent:${accent}">${printArt}<div class="print-content">${body}</div></article>`;
}
function printBack(item){const color=item.kind==='hazard'?'#e9a478':item.kind==='role'?'#b998d7':item.kind==='project'?'#50d5bc':'#8ab6b8';return `<article class="print-card print-back" style="--accent:${color}"><div class="back-ring"><div class="back-wave">≈</div><strong>Island<br>Together</strong><small>${item.kind==='hazard'?'SEASON HAZARD':item.kind==='project'?'PROJECT':item.kind==='role'?'LEADER':'COUNCIL'}</small></div></article>`}
function printHtml(){
  const roles=[...new Map([2,3,4].flatMap(rolesFor).map(r=>[r.name,r])).values()];
  const items=[...CARDS.map(data=>({kind:'project',data})),...HAZARDS.map(data=>({kind:'hazard',data})),...roles.map(data=>({kind:'role',data})),...['water','food','shelter','community','budget','supplies'].map(data=>({kind:'track',data})),{kind:'effort'},{kind:'score'},{kind:'rules'}];
  const sheets=[];
  for(let i=0;i<items.length;i+=9){
    const group=items.slice(i,i+9);while(group.length<9)group.push(null);
    sheets.push(`<section class="print-sheet">${group.map(x=>x?printFront(x):'<div></div>').join('')}</section><section class="print-sheet back-sheet">${[0,1,2].flatMap(row=>group.slice(row*3,row*3+3).reverse()).map(x=>x?printBack(x):'<div></div>').join('')}</section>`);
  }
  return `<div class="print-ui"><h1>Island Together · card proof</h1><p>${items.length} distinct fronts and matching backs, including projects, hazards, leaders, tracks, community effort, rules and score card. The last page records photo credits. Home proof: print A4 portrait at actual size, two-sided with a long-edge flip. Test one sheet for alignment. Sleeve the six tracks and mark them with an erasable pen.</p><p>Production target: 63 × 88 mm finished cards, 3 mm bleed, 4 mm text-safe area. This proof uses screen artwork and cut-sheet layouts; prepare high-resolution press files with crop marks before manufacturing.</p><div class="print-actions"><button class="primary" data-action="print">Print card sheets</button><a class="text-button" href="./">Back to game</a></div></div><main class="print-deck">${sheets.join('')}<section class="print-credits"><h2>Island Together · photo credits</h2><p>Photographs are cropped in the card frames. Archive examples represent real places and past events; the game's island and seasons are fictional.</p><ol>${photoCreditList()}</ol><p>Prototype photo inventory is in the game source. Confirm publication rights and subject permissions for a MoCC edition.</p></section></main>`;
}
function render(){
  const print=typeof location!=='undefined'&&new URLSearchParams(location.search).has('print');
  document.body.classList.toggle('is-print',print);
  app.innerHTML=print?printHtml():(!state?setupHtml():state.phase==='play'?gameHtml():state.phase==='event'?eventHtml():resultHtml())+panelMarkup()+infoHtml();
}
app.addEventListener('click',e=>{
  const t=e.target.closest('button,[data-info]');if(!t)return;
  if(t.dataset.closePanel!==undefined){edgePanel=null;render();return}
  if(t.dataset.panel){edgePanel=t.dataset.panel;render();return}
  if(t.dataset.focus){focusIndex+=Number(t.dataset.focus);render();return}
  if(t.dataset.cardIndex!==undefined){focusIndex=Number(t.dataset.cardIndex);render();return}
  if(t.dataset.info){e.preventDefault();edgePanel=null;infoModal=t.dataset.info;render();return}
  if(t.dataset.players){selectedPlayers=Number(t.dataset.players);render();return}
  if(t.dataset.play){playCard(t.dataset.play);return}
  if(t.dataset.projectAbility){useProject(t.dataset.projectAbility);return}
  if(t.dataset.effort){edgePanel=null;communityEffort(t.dataset.effort);return}
  if(t.dataset.retireRequest){state.pendingRetire={mode:'voluntary',id:t.dataset.retireRequest};render();return}
  if(t.dataset.replaceRetire){playCard(state.pendingRetire.newId,t.dataset.replaceRetire);return}
  if(t.dataset.confirmRetire){retireProject(t.dataset.confirmRetire);state.pendingRetire=null;save();render();return}
  switch(t.dataset.action){case 'start':startGame();break;case 'ability':useAbility();break;case 'resolve':resolveRound();break;case 'impact':showImpact();break;case 'advance':advance();break;case 'restart':state=null;save();render();break;case 'close-info':infoModal=null;render();break;case 'cancel-retire':state.pendingRetire=null;render();break;case 'print':window.print();break}
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    if(state?.pendingRetire)state.pendingRetire=null;
    else if(infoModal)infoModal=null;
    else if(edgePanel)edgePanel=null;
    else return;
    render();
  } else if(state?.phase==='play'&&!edgePanel&&!infoModal&&['ArrowLeft','ArrowRight'].includes(e.key)){
    focusIndex+=e.key==='ArrowRight'?1:-1;render();e.preventDefault();
  }
});
let swipeStartX=null;
app.addEventListener('touchstart',e=>{if(e.target.closest('.focus-zone'))swipeStartX=e.changedTouches[0].clientX},{passive:true});
app.addEventListener('touchend',e=>{if(swipeStartX===null)return;const dx=e.changedTouches[0].clientX-swipeStartX;swipeStartX=null;if(Math.abs(dx)>55&&state?.phase==='play'&&!edgePanel){focusIndex+=dx<0?1:-1;render()}},{passive:true});

function registerWebMCP(){const m=document.modelContext;if(!m?.registerTool)return;const defs=[
  {name:'read_island_game',title:'Read island game',description:'Read the current round, resources, cards and phase without changing the game.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>snapshot()},
  {name:'start_island_game',title:'Start island game',description:'Start a new cooperative six-season game with 2, 3 or 4 players.',inputSchema:{type:'object',properties:{players:{type:'integer',enum:[2,3,4]}},required:['players'],additionalProperties:false},execute:x=>startGame(x.players)},
  {name:'play_island_project',title:'Play project card',description:'Spend the visible costs and complete one card from the current hand. When all three ongoing slots are full, supply the active card ID to retire.',inputSchema:{type:'object',properties:{cardId:{type:'string',enum:CARDS.map(c=>c.id)},retireId:{type:'string',enum:CARDS.filter(c=>c.tag).map(c=>c.id)}},required:['cardId'],additionalProperties:false},execute:x=>{const c=CARDS.find(c=>c.id===x.cardId);if(c?.tag&&state?.active.length>=ACTIVE_LIMIT&&!state.active.includes(c.id)&&!x.retireId)throw Error('Choose retireId for an active project.');return playCard(x.cardId,x.retireId)}},
  {name:'activate_island_project',title:'Use active project',description:'Use one conversion ability on an active project this season.',inputSchema:{type:'object',properties:{cardId:{type:'string',enum:Object.keys(ABILITIES)}},required:['cardId'],additionalProperties:false},execute:x=>useProject(x.cardId)},
  {name:'island_community_effort',title:'Community effort',description:'Use a project slot for one free point in water, food, shelter or community.',inputSchema:{type:'object',properties:{condition:{type:'string',enum:['water','food','shelter','community']}},required:['condition'],additionalProperties:false},execute:x=>communityEffort(x.condition)},
  {name:'use_island_role',title:'Use role contribution',description:'Use the active player role’s one-time contribution.',inputSchema:{type:'object',properties:{},additionalProperties:false},execute:()=>useAbility()},
  {name:'resolve_island_round',title:'Face the season',description:'Resolve the current forecast hazard after the team finishes choosing projects.',inputSchema:{type:'object',properties:{},additionalProperties:false},execute:()=>resolveRound()},
  {name:'view_island_impact',title:'View hazard impact',description:'After the hazard card reveals, show its effects and the island conditions.',inputSchema:{type:'object',properties:{},additionalProperties:false},execute:()=>showImpact()},
  {name:'advance_island_round',title:'Next season',description:'After viewing the hazard outcome, advance to the next season or final result.',inputSchema:{type:'object',properties:{},additionalProperties:false},execute:()=>advance()}
];for(const d of defs){try{Promise.resolve(m.registerTool(d)).catch(()=>{})}catch(_){}}}
render();registerWebMCP();
