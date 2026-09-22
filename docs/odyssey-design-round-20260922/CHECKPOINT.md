# Odyssey flavour foundation — first-pass checkpoint

Status: review candidate; the design contract is not complete.

Base: main at `7d8828cd15ecc92a0de7eb1d577a8ad6bcbde03d`, Studio release
`2026-09-22.5`, dataset `2026-09-22.3`. Retrieved 22 September 2026.

## Completed in this checkpoint

- Reconciled the live dataset, repository and 13 core authoring-sheet fields across
  all 309 records. No normalized sheet differences. Archived seven open notes.
- Authored 309 first-pass briefs: actions, sequences, emotions, portrayal
  distinctions and mechanical hooks. Commons were assessed first. Higher-rarity
  attributes are currently expressed within the action and portrayal prose.
- Created an isolated 33-card candidate, including 23 commons, five Omens,
  Saga-unweaving rare Penelope and Iphigenia’s actual sacrifice (corrected by Hunter).
- Preserved 309 cards, the rarity allocation, 40 lands, one DFC and artwork
  assignments. Common enchantments rise from two to nine; creatures from 33 to 36.
- Recorded all 309 cards as missing dedicated quotation text, and verified five
  short quotation candidates. Existing flavour commentary is not quotation text.
- Recorded source distinctions, cycle membership, reference comparisons and
  per-card test questions. Twelve changes have newly verified benchmark cards.

## Verification and limits

Candidate structural assertions pass. Existing reference-card tests pass 11/11.
The generated report's JavaScript was executed against a DOM stub: all 309 cards,
33 changed-card results, 23 changed commons and the Penelope search behaved as
expected. This is functional verification, not visual browser verification.
Chromium installation failed; rendered desktop/mobile inspection remains pending.

No matches, drafts or Commander games have been played. Pack-access calculations
are explicitly hypothetical analytical diagnostics. Most source passages and
quotation choices still require detailed review. Production references, quotation
fields, card renders and authoring-sheet updates remain outstanding.

Production data, the authoring sheet and the live Studio note queue are unchanged.
Nothing in this checkpoint represents deployment or note closure.

## Resume here

1. Test the selected directions in `decisions.md`: WU Penelope; Iphigenia’s
   actual sacrifice, preserving the UB slot. Retain the current 16 Saga
   faces and signpost exceptions provisionally while their architecture is reviewed.
2. Finish passage checks and quotation candidates, prioritising changed commons
   and their associated signposts. Keep adaptations and ancient variants distinct.
3. Test the common foundations and repeated Omen/Penelope interactions using
   `candidate-changes.json` questions. Record actual results separately from models.
4. Develop the flagged Antinous, immovable-bed and opened-wind-bag mismatches.
5. Refresh final comparisons, integrate accepted designs with concurrency checks,
   support quotation provenance in data/rendering, inspect card space, then publish
   and verify before closing notes.

## Reproduce

From the repository root, run these scripts in order:

```sh
python3 scripts/odyssey-design-round-audit.py
python3 scripts/odyssey-design-round-candidate.py
python3 scripts/odyssey-design-round-report.py
```

The audit replays archived evidence in `inputs/`; it does not perform a fresh
network read. Refresh those inputs deliberately before a new live reconciliation.
The report is written beside the repository as
`odyssey-making-of-first-pass.html`. The JSON records and scripts are the resumable
source; that standalone HTML is the user-facing review copy.

## Delivery checkpoint

The first pass was committed locally on `odyssey/flavour-foundation-20260922`.
Automatic approval review blocked the attempted GitHub push because explicit
authorization for exporting the design documents and source snapshots to that
destination was not established. No fallback push or pull request was attempted.
The standalone review report and a complete checkpoint ZIP were prepared for
private delivery. Resume from the ZIP if the transient checkout is unavailable.

Hunter subsequently authorized the checkpoint push and WU Penelope, then explicitly rejected the Iphigenia rescue tradition. The current candidate reflects actual sacrifice. The earlier push blocker was authorization; the authorized shell retry then failed for missing Git credentials. The connected GitHub route is being used to publish the checkpoint.
