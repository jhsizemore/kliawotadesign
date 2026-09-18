# Odyssey Studio v3.17 — artwork continuity and rendering

Date: 2026-09-18. Based on main commit 168abe11b2579774a06094e17d3dc667892e936c.

## Implemented

- Artwork options are non-shrinking tiles in an independently scrolling grid. Desktop thumbnails are 220 px high and mobile thumbnails 240 px; tiles retain at least 330/350 px respectively. Re-rendering options on the same card preserves scroll position and keyboard focus.
- Card titles render in uppercase without changing stored names. Titles and underlying-name aliases are vertically centred with ascender/descender clearance. Fitting checks both width and height, after Saga/special-frame decoration.
- Explicit mana fields normalize to brace notation; compact costs such as 1W and 6U in rules, explicit inset spell costs and standalone tap costs are normalized. Existing Greek W/U/B/R/G/C pip assets are retained. Tap and untap render as vector symbols. Hybrid, Phyrexian, snow and variable costs are parsed without splitting a compound symbol into separate costs. Unknown notation remains visible rather than silently disappearing.
- Normalization runs on the bundled Current and Analysis-candidate working datasets, the active in-memory model, edit operations and JSON exports. `mana` and working `rules` fields use brace notation; `sourceRules` remains verbatim as the live-sheet provenance snapshot. Google Sheets are not rewritten. Card designs are not changed by this release.
- Private device sync covers artwork assignments, hosted image links, credits/source, crop zoom/position/fit, art height and frame treatment, plus shared crop profiles. It does not synchronize card rules, names, mana costs, structural layout, reviews or uploaded image bytes.

## Pairing

Open **Sync devices**, choose **Enable device sync**, then **Pair another device**. Copy the private link and open it on the other device; explicitly choose **Connect this device** there. Anyone with this link has edit access to the workspace: keep it private.

Edits continue saving locally first. Sync runs after edits and periodically while Studio is open. Offline work stays local until reconnection. A conflict presents **Keep this device** and **Use shared edit**; the client does not silently choose a winner. Reset/removal operations have revisions and deletion markers so older devices do not resurrect them.

Current set and Analysis candidate v1 have separate server namespaces and local stores. Stable card IDs, not collector numbers alone, identify corresponding records. Unknown custom datasets pause sync. Opening the candidate synchronizes both its artwork scope and the Current-set source scope; the candidate remains a separate design dataset.

Session-uploaded image files remain on that device. Catalogued images and valid hosted image URLs support continuity. Use a hosted image URL when the image itself must be accessible elsewhere.

## Storage and safety

Cloudflare Durable Object `OdysseyArtWorkspace`, binding `ODYSSEY_ART_SYNC`, is added through a SQLite migration. A wrapper preserves the existing site worker and unrelated asset routes. Only `/mtgtools/odyssey/api/*` is routed before static assets.

The client generates a 256-bit private key. Pairing uses a URL fragment removed before editor/artwork loading; API requests carry the key in an Authorization header. The object name is a hash of that key. The backend rejects cross-origin requests, invalid record fields, oversized requests and stale revisions. It limits request rate and record count.

The browser retains backups before joining or applying shared changes. Local multi-store writes attempt rollback on failure. Incoming shared data is validated before application. Only allowed artwork fields are replaced; existing local card-design fields remain intact. Conflict groups are whole card-art records, not individual fields.

## Verification performed

`node --test tests/odyssey-continuity.test.cjs`: **31 tests passed** on Node 22.16.0. Coverage includes notation, escaped unknown values, compound symbols, pairing-key parsing, schema boundaries, initial upload/download, conflicts, idempotent retries, resets, edits made during upload, set separation, local-storage rollback and backend authentication/persistence/isolation/validation.

**41 browser-fixture checks passed** in Chromium. Viewports: 1280×900, 820×1180, 390×844, 360×640 and 740×390. Checks include tile geometry, independent scrolling, reachable close controls, no horizontal viewport overflow, scroll retention, title/alias fit, SVG tap rendering, private pairing, artwork transfer between isolated browser contexts, editor remount using saved storage, preservation of local rules, offline edits, explicit conflict resolution, deletion propagation and candidate isolation. No JavaScript page exceptions were recorded.

Browser navigation is restricted in the execution environment. These were representative local HTML fixtures, with isolated storage fixtures and fetch bridged to the locally running backend. They were **not** full live-site browser tests, physical Android/iOS tests or proof of production deployment. The source/test archive retains the fixture, runner, local server and results. The existing legacy test suites were not rerun in this environment. Wrangler was not installed locally; Cloudflare build/deployment status must be checked separately.

## Preserved files and behaviour

The underlying card designs, `sourceRules` provenance, original site worker, frame-system files, artwork-related pools/240-DPI warning, Current-to-candidate art transfer and mobile navigation remain intact. The bundled Current/candidate working datasets and app cache versions were updated only for canonical symbol encoding. No candidate-to-production cutover is performed.

## Follow-up verification

After the persistence pass, an in-process audit of both 250-card bundled datasets found **0 remaining legacy mana/tap encoding issues**. The regression suite now also asserts that both shipped datasets remain idempotently canonical under the symbol normalizer. The public live URL could not be reached from the current execution environment, so production-edge verification is still separate from source verification.
