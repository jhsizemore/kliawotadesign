/* Open design slots: provenance and briefs are editorial metadata, never rules. */
(function(root){
'use strict';
const SCHEMA='odyssey-open-slot/v1';
const ART_KEYS=new Set(['artId','imageUrl','credit','source','fit','zoom','focusX','focusY','artHeight','frameStyle']);
const clone=value=>JSON.parse(JSON.stringify(value));
const text=value=>String(value==null?'':value).trim();
function reasons(card){
 const out=[];
 if(/\bRECAST\b/i.test([card.status,card.designDisposition,card.slotState,card.workState].join(' ')))out.push('recast-status');
 if(/\brecast\b/i.test([card.name,card.displayName].join(' ')))out.push('recast-name');
 if(card.confidenceExplicit===true&&Number(card.confidence)===0)out.push('explicit-recast-confidence');
 // Basic lands have an intrinsic mana ability even when their rules box is blank.
 if(!text(card.rules)&&!(/\bBasic\b.*\bLand\b/i.test(card.type)||card.rulesTextNotRequired===true))out.push('empty-rules');
 return out;
}
function previousDesign(card){
 const keys=['id','number','name','displayName','underlyingName','mana','mv','color','frame','type','rarity','layout','pt','rules','mechanics','flavor','origin','treatment','archetypes','story','storyTarget','cycleIds','primaryArt','rulesSource'];
 return Object.fromEntries(keys.filter(k=>card[k]!==undefined).map(k=>[k,clone(card[k])]));
}
function fallback(card,why,revision){
 return {schema:SCHEMA,revision,matchReasons:why,origin:{previousName:card.displayName||card.name,reason:why.includes('empty-rules')?'Rules text is empty; prior identity and structural target retained for review.':'Marked Recast; prior design retained for reference.',previousDesign:previousDesign(card)},
 target:{color:card.color,rarity:card.rarity,mana:card.mana,mv:card.mv,type:card.type,layout:card.layout,archetypes:card.archetypes,story:card.storyTarget||card.story,cycleIds:card.cycleIds||[]},
 fill:{priority:'review',role:'Unassigned role',direction:'Review this slot against the current set before choosing a new design.',basis:'Structural target retained; role has not been inferred.',avoid:[]}};
}
function apply(data,manifest){
 if(!data||!Array.isArray(data.cards))return data;
 const revision=manifest?.revision||'open-slots-v1',entries=manifest?.entries||{};
 for(const card of data.cards){
  const entry=entries[card.number],why=reasons(card);
  if(!entry&&!why.length&&!card.placeholder)continue;
  if(card.slotState==='FILLED'&&text(card.rules))continue;
  const slot=clone(card.placeholder||entry||fallback(card,why,revision));
  slot.schema=SCHEMA;slot.revision=revision;
  if(!slot.origin.previousDesign)slot.origin.previousDesign=previousDesign(card);
  const label=slot.label||`Open ${slot.target.color||card.color||'flexible'} ${({C:'common',U:'uncommon',R:'rare',M:'mythic'})[slot.target.rarity||card.rarity]||'slot'} · ${slot.fill.role}`;
  slot.label=label;
  Object.assign(card,{name:'',displayName:'',underlyingName:'',treatment:'',origin:'NEW',originFull:'New',
   rules:'',mechanics:'',pt:'',flavor:'',status:'REVISE',designDisposition:'RECAST',slotState:'OPEN',placeholder:slot,
   functionalWords:0,flavorMatchScore:null,flavorMatchRationale:slot.origin.reason,artReviewRequired:true,
   rulesSource:'Open slot · '+slot.origin.previousName});
  // A reclaimed duplicate keeps its colour/rarity budget, without reserving the duplicate identity again.
  if(slot.target.type)card.type=slot.target.type;
  if(slot.target.story){card.story=card.storyTarget=slot.target.story;card.flavorStoryElement=slot.target.story;}
  if(slot.target.cycleIds)card.cycleIds=clone(slot.target.cycleIds);
  if(!text(card.changeStatus).includes(revision))card.changeStatus=[card.changeStatus,revision].filter(Boolean).join(' · ');
 }
 for(const row of data.coverage||[]){const card=data.cards.find(c=>Number(c.number)===Number(row.number));if(card?.slotState==='OPEN')row.name=card.placeholder.label;}
 const slots=data.cards.filter(c=>c.slotState==='OPEN');
 data.emptySlots={revision,count:slots.length,slots:slots.map(c=>c.number),reason:'Open design placeholders; complete earlier designs and fill briefs are preserved.'};
 data.openSlots={schema:'odyssey-open-slots/v1',revision,count:slots.length,numbers:slots.map(c=>c.number),archive:manifest?.archive||'',roles:slots.map(c=>({number:c.number,previousName:c.placeholder.origin.previousName,...c.placeholder.fill}))};
 data.candidate=Object.assign({},data.candidate,{openSlotRevision:revision,openSlotArchive:manifest?.archive||''});
 return data;
}
function viewModel(card){
 if(card.placeholder)card.slotState=text(card.rules)||(/\bCreature\b/.test(card.type)&&text(card.pt))?'DRAFT':'OPEN';
 return card;
}
function archiveKey(version,revision){return 'odyssey-open-slot-history:'+version+':'+revision;}
function artOnly(changes){return Object.fromEntries(Object.entries(changes||{}).filter(([key])=>ART_KEYS.has(key)));}
function migrateOverrides(data,overrides,storage,overridesKey){
 const revision=data.openSlots?.revision;if(!revision)return {changed:false};
 const key=archiveKey(data.datasetVersion,revision);let history;
 try{history=JSON.parse(storage.getItem(key)||'null')||{schema:'odyssey-open-slot-history/v1',cards:{},remote:{}};}catch(_){return {changed:false,blocked:true};}
 const next=clone(overrides);let changed=false;
 for(const card of data.cards){
  if(!card.placeholder)continue;
  const n=card.number,prior=next[n]||{},saved=history.cards[n];
  // Preserve replacement designs written after this migration, including a second load.
  if(saved&&JSON.stringify(prior)!==JSON.stringify(saved.overrides))continue;
  const clean=artOnly(prior);
  if(JSON.stringify(clean)===JSON.stringify(prior))continue;
  history.cards[n]={cardId:card.id,previousName:card.placeholder.origin.previousName,overrides:clone(prior),archivedAt:new Date().toISOString()};
  next[n]=clean;if(!Object.keys(clean).length)delete next[n];changed=true;
 }
 if(!changed)return {changed:false};
 // Archive successfully before replacing any browser-authored design.
 try{storage.setItem(key,JSON.stringify(history));storage.setItem(overridesKey,JSON.stringify(next));}catch(_){return {changed:false,blocked:true};}
 for(const key of Object.keys(overrides))delete overrides[key];Object.assign(overrides,next);
 return {changed:true};
}
function remoteChanges(record,card,storage,version){
 const changes=record.changes||{},revision=card.placeholder?.revision;
 if(!revision||text(changes.changeStatus).includes(revision))return changes;
 const key=archiveKey(version,revision);
 try{
  const history=JSON.parse(storage.getItem(key)||'null')||{schema:'odyssey-open-slot-history/v1',cards:{},remote:{}};
  history.remote=history.remote||{};const id=card.id+'|'+(record.updatedAt||'unversioned');
  if(!history.remote[id]){history.remote[id]=clone(record);storage.setItem(key,JSON.stringify(history));}
 }catch(_){/* The shared record itself still preserves the earlier design. */}
 return artOnly(changes);
}
const api={SCHEMA,ART_KEYS,reasons,previousDesign,apply,viewModel,artOnly,archiveKey,migrateOverrides,remoteChanges};
root.OdysseyOpenSlots=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
