# CI baseline when releasing the candidate/crop/signup integration

The focused candidate, placement, signup, Cloudflare-runtime, current launch and full exhibition checks pass. Do not mistake this for a clean result from every historical test in the repository.

A same-run comparison on 29 September 2026 ran `node --test tests/*.test.cjs tests/*.test.js` on this feature and on main (`7d2588221c32fa574d13a85b5c3f6b371c3e6e7a`). Main: 257 tests, 226 passed, 31 failed. Feature: 260 tests, 229 passed, 31 failed. The three added candidate tests pass. Diagnostic evidence: Actions run 36528540683, artifact odyssey-regression-report.

The sampled existing failures include a brittle source-string expectation for local-image fallback (the renderer now guards back faces), an old normalization test expecting `pay 1 life` to become `pay {1} life`, and an old numeric-card-navigation source regex. These failures also reproduce on main; no data or source was altered merely to satisfy those stale expectations. The broader suite needs its own behavioral-test review, including the overly broad normalization assumption.

The separate art-journey workflow still ran an obsolete all-in-one launch test that waited for twenty art-tour allocations on the marketing homepage. The twenty-work tour was already moved to art.html before this branch. The workflow now uses the current focused-launch test for the homepage and runs the existing, unweakened art-journey assertions against art.html.
