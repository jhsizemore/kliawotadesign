# Odyssey regression baseline: diagnosis and resolution

Baseline: main `9b60d9502f990b478f2df8320761ebe5de32fd7a`, tested in Actions run 36540753794. The original command ran 260 tests: 229 passed, 31 failed. This document supersedes the preliminary interpretation in ODYSSEY_CI_BASELINE_20260929.md, not the evidence recorded there.

## Real runtime defect

The notation normalizer incorrectly turned `pay 1 life` into `pay {1} life`. It also treated an ordinary standalone quantity `X` as a mana symbol. This was a renderer bug, not an obsolete test to discard. Normalize numbers only in explicit mana-cost contexts, preserve life/energy/mana quantities, and retain the tests plus additional positive and negative cases. Stored card rules are not rewritten.

## Real metadata-integrity drift

The base card file identified itself as the September 27 release while release.json still advertised September 26 and an older card checksum. Candidate 2 contained the same cards as Current but retained an earlier production-version pointer. The repair recomputes the documented card-only checksum, aligns the release pointer, and rebuilds generated publication artifacts. Every card, artwork and coverage object is compared before and after and must remain exactly equal. The public candidate additionally carries a checksum of its resolved, published card list.

## Historical assertions applied to later designs

- The empty-slot report explicitly says `14A2-complete`, with zero remaining empty slots and the older cuts retained in its archive. Tests must not demand that now-filled slots become CUT again. The historical Calchas card remains testable in archived Candidate 1; its later replacement must not be reverted.
- The refinement plan and September 19 templating report describe archived Candidate 1. Their exact card names, rules, cycles, restrictions, evidence and numerical attributes are tested there. Current artwork source records and independently hashed delivered image bytes are still checked. No historical expectation is silently erased.
- The older card-reference library contains explicit source-card snapshots. The correct runtime behavior is to refuse to mark a comparison reviewed when the current design differs. Tests check the exact stored editorial policy and the real browser source-matching guard, rather than inventing new curated comparisons or rolling back current designs. Refreshing those editorial comparisons remains research work, not part of this site-readiness patch.
- The reminder review is an advisory ledger tied to the recorded earlier production revision, before the flavor-only version increment. The test verifies that recorded baseline, not an unrelated asset cache token.

## Brittle integration checks

- Execute `selectCard` with real, missing, nonnumeric and greater-than-309 IDs. The current implementation validates actual identities, not a hardcoded length clamp.
- Execute `imageForArt` with private file, manual source, verified museum image and back-face cases. Preserve manual precedence without accidentally applying a front-face local image to a reverse face.
- Check the actual ordered script sources, landscape merge and current canonical Sheet identity. Cache-busting suffixes are independent from reference-data policy revisions.

## Additional subscriber and release safeguards

The owner interface clears sensitive rows on sign-out and token expiry, aborts pending requests and ignores late responses. A deleted subscriber tombstone cannot be revived by a stale unsubscribe request. The manager reports when the private Sheet export is stale. Temporary anti-abuse keys schedule a final cleanup even if no later signup wakes the object.

An already-open spoiler or social composer now notices the November 1 cutoff on its timer, page focus and resume. The complete gallery closes and the composer narrows to curated candidates without requiring a reload. Curated card viewing and voluntary signup continue. This is a presentation deadline, not authentication around the public repository.

## Verification boundaries

Run the original legacy suites, all repository .test.mjs suites, generated-source checks, the real local Cloudflare Worker/storage tests and the browser suites. Do not skip an assertion merely because it failed at baseline.

The new owner-interface browser test uses the actual production manager JavaScript and subscriber handler with isolated storage. Only external Google identity and Sheets are simulated. No live owner OAuth session is claimed, no production subscriber is contacted or altered, and no real email is sent. A live authenticated owner-to-Sheet check remains an owner step.
