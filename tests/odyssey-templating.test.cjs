'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'public/mtgtools/odyssey/data');
const current=JSON.parse(fs.readFileSync(path.join(dir,'odyssey-data.json'),'utf8'));
const candidate=JSON.parse(fs.readFileSync(path.join(dir,'odyssey-analysis-candidate-v1.json'),'utf8'));
const report=JSON.parse(fs.readFileSync(path.join(dir,'templating-report.json'),'utf8'));
const card=n=>current.cards.find(c=>c.number===n);
test('templating release is conservative and synchronized',()=>{
 assert.equal(current.datasetVersion,'2026-09-20.1');
 assert.equal(candidate.candidate.productionDatasetVersion,current.datasetVersion);
 assert.deepEqual(candidate.cards,current.cards);
 assert.equal(report.revision,'templating-v1');
 assert.equal(report.version,'2026-09-19.4');
 assert.ok(report.changedCards>=10&&report.changedCards<=120,report.changedCards);
 assert.equal(report.changes.length,report.changedCards);
});
test('reprints and Basic Lands remain outside the templating pass',()=>{
 const changed=new Set(report.changes.map(x=>x.number));
 for(const c of current.cards){
  if(String(c.originFull||'New').toLowerCase()==='reprint'||String(c.origin||'').toUpperCase()==='RPR'||/\bBasic Land\b/.test(c.type||''))assert.ok(!changed.has(c.number),c.number+' '+c.name);
 }
});
test('modern Survival and nonlegendary self-reference wording is used',()=>{
 assert.match(card(1).rules,/if this creature is tapped/);
 assert.doesNotMatch(card(1).rules,/if Ithacan Prince in Training is tapped/);
 assert.match(card(7).rules,/if this creature is tapped/);
});
test('Heroic rules no longer use gendered rules pronouns',()=>{
 assert.match(card(2).rules,/put a \+1\/\+1 counter on Telemachus\./);
 assert.doesNotMatch(card(2).rules,/\bhim\b|\bher\b/i);
});
test('resolution-history limiter is replaced with normal trigger-frequency language',()=>{
 assert.equal(card(4).rules,'Constellation — Whenever an enchantment you control enters, create a 1/1 white Human creature token. This ability triggers only once each turn.');
});
test('modern enters wording removes battlefield only from entry-event phrases',()=>{
 for(const x of report.changes)assert.doesNotMatch(x.after,/enters the battlefield|entered the battlefield/);
 assert.match(card(5).rules,/Return that card to the battlefield/,'return-to-battlefield instruction must remain intact');
 assert.match(card(301).rules,/If it entered from exile this turn/);
});
test('God creature condition uses current contraction without changing devotion threshold',()=>{
 for(const n of [308,309]){assert.match(card(n).rules,/isn't a creature/);assert.match(card(n).rules,/devotion .* less than seven/);}
});
test('nonlegendary locale lands use current this-land entry template',()=>{
 for(const n of [70,71,143,267,268,269,270,271,272,273])assert.match(card(n).rules,/^This land enters tapped\./,n+' '+card(n).rules);
});
test('once-per-turn guardrails use the current each-turn clause',()=>{
 const x=report.changes.find(x=>/^Deathtouch\. Once each turn, when one or more permanent cards leave/.test(x.before));
 assert.ok(x,'expected graveyard trigger normalization');
 assert.match(x.after,/Whenever one or more permanent cards leave your graveyard/);
 assert.match(x.after,/This ability triggers only once each turn\./);
 assert.doesNotMatch(x.after,/Once each turn, when/);
});
test('play permission and mana permission are separated cleanly',()=>{
 assert.match(card(303).rules,/Until end of turn, you may play that card\. You may spend mana as though it were mana of any color to cast that spell\./);
});
test('every changed card records evidence and no numerical game data changed',()=>{
 for(const x of report.changes){
  assert.ok(x.reason&&x.reason.length>10,x.id);
  assert.ok(Array.isArray(x.references),x.id);
  const c=card(x.number);assert.ok(c.changeStatus.includes('templating-v1'),x.id);
 }
});

test('same-object references stay consistently modern within a card',()=>{
 assert.match(card(18).rules,/Sacrifice this enchantment/);
 assert.match(card(65).rules,/this Vehicle gains flying/);
 assert.match(card(86).rules,/this creature gets \+1\/\+1/);
 assert.match(card(111).rules,/this creature has vigilance/);
 assert.match(card(147).rules,/until this creature leaves the battlefield/);
 assert.match(card(237).rules,/fought this creature this way/);
 assert.match(card(283).rules,/this creature deals 1 damage/);
 assert.match(card(284).rules,/put a \+1\/\+1 counter on this creature/);
});
test('Olive Tree uses a normal zone-change trigger, guardrail, and encoded ward cost',()=>{
 assert.match(card(239).rules,/Whenever a permanent you control enters from your graveyard or from exile/);
 assert.match(card(239).rules,/This ability triggers only once each turn/);
 assert.match(card(239).rules,/ward \{1\}/);
 assert.doesNotMatch(card(239).rules,/Once each turn, whenever|ward 1/);
});
