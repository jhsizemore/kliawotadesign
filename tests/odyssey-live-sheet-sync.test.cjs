'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const sync=require('../public/mtgtools/odyssey/live-sheet-sync.js');
const root=path.resolve(__dirname,'..');
function baseline(){
 const cards=Array.from({length:309},(_,i)=>({id:'ODY-'+String(i+1).padStart(3,'0'),number:i+1,backFace:i===228?{imageUrl:'wooden-horse.jpg'}:undefined}));
 return {schema:'odyssey-studio-data/v1',datasetVersion:'old',cards,artworks:[],coverage:[],integrity:{},candidate:{}};
}
test('live sheet sync promotes the full current 309 and 581-art library',()=>{
 const d=sync.apply(baseline());
 assert.equal(d.datasetVersion,'2026-09-26.2');
 assert.equal(d.cards.length,309);assert.equal(d.artworks.length,581);assert.equal(d.coverage.length,309);
 assert.equal(new Set(d.cards.map(c=>c.number)).size,309);assert.equal(new Set(d.artworks.map(a=>a.id)).size,581);
 assert.equal(d.sheetSync.cardSheet.revision,'221');assert.equal(d.sheetSync.artSheet.revision,'57');
 const art=new Set(d.artworks.map(a=>a.id));const assigned=d.cards.filter(c=>c.primaryArt);
 assert.equal(assigned.length,302);for(const c of assigned)assert.ok(art.has(c.primaryArt),c.id+' has current art');
 assert.deepEqual(d.cards.filter(c=>!c.primaryArt).map(c=>c.number),[131,135,236,259,262,263,266]);
});
test('current special layouts survive the sheet cutover',()=>{
 const d=sync.apply(baseline()),count=k=>d.cards.filter(c=>c.layout===k).length;
 assert.deepEqual({standard:count('standard'),saga:count('saga'),adventure:count('adventure'),prepare:count('prepare'),battle:count('battle'),vehicle:count('vehicle'),transform:count('transform')},{standard:275,saga:16,adventure:7,prepare:1,battle:0,vehicle:9,transform:1});
 for(const n of [208,209,222]){const c=d.cards.find(x=>x.number===n);assert.match(c.type,/Enchantment Creature.*Saga/i);assert.equal(c.layout,'saga');}
 const t=d.cards.find(c=>c.number===229);assert.equal(t.layout,'transform');assert.equal(t.backFace.imageUrl,'wooden-horse.jpg');
});
test('the newest artwork wave is directly renderable and assigned',()=>{
 const d=sync.apply(baseline()),fresh=d.artworks.filter(a=>+a.id.slice(4)>553);
 assert.equal(fresh.length,28);assert.ok(fresh.every(a=>/^https:\/\//.test(a.imageUrl)),fresh.filter(a=>!a.imageUrl).map(a=>a.id).join(','));
 assert.equal(d.cards.find(c=>c.number===4).primaryArt,'ART-244');
 assert.equal(d.cards.find(c=>c.number===6).primaryArt,'ART-236');
 assert.equal(d.cards.find(c=>c.number===12).primaryArt,'ART-578');
 assert.equal(d.cards.find(c=>c.number===245).primaryArt,'ART-574');
});
test('Studio loads the sheet sync before model construction and links the current card source',()=>{
 const app=fs.readFileSync(path.join(root,'public/mtgtools/odyssey/app.html'),'utf8');
 const data=app.indexOf('odyssey-data.js?v=20260926-saga1'),syncPos=app.indexOf('live-sheet-sync.js?v=20260926-r221-r57'),model=app.indexOf('const ODYSSEY_DATASET=loadOdysseyDataset()');
 assert.ok(data>=0&&syncPos>data&&model>syncPos);
 assert.match(app,/1-OTRpW8vrSJWcXcL06l3eMJESwFtt6hQqCEl9J3sdEE\/edit/);
 const index=fs.readFileSync(path.join(root,'public/mtgtools/odyssey/index.html'),'utf8');assert.match(index,/app\.html\?v=20260926-sheetsync1/);
});
