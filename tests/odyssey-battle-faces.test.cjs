'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const T=require('../public/mtgtools/odyssey/transform-faces.js');
const {frameFamily}=require('../public/mtgtools/odyssey/frame-system.js');
const fixture=require('./fixtures/odyssey-battle.json');
const root=path.resolve(__dirname,'..');

test('synthetic Siege has independent landscape and back faces without changing set data',()=>{
 const original=JSON.stringify(fixture),pair=T.split(fixture);
 assert.equal(pair.front.layout,'battle');
 assert.equal(frameFamily(pair.front),'battle');
 assert.equal(pair.front.pt,'5');
 assert.equal(pair.front.rules,'When Test Siege enters, draw a card.');
 assert.equal(pair.front.artId,'FIXTURE-FRONT-ART');
 assert.equal(pair.back.layout,'standard');
 assert.equal(frameFamily(pair.back),'creature');
 assert.equal(pair.back.displayName,'Test Giant');
 assert.equal(pair.back.type,'Creature — Giant');
 assert.equal(pair.back.rules,'Trample');
 assert.equal(pair.back.pt,'4/4');
 assert.equal(pair.back.mana,'');
 for(const key of ['artId','imageUrl','credit','source','primaryArt'])assert.equal(pair.back[key],'',key+' leaked from front');
 assert.equal(T.face(fixture,'back').displayName,'Test Giant');
 assert.equal(JSON.stringify(fixture),original);
 const current=require('../public/mtgtools/odyssey/data/odyssey-data.json');
 assert.equal(current.cards.filter(card=>card.layout==='battle').length,0);
 assert.equal(current.cards.find(card=>card.id===fixture.id),undefined);
});

test('incomplete Battle back cannot silently inherit its front identity',()=>{
 for(const missing of ['name','type','rules','frame']){
  const battle={...fixture,backFace:{...fixture.backFace}};
  delete battle.backFace[missing];
  assert.equal(T.split(battle),null,missing);
 }
});

test('Battle print has a rotated landscape front and ordinary portrait back route',()=>{
 const css=fs.readFileSync(path.join(root,'public/mtgtools/odyssey/frame-system.css'),'utf8');
 const app=fs.readFileSync(path.join(root,'public/mtgtools/odyssey/app.html'),'utf8');
 assert.match(css,/\.print-sheet \.render-card\.kind-battle\s*\{[^}]*width: 88mm !important;[^}]*height: 63mm !important;[^}]*rotate\(90deg\)/);
 assert.match(app,/buildPrintStage\(entries\).*OdysseyTransformFaces\.face\(model\(n\),side\)/s);
 assert.doesNotMatch(css,/battle-back-stat/);
});
