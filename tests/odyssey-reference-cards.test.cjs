'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'public/mtgtools/odyssey');
const data=JSON.parse(fs.readFileSync(path.join(dir,'data/odyssey-data.json'),'utf8'));
const refs=JSON.parse(fs.readFileSync(path.join(dir,'data/card-references.json'),'utf8'));
const originals=data.cards.filter(c=>String(c.originFull||'New').toLowerCase()==='new'&&String(c.origin||'').toUpperCase()!=='RPR'&&!/\bBasic Land\b/.test(c.type||''));
require('../public/mtgtools/odyssey/card-reference-browser.js');
test('every original Odyssey design has one to three real-card references',()=>{
 assert.equal(refs.schema,'odyssey-reference-cards/v1');
 assert.equal(refs.originalCards,originals.length);
 assert.equal(Object.keys(refs.cards).length,originals.length);
 for(const c of originals){const e=refs.cards[c.id];assert.ok(e,c.id);assert.equal(e.number,c.number);assert.ok(e.references.length>=1&&e.references.length<=3,c.id+' '+e.references.length);}
});
test('reprints do not receive original-design reference sets',()=>{
 const originalIds=new Set(originals.map(c=>c.id));
 for(const id of Object.keys(refs.cards))assert.ok(originalIds.has(id),id);
});
test('reference cards are distinct Scryfall cards with reviewable imagery and annotations',()=>{
 for(const e of Object.values(refs.cards)){
  const seen=new Set();
  for(const r of e.references){
   assert.ok(['template','mechanic','rate','analogue'].includes(r.role),e.id);
   assert.ok(typeof r.annotation==='string'&&r.annotation.length>=25,e.id+' '+r.card.name);
   assert.ok(Number.isFinite(r.score)&&r.score>=0&&r.score<=1,e.id+' '+r.card.name);
   assert.match(r.card.scryfallUri,/^https:\/\/scryfall\.com\/card\//);
   const image=r.card.images.small||r.card.images.normal||r.card.images.large;
   assert.ok(image,e.id+' '+r.card.name);
   assert.match(image,/^https:\/\/cards\.scryfall\.io\//);
   assert.ok(typeof r.card.oracleText==='string'&&r.card.oracleText.trim(),e.id+' '+r.card.name+' oracle text');
   assert.ok(r.card.releasedAt<=refs.scryfallBulk.releasedOnOrBefore,e.id+' unreleased reference '+r.card.name);
   const key=r.card.oracleId||r.card.id;assert.ok(!seen.has(key),e.id+' duplicate '+r.card.name);seen.add(key);
  }
 }
});
test('annotations explain concrete interest rather than only naming a card',()=>{
 const notes=Object.values(refs.cards).flatMap(e=>e.references.map(r=>r.annotation));
 assert.ok(notes.some(x=>/^Rules template:/.test(x)));
 assert.ok(notes.some(x=>/^Mechanics \/ play pattern:/.test(x)));
 assert.ok(notes.some(x=>/^Rate \/ role benchmark:/.test(x)));
 assert.ok(notes.some(x=>/Guardrail precedent|Contrast:/.test(x)),'expected at least one limiter comparison');
});
test('Studio loads reference data before the review browser and keeps it separate from card data',()=>{
 const app=fs.readFileSync(path.join(dir,'app.html'),'utf8');
 const a=app.indexOf('card-references.js?v=20260919-1'),b=app.indexOf('card-reference-browser.js?v=20260919-1');
 assert.ok(a>0&&b>a);
 assert.match(app,/odyssey-data\.js\?v=20260919-live3/);
 const index=fs.readFileSync(path.join(dir,'index.html'),'utf8');assert.match(index,/app\.html\?v=20260919-20/);
 const browser=fs.readFileSync(path.join(dir,'card-reference-browser.js'),'utf8');
 for(const phrase of ['Real card references','Mark reviewed + next','Open on Scryfall','Oracle text','odyssey-reference-review-v1'])assert.ok(browser.includes(phrase),phrase);
});
test('release metadata records the exact reference snapshot',()=>{
 const release=JSON.parse(fs.readFileSync(path.join(dir,'data/release.json'),'utf8'));
 assert.equal(release.appRevision,'card-references-v1');
 assert.equal(release.referenceCards.originalCards,originals.length);
 assert.equal(release.referenceCards.totalReferences,Object.values(refs.cards).reduce((n,e)=>n+e.references.length,0));
 assert.ok(release.referenceCards.scryfallBulkUpdatedAt);
});
