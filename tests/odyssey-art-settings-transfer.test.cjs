const test = require('node:test');
const assert = require('node:assert/strict');
const A = require('../public/mtgtools/odyssey/art-settings-transfer.js');
const clone = x => JSON.parse(JSON.stringify(x));
const art = id => ({id, imageUrl:`https://example.test/${id}.jpg`,credit:`Artist ${id}`,source:`https://example.test/${id}`});
const card = (id,number,extra={}) => ({id,number,name:id,layout:'standard',primaryArt:'ART-001',rules:'Original rules',type:'Creature',...extra});
const data = cards => ({cards,artworks:[art('ART-001'),art('ART-002')],coverage:[]});
const baseline = data([card('ODY-001',1),card('ODY-002',2)]);
const candidate = {...data([card('ODY-001',1,{name:'Renamed',rules:'Manifest fate',type:'Enchantment'}),card('ODY-002',2)]),datasetVersion:'analysis-candidate-v1'};
const input = extra => ({baseline:clone(baseline),candidate:clone(candidate),...extra});
const view = (r,n=1,d=candidate) => A.effective(d.cards.find(c=>c.number===n),A.indexDataset(d),r.overrides,r.crops);
class Store {
  constructor(values={}) {this.values=new Map(Object.entries(values).map(([k,v])=>[k,JSON.stringify(v)]));}
  getItem(k){return this.values.get(k)??null;}
  setItem(k,v){this.values.set(k,String(v));}
  removeItem(k){this.values.delete(k);}
}
test('stable ID match survives rename and renumbering',()=>{
  const c=clone(candidate);c.cards[0].number=17;
  const r=A.transfer(input({candidate:c,sourceOverrides:{1:{artId:'ART-002',zoom:2.7,focusX:-18,focusY:135,fit:'contain'}}}));
  assert.equal(view(r,17,c).artId,'ART-002');assert.equal(view(r,17,c).zoom,2.7);assert.equal(view(r,17,c).focusX,-18);assert.equal(view(r,17,c).focusY,135);
});
test('copy includes original default art choice',()=>{
  const c=clone(candidate);c.cards[0].primaryArt='ART-002';
  const r=A.transfer(input({candidate:c}));assert.equal(view(r,1,c).artId,'ART-001');
});
test('shared profiles remain shared instead of card-specific exceptions',()=>{
  const p={'ART-001|standard|normal':{zoom:2,focusX:23,focusY:-8,fit:'cover'}};
  const r=A.transfer(input({sourceProfiles:p}));assert.equal(view(r).zoom,2);assert.equal(r.overrides[1],undefined);assert.deepEqual(r.crops,p);
});
test('card-specific crop beats source shared profile; zero pan is retained',()=>{
  const r=A.transfer(input({sourceOverrides:{1:{zoom:3,focusX:0,focusY:0}},sourceProfiles:{'ART-001|standard|normal':{zoom:2,focusX:40,focusY:50,fit:'cover'}}}));
  assert.equal(view(r).zoom,3);assert.equal(view(r).focusX,0);assert.equal(view(r).focusY,0);assert.equal(view(r,2).zoom,2);
});
test('credit, source, image URL and full-art treatment transfer',()=>{
  const values={artId:'ART-002',imageUrl:'https://example.test/custom.jpg',credit:'Custom artist',source:'https://example.test/source',frameStyle:'full-art',artHeight:'tall'};
  const r=A.transfer(input({sourceOverrides:{1:values}}));for(const [k,v] of Object.entries(values))assert.equal(view(r)[k],v);
});
test('names, rules, mana, colors, type, stats, rarity and flavor never copy',()=>{
  const r=A.transfer(input({sourceOverrides:{1:{rules:'OLD',type:'OLD',mana:'99',pt:'99/99',displayName:'OLD',frame:'R',rarity:'M',flavor:'OLD',zoom:2}},targetOverrides:{1:{rules:'candidate edit'}}}));
  assert.equal(r.overrides[1].rules,'candidate edit');for(const k of ['type','mana','pt','displayName','frame','rarity','flavor'])assert.equal(r.overrides[1][k],undefined);
});
test('new Saga keeps its structure and inherits original crop',()=>{
  const c=clone(candidate);c.cards[0].layout='saga';
  const r=A.transfer(input({candidate:c,sourceProfiles:{'ART-001|standard|normal':{zoom:2.2,focusX:10,focusY:20,fit:'cover'}}}));
  assert.equal(view(r,1,c).layout,'saga');assert.equal(view(r,1,c).zoom,2.2);assert.equal(r.report.layoutReview,1);assert.equal(r.overrides[1].layout,undefined);
});
test('explicit candidate layout is unchanged',()=>{
  const r=A.transfer(input({sourceOverrides:{1:{layout:'battle',zoom:2}},targetOverrides:{1:{layout:'prepare'}}}));assert.equal(view(r).layout,'prepare');assert.equal(view(r).zoom,2);
});
test('existing candidate art wins as a complete image/crop bundle',()=>{
  const r=A.transfer(input({sourceOverrides:{1:{artId:'ART-002',zoom:4}},targetOverrides:{1:{focusX:43}}}));assert.equal(view(r).artId,'ART-001');assert.equal(view(r).zoom,1);assert.equal(view(r).focusX,43);assert.equal(r.report.kept,1);
});
test('new shared profiles cannot indirectly alter protected cards',()=>{
  const r=A.transfer(input({targetOverrides:{1:{credit:'Candidate credit'}},sourceProfiles:{'ART-001|standard|normal':{zoom:2,focusX:15,focusY:25,fit:'cover'}}}));assert.equal(view(r).zoom,1);assert.equal(view(r).focusX,0);assert.equal(view(r).credit,'Candidate credit');assert.equal(view(r,2).zoom,2);
});
test('existing candidate shared profiles are kept',()=>{
  const p={'ART-001|standard|normal':{zoom:3,focusX:12,focusY:9,fit:'contain'}};
  const r=A.transfer(input({sourceProfiles:{'ART-001|standard|normal':{zoom:2}},targetProfiles:p}));assert.deepEqual(r.crops,p);assert.equal(view(r).zoom,3);assert.equal(r.report.kept,2);
});
test('re-copy updates inherited settings but keeps intervening candidate edits',()=>{
  const a=A.transfer(input({sourceOverrides:{1:{zoom:2},2:{zoom:2}}}));a.overrides[2].zoom=9;
  const r=A.transfer(input({sourceOverrides:{1:{zoom:3},2:{zoom:3}},targetOverrides:a.overrides,targetProfiles:a.crops,meta:a.meta}));assert.equal(view(r).zoom,3);assert.equal(view(r,2).zoom,9);assert.equal(r.report.kept,1);
});
test('candidate shared-profile edits are protected on re-copy',()=>{
  const p={'ART-001|standard|normal':{zoom:2,focusX:0,focusY:0,fit:'cover'}};
  const a=A.transfer(input({sourceProfiles:p}));a.crops['ART-001|standard|normal'].zoom=7;
  const r=A.transfer(input({sourceProfiles:p,targetOverrides:a.overrides,targetProfiles:a.crops,meta:a.meta}));assert.equal(view(r).zoom,7);assert.equal(r.report.kept,2);
});
test('unmatched and duplicate IDs skip rather than guessing from names',()=>{
  const c=clone(candidate);c.cards[0].id='NEW';c.cards[0].name='ODY-001';
  let r=A.transfer(input({candidate:c,sourceOverrides:{1:{zoom:2}}}));assert.equal(view(r,1,c).zoom,1);assert.equal(r.report.unmatched,1);
  const b=clone(baseline);b.cards.push({...b.cards[0],number:3});r=A.transfer(input({baseline:b,sourceOverrides:{1:{zoom:2}}}));assert.equal(view(r).zoom,1);assert.equal(r.report.unmatched,1);
});
test('unmatched cards are not altered indirectly by copied profiles',()=>{
  const c=clone(candidate);c.cards[0].id='NEW';
  const r=A.transfer(input({candidate:c,sourceProfiles:{'ART-001|standard|normal':{zoom:3,focusX:0,focusY:0,fit:'cover'}}}));assert.equal(view(r,1,c).zoom,1);assert.equal(view(r,2,c).zoom,3);
});
test('missing artwork is skipped and reported',()=>{
  const r=A.transfer(input({sourceOverrides:{1:{artId:'ART-999',zoom:8}}}));assert.equal(view(r).artId,'ART-001');assert.equal(r.report.missingArt,1);
});
test('session-only image URLs are skipped',()=>{
  const r=A.transfer(input({sourceOverrides:{1:{imageUrl:'blob:expired'}}}));assert.equal(r.report.transient,1);assert.match(view(r).imageUrl,/https:/);
});
test('explicitly unassigned artwork and negative pan survive',()=>{
  const r=A.transfer(input({sourceOverrides:{1:{artId:'',imageUrl:'',credit:'',source:'',zoom:1,focusX:0,focusY:-100,fit:'contain'}}}));assert.equal(view(r).artId,'');assert.equal(view(r).imageUrl,'');assert.equal(view(r).focusX,0);assert.equal(view(r).focusY,-100);
});
test('source datasets and settings are immutable',()=>{
  const i=input({sourceOverrides:{1:{zoom:2}},sourceProfiles:{'ART-001|standard|normal':{zoom:3}}});const before=JSON.stringify(i);A.transfer(i);assert.equal(JSON.stringify(i),before);
});
test('fresh switch isolates candidate state and does not copy original rules or approvals',()=>{
  const s=new Store({[A.BASE.overrides]:{1:{zoom:2,rules:'Original edit'}},[A.BASE.review]:{1:{state:'approved'}}});const original=A.prepare(baseline,baseline,s);const raw=s.getItem(A.BASE.overrides);const state=A.prepare(baseline,candidate,s);
  assert.equal(original.keys.overrides,A.BASE.overrides);assert.notEqual(state.keys.overrides,A.BASE.overrides);const o=JSON.parse(s.getItem(state.keys.overrides));assert.equal(o[1].zoom,2);assert.equal(o[1].rules,undefined);assert.equal(s.getItem(A.BASE.overrides),raw);assert.deepEqual(JSON.parse(s.getItem(state.keys.review)),{});assert.ok(s.getItem('odyssey-art-transfer-v1-legacy-backup'));
});
test('first opening on a legacy candidate keeps already visible edits',()=>{
  const s=new Store({[A.BASE.overrides]:{1:{zoom:4,rules:'Existing candidate edit'}}});const state=A.prepare(baseline,candidate,s);const o=JSON.parse(s.getItem(state.keys.overrides));assert.equal(o[1].zoom,4);assert.equal(o[1].rules,'Existing candidate edit');
});
test('refresh never repeats initial migration over candidate work',()=>{
  const s=new Store({[A.BASE.overrides]:{1:{zoom:2}}});A.prepare(baseline,baseline,s);let state=A.prepare(baseline,candidate,s);s.setItem(state.keys.overrides,JSON.stringify({1:{zoom:10}}));state=A.prepare(baseline,candidate,s);assert.equal(JSON.parse(s.getItem(state.keys.overrides))[1].zoom,10);
});
test('candidate saves leave original card and crop stores unchanged',()=>{
  const s=new Store({[A.BASE.overrides]:{1:{zoom:2}},[A.BASE.crops]:{'ART-001|standard|normal':{zoom:2}}});A.prepare(baseline,baseline,s);const state=A.prepare(baseline,candidate,s);s.setItem(state.keys.overrides,'{"1":{"zoom":5}}');s.setItem(state.keys.crops,'{}');assert.equal(JSON.parse(s.getItem(A.BASE.overrides))[1].zoom,2);assert.equal(JSON.parse(s.getItem(A.BASE.crops))['ART-001|standard|normal'].zoom,2);
});
test('manual copy updates art without touching candidate gameplay or source data',()=>{
  const s=new Store({[A.BASE.overrides]:{1:{zoom:2}}});A.prepare(baseline,baseline,s);const state=A.prepare(baseline,candidate,s);const o=JSON.parse(s.getItem(state.keys.overrides));o[1].rules='Candidate rule';s.setItem(state.keys.overrides,JSON.stringify(o));s.setItem(A.BASE.overrides,JSON.stringify({1:{zoom:3,rules:'Do not copy'}}));const r=A.copyAgain(state);assert.equal(r.overrides[1].zoom,3);assert.equal(r.overrides[1].rules,'Candidate rule');assert.equal(JSON.parse(s.getItem(A.BASE.overrides))[1].rules,'Do not copy');
});
test('quota failure rolls back without damaging original settings',()=>{
  const s=new Store({[A.BASE.overrides]:{1:{zoom:2}}});A.prepare(baseline,baseline,s);const before=[...s.values];const set=s.setItem.bind(s);let failed=false;s.setItem=(k,v)=>{if(k.includes('::analysis-candidate-v1')&&!k.includes('backup')&&!failed){failed=true;throw new Error('Quota exceeded');}set(k,v);};assert.throws(()=>A.prepare(baseline,candidate,s),/Quota/);assert.deepEqual([...s.values],before);
});
test('corrupt saved data is not silently overwritten',()=>{
  const s=new Store();s.setItem(A.BASE.overrides,'broken');assert.throws(()=>A.prepare(baseline,candidate,s));assert.equal(s.getItem(A.BASE.overrides),'broken');
});
