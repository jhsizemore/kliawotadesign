# Gameplay preflight

**Date:** 23 September 2026  
**Status:** analytical pre-playtest only. No matches, drafts or Commander games are represented here.

This pass converts the remaining gameplay questions into explicit expectations before real games. The goal is to avoid changing cards merely because an intentionally harsh supply model looks scary, while also flagging engines that should be watched from game one.

## GU — Voyage into Unknown Shores

The common-pair diagnostic deck contains:
- 1 Voyage into Unknown Shores
- 2 Lotus-Fed Wanderer
- 1 Omen of the Dreaming Queen
- 1 Poseidon's Storm Foretold
- 1 Dolphins Beside the Bow

That is three immediate Manifest Fate cards plus two Foretell cards. A purpose-built engine version adds Ordeal of the Sirens and Trace the Omen.

A deterministic Monte Carlo goldfish (seed 20260923; 150,000 runs per configuration) played one land per turn, cast Voyage when possible, fired Manifest effects when mana allowed, and allowed Foretell cards to remain parked in exile to help the threshold. Ordeal was treated optimistically as completing after three successful turns. Opponent interaction, colour screw, creature requirements and the opportunity cost of leaving a foretold spell uncast were ignored.

### Probability Voyage's four-exile draw mode is online

| Build | By turn 6 | By turn 8 | By turn 10 | Conditional by turn 10 if Voyage has been seen |
|---|---:|---:|---:|---:|
| Core GU diagnostic | 0.2% | 0.9% | 2.3% | 5.6% |
| Engine-heavy GU | 0.9% | 3.2% | 7.0% | 17.4% |

For comparison, changing the threshold to three cards in exile raises the turn-10 conditional rates to roughly 26% for the core build and 47% for the engine-heavy build.

**Decision:** keep **four** for the first played games. Voyage is already functional on the first Manifest because it ramps a land from hand. Treat the draw clause as a late accumulating-alternatives bonus, not an archetype-entry requirement. Reopen at three only if real games show the clause is functionally invisible even in long games.

## WB — Antinous, First Suitor

The WB diagnostic deck has Antinous plus two Household Cupbearers, Salt-Cured Fish, Seat the Guest by the Hearth and several cheap creatures. A 300,000-run on-curve draw model used 17 lands, Antinous, the three turn-two Food-producing cards (two Cupbearers + Fish), and four other cheap creatures.

- Antinous can be cast on turn three in about **17.6%** of random games with one copy in the deck.
- Conditional on that on-curve Antinous, a Food is already available about **42.1%** of the time.
- Conditional on that on-curve Antinous, either Food or another cheap creature is available to sacrifice about **75.2%** of the time.

This means an immediate turn-three 4/4 plus one-point drain is plausible, but not free: Food is consumed instead of cashed for life, and sacrificing a creature is real material loss.

**Decision:** keep the 3/3 body for first games. Watch whether Food makes the first counter feel automatic and whether repeated end-step growth snowballs too hard. The first fallback is 2/3, not removal of the story-defining sacrifice engine.

## WU — recognition

The current WU package contains two direct common blink/return cards, Omen of the Dreaming Queen, face-up rewards on Mentor and Nausicaa, and additional exile/Foretell bridges. Both signpost payoff abilities are capped once each turn where repetition would otherwise compound.

**Decision:** no pre-game nerf. The key played-game questions are whether the triggers are understood without rules coaching and whether blink plus inexpensive enter abilities creates too much repeat value.

## Penelope / Omens / Sagas

Penelope can remove one lore counter whenever an enchantment enters, once each turn. Flash Omens therefore let her preserve or replay Saga chapters across multiple turns, but they do not counter a chapter already on the stack.

Important rate boundary: **The Bag Is Opened is red and Penelope is WU.** It cannot appear in a Penelope Commander deck under normal colour-identity rules. Their chapter-II repeat engine is therefore a three-colour Limited/Constructed sandbox interaction, not a default Commander loop.

The WU main-set stress Sagas are:
- Lay of the Hidden King
- The Contest of the Bow
- Peace Restored to Ithaca

**Decision:** test Penelope first with these in-colour Sagas and the two W/U Omens. Do not balance her around the red Bag interaction before an actual three-colour game demonstrates a problem.

## Hybrid Sagas

- **Song of the Faithless Crew** is the first rate watch: three mana eventually gives mill three, Food + Treasure, then a creature back to hand. The colour-pie repair is clean, but the accumulated material may be high for uncommon.
- **Song of the Faithful Queen** is the opposite watch: after the GU overlap repair, chapter III may be too modest.
- RW, WB and UR currently have no analytical rate blocker.

No rate change is authorised by this preflight.

## Rare/mythic questions that remain genuinely game-dependent

- **Iphigenia's Sacrifice:** multiplayer attack opening and two cards versus losing a nontoken creature as an additional cost.
- **Olive-Wood Bed of Ithaca:** protected repeat draw in legend-dense Commander decks.
- **The Bag Is Opened:** whether normal progression is worth the chapter-III land loss, and whether chapter-II repetition is actually abusive.
- **Penelope, Patient Queen:** whether once-per-turn unweaving is too easy to sustain with normal WU enchantment density.

These are not meaningfully settled by more inventory math.
