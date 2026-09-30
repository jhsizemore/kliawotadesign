'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'public/mtgtools/odyssey/data');
const data=JSON.parse(fs.readFileSync(path.join(dir,'odyssey-public-candidate.json'),'utf8'));
const archive=JSON.parse(fs.readFileSync(path.join(dir,'retired-dual-archive.20260930.json'),'utf8'));
const {pairs,retired}=require('../public/mtgtools/odyssey/data/locale-lands.20260930.js');
const {designs}=require('../public/mtgtools/odyssey/data/reassigned-rare-slots.20260930.js');
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
test('the five overlapping dual designs stay archived while nonland prototypes occupy their slots',()=>{
 assert.deepEqual(retired,[72,193,194,195,196]);
 assert.deepEqual(archive.sourceCards.map(c=>c.number),retired);
 for(const n of retired){const c=card(n),old=archive.sourceCards.find(x=>x.number===n);
  assert(old.rules.includes('scry 1'),n);assert.equal(c.rules,designs[n].rules);assert.equal(c.flavor,'');assert.equal(c.status,'PROTOTYPE');
  assert.equal(c.designDisposition,'ACTIVE_PROTOTYPE');assert(!c.type.includes('Land'));assert(!c.cycleIds.includes('cycle.enemy-temple-scry-lands'));
  assert.equal(c.primaryArt,designs[n].art);assert.equal(c.displayName,designs[n].name);
 }
 assert.deepEqual(data.emptySlots.slots,[]);assert.equal(data.reassignedRareSlots.numbers.length,5);
});
test('the sanctuary artwork library registers before the land designs are retired',()=>{
 const app=fs.readFileSync(path.join(root,'public/mtgtools/odyssey/app.html'),'utf8');
 assert(app.indexOf('temple-sanctuaries.js?v=sanctuaries2')<app.indexOf('locale-lands.20260930.js?v=locale4'));
 const base=structuredClone(data);
 for(const old of archive.sourceCards)base.cards[base.cards.findIndex(c=>c.number===old.number)]=old;
 const sandbox={window:{ODYSSEY_DATA:base}};vm.createContext(sandbox);
 for(const file of ['data/temple-sanctuaries.20260929.js','temple-sanctuaries.js','data/locale-lands.20260930.js','data/reassigned-rare-slots.20260930.js'])
  vm.runInContext(fs.readFileSync(path.join(root,'public/mtgtools/odyssey',file),'utf8'),sandbox,{filename:file});
 const result=sandbox.window.ODYSSEY_DATA;
 assert.equal(result.artworks.length,data.artworks.length+10);
 assert.equal(result.templeSanctuaryImport.mainAssignments,0);
 assert.equal(result.cards.find(c=>c.number===72).rules,designs[72].rules);
 const reloaded=sandbox.window.OdysseyTempleSanctuaries.apply(result);
 assert.equal(reloaded.cards.find(c=>c.number===72).rules,designs[72].rules);
 assert.equal(reloaded.artworks.length,result.artworks.length);
 const archivePage=fs.readFileSync(path.join(root,'public/mtgtools/odyssey/temple-sanctuaries.html'),'utf8');
 assert(archivePage.includes('Sanctuary artwork and retired dual designs'));
});
