const DATA_URL='/mtgtools/odyssey/data/odyssey-data.json';
const state={all:[],filtered:[],art:new Map(),shown:0,batch:36,view:'grid'};
const $=s=>document.querySelector(s), esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function normFrame(c){const f=String(c.frame||c.color||'C').toUpperCase();if(['W','U','B','R','G','M','C','L'].includes(f))return f;if(/land/i.test(c.type||''))return'L';return'C'}
function rarity(r){r=String(r||'C').toUpperCase();return r.startsWith('M')?'M':r.startsWith('R')?'R':r.startsWith('U')?'U':'C'}
function artFor(c){const a=state.art.get(c.artId)||{};return c.imageUrl||a.imageUrl||a.thumbUrl||a.thumbnail||''}
function manaTokens(cost){
  const raw=String(cost||'').trim();if(!raw)return[];
  if(raw.includes('{'))return [...raw.matchAll(/\{([^}]+)\}/g)].map(m=>m[1].toUpperCase());
  const out=[];let i=0;while(i<raw.length){const num=raw.slice(i).match(/^\d+/);if(num){out.push(num[0]);i+=num[0].length;continue}const ch=raw[i].toUpperCase();if(/[WUBRGCX]/.test(ch))out.push(ch);i++}return out;
}
function manaPip(token){
  token=String(token||'').toUpperCase();const base=token.split('/')[0],cls=/^\d+$/.test(token)?'generic':(/[WUBRGCX]/.test(base)?base:'generic'),hybrid=token.includes('/')?' hybrid':'';
  const glyph={W:'☼',U:'',B:'☠',R:'♨',G:'♣',C:'◇',X:'X'}[base]||token;
  return '<span class="mana-pip '+cls+hybrid+'" aria-label="'+esc(token)+'"><span class="element">'+esc(glyph)+'</span></span>';
}
function manaCostHTML(cost){return manaTokens(cost).map(manaPip).join('')}
function richText(text){return esc(text||'').replace(/\{([^}]+)\}/g,(_,t)=>manaPip(t))}
function cardHTML(c,{meta=true}={}){
  const n=Number(c.number)||0,f=normFrame(c),img=artFor(c),rules=c.rules||c.oracle||'',flavor=c.flavor||'',pt=c.pt||'',name=c.displayName||c.name||'Untitled',type=c.type||'';
  const classes=[name.length>35?'name-very-long':name.length>25?'name-long':'',type.length>38?'type-long':'',rules.length>430?'rules-extreme':rules.length>315?'rules-very-long':rules.length>205?'rules-long':''].filter(Boolean).join(' ');
  return `<article class="card-tile card-${f} ${classes}" data-number="${n}" tabindex="0" aria-label="${esc(name)}">
<div class="card-wrap"><div class="card-frame"><div class="card-face">
<div class="titlebar"><div class="card-name">${esc(name)}</div><div class="mana">${manaCostHTML(c.mana||'')}</div></div>
<div class="art"><div class="art-fallback">${esc(name)}</div>${img?'<img loading="lazy" decoding="async" referrerpolicy="no-referrer" src="'+esc(img)+'" alt="">':''}</div>
<div class="typebar">${esc(type)}</div>
<div class="rules">${richText(rules)}${flavor?'<span class="flavor">'+richText(flavor)+'</span>':''}</div>
<div class="footerline"><span>ODY · ${String(n).padStart(3,'0')} · ${rarity(c.rarity)}</span>${pt?'<span class="pt">'+esc(pt)+'</span>':''}</div>
</div></div></div>${meta?'<div class="tile-meta"><div class="tile-title">'+esc(name)+'</div><div class="tile-sub">#'+String(n).padStart(3,'0')+' · '+esc(type)+'</div></div>':''}</article>`}
}
function hydrateArt(d){(d.artworks||[]).forEach(a=>state.art.set(a.id,a))}
function textBlob(c){return [c.name,c.displayName,c.type,c.rules,c.flavor,c.mechanics,c.archetypes,c.story].filter(Boolean).join(' ').toLowerCase()}
function applyFilters(reset=true){const q=$('#search').value.trim().toLowerCase(),cf=$('#colorFilter').value,rf=$('#rarityFilter').value,sort=$('#sort').value;let a=state.all.filter(c=>(!q||textBlob(c).includes(q))&&(!cf||normFrame(c)===cf)&&(!rf||rarity(c.rarity)===rf));a.sort((x,y)=>sort==='name'?String(x.displayName||x.name).localeCompare(String(y.displayName||y.name)):sort==='rarity'?rarity(x.rarity).localeCompare(rarity(y.rarity))||(+x.number-+y.number):sort==='color'?normFrame(x).localeCompare(normFrame(y))||(+x.number-+y.number):(+x.number-+y.number));state.filtered=a;if(reset){state.shown=0;$('#cardGrid').innerHTML=''}renderMore();$('#resultCount').textContent=`${a.length} of ${state.all.length} cards`;$('#activeFilters').textContent=[q&&`Search: “${q}”`,cf&&`Color: ${cf}`,rf&&`Rarity: ${rf}`].filter(Boolean).join(' · ')}
function renderMore(){if(state.shown>=state.filtered.length){$('#loadSentinel span').textContent=state.filtered.length?'End of set':'No cards match these filters.';return}const slice=state.filtered.slice(state.shown,state.shown+state.batch);$('#cardGrid').insertAdjacentHTML('beforeend',slice.map(c=>cardHTML(c)).join(''));state.shown+=slice.length;$('#loadSentinel span').textContent=state.shown<state.filtered.length?`Loading more… ${state.shown}/${state.filtered.length}`:`All ${state.filtered.length} cards loaded`}
function openCard(c,push=true){if(!c)return;$('#dialogCard').innerHTML=cardHTML(c);const name=c.displayName||c.name||'Untitled',mech=c.mechanics||'—';$('#dialogInfo').innerHTML=`<p class="kicker">ODY #${String(c.number).padStart(3,'0')} · ${esc(c.rarity||'')}</p><h2>${esc(name)}</h2><p><strong>${esc(c.mana||'')}</strong> · ${esc(c.type||'')}</p><div class="oracle">${esc(c.rules||'')}</div>${c.flavor?'<p><em>'+esc(c.flavor)+'</em></p>':''}<div class="story"><strong>Mechanics</strong><br>${esc(mech)}${c.story?'<br><br><strong>Story role</strong><br>'+esc(c.story):''}</div><div class="dialog-actions"><button id="copyLink">Copy card link</button><a href="/mtgtools/odyssey/" target="_blank" rel="noopener">Open Odyssey Studio ↗</a></div>`;$('#cardDialog').showModal();if(push)history.replaceState(null,'','#card-'+String(c.number).padStart(3,'0'));$('#copyLink').onclick=async()=>{await navigator.clipboard.writeText(location.href);$('#copyLink').textContent='Copied'} }
const MECHANIC_IGNORE=new Set(['flying','first strike','double strike','deathtouch','lifelink','vigilance','trample','haste','reach','ward','flash','menace','defender','hexproof','indestructible']);
const MECHANIC_COPY={
  saga:'Stories become permanents with momentum: the tale advances, changes the board, then passes.',
  devotion:'The gods care what you commit to the table. Colour intensity becomes faith made mechanical.',
  constellation:'Enchantments are not decoration here; their arrival is an event the rest of the world notices.',
  heroic:'A single figure becomes larger than the moment when your spells choose them.',
  ordeal:'Survival is earned through escalating tests, not simply declared on the first turn.',
  voyage:'The journey itself matters: movement, delay and arrival are part of the resource system.',
  temptation:'The best offer is often the dangerous one. Power arrives attached to a decision.',
  bargain:'Odyssey is full of exchanges whose real price appears later.',
  escape:'Getting out is one of the story’s recurring verbs, and the graveyard can become part of the route home.'
};
function mechanicWords(c){return String(c.mechanics||'').split(/[,;|\/]+/).map(s=>s.trim()).filter(s=>s&&s.length<42)}
function mechanicDescription(name,cards){
  const key=name.toLowerCase();for(const [k,v] of Object.entries(MECHANIC_COPY))if(key.includes(k))return v;
  const story=cards.map(c=>c.story).filter(Boolean)[0];return story?String(story).slice(0,220):'A recurring mechanical language in the current candidate file, being tested for how strongly it carries Odyssey flavour into play.';
}
function mechanics(){
  const counts=new Map();state.all.forEach(c=>mechanicWords(c).forEach(m=>{if(!MECHANIC_IGNORE.has(m.toLowerCase()))counts.set(m,(counts.get(m)||0)+1)}));
  const ranked=[...counts].filter(([,n])=>n>=2).sort((a,b)=>b[1]-a[1]).slice(0,6);
  $('#mechanicChips').innerHTML=[...counts].sort((a,b)=>b[1]-a[1]).slice(0,18).map(([m,n])=>`<button data-mechanic="${esc(m)}">${esc(m)} <small>×${n}</small></button>`).join('');
  $('#mechanicChips').onclick=e=>{const b=e.target.closest('[data-mechanic]');if(!b)return;$('#search').value=b.dataset.mechanic;location.hash='cards';applyFilters()};
  $('#mechanicFeatures').innerHTML=ranked.map(([m,n],i)=>{
    const cards=state.all.filter(c=>mechanicWords(c).some(x=>x.toLowerCase()===m.toLowerCase())).slice(0,3),bg=cards.find(c=>artFor(c))||cards[0],colors=[...new Set(cards.map(normFrame))];
    return `<article class="mechanic-feature">
      <div class="mechanic-feature-bg" style="background-image:${bg&&artFor(bg)?'url(&quot;'+esc(artFor(bg)).replace(/"/g,'%22')+'&quot;)':'none'}"></div>
      <div class="mechanic-copy"><div class="mechanic-index">MECHANIC ${String(i+1).padStart(2,'0')} · ${n} CURRENT CANDIDATES</div><h3>${esc(m)}</h3><p>${esc(mechanicDescription(m,cards))}</p><div class="mechanic-colors">${colors.map(c=>'<span class="color-pip '+c+'" title="'+c+'"></span>').join('')}<small>${colors.join(' · ')}</small></div><button class="mechanic-action" data-mechanic="${esc(m)}">See every ${esc(m)} candidate</button></div>
      <div class="mechanic-cards">${cards.map(c=>cardHTML(c,{meta:false})).join('')}</div>
    </article>`;
  }).join('');
  $('#mechanicFeatures').addEventListener('click',e=>{const card=e.target.closest('.card-tile');if(card){openCard(state.all.find(c=>+c.number===+card.dataset.number));return}const b=e.target.closest('[data-mechanic]');if(b){$('#search').value=b.dataset.mechanic;location.hash='cards';applyFilters()}});
}
function hero(){const candidates=state.all.filter(c=>rarity(c.rarity)==='M'||rarity(c.rarity)==='R');const c=candidates[Math.floor(candidates.length*.38)]||state.all[0];$('#heroCardStage').innerHTML=cardHTML(c);$('#heroMeta').textContent=`${state.all.length} working candidates · 0 confirmed cards · live development file`}

function promoSelected(){
  return [...document.querySelectorAll('.promo-card-select')].map(s=>state.all.find(c=>+c.number===+s.value)).filter(Boolean).slice(0,5);
}
function promoOptions(selected=''){
  return '<option value="">— none —</option>'+state.all.map(c=>'<option value="'+Number(c.number)+'" '+(+selected===+c.number?'selected':'')+'>'+String(c.number).padStart(3,'0')+' · '+esc(c.displayName||c.name)+'</option>').join('');
}
function setupPromo(){
  const picks=[1,2,3,4,5];
  $('#promoCardPickers').innerHTML=picks.map((n,i)=>'<label class="promo-picker"><b>'+n+'</b><select class="promo-card-select" aria-label="Promo card '+n+'">'+promoOptions(i<3?state.all.filter(c=>rarity(c.rarity)==='M'||rarity(c.rarity)==='R')[i]?.number:'')+'</select></label>').join('');
  document.querySelectorAll('.promo-card-select').forEach(s=>s.addEventListener('input',renderPromo));
  $('#promoFormat').addEventListener('input',renderPromo);
  $('#promoHeadline').addEventListener('input',renderPromo);
  $('#promoBackground').addEventListener('input',renderPromo);
  $('#promoRandomize').onclick=()=>{const pool=[...state.all].sort(()=>Math.random()-.5).slice(0,5);document.querySelectorAll('.promo-card-select').forEach((s,i)=>s.value=pool[i]?.number||'');renderPromo()};
  $('#promoFullscreen').onclick=()=>togglePromoFullscreen(true);
  $('#promoStage').onclick=()=>{if(document.body.classList.contains('promo-fullscreen'))togglePromoFullscreen(false)};
  $('#promoDownload').onclick=downloadPromo;
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('promo-fullscreen'))togglePromoFullscreen(false)});
  renderPromo();
}
function togglePromoFullscreen(on){
  document.body.classList.toggle('promo-fullscreen',on);
  $('#promoStage').classList.toggle('fullscreen-preview',on);
}
function renderPromo(){
  const cards=promoSelected(),stage=$('#promoStage'),format=$('#promoFormat').value;
  stage.classList.remove('landscape','square','portrait','story');stage.classList.add(format);
  $('#promoStageHeadline').textContent=$('#promoHeadline').value.trim()||'THE LONG WAY HOME';
  const oldBg=$('#promoBackground').value;
  $('#promoBackground').innerHTML=cards.map((c,i)=>'<option value="'+c.number+'">'+(i+1)+' · '+esc(c.displayName||c.name)+'</option>').join('')||'<option value="">Select a card first</option>';
  if(cards.some(c=>String(c.number)===oldBg))$('#promoBackground').value=oldBg;
  const bg=cards.find(c=>String(c.number)===$('#promoBackground').value)||cards[0],url=bg?artFor(bg):'';
  const cssUrl=url?'url("'+String(url).replace(/"/g,'%22')+'")':'none';
  $('#promoBg').style.backgroundImage=cssUrl;$('#promoBgMirror').style.backgroundImage=cssUrl;
  $('#promoCards').className='promo-cards count-'+cards.length;
  $('#promoCards').innerHTML=cards.map(c=>cardHTML(c,{meta:false})).join('');
  $('#promoStatus').textContent=cards.length?cards.length+' card'+(cards.length===1?'':'s')+' selected · background: '+(bg?.displayName||bg?.name||'none'):'Select up to five cards. Card 1 is used as the background by default.';
}
function loadCanvasImage(url){
  return new Promise((resolve,reject)=>{if(!url)return reject(new Error('no image'));const img=new Image();img.crossOrigin='anonymous';img.referrerPolicy='no-referrer';img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('image unavailable'));img.src=url});
}
function coverImage(ctx,img,x,y,w,h){
  const s=Math.max(w/img.naturalWidth,h/img.naturalHeight),sw=w/s,sh=h/s,sx=(img.naturalWidth-sw)/2,sy=(img.naturalHeight-sh)/2;
  ctx.drawImage(img,sx,sy,sw,sh,x,y,w,h);
}
function roundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill()}
async function drawPromoCard(ctx,c,x,y,w,h){
  ctx.save();ctx.shadowColor='rgba(0,0,0,.55)';ctx.shadowBlur=w*.08;ctx.shadowOffsetY=w*.04;ctx.fillStyle='#181713';roundRect(ctx,x,y,w,h,w*.045);ctx.shadowColor='transparent';
  const pad=w*.035;ctx.fillStyle=({W:'#c4b58b',U:'#557e96',B:'#655d65',R:'#a85f48',G:'#5b7957',M:'#a6884d',L:'#80684c',C:'#77736a'})[normFrame(c)]||'#77736a';roundRect(ctx,x+pad,y+pad,w-pad*2,h-pad*2,w*.025);
  ctx.fillStyle='#eee7d4';ctx.fillRect(x+pad*1.6,y+pad*1.7,w-pad*3.2,h*.075);
  ctx.fillStyle='#211d17';ctx.font='700 '+Math.max(10,w*.052)+'px Georgia';ctx.textBaseline='middle';ctx.fillText(String(c.displayName||c.name).slice(0,28),x+pad*2.1,y+pad*1.7+h*.037,w-pad*4.2);
  const ax=x+pad*1.7,ay=y+h*.125,aw=w-pad*3.4,ah=h*.47;ctx.fillStyle='#4f4b40';ctx.fillRect(ax,ay,aw,ah);
  try{const img=await loadCanvasImage(artFor(c));coverImage(ctx,img,ax,ay,aw,ah)}catch(e){}
  ctx.fillStyle='#f4efe1';ctx.fillRect(ax,y+h*.61,aw,h*.055);ctx.fillStyle='#29251e';ctx.font='700 '+Math.max(8,w*.038)+'px Georgia';ctx.fillText(String(c.type||'').slice(0,34),ax+pad*.6,y+h*.637,aw-pad);
  ctx.fillStyle='#faf7ef';ctx.fillRect(ax,y+h*.675,aw,h*.22);ctx.font=Math.max(7,w*.031)+'px Georgia';ctx.fillStyle='#2a261f';const rule=String(c.rules||'').replace(/\s+/g,' ');const words=rule.split(' ');let line='',ly=y+h*.705;for(const word of words){const t=line+word+' ';if(ctx.measureText(t).width>aw-pad&&line){ctx.fillText(line,ax+pad*.6,ly,aw-pad);line=word+' ';ly+=w*.04;if(ly>y+h*.86)break}else line=t}if(ly<=y+h*.86)ctx.fillText(line,ax+pad*.6,ly,aw-pad);
  ctx.restore();
}
async function downloadPromo(){
  const button=$('#promoDownload'),cards=promoSelected();if(!cards.length)return;
  button.disabled=true;$('#promoStatus').textContent='Rendering social preview…';
  const dims={landscape:[1200,630],square:[1080,1080],portrait:[1080,1350],story:[1080,1920]},[W,H]=dims[$('#promoFormat').value]||dims.landscape;
  const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;const ctx=canvas.getContext('2d');
  ctx.fillStyle='#171611';ctx.fillRect(0,0,W,H);
  const bg=cards.find(c=>String(c.number)===$('#promoBackground').value)||cards[0];
  try{const img=await loadCanvasImage(artFor(bg));ctx.save();ctx.filter='blur('+Math.round(W*.028)+'px) saturate(.9) brightness(.55)';coverImage(ctx,img,-W*.06,-H*.06,W*1.12,H*1.12);ctx.restore();ctx.save();ctx.globalAlpha=.6;ctx.translate(0,H);ctx.scale(1,-1);ctx.filter='blur('+Math.round(W*.035)+'px) brightness(.48)';coverImage(ctx,img,-W*.04,-H*.52,W*1.08,H*.66);ctx.restore()}catch(e){}
  const grad=ctx.createRadialGradient(W*.52,H*.42,W*.08,W*.52,H*.42,W*.7);grad.addColorStop(0,'rgba(0,0,0,0)');grad.addColorStop(1,'rgba(0,0,0,.72)');ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
  const lx=W*.055,ly=H*.09;ctx.fillStyle='#ded2b5';ctx.font='800 '+Math.round(W*.012)+'px Arial';ctx.fillText('A CUSTOM MAGIC SET',lx,ly);ctx.fillStyle='#f2dfaa';ctx.font='800 '+Math.round(W*.072)+'px Georgia';ctx.fillText('ODYSSEY',lx,ly+W*.07);ctx.fillStyle='#d2b66d';ctx.fillRect(lx,ly+W*.083,W*.2,2);ctx.fillStyle='#e3d9c2';ctx.font='800 '+Math.round(W*.014)+'px Arial';ctx.fillText(($('#promoHeadline').value||'THE LONG WAY HOME').toUpperCase(),lx,ly+W*.11);
  let cardW,cardH;if(H/W>1.4){cardW=W*(cards.length<=2?.39:.27)}else{cardW=W*(cards.length===1?.28:cards.length===2?.24:cards.length===3?.20:cards.length===4?.175:.15)}cardH=cardW*88/63;
  const gap=cardW*.07,total=cards.length*cardW+(cards.length-1)*gap;let startX=(W-total)/2;if(H/W<1.1)startX=W-total-W*.045;const cy=H*(H/W>1.4?.52:.59)-cardH/2;
  for(let i=0;i<cards.length;i++)await drawPromoCard(ctx,cards[i],startX+i*(cardW+gap),cy+(i%2? -cardH*.025:cardH*.018),cardW,cardH);
  ctx.fillStyle='rgba(244,237,220,.8)';ctx.font=Math.round(W*.011)+'px Arial';ctx.fillText('kliawota.design/mtgtools/Odyssey/scry',lx,H*.95);
  try{const a=document.createElement('a');a.download='odyssey-social-'+$('#promoFormat').value+'.png';a.href=canvas.toDataURL('image/png',.95);a.click();$('#promoStatus').textContent='PNG created. Background: '+(bg.displayName||bg.name)}catch(e){$('#promoStatus').textContent='Preview is ready, but this artwork host blocks browser PNG export. Use full-screen preview for capture.'}
  button.disabled=false;
}

async function init(){try{const r=await fetch(DATA_URL,{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);const d=await r.json();state.all=Array.isArray(d.cards)?d.cards:[];hydrateArt(d);hero();mechanics();applyFilters();setupPromo();const hash=location.hash.match(/^#card-(\d+)$/);if(hash)openCard(state.all.find(c=>+c.number===+hash[1]),false)}catch(e){$('#cardGrid').innerHTML='<p>Odyssey set data could not be loaded. Please refresh the page.</p>';$('#resultCount').textContent='Data unavailable';console.error(e)}}
['search','colorFilter','rarityFilter','sort'].forEach(id=>$('#'+id).addEventListener('input',()=>applyFilters()));document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-view]').forEach(x=>x.classList.toggle('active',x===b));state.view=b.dataset.view;$('#cardGrid').classList.toggle('compact',state.view==='compact')});$('#cardGrid').addEventListener('click',e=>{const t=e.target.closest('.card-tile');if(t)openCard(state.all.find(c=>+c.number===+t.dataset.number))});$('#cardGrid').addEventListener('keydown',e=>{if(e.key==='Enter'){const t=e.target.closest('.card-tile');if(t)openCard(state.all.find(c=>+c.number===+t.dataset.number))}});$('#randomCard').onclick=()=>openCard(state.all[Math.floor(Math.random()*state.all.length)]);$('#dialogClose').onclick=()=>{$('#cardDialog').close();history.replaceState(null,'',location.pathname+'#cards')};$('#cardDialog').addEventListener('click',e=>{if(e.target===$('#cardDialog'))$('#dialogClose').click()});new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting))renderMore()},{rootMargin:'900px'}).observe($('#loadSentinel'));init();