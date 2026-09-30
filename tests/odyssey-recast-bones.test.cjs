const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const data=JSON.parse(fs.readFileSync(path.join(root,'public/mtgtools/odyssey/data/odyssey-public-candidate.json')));
const archive=JSON.parse(fs.readFileSync(path.join(root,'public/mtgtools/odyssey/data/recast-archive.20260930.json')));
const {numbers}=require('../public/mtgtools/odyssey/data/recast-bones.20260930.js');

test('Studio applies the Recast reset after note resolution when constructing the active dataset',()=>{
 const app=fs.readFileSync(path.join(root,'public/mtgtools/odyssey/app.html'),'utf8');
 assert.match(app,/const ODYSSEY_DATASET=window\.OdysseyLocaleLands\.apply\(window\.OdysseyRecastBones\.apply\(window\.OdysseyNotesResolution\.apply\(/);
});

test('every explicit Recast has a complete archived design and an open structural slot',()=>{
 assert.deepEqual(numbers,[14,154,160,165,167,216,241,275,283,285,290,297]);
 assert.deepEqual(archive.cards.map(c=>c.number),numbers);
 for(const a of archive.cards){
  const c=data.cards.find(x=>x.number===a.number);
  assert(c&&a.studioEffective.rules&&a.canonicalSheet.values['Rules / Playtest Text'],`archive #${a.number}`);
  assert.equal(c.rules,'');assert.equal(c.mechanics,'');assert.equal(c.pt,'');assert.equal(c.flavor,'');
  assert.equal(c.status,'REVISE');assert.equal(c.designDisposition,'RECAST');
  assert.equal(c.functionalWords,0);assert.equal(c.flavorMatchScore,null);
  for(const key of ['number','id','mana','mv','color','frame','type','rarity','layout','storyTarget','archetypes','primaryArt'])
   assert.deepEqual(c[key],a.candidate[key],`${key} of #${a.number}`);
 }
 assert.equal(data.cards.filter(c=>c.designDisposition==='RECAST').length,numbers.length);
 const reprint=data.cards.find(c=>c.number===154);
 assert.equal(reprint.origin,'NEW');assert.equal(reprint.underlyingName,'');assert.equal(reprint.treatment,'');
});
