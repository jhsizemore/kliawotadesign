'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const T=require('../public/mtgtools/odyssey/transform-faces.js');
const root=path.resolve(__dirname,'..');
const card=require('../public/mtgtools/odyssey/data/odyssey-data.json').cards.find(c=>c.number===229);

test('Troy has two complete independent printable faces and retains source data',()=>{
 const original=JSON.stringify(card),pair=T.split(card);
 assert.equal(pair.front.displayName,'The Siege of Troy');
 assert.equal(pair.front.type,'Enchantment — Saga');
 assert.equal(pair.front.layout,'saga');
 assert.match(pair.front.rules,/^I —/);
 assert.match(pair.front.rules,/III — Exile this Saga/);
 assert.doesNotMatch(pair.front.rules,/Wooden Horse attacks|\/\/BACK\/\//);
 assert.equal(pair.back.displayName,'The Wooden Horse');
 assert.equal(pair.back.type,'Legendary Artifact — Vehicle');
 assert.equal(pair.back.layout,'vehicle');
 assert.equal(pair.back.frame,'C');
 assert.equal(pair.back.mana,'');
 assert.equal(pair.back.pt,'5/5');
 assert.match(pair.back.rules,/Whenever The Wooden Horse attacks/);
 assert.match(pair.back.rules,/Crew 3/);
 assert.equal(pair.back.artId,'');
 assert.equal(pair.back.imageUrl,'');
 assert.equal(pair.back.credit,'');
 assert.equal(pair.front.artId,undefined);
 assert.equal(JSON.stringify(card),original);
});
test('back art is face-specific and cannot fall through to front art',()=>{
 const pair=T.split({...card,artId:'ART-053',imageUrl:'front.jpg',credit:'Front artist',backFace:{artId:'ART-BACK',imageUrl:'back.jpg',credit:'Back artist',zoom:1.4,focusX:-12}});
 assert.equal(pair.front.artId,'ART-053');
 assert.equal(pair.back.artId,'ART-BACK');
 assert.equal(pair.back.imageUrl,'back.jpg');
 assert.equal(pair.back.credit,'Back artist');
 assert.equal(pair.back.zoom,1.4);
 assert.equal(pair.back.focusX,-12);
});
test('non-transform cards are not split and print routes select a face explicitly',()=>{
 const ordinary={number:1,layout:'standard',rules:'Hello'};
 assert.equal(T.split(ordinary),null);
 assert.strictEqual(T.face(ordinary,'back'),ordinary);
 const app=fs.readFileSync(path.join(root,'public/mtgtools/odyssey/app.html'),'utf8');
 assert.match(app,/id="flipFace"/);
 assert.match(app,/OdysseyTransformFaces\.face\(model\(n\),side\)/);
 assert.match(app,/face:selectedTransformFace/);
 assert.match(app,/buildPrintStage\(\[\{number:selected,face:selectedTransformFace\}\]\)/);
 assert.match(app,/bindArtboxEditor\(c,m\)/);
});
