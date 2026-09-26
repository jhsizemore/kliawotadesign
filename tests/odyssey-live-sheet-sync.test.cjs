'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const sync=require('../public/mtgtools/odyssey/live-sheet-sync.js');
const root=path.resolve(__dirname,'..');
function baseline(){
 const cards=Array.from({length:309},(_,i)=>({id:'ODY-'+String(i+1).padStart(3,'0'),number:i+1,backFace:i===228?{imageUrl:'wooden-horse.jpg'}:undefined}));
 return {schema:'odyssey-studio-data/v1',datasetVersion:'old',cards,artworks:[],coverage:[],integrity:{},candidate:{}};
}
test('live sheet sync promotes the full current 309 and 589-art library',()=>{
 const d=sync.apply(baseline());
 assert.equal(d.datasetVersion,'2026-09-26.9');
 assert.equal(d.cards.length,309);assert.equal(d.artworks.length,589);assert.equal(d.coverage.length,309);
 assert.equal(new Set(d.cards.map(c=>c.number)).size,309);assert.equal(new Set(d.artworks.map(a=>a.id)).size,589);
 assert.equal(d.sheetSync.cardSheet.revision,'250');assert.equal(d.sheetSync.artSheet.revision,'91');
 const art=new Set(d.artworks.map(a=>a.id));const assigned=d.cards.filter(c=>c.primaryArt);
 assert.equal(assigned.length,309);for(const c of assigned)assert.ok(art.has(c.primaryArt),c.id+' has current art');
 assert.deepEqual(d.cards.filter(c=>!c.primaryArt).map(c=>c.number),[]);
});
test('current special layouts survive the sheet cutover',()=>{
 const d=sync.apply(baseline()),count=k=>d.cards.filter(c=>c.layout===k).length;
 assert.deepEqual({standard:count('standard'),saga:count('saga'),adventure:count('adventure'),prepare:count('prepare'),battle:count('battle'),vehicle:count('vehicle'),transform:count('transform')},{standard:275,saga:16,adventure:7,prepare:1,battle:0,vehicle:9,transform:1});
 for(const n of [208,209,222]){const c=d.cards.find(x=>x.number===n);assert.match(c.type,/Enchantment Creature.*Saga/i);assert.equal(c.layout,'saga');}
 const t=d.cards.find(c=>c.number===229);assert.equal(t.layout,'transform');assert.equal(t.backFace.imageUrl,'wooden-horse.jpg');
});
test('the newest artwork wave is directly renderable and assigned',()=>{
 const d=sync.apply(baseline()),fresh=d.artworks.filter(a=>+a.id.slice(4)>553);
 assert.equal(fresh.length,36);assert.ok(fresh.every(a=>/^https:\/\//.test(a.imageUrl)),fresh.filter(a=>!a.imageUrl).map(a=>a.id).join(','));
 assert.equal(d.cards.find(c=>c.number===84).primaryArt,'ART-582');
 assert.match(d.artworks.find(a=>a.id==='ART-582').credit,/Marie-Lan Nguyen.*CC BY 2.5/);
 assert.equal(d.cards.find(c=>c.number===84).primaryArt,'ART-582');
 assert.match(d.artworks.find(a=>a.id==='ART-582').credit,/Marie-Lan Nguyen.*CC BY 2.5/);
 assert.equal(d.cards.find(c=>c.number===4).primaryArt,'ART-244');
 assert.equal(d.cards.find(c=>c.number===6).primaryArt,'ART-236');
 assert.equal(d.cards.find(c=>c.number===12).primaryArt,'ART-578');
 assert.equal(d.cards.find(c=>c.number===245).primaryArt,'ART-574');
 assert.deepEqual([102,152,208,209,236].map(n=>d.cards.find(c=>c.number===n).primaryArt),['ART-584','ART-027','ART-237','ART-020','ART-583']);
 assert.deepEqual([131,135,210,276].map(n=>d.cards.find(c=>c.number===n).primaryArt),['ART-201','ART-585','ART-511','ART-517']);
 assert.deepEqual([130,259,262,263,266].map(n=>d.cards.find(c=>c.number===n).primaryArt),['ART-275','ART-589','ART-588','ART-586','ART-587']);
 assert.deepEqual([59,148,191,194,214,216,226,265,280,288].map(n=>d.cards.find(c=>c.number===n).primaryArt),['ART-155','ART-551','ART-219','ART-509','ART-540','ART-007','ART-019','ART-256','ART-510','ART-500']);
 assert.deepEqual([25,42,44,88,92,133,134,145,241,254,270].map(n=>d.cards.find(c=>c.number===n).primaryArt),['ART-336','ART-387','ART-176','ART-187','ART-214','ART-316','ART-215','ART-323','ART-083','ART-287','ART-455']);
 const useCounts={};for(const c of d.cards)useCounts[c.primaryArt]=(useCounts[c.primaryArt]||0)+1;
 assert.equal(Object.values(useCounts).reduce((sum,n)=>sum+Math.max(0,n-1),0),22);
 assert.deepEqual((()=>{const a=d.artworks.find(x=>x.id==='ART-155');return [a.imageWidth,a.imageHeight,a.rights]})(),[4000,2911,'Public Domain / NGA Open Access; Commons CC0']);
 assert.equal(d.cards.find(c=>c.number===130).name,"Nymph of Laertes' Orchard");
 assert.equal(d.cards.find(c=>c.number===309).name,'Zeus, Guardian of Strangers');
 assert.equal(d.coverage.find(c=>c.number===309).name,'Zeus, Guardian of Strangers');
 assert.deepEqual((()=>{const a=d.artworks.find(x=>x.id==='ART-201');return [a.imageWidth,a.imageHeight]})(),[793,1200]);
 assert.deepEqual((()=>{const a=d.artworks.find(x=>x.id==='ART-585');return [a.imageWidth,a.imageHeight]})(),[5231,3648]);
 assert.deepEqual((()=>{const a=d.artworks.find(x=>x.id==='ART-589');return [a.imageWidth,a.imageHeight]})(),[1024,840]);
 assert.deepEqual(['ART-583','ART-584'].map(id=>{const a=d.artworks.find(x=>x.id===id);return [a.id,a.imageWidth,a.imageHeight]}),[['ART-583',6382,4832],['ART-584',2560,1920]]);
 assert.deepEqual((()=>{const a=d.artworks.find(x=>x.id==='ART-020');return [a.imageUrl,a.imageWidth,a.imageHeight]})(),['https://iiif.micr.io/PmgVy/full/max/0/default.jpg',4102,2717]);
 assert.equal(d.coverage.find(c=>c.number===236).name,'The Burning Olive Stake');
});
test('Studio loads the sheet sync before model construction and links the current card source',()=>{
 const app=fs.readFileSync(path.join(root,'public/mtgtools/odyssey/app.html'),'utf8');
 const data=app.indexOf('odyssey-data.js?v=20260926-closing2'),syncPos=app.indexOf('live-sheet-sync.js?v=20260927-art10'),model=app.indexOf('const ODYSSEY_DATASET=loadOdysseyDataset()');
 assert.ok(data>=0&&syncPos>data&&model>syncPos);
 assert.match(app,/1-OTRpW8vrSJWcXcL06l3eMJESwFtt6hQqCEl9J3sdEE\/edit/);
 const index=fs.readFileSync(path.join(root,'public/mtgtools/odyssey/index.html'),'utf8');assert.match(index,/app\.html\?v=20260927-art10/);
});
