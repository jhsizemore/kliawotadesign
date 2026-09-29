/* Launch explanations are labelled working interpretations, not quoted card text.
 * Canonical rules, artwork assignments, Studio crops and the renderer remain untouched.
 */
(function(root){
'use strict';
const E=s=>root.OdysseyExhibitionCore.esc(s);
const features={
 fate:{artId:'ART-454',position:'62% 30%',landscapeNote:'The Gulf of Naples with Ischia in the distance: an open Mediterranean horizon, not a claimed view of Ithaca.',spotlight:{number:63,label:'Manifest Fate',kind:'Working rule',definition:'Look at the top two cards of your library. Manifest one of them face down as a 2/2 creature, then exile the other.',pick:t=>t.split('\n').slice(0,2).join('\n')}},
 survival:{artId:'ART-453',position:'65% 45%',landscapeNote:'Winslow Homer’s Northeaster: a seascape used for the force of the waves, not a Homeric location.',spotlight:{number:17,label:'Survival & Ordeals',kind:'Working implementation',definition:'The current Ordeals check whether their enchanted creature is tapped at the start of your second main phase. If it is, add a +1/+1 counter; at three or more counters, sacrifice the Ordeal for its final reward.',pick:t=>t.split('\n').find(s=>s.startsWith('Survival'))}},
 sagas:{artId:'ART-260',position:'70% 35%',landscapeNote:'Manglard’s stormy seascape sets the encounter in a threatening environment. The cards keep their own monster illustrations.',spotlight:{number:209,label:'Living Sagas',kind:'Working treatment',definition:'A creature and a story in one permanent. It fights on the battlefield while lore counters advance its chapter abilities. The featured encounters end after their final chapter.',pick:t=>t.split('\n').find(s=>s.startsWith('I —'))}},
 gods:{artId:'ART-303',position:'60% 32%',landscapeNote:'Waterfalls and the Temple of Vesta at Tivoli: a sacred landscape, not a reconstruction of a site in Homer.',spotlight:{number:198,label:'Gods & Devotion',kind:'Working implementation',definition:'Devotion counts coloured mana symbols in the costs of permanents you control. These indestructible enchantment Gods become creatures when your devotion to their two colours reaches seven.',pick:t=>t.match(/As long as your devotion[^.]+\./)?.[0]}},
 omens:{artId:'ART-570',position:'62% 32%',landscapeNote:'Monte Circeo at sunset, painted by John Robert Cozens: an actual Italian coastal view with room for wonder.',spotlight:{number:116,label:'Omens & Constellation',kind:'Thematic package',definition:'Cast an Omen at instant speed for an immediate effect, then sacrifice it later for another reward. Constellation makes an enchantment’s arrival an event the rest of your deck can answer.',pick:t=>t}},
 return:{artId:'ART-170',position:'68% 45%',landscapeNote:'John Warwick Smith’s Italian coast: a quiet landfall used as atmosphere, not a claim that this is Ithaca.',spotlight:{number:36,label:'Homecoming',kind:'Thematic package',definition:'Exile a creature, then bring it back to the battlefield. Reuse an entrance or reveal a hidden identity. Recognition cards reward those returns; some also recognise a return from the graveyard.',pick:t=>t.split('\n').find(s=>s.startsWith('Whenever'))}},
 landfalls:{artId:'ART-289',position:'65% 32%',landscapeNote:'Claude Lorrain’s harbour scene of Odysseus returning Chryseis: a Homeric episode from the Iliad, not a view of Troy’s fall.',spotlight:{number:229,label:'Troy to Ithaca',kind:'Working treatment',definition:'At its final chapter, The Siege of Troy exiles itself and returns transformed as The Wooden Horse. Adventure lands offer a spell first and a destination later: the journey changes what a card can be.',pick:t=>t.split('\n').find(s=>s.startsWith('III —'))}},
 relics:{artId:'ART-306',position:'65% 32%',landscapeNote:'John Martin’s imagined ruins: a monumental architectural landscape, not evidence for an excavated Homeric city.',spotlight:{number:295,label:'Divine Relics',kind:'Working implementation',definition:'The featured divine implements equip for {1}, but only when your devotion to their two colours is five or greater. Their influence begins before a creature bears them.',pick:t=>t.split('\n').find(s=>/^Equip\s/.test(s)&&/devotion/i.test(s))}}
};
function register(cat){
 const additions=root.OdysseyEditorialAssets;
 if(!additions?.['EXH-PAPYRUS']||!additions?.['EXH-AUTOLYCUS'])throw Error('Historical editorial assets are unavailable.');
 for(const a of Object.values(additions)){
  if(!a.image?.startsWith('/mtgtools/Odyssey/scry/assets/editorial/')||!/^https:\/\//.test(a.source)||a.blocked)throw Error('Invalid editorial source: '+a.id);
  const existing=cat.arts.get(a.id);
  if(existing&&(existing.title!==a.title||existing.source!==a.source))throw Error('The artwork record changed. Review its editorial placement: '+a.id);
  cat.arts.set(a.id,{...existing,...a});
 }
}
function excerpt(cat,id){const spec=features[id]?.spotlight,c=cat.cards.find(c=>c.number===spec?.number);if(!c)throw Error('Rules spotlight card missing: '+id);const text=spec.pick(String(c.rules||''));if(!text||!String(c.rules).includes(text))throw Error('Rules spotlight wording changed: '+id);return {card:c,label:spec.label,text,definition:spec.definition,kind:spec.kind};}
function rules(cat,feature){const x=excerpt(cat,feature.id),renderer=root.OdysseyStudioRenderer.engine;return '<aside class="rules-spotlight" data-rules-card="'+x.card.number+'" data-rule-kind="'+E(x.kind)+'" aria-label="'+E(x.label)+' working interpretation"><div class="spotlight-heading"><span>'+E(x.label)+'</span><small>'+E(x.kind.toUpperCase())+'</small></div><div class="spotlight-oracle">'+renderer.rules(x.definition)+'</div><p class="spotlight-development">Current interpretation; this may change during development.</p><button type="button" class="spotlight-source" data-card="'+x.card.number+'">See it in play: '+E(x.card.displayName)+' ↗</button></aside>';}
function prepareHeroImage(hero){
 let prepared=null;const wrapper=document.getElementById('heroCard');
 const prepare=()=>{
  const image=hero.shadowRoot?.querySelector('.art-img');if(!image||image===prepared)return;
  prepared=image;hero.dataset.artPaint='loading';wrapper.classList.remove('tilt-ready');image.loading='eager';image.decoding='sync';
  image.decode().then(()=>{
   if(prepared!==image||!image.isConnected)return;hero.fit?.();
   requestAnimationFrame(()=>{if(prepared!==image||!image.isConnected)return;wrapper.classList.add('tilt-ready');requestAnimationFrame(()=>requestAnimationFrame(()=>{if(prepared===image&&image.isConnected)hero.dataset.artPaint='ready';}));});
  }).catch(()=>{if(prepared===image)hero.dataset.artPaint='unavailable';});
 };
 if(hero.shadowRoot)new MutationObserver(prepare).observe(hero.shadowRoot,{childList:true,subtree:true});prepare();
}
function finish(){
 const api=root.OdysseyExhibition,hero=document.querySelector('#heroCard odyssey-studio-card');if(!api||!hero)return;
 hero.setAttribute('frame-style','full-art');prepareHeroImage(hero);
 const heading=document.querySelector('#mechanics .section-heading'),a=api.catalogue.arts.get('EXH-PAPYRUS');
 if(heading&&!heading.querySelector('.epic-artifact')){
  heading.classList.add('epic-introduction');
  heading.querySelector('.eyebrow').textContent='AN ANCIENT STORY. A NEW WAY TO PLAY.';
  heading.querySelector('.lead').textContent='After Troy, Odysseus struggles home to Ithaca. Gods, monsters and dangerous hospitality test him at sea, while Penelope and Telemachus defend their home.';
  heading.querySelector('.fine').textContent='Eight ways to bring the epic to the battlefield. Every design is still in development.';
  const fragment=document.createElement('figure');fragment.className='epic-artifact';fragment.id='epicArtifact';
  fragment.innerHTML='<button type="button" data-art="'+a.id+'" aria-label="Explore a genuine papyrus fragment of the Odyssey"><img src="'+E(a.detail.url)+'" width="'+a.detail.width+'" height="'+a.detail.height+'" alt="Ancient papyrus fragment bearing lines from Odyssey Book 20" loading="lazy"></button><figcaption><strong>The Odyssey, on papyrus</strong><span>Book 20 · '+E(a.date)+'</span><a href="'+E(a.source)+'" target="_blank" rel="noopener noreferrer">The Met · 09.182.50 ↗</a></figcaption>';
  const figure=document.createElement('figure');figure.className='ship-emblem';figure.innerHTML=root.OdysseyStudioRenderer.engine.symbol('C')+'<figcaption><strong>The black-hulled ship</strong><span>Our emblem for Odysseus’s voyage: a stylised ancient oared ship—not a recovered flagship.</span></figcaption>';
  figure.querySelector('.set-symbol').removeAttribute('title');const svg=figure.querySelector('svg');svg.setAttribute('role','img');svg.setAttribute('aria-hidden','false');svg.setAttribute('aria-label','Odyssey set symbol: an imagined ancient oared ship with a square sail and curved prow');
  heading.append(fragment,figure);
 }
 const image=document.getElementById('spoilerImage'),caption=document.getElementById('spoilerCredit'),section=document.getElementById('preview');
 if(image&&caption&&!section.querySelector('.spoiler-inset')){
  const figure=document.createElement('figure');figure.className='spoiler-inset';const art=api.catalogue.arts.get('EXH-AUTOLYCUS');
  image.classList.remove('section-art');const button=document.createElement('button');button.type='button';button.className='inset-art-button';button.dataset.art=art.id;button.setAttribute('aria-label','View Leslie’s Autolycus showing his wares');button.append(image);
  const label=document.createElement('figcaption');label.append(caption);figure.append(button,label);section.append(figure);
 }
 document.documentElement.dataset.rulesSpotlights='ready';document.dispatchEvent(new CustomEvent('odyssey:rules-spotlights-ready'));
}
root.OdysseySetShowcase={features,rules,excerpt,register,finish};
if(root.OdysseyFocusedLaunch)finish();else document.addEventListener('odyssey:focused-launch-ready',finish,{once:true});
})(window);
