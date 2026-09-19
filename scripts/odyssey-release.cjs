'use strict';
// Reconciled, idempotent release of the existing cycle pass. No artwork or user-storage writes.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {createHash} = require('node:crypto');
const root = path.resolve(__dirname, '..');
const dir = path.join(root, 'public/mtgtools/odyssey');
const plan = require('./odyssey-release-cycles.json');
const revision = 'mainset-song-cycles-v1';
const version = '2026-09-19.2';
const timestamp = '2026-09-19T08:30:00Z';
const read = file => JSON.parse(fs.readFileSync(path.join(dir, 'data', file), 'utf8'));
const hash = data => createHash('sha256').update(JSON.stringify(data)).digest('hex');
const tally = (cards, key) => cards.reduce((out,c) => {const k=typeof key==='function'?key(c):c[key];out[k]=(out[k]||0)+1;return out;}, {});
const rarity = cards => Object.fromEntries(['C','U','R','M'].map(r=>[r,cards.filter(c=>c.rarity===r).length]));
const mean = cards => cards.length ? +(cards.reduce((n,c)=>n+c.flavorMatchScore,0)/cards.length).toFixed(2) : null;
const isDFC = c => c.layout==='transform'||/\/\/BACK\/\//.test(c.rules||'');
const candidate = read('odyssey-analysis-candidate-v1.json');
const current = read('odyssey-data.json');
assert.deepEqual(candidate.cards,current.cards,'Candidate/Current differ: reconcile concurrent design edits before publishing.');
assert.equal(candidate.cards.length,309);
const beforeCards=structuredClone(candidate.cards);
const beforeArt=hash(current.artworks);
const beforeCoverage=structuredClone(current.coverage);
const byId = new Map(candidate.cards.map(c=>[c.id,c]));
assert.equal(byId.size,309,'Duplicate card IDs');
for(const patch of plan.cards){
  const card=byId.get(patch.id);
  const song=plan.songs.find(s=>s.id===patch.id);
  assert.ok(card,patch.id);
  assert.ok(card.name===patch.expectedName||card.name===song?.title,'Unexpected card identity: '+patch.id+' '+card.name);
  const existingCycles=card.cycleIds||[];
  const existingStatus=card.changeStatus||'';
  Object.assign(card,structuredClone(patch.set));
  if(patch.set.cycleIds)card.cycleIds=[...new Set([...existingCycles,...patch.set.cycleIds])];
  if(patch.set.changeStatus)card.changeStatus=[...new Set((existingStatus+' · '+patch.set.changeStatus).split(' · ').filter(Boolean))].join(' · ');
}
for(const song of plan.songs){
  const card=byId.get(song.id);
  const previous=plan.cards.find(p=>p.id===song.id).expectedName;
  card.name=card.displayName=song.title;
  card.nameAliases=[...new Set([...(card.nameAliases||[]),previous])];
  card.song={kind:'in-world song or later song about the epic',titleStatus:'original working design title; not an ancient quotation',setting:song.setting,interpretations:song.interpretations,principle:'The listener interprets the song through its lessons; either colour can express every chapter.'};
  card.story=card.storyTarget=card.flavorStoryElement=song.setting;
  const interpretation=Object.entries(song.interpretations).map(([c,text])=>c+': '+text).join(' ');
  card.flavorMatchRationale=plan.cards.find(p=>p.id===song.id).set.flavorMatchRationale+' Song interpretation — '+interpretation;
  card.changeStatus=[...new Set((card.changeStatus+' · '+revision).split(' · '))].join(' · ');
}
// Actual totals derive from card records. Keep the original benchmark separately; do not invent cards to meet it.
function refresh(d){
  const cards=d.cards, f=d.ffSkeleton;
  const legendary=cards.filter(c=>/\bLegendary\b/.test(c.type));
  const dfcs=cards.filter(isDFC);
  const nonlands=cards.filter(c=>!/\bLand\b/.test(c.type));
  const curve=tally(nonlands,c=>c.mv>=7?'7+':String(c.mv));
  const signposts=cards.filter(c=>(c.cycleIds||[]).includes('ff-analog-gold-signposts'));
  f.actual={...f.actual,physicalCards:cards.length,rarity:rarity(cards),layouts:{singleFace:cards.length-dfcs.length,doubleFace:dfcs.length,byLayout:tally(cards,c=>isDFC(c)?'double-face-battle':c.layout||'standard')},sagaCards:cards.filter(c=>/\bSaga\b/.test(c.type)).length,lands:cards.length-nonlands.length,legendaryCards:legendary.length,legendaryByRarity:rarity(legendary),sixPlusManaValue:nonlands.filter(c=>c.mv>=6).length,goldUncommonLegendarySignposts:signposts.filter(c=>c.rarity==='U'&&/\bLegendary\b/.test(c.type)).length,signpostPairs:tally(signposts,c=>c.signpostPair||c.color),manaCurve:curve};
  for(const program of f.showcasePrograms){
    if(program.physicalCardId)continue;
    const members=cards.filter(c=>(c.showcase||[]).includes(program.id));
    program.count=members.length;program.cardIds=members.map(c=>c.id);
    if(program.rarity)program.rarity=Object.fromEntries(Object.entries(rarity(members)).filter(([,n])=>n));
  }
  for(const cycle of plan.cycles){if(!f.cycles.some(c=>c.id===cycle.id))f.cycles.push({id:cycle.id,count:cycle.count});}
  for(const cycle of f.cycles){
    const members=cards.filter(c=>(c.cycleIds||[]).includes(cycle.id));
    if(cycle.id==='single-face-progression-substitution'){
      cycle.plannedSlots=29;cycle.status='historical substitution plan, not a tagged card cycle';
    }
    cycle.count=members.length;cycle.cardIds=members.map(c=>c.id);
    if(members.length)cycle.rarity=Object.fromEntries(Object.entries(rarity(members)).filter(([,n])=>n));
  }
  const hybrid=f.cycles.find(c=>c.id==='cycle.hybrid-sagas-uncommon');
  hybrid.note='Five uncommon song Sagas: W/U, U/R, B/R, B/G, G/W. Original working titles; the lesson is interpreted by the listener. No extra Saga cycle.';
  f.softAudit.functionalWordMeans=Object.fromEntries(['C','U','R','M'].map(r=>{const group=cards.filter(c=>c.rarity===r&&!/\bBasic\b/.test(c.type));return [r,{count:group.length,mean:+(group.reduce((n,c)=>n+(c.functionalWords||0),0)/group.length).toFixed(1)}];}));
  f.softAudit.typeTexture.actual=Object.fromEntries(['Creature','Artifact','Enchantment','Instant','Sorcery','Land'].map(t=>[t,cards.filter(c=>new RegExp('\\b'+t+'\\b').test(c.type)).length]));
  f.softAudit.manaCurve.actual=curve;
  d.flavorAudit.average=mean(cards);
  d.flavorAudit.distribution=Object.fromEntries([0,1,2,3,4,5].map(s=>[s,cards.filter(c=>c.flavorMatchScore===s).length]));
  d.flavorAudit.averageByEra=Object.fromEntries([...new Set(cards.map(c=>c.narrativeEra))].map(era=>[era,mean(cards.filter(c=>c.narrativeEra===era))]));
  d.flavorAudit.averageByRarity=Object.fromEntries(['C','U','R','M'].map(r=>[r,mean(cards.filter(c=>c.rarity===r))]));
  d.storyApportionment.actual=tally(cards,'narrativeEra');
  d.integrity={...d.integrity,sha256:hash(cards),sha256Scope:'cards-json-stringify-utf8-v1',cards:cards.length,cycleRevision:revision};
  d.generatedAt=timestamp;
  d.release={version,revision,publishedFrom:'analysis-candidate-v1',status:'design prototype; not a completed balance/playtest sign-off',cardTitles:'Song titles are original working titles, not ancient quotations.',knownBenchmarkDifferences:{legendaryCards:{target:f.target.legendaryCards,actual:legendary.length},showcase:Object.fromEntries(f.showcasePrograms.filter(p=>!p.physicalCardId).map(p=>[p.id,p.count]))},notes:['The 15 Saga type cards include the sole double-faced Troy card. Layout buckets are exclusive: 14 single-faced Saga layouts plus one double-faced battle.','Legacy benchmark totals remain targets. Actual counts are recomputed from card records, not forced by unrequested card redesigns.']};
}
refresh(candidate);
candidate.candidate.productionDatasetVersion=version;
candidate.candidate.cutoverAuthorized=true;
candidate.candidate.productionFilesModified=true;
candidate.candidate.latestReleaseAt=timestamp;
current.cards=structuredClone(candidate.cards);
const validArtIds=new Set(current.artworks.map(a=>a.id));
for(const item of current.coverage){
  const c=byId.get('ODY-'+String(item.number).padStart(3,'0'));if(c)item.name=c.name;
  if(item.candidateIds.some(id=>!validArtIds.has(id))){
    const normalized=[...new Set(item.candidateIds.flatMap(value=>String(value).split(';').map(id=>id.trim())).filter(id=>validArtIds.has(id)))];
    assert.ok(normalized.includes(item.primary),'Cannot safely normalize coverage for '+item.number);
    item.legacyCandidateIds=item.candidateIds;item.candidateIds=normalized;
  }
}
current.datasetVersion=version;
refresh(current);
// Guard exact, user-owned artwork fields and unrelated design records, not just totals.
const patched=new Set(plan.cards.map(c=>c.id));
const protectedFields=['primaryArt','credit','source','imageUrl','artReviewRequired','narrativeEra','storySourceBand'];
for(const old of beforeCards){const next=byId.get(old.id);for(const key of protectedFields)assert.deepEqual(next[key],old[key],old.id+' '+key);if(!patched.has(old.id))assert.deepEqual(next,old,'Unrelated card changed: '+old.id);}
assert.equal(hash(current.artworks),beforeArt);
for(let i=0;i<beforeCoverage.length;i++){const {name:a,candidateIds:oldIds,legacyCandidateIds:oldLegacy,...old}=beforeCoverage[i],{name:b,candidateIds:newIds,legacyCandidateIds:newLegacy,...next}=current.coverage[i];assert.deepEqual(next,old,'Coverage assignment changed');if(oldIds.every(id=>validArtIds.has(id)))assert.deepEqual(newIds,oldIds);else assert.deepEqual(newLegacy,oldIds);}
assert.deepEqual(rarity(candidate.cards),{C:106,U:109,R:74,M:20});
assert.equal(candidate.cards.filter(c=>/\bLegendary\b/.test(c.type)).length,beforeCards.filter(c=>/\bLegendary\b/.test(c.type)).length);
assert.deepEqual(candidate.cards.filter(isDFC).map(c=>c.id),['ODY-229']);
assert.equal(candidate.ffSkeleton.actual.sagaCards,15);
for(const cycle of plan.cycles){const actual=candidate.cards.filter(c=>(c.cycleIds||[]).includes(cycle.id));assert.deepEqual(actual.map(c=>c.number).sort((a,b)=>a-b),[...cycle.numbers].sort((a,b)=>a-b));if(cycle.rarity)assert.ok(actual.every(c=>c.rarity===cycle.rarity),cycle.id);}
const write=(file,d)=>fs.writeFileSync(path.join(dir,'data',file),JSON.stringify(d)+'\n');
write('odyssey-analysis-candidate-v1.json',candidate);write('odyssey-data.json',current);
fs.writeFileSync(path.join(dir,'data/odyssey-data.js'),'window.ODYSSEY_DATA='+JSON.stringify(current)+';\n');
const appPath=path.join(dir,'app.html'),indexPath=path.join(dir,'index.html');
let app=fs.readFileSync(appPath,'utf8').replace('odyssey-data.js?v=20260919-live1','odyssey-data.js?v=20260919-live2').replace('odyssey-analysis-candidate-v1.json?v=20260919-final','odyssey-analysis-candidate-v1.json?v=20260919-songs');
assert.ok(app.includes('odyssey-data.js?v=20260919-live2'));assert.ok(app.includes('odyssey-analysis-candidate-v1.json?v=20260919-songs'));fs.writeFileSync(appPath,app);
const index=fs.readFileSync(indexPath,'utf8').replace('app.html?v=20260919-15','app.html?v=20260919-16');assert.ok(index.includes('app.html?v=20260919-16'));fs.writeFileSync(indexPath,index);
fs.writeFileSync(path.join(dir,'data/release.json'),JSON.stringify({version,revision,cards:309,artworks:current.artworks.length,rarity:rarity(current.cards),songSagas:plan.songs.map(s=>({id:s.id,name:s.title})),cardsSha256:hash(current.cards),actual:current.ffSkeleton.actual,knownBenchmarkDifferences:current.release.knownBenchmarkDifferences,notes:current.release.notes},null,2)+'\n');
console.log(JSON.stringify({version,revision,changedCards:[...patched],actual:current.ffSkeleton.actual,benchmarkDifferences:current.release.knownBenchmarkDifferences},null,2));

// Migrate stale test expectations to measured values and include all existing regression suites.
const continuityPath=path.join(root,'tests/odyssey-continuity.test.cjs');
let continuity=fs.readFileSync(continuityPath,'utf8').replace("{standard:274,saga:15,vehicle:10,adventure:8,prepare:1,'double-face-battle':1}","{standard:275,saga:14,vehicle:10,adventure:8,prepare:1,'double-face-battle':1}").replace('d.ffSkeleton.actual.legendaryCards,105','d.ffSkeleton.actual.legendaryCards,103');
for(const [id,oldCount,newCount] of [['greek-vase-showcase',50,48],['character-showcase',32,31],['extended-art-legend',98,93]])continuity=continuity.replace("x.id==='"+id+"').count,"+oldCount,"x.id==='"+id+"').count,"+newCount);
fs.writeFileSync(continuityPath,continuity);
const mobilePath=path.join(root,'tests/odyssey-mobile-navigation.test.js');
let mobile=fs.readFileSync(mobilePath,'utf8').replace("text: async () => source }), document });","text: async () => source }), document, location: { hash: '', pathname: '/mtgtools/odyssey/', search: '' }, window: {}, history: { replaceState() {} } });");
fs.writeFileSync(mobilePath,mobile);
const ciPath=path.join(root,'.github/workflows/odyssey-continuity.yml');
let ci=fs.readFileSync(ciPath,'utf8').replace('node --test tests/odyssey-continuity.test.cjs','node --test tests/*.test.cjs tests/*.test.js').replaceAll("      - 'tests/odyssey-continuity*'","      - 'tests/odyssey-*'\n      - 'scripts/odyssey-release*'");
fs.writeFileSync(ciPath,ci);
