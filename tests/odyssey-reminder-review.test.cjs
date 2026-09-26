'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),data=require('../public/mtgtools/odyssey/data/odyssey-data.json');
const app=fs.readFileSync(path.join(root,'public/mtgtools/odyssey/app.html'),'utf8');
const source=fs.readFileSync(path.join(root,'public/mtgtools/odyssey/data/reminder-review.20260927a.js'),'utf8');
const context={window:{}};vm.runInNewContext(source,context);const review=context.window.ODYSSEY_REMINDER_REVIEW;

test('reminder review is a complete per-card advisory ledger',()=>{
 assert.equal(review.schema,'odyssey-reminder-review/v1');
 assert.equal(review.datasetVersion,data.datasetVersion);
 assert.equal(review.cards.length,40);
 assert.equal(new Set(review.cards.map(row=>row.number)).size,40);
 assert.deepEqual(Object.fromEntries(['print','inspector-only'].map(key=>[key,review.cards.filter(row=>row.proposal===key).length])),{print:19,'inspector-only':21});
 for(const row of review.cards){
  const card=data.cards.find(card=>card.number===row.number);
  assert.ok(card,'missing card '+row.number);
  assert.ok(row.mechanics.length,row.number+' mechanics');
  assert.ok(row.reason.length>20,row.number+' reason');
  assert.ok(['explicit-data','remove-auto'].includes(row.action),row.number+' action');
 }
});

test('manifest-fate drift and every current automatic reminder case are covered',()=>{
 const covered=new Set(review.cards.map(row=>row.number));
 const automatic=data.cards.filter(card=>card.layout==='adventure'||card.layout==='prepare'||/\b(?:Foretell|Monstrosity|devotion|Crew\s+\d+)\b/i.test(card.layout==='transform'?String(card.rules||'').split('//BACK//')[0]:card.rules||''));
 for(const card of automatic)assert.ok(covered.has(card.number),card.number+' automatic reminder');
 const fate=data.cards.filter(card=>/manifest fate/i.test(card.rules||''));
 assert.equal(fate.length,16);
 for(const card of fate)assert.ok(covered.has(card.number),card.number+' manifest fate');
 assert.match(app,/if\(\/manifest hope\/i\.test\(t\)\)add\('manifest'\)/,'stale detector remains visible until editorial approval');
});

test('the ledger is Inspector-only and cannot silently change printed card text',()=>{
 assert.match(app,/reminderStatusHTML\(m,playtestRemindersFor/);
 assert.match(app,/function cardInnerHTML\(m\).*reminderHTMLFor\(m,sp\.main\)/s);
 assert.doesNotMatch(source,/\.rules\s*=|cards\s*\.(?:push|splice)|reminderHTMLFor/);
 assert.match(app,/Advisory only:<\/b> card rules and printed reminders are unchanged/);
});
