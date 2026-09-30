'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'public/mtgtools/Odyssey/scry');
const cards=require('../public/mtgtools/odyssey/data/odyssey-public-candidate.json').cards;
const source=fs.readFileSync(path.join(dir,'focused-launch.js'),'utf8');
const context={document:{body:{dataset:{page:'launch'}}},window:{OdysseyExhibitionCore:{},OdysseySetShowcase:{features:{}}}};
// Execute the real feature predicates without mounting a DOM or replacing them.
vm.runInNewContext(source.slice(0,source.indexOf('function mount()'))+'})();',context);
const features=context.window.OdysseyExhibitionCore.mechanics;
const exhibition=fs.readFileSync(path.join(dir,'exhibition.js'),'utf8');
const predicate=exhibition.match(/^function matchesGroup\(c\)\{[^\n]+/m)?.[0];
assert.ok(predicate,'actual collection predicate must remain inspectable');
const runtime={C:{mechanics:features},group:''};vm.createContext(runtime);vm.runInContext(predicate,runtime);

for(const feature of features)test('collection membership includes all matches and featured examples: '+feature.id,()=>{
 runtime.group='mechanic:'+feature.id;
 const expected=cards.filter(c=>feature.match(c)||feature.featured.includes(c.number)).map(c=>c.number);
 const actual=cards.filter(runtime.matchesGroup).map(c=>c.number);
 assert.deepEqual(actual,expected);
 for(const n of feature.featured)assert.ok(actual.includes(n),feature.id+' featured '+n);
 assert.equal(new Set(actual).size,actual.length,'no duplicate candidates');
});

test('Homecoming has 44 rule matches plus featured Penelope, not a 44-card collection',()=>{
 const feature=features.find(f=>f.id==='return');
 const matching=cards.filter(feature.match),extra=cards.filter(c=>feature.featured.includes(c.number)&&!feature.match(c));
 assert.equal(matching.length,44);
 assert.deepEqual(extra.map(c=>[c.number,c.name]),[[199,'Penelope, Weaver of Fate']]);
 runtime.group='mechanic:return';
 assert.equal(cards.filter(runtime.matchesGroup).length,45);
});
