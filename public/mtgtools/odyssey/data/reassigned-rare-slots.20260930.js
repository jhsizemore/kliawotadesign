/* Five nonland prototypes occupy the rare slots freed by the duplicate duals.
 * Their former dual designs remain in retired-dual-archive.20260930.json. */
(function(root){
'use strict';
const MARKER='rare-nondual-prototypes-20260930';
const DESIGNS={
 72:{name:'Temple of Poseidon',mana:'{2}{U}{R}',color:'UR',type:'Legendary Enchantment',
  mechanics:'Scry; play from exile',archetypes:'UR — scry / exile / voyage',
  rules:'Whenever you scry, exile the top card of your library. You may play that card until the end of your next turn. This ability triggers only once each turn.',
  story:'A coastal sanctuary to Poseidon, whose anger delays the homeward voyage.',sourceBand:'Odyssey Books V and XIII; later depiction of Cape Sounion',
  rationale:'The common locale cycle supplies scry; the sanctuary turns one omen each turn into a risky new route.',
  art:'ART-880',credit:'Art: Karl (Charles) Ross · Wikimedia Commons',source:'https://commons.wikimedia.org/wiki/File:Charles_Ross_-_Temple_of_Poseidon_at_Cape_Sounion.png',imageUrl:'https://kliawota.design/mtgtools/odyssey/assets/sanctuaries/ART-880.sanctuary-v1.jpg',cycleIds:['group.gods','cast.poseidon','story.poseidon-storm']},
 193:{name:'Tomb of Achilles',mana:'{1}{W}{B}',color:'WB',type:'Legendary Enchantment',
  mechanics:'Creature recovery; legendary attack; life drain',archetypes:'WB — return / legends / remembrance',
  rules:'When Tomb of Achilles enters, return up to one target creature card from your graveyard to your hand.\nWhenever one or more legendary creatures you control attack, each opponent loses 1 life and you gain 1 life. This ability triggers only once each turn.',
  story:'The remembered burial of Achilles after the fighting at Troy.',sourceBand:'Iliad Book XXIII; Odyssey Book XXIV; later site depiction',
  rationale:'Retrieval and repeated legendary attacks carry the dead hero’s memory into play without repeating the dual land.',
  art:'ART-684',credit:'Art: William Gell · Aikaterini Laskaridis Foundation / Travelogues',source:'https://eng.travelogues.gr/item.php?view=50871',imageUrl:'https://kliawota.design/mtgtools/odyssey/assets/landscapes/ART-684.383556786a1b.jpg',cycleIds:['story.trojan-war-and-youth']},
 194:{name:'Sacred Grove of Persephone',mana:'{1}{B}{G}',color:'BG',type:'Legendary Enchantment',
  mechanics:'Self-mill; graveyard departure; Plant tokens',archetypes:'BG — graveyard / escape / renewal',
  rules:'When Sacred Grove of Persephone enters, mill three cards.\nWhenever one or more cards leave your graveyard, create a 1/1 green Plant creature token and you gain 1 life. This ability triggers only once each turn.',
  story:'A shadowed sacred grove evokes the passage between the living world and Persephone’s realm.',sourceBand:'Odyssey Book XI; later evocative grove image',
  rationale:'Cards crossing out of the graveyard make life return to the grove and support the set’s graveyard play.',
  art:'ART-881',credit:'Art: Arnold Böcklin · Kunstmuseum Basel',source:'https://commons.wikimedia.org/wiki/File:Sacred_Grove_(1882)_-_Arnold_B%C3%B6cklin_(Kunstmuseum_Basel).jpg',imageUrl:'https://kliawota.design/mtgtools/odyssey/assets/sanctuaries/ART-881.sanctuary-v1.jpg',cycleIds:['story.underworld','cast.persephone']},
 195:{name:'Statue of Zeus',mana:'{2}{R}{W}',color:'RW',type:'Legendary Enchantment Artifact',
  mechanics:'Legendary combat; vigilance; Treasure',archetypes:'RW — legends / combat / devotion',
  rules:'At the beginning of combat on your turn, up to one target creature you control gets +2/+0 and gains vigilance until end of turn. If that creature is legendary, create a Treasure token.',
  story:'Zeus’s image at Olympia becomes a later visual emblem of divine favor and heroic renown.',sourceBand:'Greek sanctuary / later visual reception; Odyssey-wide divine frame',
  rationale:'The statue grants a champion a combat boon and rewards a named hero; its pictured sanctuary belongs to later visual reception.',
  art:'ART-882',credit:'Art: Philips Galle, after Maarten van Heemskerck · Rijksmuseum',source:'https://www.rijksmuseum.nl/en/collection/object/Standbeeld-van-Zeus-in-Olympia--b456a059e464d3689bbfdd4b68b4bbae',imageUrl:'https://kliawota.design/mtgtools/odyssey/assets/sanctuaries/ART-882.sanctuary-v1.jpg',cycleIds:['group.gods','flavor.greek-concepts']},
 196:{name:'Palace of Circe',mana:'{2}{G}{U}',color:'GU',type:'Legendary Enchantment',
  mechanics:'Manifest fate; face-down attacks; temporary transformation',archetypes:'GU — manifest fate / transformation / combat',
  rules:'When Palace of Circe enters, manifest fate.\nWhenever one or more face-down creatures you control attack, up to one target creature an opponent controls becomes a 2/2 green Boar creature and loses all abilities until end of turn. This ability triggers only once each turn.',
  story:'Odyssey Book X / Circe’s palace on Aeaea receives the crew and transforms them into swine.',sourceBand:'Odyssey Book X; seventeenth-century visual reception',
  rationale:'The face-down guest becomes a way to transform an opposing creature for combat, matching the selected palace scene.',
  art:'ART-883',credit:'Art: W. S. van Ehrenberg & C. B. A. Ruthart · Getty Museum',source:'https://www.getty.edu/art/collection/object/103RB8',imageUrl:'https://kliawota.design/mtgtools/odyssey/assets/sanctuaries/ART-883.sanctuary-v1.jpg',cycleIds:['story.circe-aeaea','cast.circe']}
};
function words(s){return String(s||'').trim().split(/\s+/).filter(Boolean).length;}
function updateSheetRows(sync){
 if(!Array.isArray(sync?.cardRows))return;
 for(const row of sync.cardRows){const d=DESIGNS[Number(row[0])];if(!d)continue;
  row[1]=row[14]=d.name;row[2]=d.mana;row[3]=Number(d.mana.match(/\{\d+\}/)?.[0].replace(/\D/g,'')||0)+2;row[4]=d.color;row[5]=d.type;row[6]='—';row[8]='New';
  row[9]=d.mechanics;row[10]=d.rules;row[11]=d.archetypes;row[12]=row[29]=row[36]=d.story;row[13]='PROTOTYPE';
  row[15]=row[16]='';row[17]=d.art;row[18]=d.credit;row[19]=d.source;row[21]=d.cycleIds.join('; ');
  row[26]=words(d.rules);if(!String(row[27]||'').includes(MARKER))row[27]=[row[27],MARKER].filter(Boolean).join(' · ');
  row[28]=Number(row[0])===195?'Later visual reception':'Odyssey';row[30]='NO';row[31]=d.sourceBand;
  row[32]='YES';row[35]=Number(row[0])===196?'Studio artwork reviewing; final art approval pending':'Studio artwork locked; final print and rights review pending';row[38]=d.rationale;
 }
}
function apply(data){
 if(!data||!Array.isArray(data.cards))return data;
 for(const card of data.cards){const d=DESIGNS[Number(card.number)];if(!d)continue;
  Object.assign(card,{name:d.name,displayName:d.name,mana:d.mana,mv:Number(d.mana.match(/\{\d+\}/)?.[0].replace(/\D/g,'')||0)+2,color:d.color,frame:'M',type:d.type,pt:'',
   origin:'NEW',originFull:'New',underlyingName:'',treatment:'',layout:'standard',mechanics:d.mechanics,rules:d.rules,
   archetypes:d.archetypes,story:d.story,status:'PROTOTYPE',flavor:'',primaryArt:d.art,credit:d.credit,source:d.source,
   imageUrl:data.artworks?.find(a=>a.id===d.art)?.imageUrl||d.imageUrl,cycleIds:d.cycleIds,
   storyTarget:d.story,narrativeEra:Number(card.number)===195?'Later visual reception':'Odyssey',storyRethemeRequired:false,storySourceBand:d.sourceBand,
   flavorStoryElement:d.story,flavorMatchScore:null,flavorMatchRationale:d.rationale,
   artReviewRequired:true,reviewArtworkOptions:Number(card.number)===196?'Studio artwork reviewing; final art approval pending':'Studio artwork locked; final print and rights review pending',functionalWords:words(d.rules),rulesSource:'Nondual rare prototype · 2026-09-30',
   designDisposition:'ACTIVE_PROTOTYPE'});
  if(!String(card.changeStatus||'').includes(MARKER))card.changeStatus=[card.changeStatus,MARKER].filter(Boolean).join(' · ');
 }
 for(const coverage of data.coverage||[]){const d=DESIGNS[Number(coverage.number)];if(!d)continue;
  coverage.primary=d.art;coverage.status='SELECTED';coverage.creditReady='YES';
  coverage.candidateIds=[...new Set([...(coverage.candidateIds||[]),d.art])];
  if(!String(coverage.notes||'').includes(MARKER))coverage.notes=[MARKER+': '+d.rationale,coverage.notes].filter(Boolean).join('\n\n');
 }
 data.emptySlots={revision:MARKER,count:0,slots:[],reason:'Five former duplicate dual slots reassigned to nonland rare prototypes.'};
 data.reassignedRareSlots={revision:MARKER,numbers:Object.keys(DESIGNS).map(Number),archive:'retired-dual-archive.20260930.json',status:'prototype / playtest'};
 return data;
}
root.OdysseyReassignedRareSlots={designs:DESIGNS,apply};
updateSheetRows(root.OdysseySheetSync);
if(root.ODYSSEY_DATA)root.ODYSSEY_DATA=apply(root.ODYSSEY_DATA);
if(typeof module!=='undefined'&&module.exports)module.exports={designs:DESIGNS,apply};
})(typeof window!=='undefined'?window:globalThis);
