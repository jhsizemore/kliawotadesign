# Odyssey reference refresh recovery — 22 September 2026

## Recovered state

The interrupted run had actually published release 2026-09-22.4, commit
350fcd813a47409d4bf8df1d2de1e29cb49af8e7: all 309 current cards had 1,604
references. The conversation had not recorded that completion.

Coverage did not establish reference quality. The prior selector matched
`battle` inside `battlefield`, admitted Mystery Booster playtest cards, ignored
Odyssey's `pt` field, treated rarity as a proxy for rate, and allowed broad
vocabulary overlap to determine costing and build-around suggestions.
Athena's Intervention, for example, had TL;DR and Council's Deliberation as
its costing pair instead of creature-blink comparisons.

## Completed correction

Release 2026-09-22.5 contains 912 distinct card-reference assignments:
293 best-rate roles, 293 baseline-rate roles, 118 mechanic/cycle roles,
41 identity roles and 198 build-around roles. A single printed card can have
multiple roles without appearing twice. All 309 cards are covered; the 16
basics use exact subtype identities. Every nonbasic has an explicit pair and
current-design comparison; every rare/mythic has two specific build-around
explorations. The source snapshot remains Scryfall Oracle Cards dated
2026-09-21T21:01:55.006+00:00. Future representative printings are resolved to
released printings of the same Oracle identity.

The selections and rationales are in `scripts/odyssey-reference-policy.json`.
They are editorial component comparisons, not mathematically proven maxima
or declarations that Odyssey is balanced. Each rationale states the purpose
and limits of the comparison. This matters for novel designs, multi-effect
spells, hybrid Sagas, and Adventure lands.

The generator now fails on source-design drift. The browser flags changed
rules, cost, body or identity and prevents marking stale references reviewed.
Review signatures include the actual design, selections and rationale rather
than invalidating every card when an unrelated Scryfall timestamp changes.
Multi-face references display separate names, types, costs and Oracle text.
The reference modal uses two desktop columns and one mobile column.

Push/PR checks validate checked-in editorial output. Explicit manual refresh
still rebuilds Scryfall facts and commits verified results. It cannot silently
replace curated selections or race another push with automatic rewriting.
The audit JSON records the previous and new selections against the recovered
commit. The actual Odyssey card designs, sheet, artwork and review-note queue
were not edited as part of this reference refresh.

## Validation

- 11 reference data/browser-state checks pass.
- 3 Python selection/exclusion/keyword-boundary checks pass.
- The broader local Odyssey suite has 25 failures, with exactly the same
  failing test names at the recovered commit and after this change; no new
  failures. These are existing card-release/templating expectations and are
  separate from the corrected reference tests. They have not been bypassed.
- Live deployment and visible browser checks are performed after pushing.

## Continuation

For subsequent design edits, reassess the affected policy entry against its
new rules and update that entry's source snapshot only after reviewing the
comparisons. Run the generator, integration, Python selection checks and Node
reference checks. Do not regenerate arbitrary costing pairs from text overlap.
Balance review and the seven currently open Studio notes remain separate work.
