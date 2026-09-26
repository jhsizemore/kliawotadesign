'use strict';
// Refresh derived release metadata from the published card records. Never edits cards or art.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const dir=path.resolve(__dirname,'../public/mtgtools/odyssey/data');
const file=name=>path.join(dir,name),read=name=>JSON.parse(fs.readFileSync(file(name),'utf8'));
const tally=(cards,key)=>cards.reduce((out,c)=>{const k=typeof key==='function'?key(c):c[key];out[k]=(out[k]||0)+1;return out;},{});
const rarity=cards=>Object.fromEntries(['C','U','R','M'].map(r=>[r,cards.filter(c=>c.rarity===r).length]));
const mean=cards=>cards.length?+(cards.reduce((n,c)=>n+(+c.flavorMatchScore||0),0)/cards.length).toFixed(2):null;
const d=read('odyssey-data.json'),release=read('release.json'),cards=d.cards,f=d.ffSkeleton;
assert.equal(cards.length,309,'Unexpected card count; inspect the new source before refreshing');
assert.equal(d.datasetVersion,release.version,'Release identity mismatch');
const before=JSON.stringify({cards:d.cards,artworks:d.artworks,coverage:d.coverage});
const legends=cards.filter(c=>/\bLegendary\b/.test(c.type)),dfcs=cards.filter(c=>c.layout==='transform'||/\/\/BACK\/\//.test(c.rules||''));
const nonlands=cards.filter(c=>!/\bLand\b/.test(c.type)),signposts=cards.filter(c=>c.cycleIds?.includes('ff-analog-gold-signposts'));
const curve=tally(nonlands,c=>c.mv>=7?'7+':String(c.mv));
f.actual={...f.actual,physicalCards:cards.length,rarity:rarity(cards),layouts:{singleFace:cards.length-dfcs.length,doubleFace:dfcs.length,byLayout:tally(cards,c=>dfcs.includes(c)?'double-face-battle':c.layout||'standard')},sagaCards:cards.filter(c=>/\bSaga\b/.test(c.type)).length,lands:cards.length-nonlands.length,legendaryCards:legends.length,legendaryByRarity:rarity(legends),sixPlusManaValue:nonlands.filter(c=>c.mv>=6).length,goldUncommonLegendarySignposts:signposts.filter(c=>c.rarity==='U'&&/\bLegendary\b/.test(c.type)).length,signpostPairs:tally(signposts,c=>c.signpostPair||c.color),manaCurve:curve};
for(const p of f.showcasePrograms.filter(p=>!p.physicalCardId)){
  const members=cards.filter(c=>c.showcase?.includes(p.id));
  p.count=members.length;p.cardIds=members.map(c=>c.id);
  if(p.rarity)p.rarity=Object.fromEntries(Object.entries(rarity(members)).filter(([,n])=>n));
}
for(const cycle of f.cycles){
  const members=cards.filter(c=>c.cycleIds?.includes(cycle.id));
  cycle.count=members.length;cycle.cardIds=members.map(c=>c.id);
  if(members.length)cycle.rarity=Object.fromEntries(Object.entries(rarity(members)).filter(([,n])=>n));
}
const hybrids=cards.filter(c=>c.cycleIds?.includes('cycle.hybrid-sagas-uncommon'));
const hybrid=f.cycles.find(c=>c.id==='cycle.hybrid-sagas-uncommon');
if(hybrid)hybrid.note=`Five uncommon hybrid Sagas: ${hybrids.map(c=>c.mana.match(/\{([WUBRG]\/[WUBRG])\}/)?.[1]||'?').join(', ')}. Verify each card's printed chapter text independently.`;
f.softAudit.functionalWordMeans=Object.fromEntries(['C','U','R','M'].map(r=>{const group=cards.filter(c=>c.rarity===r&&!/\bBasic\b/.test(c.type));return[r,{count:group.length,mean:+(group.reduce((n,c)=>n+(c.functionalWords||0),0)/group.length).toFixed(1)}];}));
f.softAudit.typeTexture.actual=Object.fromEntries(['Creature','Artifact','Enchantment','Instant','Sorcery','Land'].map(t=>[t,cards.filter(c=>new RegExp('\\b'+t+'\\b').test(c.type)).length]));
f.softAudit.manaCurve.actual=curve;
d.flavorAudit.average=mean(cards);
d.flavorAudit.distribution=Object.fromEntries([0,1,2,3,4,5].map(s=>[s,cards.filter(c=>c.flavorMatchScore===s).length]));
d.flavorAudit.averageByEra=Object.fromEntries([...new Set(cards.map(c=>c.narrativeEra))].map(era=>[era,mean(cards.filter(c=>c.narrativeEra===era))]));
d.flavorAudit.averageByRarity=Object.fromEntries(['C','U','R','M'].map(r=>[r,mean(cards.filter(c=>c.rarity===r))]));
d.storyApportionment.actual=tally(cards,'narrativeEra');
d.release.knownBenchmarkDifferences.legendaryCards.actual=legends.length;
d.release.knownBenchmarkDifferences.showcase=Object.fromEntries(f.showcasePrograms.filter(p=>!p.physicalCardId).map(p=>[p.id,p.count]));
assert.equal(JSON.stringify({cards:d.cards,artworks:d.artworks,coverage:d.coverage}),before,'Card or artwork data changed');
release.actual=f.actual;release.knownBenchmarkDifferences=d.release.knownBenchmarkDifferences;
release.songSagas=hybrids.map(c=>({id:c.id,name:c.name}));
const cardsHash=createHash('sha256').update(JSON.stringify(cards)).digest('hex');
assert.equal(d.integrity.sha256Scope,'cards-json-stringify-utf8-v1');
d.integrity.sha256=cardsHash;
release.cardsSha256=cardsHash;
fs.writeFileSync(file('odyssey-data.json'),JSON.stringify(d));
fs.writeFileSync(file('odyssey-data.js'),'window.ODYSSEY_DATA='+JSON.stringify(d)+';\n');
fs.writeFileSync(file('release.json'),JSON.stringify(release,null,2)+'\n');
console.log(`Refreshed audit for ${cards.length} cards: ${legends.length} legendary, ${hybrids.length} hybrid Sagas.`);
