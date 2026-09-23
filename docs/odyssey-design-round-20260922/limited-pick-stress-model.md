# Limited pick-stress model

**Date:** 23 September 2026  
**Seed:** 20260923  
**Runs:** 5,000 per pair/scenario  
**Collation:** `odyssey-core-fin-playbooster-v1`

This is deliberately **not a draft bot**. It asks a narrower question: if support is treated as a high pick by any drafter already committed to a compatible colour, how much of the package reaches the target seat?

## Scenarios

- **Open:** no other seat shares either target colour.
- **One each:** one other seat shares each target colour; no mirror pair.
- **Two each:** two other seats share each target colour; no mirror pair.
- Packs pass left/right/left.
- Gold signposts are prioritised over mono-uncommon support, then common support.
- All other cards are filler.
- No ratings, signalling, pivots, splash decisions, deck construction or games are represented.

## GU — Manifest / uncertain voyage

Direct sources counted: ODY-088 G, ODY-116 U, plus ODY-017 U at uncommon. The green uncommon bridge ODY-042 and blue bridge ODY-018 are **not** counted in the direct-source total, making this a stricter test.

| Scenario | Mean common sources | Mean direct sources incl. ODY-017 | ≥2 direct | ≥3 direct | ≥1 GU signpost | ≥2 direct + signpost |
|---|---:|---:|---:|---:|---:|---:|
| Open | 4.47 | 5.36 | 97.6% | 91.6% | 83.2% | 81.2% |
| One each | 2.07 | 2.49 | 72.7% | 45.4% | 82.6% | 59.3% |
| Two each | 1.39 | 1.66 | 50.7% | 22.7% | 83.0% | 41.2% |

The signpost percentages stay high in these scenarios because they deliberately exclude a second GU drafter; a mirror drafter would compete for them too.

## WU — Recognition / return

Common package counted: ODY-005, ODY-007, ODY-112 and ODY-116. ODY-017 is counted as a mono-blue face-down/Manifest bridge.

| Scenario | Mean common support | Mean support incl. ODY-017 | ≥2 support | ≥3 support | ≥1 WU signpost | ≥2 support + signpost |
|---|---:|---:|---:|---:|---:|---:|
| Open | 8.62 | 9.47 | 100.0% | 99.8% | 83.2% | 83.2% |
| One each | 4.04 | 4.46 | 95.6% | 85.7% | 84.3% | 80.4% |
| Two each | 2.75 | 3.02 | 83.4% | 60.9% | 84.0% | 69.4% |

## WB — death / household attrition

The stress subset intentionally counts only four direct common resources: ODY-008 Food, ODY-108 Food, ODY-136 Food and ODY-101 sacrifice. It omits other death, recursion and graveyard support, so this is not a full-archetype ceiling.

| Scenario | Mean direct common support | ≥2 support | ≥3 support | ≥1 WB signpost | ≥2 support + signpost |
|---|---:|---:|---:|---:|---:|
| Open | 6.83 | 99.5% | 97.7% | 83.3% | 82.9% |
| One each | 3.38 | 87.9% | 68.7% | 83.3% | 72.7% |
| Two each | 2.30 | 68.8% | 41.2% | 83.4% | 56.7% |

## Decision

GU is clearly the most competition-sensitive package, but **do not add a third GU common Manifest source yet**.

The current structure already satisfies the modern Play Booster archetype floor: two monocolour commons, useful monocolour uncommons in both colours, and two multicolour cards. ODY-017 gives blue a third direct Manifest source; ODY-042 supports the land/voyage half of Voyage into Unknown Shores; ODY-018 reinforces exile/face-up play. Burning another common now would be reacting to an intentionally harsh model before any real drafting.

Reopen the common-density question if actual drafts show that GU is plausibly open yet cannot acquire enough Manifest/exile play, or if Voyage's four-cards-in-exile condition routinely fails.

Wizards design guidance:
- https://magic.wizards.com/en/news/making-magic/nuts-and-bolts-16-play-boosters
- https://magic.wizards.com/en/news/announcements/play-booster-discord-q-and-a
