# Common mechanics pass

Manual role classification with exact hypergeometric draw calculations. Probabilities ignore mulligans, casting colours and sequencing. Card counts are distinct IDs; deck counts include copies. No booster distribution, drafting, opponent decisions or actual games are simulated.

| Pair | Creatures | MV ≤2 creatures | Enchantments | Status |
|---|---:|---:|---:|---|
| WU | 11 | 4 | 4 | bridge added; needs games |
| UB | 13 | 4 | 4 | split support |
| BR | 16 | 5 | 4 | testable, narrow Food |
| RG | 17 | 4 | 2 | testable |
| GW | 15 | 3 | 4 | testable |
| WB | 14 | 4 | 6 | exploitation engine added |
| UR | 13 | 5 | 2 | two distinct lanes |
| BG | 17 | 3 | 4 | testable |
| RW | 14 | 5 | 4 | testable |
| GU | 14 | 3 | 2 | density watch |

## WU — Recognition / return

Two common direct-return spells (005, 007) now support both signposts. Mentor and Nausicaa also explicitly reward turning face up; the common Omen and Nausicaa Adventure supply hidden creatures. Casting a foretold creature still enters from the stack. Mentor’s recognition untap is capped once each turn; choose timing carefully around Survival.

## UB — Hidden identity / graveyard

Tiresias has Foretell, Escape and recovery support. Circe has two common Manifest sources but no friendly common Aura in these colours. Enchantment creatures do not satisfy enchanted. Plan: make the face-down sacrifice line the initial Circe test; do not count the Omens as creature enchantment.

## BR — Consumption / sacrifice

Two attack-trigger signposts supply repeatable outlets, and black has several death effects. Only colourless Salt-Cured Fish supplies Food at common in this pair. Plan: test artifact/creature sacrifice first; treat Hearthfire Cook as cross-pair support rather than a BR theme guarantee.

## RG — Labour / combat / Survival

Five common Survival bodies, big creatures and shared Vehicles form a clear route. Early untap tricks compete with Survival; using them can still be correct to save a creature. Plan: compare attack-first and crew-first lines without automatically moving every untap to the end step.

## GW — Hospitality / household labour

The pair has seven coloured common Food sources plus Salt-Cured Fish, four Survival bodies and cheap white creatures. Laertes has Libation Attendant, Traveler’s Amulet and Olive-Oil Lamp as common nonland MV1 recovery targets, alongside lands. Plan: test whether this narrow second signpost earns its slot.

## WB — Death / household attrition

Antinous consumes another creature or Food at your end step, grows and drains opponents. Medon rewards creature deaths while protecting continuity through recovery. Common Food sources 008, 108 and 136 and death-effect creatures supply the engine. The timing prevents an ordinary free sacrifice outlet on demand; copied triggers and extra end steps remain possible.

## UR — Seafaring / spells

Aeolus rewards Vehicles while the Wooden Horse rewards instants/sorceries. Flash Omens are enchantment spells and do not feed the Saga’s recovery or discount. Plan: test a Vehicle deck with useful instants; do not label every spell as instant/sorcery support.

## BG — Graveyard departures / endurance

Five common own-graveyard departure sources across the pair, counting Maidservants targeting your own graveyard; Escape can move several cards at once, while land recovery needs a land in the graveyard and a tapped worker. Plan: track available fuel and legal recovery objects, not just mill counts.

## RW — Crew / coordinated attack

Three colourless Vehicles and three common Survival bodies are accessible. Delayed ship recovery preserves Survival. Plan: test the three-mana ship and team-tap spell together for overly decisive attacks; resolve Telemachus after other relevant Survival triggers.

## GU — Manifest / uncertain voyage

Two common Manifest sources feed both signposts. Four owned cards in exile is a separate, demanding threshold: foretold cards stop contributing after being cast. Plan: measure sustained exile counts; do not infer four cards in exile from four past exile events.

## Diagnostic deck access

Ten 40-card hand-built lists are stored in the JSON. These are test fixtures, not drafted pools or recommended finished decks.

| Pair | Creatures | Cheap copies | Cheap creature in first 8 |
|---|---:|---:|---:|
| WU | 15 | 8 | 86.3% |
| UB | 16 | 6 | 76.4% |
| BR | 17 | 6 | 76.4% |
| RG | 17 | 5 | 69.4% |
| GW | 15 | 4 | 60.7% |
| WB | 15 | 7 | 82.0% |
| UR | 14 | 5 | 69.4% |
| BG | 17 | 6 | 76.4% |
| RW | 15 | 4 | 60.7% |
| GU | 15 | 4 | 60.7% |

## Remaining gates

- Lock booster distribution before draft claims.
- Expose the canonical Manifest Fate reminder; published card records use the custom action without defining it. Audit uses existing reference notes: top two, manifest one, exile the other.
- WU recognition and WB exploitation now have revised cards; rates, repeatability and draft access still need games.
- Play these lists; these calculations are not results of played games.
