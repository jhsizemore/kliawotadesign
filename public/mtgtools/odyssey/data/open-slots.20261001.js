/* Normalized open design slots, observed in live Studio on 1 Oct 2026. */
(function(root){
'use strict';
const manifest={
  "schema": "odyssey-open-slots/v1",
  "revision": "open-slots-20261001",
  "archive": "data/open-slot-archive.20261001.json",
  "observedAt": "2026-10-01",
  "entries": {
    "14": {
      "schema": "odyssey-open-slot/v1",
      "revision": "open-slots-20261001",
      "label": "Open U common · tempo",
      "matchReasons": [
        "explicit-recast-confidence",
        "empty-rules"
      ],
      "origin": {
        "previousName": "Poseidon's Storm",
        "names": [
          "Poseidon's Storm",
          ""
        ],
        "reason": "Previously marked Recast and stripped to its structure; complete rejected design remains archived.",
        "archive": "data/open-slot-archive.20261001.json",
        "archiveNumber": 14,
        "priorArchive": "data/recast-archive.20260930.json",
        "previousDesign": {
          "id": "ODY-014",
          "number": 14,
          "name": "Poseidon's Storm",
          "displayName": "Poseidon's Storm",
          "underlyingName": "",
          "mana": "{2}{U}",
          "mv": 3,
          "color": "U",
          "frame": "U",
          "type": "Instant",
          "rarity": "C",
          "layout": "standard",
          "pt": "",
          "rules": "Tap target creature. Put a stun counter on it. Draw a card.",
          "mechanics": "Stun; cantrip",
          "origin": "NEW",
          "treatment": "",
          "archetypes": "UR/WU",
          "story": "Book V / Poseidon sees Odysseus at sea after he leaves Calypso and raises the storm that halts his homeward progress.",
          "storyTarget": "Book V / Poseidon raises a storm after Odysseus leaves Ogygia; the sea holds his ship fast.",
          "cycleIds": [
            "story.book-v-storm",
            "story.ogygia",
            "cast.poseidon",
            "group.gods"
          ],
          "primaryArt": "ART-044",
          "rulesSource": "14A2 · Card File v1.0 Candidate · revision 256"
        },
        "source": "Live Studio Recast confidence filter, 2026-10-01; current candidate sequence and preserved archives",
        "absorbedBy": []
      },
      "target": {
        "color": "U",
        "rarity": "C",
        "mana": "{2}{U}",
        "mv": 3,
        "type": "Instant",
        "layout": "standard",
        "archetypes": "UR/WU",
        "cycleIds": [
          "story.book-v-storm",
          "story.ogygia",
          "cast.poseidon",
          "group.gods"
        ],
        "story": "Book V / Poseidon raises a storm after Odysseus leaves Ogygia; the sea holds his ship fast."
      },
      "fill": {
        "priority": "high",
        "role": "Common blue interaction",
        "direction": "A clean blue tempo spell that communicates Poseidon delaying the voyage. Prefer a distinct interaction pattern over another tap-and-stun cantrip.",
        "avoid": [
          "Repeating the many existing tap/stun/scry templates."
        ],
        "basis": "Editorial recommendation from the retained color/rarity/type budget, story target, archetypes, and cycle membership; mana cost, old title, and exact design are flexible."
      }
    },
    "107": {
      "schema": "odyssey-open-slot/v1",
      "revision": "open-slots-20261001",
      "label": "Open W common · defensive creature",
      "matchReasons": [
        "explicit-recast-confidence"
      ],
      "origin": {
        "previousName": "The Walls of Troy",
        "names": [
          "The Walls of Troy",
          ""
        ],
        "reason": "Explicit confidence 0 (Recast) in live Studio on 1 October 2026; playable design archived before reset.",
        "archive": "data/open-slot-archive.20261001.json",
        "archiveNumber": 107,
        "priorArchive": "",
        "previousDesign": {
          "id": "ODY-107",
          "number": 107,
          "name": "The Walls of Troy",
          "displayName": "The Walls of Troy",
          "underlyingName": "",
          "mana": "{3}{W}",
          "mv": 4,
          "color": "W",
          "frame": "W",
          "type": "Creature — Wall",
          "rarity": "C",
          "layout": "standard",
          "pt": "0/7",
          "rules": "Defender\nAs long as The Walls of Troy is untapped, other creatures you control have ward {1}.\nPlainscycling {2}",
          "mechanics": "Defender; ward; Plainscycling",
          "origin": "NEW",
          "treatment": "",
          "archetypes": "W — defense / landcycling",
          "story": "Trojan War / the immense walls of Ilios define the siege and the city's long resistance.",
          "storyTarget": "The immense fortifications of Troy as the physical fact the long siege cannot simply overcome.",
          "cycleIds": [
            "ff-analog-landcycling",
            "story.trojan-war-and-youth"
          ],
          "primaryArt": "ART-573",
          "rulesSource": "14A2 · Card File v1.0 Candidate · revision 256"
        },
        "source": "Live Studio Recast confidence filter, 2026-10-01; current candidate sequence and preserved archives",
        "absorbedBy": []
      },
      "target": {
        "color": "W",
        "rarity": "C",
        "mana": "{3}{W}",
        "mv": 4,
        "type": "Creature — Wall",
        "layout": "standard",
        "archetypes": "W — defense / landcycling",
        "cycleIds": [
          "ff-analog-landcycling",
          "story.trojan-war-and-youth"
        ],
        "story": "The immense fortifications of Troy as the physical fact the long siege cannot simply overcome."
      },
      "fill": {
        "priority": "high",
        "role": "White common defensive body",
        "direction": "A playable white common body or defensive permanent that makes the siege of Troy legible while supporting the landcycling package if it still needs this member.",
        "avoid": [
          "Automatically restoring the rejected 0/7 defender and untapped ward design."
        ],
        "basis": "Editorial recommendation from the retained color/rarity/type budget, story target, archetypes, and cycle membership; mana cost, old title, and exact design are flexible."
      }
    },
    "111": {
      "schema": "odyssey-open-slot/v1",
      "revision": "open-slots-20261001",
      "label": "Open W common · creature",
      "matchReasons": [
        "explicit-recast-confidence",
        "empty-rules"
      ],
      "origin": {
        "previousName": "Faithful Old Hound",
        "names": [
          "Faithful Old Hound",
          ""
        ],
        "reason": "Duplicate Argos design removed. Its selected hound artwork is transferred to Argos, Who Waited (#009); this slot is reclaimed for a future distinct design.",
        "archive": "data/open-slot-archive.20261001.json",
        "archiveNumber": 111,
        "priorArchive": "",
        "previousDesign": {
          "id": "ODY-111",
          "number": 111,
          "name": "Faithful Old Hound",
          "displayName": "Faithful Old Hound",
          "underlyingName": "",
          "mana": "{3}{W}",
          "mv": 4,
          "color": "W",
          "frame": "W",
          "type": "Creature — Dog",
          "rarity": "C",
          "layout": "standard",
          "pt": "3/4",
          "rules": "As long as you control a legendary creature, this creature has vigilance. When this creature dies, if you control a legendary creature, draw a card.",
          "mechanics": "Legendary recognition / death",
          "origin": "NEW",
          "treatment": "",
          "archetypes": "WU/GW",
          "story": "Book XVII / the old dog Argos alone recognizes Odysseus immediately, then dies after seeing his master home.",
          "storyTarget": "Book XVII / the old dog Argos alone recognizes Odysseus immediately, then dies after seeing his master home.",
          "cycleIds": [
            "structure.connective-tissue"
          ],
          "primaryArt": "ART-025",
          "rulesSource": "14A2 · Card File v1.0 Candidate · revision 256"
        },
        "source": "Live Studio Recast confidence filter, 2026-10-01; current candidate sequence and preserved archives",
        "absorbedBy": [
          9
        ]
      },
      "target": {
        "color": "W",
        "rarity": "C",
        "mana": "{3}{W}",
        "mv": 4,
        "type": "Creature",
        "layout": "standard",
        "archetypes": "WU/GW",
        "cycleIds": [
          "structure.connective-tissue"
        ],
        "story": "Open household / guest / worker / recognition story; choose a distinct white common creature. Former Argos story belongs to #009."
      },
      "fill": {
        "priority": "high",
        "role": "Distinct white common creature",
        "direction": "Fill the white common creature budget with an uncovered household, guest, worker, or recognition role. The former hound is historical provenance; Argos already survives at #009.",
        "avoid": [
          "Another Argos or recognition-hound design.",
          "Reusing the artwork transferred to #009 without a new art decision."
        ],
        "basis": "Editorial recommendation from the retained color/rarity/type budget, story target, archetypes, and cycle membership; mana cost, old title, and exact design are flexible."
      }
    },
    "154": {
      "schema": "odyssey-open-slot/v1",
      "revision": "open-slots-20261001",
      "label": "Open U uncommon · anticipation",
      "matchReasons": [
        "explicit-recast-confidence",
        "empty-rules"
      ],
      "origin": {
        "previousName": "Circe Warns of Scylla",
        "names": [
          "Circe Warns of Scylla",
          "Saw It Coming"
        ],
        "reason": "Previously marked Recast and stripped to its structure; complete rejected design remains archived.",
        "archive": "data/open-slot-archive.20261001.json",
        "archiveNumber": 154,
        "priorArchive": "data/recast-archive.20260930.json",
        "previousDesign": {
          "id": "ODY-154",
          "number": 154,
          "name": "Circe Warns of Scylla",
          "displayName": "Circe Warns of Scylla",
          "underlyingName": "Saw It Coming",
          "mana": "{1}{U}{U}",
          "mv": 3,
          "color": "U",
          "frame": "U",
          "type": "Instant",
          "rarity": "U",
          "layout": "standard",
          "pt": "",
          "rules": "Counter target spell. Scry 1.",
          "mechanics": "Counterspell; scry",
          "origin": "RPR",
          "treatment": "GODZILLA",
          "archetypes": "UR/WU",
          "story": "Book XII / Circe tells Odysseus in advance that Scylla cannot simply be fought like an ordinary enemy.",
          "storyTarget": "Book XII / Circe tells Odysseus in advance that Scylla cannot simply be fought like an ordinary enemy.",
          "cycleIds": [
            "story.circe-aeaea",
            "story.scylla-charybdis",
            "cast.circe",
            "group.monsters"
          ],
          "primaryArt": "ART-004",
          "rulesSource": "14A2 · Card File v1.0 Candidate · revision 256"
        },
        "source": "Live Studio Recast confidence filter, 2026-10-01; current candidate sequence and preserved archives",
        "absorbedBy": []
      },
      "target": {
        "color": "U",
        "rarity": "U",
        "mana": "{1}{U}{U}",
        "mv": 3,
        "type": "Instant",
        "layout": "standard",
        "archetypes": "UR/WU",
        "cycleIds": [
          "story.circe-aeaea",
          "story.scylla-charybdis",
          "cast.circe",
          "group.monsters"
        ],
        "story": "Book XII / Circe tells Odysseus in advance that Scylla cannot simply be fought like an ordinary enemy."
      },
      "fill": {
        "priority": "medium",
        "role": "Blue uncommon anticipation spell",
        "direction": "A blue uncommon that captures Circe giving actionable advance knowledge of an unavoidable danger; explore planning or selection with a real decision.",
        "avoid": [
          "Reinstating the previous reprint identity.",
          "Another generic counterspell or tap-and-scry effect without a distinct story action."
        ],
        "basis": "Editorial recommendation from the retained color/rarity/type budget, story target, archetypes, and cycle membership; mana cost, old title, and exact design are flexible."
      }
    },
    "160": {
      "schema": "odyssey-open-slot/v1",
      "revision": "open-slots-20261001",
      "label": "Open R uncommon · storm payoff",
      "matchReasons": [
        "explicit-recast-confidence",
        "empty-rules"
      ],
      "origin": {
        "previousName": "Storm over Limestone",
        "names": [
          "Storm over Limestone",
          ""
        ],
        "reason": "Previously marked Recast and stripped to its structure; complete rejected design remains archived.",
        "archive": "data/open-slot-archive.20261001.json",
        "archiveNumber": 160,
        "priorArchive": "data/recast-archive.20260930.json",
        "previousDesign": {
          "id": "ODY-160",
          "number": 160,
          "name": "Storm over Limestone",
          "displayName": "Storm over Limestone",
          "underlyingName": "",
          "mana": "{4}{R}{R}",
          "mv": 6,
          "color": "R",
          "frame": "R",
          "type": "Enchantment",
          "rarity": "U",
          "layout": "standard",
          "pt": "",
          "rules": "When this enchantment enters, it deals 4 damage to target creature.\nAt the beginning of combat on your turn, up to one target creature can't block this turn.",
          "mechanics": "ETB damage; can't block",
          "origin": "NEW",
          "treatment": "",
          "archetypes": "BR/RG/UR — removal / attacks",
          "story": "Mediterranean natural world / sudden hard storms break over pale headlands and make exposed country dangerous in minutes.",
          "storyTarget": "Sudden storm over limestone coast.",
          "cycleIds": [
            "flavor.mediterranean-natural-world",
            "flavor.homeric-similes"
          ],
          "primaryArt": "ART-060",
          "rulesSource": "14A2 · Card File v1.0 Candidate · revision 256"
        },
        "source": "Live Studio Recast confidence filter, 2026-10-01; current candidate sequence and preserved archives",
        "absorbedBy": []
      },
      "target": {
        "color": "R",
        "rarity": "U",
        "mana": "{4}{R}{R}",
        "mv": 6,
        "type": "Enchantment",
        "layout": "standard",
        "archetypes": "BR/RG/UR — removal / attacks",
        "cycleIds": [
          "flavor.mediterranean-natural-world",
          "flavor.homeric-similes"
        ],
        "story": "Sudden storm over limestone coast."
      },
      "fill": {
        "priority": "medium",
        "role": "Red uncommon high-end noncreature",
        "direction": "Explore a red storm or exposed-headland payoff that has a useful Limited role. Six mana and enchantment are inherited starting points, open to revision.",
        "avoid": [
          "A costly narrow enchantment whose only role is repeating existing removal."
        ],
        "basis": "Editorial recommendation from the retained color/rarity/type budget, story target, archetypes, and cycle membership; mana cost, old title, and exact design are flexible."
      }
    },
    "165": {
      "schema": "odyssey-open-slot/v1",
      "revision": "open-slots-20261001",
      "label": "Open R uncommon · survival support",
      "matchReasons": [
        "explicit-recast-confidence",
        "empty-rules"
      ],
      "origin": {
        "previousName": "Summer Heat on Stone",
        "names": [
          "Summer Heat on Stone",
          ""
        ],
        "reason": "Previously marked Recast and stripped to its structure; complete rejected design remains archived.",
        "archive": "data/open-slot-archive.20261001.json",
        "archiveNumber": 165,
        "priorArchive": "data/recast-archive.20260930.json",
        "previousDesign": {
          "id": "ODY-165",
          "number": 165,
          "name": "Summer Heat on Stone",
          "displayName": "Summer Heat on Stone",
          "underlyingName": "",
          "mana": "{3}{R}",
          "mv": 4,
          "color": "R",
          "frame": "R",
          "type": "Enchantment",
          "rarity": "U",
          "layout": "standard",
          "pt": "",
          "rules": "Whenever one or more creatures you control become tapped, this enchantment deals 1 damage to each opponent. This ability triggers only once each turn.",
          "mechanics": "Tapped-matters damage",
          "origin": "NEW",
          "treatment": "",
          "archetypes": "RW/RG/BR — Survival / combat",
          "story": "Mediterranean natural world / hard summer heat makes labor, marches and exposed stone country exhausting.",
          "storyTarget": "Summer heat as persistent environmental pressure.",
          "cycleIds": [
            "flavor.mediterranean-natural-world",
            "structure.connective-tissue"
          ],
          "primaryArt": "ART-471",
          "rulesSource": "14A2 · Card File v1.0 Candidate · revision 256"
        },
        "source": "Live Studio Recast confidence filter, 2026-10-01; current candidate sequence and preserved archives",
        "absorbedBy": []
      },
      "target": {
        "color": "R",
        "rarity": "U",
        "mana": "{3}{R}",
        "mv": 4,
        "type": "Enchantment",
        "layout": "standard",
        "archetypes": "RW/RG/BR — Survival / combat",
        "cycleIds": [
          "flavor.mediterranean-natural-world",
          "structure.connective-tissue"
        ],
        "story": "Summer heat as persistent environmental pressure."
      },
      "fill": {
        "priority": "medium",
        "role": "Red uncommon combat support",
        "direction": "Use harsh summer conditions to make exertion, attacking, or surviving combat matter, with a simple and useful uncommon role.",
        "avoid": [
          "Another stalled repeated tap/stun effect.",
          "Treating the inherited mana cost as mandatory."
        ],
        "basis": "Editorial recommendation from the retained color/rarity/type budget, story target, archetypes, and cycle membership; mana cost, old title, and exact design are flexible."
      }
    },
    "167": {
      "schema": "odyssey-open-slot/v1",
      "revision": "open-slots-20261001",
      "label": "Open G uncommon · large creature",
      "matchReasons": [
        "explicit-recast-confidence",
        "empty-rules"
      ],
      "origin": {
        "previousName": "Lion Among the Flock",
        "names": [
          "Lion Among the Flock",
          ""
        ],
        "reason": "Previously marked Recast and stripped to its structure; complete rejected design remains archived.",
        "archive": "data/open-slot-archive.20261001.json",
        "archiveNumber": 167,
        "priorArchive": "data/recast-archive.20260930.json",
        "previousDesign": {
          "id": "ODY-167",
          "number": 167,
          "name": "Lion Among the Flock",
          "displayName": "Lion Among the Flock",
          "underlyingName": "",
          "mana": "{5}{G}",
          "mv": 6,
          "color": "G",
          "frame": "G",
          "type": "Creature — Lion",
          "rarity": "U",
          "layout": "standard",
          "pt": "6/5",
          "rules": "Trample.",
          "mechanics": "Trample",
          "flavor": "He looked like some lion of the wilderness",
          "origin": "NEW",
          "treatment": "",
          "archetypes": "RG/GW — big creatures",
          "story": "Homeric simile / heroes and predators are repeatedly likened to a lion falling upon livestock.",
          "storyTarget": "Lion-among-the-flock simile.",
          "cycleIds": [
            "flavor.homeric-similes",
            "flavor.mediterranean-natural-world"
          ],
          "primaryArt": "ART-107",
          "rulesSource": "14A2 · Card File v1.0 Candidate · revision 256"
        },
        "source": "Live Studio Recast confidence filter, 2026-10-01; current candidate sequence and preserved archives",
        "absorbedBy": []
      },
      "target": {
        "color": "G",
        "rarity": "U",
        "mana": "{5}{G}",
        "mv": 6,
        "type": "Creature — Lion",
        "layout": "standard",
        "archetypes": "RG/GW — big creatures",
        "cycleIds": [
          "flavor.homeric-similes",
          "flavor.mediterranean-natural-world"
        ],
        "story": "Lion-among-the-flock simile."
      },
      "fill": {
        "priority": "high",
        "role": "Green uncommon top-end creature",
        "direction": "Provide a green top-end creature that creates meaningful combat pressure; the lion simile is a promising story anchor.",
        "avoid": [
          "A large body with an ability that rarely changes combat."
        ],
        "basis": "Editorial recommendation from the retained color/rarity/type budget, story target, archetypes, and cycle membership; mana cost, old title, and exact design are flexible."
      }
    },
    "172": {
      "schema": "odyssey-open-slot/v1",
      "revision": "open-slots-20261001",
      "label": "Open G uncommon · combat trick",
      "matchReasons": [
        "explicit-recast-confidence"
      ],
      "origin": {
        "previousName": "Hound Guarding Her Pups",
        "names": [
          "Hound Guarding Her Pups",
          ""
        ],
        "reason": "Explicit confidence 0 (Recast) in live Studio on 1 October 2026; playable design archived before reset.",
        "archive": "data/open-slot-archive.20261001.json",
        "archiveNumber": 172,
        "priorArchive": "",
        "previousDesign": {
          "id": "ODY-172",
          "number": 172,
          "name": "Hound Guarding Her Pups",
          "displayName": "Hound Guarding Her Pups",
          "underlyingName": "",
          "mana": "{2}{G}",
          "mv": 3,
          "color": "G",
          "frame": "G",
          "type": "Instant",
          "rarity": "U",
          "layout": "standard",
          "pt": "",
          "rules": "Target creature gets +3/+3 until end of turn. If it's blocking, it gains indestructible until end of turn.",
          "mechanics": "Pump; defensive indestructible; Homeric simile",
          "origin": "NEW",
          "treatment": "",
          "archetypes": "RG/GW — combat / Survival",
          "story": "Book XX / Odysseus's heart is compared to a mother hound bristling over her pups while he restrains his anger and waits.",
          "storyTarget": "Book XX / the mother-hound-and-puppies simile for Odysseus's protective rage held in restraint.",
          "cycleIds": [
            "flavor.homeric-similes",
            "flavor.mediterranean-natural-world"
          ],
          "primaryArt": "ART-581",
          "rulesSource": "Studio notes resolution · 2026-10-01"
        },
        "source": "Live Studio Recast confidence filter, 2026-10-01; current candidate sequence and preserved archives",
        "absorbedBy": []
      },
      "target": {
        "color": "G",
        "rarity": "U",
        "mana": "{2}{G}",
        "mv": 3,
        "type": "Instant",
        "layout": "standard",
        "archetypes": "RG/GW — combat / Survival",
        "cycleIds": [
          "flavor.homeric-similes",
          "flavor.mediterranean-natural-world"
        ],
        "story": "Book XX / the mother-hound-and-puppies simile for Odysseus's protective rage held in restraint."
      },
      "fill": {
        "priority": "medium",
        "role": "Green uncommon combat trick",
        "direction": "A distinctive green trick about restrained protective fury or defense, useful outside its ideal blocking case. The mother-hound simile is an optional anchor.",
        "avoid": [
          "Restoring the rejected pump/indestructible template by default.",
          "Adding a second literal Argos card."
        ],
        "basis": "Editorial recommendation from the retained color/rarity/type budget, story target, archetypes, and cycle membership; mana cost, old title, and exact design are flexible."
      }
    },
    "183": {
      "schema": "odyssey-open-slot/v1",
      "revision": "open-slots-20261001",
      "label": "Open C uncommon · small artifact",
      "matchReasons": [
        "explicit-recast-confidence"
      ],
      "origin": {
        "previousName": "Bronze Eyelet Pin",
        "names": [
          "Bronze Eyelet Pin",
          ""
        ],
        "reason": "Explicit confidence 0 (Recast) in live Studio on 1 October 2026; playable design archived before reset.",
        "archive": "data/open-slot-archive.20261001.json",
        "archiveNumber": 183,
        "priorArchive": "",
        "previousDesign": {
          "id": "ODY-183",
          "number": 183,
          "name": "Bronze Eyelet Pin",
          "displayName": "Bronze Eyelet Pin",
          "underlyingName": "",
          "mana": "{1}",
          "mv": 1,
          "color": "C",
          "frame": "C",
          "type": "Artifact",
          "rarity": "U",
          "layout": "standard",
          "pt": "",
          "rules": "When Bronze Eyelet Pin enters, scry 1.\n{2}, {T}, Sacrifice Bronze Eyelet Pin: Draw a card.",
          "mechanics": "Scry; trinket; card draw",
          "origin": "NEW",
          "treatment": "",
          "archetypes": "All",
          "story": "Late Bronze Age material culture / a Mycenaean bronze fastening pin, the kind of small everyday personal object that can carry a whole world at card scale.",
          "storyTarget": "An iconic everyday Mycenaean bronze fastening pin.",
          "cycleIds": [
            "flavor.odysseus-world",
            "structure.connective-tissue"
          ],
          "primaryArt": "ART-536",
          "rulesSource": "Studio notes resolution · 2026-10-01"
        },
        "source": "Live Studio Recast confidence filter, 2026-10-01; current candidate sequence and preserved archives",
        "absorbedBy": []
      },
      "target": {
        "color": "C",
        "rarity": "U",
        "mana": "{1}",
        "mv": 1,
        "type": "Artifact",
        "layout": "standard",
        "archetypes": "All",
        "cycleIds": [
          "flavor.odysseus-world",
          "structure.connective-tissue"
        ],
        "story": "An iconic everyday Mycenaean bronze fastening pin."
      },
      "fill": {
        "priority": "medium",
        "role": "Colorless uncommon trinket",
        "direction": "Fill a cheap utility-artifact role with a distinct material-culture object. The Mycenaean pin is available as a story/art option, not a locked design.",
        "avoid": [
          "Another lamp.",
          "A generic scry-and-sacrifice cantrip unless it serves a demonstrated need."
        ],
        "basis": "Editorial recommendation from the retained color/rarity/type budget, story target, archetypes, and cycle membership; mana cost, old title, and exact design are flexible."
      }
    },
    "187": {
      "schema": "odyssey-open-slot/v1",
      "revision": "open-slots-20261001",
      "label": "Open Land uncommon · utility land",
      "matchReasons": [
        "explicit-recast-confidence",
        "empty-rules"
      ],
      "origin": {
        "previousName": "Scheria, Harbor of Strangers",
        "names": [
          "Scheria, Harbor of Strangers",
          "Uncharted Haven"
        ],
        "reason": "Duplicate Scheria land removed; Scheria, Harbor of Wonders (#189) remains the dedicated Scheria card. This slot is reclaimed for a future distinct design.",
        "archive": "data/open-slot-archive.20261001.json",
        "archiveNumber": 187,
        "priorArchive": "",
        "previousDesign": {
          "id": "ODY-187",
          "number": 187,
          "name": "Uncharted Haven",
          "displayName": "Scheria, Harbor of Strangers",
          "underlyingName": "Uncharted Haven",
          "mana": "",
          "mv": 0,
          "color": "Land",
          "frame": "L",
          "type": "Land",
          "rarity": "U",
          "layout": "standard",
          "pt": "",
          "rules": "This land enters tapped. As it enters, choose a color. {T}: Add one mana of the chosen color.",
          "mechanics": "Fixing",
          "flavor": "you shall not want for clothes nor for anything else",
          "origin": "RPR",
          "treatment": "GODZILLA",
          "archetypes": "All",
          "story": "Books VI–VIII / Scheria receives the unknown castaway Odysseus and turns a dangerous arrival into guest-friendship and safe passage.",
          "storyTarget": "Books VI–VIII / Scheria receives the unknown castaway Odysseus and turns a dangerous arrival into guest-friendship and safe passage.",
          "cycleIds": [
            "story.scheria",
            "group.phaeacians"
          ],
          "primaryArt": "ART-343",
          "rulesSource": "14A2 · Card File v1.0 Candidate · revision 256"
        },
        "source": "Live Studio Recast confidence filter, 2026-10-01; current candidate sequence and preserved archives",
        "absorbedBy": [
          189
        ]
      },
      "target": {
        "color": "Land",
        "rarity": "U",
        "mana": "",
        "mv": 0,
        "type": "Land",
        "layout": "standard",
        "archetypes": "All",
        "cycleIds": [],
        "story": "Open Odyssey location or utility-land story. Scheria is represented at #189; the former Scheria brief is provenance only."
      },
      "fill": {
        "priority": "medium",
        "role": "Uncommon nonbasic utility land",
        "direction": "An uncommon utility land or uncovered place, distinct from Scheria at #189 and the ten tapped scry duals. Preserve the land/rarity budget while choosing a new location.",
        "avoid": [
          "Another Scheria land.",
          "A second overlapping dual-land cycle.",
          "Restoring Uncharted Haven as the underlying reprint."
        ],
        "basis": "Editorial recommendation from the retained color/rarity/type budget, story target, archetypes, and cycle membership; mana cost, old title, and exact design are flexible."
      }
    },
    "216": {
      "schema": "odyssey-open-slot/v1",
      "revision": "open-slots-20261001",
      "label": "Open WU uncommon · story saga",
      "matchReasons": [
        "explicit-recast-confidence",
        "empty-rules"
      ],
      "origin": {
        "previousName": "Lay of the Hidden King",
        "names": [
          "Lay of the Hidden King",
          ""
        ],
        "reason": "Previously marked Recast and stripped to its structure; complete rejected design remains archived.",
        "archive": "data/open-slot-archive.20261001.json",
        "archiveNumber": 216,
        "priorArchive": "data/recast-archive.20260930.json",
        "previousDesign": {
          "id": "ODY-216",
          "number": 216,
          "name": "Lay of the Hidden King",
          "displayName": "Lay of the Hidden King",
          "underlyingName": "",
          "mana": "{1}{W}{U}",
          "mv": 3,
          "color": "WU",
          "frame": "M",
          "type": "Enchantment — Saga",
          "rarity": "U",
          "layout": "saga",
          "pt": "",
          "rules": "I — Tap up to one target creature an opponent controls.\nII — Up to one target creature you control gains ward {2} until your next turn.\nIII — Exile up to one target creature you control, then return it to the battlefield under its owner's control.",
          "mechanics": "Saga; tempo; protection; blink",
          "origin": "NEW",
          "treatment": "",
          "archetypes": "WU/UB/WB/GW",
          "story": "A song about Odysseus returning to his own household in disguise (Books XIII–XVII).",
          "storyTarget": "A song about Odysseus returning to his own household in disguise (Books XIII–XVII).",
          "cycleIds": [
            "ff-analog-saga-fifteen",
            "story.return-disguise"
          ],
          "primaryArt": "ART-007",
          "rulesSource": "14A2 · Card File v1.0 Candidate · revision 256"
        },
        "source": "Live Studio Recast confidence filter, 2026-10-01; current candidate sequence and preserved archives",
        "absorbedBy": []
      },
      "target": {
        "color": "WU",
        "rarity": "U",
        "mana": "{1}{W}{U}",
        "mv": 3,
        "type": "Enchantment — Saga",
        "layout": "saga",
        "archetypes": "WU/UB/WB/GW",
        "cycleIds": [
          "ff-analog-saga-fifteen",
          "story.return-disguise"
        ],
        "story": "A song about Odysseus returning to his own household in disguise (Books XIII–XVII)."
      },
      "fill": {
        "priority": "high",
        "role": "WU uncommon Saga",
        "direction": "A short WU Saga that gives the disguise/return sequence a clear beginning, development, and payoff; check its place in the uncommon Saga lattice.",
        "avoid": [
          "Another disconnected list of scry/tap effects.",
          "Treating the former title or mana cost as fixed."
        ],
        "basis": "Editorial recommendation from the retained color/rarity/type budget, story target, archetypes, and cycle membership; mana cost, old title, and exact design are flexible."
      }
    },
    "241": {
      "schema": "odyssey-open-slot/v1",
      "revision": "open-slots-20261001",
      "label": "Open UB rare · UB build-around",
      "matchReasons": [
        "explicit-recast-confidence",
        "empty-rules"
      ],
      "origin": {
        "previousName": "A Name Kept Hidden",
        "names": [
          "A Name Kept Hidden",
          ""
        ],
        "reason": "Previously marked Recast and stripped to its structure; complete rejected design remains archived.",
        "archive": "data/open-slot-archive.20261001.json",
        "archiveNumber": 241,
        "priorArchive": "data/recast-archive.20260930.json",
        "previousDesign": {
          "id": "ODY-241",
          "number": 241,
          "name": "A Name Kept Hidden",
          "displayName": "A Name Kept Hidden",
          "underlyingName": "",
          "mana": "{1}{U}{B}",
          "mv": 3,
          "color": "UB",
          "frame": "M",
          "type": "Enchantment",
          "rarity": "R",
          "layout": "standard",
          "pt": "",
          "rules": "Face-down creatures you control have menace.\nWhenever one or more face-down creatures you control deal combat damage to a player, surveil 2. This ability triggers only once each turn.\n{3}{U}{B}: Manifest fate.",
          "mechanics": "Face-down; graveyard; surveil",
          "origin": "NEW",
          "treatment": "",
          "archetypes": "UB — masks / graveyard / Manifest Fate",
          "story": "A concealed identity can be protection, weapon and source of dangerous knowledge; the hidden name and the hidden card share the same strategic space.",
          "storyTarget": "UB rare masks/graveyard engine.",
          "cycleIds": [
            "rare.pair-buildarounds",
            "structure.connective-tissue"
          ],
          "primaryArt": "ART-083",
          "rulesSource": "14A2 · Card File v1.0 Candidate · revision 256"
        },
        "source": "Live Studio Recast confidence filter, 2026-10-01; current candidate sequence and preserved archives",
        "absorbedBy": []
      },
      "target": {
        "color": "UB",
        "rarity": "R",
        "mana": "{1}{U}{B}",
        "mv": 3,
        "type": "Enchantment",
        "layout": "standard",
        "archetypes": "UB — masks / graveyard / Manifest Fate",
        "cycleIds": [
          "rare.pair-buildarounds",
          "structure.connective-tissue"
        ],
        "story": "UB rare masks/graveyard engine."
      },
      "fill": {
        "priority": "high",
        "role": "UB rare archetype engine",
        "direction": "An appealing UB engine for concealed identity, face-down cards, and/or graveyard knowledge. Choose one coherent engine and test it against the other UB cards.",
        "avoid": [
          "An unfocused engine that asks for every mechanic at once."
        ],
        "basis": "Editorial recommendation from the retained color/rarity/type budget, story target, archetypes, and cycle membership; mana cost, old title, and exact design are flexible."
      }
    },
    "275": {
      "schema": "odyssey-open-slot/v1",
      "revision": "open-slots-20261001",
      "label": "Open U uncommon · weaving support",
      "matchReasons": [
        "explicit-recast-confidence",
        "empty-rules"
      ],
      "origin": {
        "previousName": "Penelope's Unending Loom",
        "names": [
          "Penelope's Unending Loom",
          ""
        ],
        "reason": "Previously marked Recast and stripped to its structure; complete rejected design remains archived.",
        "archive": "data/open-slot-archive.20261001.json",
        "archiveNumber": 275,
        "priorArchive": "data/recast-archive.20260930.json",
        "previousDesign": {
          "id": "ODY-275",
          "number": 275,
          "name": "Penelope's Unending Loom",
          "displayName": "Penelope's Unending Loom",
          "underlyingName": "",
          "mana": "{2}{U}",
          "mv": 3,
          "color": "U",
          "frame": "U",
          "type": "Legendary Enchantment",
          "rarity": "U",
          "layout": "standard",
          "pt": "",
          "rules": "Whenever you discard one or more cards, put a lore counter on this enchantment. This ability triggers only once each turn.\nRemove three lore counters from this enchantment: Return target instant, sorcery, or enchantment card from your graveyard to your hand. Activate only as a sorcery.",
          "mechanics": "Discard; lore counters; recursion",
          "origin": "NEW",
          "treatment": "",
          "archetypes": "WU/GU — graveyard / enchantments / filtering",
          "story": "Later reception / Penelope's weaving becomes a symbol not only of delay but of revision, authorship and repeatedly remaking the same story.",
          "storyTarget": "Later reception / Penelope's weaving becomes a symbol not only of delay but of revision, authorship and repeatedly remaking the same story.",
          "cycleIds": [
            "reception.later",
            "cast.penelope",
            "flavor.crafts-making"
          ],
          "primaryArt": "ART-208",
          "rulesSource": "14A2 · Card File v1.0 Candidate · revision 256"
        },
        "source": "Live Studio Recast confidence filter, 2026-10-01; current candidate sequence and preserved archives",
        "absorbedBy": []
      },
      "target": {
        "color": "U",
        "rarity": "U",
        "mana": "{2}{U}",
        "mv": 3,
        "type": "Legendary Enchantment",
        "layout": "standard",
        "archetypes": "WU/GU — graveyard / enchantments / filtering",
        "cycleIds": [
          "reception.later",
          "cast.penelope",
          "flavor.crafts-making"
        ],
        "story": "Later reception / Penelope's weaving becomes a symbol not only of delay but of revision, authorship and repeatedly remaking the same story."
      },
      "fill": {
        "priority": "medium",
        "role": "Blue uncommon enchantment support",
        "direction": "A blue enchantment supporting weaving, revision, filtering, or Saga counters without duplicating Penelope's existing designs.",
        "avoid": [
          "Repeating the rare Penelope counter-manipulation engine without a new role."
        ],
        "basis": "Editorial recommendation from the retained color/rarity/type budget, story target, archetypes, and cycle membership; mana cost, old title, and exact design are flexible."
      }
    },
    "283": {
      "schema": "odyssey-open-slot/v1",
      "revision": "open-slots-20261001",
      "label": "Open C uncommon · utility equipment",
      "matchReasons": [
        "explicit-recast-confidence",
        "empty-rules"
      ],
      "origin": {
        "previousName": "Leatherworker's Awl",
        "names": [
          "Leatherworker's Awl",
          ""
        ],
        "reason": "Previously marked Recast and stripped to its structure; complete rejected design remains archived.",
        "archive": "data/open-slot-archive.20261001.json",
        "archiveNumber": 283,
        "priorArchive": "data/recast-archive.20260930.json",
        "previousDesign": {
          "id": "ODY-283",
          "number": 283,
          "name": "Leatherworker's Awl",
          "displayName": "Leatherworker's Awl",
          "underlyingName": "",
          "mana": "{2}",
          "mv": 2,
          "color": "C",
          "frame": "C",
          "type": "Artifact — Equipment",
          "rarity": "U",
          "layout": "standard",
          "pt": "",
          "rules": "Equipped creature gets +1/+1.\nWhenever equipped creature becomes tapped, you may pay {1}. If you do, scry 1. This ability triggers only once each turn.\nEquip {1}",
          "mechanics": "Equipment; Survival support",
          "origin": "NEW",
          "treatment": "",
          "archetypes": "All / GW / RW — crafts / Survival",
          "story": "Crafts & making / leatherwork supplies sandals, straps, containers, harness and practical fittings throughout ordinary life.",
          "storyTarget": "Crafts & making / leatherwork supplies sandals, straps, containers, harness and practical fittings throughout ordinary life.",
          "cycleIds": [
            "flavor.crafts-making",
            "flavor.odysseus-world"
          ],
          "primaryArt": "ART-473",
          "rulesSource": "14A2 · Card File v1.0 Candidate · revision 256"
        },
        "source": "Live Studio Recast confidence filter, 2026-10-01; current candidate sequence and preserved archives",
        "absorbedBy": []
      },
      "target": {
        "color": "C",
        "rarity": "U",
        "mana": "{2}",
        "mv": 2,
        "type": "Artifact — Equipment",
        "layout": "standard",
        "archetypes": "All / GW / RW — crafts / Survival",
        "cycleIds": [
          "flavor.crafts-making",
          "flavor.odysseus-world"
        ],
        "story": "Crafts & making / leatherwork supplies sandals, straps, containers, harness and practical fittings throughout ordinary life."
      },
      "fill": {
        "priority": "medium",
        "role": "Colorless uncommon Equipment",
        "direction": "A practical craft implement with a useful combat, tapping, or Survival role and comprehensible equip/play patterns.",
        "avoid": [
          "Equipment with no attractive Limited use.",
          "Another generically interchangeable stat boost."
        ],
        "basis": "Editorial recommendation from the retained color/rarity/type budget, story target, archetypes, and cycle membership; mana cost, old title, and exact design are flexible."
      }
    },
    "285": {
      "schema": "odyssey-open-slot/v1",
      "revision": "open-slots-20261001",
      "label": "Open G uncommon · land-support creature",
      "matchReasons": [
        "explicit-recast-confidence",
        "empty-rules"
      ],
      "origin": {
        "previousName": "Vineyard Fence-Mender",
        "names": [
          "Vineyard Fence-Mender",
          ""
        ],
        "reason": "Previously marked Recast and stripped to its structure; complete rejected design remains archived.",
        "archive": "data/open-slot-archive.20261001.json",
        "archiveNumber": 285,
        "priorArchive": "data/recast-archive.20260930.json",
        "previousDesign": {
          "id": "ODY-285",
          "number": 285,
          "name": "Vineyard Fence-Mender",
          "displayName": "Vineyard Fence-Mender",
          "underlyingName": "",
          "mana": "{2}{G}",
          "mv": 3,
          "color": "G",
          "frame": "G",
          "type": "Creature — Human Peasant",
          "rarity": "U",
          "layout": "standard",
          "pt": "3/3",
          "rules": "When this creature enters, you may return a land card from your graveyard to your hand.",
          "mechanics": "Land recovery",
          "origin": "NEW",
          "treatment": "",
          "archetypes": "GW/GU/BG — lands / ordinary work",
          "story": "Book XXIV / the worked estate is maintained through ordinary agricultural labor, including gathering material and tending the vineyard’s boundaries.",
          "storyTarget": "Book XXIV / maintenance of Laertes’s cultivated vineyard and estate.",
          "cycleIds": [
            "flavor.odysseus-world",
            "flavor.crafts-making",
            "story.reconciliation",
            "cast.laertes"
          ],
          "primaryArt": "ART-609",
          "rulesSource": "14A2 · Card File v1.0 Candidate · revision 256"
        },
        "source": "Live Studio Recast confidence filter, 2026-10-01; current candidate sequence and preserved archives",
        "absorbedBy": []
      },
      "target": {
        "color": "G",
        "rarity": "U",
        "mana": "{2}{G}",
        "mv": 3,
        "type": "Creature — Human Peasant",
        "layout": "standard",
        "archetypes": "GW/GU/BG — lands / ordinary work",
        "cycleIds": [
          "flavor.odysseus-world",
          "flavor.crafts-making",
          "story.reconciliation",
          "cast.laertes"
        ],
        "story": "Book XXIV / maintenance of Laertes’s cultivated vineyard and estate."
      },
      "fill": {
        "priority": "high",
        "role": "Green uncommon midcurve creature",
        "direction": "A green midcurve creature linking ordinary agricultural work to lands, recursion, or sustainable resources. Test against other green value bodies before choosing the effect.",
        "avoid": [
          "Automatically restoring the previous land-return ETB body."
        ],
        "basis": "Editorial recommendation from the retained color/rarity/type budget, story target, archetypes, and cycle membership; mana cost, old title, and exact design are flexible."
      }
    },
    "290": {
      "schema": "odyssey-open-slot/v1",
      "revision": "open-slots-20261001",
      "label": "Open GW rare · GW build-around",
      "matchReasons": [
        "explicit-recast-confidence",
        "empty-rules"
      ],
      "origin": {
        "previousName": "The House Endures",
        "names": [
          "The House Endures",
          ""
        ],
        "reason": "Previously marked Recast and stripped to its structure; complete rejected design remains archived.",
        "archive": "data/open-slot-archive.20261001.json",
        "archiveNumber": 290,
        "priorArchive": "data/recast-archive.20260930.json",
        "previousDesign": {
          "id": "ODY-290",
          "number": 290,
          "name": "The House Endures",
          "displayName": "The House Endures",
          "underlyingName": "",
          "mana": "{1}{G}{W}",
          "mv": 3,
          "color": "GW",
          "frame": "M",
          "type": "Enchantment",
          "rarity": "R",
          "layout": "standard",
          "pt": "",
          "rules": "At the beginning of your second main phase, if one or more creatures you control are tapped, put a +1/+1 counter on up to one target creature you control.\nWhenever an enchantment you control enters, untap up to one target creature you control. This ability triggers only once each turn.",
          "mechanics": "Tapped creatures; enchantments; counters",
          "origin": "NEW",
          "treatment": "",
          "archetypes": "GW — Survival / enchantments / household",
          "story": "A functioning house survives absence because work continues: people tap themselves to labor, rituals repeat and the structure refreshes those who sustain it.",
          "storyTarget": "GW rare Survival/enchantment engine.",
          "cycleIds": [
            "rare.pair-buildarounds",
            "flavor.odysseus-world"
          ],
          "primaryArt": "ART-040",
          "rulesSource": "14A2 · Card File v1.0 Candidate · revision 256"
        },
        "source": "Live Studio Recast confidence filter, 2026-10-01; current candidate sequence and preserved archives",
        "absorbedBy": []
      },
      "target": {
        "color": "GW",
        "rarity": "R",
        "mana": "{1}{G}{W}",
        "mv": 3,
        "type": "Enchantment",
        "layout": "standard",
        "archetypes": "GW — Survival / enchantments / household",
        "cycleIds": [
          "rare.pair-buildarounds",
          "flavor.odysseus-world"
        ],
        "story": "GW rare Survival/enchantment engine."
      },
      "fill": {
        "priority": "high",
        "role": "GW rare household engine",
        "direction": "A coherent GW build-around for a household sustained by labor, enchantments, or Survival; reward a clear play pattern.",
        "avoid": [
          "Duplicating The House of Odysseus at #242.",
          "A broadly good engine with no archetype identity."
        ],
        "basis": "Editorial recommendation from the retained color/rarity/type budget, story target, archetypes, and cycle membership; mana cost, old title, and exact design are flexible."
      }
    },
    "297": {
      "schema": "odyssey-open-slot/v1",
      "revision": "open-slots-20261001",
      "label": "Open BG rare · BG build-around",
      "matchReasons": [
        "explicit-recast-confidence",
        "empty-rules"
      ],
      "origin": {
        "previousName": "Memory Beneath the Earth",
        "names": [
          "Memory Beneath the Earth",
          ""
        ],
        "reason": "Previously marked Recast and stripped to its structure; complete rejected design remains archived.",
        "archive": "data/open-slot-archive.20261001.json",
        "archiveNumber": 297,
        "priorArchive": "data/recast-archive.20260930.json",
        "previousDesign": {
          "id": "ODY-297",
          "number": 297,
          "name": "Memory Beneath the Earth",
          "displayName": "Memory Beneath the Earth",
          "underlyingName": "",
          "mana": "{1}{B}{G}",
          "mv": 3,
          "color": "BG",
          "frame": "M",
          "type": "Enchantment",
          "rarity": "R",
          "layout": "standard",
          "pt": "",
          "rules": "Whenever one or more permanent cards leave your graveyard, put a charge counter on this enchantment. This ability triggers only once each turn.\nRemove three charge counters from this enchantment: Return target permanent card from your graveyard to your hand.",
          "mechanics": "Graveyard; charge counters; recursion",
          "origin": "NEW",
          "treatment": "",
          "archetypes": "BG — graveyard / Escape / recursion",
          "story": "Burial does not erase relationship: graves, ancestors and recovered objects keep the past materially present beneath ordinary life.",
          "storyTarget": "BG rare graveyard-resource engine.",
          "cycleIds": [
            "rare.pair-buildarounds",
            "flavor.gesture-social-ritual"
          ],
          "primaryArt": "ART-295",
          "rulesSource": "14A2 · Card File v1.0 Candidate · revision 256"
        },
        "source": "Live Studio Recast confidence filter, 2026-10-01; current candidate sequence and preserved archives",
        "absorbedBy": []
      },
      "target": {
        "color": "BG",
        "rarity": "R",
        "mana": "{1}{B}{G}",
        "mv": 3,
        "type": "Enchantment",
        "layout": "standard",
        "archetypes": "BG — graveyard / Escape / recursion",
        "cycleIds": [
          "rare.pair-buildarounds",
          "flavor.gesture-social-ritual"
        ],
        "story": "BG rare graveyard-resource engine."
      },
      "fill": {
        "priority": "high",
        "role": "BG rare graveyard engine",
        "direction": "A coherent BG engine connecting burial, ancestors, Escape, or cards leaving the graveyard. Ensure it offers a different payoff from Sacred Grove of Persephone at #194.",
        "avoid": [
          "Duplicating the new Persephone grove graveyard-departure payoff."
        ],
        "basis": "Editorial recommendation from the retained color/rarity/type budget, story target, archetypes, and cycle membership; mana cost, old title, and exact design are flexible."
      }
    },
    "301": {
      "schema": "odyssey-open-slot/v1",
      "revision": "open-slots-20261001",
      "label": "Open R rare · crew payoff",
      "matchReasons": [
        "explicit-recast-confidence"
      ],
      "origin": {
        "previousName": "Every Oar in Rhythm",
        "names": [
          "Every Oar in Rhythm",
          ""
        ],
        "reason": "Explicit confidence 0 (Recast) in live Studio on 1 October 2026; playable design archived before reset.",
        "archive": "data/open-slot-archive.20261001.json",
        "archiveNumber": 301,
        "priorArchive": "",
        "previousDesign": {
          "id": "ODY-301",
          "number": 301,
          "name": "Every Oar in Rhythm",
          "displayName": "Every Oar in Rhythm",
          "underlyingName": "",
          "mana": "{2}{R}",
          "mv": 3,
          "color": "R",
          "frame": "R",
          "type": "Enchantment",
          "rarity": "R",
          "layout": "standard",
          "pt": "",
          "rules": "At the beginning of your second main phase, if two or more creatures you control are tapped, create a Treasure token. This ability triggers only once each turn.\nCreatures that crewed a Vehicle this turn get +1/+0 until end of turn.",
          "mechanics": "Tapped creatures; Treasure; combat",
          "origin": "NEW",
          "treatment": "",
          "archetypes": "RW/UR — Survival / Vehicles",
          "story": "Sailor knowledge / disciplined rhythm turns the effort of many tired bodies into speed, supplies and collective force.",
          "storyTarget": "Sailor knowledge / disciplined rhythm turns the effort of many tired bodies into speed, supplies and collective force.",
          "cycleIds": [
            "flavor.sailor-knowledge",
            "group.wandering-crew"
          ],
          "primaryArt": "ART-113",
          "rulesSource": "14A2 · Card File v1.0 Candidate · revision 256"
        },
        "source": "Live Studio Recast confidence filter, 2026-10-01; current candidate sequence and preserved archives",
        "absorbedBy": []
      },
      "target": {
        "color": "R",
        "rarity": "R",
        "mana": "{2}{R}",
        "mv": 3,
        "type": "Enchantment",
        "layout": "standard",
        "archetypes": "RW/UR — Survival / Vehicles",
        "cycleIds": [
          "flavor.sailor-knowledge",
          "group.wandering-crew"
        ],
        "story": "Sailor knowledge / disciplined rhythm turns the effort of many tired bodies into speed, supplies and collective force."
      },
      "fill": {
        "priority": "high",
        "role": "Red rare Vehicle/tapping engine",
        "direction": "A compelling red engine that makes coordinated rowing, crewing, or tapped creatures generate momentum during useful phases of the turn.",
        "avoid": [
          "Restoring a crew combat bonus that arrives after combat.",
          "Repeating generic Treasure generation without a Vehicle or labor identity."
        ],
        "basis": "Editorial recommendation from the retained color/rarity/type budget, story target, archetypes, and cycle membership; mana cost, old title, and exact design are flexible."
      }
    }
  }
};
root.ODYSSEY_OPEN_SLOTS=manifest;
if(root.ODYSSEY_DATA&&root.OdysseyOpenSlots)root.OdysseyOpenSlots.apply(root.ODYSSEY_DATA,manifest);
if(typeof module!=='undefined'&&module.exports)module.exports=manifest;
})(typeof window!=='undefined'?window:globalThis);
