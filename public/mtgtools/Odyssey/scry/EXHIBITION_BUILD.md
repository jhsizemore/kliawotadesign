# Odyssey art-first exhibition

Build: 20260928-launch1
Public route: `/mtgtools/Odyssey/scry`
Spoiler mode: `/mtgtools/Odyssey/scry?view=cards`

## Implemented experience

1. Full-height historical-art opening, museum label and a single exhibition call to action.
2. One candidate presented after the artwork-led opening.
3. Project statement with live candidate count and **0 confirmed cards**.
4. Six distinct material chapters: clay, stone, metal, paper, print and paint. A missing material is shown as a collection gap rather than filled with invented or generated art.
5. Up to four mechanic features selected from actual rule/type matches, with different art treatments. Colour counts include every matching candidate.
6. Source-led homecoming, temptation and monster features when matching works exist in the collection.
7. Public-development explanation, with funding ideas labelled as proposals rather than an operational paid service.
8. One-to-five-card social composer with four formats, selectable library background, mirrored blur and credits for both background and card artwork. PNG export uses the displayed composition rather than a second, truncated card renderer. Failed image retrieval stops export.
9. Separate full-width spoiler mode with progressive loading, manual load-more fallback, search, filters, sorting, compact view and card deep links.

## Data and integrity

- Read-only adapter for the same published JSON used by Studio.
- `primaryArt` is authoritative, including an explicitly empty assignment. Coverage is a fallback only.
- Existing artwork delivery manifest is used only when the artwork ID, title and source match its verified entry.
- Existing local mana-pip image assets are reused. Hybrid pips include both symbols and both colours.
- Source attribution, artist, date, medium, collection and recorded rights remain accessible in the complete-image viewer.
- Material classification uses the recorded medium, not words such as “gold” or “vase” appearing in a painting title. Printmaking is checked before generic ink/drawing matches.
- Missing metadata is labelled; the exhibition does not claim museum endorsement, educational accreditation or a verified 2,700-year corpus.
- Explicitly flagged synthetic artwork is excluded. Metadata checks are not represented as a complete forensic audit.
- No Studio local-storage keys, editing state, artwork assignments or synchronization credentials are read or changed.
- The public candidate frame is a responsive review presentation, not a promise of final print-layout parity. Full published rules remain available in the detail view.

## Verification

`node tests/odyssey-exhibition.cjs` tests the adapter, safe URLs, explicit blank artwork assignments, hybrid mana, source identity checks and the actual repository dataset.

`tests/odyssey-exhibition-browser.py` checks the real data in Chromium at 390, 768 and 1440 pixels, full gallery loading, rules-box overflow, deep links and one-to-five-card layouts in all four social formats. The GitHub workflow uploads screenshots and a JSON report.

Local offline browser testing uses synthetic **test fixtures only**. Those fixture images and fabricated test records are not part of the committed public website.

## Publishing

Merging source is not evidence that the site is live. The existing Cloudflare deployment requires repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. The previously inspected production run failed because these were empty. Publication must be verified separately from unit/browser checks.

The temporary spoiler is a presentation mode, not authentication. No artificial expiry date, paid login or checkout has been added.
