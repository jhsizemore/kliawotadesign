/* Resolve all open Odyssey Studio review notes captured 1 Oct 2026.
 * Loaded after the 29 Sep note pass, recast bones, locale lands and rare-slot reassignment.
 */
(function(root){
'use strict';
const P={
  "1": {
    "name": "Secret of the Olive Bed",
    "displayName": "Secret of the Olive Bed",
    "origin": "NEW",
    "originFull": "New",
    "underlyingName": "",
    "treatment": "",
    "mechanics": "Investigate; legendary payoff; recognition",
    "rules": "Investigate. If you control a legendary permanent, you gain 2 life.",
    "story": "Book XXIII / Penelope's final recognition turns on the secret that their marriage bed was built around a living olive trunk and cannot be moved.",
    "storyTarget": "Book XXIII / the secret of the rooted marriage bed proves Odysseus's identity to Penelope.",
    "flavorStoryElement": "Only Odysseus and Penelope know how the rooted bed was made; the clue is knowledge, not another ordeal.",
    "flavorMatchRationale": "The redesign removes another 'test' title and another common protection trick. Investigate makes the private fact itself the proof.",
    "status": "KEEP",
    "designDisposition": "",
    "functionalWords": 13
  },
  "9": {
    "primaryArt": "ART-543",
    "artId": "ART-543",
    "imageUrl": "https://collectionapi.metmuseum.org/api/collection/v1/iiif/253516/518476/main-image",
    "credit": "Art: The Metropolitan Museum of Art · Open Access",
    "source": "https://www.metmuseum.org/art/collection/search/253516",
    "fit": "contain",
    "zoom": 2.5403516846856733,
    "focusX": -17.3056577701035,
    "focusY": -6.682674619401909,
    "artReviewRequired": false
  },
  "16": {
    "mechanics": "Saga support; story selection; scry",
    "rules": "When this creature enters, look at the top four cards of your library. You may reveal an instant, sorcery, or Saga card from among them and put it into your hand. Put the rest on the bottom of your library in any order.\nWhenever one or more lore counters are put on a Saga you control, scry 1. This ability triggers only once each turn.",
    "flavorMatchRationale": "The household singer now explicitly finds Sagas and keeps pace with their chapters, making oral performance part of the set's Saga machinery."
  },
  "31": {
    "mechanics": "Gift a Food; Food; +1/+1 counter",
    "rules": "Gift a Food\nCreate a Food token. Put a +1/+1 counter on up to one target creature you control. If the gift was promised, you gain 3 life.",
    "flavorMatchRationale": "The meal now permanently strengthens any guest or ally without asking players to remember which creature entered this turn."
  },
  "74": {
    "mechanics": "Fight; survivor reward",
    "rules": "Target creature you control fights target creature you don't control. Then if the creature you control is still on the battlefield, put a +1/+1 counter on it.",
    "flavorMatchRationale": "The spell is useful when the opposing creature dies; surviving your own duel is the bonus, not a requirement that the removal fail."
  },
  "104": {
    "mechanics": "Stun counters; scry; palace setup",
    "rules": "Put a stun counter on each of up to two target creatures. Scry 1.",
    "flavorMatchRationale": "Stun counters carry the delayed access to the hidden weapons without adding another repeated tap-and-freeze template."
  },
  "110": {
    "mechanics": "Combat trick; legacy",
    "rules": "Target creature you control gets +2/+2 until end of turn. When that creature dies this turn, create a 1/1 white Human Citizen creature token.",
    "flavorMatchRationale": "+2/+2 lets the creature trade or survive more often while the Citizen still records the household left behind if fate wins."
  },
  "111": {
    "rules": "",
    "mechanics": "",
    "pt": "",
    "status": "REVISE",
    "designDisposition": "RECAST",
    "functionalWords": 0,
    "primaryArt": "",
    "artId": "",
    "imageUrl": "",
    "credit": "",
    "source": "",
    "artReviewRequired": true,
    "flavorMatchScore": null,
    "flavorMatchRationale": "Duplicate Argos design removed. Its selected hound artwork is transferred to Argos, Who Waited (#009); this slot is reclaimed for a future distinct design."
  },
  "113": {
    "name": "Grip of Charybdis",
    "displayName": "Grip of Charybdis",
    "origin": "NEW",
    "originFull": "New",
    "underlyingName": "",
    "treatment": "",
    "mechanics": "Tempo; scry; Charybdis",
    "rules": "Put target creature on top of its owner's library. Scry 1.",
    "flavorMatchRationale": "Now an original Odyssey card rather than a renamed Griptide: the whirlpool forces the victim back while the pilot gets a small look ahead."
  },
  "114": {
    "name": "Holy Moly",
    "displayName": "Holy Moly",
    "origin": "NEW",
    "originFull": "New",
    "underlyingName": "",
    "treatment": "",
    "mechanics": "Modal counterspell; protection; untap",
    "rules": "Choose one —\n• Counter target artifact or enchantment spell.\n• Target creature you control gains hexproof until end of turn. Untap it.",
    "flavorMatchRationale": "The card keeps the broader moly design and drops the obsolete Annul/reprint identity."
  },
  "122": {
    "name": "Hector Falls",
    "displayName": "Hector Falls",
    "mana": "{4}{B}",
    "mv": 5,
    "color": "B",
    "frame": "B",
    "origin": "NEW",
    "originFull": "New",
    "underlyingName": "",
    "treatment": "",
    "mechanics": "Removal; legendary death; Spirit",
    "rules": "Destroy target creature. If it was legendary, create a 1/1 black Spirit creature token with flying.",
    "flavorMatchRationale": "The card is now an original five-mana death spell; a legendary death leaves a shade rather than retaining the obsolete Sip of Hemlock identity."
  },
  "128": {
    "name": "Shade at the Blood-Trench",
    "displayName": "Shade at the Blood-Trench",
    "mana": "{5}{B}",
    "mv": 6,
    "color": "B",
    "frame": "B",
    "type": "Creature — Spirit",
    "pt": "5/4",
    "rarity": "C",
    "origin": "NEW",
    "originFull": "New",
    "underlyingName": "",
    "treatment": "",
    "mechanics": "Menace; Swampcycling",
    "rules": "Menace\nSwampcycling {2}",
    "archetypes": "B — landcycling / top end",
    "story": "Book XI / the shades press toward the sacrificial blood until Odysseus holds them back to hear Tiresias.",
    "narrativeEra": "Odyssey",
    "storyTarget": "Book XI / the shades gather at the blood-trench and seek the sacrificial blood.",
    "storySourceBand": "Odyssey Book XI",
    "cycleIds": [
      "ff-analog-landcycling",
      "story.underworld",
      "group.shades"
    ],
    "primaryArt": "ART-018",
    "artId": "ART-018",
    "credit": "Art: Theodoor van Thulden · Rijksmuseum",
    "source": "https://www.rijksmuseum.nl/nl/collectie/object/Tiresias-drinkt-het-bloed-van-het-offer--9862b669ddd0545d953cbebad308b25a",
    "imageUrl": "",
    "artReviewRequired": false,
    "flavorStoryElement": "The dead crowd the trench for blood before Tiresias can speak.",
    "flavorMatchRationale": "The black landcycler is brought inside the Odyssey timeline and tied directly to Book XI instead of importing Laocoön's later Trojan tradition."
  },
  "135": {
    "mechanics": "Flash; Omen; sacrifice/Food check; scry; enchantment creature",
    "rules": "Flash\nWhen Omen of the Bellowing Meat enters, if a creature or Food was sacrificed this turn, scry 2.",
    "flavorStoryElement": "The slaughtered cattle's hides crawl and the roasting meat bellows from the spits: a dead meal behaving like a living omen.",
    "flavorMatchRationale": "As an Ox Horror the card is literally the sacred cattle's meat made animate; it becomes a stronger omen specifically after slaughter."
  },
  "137": {
    "name": "Ithacan Pig",
    "displayName": "Ithacan Pig",
    "type": "Creature — Boar",
    "mechanics": "Food",
    "rules": "When this creature enters, create a Food token.",
    "story": "Homeric material world / pigs and swineherds are part of the ordinary food economy around Ithaca.",
    "narrativeEra": "Homeric world",
    "storyTarget": "Ordinary Ithacan swine as livestock and food.",
    "storySourceBand": "Odyssey / Homeric material world",
    "cycleIds": [
      "flavor.mediterranean-natural-world",
      "flavor.feast-hearth-storeroom"
    ],
    "primaryArt": "ART-528",
    "artId": "ART-528",
    "imageUrl": "https://collectionapi.metmuseum.org/api/collection/v1/iiif/255289/523498/main-image",
    "credit": "Art: The Metropolitan Museum of Art · Open Access",
    "source": "https://www.metmuseum.org/art/collection/search/255289",
    "artReviewRequired": false,
    "flavorStoryElement": "A humble pig turns the pastoral slot toward the swine that matter repeatedly in the Odyssey.",
    "flavorMatchRationale": "The goat becomes a pig, using the already-selected ancient terracotta pig image and preserving the simple Food-producing common role."
  },
  "144": {
    "name": "Obol for the Dead",
    "displayName": "Obol for the Dead",
    "mana": "{1}",
    "mv": 1,
    "color": "C",
    "frame": "C",
    "type": "Artifact",
    "rarity": "U",
    "origin": "NEW",
    "originFull": "New",
    "underlyingName": "",
    "treatment": "",
    "mechanics": "Graveyard hate; trinket; life gain",
    "rules": "When Obol for the Dead enters, exile up to one target card from a graveyard.\n{1}, {T}, Sacrifice Obol for the Dead: Exile target player's graveyard. If a creature card was exiled this way, you gain 2 life.",
    "flavorMatchRationale": "It remains a one-mana graveyard trinket, but is now an original Odyssey-set design rather than Soul-Guide Lantern."
  },
  "162": {
    "name": "Dionysus, Twice Born",
    "displayName": "Dionysus, Twice Born",
    "mana": "{2}{B/G}",
    "mv": 3,
    "color": "BG",
    "frame": "BG",
    "type": "Enchantment — Saga",
    "rarity": "U",
    "origin": "NEW",
    "originFull": "New",
    "underlyingName": "",
    "treatment": "",
    "mechanics": "Saga; Hybrid; mill; Food; recursion",
    "rules": "I — Mill three cards.\nII — Create a Food token.\nIII — Return up to one target creature card from your graveyard to your hand. You gain 2 life.",
    "story": "Divine myth / Dionysus survives the death of Semele and is born again from Zeus, binding death, nourishment and return.",
    "narrativeEra": "Bardic repertoire / mythic past",
    "storyTarget": "The twice-born Dionysus: death, preservation and rebirth.",
    "storySourceBand": "Greek myth / divine tale",
    "cycleIds": [
      "ff-analog-saga-fifteen",
      "cycle.hybrid-sagas-uncommon",
      "mythos.gods"
    ],
    "primaryArt": "",
    "artId": "",
    "imageUrl": "",
    "credit": "",
    "source": "",
    "artReviewRequired": true,
    "flavorMatchRationale": "BG's graveyard and life tools retell Dionysus's double birth while converting the old crew song into a canonical divine tale."
  },
  "163": {
    "name": "Phaethon Takes the Sun-Chariot",
    "displayName": "Phaethon Takes the Sun-Chariot",
    "mana": "{3}{R/W}",
    "mv": 4,
    "color": "RW",
    "frame": "RW",
    "type": "Enchantment — Saga",
    "rarity": "U",
    "origin": "NEW",
    "originFull": "New",
    "underlyingName": "",
    "treatment": "",
    "mechanics": "Saga; Hybrid; Treasure; combat; double strike",
    "rules": "I — Create a Treasure token.\nII — Up to two target creatures you control each get +1/+0 and gain vigilance until end of turn.\nIII — Target creature you control gets +2/+2 and gains double strike until end of turn.",
    "story": "Divine myth / Phaethon takes Helios's chariot and drives the sun beyond his ability to control it.",
    "narrativeEra": "Bardic repertoire / mythic past",
    "storyTarget": "Phaethon takes the sun-chariot and loses control of its terrible power.",
    "storySourceBand": "Greek myth / divine tale",
    "cycleIds": [
      "ff-analog-saga-fifteen",
      "cycle.hybrid-sagas-uncommon",
      "mythos.gods"
    ],
    "primaryArt": "ART-276",
    "artId": "ART-276",
    "credit": "Art: “The Fall of Phaethon” · Odilon Redon · Foundation E. G. Bührle Collection · Wikimedia Commons",
    "source": "https://commons.wikimedia.org/wiki/File:Odilon_Redon_-_La_Chute_de_Pha%C3%ABton_-_83_-_Foundation_E.G._B%C3%BChrle_Collection.jpg",
    "artReviewRequired": false,
    "flavorMatchRationale": "The old Achilles reception Saga becomes a famous solar-divine tale while retaining a clean red-white escalation chassis."
  },
  "170": {
    "name": "Seals of Pharos",
    "displayName": "Seals of Pharos",
    "pt": "3/3",
    "mechanics": "Manifest Fate; face-down ward",
    "rules": "When Seals of Pharos enters, manifest fate.\nFace-down creatures you control have ward {1}.",
    "story": "Odyssey Book IV / Menelaus and his companions hide beneath seal skins on Pharos so they can seize Proteus among his herd.",
    "narrativeEra": "Odyssey",
    "storyTarget": "Book IV / Menelaus hides his men among Proteus's seals on Pharos.",
    "storySourceBand": "Odyssey Book IV",
    "cycleIds": [
      "story.menelaus-proteus",
      "flavor.mediterranean-natural-world"
    ],
    "flavorStoryElement": "The seal herd conceals the ambush on Proteus; face-down creatures turn that disguise into set-relevant play.",
    "flavorMatchRationale": "The generic once-a-turn life trigger becomes a specific Odyssey episode that creates and protects a face-down hidden creature."
  },
  "172": {
    "name": "Hound Guarding Her Pups",
    "displayName": "Hound Guarding Her Pups",
    "mechanics": "Pump; defensive indestructible; Homeric simile",
    "rules": "Target creature gets +3/+3 until end of turn. If it's blocking, it gains indestructible until end of turn.",
    "story": "Book XX / Odysseus's heart is compared to a mother hound bristling over her pups while he restrains his anger and waits.",
    "storyTarget": "Book XX / the mother-hound-and-puppies simile for Odysseus's protective rage held in restraint.",
    "storySourceBand": "Odyssey Book XX",
    "flavorStoryElement": "Like a mother hound over her pups, the strength is fiercest when defending.",
    "flavorMatchRationale": "The new title states the image in the simile directly; the existing blocking payoff now reads as the hound defending her pups rather than an abstract 'protective fury.'"
  },
  "183": {
    "name": "Bronze Eyelet Pin",
    "displayName": "Bronze Eyelet Pin",
    "mana": "{1}",
    "mv": 1,
    "color": "C",
    "frame": "C",
    "type": "Artifact",
    "rarity": "U",
    "origin": "NEW",
    "originFull": "New",
    "underlyingName": "",
    "treatment": "",
    "mechanics": "Scry; trinket; card draw",
    "rules": "When Bronze Eyelet Pin enters, scry 1.\n{2}, {T}, Sacrifice Bronze Eyelet Pin: Draw a card.",
    "archetypes": "All",
    "story": "Late Bronze Age material culture / a Mycenaean bronze fastening pin, the kind of small everyday personal object that can carry a whole world at card scale.",
    "narrativeEra": "Homeric world",
    "storyTarget": "An iconic everyday Mycenaean bronze fastening pin.",
    "storySourceBand": "Late Helladic IIIA / Mycenaean material culture, ca. 14th century BCE",
    "cycleIds": [
      "flavor.odysseus-world",
      "structure.connective-tissue"
    ],
    "primaryArt": "ART-536",
    "artId": "ART-536",
    "imageUrl": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Bronze_eyelet-type_pin_MET_DP20042.jpg",
    "credit": "Art: Mycenaean bronze eyelet-type pin, ca. 14th c. BCE · The Met · Public Domain",
    "source": "https://www.metmuseum.org/art/collection/search/244408",
    "artReviewRequired": false,
    "flavorStoryElement": "A small bronze pin used to fasten or secure clothing turns a museum-scale everyday object into a literal trinket.",
    "flavorMatchRationale": "This replaces the second lamp concept with a distinct everyday object from the Mycenaean period, grounded in a public-domain Met object and a clean single-object image."
  },
  "187": {
    "rules": "",
    "mechanics": "",
    "pt": "",
    "status": "REVISE",
    "designDisposition": "RECAST",
    "functionalWords": 0,
    "primaryArt": "",
    "artId": "",
    "imageUrl": "",
    "credit": "",
    "source": "",
    "artReviewRequired": true,
    "flavorMatchScore": null,
    "flavorMatchRationale": "Duplicate Scheria land removed; Scheria, Harbor of Wonders (#189) remains the dedicated Scheria card. This slot is reclaimed for a future distinct design."
  },
  "196": {
    "mechanics": "Manifest Fate; face-down transformation",
    "rules": "When Palace of Circe enters, manifest fate.\nWhenever one or more face-down creatures you control attack, turn up to one target face-up creature an opponent controls face down. It becomes a 2/2 creature. This ability triggers only once each turn.",
    "flavorMatchRationale": "Circe's palace now transforms through the set's face-down language rather than repeatedly making Boars; the place itself turns identities strange."
  },
  "232": {
    "name": "Persephone Eats the Seeds",
    "displayName": "Persephone Eats the Seeds",
    "mana": "{2}{W/B}",
    "mv": 3,
    "color": "WB",
    "frame": "WB",
    "type": "Enchantment — Saga",
    "rarity": "U",
    "origin": "NEW",
    "originFull": "New",
    "underlyingName": "",
    "treatment": "",
    "mechanics": "Saga; Hybrid; Food; graveyard exile; life gain; recursion",
    "rules": "I — Create a Food token.\nII — Exile up to one target card from a graveyard. You gain 2 life.\nIII — Return target creature card with mana value 2 or less from your graveyard to the battlefield tapped.",
    "story": "Divine myth / Persephone eats the pomegranate seeds and must divide her life between the worlds above and below.",
    "narrativeEra": "Bardic repertoire / mythic past",
    "storyTarget": "Persephone eats the seeds that bind her return to the Underworld.",
    "storySourceBand": "Greek myth / divine tale",
    "cycleIds": [
      "ff-analog-saga-fifteen",
      "cycle.hybrid-sagas-uncommon",
      "mythos.gods"
    ],
    "primaryArt": "ART-132",
    "artId": "ART-132",
    "credit": "Art: Persephone Painter, ca. 440 BCE · The Met",
    "source": "https://www.metmuseum.org/art/collection/search/252973",
    "artReviewRequired": false,
    "flavorMatchRationale": "Food, graveyard interaction and small return make the WB hybrid Saga a direct divine cycle story instead of another generic Underworld lament."
  },
  "233": {
    "name": "Chained to the Black Shore",
    "displayName": "Chained to the Black Shore",
    "mana": "{1}{B}",
    "mv": 2,
    "color": "B",
    "frame": "B",
    "type": "Enchantment — Aura",
    "rarity": "R",
    "origin": "NEW",
    "originFull": "New",
    "underlyingName": "",
    "treatment": "",
    "mechanics": "Island-dependent Aura; hand exile",
    "rules": "Enchant Island you control\nWhen Chained to the Black Shore enters, look at target opponent's hand. You may exile a nonland card from it until Chained to the Black Shore leaves the battlefield.",
    "archetypes": "B / UB",
    "story": "Book XI / the black shore and the fixed punishments of the dead invert Chained to the Rocks into an Underworld land-bound prison.",
    "narrativeEra": "Odyssey",
    "storyTarget": "Book XI / punishment fixed to the dark shore of the Underworld.",
    "storySourceBand": "Odyssey Book XI",
    "flavorStoryElement": "A black land-bound prison deliberately echoes Chained to the Rocks while moving the image to Homer's shore of the dead.",
    "flavorMatchRationale": "The flavourful rename now visibly continues the Chained to the Rocks naming pattern while sounding Homeric and supporting the black Island-dependent mirror design."
  },
  "240": {
    "mechanics": "Spellcraft; exile; self-growth",
    "rules": "Whenever you cast an enchantment or sorcery spell, exile the top card of your library. You may play that card until the end of your next turn.\nWhenever you play a card from exile, put a +1/+1 counter on Circe.",
    "story": "Modern retelling / Madeline Miller's Circe is centered on exile, practiced witchcraft, self-education and the power she builds on Aiaia rather than on the single swine-transformation episode.",
    "storyTarget": "Modern retelling / Circe grows into her craft during exile on Aiaia.",
    "flavorStoryElement": "Exile becomes the place from which Circe learns, makes and acts; each spell opens another possibility and each return from exile makes her more formidable.",
    "flavorMatchRationale": "The Miller reception card now follows Circe's self-made arc—exile feeding craft and growth—instead of repeating Homer's pig transformation.",
    "cycleIds": [
      "reception.modern",
      "reception.madeline-miller",
      "cast.circe"
    ]
  },
  "245": {
    "name": "Arachne Challenges Athena",
    "displayName": "Arachne Challenges Athena",
    "mana": "{2}{G/U}",
    "mv": 3,
    "color": "GU",
    "frame": "GU",
    "type": "Enchantment — Saga",
    "rarity": "U",
    "origin": "NEW",
    "originFull": "New",
    "underlyingName": "",
    "treatment": "",
    "mechanics": "Saga; Hybrid; scry; investigate; Spider token",
    "rules": "I — Scry 2.\nII — Investigate.\nIII — Create a 2/3 green and blue Spider creature token with reach.",
    "story": "Divine myth / Arachne challenges Athena in weaving and the contest ends in transformation.",
    "narrativeEra": "Bardic repertoire / mythic past",
    "storyTarget": "Arachne's weaving contest with Athena and her transformation into a spider.",
    "storySourceBand": "Greek myth / divine tale",
    "cycleIds": [
      "ff-analog-saga-fifteen",
      "cycle.hybrid-sagas-uncommon",
      "mythos.gods"
    ],
    "primaryArt": "ART-091",
    "artId": "ART-091",
    "credit": "Art: Otto Henry Bacher · The Met",
    "source": "https://www.metmuseum.org/art/collection/search/365941",
    "artReviewRequired": false,
    "flavorMatchRationale": "The live GU hybrid Saga is now a canonical god tale: observation becomes investigation, and the final chapter makes Arachne's transformation literal."
  }
};
const TAG="studio-notes-pass-20261001";

function appendTag(value){
  const text=String(value||'').trim();
  if(text.includes(TAG))return text;
  return [text,TAG].filter(Boolean).join(' · ');
}
function apply(data){
  if(!data||!Array.isArray(data.cards))return data;
  const byNumber=new Map(data.cards.map(card=>[Number(card.number),card]));
  for(const [number,change] of Object.entries(P)){
    const card=byNumber.get(Number(number));
    if(!card)continue;
    Object.assign(card,change);
    card.changeStatus=appendTag(card.changeStatus);
    card.rulesSource='Studio notes resolution · 2026-10-01';
  }

  const artUpdates={
    'ART-536':{
      imageUrl:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Bronze_eyelet-type_pin_MET_DP20042.jpg',
      source:'https://www.metmuseum.org/art/collection/search/244408',
      credit:'Art: Mycenaean bronze eyelet-type pin, ca. 14th c. BCE · The Met · Public Domain',
      imageChecked:'2026-10-01',
      candidateCards:'Bronze Eyelet Pin (#183)',
      cropNotes:'1 Oct 2026: selected for #183 as a compact Mycenaean everyday object; isolate the pin and preserve the full silhouette.'
    },
    'ART-528':{
      imageUrl:'https://collectionapi.metmuseum.org/api/collection/v1/iiif/255289/523498/main-image',
      imageChecked:'2026-10-01',
      candidateCards:'Ithacan Pig (#137)'
    }
  };
  for(const art of data.artworks||[]){
    const change=artUpdates[art.id];
    if(change)Object.assign(art,change);
  }

  const coverageUpdates={
    9:{primary:'ART-543',candidateIds:['ART-543','ART-326','ART-516','ART-342'],notes:'1 Oct 2026: hound artwork transferred from duplicate #111 to the surviving Argos card per Studio review note.'},
    111:{primary:'',candidateIds:[],notes:'1 Oct 2026: duplicate Argos design removed; selected art transferred to #009.'},
    128:{name:'Shade at the Blood-Trench',primary:'ART-018',candidateIds:['ART-018'],notes:'1 Oct 2026: Laocoön removed from this Odyssey-timeline slot; Book XI blood-trench scene assigned.'},
    137:{name:'Ithacan Pig',primary:'ART-528',candidateIds:['ART-528'],notes:'1 Oct 2026: goat slot converted to pig; existing ancient terracotta pig art retained.'},
    183:{name:'Bronze Eyelet Pin',primary:'ART-536',candidateIds:['ART-536'],notes:'1 Oct 2026: Mycenaean everyday-object trinket replaces duplicate lamp concept.'},
    187:{primary:'',candidateIds:[],notes:'1 Oct 2026: duplicate Scheria land removed; #189 remains the Scheria land.'},
    162:{name:'Dionysus, Twice Born',primary:'',candidateIds:[],notes:'1 Oct 2026: divine hybrid Saga redesign; dedicated art still needed.'},
    163:{name:'Phaethon Takes the Sun-Chariot',primary:'ART-276',candidateIds:['ART-276'],notes:'1 Oct 2026: divine hybrid Saga redesign.'},
    232:{name:'Persephone Eats the Seeds',primary:'ART-132',candidateIds:['ART-132','ART-126'],notes:'1 Oct 2026: divine hybrid Saga redesign.'},
    245:{name:'Arachne Challenges Athena',primary:'ART-091',candidateIds:['ART-091'],notes:'1 Oct 2026: divine hybrid Saga redesign.'}
  };
  for(const row of data.coverage||[]){
    const change=coverageUpdates[Number(row.number)];
    if(change)Object.assign(row,change);
  }

  data.generatedAt='2026-10-01T00:00:00.000Z';
  data.candidate=Object.assign({},data.candidate,{
    latestReleaseAt:data.generatedAt,
    productionFilesModified:true,
    studioNotesResolution:'notes-resolution.20261001.js'
  });
  return data;
}
root.OdysseyNotesResolution20261001={patches:P,apply};
if(root.ODYSSEY_DATA)root.ODYSSEY_DATA=apply(root.ODYSSEY_DATA);
if(typeof module!=='undefined'&&module.exports)module.exports={patches:P,apply};
})(typeof window!=='undefined'?window:globalThis);
