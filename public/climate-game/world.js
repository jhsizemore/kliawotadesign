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
  return ({port:'shipping',town:'community',clinic:'health',school:'shelter',gardens:'food',water:'water',village:'shelter',outer:'outrigger',site:'shelter'})[kind] || 'community';
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
function sceneSymbolDefs(){
  return `
<g id="scene-house"><rect x="-11" y="-5" width="22" height="14" rx="1.5" fill="#dbc79e" stroke="#5a4938" stroke-width="1.4"/><path d="M-14 -5 L0 -15 L14 -5 Z" fill="#9b573f" stroke="#583b31" stroke-width="1.4"/><rect x="-2" y="1" width="5" height="8" fill="#705646"/><rect x="-8" y="-1" width="4" height="4" fill="#75a7a1"/></g>
<g id="scene-reinforced-house"><use href="#scene-house"/><path d="M-13 -4 L-8 9 M13 -4 L8 9 M-7 -10 L-4 9 M7 -10 L4 9" fill="none" stroke="#e4d17f" stroke-width="1.5"/></g>
<g id="scene-island-house"><rect x="-10" y="-3" width="20" height="12" rx="1" fill="#c7ae7c" stroke="#654e35" stroke-width="1.2"/><path d="M-15 -3 L0 -18 L15 -3 Z" fill="#87704b" stroke="#59452f" stroke-width="1.2"/><path d="M-10 -8 L10 -8 M-7 -12 L7 -12" stroke="#c2aa77" stroke-width="1" opacity=".7"/><path d="M-8 1 H8 M-8 5 H8" stroke="#8d7047" stroke-width=".8" opacity=".65"/><rect x="-2" y="2" width="4" height="7" fill="#5f4936"/></g>
<g id="scene-community-house"><path d="M-19 -4 L0 -18 L19 -4 Z" fill="#8b7048" stroke="#58452f" stroke-width="1.4"/><path d="M-15 -4 V10 M-5 -4 V10 M5 -4 V10 M15 -4 V10 M-17 10 H17" fill="none" stroke="#74583b" stroke-width="2"/><path d="M-11 3 H11" stroke="#d0b47d" stroke-width="2"/></g>
<g id="scene-market"><rect x="-15" y="-3" width="30" height="13" rx="2" fill="#d7c49c" stroke="#5f4936" stroke-width="1.2"/><path d="M-18 -3 L-10 -13 L12 -13 L18 -3 Z" fill="#b36b49" stroke="#644331" stroke-width="1.2"/><path d="M-10 10 V15 M10 10 V15" stroke="#614d3a" stroke-width="2"/></g>
<g id="scene-clinic"><rect x="-14" y="-8" width="28" height="18" rx="2" fill="#e4e2cf" stroke="#56615a" stroke-width="1.3"/><path d="M-16 -8 L0 -16 L16 -8 Z" fill="#80998a"/><path d="M0 -5 V5 M-5 0 H5" stroke="#b05757" stroke-width="2.3"/><rect x="-11" y="2" width="5" height="8" fill="#6f7268"/></g>
<g id="scene-school"><rect x="-18" y="-7" width="36" height="18" rx="2" fill="#d7c899" stroke="#5b4f3d" stroke-width="1.3"/><path d="M-21 -7 L0 -16 L21 -7 Z" fill="#885a43"/><rect x="-4" y="1" width="8" height="10" fill="#655243"/><rect x="-14" y="-2" width="6" height="5" fill="#7ba7a3"/><rect x="8" y="-2" width="6" height="5" fill="#7ba7a3"/></g>
<g id="scene-workshop"><rect x="-15" y="-5" width="30" height="16" fill="#b79e76" stroke="#594837" stroke-width="1.3"/><path d="M-18 -5 L-7 -14 L17 -8 L18 -5 Z" fill="#77766a"/><path d="M8 2 l5 5 M13 2 l-5 5" stroke="#443e35" stroke-width="1.5"/></g>
<g id="scene-palm"><path d="M0 17 Q-2 5 2 -8" fill="none" stroke="#735c38" stroke-width="3" stroke-linecap="round"/><path d="M1 -8 Q-13 -12 -17 -5 M1 -8 Q14 -15 18 -7 M1 -8 Q-10 -20 -15 -18 M1 -8 Q10 -21 15 -18 M1 -8 Q0 -22 2 -24" fill="none" stroke="#2e7456" stroke-width="3.2" stroke-linecap="round"/><circle cx="1" cy="-9" r="3" fill="#8a6b35"/></g>
<g id="scene-tree"><path d="M0 14 V2" stroke="#695239" stroke-width="3"/><circle cx="-5" cy="-2" r="8" fill="#32694f"/><circle cx="6" cy="-4" r="9" fill="#3e7956"/><circle cx="0" cy="-10" r="8" fill="#4b845b"/></g>
<g id="scene-garden"><rect x="-17" y="-11" width="34" height="22" rx="3" fill="#829252" stroke="#d2c982" stroke-width="1.2"/><path d="M-13 -7 H13 M-13 -1 H13 M-13 5 H13" stroke="#d9cf83" stroke-width="2" opacity=".75"/></g>
<g id="scene-wharf"><path d="M-3 -18 V11 M-3 -3 H15 M-3 4 H12" stroke="#a67e52" stroke-width="4" stroke-linecap="round"/><path d="M-7 -18 H1 M-7 11 H1" stroke="#dbc08c" stroke-width="2"/><path d="M11 14 q7 3 13 0 l-2 5 q-6 4 -13 0z" fill="#714d37" stroke="#342f2a" stroke-width="1"/></g>
<g id="scene-canoe"><path d="M-18 0 Q0 8 18 0 Q7 12 -12 7 Z" fill="#7c5135" stroke="#342d28" stroke-width="1.2"/><path d="M-12 -2 H13" stroke="#d7c289" stroke-width="1.5"/><path d="M10 6 H22 M22 6 V10 M18 10 H26" stroke="#d2ba7f" stroke-width="1.5"/></g>
<g id="scene-workboat"><path d="M-19 2 H19 L13 11 H-14 Z" fill="#d5c68c" stroke="#3e4a48" stroke-width="1.4"/><rect x="-8" y="-7" width="14" height="9" fill="#e8e5d4" stroke="#51615f" stroke-width="1"/><path d="M1 -7 L9 -13 L12 2" fill="#8da8a5" stroke="#4d6360"/></g>
<g id="scene-tank"><ellipse cx="0" cy="-7" rx="10" ry="4" fill="#b7d6d2" stroke="#506f6f"/><rect x="-10" y="-7" width="20" height="15" fill="#8fb9b6" stroke="#506f6f"/><ellipse cx="0" cy="8" rx="10" ry="4" fill="#719f9d" stroke="#506f6f"/><path d="M-6 11 V16 M6 11 V16" stroke="#5e675d" stroke-width="2"/></g>
<g id="scene-radio"><path d="M0 -20 L-9 15 H9 Z M-6 6 H6 M-4 -2 H4 M-2 -10 H2" fill="none" stroke="#d2cda8" stroke-width="1.5"/><path d="M-13 -14 Q0 -24 13 -14 M-17 -8 Q0 -25 17 -8" fill="none" stroke="#74d4c6" stroke-width="1.4" opacity=".8"/></g>
<g id="scene-crates"><rect x="-13" y="-5" width="11" height="11" fill="#a8794a" stroke="#5b4432"/><rect x="1" y="-8" width="12" height="14" fill="#b18454" stroke="#5b4432"/><path d="M-11 -2 L-4 4 M-4 -2 L-11 4 M3 -4 L11 3 M11 -4 L3 3" stroke="#d2b07c" stroke-width="1"/></g>
<g id="scene-mangrove"><path d="M-12 9 Q-8 -3 -4 -9 M0 10 Q1 -5 5 -12 M12 8 Q8 -2 9 -9" fill="none" stroke="#6b553a" stroke-width="2"/><circle cx="-5" cy="-9" r="8" fill="#2f7258"/><circle cx="5" cy="-12" r="9" fill="#3f805e"/><circle cx="10" cy="-6" r="7" fill="#2f6d52"/><path d="M-10 8 L-15 14 M-5 8 L-3 15 M5 8 L2 15 M10 7 L15 13" stroke="#6b553a" stroke-width="1.5"/></g>
<g id="scene-reef"><path d="M-21 2 C-15 -12 -2 -15 4 -5 C12 -14 24 -8 21 3 C18 15 5 18 -3 11 C-9 18 -21 14 -21 2Z" fill="none" stroke="#73cfc0" stroke-width="3" stroke-dasharray="3 4" opacity=".7"/><circle cx="-7" cy="1" r="3" fill="#8bcab6" opacity=".65"/><circle cx="8" cy="5" r="2.5" fill="#d2b47c" opacity=".65"/></g>
<g id="scene-spring"><ellipse cx="0" cy="7" rx="13" ry="7" fill="#5cb4c0" opacity=".8"/><path d="M-4 4 Q0 -9 6 -14 Q12 -7 8 4" fill="none" stroke="#85d5d7" stroke-width="2"/><path d="M-11 8 Q0 2 11 8" fill="none" stroke="#d8e1b2" stroke-width="1.2"/></g>
<g id="scene-meeting"><circle cx="0" cy="2" r="12" fill="none" stroke="#d6c997" stroke-width="2" stroke-dasharray="2 3"/><circle cx="-8" cy="-4" r="2.6" fill="#795843"/><circle cx="7" cy="-6" r="2.6" fill="#75523e"/><circle cx="8" cy="8" r="2.6" fill="#825b40"/><circle cx="-7" cy="9" r="2.6" fill="#6c4d3c"/></g>
<g id="scene-bridge"><path d="M-16 5 H16" stroke="#855f3e" stroke-width="5"/><path d="M-13 0 V10 M-6 0 V10 M1 0 V10 M8 0 V10 M15 0 V10" stroke="#d1b27c" stroke-width="1.7"/><path d="M-18 14 Q0 6 18 14" fill="none" stroke="#5eb7c5" stroke-width="2"/></g>
<g id="scene-drain"><path d="M-18 -6 Q-8 1 0 -5 T18 -4 M-18 4 Q-8 11 0 5 T18 6" fill="none" stroke="#71c5cf" stroke-width="2"/><path d="M-18 -10 V10 M18 -9 V11" stroke="#bea97a" stroke-width="2"/></g>
<g id="scene-foundation"><path d="M-14 -7 L11 -9 L15 8 L-10 10 Z" fill="#c8bea0" stroke="#806f55" stroke-width="1.3" stroke-dasharray="3 2"/><path d="M-12 -5 L13 6 M12 -7 L-8 8" stroke="#9a8767" stroke-width="1"/></g>
<g id="scene-scaffold"><use href="#scene-foundation"/><path d="M-13 -13 V10 M0 -16 V9 M13 -13 V9 M-15 -6 H15 M-15 2 H15" fill="none" stroke="#b78a57" stroke-width="1.4"/></g>
<g id="scene-person"><circle cx="0" cy="-4" r="2.4" fill="#5d3d2d"/><path d="M0 -1 V6 M0 2 L-4 5 M0 2 L4 5 M0 6 L-3 11 M0 6 L3 11" fill="none" stroke="#704b36" stroke-width="1.8" stroke-linecap="round"/></g>
<g id="scene-flood"><ellipse cx="0" cy="3" rx="19" ry="8" fill="#4eabc0" opacity=".45"/><path d="M-15 1 Q-8 -3 -1 1 T13 1 M-11 6 Q-4 2 3 6 T15 6" fill="none" stroke="#a0dce2" stroke-width="1.4" opacity=".8"/></g>
<g id="scene-damage"><path d="M-13 8 L-4 -5 L4 1 L13 -12 M-10 -8 L-2 -2 M5 -9 L12 -4" fill="none" stroke="#d0a16d" stroke-width="3" stroke-linecap="round"/><circle cx="13" cy="-12" r="3" fill="#d96d5d"/></g>
<g id="scene-fallen-tree"><path d="M-17 8 L14 -6" stroke="#76573b" stroke-width="4" stroke-linecap="round"/><circle cx="16" cy="-7" r="8" fill="#467857"/><circle cx="10" cy="-12" r="6" fill="#39704f"/></g>
  `;
}

function scenarioFeatureSvg(f){
  return `<path class="terrain-feature feature-${f.kind}" d="${f.d}"/>`;
}
function scenarioLandSvg(s){
  const features=s.features||[];
  const under=features.filter(f=>['reef-flat','lagoon'].includes(f.kind)).map(scenarioFeatureSvg).join('');
  const land=(s.landforms||[]).map((shape,i)=>{
    const shelf=shape.reef?`<path class="reef-shelf reef-shelf-outer" d="${shape.d}"/><path class="reef-shelf reef-shelf-inner" d="${shape.d}"/>`:'';
    const surf=shape.surf?`<path class="coast-surf" d="${shape.d}"/>`:'';
    return `${shelf}<g filter="url(#islandShadow)"><path class="island scenario-island island-${shape.id||i}" d="${shape.d}"/><path class="land-texture" d="${shape.d}"/></g>${surf}`;
  }).join('');
  const waterTop=features.filter(f=>['harbour','reef-pass'].includes(f.kind)).map(scenarioFeatureSvg).join('');
  const terrain=features.filter(f=>!['reef-flat','lagoon','harbour','reef-pass'].includes(f.kind)).map(scenarioFeatureSvg).join('');
  return `<g class="scenario-geography">${under}${land}${waterTop}${terrain}</g>`;
}
function scenarioRoadSvg(s){
  return `<g class="roads">${(s.links||[]).filter(l=>l.mode!=='boat').map(l=>`<path d="${l.d||worldLinkPath(l.a,l.b)}" class="world-${l.mode||'path'}"/>`).join('')}</g>`;
}
function scenarioMiniMap(s){
  const features=s.features||[];
  const reef=features.filter(f=>f.kind==='reef-flat').map(f=>`<path d="${f.d}" fill="none" stroke="#4fb6b0" stroke-width="42" opacity=".22"/>`).join('');
  const lagoon=features.filter(f=>f.kind==='lagoon').map(f=>`<path d="${f.d}" fill="#3a8790" opacity=".62"/>`).join('');
  const highland=features.filter(f=>f.kind==='highland').map(f=>`<path d="${f.d}" fill="#315d54" opacity=".68"/>`).join('');
  const boats=(s.links||[]).filter(l=>l.mode==='boat').map(l=>`<path d="${l.d||worldLinkPath(l.a,l.b)}" stroke="#91e4d7" stroke-width="5" stroke-dasharray="12 12" fill="none"/>`).join('');
  return `<svg viewBox="0 0 1080 720" aria-hidden="true"><rect width="1080" height="720" fill="#0a3442"/>${reef}${lagoon}${(s.landforms||[]).map(x=>`<path d="${x.d}" fill="#5d9672" stroke="#96d5c6" stroke-width="4"/>`).join('')}${highland}${boats}</svg>`;
}
const PROJECT_SCENE = Object.freeze({
  tank:'tank',repair:'reinforced-house',spring:'spring',waterplan:'meeting',
  beds:'garden',seeds:'garden',crops:'garden',reef:'mangrove',
  roofs:'reinforced-house',school:'school',drain:'drain',paths:'bridge',
  radio:'radio',training:'workshop',plan:'meeting',health:'clinic',
  stock:'crates',wharf:'wharf',savings:'meeting',aid:'canoe'
});
function sceneUse(kind,x,y,scale=1,rotate=0,className=''){
  return `<use href="#scene-${kind}" class="scene-use ${className}" transform="translate(${Number(x).toFixed(1)} ${Number(y).toFixed(1)}) rotate(${rotate}) scale(${scale})"/>`;
}
function nodeSceneSvg(node,index=0){
  const x=node.x*10.8,y=node.y*7.2,seed=(index%3)-1;
  if(node.kind==='port') return `<g class="node-scenery scenery-port">${sceneUse('wharf',x-17,y+9,.85,-8)}${sceneUse('canoe',x+24,y+23,.65,-10)}${sceneUse('crates',x-5,y-18,.65)}</g>`;
  if(node.kind==='town') return `<g class="node-scenery scenery-town">${sceneUse('house',x-28,y+13,.78,-5)}${sceneUse('house',x+24,y+17,.7,4)}${sceneUse('house',x-18,y-19,.66,7)}${sceneUse('market',x+18,y-18,.75,-4)}${sceneUse('palm',x+41,y-4,.72)}${sceneUse('person',x+1,y+20,.7)}${sceneUse('person',x+10,y+12,.62)}</g>`;
  if(node.kind==='clinic') return `<g class="node-scenery scenery-clinic">${sceneUse('clinic',x+18,y+12,.76,-4)}${sceneUse('house',x-20,y+15,.55,3)}${sceneUse('palm',x+34,y-15,.58)}</g>`;
  if(node.kind==='school') return `<g class="node-scenery scenery-school">${sceneUse('school',x+18,y+13,.76,-3)}${sceneUse('tree',x-23,y+7,.7)}${sceneUse('tree',x+34,y-12,.55)}${sceneUse('person',x+1,y+22,.58)}${sceneUse('person',x+9,y+24,.52)}</g>`;
  if(node.kind==='gardens') return `<g class="node-scenery scenery-gardens">${sceneUse('garden',x-22,y+12,.72,-8)}${sceneUse('garden',x+22,y+5,.68,8)}${sceneUse('palm',x+34,y-17,.55)}</g>`;
  if(node.kind==='water') return `<g class="node-scenery scenery-water">${sceneUse('spring',x+16,y+14,.72)}${sceneUse('tree',x-24,y+9,.74)}${sceneUse('tree',x+30,y-13,.52)}</g>`;
  if(node.kind==='site') return `<g class="node-scenery scenery-site">${sceneUse('foundation',x-17,y+13,.65,-5)}${sceneUse('foundation',x+22,y+8,.55,7)}${sceneUse('tree',x+34,y-12,.55)}</g>`;
  const villageHouse=worldScenario().id==='atoll_water'?'house':'island-house';
  return `<g class="node-scenery scenery-village">${sceneUse(villageHouse,x-24,y+14,.65,-6)}${sceneUse('house',x+20,y+15,.58,5)}${sceneUse('community-house',x-8,y-17,.48,2)}${sceneUse('palm',x+35,y-7,.65)}${sceneUse('palm',x-38,y-3,.52)}${sceneUse('person',x+3,y+21,.58)}${node.kind==='outer'?sceneUse('canoe',x+36,y+26,.55,seed*8):''}</g>`;
}
function landscapeItemSvg(item){
  const x=item.x*10.8,y=item.y*7.2,s=item.scale??1,r=item.rotate??0,k=item.kind;
  if(k==='forest') return `<g class="scenic-cluster scenic-forest">${sceneUse('tree',x-17*s,y+7*s,.78*s)}${sceneUse('tree',x+1*s,y-7*s,.96*s)}${sceneUse('tree',x+19*s,y+9*s,.72*s)}${sceneUse('tree',x+30*s,y-10*s,.58*s)}</g>`;
  if(k==='palms') return `<g class="scenic-cluster scenic-palms">${sceneUse('palm',x-14*s,y+5*s,.8*s,r)}${sceneUse('palm',x+5*s,y-5*s,.95*s,r+4)}${sceneUse('palm',x+22*s,y+7*s,.7*s,r-5)}</g>`;
  if(k==='reef') return `<g class="scenic-cluster scenic-reef">${sceneUse('reef',x,y,s,r)}</g>`;
  if(k==='canoe') return sceneUse('canoe',x,y,s,r,'scenic-canoe');
  if(k==='boat') return sceneUse('workboat',x,y,s,r,'scenic-workboat');
  if(k==='garden') return sceneUse('garden',x,y,s,r,'scenic-garden');
  if(k==='village') return `<g class="scenic-cluster scenic-village">${sceneUse('house',x-16*s,y+5*s,.62*s,r-4)}${sceneUse('house',x+15*s,y+6*s,.58*s,r+5)}${sceneUse('palm',x+28*s,y-9*s,.62*s,r)}</g>`;
  return '';
}
function scenarioSettlementSvg(s){
  const authored=(s.landscape||[]).map(landscapeItemSvg).join('');
  const nodes=(s.nodes||[]).map((n,i)=>nodeSceneSvg(n,i)).join('');
  return `<g class="settlement-layer">${authored}${nodes}</g>`;
}
function projectLandscapeSvg(){
  if(!state) return '';
  const offsets=[[-27,-17],[27,-15],[-27,22],[27,23],[0,31],[-4,-31]];
  const byZone=new Map();
  return `<g class="project-landscape">${(state.placements||[]).map(p=>{
    const node=worldNode(p.zoneId),card=CARDS.find(c=>c.id===p.cardId),kind=PROJECT_SCENE[p.cardId];
    if(!node||!kind||!card) return '';
    const count=byZone.get(p.zoneId)||0;byZone.set(p.zoneId,count+1);
    const [dx,dy]=offsets[count%offsets.length],x=node.x*10.8+dx,y=node.y*7.2+dy;
    const scale=['wharf','school'].includes(kind)?.72:['meeting','canoe'].includes(kind)?.58:.62;
    return sceneUse(kind,x,y,scale,(count%2?5:-5),`project-scenery project-${p.cardId}`);
  }).join('')}</g>`;
}
function constructionLandscapeSvg(){
  if(!state?.construction?.length) return '';
  return `<g class="construction-landscape">${state.construction.filter(q=>q.status==='building').map((q,i)=>{
    const node=worldNode(q.zoneId);if(!node)return '';
    return sceneUse('scaffold',node.x*10.8+(i%2?22:-22),node.y*7.2+24,.62,i%2?6:-6,'construction-scenery');
  }).join('')}</g>`;
}

function relocationLandscapeSvg(){
  const special=worldScenario().special;
  if(!state?.relocation||special?.kind!=='relocation') return '';
  const offsets=[[-22,18],[21,18],[-2,-22],[35,-5],[-34,-5]];
  return `<g class="relocation-landscape">${Object.entries(state.relocation.sites||{}).map(([zoneId,count])=>{
    const node=worldNode(zoneId);if(!node)return '';
    const x=node.x*10.8,y=node.y*7.2,n=Math.min(offsets.length,Number(count||0));
    return Array.from({length:n},(_,i)=>{const [dx,dy]=offsets[i];return sceneUse('house',x+dx,y+dy,.58,i%2?5:-5,'relocation-home');}).join('')+(n>=3?sceneUse('community-house',x,y+31,.46,0,'relocation-community-house'):'');
  }).join('')}</g>`;
}

function stressLandscapeSvg(){
  if(!state?.zoneStress) return '';
  return `<g class="stress-landscape">${Object.entries(state.zoneStress).map(([zoneId,value],i)=>{
    const stress=Number(value||0),node=worldNode(zoneId);if(!node||stress<=0)return '';
    const x=node.x*10.8,y=node.y*7.2;
    return `${sceneUse('flood',x+18,y+27,.56,0,`stress-scenery stress-${stress}`)}${stress>=2?sceneUse('damage',x-24,y-18,.58,i%2?8:-8,`stress-scenery stress-${stress}`):''}${stress>=3?sceneUse('fallen-tree',x+31,y-22,.62,-10,'stress-scenery stress-3'):''}`;
  }).join('')}</g>`;
}

function scenarioRouteTrafficSvg(s){
  const routes=(s.links||[]).filter(l=>l.mode==='boat');
  if(!routes.length) return '';
  return `<g class="route-traffic" aria-hidden="true">${routes.map((l,i)=>{
    const d=l.d||worldLinkPath(l.a,l.b),dur=15+(i%3)*4,begin=-(i*4+2);
    return `<g class="route-boat"><use href="#scene-canoe" transform="scale(.48)"/><animateMotion dur="${dur}s" repeatCount="indefinite" begin="${begin}s" path="${d}"/></g>`;
  }).join('')}</g>`;
}

function hazardAtmosphere(id){
  if(!id) return '';
  if(id==='cyclone'||id==='rain'){
    const drops=Array.from({length:id==='cyclone'?22:14},(_,i)=>`<i style="--i:${i};--x:${(i*37)%100}%"></i>`).join('');
    return `<div class="hazard-atmosphere weather-${id}" aria-hidden="true"><div class="storm-cloud cloud-a"></div><div class="storm-cloud cloud-b"></div><div class="rain-field">${drops}</div></div>`;
  }
  if(id==='tide') return `<div class="hazard-atmosphere weather-tide" aria-hidden="true"><i></i><i></i><i></i></div>`;
  if(id==='dry') return `<div class="hazard-atmosphere weather-dry" aria-hidden="true"><i class="heat-disc"></i><i class="heat-haze"></i></div>`;
  if(id==='reefheat') return `<div class="hazard-atmosphere weather-reefheat" aria-hidden="true"><i></i></div>`;
  if(id==='shipping') return `<div class="hazard-atmosphere weather-shipping" aria-hidden="true">${icon('shipping')}</div>`;
  if(id==='fuel') return `<div class="hazard-atmosphere weather-fuel" aria-hidden="true">${icon('fuel')}</div>`;
  if(id==='illness') return `<div class="hazard-atmosphere weather-illness" aria-hidden="true">${icon('health')}</div>`;
  return '';
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
        <linearGradient id="land" x1="0" y1="0" x2="0.9" y2="1"><stop offset="0" stop-color="#9dbe7a"/><stop offset=".46" stop-color="#5f966b"/><stop offset="1" stop-color="#32675a"/></linearGradient>
        <linearGradient id="highland" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#698665"/><stop offset="1" stop-color="#244f4c"/></linearGradient>
        <radialGradient id="lagoonWater" cx="48%" cy="45%" r="60%"><stop offset="0" stop-color="#47aab0"/><stop offset=".72" stop-color="#2f7e88"/><stop offset="1" stop-color="#276873"/></radialGradient>
        <pattern id="landTexture" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="5" cy="6" r="1.3" fill="#d5dda1" opacity=".16"/><circle cx="16" cy="13" r="1.1" fill="#153f3e" opacity=".14"/><path d="M2 19 Q8 14 14 18" fill="none" stroke="#173f3c" stroke-width="1" opacity=".08"/></pattern>
        <pattern id="gardenPattern" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(-12)"><path d="M0 3 H14 M0 9 H14" stroke="#d8d28a" stroke-width="2" opacity=".62"/></pattern>
        <pattern id="settlementPattern" width="18" height="18" patternUnits="userSpaceOnUse"><rect x="2" y="4" width="6" height="5" rx="1" fill="#e8d9b6" opacity=".75"/><rect x="10" y="10" width="6" height="5" rx="1" fill="#caa97d" opacity=".68"/></pattern>
        <filter id="islandShadow"><feDropShadow dx="0" dy="9" stdDeviation="10" flood-color="#001b23" flood-opacity=".42"/></filter>
        ${sceneSymbolDefs()}
      </defs>
      <rect width="1080" height="720" fill="url(#ocean)"/>
      ${scenarioLandSvg(s)}
      ${scenarioRoadSvg(s)}
      ${scenarioSettlementSvg(s)}
      ${projectLandscapeSvg()}
      ${constructionLandscapeSvg()}
      <g class="routes ${shippingRisk?'route-risk':''}" fill="none">
        ${s.links.filter(l=>l.mode==='boat').map(l=>`<path d="${l.d||worldLinkPath(l.a,l.b)}" class="boat-route ${freightTargets.has(l.b)?'freight-active':''}"/>`).join('')}
      </g>
      ${scenarioRouteTrafficSvg(s)}
    </svg>
    ${opts.hazardId?hazardAtmosphere(opts.hazardId):''}
    <div class="world-scenario-label"><span>Scenario</span><strong>${s.name}</strong><small>${s.strap}</small></div>
    ${(state?.construction||[]).filter(q=>q.status==='in-transit'||q.status==='delayed').map((q,i)=>{
      const from=worldNode('port'),to=worldNode(q.zoneId);
      if(!from||!to) return '';
      const x=from.x+(to.x-from.x)*.52,y=from.y+(to.y-from.y)*.52;
      return `<button class="freight-boat ${q.status==='delayed'?'delayed':''}" style="--x:${x}%;--y:${y}%;--delay:${i*.18}s" data-world-zone="${q.zoneId}" aria-label="Freight for ${CARDS.find(card=>card.id===q.cardId)?.name||'project'} to ${to.label}">${icon('outrigger')}<span>${q.materialFromPort||1}</span></button>`;
    }).join('')}
    ${s.nodes.map(z=>{
      const projects=projectsAtZone(z.id), construction=constructionAtZone(z.id), risk=risks.has(z.id), buildTarget=placementTargets.has(z.id);
      const cache=Number(state?.logistics?.caches?.[z.id]||0), relocated=Number(state?.relocation?.sites?.[z.id]||0), pressure=Number(state?.zoneStress?.[z.id]||0);
      return `<button class="world-node ${zoneStateClass(z)} ${risk?'at-risk':''} ${projects.length?'developed':''} ${construction.length?'constructing':''} ${cache?'cached':''} ${buildTarget?'build-target':''}" style="--x:${z.x}%;--y:${z.y}%;" data-world-zone="${z.id}" aria-label="${z.label}. ${risk?'Forecast risk. ':''}${construction.length?'Freight underway. ':''}${cache?'Local materials '+cache+'. ':''}${buildTarget?'Valid project location. ':''}${projects.length?projects.length+' project present. ':''}">
        <span class="node-pin">${icon(worldNodeIcon(z.kind))}</span>
        <span class="node-label">${z.short}</span>
        ${projects.length?`<span class="node-project-count">+${projects.length}</span>`:''}
        ${construction.length?`<span class="node-construction">${icon('builder')}<b>${construction.length}</b></span>`:''}
        ${cache?`<span class="node-cache">${icon('materials')}<b>${cache}</b></span>`:''}
        ${relocated?`<span class="node-relocated">${icon('community')}<b>${relocated}</b></span>`:''}
        ${pressure?`<span class="node-pressure pressure-${pressure}">${icon('warning')}<b>${pressure}</b></span>`:''}
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
  const construction=constructionAtZone(z.id),cache=Number(state?.logistics?.caches?.[z.id]||0),stress=Number(state?.zoneStress?.[z.id]||0),networkRule=typeof NETWORK_RULES!=='undefined'?NETWORK_RULES[z.id]:null;
  const special=worldScenario().special, relocation=typeof relocationReadiness==='function'?relocationReadiness(z.id):null, sourceRelocation=special?.kind==='relocation'&&special.sourceZone===z.id;
  const relevant=CARDS.filter(c=>projectTargetsFor(c.id).includes(z.id)).slice(0,4);
  return `<section class="world-sheet zone-sheet" aria-label="${z.label}">
    <header><div><span class="eyebrow">${z.kind==='outer'?'Outer-island community':'Island place'}</span><strong>${z.label}</strong></div><button data-world-action="close" aria-label="Close place">×</button></header>
    <div class="zone-state-row"><span class="zone-big-icon">${icon(worldNodeIcon(z.kind))}</span><div><b class="zone-condition ${zoneStateClass(z)}">${value<=1?'Critical':value<=2?'Under pressure':value>=5?'Strong':'Holding'}</b><p>${z.note}</p></div></div>
    <div class="zone-logistics"><div><span>Local pressure</span><b>${stress?stress+' / 3':'None'}</b></div><div><span>Stored materials</span><b>${cache}</b></div><div><span>Freight / works</span><b>${construction.length}</b></div></div>${sourceRelocation?`<div class="relocation-source"><span>${icon('community')}</span><div><small>Home community</small><b>${state.relocation?.moved||0} / ${state.relocation?.households||special.households} planned transitions prepared</b><em>${state.relocation?.unplannedEvents||0} unplanned displacement event${(state.relocation?.unplannedEvents||0)===1?'':'s'} so far</em></div></div>`:''}${relocation?`<div class="relocation-readiness"><div><span>Receiving-site readiness</span><b>${relocation.ready?'Ready':relocation.have.length+' / 3'}</b></div><div class="readiness-pips">${['water','shelter','access'].map(k=>`<span class="${relocation.have.includes(k)?'ready':''}">${k}</span>`).join('')}</div><small>${relocation.ready?'Water, shelter and access are in place. A planned household transition costs 1 fund and one action.':'Still needed: '+relocation.missing.join(', ')}</small>${relocation.ready&&state.relocation?.moved<state.relocation?.households?`<button data-relocate-zone="${z.id}" ${state.relocation?.usedThisSeason||state.played.length>=2||state.stats.budget<1?'disabled':''}>${icon('community')}<span><b>Support one household transition</b><small>1 fund · 1 action · one per season</small></span></button>`:''}</div>`:''}${networkRule?`<div class="zone-system-rule ${stress>=3?'critical':stress>=2?'warning':''}"><b>${networkRule.label}</b><small>${stress>=3?networkRule.detail:'If pressure reaches 3: '+networkRule.detail}</small></div>`:''}${stress>0?`<button class="zone-recover" data-recover-zone="${z.id}" ${state.recoveryUsed||state.played.length>=2?'disabled':''}>${icon('effort')}<span><b>Community recovery</b><small>Use one action to reduce local pressure by 1</small></span></button>`:''}
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
  if(goal.kind==='relocation_planned'){const value=Number(state.relocation?.moved||0);return {done:value>=goal.target,value};}
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
function worldSystemsSheet(){
  if(worldDrawer!=='systems'||typeof networkStrains!=='function') return '';
  const items=networkStrains();
  return `<section class="world-sheet systems-sheet" aria-label="Island systems">
    <header><div><span class="eyebrow">Connected systems</span><strong>${items.length?items.length+' system'+(items.length===1?'':'s')+' under strain':'Systems holding'}</strong></div><button data-world-action="close" aria-label="Close systems">×</button></header>
    <p class="systems-intro">Local pressure becomes a network problem at 3. Repair the place or use community recovery before the next season compounds it.</p>
    <div class="systems-list">${items.length?items.map(x=>`<button data-world-zone="${x.zoneId}" class="${x.stress>=3?'critical':'warning'}"><span>${icon(worldNodeIcon(worldNode(x.zoneId)?.kind))}</span><span><b>${worldNode(x.zoneId)?.label||x.zoneId}</b><small>${x.stress}/3 pressure · ${x.stress>=3?x.rule.detail:'one step from a system penalty'}</small></span></button>`).join(''):'<p>Nothing is at pressure 2 or 3.</p>'}</div>
  </section>`;
}
function workshopDebriefPrompt(){
  const e=state?.lastEvent&&HAZARDS.find(h=>h.id===state.lastEvent.id),local=state?.lastEvent?.local||[];
  const exposed=local.filter(x=>!x.protectedBy?.length).length,protectedCount=local.length-exposed;
  if(state?.logistics?.lastSeason?.some(x=>x.type==='delay')) return 'What did the freight delay change? Which investments would have reduced dependence on just-in-time delivery?';
  if(exposed>protectedCount) return 'Where did pressure accumulate, and was that a planning gap, a logistics constraint or a deliberate trade-off?';
  if(protectedCount) return 'Which earlier investment changed this outcome, and would you make the same choice with a different forecast?';
  return e?`What did ${e.name} reveal about how the island systems are connected?`:'What trade-off is the council making this season?';
}
function worldWorkshopSheet(){
  if(worldDrawer!=='workshop'||!state?.workshopMode) return '';
  const s=worldScenario(),role=currentRole(),watches=state.forecast.map(id=>HAZARDS.find(h=>h.id===id)?.watch).filter(Boolean);
  const chosen=state.played.map(id=>id==='effort'?'Community effort':CARDS.find(c=>c.id===id)?.name).filter(Boolean);
  return `<section class="world-sheet workshop-sheet" aria-label="Workshop discussion">
    <header><div><span class="eyebrow">Workshop pause · season ${state.round}</span><strong>Talk before the season turns</strong></div><button data-world-action="close" aria-label="Close workshop prompt">×</button></header>
    <div class="workshop-brief"><span>${roleIconMarkup(role)}</span><div><small>Player ${(state.round-1)%state.players+1} leads</small><b>${role.name}</b></div></div>
    <div class="workshop-context"><div><small>Scenario</small><b>${s.name}</b></div><div><small>Forecast</small><b>${watches.join(' · ')}</b></div><div><small>Chosen this season</small><b>${chosen.length?chosen.join(' · '):'No project yet'}</b></div></div>
    <div class="workshop-questions"><p><b>1.</b> What are you trying to protect this season?</p><p><b>2.</b> Who benefits from the projects you chose, and who is still exposed?</p><p><b>3.</b> ${s.special?.kind==='relocation'?'Who should decide when a receiving site is truly ready, and what important social or cultural factors are outside this game model?':'What are you giving up by spending those funds and materials now?'}</p></div>
    <button class="primary workshop-continue" data-workshop-continue>Continue · face the season</button>
  </section>`;
}
function worldSeasonFeed(){
  const notes=(state?.logistics?.lastSeason||[]).filter(x=>['arrival','complete','delay','network'].includes(x.type)).slice(-2);
  if(!notes.length) return '';
  return `<div class="world-season-feed" aria-live="polite"><small>Since last season</small>${notes.map(n=>`<div class="${n.type}">${icon(n.type==='delay'?'shipping':n.type==='network'?'warning':'builder')}<span>${n.text}</span></div>`).join('')}</div>`;
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
  return `<div class="frame world-game scenario-${worldScenario().id}">${compactHeader()}<main class="world-stage">
    ${worldMapMarkup()}
    ${worldResourceStrip()}
    ${(()=>{const g=scenarioGoalResults(),done=g.filter(x=>x.done).length;return `<button class="world-mission" data-world-action="mission"><small>Mission</small><b>${done}/${g.length}</b></button>`})()}
    ${typeof networkStrains==='function'&&networkStrains().length?`<button class="world-systems ${networkStrains().some(x=>x.stress>=3)?'critical':''}" data-world-action="systems"><small>Systems</small><b>${networkStrains().length}</b></button>`:''}
    ${worldSeasonFeed()}
    <button class="world-forecast" data-panel="forecast">${icon('forecast')}<span><small>Forecast · one arrives</small><b>${watches.join(' · ')}</b></span></button>
    <button class="world-service" data-panel="active"><small>In service</small><b>${state.active.length}/${ACTIVE_LIMIT}</b></button>
  </main>${worldBottomBar()}${worldProjectSheet()}${worldZoneSheet()}${worldPlacementSheet()}${worldMissionSheet()}${worldSystemsSheet()}${worldWorkshopSheet()}</div>`;
};

const legacySetupHtmlWorld=setupHtml;
setupHtml=function(){
  const scenarios=Object.values(ISLAND_SCENARIOS);
  return `<div class="frame scenario-setup-screen"><header class="game-top"><a class="game-brand" href="/"><span class="brand-wave">${icon('outrigger')}</span><span>Island Together</span></a><span class="setup-label">Pacific climate game</span></header>
    <main class="scenario-setup-main"><section class="scenario-intro"><div class="eyebrow">Choose a fictional Pacific scenario</div><h1>Build together before the season turns.</h1><p>Each map changes what matters: distance, freshwater, freight and exposure shape the projects your council needs.</p></section>
    <section class="scenario-picker">${scenarios.map(s=>`<button data-scenario="${s.id}" aria-pressed="${selectedScenarioId===s.id}"><span class="scenario-preview">${scenarioMiniMap(s)}</span><span class="scenario-copy"><small>${s.topology.replaceAll('-',' ')}</small><b>${s.name}</b><em>${s.summary}</em></span></button>`).join('')}</section>
    <section class="setup-controls scenario-controls" aria-label="New game"><div class="mode-choice" role="group" aria-label="Play style"><button data-play-mode="quick" aria-pressed="${selectedPlayMode==='quick'}"><b>Quick game</b><small>Play straight through</small></button><button data-play-mode="workshop" aria-pressed="${selectedPlayMode==='workshop'}"><b>Workshop</b><small>Built-in discussion pauses</small></button></div><span>How many players?</span><div class="player-choice" role="group" aria-label="Players">${[2,3,4].map(n=>`<button data-players="${n}" aria-pressed="${selectedPlayers===n}">${n}</button>`).join('')}</div><button class="primary" data-action="start">Start ${ISLAND_SCENARIOS[selectedScenarioId]?.shortName||'scenario'}</button><small>About 15–25 minutes · pass one device or project it for a group</small></section></main></div>`;
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
    ${s.special?.kind==='relocation'?`<section class="relocation-result"><div><span>Planned transitions</span><b>${state.relocation?.moved||0} / ${state.relocation?.households||s.special.households}</b></div><div><span>Unplanned displacement events</span><b>${state.relocation?.unplannedEvents||0}</b></div><p>This simplified scenario treats water, shelter and access as enabling conditions only. Real relocation also involves land rights, consent, culture, livelihoods, governance and long-term relationships that cannot be reduced to a game score.</p></section>`:''}
    <div class="result-foot"><p>${state.placements?.length||0} projects operating · ${state.construction?.length||0} still in freight or construction</p><p>The score is a game summary, not a real-world resilience assessment. Compare the choices your group made and what the map exposed.</p></div>
    <button class="primary" data-action="restart">Choose another scenario</button></main></div>`;
};
eventHtml = function(){
  const e=HAZARDS.find(x=>x.id===state.lastEvent.id),r=state.lastEvent;
  const avoidedGlobal=Object.entries(e.base).reduce((sum,[k,v])=>sum+Math.max(0,Math.abs(v)-Math.abs(r.actual?.[k]??v)),0);
  const protectedLocal=(r.local||[]).filter(x=>x.protectedBy?.length).length;
  if(state.eventStage==='reveal'){
    return `<div class="frame world-game world-event scenario-${worldScenario().id}">${compactHeader()}<main class="world-stage">${worldMapMarkup({hazardId:e.id,resolving:true})}
      <section class="world-hazard-card"><span class="hazard-glyph">${icon('warning')}</span><div><span class="eyebrow">The season turns</span><h1>${e.name}</h1><p>${e.story}</p></div><button class="primary" data-action="impact">See the impact</button></section>
    </main></div>`;
  }
  return `<div class="frame world-game world-event world-impact scenario-${worldScenario().id}">${compactHeader()}<main class="world-stage">${worldMapMarkup({hazardId:e.id,resolving:true})}
    <section class="world-impact-sheet"><header><div><span class="eyebrow">Season ${state.round} impact</span><h1>${e.name}</h1></div></header>
      <div class="impact-mini-grid">${Object.entries(e.base).map(([k])=>`<div>${icon(STAT_ICONS[k])}<span>${LABELS[k]}</span><strong>${r.actual[k]===0?'Held':r.actual[k]}</strong></div>`).join('')}</div>
      <p class="impact-protection">${r.mitigated.length?`Protected by ${r.mitigated.join(', ')}.`:'No active project blocked this hazard.'}</p>
      <div class="counterfactual-box ${avoidedGlobal||protectedLocal?'helped':'exposed'}"><span>${avoidedGlobal||protectedLocal?'Preparation changed the outcome':'This season exposed a gap'}</span><div><b>${avoidedGlobal}</b><small>condition loss${avoidedGlobal===1?'':'es'} avoided</small></div><div><b>${protectedLocal}</b><small>place${protectedLocal===1?'':'s'} protected locally</small></div></div>
      ${r.local?.length?`<div class="local-impact-summary"><b>${r.local.filter(x=>!x.protectedBy.length).length}</b> places took local pressure · <b>${r.local.filter(x=>x.protectedBy.length).length}</b> protected locally</div>`:''}
      ${r.displacement?`<div class="displacement-impact">${icon('community')}<span><b>Unplanned displacement</b><small>Severe pressure at the home community forced a temporary unplanned move and reduced community capacity.</small></span></div>`:''}
      ${state.workshopMode?`<div class="workshop-impact-question"><span>Discuss</span><b>${workshopDebriefPrompt()}</b></div>`:''}
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
  const mode=e.target.closest('[data-play-mode]');
  if(mode&&!state){selectedPlayMode=mode.dataset.playMode;render();return;}
  const workshopContinue=e.target.closest('[data-workshop-continue]');
  if(workshopContinue&&state?.workshopMode){e.preventDefault();e.stopImmediatePropagation();state.workshopReadyRound=state.round;worldDrawer=null;save();resolveRound();return;}
  const resolve=e.target.closest('[data-action="resolve"]');
  if(resolve&&state?.phase==='play'&&state.workshopMode&&state.workshopReadyRound!==state.round){e.preventDefault();e.stopImmediatePropagation();worldDrawer='workshop';render();return;}
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
  const relocate=e.target.closest('[data-relocate-zone]');
  if(relocate){e.preventDefault();e.stopImmediatePropagation();worldDrawer=null;worldZoneId=null;moveRelocationHousehold(relocate.dataset.relocateZone);return;}
  const recover=e.target.closest('[data-recover-zone]');
  if(recover){e.preventDefault();e.stopImmediatePropagation();worldDrawer=null;worldZoneId=null;recoverSpatialZone(recover.dataset.recoverZone);return;}
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
    if(action.dataset.worldAction==='systems'){worldDrawer='systems';worldZoneId=null;render();return}
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
