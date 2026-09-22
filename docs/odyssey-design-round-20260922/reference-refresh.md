# Printed component-reference refresh

**Date:** 23 September 2026  
**Candidate:** 42 changed slots  
**Result:** component-reference gate complete; balance remains gameplay-gated.

## Classification

- **13 cards:** requested fresh printed comparisons; all requested references verified.
- **28 cards:** existing production component benchmarks retained; no new printed comparison needed for the edited component.
- **1 card:** ODY-097 Song of Hephaestus's Net is naming-only; no rate refresh needed.
- **Missing requested comparisons:** 0.

## Fresh-reference set

| Candidate | Verified component references | What they establish |
|---|---|---|
| ODY-007 Wash the Stranger's Feet | Cloudshift; Ephemerate | One-mana blink baseline and repeatable-blink ceiling. |
| ODY-015 Iphigenia's Sacrifice | Sleep; Altar's Reap | Mass-tap component; sacrifice-as-additional-cost into two cards. |
| ODY-049 Omen of Clear-Sky Thunder | Omen of the Sun | White Flash Omen + delayed Scry chassis. |
| ODY-056 Antinous, First Suitor | Ravenous Squirrel | Creature/Food consumption engine comparison. |
| ODY-116 Omen of the Dreaming Queen | Omen of the Sea | Blue Flash Omen + delayed Scry chassis. |
| ODY-127 Omen of the Veiled Hall | Omen of the Dead; Mire's Grasp | Black Flash Omen chassis plus negative-stat removal component. |
| ODY-135 Omen of the Bellowing Meat | Omen of the Forge | Exact red Flash Omen/damage chassis comparison. |
| ODY-139 Omen of the Hunting Hawk | Omen of the Hunt | Green Flash Omen + delayed Scry chassis. |
| ODY-162 Song of the Faithless Crew | Flotsam; Tough Cookie | GU-hybrid self-mill/investigate precedent; green Food infrastructure. |
| ODY-174 Penelope, Patient Queen | Satsuki; Power Conduit; Scholar of New Horizons | Saga/lore-counter manipulation and counter-removal precedent. |
| ODY-213 Olive-Wood Bed of Ithaca | Flowering of the White Tree; Tome of Legends | Legendary protection and repeatable legendary-linked draw components. |
| ODY-235 The Bag Is Opened | Reckless Impulse; Seething Song | Two-card impulse window and red burst-mana component. |
| ODY-245 Song of the Faithful Queen | Flotsam; Shore Up; Tamiyo's Safekeeping | GU-hybrid investigate precedent; blue untap/hexproof; green hexproof protection. |

## Important limit

These references establish that the **components have printed precedent or a useful printed rate comparator**. They do not establish that the Odyssey combinations are balanced. Omen repetition, BG/GU hybrid Saga value, Penelope, Iphigenia, the rooted bed, the opened wind bag, WU recognition and Antinous all remain gameplay questions.

## Durable rebuild rule

`scripts/odyssey-design-round-report.py` now:
1. asserts every requested benchmark is present;
2. preserves requested/retained/naming-only review status;
3. preserves the locked FIN-style collation and pick-stress validation;
4. never reintroduces the obsolete 90-common placeholder pack model.
