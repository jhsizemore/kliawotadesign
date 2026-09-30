'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'public/mtgtools/odyssey/data');
// Candidate 1 is mutable. Historical report assertions use independently extracted Git snapshots.
const history=require('./fixtures/odyssey-templating-history.json'),historical=history.after;
const candidate=JSON.parse(fs.readFileSync(path.join(dir,'odyssey-analysis-candidate-v1.json'),'utf8'));
const report=JSON.parse(fs.readFileSync(path.join(dir,'templating-report.json'),'utf8'));
const card=n=>historical.cards.find(c=>c.number===n);
const hash=value=>createHash('sha256').update(value).digest('hex');
test('templating release has independently sourced historical evidence',()=>{
 assert.equal(hash(JSON.stringify(history)),'c7aaa855ede611a833d1b374f7324dbb6e9cb986b203c4bca53951f37337722a');
 assert.equal(history.before.provenance.commit,'f7435dc955c51e2be11b7bc20ede076ca6a2bbf7');
 assert.equal(history.after.provenance.commit,'5751d59e6a6eccde7a8885bb332a1e24a67a1a45');
 assert.equal(history.before.provenance.gitBlobSha1,'95046f26787575a7c0403279a92c1aa5cfa1b4f0');
 assert.equal(history.after.provenance.gitBlobSha1,'644a36e2b165fb6f746ff489d94999010bcecb53');
 assert.equal(hash(fs.readFileSync(path.join(dir,'templating-report.json'))),history.report.sha256,'The historical report must not be rewritten to fit later designs');
 assert.equal(historical.datasetVersion,'analysis-candidate-v1');
 assert.equal(historical.productionDatasetVersion,report.version);
 assert.equal(candidate.candidate.productionDatasetVersion,'2026-09-20.1');
 assert.equal(historical.cards.length,309);
 assert.equal(history.before.cards.length,309);
 assert.equal(report.revision,'templating-v1');
 assert.equal(report.version,'2026-09-19.4');
 assert.ok(report.changedCards>=10&&report.changedCards<=120,report.changedCards);
 assert.equal(report.changes.length,report.changedCards);
});
test('reprints and Basic Lands remain outside the templating pass',()=>{
 const changed=new Set(report.changes.map(x=>x.number));
 for(const c of historical.cards){
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
 const before=new Map(history.before.cards.map(c=>[c.number,c]));
 for(const c of historical.cards)for(const field of ['id','number','mana','mv','color','type','pt','rarity','layout'])assert.deepEqual(c[field],before.get(c.number)[field],c.id+' '+field);
 for(const x of report.changes){
  assert.ok(x.reason&&x.reason.length>10,x.id);
  assert.ok(Array.isArray(x.references),x.id);
  assert.equal(before.get(x.number).name,x.name,x.id+' historical name');
  assert.equal(before.get(x.number).rules,x.before,x.id+' before wording');
  assert.equal(before.get(x.number).functionalWords,x.functionalWordsBefore,x.id+' before word count');
  const c=card(x.number);assert.equal(c.name,x.name,x.id);assert.equal(c.rules,x.after,x.id);assert.ok(c.changeStatus.includes('templating-v1'),x.id);
  assert.equal(c.functionalWords,x.functionalWordsAfter,x.id+' after word count');
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
