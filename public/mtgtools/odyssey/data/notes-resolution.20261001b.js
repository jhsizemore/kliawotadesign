/* Seven Studio notes, 1 Oct 2026. #299 is a recast nomination; its design remains intact. */
(function(root){
'use strict';
const TAG='studio-notes-pass-20261001b';
const patches={
  "3": {
    "name": "Inland Shrine",
    "displayName": "Inland Shrine",
    "origin": "NEW",
    "originFull": "New",
    "underlyingName": "",
    "treatment": "",
    "mechanics": "Basic land fixing; sacrifice; life gain",
    "rules": "{1}, Sacrifice this artifact: Search your library for a basic land card, reveal it, put it into your hand, then shuffle. You gain 2 life.",
    "flavorMatchRationale": "The inland-oar offering finds new land and grants the rest promised at the end of the journey. Adding 2 life makes this its own common design rather than a renamed Traveler's Amulet.",
    "artId": "ART-149",
    "imageUrl": "",
    "credit": "Art: Nikias Painter, late 5th c. BCE · The Met",
    "source": "https://www.metmuseum.org/art/collection/search/254171",
    "fit": "cover",
    "zoom": 2.5339836735770587,
    "focusX": 0.24284126176551507,
    "focusY": 15.658981643777475,
    "layout": "standard",
    "artHeight": "normal",
    "frameStyle": "standard",
    "primaryArt": "ART-149",
    "functionalWords": 25,
    "changeStatus": "story-retheme-v2 · art-review · flavor-redesign-v1 · task5-post-odyssey-collapse-v1 · inland-shrine-rebuild-v1 · art-acceptance-v1 · studio-notes-pass-20261001b"
  },
  "19": {
    "displayName": "Carried Home Asleep",
    "treatment": "GODZILLA",
    "flavorStoryElement": "Book XIII / the Phaeacians lift the sleeping Odysseus from their ship and lay him on Ithaca with his gifts.",
    "flavorMatchRationale": "The existing return-to-hand and scry rules retain Voyage's End as the underlying reprint. The display title names the sleeping homecoming shown in the selected artwork.",
    "artId": "ART-427",
    "imageUrl": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Faiaken_brengen_de_slapende_Odysseus_naar_Ithaca_De_werken_van_Odysseus_%28serietitel%29%2C_RP-P-OB-66.761.jpg",
    "credit": "Art: Theodoor van Thulden, after Francesco Primaticcio · Rijksmuseum",
    "source": "https://www.rijksmuseum.nl/en/collection/object/Faiaken-brengen-de-slapende-Odysseus-naar-Ithaca--df8f61cc3162e562494db54d467c1369",
    "fit": "cover",
    "zoom": 3.3995636005456173,
    "focusX": 20.04694323367976,
    "focusY": 37.61871500058921,
    "layout": "standard",
    "artHeight": "normal",
    "frameStyle": "standard",
    "primaryArt": "ART-427",
    "changeStatus": "flavor-redesign-v1 · art-review · art-sweep-v1 · art-p1-upgrade-v1 · task9-scheria-pruning-v1 · homeward-package-reclassification-v1 · studio-notes-20260922-v1 · studio-notes-pass-20261001b"
  },
  "38": {
    "rules": "Shipyard Sparks deals 2 damage to target creature. If you control a tapped Vehicle, it deals 4 damage instead.",
    "flavorMatchRationale": "The tapped-ship condition now upgrades the spell to 4 damage, giving the Vehicle deck a substantial removal reward while keeping the unassisted rate at 2 damage.",
    "artId": "ART-192",
    "imageUrl": "https://api.nga.gov/iiif/e80f3c24-43ba-4184-861d-f5d489bbab57/full/full/0/default.jpg",
    "credit": "Art: “The Forge of Vulcan” · Enea Vico, after Francesco Primaticcio · National Gallery of Art",
    "source": "https://www.nga.gov/artworks/221932-forge-vulcan",
    "fit": "cover",
    "zoom": 3.6035374165783516,
    "focusX": -55.21302338655033,
    "focusY": 31.012520993346488,
    "layout": "standard",
    "artHeight": "normal",
    "frameStyle": "standard",
    "primaryArt": "ART-192",
    "functionalWords": 19,
    "changeStatus": "candidate2-common-fill-v1 · art-review · art-remap-v1 · art-acceptance-v1 · studio-notes-20260922-v1 · studio-notes-pass-20261001b"
  },
  "44": {
    "name": "Pull as One",
    "displayName": "Pull as One",
    "mechanics": "Team combat; first strike; delayed untap; Survival support",
    "rules": "Up to two target creatures each get +2/+0 and gain first strike until end of turn. Untap those creatures at the beginning of the next end step.",
    "story": "Book XII / with wax stopping their ears, the crew pulls together past the Sirens while Odysseus is bound to the mast.",
    "storyTarget": "Book XII / the wax-deafened rowers pull in unison past the Sirens; their strength lies in coordinated effort, not a song.",
    "storySourceBand": "Odyssey Book XII / passage of the Sirens",
    "cycleIds": [
      "story.sirens",
      "flavor.sailor-knowledge",
      "group.wandering-crew"
    ],
    "flavorStoryElement": "The crew cannot hear the Sirens or a rowing chant: they pull together by discipline and reset after the exertion.",
    "flavorMatchRationale": "Two creatures can win combat with +2/+0 and first strike. Waiting until the end step to untap preserves their second-main Survival triggers. Pull as One avoids both song/Saga space and the already-used Row Past the Sirens title.",
    "artId": "ART-236",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/a/a5/Draper-Ulysses_and_Sirens.jpg",
    "credit": "Art: Herbert James Draper · Ferens Art Gallery · Wikimedia Commons",
    "source": "https://commons.wikimedia.org/wiki/File:Draper-Ulysses_and_Sirens.jpg",
    "fit": "cover",
    "zoom": 3.3995636005456142,
    "focusX": 28.692279329876268,
    "focusY": 20.77510280797445,
    "layout": "standard",
    "artHeight": "normal",
    "frameStyle": "standard",
    "primaryArt": "ART-236",
    "artReuse": {
      "allowedWith": [
        17
      ],
      "reason": "User chose distinct subject crops from Draper's Ulysses and the Sirens: the Ordeal focuses on Odysseus, Pull as One on the rowers.",
      "source": "Shared Studio finishing queue snapshot, 2026-10-01"
    },
    "functionalWords": 27,
    "changeStatus": "candidate2-major-story-v2 · art-review · art-remap-v1 · art-acceptance-v1 · studio-notes-20260922-v1 · mechanics-reconcile-v1-20260924 · wave-a-live-20260926 · studio-notes-pass-20261001b"
  },
  "57": {
    "mechanics": "Vehicle recovery; Vehicle crew bonus",
    "rules": "When this creature enters, return up to one target Vehicle card from your graveyard to your hand.\nWhenever this creature crews a Vehicle, that Vehicle gets +2/+0 until end of turn.",
    "flavorMatchRationale": "The carpenter repairs a lost ship by recovering a Vehicle to hand, then improves it while crewing. A 3/2 for three mana keeps the stronger uncommon effect tied to the Vehicle deck.",
    "artId": "ART-595",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/e/ed/Museo_Nazionale_di_Ravenna._Bas-relief._Shipwright_P._Longidienus._Shell-first_method._2.jpg",
    "credit": "Art: Roman shipwright relief · Museo Nazionale di Ravenna · Public Domain",
    "source": "https://commons.wikimedia.org/wiki/File:Museo_Nazionale_di_Ravenna._Bas-relief._Shipwright_P._Longidienus._Shell-first_method._2.jpg",
    "fit": "cover",
    "zoom": 1.8982985583354208,
    "focusX": 59.791888121511214,
    "focusY": 51.096551922131205,
    "layout": "standard",
    "artHeight": "normal",
    "frameStyle": "standard",
    "primaryArt": "ART-595",
    "functionalWords": 31,
    "changeStatus": "candidate2-uncommon-fill-v1 · art-review · art-remap-v1 · art-acceptance-v1 · studio-notes-20260925-v1 · studio-notes-pass-20261001b"
  },
  "60": {
    "flavorMatchRationale": "Retained as the uncommon GU signpost. The rare #299 repeats its mana cost and first-Manifest-Fate land trigger and is nominated for recasting instead; #018 and #042 have different quest, interaction and story roles. Specific homecoming titles reduce the broad voyage cluster.",
    "artId": "ART-713",
    "imageUrl": "https://kliawota.design/mtgtools/odyssey/assets/landscapes/ART-713.4429b3ba94d1.jpg",
    "credit": "Art: Robert Havell, after Joseph Cartwright · Aikaterini Laskaridis Foundation / Travelogues",
    "source": "https://eng.travelogues.gr/item.php?view=53943",
    "fit": "cover",
    "zoom": 2.540351684685673,
    "focusX": -84.12407515809126,
    "focusY": -4.9587067260227595,
    "layout": "standard",
    "artHeight": "normal",
    "frameStyle": "standard",
    "primaryArt": "ART-713",
    "changeStatus": "candidate2-hard-chassis-v1 · signpost-gu-v1 · closing-act-promoted-20260927-v1 · studio-notes-pass-20261001b"
  },
  "248": {
    "mechanics": "Flying; forced attacks; permanent control theft",
    "rules": "Flying\nCreatures your opponents control attack each combat if able.\nWhenever one or more creatures attack you, gain control of target creature attacking you with the least power among creatures attacking you. Untap it.",
    "archetypes": "UB/UR — attack control / theft",
    "flavorStoryElement": "The Sirens lure attackers out of their own company; the most vulnerable attacker becomes yours before blockers are declared.",
    "flavorMatchRationale": "The mythic now permanently steals the lowest-power creature attacking you and untaps it. Tied lowest-power attackers are legal choices. Control changing removes that creature from combat; untapping lets it block. The trigger is one per attack declaration, so a group attack does not steal the whole group.",
    "artId": "ART-245",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/8/8d/John_William_Waterhouse_-_Ulysses_and_the_Sirens_%281891%29.jpg",
    "credit": "Art: “Ulysses and the Sirens” · John William Waterhouse · National Gallery of Victoria · Wikimedia Commons",
    "source": "https://commons.wikimedia.org/wiki/File:John_William_Waterhouse_-_Ulysses_and_the_Sirens_%281891%29.jpg",
    "fit": "cover",
    "zoom": 1.689478959002689,
    "focusX": 76.16526067109605,
    "focusY": 3.962771550052117,
    "layout": "standard",
    "artHeight": "normal",
    "frameStyle": "standard",
    "primaryArt": "ART-245",
    "functionalWords": 34,
    "changeStatus": "candidate2-reception-v1 · art-review · art-acceptance-v1 · studio-notes-pass-20261001b"
  },
  "299": {
    "status": "REVISE",
    "recastNomination": {
      "status": "NOMINATED",
      "reason": "Same {1}{G}{U} cost, broad unknown-shore identity and first-Manifest-Fate land trigger as uncommon signpost #060. Retain the uncommon signpost and use this rare budget for a distinct GU build-around.",
      "retain": [
        60
      ],
      "preserveCurrentDesign": true,
      "suggestedFill": "A specific Odyssey episode with a rare GU role distinct from another Manifest Fate-to-land engine.",
      "basis": "Studio note on #060, 2026-10-01; comparative review of current #018, #042, #060 and #299."
    },
    "flavorMatchRationale": "Recast nominee, not an emptied slot: this rare repeats #060's cost and land trigger. Its original rules, art and crop remain available for review; preserve #060 as the uncommon GU signpost.",
    "changeStatus": "candidate2-high-rarity-v1 · art-review · art-remap-v1 · art-acceptance-v1 · studio-notes-pass-20261001b · recast-nominee-299: preserve #060 signpost"
  },
  "6": {
    "artId": "ART-425",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/9/99/Odysseus_Sirens_BM_E440_n2.jpg",
    "credit": "Art: Siren Painter · British Museum · photo Jastrow",
    "source": "https://commons.wikimedia.org/wiki/File:Odysseus_Sirens_BM_E440_n2.jpg",
    "fit": "cover",
    "zoom": 1.8982985583354248,
    "focusX": -66.62421075358827,
    "focusY": -13.52044607992945,
    "layout": "standard",
    "artHeight": "normal",
    "frameStyle": "standard",
    "primaryArt": "ART-425",
    "changeStatus": "carried-from-analysis-candidate-v1 · flavor-redesign-v1 · art-sweep-v3 · studio-notes-pass-20260921 · studio-notes-pass-20261001b"
  },
  "17": {
    "artId": "ART-236",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/a/a5/Draper-Ulysses_and_Sirens.jpg",
    "credit": "Art: Herbert James Draper · Ferens Art Gallery · Wikimedia Commons",
    "source": "https://commons.wikimedia.org/wiki/File:Draper-Ulysses_and_Sirens.jpg",
    "fit": "cover",
    "zoom": 3.2071354722128467,
    "focusX": 75.5446386918958,
    "focusY": 58.56869668272869,
    "layout": "standard",
    "artHeight": "normal",
    "frameStyle": "standard",
    "primaryArt": "ART-236",
    "artReuse": {
      "allowedWith": [
        44
      ],
      "reason": "User chose distinct subject crops from Draper's Ulysses and the Sirens: the Ordeal focuses on Odysseus, Pull as One on the rowers.",
      "source": "Shared Studio finishing queue snapshot, 2026-10-01"
    },
    "changeStatus": "replacement-slot · survivor-ordeals-v3-tuned · restored-to-14A2-20260922 · mechanics-reconcile-v1-20260924 · studio-notes-20260925-v1 · wave-a-live-20260926 · studio-notes-pass-20261001b"
  },
  "206": {
    "artId": "ART-239",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/d/de/Turner_-_Ulysses_deriding_Polyphemus_1829.jpg",
    "credit": "Art: “Ulysses Deriding Polyphemus” · J. M. W. Turner · National Gallery, London · Wikimedia Commons",
    "source": "https://commons.wikimedia.org/wiki/File:Turner_-_Ulysses_deriding_Polyphemus_1829.jpg",
    "fit": "cover",
    "zoom": 6.088100643288049,
    "focusX": -65.51936324665473,
    "focusY": -60.66603900658407,
    "layout": "standard",
    "artHeight": "normal",
    "frameStyle": "standard",
    "primaryArt": "ART-239",
    "changeStatus": "candidate2-rare-fill-v1 · art-review · art-remap-v1 · art-acceptance-v1 · studio-notes-pass-20261001b · saved-art-dependency",
    "artReuse": {
      "allowedWith": [
        250
      ],
      "reason": "Preserve the two existing user-selected Turner crops: Odysseus and the homeward ship.",
      "source": "Shared Studio finishing queue snapshot, 2026-10-01"
    }
  },
  "250": {
    "artId": "ART-239",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/d/de/Turner_-_Ulysses_deriding_Polyphemus_1829.jpg",
    "credit": "Art: “Ulysses Deriding Polyphemus” · J. M. W. Turner · National Gallery, London · Wikimedia Commons",
    "source": "https://commons.wikimedia.org/wiki/File:Turner_-_Ulysses_deriding_Polyphemus_1829.jpg",
    "fit": "cover",
    "zoom": 1.593848074530839,
    "focusX": 53.859162240214374,
    "focusY": -27.330645871790534,
    "layout": "vehicle",
    "artHeight": "normal",
    "frameStyle": "standard",
    "primaryArt": "ART-239",
    "changeStatus": "ff-skeleton-high-end · art-sweep-v2 · studio-notes-pass-20261001b · saved-art-dependency",
    "artReuse": {
      "allowedWith": [
        206
      ],
      "reason": "Preserve the two existing user-selected Turner crops: Odysseus and the homeward ship.",
      "source": "Shared Studio finishing queue snapshot, 2026-10-01"
    }
  }
};
function apply(data){
 if(!data||!Array.isArray(data.cards))return data;
 for(const card of data.cards){const patch=patches[card.number];if(!patch)continue;Object.assign(card,patch);card.rulesSource='Studio notes resolution · 2026-10-01 · second pass';}
 for(const row of data.coverage||[]){const card=data.cards.find(c=>Number(c.number)===Number(row.number));if(!patches[row.number])continue;row.name=card.displayName||card.name;row.primary=card.primaryArt||'';if(row.primary&&!row.candidateIds.includes(row.primary))row.candidateIds.unshift(row.primary);row.notes=[row.notes,TAG+' · exact saved Studio artwork/crop retained'].filter(Boolean).join(' · ');}
 data.candidate=Object.assign({},data.candidate,{studioNotesResolutionSecondPass:'notes-resolution.20261001b.js'});
 return data;
}
root.OdysseyNotesResolution20261001b={patches,apply};
if(root.ODYSSEY_DATA)root.ODYSSEY_DATA=apply(root.ODYSSEY_DATA);
if(typeof module!=='undefined'&&module.exports)module.exports={patches,apply};
})(typeof window!=='undefined'?window:globalThis);
