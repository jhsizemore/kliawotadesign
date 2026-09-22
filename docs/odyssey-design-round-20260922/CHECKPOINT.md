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
python3 scripts/odyssey-common-mechanics-audit.py
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

Publication completed through the connected GitHub account: branch `odyssey/flavour-foundation-20260922`, draft PR https://github.com/jhsizemore/kliawotadesign/pull/4, initial remote checkpoint commit `1d367e4028553365c934b13859e7d48e226c12b3`. Production remains unchanged.

## Second checkpoint: common mechanics

All ten pairs have a rules-based allocation and a hand-built 40-card diagnostic list. Seventeen manual timing traces distinguish analytical conclusions from played games. Candidate fixes affect ODY-125 and ODY-142; 33 changed slots and all structural totals remain fixed. Re-run the mechanics audit before the report generator. The next priority is WU recognition support and the Antinous story mismatch; see the new audit and timing documents.

## Third checkpoint: recognition and Antinous

Recovered the exact published branch after workspace maintenance. Revised ODY-007, ODY-051, ODY-090 and ODY-056; 37 total changed slots, 24 commons. WU has two common direct-blink sources and both signposts explicitly reward face-up events. Antinous consumes household resources at the end step. Updated four briefs, comparisons, WU diagnostic deck and timing traces; no production integration or games claimed. Resume with `recognition-and-antinous.md`. The next specific redesigns are ODY-213 (immovable bed) and ODY-235 (opened wind bag).

## Fourth checkpoint: bed and opened wind bag

ODY-213 now binds its protection and two-legend reunion draw to a chosen land; ODY-235 now sequences impulse access, red mana and land sacrifice. The candidate changes 39 slots, still 24 commons, and preserves all structural totals. `bed-and-wind-bag.md` records the source interpretations, printed comparisons and twelve manual cases, including Penelope before/after the final chapter triggers. The wind bag’s existing boar-hunt art is flagged for separate review. No played games or deployment are claimed. These designs supersede the earlier bed/wind-bag mismatch backlog. Next contract gates: remaining source/quotation work, architecture and collation, final references, gameplay testing and production integration.


## Fifth checkpoint: architecture and Omen sources

The architecture review resolves two provisional discrepancies without changing any card slots. Keep 16 Saga-bearing physical cards: the skeleton has 15 Saga-layout cards plus the Saga face of the single permitted DFC. Keep all four nonlegendary signposts because each carries an intentional mechanical bridge: ODY-153 UR spells, ODY-059 RW Vehicles/Survival, ODY-179 BG graveyard departures and ODY-060 GU Manifest Fate/exile. The stale signpost cycle register omitted ODY-153 and now records the same 20 signposts as the card data.

Passage-level review of the five common Omens verified their intended Homeric scenes. Three candidate records still carried pre-Omen source prose and are corrected: ODY-127 now uses Theoclymenus's darkened-hall vision in Book XX; ODY-135 uses the bellowing slaughtered cattle in Book XII; ODY-139 uses the hawk carrying a dove in Book XV. The white clear-sky thunder and blue dream of the geese remain correctly mapped. Five short exact Butler-translation quotation candidates are added to the candidate bank; none is yet final flavour text or written into production card records.

Production data, the 14A2 authoring Sheet and live Studio remain unchanged. Next concrete gate: audit all five enemy-hybrid Sagas under the hybrid colour-pie rule, then continue changed-common passage verification and collation before any integration.


## Sixth checkpoint: hybrid Saga gate

The enemy-hybrid Saga cycle has been audited under the actual hybrid “or” rule rather than gold-card logic. Three candidate revisions are added, bringing the isolated candidate from 39 to **42 changed slots** without altering the 309-card skeleton, rarity counts, lands or DFC count.

- ODY-097 becomes **Song of Hephaestus's Net**; Odyssey VIII confirms Demodocus performs the scene as a song.
- ODY-162 keeps BG, but chapter II now simply creates a Food and a Treasure.
- ODY-245 keeps GU, but chapter III now untaps up to two creatures and/or lands rather than arbitrary permanents.
- ODY-163 RW and ODY-232 WB pass without mechanical revision.

The generator/report inputs are also updated so the earlier Omen source corrections and expanded ten-card quotation bank survive a rebuild rather than being overwritten.

No played matches have been performed. Production data, the 14A2 authoring Sheet and live Studio remain unchanged. Next gate: continue passage verification across the remaining changed commons, then collation/reference refresh before integration.


## Seventh checkpoint: changed-common source pass complete

All **24 changed commons** now have passage-level review or an explicit extension classification. The final ten pending common briefs were checked against Odyssey III, V, VII, IX, XI, XII and XXIV.

Six are directly grounded in the narrated action: ODY-044 rowing under command, ODY-064 ordinary ship/oar labour, ODY-074 bread set before the stranger, ODY-103 libation service, ODY-108 mixed wine service, and ODY-142 the drink-offering to the dead.

Four are intentionally not represented as literal Homeric actions:
- **ODY-087 Seabird Lookout:** Book V supplies cormorant and sea-gull imagery; mortal bird-reading navigation is an explicit seamanship/natural-world extension.
- **ODY-112 Dolphins Beside the Bow:** Book XII explicitly contains dolphins as Scylla's prey; dolphins pacing a ship are an explicit fauna extension.
- **ODY-115 Depth-Sounding Sailor:** Book IX supplies practical ship/oar work but no sounding. Historical sounding practice is separately sourced as an ancient-Mediterranean seamanship extension.
- **ODY-123 Shade of the Waiting House:** Book XXIV supplies named ghosts in Hades; Escape back into play is explicitly fantasy extension.

This closes the **changed-common passage-verification gate** without claiming that extension material appears in Homer. The report generator now preserves those classifications on rebuild.

Production data, 14A2 and live Studio remain unchanged. Next contract gate: settle booster/collation assumptions and use them to test whether the common mechanical foundation is actually reachable in Limited, then refresh candidate references before played games.
