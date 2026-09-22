'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const dir=path.resolve(__dirname,'../public/mtgtools/odyssey');
const data=JSON.parse(fs.readFileSync(path.join(dir,'data/odyssey-data.json'),'utf8'));
const refs=JSON.parse(fs.readFileSync(path.join(dir,'data/card-references.json'),'utf8'));
const policy=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../scripts/odyssey-reference-policy.json'),'utf8'));
const current=data.cards,roles=r=>r.roles||[r.role];
const source=fs.readFileSync(path.join(dir,'card-reference-browser.js'),'utf8');
function browser(){
 const cards=structuredClone(current),stored={};const sandbox={CARDS:cards,ODYSSEY_CARD_REFERENCES:structuredClone(refs),baseCard:n=>cards[n-1],model:n=>cards[n-1],localStorage:{getItem:k=>stored[k]||null,setItem:(k,v)=>stored[k]=v}};
 vm.createContext(sandbox);vm.runInContext(source,sandbox);return{sandbox,cards,api:sandbox.OdysseyReferenceBrowser};
}
test('every current card has explicit references matching its exact rules, mana, stats and identity',()=>{
 assert.equal(refs.policyRevision,'reference-quality-v3');assert.equal(refs.totalCards,current.length);assert.equal(Object.keys(refs.cards).length,current.length);
 for(const c of current){const e=refs.cards[c.id];assert.equal(e.name,c.name);assert.equal(e.number,c.number);assert.ok(e.references.length>=1&&e.references.length<=10,c.id);
  for(const [k,v] of Object.entries(e.sourceCard))assert.deepEqual(v,c[k]??'',c.id+' '+k);
  if(!/Basic Land/.test(c.type)){
   const found=new Set(e.references.flatMap(roles));assert.ok(found.has('rate-best'),c.id);assert.ok(found.has('rate-normal'),c.id);
   assert.equal(policy.cards[c.id].source.rules,c.rules);assert.ok(policy.cards[c.id].comparison.length>50);
  }
 }
});
test('flicker, combat tricks, reanimation and sweepers have the intended effect comparisons',()=>{
 for(const [id,names] of Object.entries({'ODY-005':['Ephemerate','Cloudshift'],'ODY-007':['Refuse to Yield',"Veteran's Reflexes"],'ODY-242':['Brilliant Restoration','Unfinished Business'],'ODY-246':['Blasphemous Act','Hour of Devastation']})){
  const list=refs.cards[id].references;for(const name of names)assert.ok(list.some(r=>r.card.name===name),id+' '+name);
 }
 assert.ok(!Object.values(refs.cards).some(e=>e.references.some(r=>r.card.name==='TL;DR')));
});
test('battlefield text is never mistaken for Battle-card technology',()=>{
 for(const e of Object.values(refs.cards))for(const r of e.references){if(roles(r).includes('tech'))assert.ok(!r.card.name.startsWith('Invasion of Zendikar'),e.id);}
});
test('quest cards retain both modern and original quest technology alongside other mechanics',()=>{
 for(const c of current.filter(c=>/quest counter/i.test(c.rules))){const list=refs.cards[c.id].references.filter(r=>roles(r).includes('tech'));
  assert.ok(list.some(r=>r.card.name==="Last Light of Durin's Day"),c.id);assert.ok(list.some(r=>/^Quest for /.test(r.card.name)),c.id);
 }
 const keep=refs.cards['ODY-004'].references;assert.ok(keep.some(r=>r.card.name==='Eidolon of Blossoms'));
 for(const n of [17,93,166,280,282]){const list=refs.cards['ODY-'+String(n).padStart(3,'0')].references;assert.ok(list.some(r=>roles(r).includes('tech')&&/^Ordeal of /.test(r.card.name)));assert.ok(list.some(r=>roles(r).includes('tech')&&/Survival/.test(r.card.oracleText)));}
});
test('all Adventure lands have actual land/spell precedents, including enchantment land Aeaea',()=>{
 for(const n of [188,189,190,191,192]){const list=refs.cards['ODY-'+n].references;const tech=list.find(r=>roles(r).includes('tech')&&r.card.set==='fin'&&r.card.layout==='adventure');assert.ok(tech,n);
  assert.equal(tech.card.manaCost,'');assert.ok(tech.card.faces[0].type.includes('Land'));assert.ok(tech.card.faces[1].manaCost);assert.ok(tech.card.faces[1].type.includes('Adventure'));
 }
});
test('all distinct selected cards have released printing facts, imagery, Oracle text and role-specific explanations',()=>{
 for(const e of Object.values(refs.cards)){const seen=new Set();for(const r of e.references){const c=r.card,key=c.oracleId||c.id;
  assert.ok(!seen.has(key),e.id+' duplicate '+c.name);seen.add(key);assert.equal(r.selection,'editorial');assert.ok(r.notes.length);
  assert.match(c.scryfallUri,/^https:\/\/scryfall.com\/card\//);assert.match(c.images.small||c.images.normal,/^https:\/\/cards.scryfall.io\//);assert.ok(c.releasedAt<=refs.scryfallBulk.releasedOnOrBefore);
  assert.equal(typeof c.oracleText,'string');for(const note of r.notes)assert.ok(note.text.length>25,e.id+' '+c.name);
 }}
});
test('every rare or mythic has specific build-around exploration, not generic shared-vocabulary filler',()=>{
 for(const c of current.filter(c=>['R','M'].includes(c.rarity))){const p=policy.cards[c.id];assert.ok(p.spins?.length>=2,c.id);
  const list=refs.cards[c.id].references.filter(r=>roles(r).includes('buildaround'));assert.ok(list.length>=2,c.id);
  assert.ok(list.every(r=>r.notes.some(n=>n.role==='buildaround'&&n.text.length>70)),c.id);
 }
});
test('browser freshness rejects edited rules/stats but ignores artwork crops',()=>{
 const {cards,api}=browser();assert.ok(api.sourceMatches(5));cards[4].rules='Draw three cards.';assert.equal(api.sourceMatches(5),false);
 cards[4].rules=current[4].rules;assert.ok(api.sourceMatches(5));cards[4].zoom=1.5;assert.ok(api.sourceMatches(5));cards[1].pt='9/9';assert.equal(api.sourceMatches(2),false);
});
test('review signatures change with rationale and design, but not an unrelated bulk timestamp',()=>{
 const {sandbox,api}=browser();const before=api.signature(5);sandbox.ODYSSEY_CARD_REFERENCES.scryfallBulk.updatedAt='2099';assert.equal(api.signature(5),before);
 sandbox.ODYSSEY_CARD_REFERENCES.cards['ODY-005'].references[0].notes[0].text='Reassess this comparison';assert.notEqual(api.signature(5),before);
});
test('browser shows all roles and separate spell faces with real line breaks',()=>{
 const {api}=browser();const r=refs.cards['ODY-200'].references.find(r=>r.card.layout==='prepare');const html=api.tile(r,false);
 for(const f of r.card.faces)assert.ok(html.includes(f.name));assert.ok(html.includes('<br>'));
 const multiple=Object.values(refs.cards).flatMap(e=>e.references).find(r=>roles(r).length>1);const rendered=api.tile(multiple,false);assert.ok(rendered.includes('od-ref-badges'));assert.equal((rendered.match(/class='od-ref-role /g)||[]).length,roles(multiple).length);
});
test('versioned Studio assets and release metadata match the exact reference payload',()=>{
 const app=fs.readFileSync(path.join(dir,'app.html'),'utf8'),index=fs.readFileSync(path.join(dir,'index.html'),'utf8');
 const dataKey=app.match(/card-references.js\?v=(ref3-[a-f0-9]+)/)?.[1];assert.ok(dataKey);assert.ok(app.includes('card-reference-browser.js?v='+dataKey));assert.ok(index.includes('app.html?v='+dataKey));assert.ok(source.includes('refs.slice(0,3)'));
 const release=JSON.parse(fs.readFileSync(path.join(dir,'data/release.json'),'utf8'));assert.equal(release.referenceCards.policyRevision,refs.policyRevision);assert.equal(release.referenceCards.cards,current.length);assert.equal(release.referenceCards.totalReferences,Object.values(refs.cards).reduce((n,e)=>n+e.references.length,0));
});
