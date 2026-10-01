'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const core=require('../public/mtgtools/odyssey/open-slot-core.js');
const manifest=require('../public/mtgtools/odyssey/data/open-slots.20261001.js');
const {FILES,assemble}=require('../scripts/build-odyssey-candidate.cjs');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'public/mtgtools/odyssey');
const numbers=[14,107,111,154,160,165,167,172,183,187,216,241,275,283,285,290,297,301];
const data=assemble(root),archive=JSON.parse(fs.readFileSync(path.join(dir,manifest.archive)));
function memory(){const values=new Map();return {getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};}
test('all 18 observed Recast marks have consistent empty placeholders and complete provenance',()=>{
 assert.equal(data.cards.length,309);assert.equal(new Set(data.cards.map(c=>c.id)).size,309);
 assert.deepEqual(data.emptySlots.slots,numbers);assert.equal(data.emptySlots.count,18);
 assert.deepEqual(archive.cards.map(c=>c.number),numbers);
 for(const n of numbers){
  const c=data.cards.find(c=>c.number===n),a=archive.cards.find(c=>c.number===n);
  assert.equal(c.slotState,'OPEN');assert.equal(c.status,'REVISE');assert.equal(c.designDisposition,'RECAST');
  for(const key of ['rules','mechanics','flavor','pt','underlyingName','treatment'])assert.equal(c[key],'',n+' '+key);
  assert.equal(c.origin,'NEW');assert.equal(c.functionalWords,0);assert.equal(c.name,'');assert.equal(c.displayName,'');assert.match(c.placeholder.label,/^Open /);
  assert.equal(c.placeholder.origin.previousName,a.placeholder.origin.previousName);
  assert(a.previousCompleteDesign.rules,n+' complete archived rules');
  assert.deepEqual(c.placeholder.origin.previousDesign.rules,a.previousCompleteDesign.rules);
  assert(c.placeholder.fill.role&&c.placeholder.fill.direction&&c.placeholder.fill.basis);
  for(const key of ['number','id','color','rarity','mana','mv','layout','primaryArt'])assert.deepEqual(c[key],a.currentBeforeNormalization[key],n+' '+key);
 }
});
test('normalization preserves every other current design and is idempotent',()=>{
 const sandbox={window:{},structuredClone};vm.createContext(sandbox);
 for(const file of FILES.slice(0,FILES.indexOf('open-slot-core.js')))vm.runInContext(fs.readFileSync(path.join(dir,file),'utf8'),sandbox);
 const before=JSON.parse(JSON.stringify(sandbox.window.ODYSSEY_DATA));
 const normalized=structuredClone(before);core.apply(normalized,manifest);
 for(const c of normalized.cards.filter(c=>!numbers.includes(c.number)))assert.deepEqual(c,before.cards.find(x=>x.id===c.id),c.id);
 const copy=structuredClone(normalized);core.apply(copy,manifest);assert.deepEqual(copy,normalized);
});
test('reclaimed duplicate slots refer to their surviving designs and drop obsolete reprint identities',()=>{
 const hound=data.cards.find(c=>c.number===111),land=data.cards.find(c=>c.number===187);
 assert.deepEqual(hound.placeholder.origin.absorbedBy,[9]);assert.equal(hound.type,'Creature');
 assert.deepEqual(land.placeholder.origin.absorbedBy,[189]);assert.equal(land.underlyingName,'');
 assert.equal(land.placeholder.origin.previousDesign.underlyingName,'Uncharted Haven');
 assert.match(hound.story,/Open household/);assert.match(land.placeholder.fill.avoid.join(' '),/dual-land cycle/);
});
test('audits catch Recast names and blank rules while respecting intrinsic basic lands',()=>{
 const example=n=>({id:'test-'+n,number:n,name:'Test',displayName:'Test',type:'Enchantment',rules:'',color:'U',rarity:'C'});
 const d={cards:[example(1),{...example(2),name:'Recast — unknown',rules:'Draw a card.'},{...example(3),rules:'Draw a card.',confidence:0,confidenceExplicit:true},{...example(4),type:'Basic Land — Island'}]};
 core.apply(d,{revision:'test',entries:{}});assert.deepEqual(d.emptySlots.slots,[1,2,3]);assert(!d.cards[3].placeholder);
});
test('old browser edits are archived before clearing, art placement survives, and new drafts survive reload',()=>{
 const storage=memory(),overrides={14:{displayName:'Old storm',rules:'Old rules',pt:'3/3',artId:'ART-044',zoom:2,focusX:8},1:{rules:'Keep this edit'}};
 assert(core.migrateOverrides(data,overrides,storage,'overrides').changed);
 assert.deepEqual(overrides[14],{artId:'ART-044',zoom:2,focusX:8});assert.equal(overrides[1].rules,'Keep this edit');
 const history=JSON.parse(storage.getItem(core.archiveKey(data.datasetVersion,manifest.revision)));
 assert.equal(history.cards[14].overrides.rules,'Old rules');
 overrides[14].rules='Replacement rules';assert(!core.migrateOverrides(data,overrides,storage,'overrides').changed);
 assert.equal(overrides[14].rules,'Replacement rules');
});
test('failed archival never erases browser designs',()=>{
 const overrides={14:{rules:'Unarchived work',zoom:2}},storage={getItem:()=>null,setItem:()=>{throw Error('Quota');}};
 assert(core.migrateOverrides(data,overrides,storage,'overrides').blocked);assert.equal(overrides[14].rules,'Unarchived work');
});
test('shared stale edits cannot revive old rules, but new replacement drafts can sync',()=>{
 const c=data.cards.find(c=>c.number===107),storage=memory(),record={updatedAt:'old',changes:{rules:'Defender',displayName:'Old wall',zoom:2}};
 assert.deepEqual(core.remoteChanges(record,c,storage,data.datasetVersion),{zoom:2});
 assert(JSON.parse(storage.getItem(core.archiveKey(data.datasetVersion,manifest.revision))).remote['ODY-107|old']);
 record.changes={rules:'New wall',changeStatus:manifest.revision,zoom:2};
 assert.deepEqual(core.remoteChanges(record,c,storage,data.datasetVersion),record.changes);
 assert.equal(core.viewModel({...c,rules:'New wall'}).slotState,'DRAFT');assert.equal(core.viewModel({...c,rules:''}).slotState,'OPEN');
});
test('all placeholder nameplates are blank and use the Godzilla subtitle for the previous identity',()=>{
 const app=fs.readFileSync(path.join(dir,'app.html'),'utf8');
 const renderer=app.split('\n').find(line=>line.startsWith('function cardInnerHTML('));
 const published=fs.readFileSync(path.join(dir,'public-renderer.generated.js'),'utf8');
 assert(published.includes(renderer),'public renderer uses the exact Studio markup');
 const sandbox={CARDS:data.cards,artMetaFor:()=>null,splitSpecial:m=>({main:m.rules}),isLegendaryCard:()=>false,legendaryTitleHTML:()=>'',visibleArtCredit:()=>'',effectiveCandidateIds:()=>[],imageForArt:()=>'',manaHTML:()=>'',setSymbolHTML:()=>'',formatRulesText:x=>x||'',reminderHTMLFor:()=>'',playtestRemindersFor:()=>[],esc:x=>String(x||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))};
 vm.createContext(sandbox);vm.runInContext(renderer,sandbox);
 for(const n of numbers){const c=data.cards.find(c=>c.number===n),html=sandbox.cardInnerHTML(c);
  assert(html.includes('<div class="name"></div>'),n+' blank nameplate');
  assert(html.includes('Previously was: '+sandbox.esc(c.placeholder.origin.previousName)),n+' previous name');
  assert(!html.includes('underlying card:'),n+' no misleading reprint label');
 }
 const c=data.cards.find(c=>c.number===107),draft=core.viewModel({...c,displayName:'A New Wall',rules:'Defender'});
 const html=sandbox.cardInnerHTML(draft);assert(html.includes('A New Wall'));assert(!html.includes('Previously was:'));assert(!html.includes('underlying card:'));
});
