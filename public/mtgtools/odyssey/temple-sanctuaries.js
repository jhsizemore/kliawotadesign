/* Ten god-sanctuaries: five existing main-file temples, five separate candidates.
 * No rules, colour, rarity, slot, user storage, or Adventure land is changed. */
(function(root){
'use strict';
const VERSION='sanctuaries-20260929-v1';
const payload=root.ODYSSEY_TEMPLE_SANCTUARIES;
if(!payload||!Array.isArray(payload.artworks))return;
const ART_KEYS=['id','subjects','title','artist','date','period','medium','institution','objectId','rights','source','credit','matchType','heroScore','candidateCards','cropNotes','status','imageUrl','imageWidth','imageHeight','imageChecked'];
const unique=items=>[...new Set(items.flatMap(x=>Array.isArray(x)?x:String(x||'').split(/\s*[;,]\s*/)).filter(Boolean))];
const join=(...items)=>unique(items).join('; ');
const artById=new Map(payload.artworks.map(a=>[a.id,a]));
function fieldValues(d,old){
 const a=artById.get(d.primaryArt);
 const story=d.story;
 return {displayName:d.displayName,primaryArt:a.id,credit:a.credit,source:a.source,imageUrl:a.imageUrl,
   story,storyTarget:story,flavorStoryElement:story,flavorMatchRationale:d.rationale,
   narrativeEra:d.god==='Circe'?'Odyssey':'Homeric world',storySourceBand:d.sourceBand,
   storyRethemeRequired:false,artReviewRequired:true,flavorMatchScore:4,
   cycleIds:['cycle.enemy-temple-scry-lands','cycle.ten-sanctuaries','group.gods','cast.'+d.god.toLowerCase()],
   alternateArtIds:unique([old.alternateArtIds||[],old.primaryArt===a.id?[]:[old.primaryArt]]).filter(id=>id!==a.id),
   changeStatus:join(old.changeStatus,VERSION)};
}
function register(sync=root.OdysseySheetSync){
 if(!sync)return;
 const ids=new Map(sync.artRows.map((r,i)=>[r[0],i]));
 for(const a of payload.artworks){
  const idx=ids.get(a.id);
  if(idx===undefined){ids.set(a.id,sync.artRows.length);sync.artRows.push(ART_KEYS.map(k=>a[k]??''));}
  else if(sync.artRows[idx][10]!==a.source)throw new Error('Sanctuary artwork ID collision: '+a.id);
 }
 for(const d of payload.designs.filter(d=>d.number)){
  const r=sync.cardRows.find(r=>Number(r[0])===d.number);
  if(!r||r[4]!==d.pair||!String(r[10]).includes('scry 1')||!String(r[10]).includes('enters tapped'))throw new Error('Sanctuary slot changed: '+d.number);
  if(r[1]!==d.underlyingName&&r[15]!==d.underlyingName)throw new Error('Sanctuary identity changed: '+d.number);
  const p=fieldValues(d,{primaryArt:r[17],alternateArtIds:r[34],changeStatus:r[27]});
  const pairs=[[12,'story'],[14,'displayName'],[17,'primaryArt'],[18,'credit'],[19,'source'],[27,'changeStatus'],[28,'narrativeEra'],[29,'storyTarget'],[31,'storySourceBand'],[36,'flavorStoryElement'],[37,'flavorMatchScore'],[38,'flavorMatchRationale']];
  for(const [col,key] of pairs)r[col]=p[key];
  r[21]=p.cycleIds.join('; ');r[30]='NO';r[32]='YES';r[34]=p.alternateArtIds.join(', ');
  const cov=sync.coverageRows.find(r=>Number(r[0])===d.number);
  if(cov){cov[2]='SELECTED';cov[3]=d.matchLayer;cov[4]=unique([cov[4],p.primaryArt]).join(', ');cov[5]=p.primaryArt;cov[6]='YES';
   if(!String(cov[7]).includes(VERSION))cov[7]=VERSION+': '+d.displayName+' uses '+p.primaryArt+'. '+d.rationale+' Final crop remains editable.\n\nPrevious record: '+(cov[7]||'');}
 }
 sync.META.artworks=sync.artRows.length;
 sync.META.templeSanctuaries={version:VERSION,artworks:10,mainAssignments:5,reserveCandidates:5};
}
function apply(data){
 if(!data||!Array.isArray(data.cards))return data;
 const artworks=(data.artworks||[]).slice(),ids=new Map(artworks.map((a,i)=>[a.id,i]));
 for(const a of payload.artworks){const i=ids.get(a.id);if(i===undefined){ids.set(a.id,artworks.length);artworks.push({...a});}else{if(artworks[i].source!==a.source)throw new Error('Sanctuary artwork conflict: '+a.id);artworks[i]={...artworks[i],...a};}}
 const designs=new Map(payload.designs.filter(d=>d.number).map(d=>[d.number,d]));
 const cards=data.cards.map(old=>{const d=designs.get(Number(old.number));if(!d)return old;
  if(old.color!==d.pair||!String(old.rules).includes('scry 1')||!String(old.rules).includes('enters tapped'))throw new Error('Sanctuary main-card guard: '+old.number);
  return {...old,...fieldValues(d,old)};});
 const coverage=(data.coverage||[]).map(old=>{const d=designs.get(Number(old.number));if(!d)return old;
  const prefix=VERSION+': '+d.displayName+' uses '+d.primaryArt+'. '+d.rationale+' Final crop remains editable.';
  return {...old,status:'SELECTED',layer:d.matchLayer,candidateIds:unique([old.candidateIds||[],d.primaryArt]),primary:d.primaryArt,creditReady:'YES',notes:String(old.notes||'').includes(VERSION)?old.notes:prefix+'\n\nPrevious record: '+(old.notes||'')};});
 return {...data,cards,artworks,coverage,templeSanctuaries:payload.designs,
  integrity:{...data.integrity,artworks:artworks.length},templeSanctuaryImport:{version:VERSION,artworks:10,mainAssignments:5,reserveCandidates:5}};
}
function mount(){
 if(document.getElementById('openTempleSanctuaries'))return;
 const bar=document.querySelector('.top-actions');if(!bar)return;
 const a=document.createElement('a');a.id='openTempleSanctuaries';a.className='btn secondary';a.textContent='Temple cycle';a.href='temple-sanctuaries.html';a.style.textDecoration='none';bar.appendChild(a);
}
register();
if(root.OdysseySheetSync&&!root.OdysseySheetSync._templeSanctuaryApply){
 const original=root.OdysseySheetSync.apply;
 root.OdysseySheetSync.apply=data=>apply(original(data));
 root.OdysseySheetSync._templeSanctuaryApply=true;
}
if(root.ODYSSEY_DATA)root.ODYSSEY_DATA=apply(root.ODYSSEY_DATA);
root.OdysseyTempleSanctuaries={VERSION,register,apply,mount};
if(typeof module!=='undefined'&&module.exports)module.exports=root.OdysseyTempleSanctuaries;
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();}
})(typeof window!=='undefined'?window:globalThis);
