/* Additive landscape catalogue. Never changes cards, coverage, assignments or saved crops. */
(function(root){
'use strict';
const VERSION='landscapes-20260929-v2';
const KEYS=['id','tags','title','artist','date','period','medium','institution','objectId','rights','source','credit','matchType','heroScore','candidateCards','cropNotes','status','imageUrl','imageWidth','imageHeight','imageChecked'];
const sourceKey=x=>String(x||'').replace('http://','https://').replace('/en/art/','/art/').replace(/\/$/,'');
function merge(dataset, payload=root.ODYSSEY_LANDSCAPE_IMPORT){
 if(!dataset||!Array.isArray(dataset.artworks)||!payload||!Array.isArray(payload.artworks))return dataset;
 const artworks=dataset.artworks.slice(),byId=new Map(artworks.map((a,i)=>[a.id,i])),conflicts=[];
 for(const incoming of payload.artworks){
  const i=byId.get(incoming.id);
  if(i===undefined){byId.set(incoming.id,artworks.length);artworks.push({...incoming});continue;}
  const existing=artworks[i];
  if(sourceKey(existing.source)!==sourceKey(incoming.source)){conflicts.push(incoming.id);continue;}
  // Preserve existing curatorial edits. Add acquired delivery only to the eight previous research records.
  const next={...existing,tags:[...new Set([existing.tags,'landscape','import20260929',incoming.collectionTag||'',incoming.legendaryTags||''].flatMap(s=>String(s||'').split(';').map(t=>t.trim())).filter(Boolean))].join('; '),landscapeCollection:incoming.landscapeCollection};
  if(/^ART-61[7-9]$|^ART-62[0-4]$/.test(incoming.id)){
   for(const key of ['imageUrl','imageWidth','imageHeight','imageChecked','originalImageUrl','acquisitionStatus','landscapeCollection'])if(incoming[key])next[key]=incoming[key];
  }
  artworks[i]=next;
 }
 for(const [id,tags] of Object.entries(payload.existingTags||{})){const i=byId.get(id);if(i!==undefined)artworks[i]={...artworks[i],tags:[...new Set([artworks[i].tags,tags].flatMap(s=>String(s||'').split(';').map(t=>t.trim())).filter(Boolean))].join('; ')};}
 return {...dataset,artworks,integrity:{...dataset.integrity,artworks:artworks.length},landscapeImport:{version:VERSION,...payload.summary,conflicts}};
}
function registerWithSheetSync(payload=root.ODYSSEY_LANDSCAPE_IMPORT){
 const sync=root.OdysseySheetSync;if(!sync||!payload||!Array.isArray(sync.artRows))return;
 const ids=new Map(sync.artRows.map((r,i)=>[r[0],i]));
 for(const art of payload.artworks){
  const i=ids.get(art.id),row=KEYS.map(k=>art[k]??'');
  if(i===undefined){ids.set(art.id,sync.artRows.length);sync.artRows.push(row);}
  else if(/^ART-61[7-9]$|^ART-62[0-4]$/.test(art.id)&&sourceKey(sync.artRows[i][10])===sourceKey(art.source)){
   for(const col of [17,18,19,20])if(row[col])sync.artRows[i][col]=row[col];
  }
 }
 sync.META.artworks=sync.artRows.length;
 sync.META.landscapeImport={version:VERSION,...payload.summary};
}
function open(query='import20260929'){
 if(typeof root.openArtOptions!=='function')return;
 root.openArtOptions();
 const all=document.querySelector('[data-art-search-scope="all"]');if(all)all.click();
 const input=document.getElementById('artOptionSearch');
 if(input){input.value=query;input.dispatchEvent(new Event('input',{bubbles:true}));}
}
function mount(){
 const payload=root.ODYSSEY_LANDSCAPE_IMPORT;if(!payload||document.getElementById('openLandscapeLibrary'))return;
 const actions=document.querySelector('.top-actions');if(!actions)return;
 const button=document.createElement('button');button.id='openLandscapeLibrary';button.type='button';button.className='btn secondary';button.textContent='Landscape library';button.onclick=()=>open();
 actions.insertBefore(button,actions.firstChild);
 const chooser=document.createElement('select');chooser.id='landscapeCollectionPicker';chooser.className='dataset-picker';chooser.setAttribute('aria-label','Browse landscape collection');
 const option=(label,value)=>{const el=document.createElement('option');el.textContent=label;el.value=value;chooser.appendChild(el)};
 option('Landscape collections…','');option('All new landscapes','import20260929');option('Round 2 — latest 37','landscaperound2');
 for(const group of payload.collections||[])option(group.label+' ('+group.count+')',group.tag);
 for(const [label,tag] of [['Legendary: Olympus','localeolympus'],['Legendary: Ithaca','localeithaca'],['Legendary: Scheria','localescheria'],['Legendary: Aeaea','localeaeaea'],['Legendary: Underworld approaches','localeunderworld'],['Legendary: Aeolia','localeaeolia']])option(label,tag);
 chooser.onchange=()=>{if(chooser.value)open(chooser.value)};button.after(chooser);
 const style=document.createElement('style');style.textContent='.landscape-rights{display:block;margin-top:5px;font-size:10px;line-height:1.35;color:#e3bc70}.landscape-note{font-size:12px;padding:8px 12px;background:#23261f;border:1px solid #596044;border-radius:6px;margin:6px 0}';document.head.appendChild(style);
 const overlay=document.getElementById('artOptionsOverlay'),grid=document.getElementById('artOptionsGrid');
 const imported=new Map(payload.artworks.map(a=>[a.id,a]));
 const decorate=()=>{
  if(!grid)return;
  for(const tile of grid.querySelectorAll('[data-art-option]')){
   const a=imported.get(tile.dataset.artOption);if(!a||tile.querySelector('.landscape-rights'))continue;
   const label=document.createElement('span');label.className='landscape-rights';
   label.textContent=a.imageUrl?(String(a.rights).startsWith('GREEN')?'Open-access image · card crop not approved':'Research preview · image-use terms pending'):'Source record only · image unavailable';
   label.title=a.rights+' | '+(a.cropNotes||'');tile.querySelector('.art-option-body')?.appendChild(label);
   if(!a.imageUrl){tile.disabled=true;tile.title='Source record retained; image acquisition is still pending.';}
  }
 };
 if(grid)new MutationObserver(decorate).observe(grid,{childList:true});
 if(overlay){const head=overlay.querySelector('.art-options-head');if(head){const n=document.createElement('div');n.className='landscape-note';n.textContent='Landscape imports retain their real-world source titles. Research previews are not final card selections; rights and print-crop checks remain visible on each record.';head.after(n);}}
 if(new URLSearchParams(location.search).get('library')==='landscapes')setTimeout(()=>open(new URLSearchParams(location.search).get('round')==='2'?'landscaperound2':'import20260929'),250);
}
registerWithSheetSync();
if(root.ODYSSEY_DATA)root.ODYSSEY_DATA=merge(root.ODYSSEY_DATA);
const api={VERSION,merge,registerWithSheetSync,open,mount};root.OdysseyLandscapeLibrary=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();}
})(typeof window!=='undefined'?window:globalThis);
