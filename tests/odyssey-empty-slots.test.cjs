'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'public/mtgtools/odyssey/data');
const data=JSON.parse(fs.readFileSync(path.join(dir,'odyssey-data.json'),'utf8'));
const candidate=JSON.parse(fs.readFileSync(path.join(dir,'odyssey-analysis-candidate-v2.json'),'utf8'));
const report=JSON.parse(fs.readFileSync(path.join(dir,'empty-slot-report.json'),'utf8'));
const card=n=>data.cards.find(c=>c.number===n);
const cut=[11,32,59,112,115,274,277,278,281,289,290,291,295,297,302,307];
const keep=[3,13,15,47,66,141,148,151,167,178,296];
test('exactly the requested numbered designs become empty slots',()=>{
 assert.equal(data.datasetVersion,'2026-09-21.1');
 assert.equal(report.numberedCount,16);
 assert.deepEqual(report.numberedEmptySlots.map(x=>x.number).sort((a,b)=>a-b),cut);
 assert.equal(data.emptySlots.count,16);
 for(const n of cut){const c=card(n);assert.equal(c.status,'CUT',n);assert.equal(c.slotState,'EMPTY',n);assert.equal(c.replacementNeeded,true,n);assert.equal(c.cutReason,'empty-slot-collection-v1',n);assert.ok(c.changeStatus.includes('empty-slot-collection-v1'),n);}
});
test('the explicitly retained obscure references remain active',()=>{for(const n of keep)assert.notEqual(card(n).status,'CUT',n+' '+card(n).name)});
test('four former empty slots are now filled by the Survivor Ordeals',()=>{for(const n of [17,93,280,282]){const c=card(n);assert.equal(c.status,'PROTOTYPE');assert.match(c.name,/^Ordeal of /);assert.ok(c.cycleIds.includes('cycle.survivor-ordeals-v1'));}});
test('only Feign Madness survives rank 16 and only Inland Shrine survives rank 22',()=>{
 assert.notEqual(card(13).status,'CUT');assert.equal(card(32).status,'CUT');
 assert.notEqual(card(3).status,'CUT');assert.equal(card(11).status,'CUT');
});
test('both goat-isle designs remain because rank 30 was kept without narrowing it',()=>{assert.notEqual(card(141).status,'CUT');assert.notEqual(card(167).status,'CUT')});
test('four unnumbered deep-cut candidates are explicitly tracked for removal',()=>{
 assert.deepEqual(new Set(report.unnumberedCuts),new Set(["Mixing Bowl of Polyxenus","Iphthime's Dream-Image","Ctesippus, Mocking Host","Peisistratus, Pylian Companion"]));
});
test('Calchas becomes the requested nine-bird punisher pseudo-board-wipe',()=>{
 const c=card(15);
 assert.equal(c.name,'Calchas Reads the Omen');
 assert.equal(c.mana,'{4}{W}{U}');assert.equal(c.mv,6);assert.equal(c.color,'WU');assert.equal(c.rarity,'R');
 assert.match(c.rules,/sacrifice up to nine permanents/i);
 assert.ok(c.rules.includes('Scry {X}, where {X} is nine minus'));
 assert.match(c.rules,/choose up to \{X\} creatures and\/or artifacts/);
 assert.match(c.rules,/stun counter/);
});
test('promoted Candidate 2 remains an exact card-for-card snapshot of Current',()=>{assert.deepEqual(candidate.cards,data.cards);assert.equal(candidate.candidate.productionDatasetVersion,data.datasetVersion);assert.equal(candidate.candidate.cutoverAuthorized,true)});
test('cutting does not renumber or delete slots',()=>{assert.equal(data.cards.length,309);assert.deepEqual(data.cards.map(c=>c.number),Array.from({length:309},(_,i)=>i+1))});
