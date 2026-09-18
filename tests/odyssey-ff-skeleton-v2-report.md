# Odyssey Analysis Candidate — FINAL FANTASY Skeleton Pass v2

Date: 2026-09-18
Before-state commit: ea2471aa7e1339ff0e22c260c827acddbf158e20
Before-state candidate blob: 02c1acad0c97c3022fcdb23cf057202d933188b1
Main candidate dataset: `public/mtgtools/odyssey/data/odyssey-analysis-candidate-v1.json`
Production cutover: **not authorized**

## Result

The original 250-card Analysis Candidate is now the starting material for a **309-card main-set candidate**, matching the FINAL FANTASY main-set physical-card count and rarity skeleton while preserving Odyssey's own mechanical identity.

| Metric | FIN target | Odyssey candidate |
| --- | ---: | ---: |
| Main-set cards | 309 | 309 |
| Commons | 106 | 106 |
| Uncommons | 109 | 109 |
| Rares | 74 | 74 |
| Mythics | 20 | 20 |
| Lands | 40 | 40 |
| Legendary cards | 105 | 105 |
| Gold uncommon legendary signposts | 20 | 20 |
| MV 6 | 17 | 17 |
| MV 7+ | 14 | 14 |
| Normal skeleton slots | 260 | 260 |
| Transform skeleton slots | 27 | 27 |
| Saga skeleton slots | 15 | 15 |
| Adventure slots | 5 | 5 |
| Meld cards | 2 | 2 |

Every two-color pair has exactly two multicolor legendary uncommon signposts.

## How 250 became 309

- Promoted 17 existing commons to uncommon.
- Added 23 commons: 16 landmark basics and 7 additional common two-color Town lands.
- Rebuilt 3 existing generic common lands into the other 3 members of the 10-card Town cycle.
- Added 12 uncommon legendary creatures.
- Added 22 rares.
- Added 2 mythics.
- Rebuilt five existing allied Temple slots as the rare monocolor Adventure-land cycle.
- Reopened 11 inherited high-end slots and used the new rare/mythic space to match FIN's 17/14 split at MV 6 / MV 7+.

## Legendary and signpost architecture

Final legendary count: **105** (U 40, R 47, M 18).

The uncommon layer now has 40 legendary cards, including exactly two multicolor legendary signposts for each of WU, UB, BR, RG, GW, WB, UR, BG, RW and GU.

Ten previous nonlegendary signpost slots were rebuilt as named Odyssey figures (Mentor, Pontonous, Anticleia, Perimedes, Proteus, Medon, Melanthius, Polites, Euryalus and Sisyphus); ten already-correct gold legends were retained.

## Cycles and structural packages

- 16 landmark basic lands.
- 10 common two-color Town lands.
- 20-card gold-uncommon legendary signpost lattice.
- 5 rare monocolor Adventure lands.
- 5-card basic-landcycling smoothing cycle.
- 15 Saga-class story slots.
- 27 transform-class progression slots.
- 1 two-card meld pair.

Transform and meld counts are **candidate structural commitments**, not a claim that every back face has already received final renderer-ready rules/art. Back-face plans are recorded per card.

## Showcase / booster-fun analogs

- Greek-vase treatment analog: **50** cards (3 C / 12 U / 29 R / 6 M).
- Character showcase: **32** cards (4 U / 20 R / 8 M).
- Master-artist treatment: **10** cards (3 R / 7 M).
- Adventure-land showcase: **5** cards.
- Extended-art legendary pool: **98** cards (40 U / 44 R / 14 M).
- Odysseus, Cunning Voyager: **15** planned art treatments on one physical card.

## Other product layers

Outside the 309-card main-set count:
- Premium / Through-the-Ages analog: **64 cards**, treatment rarity 17 U / 32 R / 15 M.
- Four scene products × 6 cards: Cyclops Cave; Circe's Hall; Contest of the Bow; Recognition at the Olive-Wood Bed.
- Four Commander-deck product skeletons × 100 cards, **25 new cards per deck**: Homeward Bound; The Waiting House; Gods and Monsters; Counsel of the Dead.

## Soft benchmark audit

Functional rules-text means: C 16.8; U 26.5; R 35.2; M 50.5.

Type texture: 166 creatures; 22 artifacts; 54 enchantments; 31 instants; 21 sorceries; 40 lands.

Odyssey intentionally does **not** force FIN's artifact-heavy type mix. Enchantments carry much of Odyssey's mythic/worldbuilding density. Common/uncommon text stays inside the previously locked Odyssey readability bands instead of being padded just to imitate FIN prose averages.

## Draft-system translation

The main draft file retains the six-system Odyssey syllabus: Manifest Fate, Survival, Escape, Vehicles/Crew, Sagas, provisional Foretell.

FIN's Job Select and Tiered structures are modeled through Odyssey-native glue, scalable modes, Survival, Vehicles and the reopened high-end curve rather than imported as additional named mechanics. Adventure and Prepared remain signature treatments rather than high-as-fan systems.

## Source-sheet synchronization

The duplicated Google Sheet **14A — The Odyssey MTG — Analysis Candidate Card File v1** contains all 309 main-set rows in `Card File v1.0 Candidate`.

Candidate-only additive columns expose Skeleton Class, Cycle IDs, Showcase Programs, Product Layer, Back Face / Meld Plan, Signpost Pair, Functional Words and Change Status. Appended rows retain native Rarity, Origin and Status validation. `Skeleton Summary` contains target-vs-actual FIN metrics plus product/showcase counts.

## Isolation

Current/production Odyssey data was not edited. `datasetVersion` remains `analysis-candidate-v1`, and the candidate remains opt-in in Studio. Full before/after card changes are in `tests/odyssey-ff-skeleton-v2-ledger.json`.
