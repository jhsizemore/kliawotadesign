'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'public/mtgtools/odyssey/data');
const data=JSON.parse(fs.readFileSync(path.join(dir,'odyssey-data.json'),'utf8'));
const candidate=JSON.parse(fs.readFileSync(path.join(dir,'odyssey-analysis-candidate-v2.json'),'utf8'));
const report=JSON.parse(fs.readFileSync(path.join(dir,'empty-slot-report.json'),'utf8'));
const card=n=>data.cards.find(c=>c.number===n);
const cut=[11,32,59,112,115,274,277,278,281,289,290,291,295,297,302,307];
const keep=[3,13,15,47,66,141,148,151,167,178,296];
test('the superseding candidate fills all numbered slots without erasing the cut archive',()=>{
 assert.equal(report.revision,'14A2-complete');assert.equal(report.numberedCount,0);assert.deepEqual(report.numberedEmptySlots,[]);assert.equal(data.emptySlots.count,0);assert.deepEqual(data.emptySlots.slots,[]);
 for(const n of cut){const c=card(n),archived=report.archive.find(r=>r.number===n&&r.name);assert.ok(archived,n);assert.ok(archived.rules,n);assert.notEqual(c.status,'CUT',n);assert.notEqual(c.slotState,'EMPTY',n);}
 assert.deepEqual(report.keptNumbers,data.cards.map(c=>c.number));
});
test('the explicitly retained obscure references remain active',()=>{for(const n of keep)assert.notEqual(card(n).status,'CUT',n+' '+card(n).name)});
test('four former empty slots are now filled by the Survivor Ordeals',()=>{for(const n of [17,93,280,282]){const c=card(n);assert.ok(['KEEP','PROTOTYPE'].includes(c.status));assert.match(c.name,/^Ordeal of /);assert.ok(c.cycleIds.includes('cycle.survivor-ordeals-v1'));}});
test('superseded cut designs stay in the archive, not mistaken for current slot contents',()=>{
 for(const n of [11,32]){const old=report.archive.find(c=>c.number===n&&c.name);assert.ok(old);assert.notEqual(card(n).name,old.name);assert.notEqual(card(n).status,'CUT');}
});
test('both goat-isle designs remain because rank 30 was kept without narrowing it',()=>{assert.notEqual(card(141).status,'CUT');assert.notEqual(card(167).status,'CUT')});
test('current report does not advertise resolved unnumbered cuts as still pending',()=>{assert.deepEqual(report.unnumberedCuts,[]);assert.ok(report.archive.length>=20);assert.ok(report.archive.filter(x=>x.status==='FILLED').every(x=>card(x.number).name.startsWith('Ordeal of ')));});
test('archived Calchas preserves the nine-bird design without reverting the later slot',()=>{
 const archive=JSON.parse(fs.readFileSync(path.join(dir,'odyssey-analysis-candidate-v1.json'),'utf8'));const c=archive.cards.find(x=>x.number===15);assert.notEqual(card(15).name,c.name);
 assert.equal(c.name,'Calchas Reads the Omen');
 assert.equal(c.mana,'{4}{W}{U}');assert.equal(c.mv,6);assert.equal(c.color,'WU');assert.equal(c.rarity,'R');
 assert.match(c.rules,/sacrifice up to nine permanents/i);
 assert.ok(c.rules.includes('Scry {X}, where {X} is nine minus'));
 assert.match(c.rules,/choose up to \{X\} creatures and\/or artifacts/);
 assert.match(c.rules,/stun counter/);
});
test('promoted Candidate 2 remains an exact card-for-card snapshot of Current',()=>{assert.deepEqual(candidate.cards,data.cards);assert.equal(candidate.candidate.productionDatasetVersion,data.datasetVersion);assert.equal(candidate.candidate.cutoverAuthorized,true)});
test('cutting does not renumber or delete slots',()=>{assert.equal(data.cards.length,309);assert.deepEqual(data.cards.map(c=>c.number),Array.from({length:309},(_,i)=>i+1))});
