'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {basicLandMana,isFullArtBasic,frameFamily,frameSummary}=require('../public/mtgtools/odyssey/frame-system.js');
const types={Plains:'W',Island:'U',Swamp:'B',Mountain:'R',Forest:'G'};
for(const [name,mana] of Object.entries(types)) {
  test(`${name}: type-based mana, optional frame, normal reminder`,()=>{
    const m={name,displayName:name,type:`Basic Land — ${name}`,rules:`({T}: Add {${mana}}.)`,layout:'standard',frame:'L'};
    assert.equal(basicLandMana(m),mana);assert.equal(frameFamily(m),'land');
    assert.equal(isFullArtBasic(m),false);
    assert.equal(isFullArtBasic({...m,frameStyle:'standard'}),false);
    assert.equal(isFullArtBasic({...m,frameStyle:'full-art'}),true);
    assert.match(frameSummary({...m,frameStyle:'full-art'}),/FF basic land/);
    assert.equal(basicLandMana({...m,name:'Landscape alias',displayName:'Ithaca',rules:''}),mana);
    assert.equal(basicLandMana({...m,type:`Snow Basic Land — ${name}`}),mana);
  });
}
test('Wastes uses a colorless medallion; unknown or multiple land subtypes are not guessed',()=>{
  assert.equal(basicLandMana({name:'Wastes',type:'Basic Land',rules:'{T}: Add {C}.'}),'C');
  assert.equal(basicLandMana({name:'Unknown',type:'Basic Land',rules:''}),null);
  assert.equal(basicLandMana({type:'Basic Land — Plains Island',rules:''}),null);
});
test('nonbasic lands, scry temples and named spells always keep their rules',()=>{
  for(const type of ['Land','Land — Plains','Legendary Land — Forest','Creature — Island','Artifact']) {
    const m={name:'Plains',type,rules:'',frameStyle:'full-art'};
    assert.equal(basicLandMana(m),null);assert.equal(isFullArtBasic(m),false);
  }
  assert.equal(isFullArtBasic({type:'Land',rules:'This land enters tapped. When it enters, scry 1.',frameStyle:'full-art'}),false);
});
test('custom functional text is never silently hidden',()=>{
  for(const rules of ['{T}: Add {W}. You gain 1 life.','{T}: Add {U}.','Sacrifice this land: Draw a card.'])
    assert.equal(basicLandMana({type:'Basic Land — Plains',rules}),null);
  assert.equal(basicLandMana({type:'Basic Land Creature — Plains',rules:''}),null);
  assert.equal(basicLandMana({type:'Basic Land — Plains',layout:'transform',rules:''}),null);
});
test('flavour is retained in the model when opting into the no-text-box treatment',()=>{
  const m={type:'Basic Land — Forest',rules:'{T}: Add {G}.',flavor:'Home at last.',frameStyle:'full-art'};
  const before=JSON.stringify(m);assert.equal(isFullArtBasic(m),true);assert.equal(JSON.stringify(m),before);
});
test('the public renderer contains the same basic-land helpers and CSS as Studio',()=>{
  const generated=fs.readFileSync('public/mtgtools/odyssey/public-renderer.generated.js','utf8');
  for(const name of ['basicLandMana','isFullArtBasic','decorateBasicLand'])assert.ok(generated.includes('function '+name+'('),name);
  assert.ok(generated.includes('basic-land-full-art'));
  const loader=fs.readFileSync('public/mtgtools/odyssey/index.html','utf8');
  assert.match(loader,/frame-system\.js\?v=20260929-full-art-basics/);
  assert.match(loader,/frame-system\.css\?v=20260929-full-art-basics/);
});
