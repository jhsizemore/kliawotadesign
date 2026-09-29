/* Art-first public presentation. Uses published data only; no editor state or sync keys. */
(function(){
'use strict';
const C=window.OdysseyExhibitionCore, $=id=>document.getElementById(id);
const ROOT='/mtgtools/Odyssey/scry', DATA='/mtgtools/odyssey/data/odyssey-public-candidate.json';
const IS_SOCIAL=document.body.dataset.page==='social';
const IS_LAUNCH=document.body.dataset.page==='launch';
let cat=null,filtered=[],shown=0,group='',lastFocus=null,modalURL='',promoBusy=false;
const batch=36,formatSizes={landscape:[1200,630],square:[1080,1080],portrait:[1080,1350],story:[1080,1920]};
const colourNames={W:'White',U:'Blue',B:'Black',R:'Red',G:'Green'};
const artById=id=>cat?.arts.get(id),cardById=n=>cat?.cards.find(c=>c.number===Number(n));
const rarity=c=>String(c.rarity||'C').toUpperCase().slice(0,1);
function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').hidden=true,4000);}
function image(a,cls='',full=false,eager=false){if(!a?.image)return '<span class="failure-caption">Artwork is not currently available.</span>';return '<img class="'+cls+'" src="'+C.esc(full?a.image:a.thumb||a.image)+'" alt="'+C.esc([a.title,a.artist].filter(Boolean).join(' — '))+'" loading="'+(eager?'eager':'lazy')+'" decoding="async" referrerpolicy="no-referrer">';}
function label(a,links=true){if(!a)return '<p class="fine">Artwork record pending.</p>';return '<div class="wall-label"><h4>'+C.esc(a.title||'Title not recorded')+'</h4><p class="maker">'+C.esc(a.artist)+'</p><p>'+C.esc([a.date||'Date not recorded',a.medium||'Medium not recorded'].join(' · '))+'</p><p>'+C.esc(a.institution)+'</p><p class="rights">'+C.esc(a.rights||'Image reuse rights need review.')+'</p>'+(links?'<div class="links"><button class="text-button" type="button" data-art="'+C.esc(a.id)+'">See complete work ↗</button>'+(a.source?'<a target="_blank" rel="noopener noreferrer" href="'+C.esc(a.source)+'">Source record ↗</a>':'')+'</div>':'')+'</div>';}
function cardHTML(c,caption=false,face='front'){
 return '<button type="button" class="candidate" data-card="'+c.number+'" aria-label="Read candidate '+C.esc(c.displayName)+'"><span class="card-window"><odyssey-studio-card number="'+c.number+'" face="'+face+'" aria-hidden="true"></odyssey-studio-card></span>'+(caption?'<span class="candidate-caption">'+C.esc(c.displayName)+'<small>'+C.esc(c.type||'')+'</small></span>':'')+'</button>';
}
function hydrateCards(scope=document){scope.querySelectorAll('odyssey-studio-card').forEach(el=>el.fit?.());}
function clearCards(scope){scope.replaceChildren();}
function preferredCards(cards,n,numbers=[]){const rank=c=>{const i=numbers.indexOf(c.number);return i<0?1000+c.number:i;};return selectCards([...cards].sort((a,b)=>rank(a)-rank(b)),n);}
function selectCards(cards,n,used){const out=[],seen=new Set();for(const c of cards){if(out.length===n)break;if(!c.image||!c.art?.source||used?.has(c.number)||seen.has(c.artId))continue;out.push(c);seen.add(c.artId);used?.add(c.number);}return out;}
function hero(){const all=[...cat.exhibition].sort((a,b)=>C.artScore(b,true)-C.artScore(a,true)),paint=all.filter(a=>a.kind==='paint'),art=paint[0]||all[0];if(!art){$('heroCredit').innerHTML='<p class="fine">Sourced hero artwork is still being reviewed.</p>';return;}$('heroImage').innerHTML=image(art,'',true,true);$('heroCredit').innerHTML=label(art);const first=cat.cards.find(c=>c.artId===art.id)||selectCards(cat.cards,1)[0];if(first){$('firstCard').innerHTML=cardHTML(first);$('firstCredit').innerHTML=label(first.art);}else $('first-card').hidden=true;}
function materialChapters(){
 $('mediumChapters').innerHTML=C.chapters.map((ch,i)=>{
  const works=cat.exhibition.filter(a=>a.kind===ch.key).sort((a,b)=>C.artScore(b,ch.key==='paint')-C.artScore(a,ch.key==='paint'));
  if(!works.length)return '<section class="material-slide material-'+ch.key+'"><div class="material-copy"><p class="eyebrow">'+ch.key+'</p><h3>'+ch.title+'</h3><p>A source-linked work in this material is still being sought. The gap stays visible until it is filled.</p></div></section>';
  const a=works[0],candidate=preferredCards(cat.cards.filter(c=>c.art?.kind===ch.key),1)[0];
  return '<section class="material-slide material-'+ch.key+'" id="chapter-'+ch.key+'"><figure class="material-art"><button type="button" data-art="'+C.esc(a.id)+'" aria-label="View the complete '+C.esc(a.title)+'">'+image(a,'',true)+'</button></figure><div class="material-copy"><p class="eyebrow">'+String(i+1).padStart(2,'0')+' / '+ch.key+'</p><h3>'+ch.title+'</h3><p class="material-subtitle">'+ch.subtitle+'</p><p>'+ch.text+'</p><div class="chapter-label">'+label(a)+'</div><button class="text-button" data-collection="'+ch.key+'">Explore '+works.length+' works ↗</button></div>'+(candidate?'<div class="material-card">'+cardHTML(candidate)+'<p class="fine">From the collection to the current set.</p></div>':'')+'</section>';
 }).join('');
 window.OdysseyMaterialCarousel=OdysseyCarousels.mount($('mediumChapters'),{label:'Art materials',titles:C.chapters.map(ch=>ch.key)});
}
function mechanics(){
 $('mechanicChapters').innerHTML=C.mechanics.map(m=>{
  const matching=cat.cards.filter(m.match),cards=preferredCards(cat.cards,2,m.featured),background=cards.find(c=>c.art?.kind==='paint')?.art||cards[0]?.art;
  return '<section class="mechanic mood-'+m.mood+'" id="mechanic-'+m.id+'">'+(background?'<div class="mechanic-bg">'+image(background,'',true)+'</div>':'')+'<div class="mechanic-copy"><p class="eyebrow">'+m.tags.map(C.esc).join(' / ')+'</p><h2>'+C.esc(m.name).replace(/\\n/g,'<br>')+'</h2><p class="hook">'+m.hook+'</p><p>'+m.text+'</p><button class="button" data-group="mechanic:'+m.id+'">Explore these candidates ↗</button>'+(background?'<div class="feature-credit">'+label(background)+'</div>':'')+'</div><div class="mechanic-cards">'+cards.map(c=>cardHTML(c)).join('')+'</div></section>';
 }).join('');
}
function stories(){
 $('storyChapters').innerHTML=C.themes.map(t=>{
  const c=preferredCards(cat.cards,1,t.featured)[0],a=c?.art||cat.exhibition.find(a=>t.query.test(a.title||''));if(!a)return '';
  return '<section class="story"><figure class="story-art"><button type="button" data-art="'+C.esc(a.id)+'" aria-label="View '+C.esc(a.title)+'">'+image(a,'',true)+'</button><figcaption>'+label(a)+'</figcaption></figure><div class="story-copy"><p class="eyebrow">HOMER’S WORLD / YOUR DECISIONS</p><h3>'+t.title+'</h3><p>'+t.copy+'</p><button class="text-button" data-group="story:'+t.id+'">Explore these candidates ↗</button>'+(c?cardHTML(c):'')+'</div></section>';
 }).join('');
 window.OdysseyStoryCarousel=OdysseyCarousels.mount($('storyChapters'),{label:'Story themes',titles:['Homecoming','Temptation','Monsters']});
}
function backgroundSections(){
 for(const [imageId,creditId,n] of [['manifestoImage','manifestoCredit',249],['developmentImage','developmentCredit',168]]){
  const art=cardById(n)?.art;if(!art)continue;$(imageId).innerHTML=image(art,'',true);$(creditId).innerHTML=label(art);
 }
}
function setupSignup(){
 const role=$('signupRole'),link=$('signupLink');if(!role||!link)return;
 const update=()=>{const choice={updates:'following the project and receiving development updates',playtesting:'playtesting the set and receiving invitations',contributing:'contributing design feedback or art-history research'}[role.value]||'following the project';link.href='mailto:jhsizemore@gmail.com?subject='+encodeURIComponent('Odyssey — register my interest')+'&body='+encodeURIComponent('Hi Hunter,\n\nI would like to register my interest in '+choice+'. Please reply with details about taking part in Odyssey.\n\nThanks!');};
 role.addEventListener('change',update);$('signupInterest').onsubmit=e=>e.preventDefault();update();
}
function openDialog(visual,html,hash){if(!$('detailDialog').open){lastFocus=document.activeElement;const base=new URL(location.href);if(/^#(?:card|art)-/.test(base.hash))base.hash='';modalURL=base.href;}clearCards($('detailVisual'));$('detailVisual').innerHTML=visual;$('detailText').innerHTML=html;if(!$('detailDialog').open)$('detailDialog').showModal();hydrateCards($('detailVisual'));if(hash){const u=new URL(location.href);u.hash=hash;history.replaceState(null,'',u);} }
function closeDialog(){if(!$('detailDialog').open)return;$('detailDialog').close();if(modalURL)history.replaceState(null,'',modalURL);lastFocus?.focus?.();}
function openCard(c,face='front',write=true){
 if(!c)return;const m=OdysseyStudioRenderer.engine.model(c.number,face),art=cat.arts.get(m.artId)||null,pair=OdysseyTransformFaces.split(c);
 const rules=String(m.rules||'').replace(/\/\/(Adventure|Prep|Prepare)\/\//g,'\n\n$1 —\n');
 const html='<p class="eyebrow">ODY '+String(c.number).padStart(3,'0')+' / UNCONFIRMED CANDIDATE'+(pair?' / '+face.toUpperCase()+' FACE':'')+'</p><h2 id="detailTitle">'+C.esc(m.displayName)+'</h2><p><span class="cost">'+C.cost(m.mana)+'</span>'+C.esc(m.type)+'</p><div class="oracle">'+C.rich(rules)+'</div>'+(m.flavor?'<p><em>'+C.esc(m.flavor)+'</em></p>':'')+'<div class="actions">'+(pair?'<button class="button" data-flip="'+c.number+'" data-face="'+(face==='front'?'back':'front')+'">Show '+(face==='front'?'back':'front')+'</button>':'')+'<button class="button" data-promo-add="'+c.number+'">Add to reveal</button><button class="button" data-share="'+c.number+'">Copy card link</button></div>'+label(art)+(c.story?'<p class="fine"><strong>Project interpretation, not museum catalogue text:</strong><br>'+C.esc(c.story)+'</p>':'')+'<p class="fine">Rendered by Odyssey Studio from the published set. This is the published candidate file, not a finished set. Saved artwork placement is applied when it matches this card’s assigned art; labelled author previews may include unpublished framing.</p>';
 openDialog(cardHTML(c,false,face),html,write?'card-'+String(c.number).padStart(3,'0'):null);
}
function openArt(a,write=true){if(!a)return;const cards=cat.cards.filter(c=>c.artId===a.id);openDialog(image(a,'',true,true),'<p class="eyebrow">COMPLETE IMAGE / SOURCE-REPORTED METADATA</p><h2 id="detailTitle">'+C.esc(a.title)+'</h2>'+label(a,false)+(a.source?'<a class="button" target="_blank" rel="noopener noreferrer" href="'+C.esc(a.source)+'">Open source record ↗</a>':'')+'<p class="fine">The source record governs attribution and image rights. Card assignments and the exhibition narrative are project interpretations.</p>'+(cards.length?'<h3 style="font-size:25px">Used by these candidates</h3>'+cards.map(c=>'<button class="text-button" style="display:block" data-card="'+c.number+'">ODY '+String(c.number).padStart(3,'0')+' · '+C.esc(c.displayName)+'</button>').join(''):'<p class="fine">Research collection work; not currently assigned to a card.</p>'),write?'art-'+a.id:null);}
function openCollection(key){const list=cat.exhibition.filter(a=>a.kind===key),ch=C.chapters.find(c=>c.key===key);openDialog('', '<p class="eyebrow">SOURCE-LINKED RESEARCH COLLECTION</p><h2 id="detailTitle">'+(ch?.title||'Collection')+'</h2><p>'+list.length+' works. Select a work to see the complete image and attribution.</p><div>'+list.map(a=>'<button class="text-button" style="display:block;text-align:left" data-art="'+C.esc(a.id)+'">'+C.esc(a.title)+' — '+C.esc(a.artist)+'</button>').join('')+'</div><button class="button" data-group="medium:'+key+'">View related card candidates ↗</button>',null);}
function writeFilters(){const u=new URL(location.href);u.searchParams.set('view','cards');for(const [name,id] of [['q','search'],['color','colorFilter'],['rarity','rarityFilter'],['sort','sort']]){const v=$(id).value;if(v&&!(name==='sort'&&v==='number'))u.searchParams.set(name,v);else u.searchParams.delete(name);}if(group)u.searchParams.set('group',group);else u.searchParams.delete('group');history.replaceState(null,'',u);}
function matchesGroup(c){if(!group)return true;const [kind,id]=group.split(':');if(kind==='medium')return c.art?.kind===id;if(kind==='mechanic'){const m=C.mechanics.find(m=>m.id===id);return !m||m.match(c)||m.featured.includes(c.number);}if(kind==='story')return C.themes.find(t=>t.id===id)?.query.test([c.displayName,c.story,c.storyTarget].join(' '))??true;return true;}
function applyFilters(write=true){if(!cat||IS_SOCIAL)return;if(!C.previewOpen()){filtered=[];shown=0;clearCards($('cardGrid'));return;}const q=$('search').value.toLowerCase().trim(),color=$('colorFilter').value,r=$('rarityFilter').value;filtered=cat.cards.filter(c=>matchesGroup(c)&&(!q||[c.displayName,c.type,c.rules,c.story,c.mechanics,c.art?.title,c.art?.artist].join(' ').toLowerCase().includes(q))&&(!color||c.frame===color||('WUBRG'.includes(color)&&c.colors.includes(color)))&&(!r||rarity(c)===r));const sort=$('sort').value;filtered.sort((a,b)=>(sort==='name'?a.displayName.localeCompare(b.displayName):sort==='rarity'?'CURM'.indexOf(rarity(a))-'CURM'.indexOf(rarity(b)):sort==='color'?'WUBRG MCL'.indexOf(a.frame)-'WUBRG MCL'.indexOf(b.frame):0)||a.number-b.number);shown=0;clearCards($('cardGrid'));renderMore();$('resultCount').textContent=filtered.length+' of '+cat.cards.length+' candidates';$('filterContext').textContent=group?'Collection filter: '+group.replace(':',' / ')+'. Reset to see the complete file.':'';if(write)writeFilters();}
function renderMore(){if(!cat||!C.previewOpen()||$('spoiler').hidden)return;const more=filtered.slice(shown,shown+batch);$('cardGrid').insertAdjacentHTML('beforeend',more.map(c=>cardHTML(c,true)).join(''));shown+=more.length;$('loadMore').hidden=shown>=filtered.length;$('loadProgress').textContent=filtered.length?shown+' / '+filtered.length+' shown':'No candidates match. Reset or change the filters.';}
let previewState=null,previewTimer;
function refreshPreviewWindow(){
 if(!cat)return;
 const open=C.previewOpen(),changed=previewState!==null&&previewState!==open;previewState=open;
 clearTimeout(previewTimer);
 if(changed){
  if(IS_SOCIAL){
   const chosen=[...document.querySelectorAll('.promo-select')].map(s=>s.value),background=$('promoBackground').value;
   setupPromo();document.querySelectorAll('.promo-select').forEach((s,i)=>{s.value=[...s.options].some(o=>o.value===chosen[i])?chosen[i]:'';});
   if([...$('promoBackground').options].some(o=>o.value===background))$('promoBackground').value=background;
   renderPromo();$('promoStatus').textContent='The full preview has closed. This composer now offers curated candidates; eligible selections are preserved.';
  }
  else{const viewingCards=!$('spoiler').hidden;showMode(viewingCards,false,false);if(!open&&viewingCards)toast('The full-spoiler preview has ended. Curated previews and signup are still available.');}
 }
 const until=Date.parse(C.previewClosesAt)-Date.now();
 if(open&&Number.isFinite(until))previewTimer=setTimeout(refreshPreviewWindow,Math.min(2147483000,Math.max(50,until+50)));
}
function showMode(cards,write=true,scroll=true){
 if(IS_SOCIAL){location.href=ROOT+'/'+(cards?'?view=cards':'');return;}
 $('exhibition').hidden=cards;$('spoiler').hidden=!cards;const closed=!C.previewOpen();$('previewClosed').hidden=!closed;
 for(const el of [$('filters'),$('filterContext'),$('cardGrid'),document.querySelector('.load-more')])el.hidden=closed;
 if(closed)$('resultCount').textContent='Full-spoiler window closed';
 if(write){const u=new URL(location.href);if(cards)u.searchParams.set('view','cards');else{for(const key of ['view','q','color','rarity','sort','group'])u.searchParams.delete(key);u.hash='';}history.pushState(null,'',u);}
 if(cards)applyFilters(false);else hydrateCards($('exhibition'));if(scroll)window.scrollTo({top:0,behavior:'instant'});
}
function navigate(){if(!cat||IS_SOCIAL)return;const u=new URL(location.href);for(const [p,id] of [['q','search'],['color','colorFilter'],['rarity','rarityFilter'],['sort','sort']])$(id).value=u.searchParams.get(p)||(p==='sort'?'number':'');group=u.searchParams.get('group')||'';const cards=u.searchParams.get('view')==='cards'||u.hash==='#cards';showMode(cards,false,false);const match=u.hash.match(/^#card-(\d+)$/);if(match)openCard(cardById(match[1]),'front',false);else if(u.hash.startsWith('#art-'))openArt(artById(u.hash.slice(5)),false);else if($('detailDialog').open)$('detailDialog').close();}
function setupPromo(){const pool=C.previewOpen()?cat.cards:cat.cards.filter(c=>[...C.mechanics.flatMap(m=>m.featured),...C.themes.flatMap(t=>t.featured)].includes(c.number));const options='<option value="">No card</option>'+pool.map(c=>'<option value="'+c.number+'">'+String(c.number).padStart(3,'0')+' · '+C.esc(c.displayName)+'</option>').join('');$('promoPickers').innerHTML=[1,2,3,4,5].map(n=>'<label>Card '+n+'<select class="promo-select" aria-label="Reveal card '+n+'">'+options+'</select></label>').join('');const chosen=(new URL(location.href).searchParams.get('cards')||'61,17,209').split(',').map(Number).filter(n=>pool.some(c=>c.number===n));const initial=chosen.slice(0,5).map(cardById);document.querySelectorAll('.promo-select').forEach((s,i)=>s.value=initial[i]?.number||'');const arts=[...cat.exhibition].sort((a,b)=>C.artScore(b,true)-C.artScore(a,true));$('promoBackground').innerHTML=arts.map(a=>'<option value="'+C.esc(a.id)+'">'+C.esc(a.title)+' — '+C.esc(a.artist)+'</option>').join('');if(initial[0]?.artId)$('promoBackground').value=initial[0].artId;renderPromo();}
function promoSelected(){return [...new Set([...document.querySelectorAll('.promo-select')].map(s=>s.value).filter(Boolean))].map(cardById).filter(Boolean).slice(0,5);}
function scalePromo(){const [w,h]=formatSizes[$('promoFormat').value]||formatSizes.landscape,host=$('promoViewport'),stage=$('promoStage');const full=!!document.fullscreenElement,scale=Math.min(host.clientWidth/w,full?host.clientHeight/h:Infinity);stage.style.transform='scale('+scale+')';stage.style.left=full?(host.clientWidth-w*scale)/2+'px':'0';stage.style.top=full?(host.clientHeight-h*scale)/2+'px':'0';if(!full)host.style.aspectRatio=w+'/'+h;}
function promoGeometry(w,h,count){let best={width:0,columns:1};for(let columns=1;columns<=Math.max(count,1);columns++){const rows=Math.ceil(count/columns)||1,width=Math.min((w-100-(columns-1)*22)/columns,(h-290-(rows-1)*22)/rows*378/528,440);if(width>best.width)best={width,columns};}return best;}
function renderPromo(){if(!cat)return;const cards=promoSelected(),a=artById($('promoBackground').value),[w,h]=formatSizes[$('promoFormat').value]||formatSizes.landscape,stage=$('promoStage');clearCards(stage);stage.style.width=w+'px';stage.style.height=h+'px';const cardW=promoGeometry(w,h,cards.length).width;const credit=[a?'BACKGROUND: '+a.title+' — '+a.artist+' · '+(a.date||'date not recorded'):'BACKGROUND: none',...cards.map(c=>'ODY '+String(c.number).padStart(3,'0')+': '+(c.art?[c.art.title,c.art.artist,c.art.institution].join(' — '):'Artwork pending'))].join('\n');stage.innerHTML='<div class="promo-background">'+image(a,'',true,true)+'</div><div class="promo-background promo-mirror">'+image(a,'',true,true)+'</div><div class="promo-shade"></div><div class="promo-wordmark"><small>A CUSTOM MAGIC SET / DEVELOPMENT PREVIEW</small>ODYSSEY</div><div class="promo-headline">'+C.esc($('promoHeadline').value.trim()||'THE LONG WAY HOME')+'</div><div class="promo-items" style="--promo-card-width:'+cardW+'px">'+cards.map(c=>cardHTML(c)).join('')+'</div><div class="promo-foot"><span>kliawota.design/mtgtools/Odyssey/scry<br>Unconfirmed candidates · full credits in exhibition</span><span class="credit-lines">'+C.esc(credit)+'</span></div>';hydrateCards(stage);scalePromo();$('promoDownload').disabled=!cards.length||!a||cards.some(c=>!c.image)||promoBusy;$('promoStatus').textContent=cards.length+' distinct candidate'+(cards.length===1?'':'s')+'. '+(cards.some(c=>!c.image)?'Assign artwork before exporting this selection.':'The selected artwork supplies the blurred, mirrored background.');}
function addPromo(n){
 if(!IS_SOCIAL){location.href=ROOT+'/social/?cards='+n;return;}
 const selects=[...document.querySelectorAll('.promo-select')];if(selects.some(s=>Number(s.value)===n))toast('Already in the reveal.');else{const free=selects.find(s=>!s.value);if(!free){toast('The reveal already has five cards. Replace one in the composer.');return;}free.value=n;renderPromo();}closeDialog();$('social').scrollIntoView();
}
async function dataImage(src,dimensions){
 const response=await fetch(src,{signal:AbortSignal.timeout(20000),cache:'force-cache'});
 if(!response.ok)throw Error('Artwork fetch failed: '+src);
 const blob=await response.blob();if(!blob.type.startsWith('image/'))throw Error('An artwork URL did not return an image.');
 if(blob.type!=='image/svg+xml'){
  const width=dimensions?.width||0,height=dimensions?.height||0,ratio=width&&height?Math.min(1,2048/Math.max(width,height)):1;
  const options=width&&height?{resizeWidth:Math.max(1,Math.round(width*ratio)),resizeHeight:Math.max(1,Math.round(height*ratio)),resizeQuality:'high'}:{};
  let bitmap;try{bitmap=await createImageBitmap(blob,options);}catch{throw Error('Cannot prepare artwork pixels for export: '+src);}
  try{const factor=Math.min(1,2048/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*factor));canvas.height=Math.max(1,Math.round(bitmap.height*factor));canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);return canvas.toDataURL(Math.max(canvas.width,canvas.height)<128?'image/png':'image/webp',.96);}finally{bitmap.close();}
 }
 return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(blob);});
}

function expandedClone(source){
 if(source.nodeType===Node.TEXT_NODE)return source.cloneNode();
 if(source.nodeType!==Node.ELEMENT_NODE)return null;
 const copy=source.shadowRoot?document.createElement('div'):source.cloneNode(false);
 if(source.shadowRoot)for(const a of source.attributes)copy.setAttribute(a.name,a.value);
 copy.removeAttribute('id');const computed=getComputedStyle(source);
 copy.style.cssText=[...computed].map(k=>k+':'+computed.getPropertyValue(k)).join(';');
 // SVG paint-server IDs must survive. Their URL references are localized below.
 if(source.namespaceURI==='http://www.w3.org/2000/svg'&&source.id)copy.id=source.id;
 const pseudo=which=>{const st=getComputedStyle(source,which),content=st.content;if(!content||content==='none'||content==='normal'||st.display==='none')return;const el=document.createElement('span');el.style.cssText=[...st].map(k=>k+':'+st.getPropertyValue(k)).join(';');el.style.content='normal';el.textContent=content==='""'||content==="''"?'':content.replace(/^["']|["']$/g,'');copy.append(el);};
 if(source.namespaceURI!=='http://www.w3.org/2000/svg')pseudo('::before');
 for(const child of (source.shadowRoot||source).childNodes){const clone=expandedClone(child);if(clone)copy.append(clone);}
 if(source.namespaceURI!=='http://www.w3.org/2000/svg')pseudo('::after');return copy;
}
async function exportPromo(){
 if(promoBusy||$('promoDownload').disabled)return;promoBusy=true;document.querySelectorAll('#promoControls input,#promoControls select,#promoControls button').forEach(el=>el.disabled=true);$('promoStatus').textContent='Rendering the Studio cards and their credits…';
 try{
  await document.fonts.ready;hydrateCards($('promoStage'));
  const components=[...$('promoStage').querySelectorAll('odyssey-studio-card')];
  const imgs=[...$('promoStage').querySelectorAll('img'),...components.flatMap(c=>[...c.shadowRoot.querySelectorAll('img')])];
  if(components.some(c=>c.dataset.renderError||c.card?.dataset.imageState==='unavailable'))throw Error('A card or its artwork is unavailable.');
  // The browser may evict decoded large images when the export button scrolls
  // them off screen. Do not force every full-resolution original into memory.
  // Wait for source metadata; validate and resize each fetched export image below.
  for(const image of imgs){image.loading='eager';if(image.complete&&image.naturalWidth)continue;await new Promise((resolve,reject)=>{const done=()=>{clearTimeout(timer);image.removeEventListener('load',loaded);image.removeEventListener('error',failed);};const loaded=()=>{done();image.naturalWidth?resolve():reject(Error('Artwork has no dimensions: '+image.src));};const failed=()=>{done();reject(Error('Cannot load artwork: '+image.src));};const timer=setTimeout(()=>{done();reject(Error('Artwork load timed out: '+image.src));},20000);image.addEventListener('load',loaded,{once:true});image.addEventListener('error',failed,{once:true});if(image.complete&&image.naturalWidth)loaded();});}
  hydrateCards($('promoStage'));
  const dimensions=new Map(imgs.map(i=>[i.currentSrc||i.src,{width:i.naturalWidth,height:i.naturalHeight}]));
  const clone=expandedClone($('promoStage'));Object.assign(clone.style,{transform:'none',position:'relative',top:'0',left:'0',margin:'0'});
  const urls=new Map();for(const img of clone.querySelectorAll('img')){const src=img.src;if(!urls.has(src))urls.set(src,dataImage(src,dimensions.get(src)));img.src=await urls.get(src);img.removeAttribute('loading');}
  const ids=new Set([...clone.querySelectorAll('[id]')].map(e=>e.id));
  for(const el of clone.querySelectorAll('[style]'))el.style.cssText=el.style.cssText.replace(/url\(["']?[^)"']*#([^)'"\s]+)["']?\)/g,(whole,id)=>ids.has(id)?'url(#'+id+')':whole);
  const [w,h]=formatSizes[$('promoFormat').value],markup=new XMLSerializer().serializeToString(clone),svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'"><foreignObject width="100%" height="100%">'+markup+'</foreignObject></svg>',img=new Image();
  img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);await img.decode().catch(()=>{window.__odysseyFailedExportSVG=svg;throw Error('Cannot decode the composed SVG ('+svg.length+' characters).');});const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;canvas.getContext('2d').drawImage(img,0,0);
  const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('PNG rendering unavailable.')),'image/png'));
  const a=document.createElement('a'),u=URL.createObjectURL(blob);a.href=u;a.download='odyssey-'+$('promoFormat').value+'-development-preview.png';a.click();setTimeout(()=>URL.revokeObjectURL(u),60000);$('promoStatus').textContent='PNG exported with Studio-rendered cards and artwork credits.';
 }catch(e){console.error(e);$('promoStatus').textContent='Export stopped: '+e.message+' No incomplete image was exported.';}
 finally{promoBusy=false;document.querySelectorAll('#promoControls input,#promoControls select,#promoControls button').forEach(el=>el.disabled=false);}
}
function reveal(){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;document.body.classList.add('motion-ready');const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in-view');observer.unobserve(e.target);}}),{rootMargin:'140px'});document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));}
function bind(){
 document.addEventListener('click',async e=>{
  const el=e.target.closest('button,a');if(!el)return;
  if(el.hasAttribute('data-spoiler')){e.preventDefault();showMode(true);}
  else if(el.hasAttribute('data-exhibition')){const hash=el.getAttribute('href');e.preventDefault();showMode(false);document.querySelector(hash)?.scrollIntoView();}
  else if(el.dataset.group){closeDialog();group=el.dataset.group;showMode(true);writeFilters();}
  else if(el.dataset.art){e.preventDefault();openArt(artById(el.dataset.art));}
  else if(el.dataset.collection)openCollection(el.dataset.collection);
  else if(el.dataset.promoAdd)addPromo(Number(el.dataset.promoAdd));
  else if(el.dataset.flip)openCard(cardById(el.dataset.flip),el.dataset.face,false);
  else if(el.dataset.share){const u=new URL(ROOT+'/',location.origin);u.hash='card-'+String(el.dataset.share).padStart(3,'0');try{await navigator.clipboard.writeText(u.href);toast('Card link copied.');}catch{toast('Copy the address from the browser’s address bar.');}}
  else if(el.dataset.card&&!el.closest('#detailVisual')&&!el.closest('#promoStage'))openCard(cardById(el.dataset.card));
 });
 $('closeDialog').onclick=closeDialog;$('detailDialog').addEventListener('cancel',e=>{e.preventDefault();closeDialog();});
 $('detailDialog').addEventListener('click',e=>{if(e.target===$('detailDialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog();}});
 if(IS_SOCIAL){
  $('promoControls').onsubmit=e=>e.preventDefault();$('promoControls').oninput=renderPromo;$('promoDownload').onclick=exportPromo;
  $('promoFullscreen').onclick=async()=>{try{await $('promoViewport').requestFullscreen();scalePromo();}catch{toast('Full screen is unavailable in this browser.');}};
  new ResizeObserver(scalePromo).observe($('promoViewport'));document.addEventListener('fullscreenchange',scalePromo);
 }else{
  $('backExhibition').onclick=()=>showMode(false);$('filters').onsubmit=e=>e.preventDefault();let timer;
  $('filters').oninput=()=>{clearTimeout(timer);timer=setTimeout(()=>applyFilters(),120);};
  $('clearFilters').onclick=()=>{$('filters').reset();group='';applyFilters();};
  $('compact').onclick=()=>{const on=$('cardGrid').classList.toggle('compact');$('compact').setAttribute('aria-pressed',String(on));};$('loadMore').onclick=renderMore;
  new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)&&shown&&shown<filtered.length)renderMore();},{rootMargin:'500px'}).observe($('sentinel'));
  window.addEventListener('popstate',navigate);window.addEventListener('hashchange',navigate);
  document.addEventListener('odyssey:slide',e=>hydrateCards(e.target));setupSignup();
 }
 window.addEventListener('focus',refreshPreviewWindow);window.addEventListener('pageshow',refreshPreviewWindow);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshPreviewWindow();});window.addEventListener('pagehide',()=>clearTimeout(previewTimer));
 document.addEventListener('error',e=>{if(e.target instanceof HTMLImageElement){e.target.classList.add('image-failed');if(!e.target.parentElement.querySelector('.failure-caption'))e.target.insertAdjacentHTML('afterend','<span class="failure-caption">Image unavailable. The source record is retained.</span>');}},true);
}
async function init(){
 try{
  const response=await fetch(DATA,{cache:'no-cache',signal:AbortSignal.timeout(30000)});if(!response.ok)throw Error('Candidate file returned HTTP '+response.status);
  const data=await response.json();if(data.publicCandidate?.schema!=='odyssey-public-candidate/v1')throw Error('Unexpected candidate source.');window.OdysseyCandidateSource=data.publicCandidate;window.OdysseyStudioRenderer.initialize(data);cat=C.catalogue(data,window.ODYSSEY_ARTWORK_MANIFEST);
  if(IS_SOCIAL)setupPromo();else{$('candidateCount').textContent=cat.cards.length;if(!IS_LAUNCH){hero();materialChapters();mechanics();stories();backgroundSections();}}
  bind();hydrateCards();reveal();navigate();refreshPreviewWindow();$('loadStatus').hidden=true;
  window.OdysseyExhibition={catalogue:cat,openCard,openArt,showMode,renderPromo,exportPromo,cardHTML,expandedClone};
  document.dispatchEvent(new CustomEvent('odyssey:exhibition-ready'));
 }catch(e){console.error(e);const note=$('loadStatus');note.replaceChildren(document.createTextNode('The collection could not load: '+e.message+'. The introduction and email signup remain available. '));const retry=document.createElement('button');retry.type='button';retry.className='button small';retry.textContent='Retry collection';retry.onclick=()=>location.reload();note.append(retry);note.hidden=false;}
}
init();
})();
