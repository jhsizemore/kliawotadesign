/* Deterministic launch art direction. Edit PLAN to change artwork or focal points.
 * Never edits the catalogue, card assignments, card crops, Sheets or the renderer.
 */
(function(){
'use strict';
if(document.body.dataset.page!=='launch')return;
const C=window.OdysseyExhibitionCore;
const PLAN={
 version:'20260929-focused1',
 hero:{artId:'ART-239',cardId:'ODY-061',position:'48% 42%',intent:'Turner’s charged departure: a luminous sea, enormous scale, pride and peril. Not a collage of plot points.'},
 participation:{artId:'ART-236',position:'center 22%',intent:'Draper, not the Waterhouse face tile. Full-bleed encounter with a left gradient; preserve the captain and approaching Sirens.'},
 spoiler:{cardId:'ODY-303',position:'82% 25%',intent:'Resolve the artwork currently assigned to Autolycus. Preserve its actual catalogue title, Mercury.'}
};
const cycle=(c,id)=>(c.cycleIds||[]).includes(id),rules=(c,re)=>re.test(c.rules||'');
const FEATURES=[
 {id:'fate',tab:'Manifest Fate',name:'Nobody today.\nA hero tomorrow.',hook:'Your next identity is waiting to be revealed.',text:'Build a battlefield of hidden possibilities. Named Nobody protects your face-down creatures; Athena and Odysseus reward the moments when you reveal one or cast from exile.',tags:['Manifest Fate','Hidden identities'],featured:[63,308],artId:'ART-250',position:'67% 40%',mood:'mist',match:c=>rules(c,/manifest fate/i)},
 {id:'survival',tab:'Survival & Ordeals',name:'Ordeals return.\nSurvive them.',hook:'Getting through combat is only the beginning.',text:'Five new Ordeals revisit a Theros favourite. A tapped survivor grows stronger in your second main phase, then earns a final reward. Attack, crew a ship, or find another way to commit your crew.',tags:['Survival','Five-colour Ordeal cycle','Crewing'],featured:[17,64],artId:'ART-021',position:'62% 35%',mood:'paint',match:c=>rules(c,/\bSurvival\b/)||/Vehicle/.test(c.type||'')},
 {id:'sagas',tab:'Living Sagas',name:'The monster\nis the story.',hook:'Survive the encounter, one chapter at a time.',text:'Scylla takes her toll across three chapters. The Lotus-Eaters offer food and stillness before a sudden, trampling return to action. Saga creatures turn the famous encounters into stories that unfold on the battlefield.',tags:['Saga creatures','Scylla','The Lotus-Eaters'],featured:[209,222],artId:'ART-297',position:'70% 38%',mood:'sea',match:c=>/Saga/.test(c.type||'')&&/Creature/.test(c.type||'')},
 {id:'gods',tab:'Gods & Devotion',name:'The gods take\nyour side. Or not.',hook:'Divine favour is something you build.',text:'Athena shields your hidden crew. Poseidon stirs the sea around attacking ships. Indestructible enchantment Gods become creatures when your colour commitment is strong enough—a familiar Theros idea in Homer’s world.',tags:['Devotion','Enchantment Gods'],featured:[62,198],artId:'ART-418',position:'68% 30%',mood:'stone',match:c=>/\bGod\b/.test(c.type||'')||rules(c,/\bdevotion\b/i)},
 {id:'omens',tab:'Omens & Constellation',name:'Read the signs.\nChange your fate.',hook:'An enchantment is never just an enchantment.',text:'Flash in an Omen now; sacrifice it later to look ahead. Dreams, signs and a returning five-colour cycle feed an enchantment-rich world where constellation turns each new arrival into another opportunity.',tags:['Omens','Flash','Constellation'],featured:[116,4],artId:'ART-448',position:'65% 35%',mood:'paper',match:c=>cycle(c,'cycle.odyssey-omens')||rules(c,/\bconstellation\b/i)},
 {id:'return',tab:'Homecoming',name:'Leave. Return.\nBe recognised.',hook:'Homecoming is something your deck can do.',text:'Penelope’s patience sets up a return from exile. Eurycleia’s Basin recognises a revealed identity or a returning legend and turns it into another card. Blink, recover, and make the reunion matter.',tags:['Blink','Recognition','Return from exile'],featured:[199,36],artId:'ART-210',position:'68% 40%',mood:'paint',match:c=>rules(c,/exile[^.\n]*then return|enters from exile|from your graveyard|from exile or your graveyard/i)},
 {id:'landfalls',tab:'Troy to Ithaca',name:'From Troy\nto Ithaca.',hook:'The voyage changes the shape of your cards.',text:'The Siege of Troy transforms into the Wooden Horse. Adventure lands carry an episode on their way into your mana base. Revisit the war, remember the oath, and build your route home.',tags:['Transforming Sagas','Adventure lands'],featured:[229,188],artId:'ART-053',position:'65% 38%',mood:'paper',match:c=>cycle(c,'ff-analog-adventure-lands')||String(c.rules||'').includes('//BACK//')},
 {id:'relics',tab:'Divine Relics',name:'Earn the right\nto bear them.',hook:'A god’s weapon asks more than a little mana.',text:'Poseidon’s Trident and Athena’s Aegis influence the board before they are equipped. Their low equip costs are unlocked by devotion: build your faith, then put a divine implement into mortal hands.',tags:['Enchantment Equipment','Devotion-gated equip'],featured:[295,296],artId:'ART-425',position:'72% 48%',mood:'clay',match:c=>cycle(c,'cycle.divine-implements')}
];
// Only this launch uses eight highlights. The independent art exhibition keeps its own tour.
FEATURES.forEach(feature=>Object.assign(feature,window.OdysseySetShowcase.features[feature.id]));
C.mechanics=FEATURES;
function mount(){
 const api=window.OdysseyExhibition,cat=api.catalogue,$=id=>document.getElementById(id);
 window.OdysseySetShowcase.register(cat);
 const allocations=[];
 function artwork(id){
  const a=cat.arts.get(id);if(!a||!a.image||!a.source||a.blocked)throw Error('Source-linked launch artwork unavailable: '+id);
  const editorial=window.OdysseyEditorialAssets?.[id];
  if(editorial&&editorial.title===a.title&&editorial.source===a.source)return editorial;
  const j=window.OdysseyJourneyAssets?.assets?.[id];
  if(j&&j.title===a.title&&j.catalogueSource===a.source)return {...a,image:j.full.url,display:j.display,thumb:j.thumb.url,width:j.full.width,height:j.full.height};
  return a;
 }
 function picture(a,eager=false){
  const display=a.display||{url:a.image,width:a.width};
  const set=a.display?' srcset="'+C.esc(a.display.url)+' '+a.display.width+'w, '+C.esc(a.image)+' '+a.width+'w" sizes="100vw"':'';
  return '<img src="'+C.esc(display.url)+'"'+set+' alt="" width="'+a.width+'" height="'+a.height+'" loading="'+(eager?'eager':'lazy')+'" decoding="async"'+(eager?' fetchpriority="high"':'')+' data-artwork-id="'+a.id+'">';
 }
 function credit(a,note=''){
  return '<div class="launch-art-label"><strong>'+C.esc(a.title)+'</strong> · '+C.esc(a.artist)+' · '+C.esc(a.date||'Date not recorded')+'<span>'+C.esc([a.medium,a.institution].filter(Boolean).join(' · '))+'</span>'+(note?'<span>'+C.esc(note)+'</span>':'')+'<span class="art-links"><button type="button" class="text-button" data-art="'+a.id+'">Complete work &amp; attribution ↗</button><a href="'+C.esc(a.source)+'" target="_blank" rel="noopener noreferrer">Source record ↗</a></span></div>';
 }
 function place(host,a,slot,position,eager=false){
  if(allocations.some(x=>x.artId===a.id))throw Error('Duplicate main artwork: '+a.id);
  host.innerHTML=picture(a,eager);host.style.setProperty('--art-position',position);host.dataset.artworkSlot=slot;
  allocations.push({slot,artId:a.id,position,source:a.source});
 }
 const hero=artwork(PLAN.hero.artId),headline=cat.cards.find(c=>c.id===PLAN.hero.cardId);
 if(!headline)throw Error('Flagship Odysseus card is missing.');
 place($('heroImage'),hero,'hero',PLAN.hero.position,true);$('heroCredit').innerHTML=credit(hero);
 $('heroCard').innerHTML=api.cardHTML(headline);$('heroCard').querySelector('button').setAttribute('aria-label','Read '+headline.displayName+' — Magic card candidate');
 $('mechanicChapters').innerHTML=FEATURES.map((f,i)=>{
  const cards=f.featured.map(n=>cat.cards.find(c=>c.number===n));if(cards.some(c=>!c))throw Error('Missing featured candidate: '+f.id);
  const a=artwork(f.artId);allocations.push({slot:'highlight-'+f.id,artId:a.id,position:f.position,source:a.source});
  const matching=cat.cards.filter(f.match),colours=[...'WUBRG'].map(k=>[k,matching.filter(c=>c.colors.includes(k)).length]).filter(p=>p[1]);
  return '<article class="mechanic mood-'+f.mood+'" id="mechanic-'+f.id+'" aria-labelledby="highlight-title-'+f.id+'"><div class="mechanic-bg" data-artwork-slot="highlight-'+f.id+'" style="--art-position:'+f.position+'">'+picture(a)+'</div><div class="mechanic-copy"><p class="eyebrow">'+String(i+1).padStart(2,'0')+' / 08 · '+f.tags.map(C.esc).join(' / ')+'</p><h3 id="highlight-title-'+f.id+'">'+C.esc(f.name).replace(/\n/g,'<br>')+'</h3><p class="hook">'+C.esc(f.hook)+'</p><p>'+C.esc(f.text)+'</p>'+window.OdysseySetShowcase.rules(cat,f)+'<div class="feature-colours" aria-label="Colours across all matching candidates">'+colours.map(([k,n])=>'<span title="'+({W:'White',U:'Blue',B:'Black',R:'Red',G:'Green'}[k])+': '+n+' matching candidates">'+C.pip(k)+'<small>'+n+'</small></span>').join('')+'<span class="matching-count">'+matching.length+' related candidates</span></div><button type="button" class="button" data-group="mechanic:'+f.id+'">Explore these candidates ↗</button></div><div class="mechanic-cards">'+cards.map(c=>api.cardHTML(c)).join('')+'</div><div class="feature-credit">'+credit(a)+'<p class="landscape-context">'+C.esc(f.landscapeNote||'')+'</p></div></article>';
 }).join('');
 window.OdysseyMechanicCarousel=OdysseyCarousels.mount($('mechanicChapters'),{label:'Set highlights',titles:FEATURES.map(f=>f.tab)});
 const invitation=artwork(PLAN.participation.artId);place($('developmentImage'),invitation,'participation',PLAN.participation.position);$('developmentCredit').innerHTML=credit(invitation,'Cropped background composition; the complete painting is linked below.');
 const autolycus=cat.cards.find(c=>c.id===PLAN.spoiler.cardId);if(!autolycus?.artId)throw Error('Autolycus artwork assignment is missing.');
 const thiefArt=artwork('EXH-AUTOLYCUS');place($('spoilerImage'),thiefArt,'spoiler',PLAN.spoiler.position);$('spoilerCredit').innerHTML=credit(thiefArt,thiefArt.context);
 if(new Set(allocations.map(x=>x.artId)).size!==allocations.length)throw Error('A launch background has been repeated.');
 document.querySelectorAll('odyssey-studio-card').forEach(el=>el.fit?.());
 window.OdysseyFocusedLaunch={plan:PLAN,features:FEATURES,allocations,heroCard:headline.id};document.dispatchEvent(new CustomEvent('odyssey:focused-launch-ready'));
 return true;
}
function ready(){window.OdysseyFocusedLaunchReady=Promise.resolve().then(mount).catch(error=>{console.error(error);const note=document.getElementById('loadStatus');note.hidden=false;note.textContent='A launch feature could not load. Reload to retry. The candidate gallery remains available.';return false;});}
if(window.OdysseyExhibition)ready();else document.addEventListener('odyssey:exhibition-ready',ready,{once:true});
})();
