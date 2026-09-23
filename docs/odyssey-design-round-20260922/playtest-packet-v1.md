# Odyssey playtest packet v1

**Date:** 23 September 2026  
**Purpose:** reproducible gameplay tests for the isolated 42-card candidate.  
**Not a draft result:** the base lists are the existing hand-built diagnostic decks.

Use the exact lists in `common-mechanics-audit.json` as the base. The swaps below create focused test variants while preserving 40 cards and 17 lands unless stated otherwise.

## Deck A — GU Core

Use the GU diagnostic list unchanged.

Primary questions:
1. How many Manifest Fate events occur in a normal game?
2. Does Voyage's ramp trigger feel useful with only one or two Manifest events?
3. Record the highest number of owned cards simultaneously in exile and the turn reached.
4. Does Calypso create a meaningful face-down creature before six mana?
5. Does the four-exile draw clause ever turn on naturally?

## Deck B — GU Engine Stress

Start with GU Core.

Add:
- ODY-017 Ordeal of the Sirens
- ODY-018 Read the Hidden Course
- ODY-024 Trace the Omen

Remove:
- ODY-035 Invoke the Muse
- ODY-041 Test the Swineherd
- ODY-137 Limestone Goat

This is deliberately denser than an average draft deck. If Voyage's four-exile draw still never appears here, flag the threshold for review.

## Deck C — WU Recognition

Use the WU diagnostic list unchanged for the first games.

Second pass:
- add ODY-017 Ordeal of the Sirens
- add ODY-018 Read the Hidden Course
- remove one Seabird Lookout
- remove one Depth-Sounding Sailor

Record every Mentor/Nausicaa trigger and classify the enabling event as:
- blink / direct return from exile
- Manifest Fate exile event
- turning face up
- cast from exile that **does not** count as entering from exile

If a rules explanation is needed more than once per game, record that as a comprehension failure even if the engine is balanced.

## Deck D — WB Antinous

Use the WB diagnostic list unchanged.

Track:
- turn Antinous enters
- resource sacrificed each end step (Food or creature)
- Antinous size after each activation
- whether the sacrifice was genuinely costly
- life lost by opponent
- whether Medon makes creature sacrifice substantially better than Food sacrifice

Fallback to test only after evidence: Antinous 2/3 with identical rules.

## Deck E — UB Iphigenia

Start with the UB diagnostic list.

Add:
- ODY-015 Iphigenia's Sacrifice

Remove:
- one Spellbound Swine

Track:
- creature sacrificed and its prior material value
- whether Iphigenia is held because the additional cost is too punishing
- whether casting it creates a decisive attack
- whether being countered after the sacrifice feels appropriately dangerous
- cards drawn versus board material lost

## Deck F — WU Penelope Saga Stress

Start with WU Recognition.

Add:
- ODY-174 Penelope, Patient Queen
- ODY-216 Lay of the Hidden King
- ODY-215 The Contest of the Bow

Remove:
- one Libation Attendant
- one Household Cupbearer
- one Depth-Sounding Sailor

If testing a longer rare-heavy sandbox, add Peace Restored to Ithaca in place of the second Seabird Lookout.

Track:
- lore counters removed
- chapters replayed
- number of turns a final chapter is delayed
- Omens used as the enchantment entry
- whether Penelope's graveyard-return ability is actually affordable while holding interaction
- any board state that feels locked rather than merely value-generating

## Deck G — hybrid Saga rate inserts

Test the relevant hybrid Saga by replacing the least synergistic three- or four-mana filler in its pair diagnostic deck:

- UR: ODY-097 Song of Hephaestus's Net
- BG: ODY-162 Song of the Faithless Crew
- RW: ODY-163 Song of Achilles
- WB: ODY-232 Lament at the Blood-Trench
- GU: ODY-245 Song of the Faithful Queen

For each, record chapter-by-chapter material gained/lost and whether the card is still desirable when cast using only either half of its hybrid identity.

## Deck H — Bag normal-progression test

Put ODY-235 The Bag Is Opened into UR and RG separately, replacing a three-mana filler.

First games must **not** include Penelope or other lore-counter manipulation.

Record:
- how many of the chapter-I cards are actually played
- whether chapter-II mana is spent efficiently
- whether chapter-III land loss makes the Saga undesirable in hand
- turn and land count when the land is sacrificed

Only after normal progression is understood should a three-colour WUR sandbox test repeat chapter II.

## Match matrix

Play at least two games on each side of the play/draw where practical:

1. GU Core vs WU Recognition
2. GU Engine Stress vs WB Antinous
3. WB Antinous vs RG Survival
4. UB Iphigenia vs RW coordinated attack
5. WU Penelope Saga Stress vs UB control
6. UR + Song of Hephaestus's Net vs BG + Song of the Faithless Crew
7. GU + Song of the Faithful Queen vs RW + Song of Achilles
8. UR Bag vs WU Recognition
9. RG Bag vs WB Antinous

The purpose is not a win-rate claim. Stop and revise only for a clear functional/rules problem or a repeated play pattern that answers one of the stated questions.

## Game record

For every game record:
- matchup and deck version
- play/draw
- mulligans
- opening seven
- turn the archetype first performed its advertised action
- signposts drawn / cast
- relevant engine events and turns
- removal/interaction that broke the engine
- final turn and winner
- one sentence: did the deck *feel like its Odyssey action*?

Keep analytical simulations and real games in separate records.
