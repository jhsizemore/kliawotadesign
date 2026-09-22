'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'public/mtgtools/odyssey');
const data=JSON.parse(fs.readFileSync(path.join(dir,'data/odyssey-data.json'),'utf8'));
const refs=JSON.parse(fs.readFileSync(path.join(dir,'data/card-references.json'),'utf8'));
const current=data.cards;
require('../public/mtgtools/odyssey/card-reference-browser.js');
test('every current Odyssey card has a refreshed real-card reference set',()=>{
 assert.equal(refs.schema,'odyssey-reference-cards/v2');
 assert.equal(refs.totalCards,current.length);
 assert.equal(Object.keys(refs.cards).length,current.length);
 for(const c of current){const e=refs.cards[c.id];assert.ok(e,c.id);assert.equal(e.number,c.number);assert.ok(e.references.length>=1&&e.references.length<=7,c.id+' '+e.references.length);if(!/\\bBasic Land\\b/.test(c.type||'')){const roles=new Set(e.references.map(r=>r.role));assert.ok(roles.has('rate-best'),c.id+' missing best-rate');assert.ok(roles.has('rate-normal'),c.id+' missing normal-rate');}}
});
test('quest-counter progression cards carry the dedicated current quest-tech precedent',()=>{
 const quests=current.filter(c=>/quest counter/i.test((c.rules||'')+' '+(c.mechanics||'')));assert.ok(quests.length>=5);
 for(const c of quests){const refsFor=refs.cards[c.id].references;assert.ok(refsFor.some(r=>r.role==='tech'&&r.card.name==="Last Light of Durin's Day"),c.id+' missing quest-tech anchor');}
});
test('reference cards are distinct Scryfall cards with reviewable imagery and annotations',()=>{
 for(const e of Object.values(refs.cards)){
  const seen=new Set();
  for(const r of e.references){
   assert.ok(['identity','rate-best','rate-normal','tech','template','mechanic','buildaround','analogue'].includes(r.role),e.id);
   assert.ok(typeof r.annotation==='string'&&r.annotation.length>=25,e.id+' '+r.card.name);
   assert.ok(Number.isFinite(r.score)&&r.score>=0&&r.score<=1,e.id+' '+r.card.name);
   assert.match(r.card.scryfallUri,/^https:\/\/scryfall\.com\/card\//);
   const image=r.card.images.small||r.card.images.normal||r.card.images.large;
   assert.ok(image,e.id+' '+r.card.name);
   assert.match(image,/^https:\/\/cards\.scryfall\.io\//);
   assert.ok(typeof r.card.oracleText==='string',e.id+' '+r.card.name+' oracle text field');if(!/\\bLand\\b/.test(r.card.type||''))assert.ok(r.card.oracleText.trim(),e.id+' '+r.card.name+' oracle text');
   assert.ok(r.card.releasedAt<=refs.scryfallBulk.releasedOnOrBefore,e.id+' unreleased reference '+r.card.name);
   const key=r.card.oracleId||r.card.id;assert.ok(!seen.has(key),e.id+' duplicate '+r.card.name);seen.add(key);
  }
 }
});
test('annotations explain concrete interest rather than only naming a card',()=>{
 const notes=Object.values(refs.cards).flatMap(e=>e.references.map(r=>r.annotation));
 assert.ok(notes.some(x=>/^Rules template:/.test(x)));
 assert.ok(notes.some(x=>/^Mechanics \/ play pattern:/.test(x)));
 assert.ok(notes.some(x=>/^Best-rate benchmark:/.test(x)));\n assert.ok(notes.some(x=>/^Normal-rate benchmark:/.test(x)));\n assert.ok(notes.some(x=>/^Mechanic \/ set-tech precedent:/.test(x)));
 assert.ok(notes.some(x=>/Guardrail precedent|Contrast:/.test(x)),'expected at least one limiter comparison');
});
test('Studio loads reference data before the review browser and keeps it separate from card data',()=>{
 const app=fs.readFileSync(path.join(dir,'app.html'),'utf8');
 const a=app.indexOf('card-references.js?v=20260922-ref2'),b=app.indexOf('card-reference-browser.js?v=20260922-ref2');
 assert.ok(a>0&&b>a);
 assert.match(app,/odyssey-data\.js\?v=20260921-live3/);
 const index=fs.readFileSync(path.join(dir,'index.html'),'utf8');assert.match(index,/app\.html\?v=\d{8}-\d+/);
 const browser=fs.readFileSync(path.join(dir,'card-reference-browser.js'),'utf8');
 for(const phrase of ['Real card references','Mark reviewed + next','Open on Scryfall','Oracle text','odyssey-reference-review-v1'])assert.ok(browser.includes(phrase),phrase);
});
test('release metadata records the exact reference snapshot',()=>{
 const release=JSON.parse(fs.readFileSync(path.join(dir,'data/release.json'),'utf8'));
 assert.equal(release.referenceCards.cards,current.length);
 assert.equal(release.referenceCards.totalReferences,Object.values(refs.cards).reduce((n,e)=>n+e.references.length,0));
 assert.ok(release.referenceCards.scryfallBulkUpdatedAt);
});
