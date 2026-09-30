'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'public/mtgtools/odyssey/data');
const data=JSON.parse(fs.readFileSync(path.join(dir,'odyssey-public-candidate.json'),'utf8'));
const archive=JSON.parse(fs.readFileSync(path.join(dir,'retired-dual-archive.20260930.json'),'utf8'));
const {pairs,retired}=require('../public/mtgtools/odyssey/data/locale-lands.20260930.js');
const card=n=>data.cards.find(c=>c.number===n);
test('the one complete common dual cycle shares the omens/navigation scry template',()=>{
 assert.equal(Object.keys(pairs).length,10);
 assert.deepEqual(new Set(Object.values(pairs)).size,10);
 for(const [n,pair] of Object.entries(pairs)){
  const c=card(Number(n));assert.equal(c.rarity,'C');assert.equal(c.type,'Land');
  assert.equal(c.rules,`This land enters tapped.\nWhen this land enters, scry 1.\n{T}: Add {${pair[0]}} or {${pair[1]}}.`);
  assert(c.cycleIds.includes('cycle.odyssean-locales'));
 }
 assert.equal(data.localeCycle.count,10);
});
test('the five overlapping dual designs are archived and await reassignment',()=>{
 assert.deepEqual(retired,[72,193,194,195,196]);
 assert.deepEqual(archive.sourceCards.map(c=>c.number),retired);
 for(const n of retired){const c=card(n),old=archive.sourceCards.find(x=>x.number===n);
  assert(old.rules.includes('scry 1'),n);assert.equal(c.rules,'');assert.equal(c.status,'REVISE');
  assert.equal(c.designDisposition,'REASSIGN');assert(!c.cycleIds.includes('cycle.enemy-temple-scry-lands'));
 }
 assert.deepEqual(data.emptySlots.slots,retired);
});
