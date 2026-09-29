# Artwork placement: Studio ↔ Sheets → Scry

`Artwork sync` in Studio collects existing saved zoom, X/Y position, cover/contain,
art-height and full-art treatment into per-card, per-face placement records.
It resolves shared crop profiles before export. It never changes card rules,
names or artwork assignments.

## Workflow

1. Save the crop normally in Studio; click **Artwork sync**.
2. **Review saved placements**, connect the existing Google account if needed,
   resolve any live-Sheet conflict, and check the publication confirmation.
3. **Publish to Sheets & Scry** writes only changed placement rows, reads them
   back, then publishes the verified snapshot. An **Artwork Placement** tab is
   created in the current canonical card workbook on first publication.
4. For edits made directly in that tab, **Pull placements from Sheet** updates
   Studio while retaining conflicting drafts. **Publish Sheet placements to Scry**
   explicitly publishes those rows. Manual spreadsheet edits do not become public
   until this action is used.
5. **Preview in Scry** opens a clearly labelled, browser-local placement preview.
   Normal public Scry never reads Studio's private browser storage.

Scry reads the published snapshot on entry, focus and every 60 seconds while
visible. Existing and newly opened cards use the native Studio renderer's exact
image geometry, not a separate object-fit approximation. Publication does not
require a Git commit or a site rebuild.

## Data and safety

The canonical workbook is `1-OTRpW8vrSJWcXcL06l3eMJESwFtt6hQqCEl9J3sdEE`.
`Artwork Placement!A:M` uses stable card and artwork IDs, layout, face, art height,
frame style, fit, numeric zoom and overflow-relative numeric pan, image-source
identity, update time and revision. Sorting the rows does not change identity.
Defaults (including numeric zero) are explicit so a reset survives a roundtrip.

No existing card/design tab is rewritten. A changed artwork ID, source image,
layout or card face prevents an obsolete placement being applied. Google OAuth
is the existing Sheet editor connection, held in memory and forwarded only to
Google's fixed canonical-workbook endpoint. The workbook is not made public.
Only the validated placement projection is available from the public GET route.

Publication is explicit. Three-way comparison prevents overwriting known Sheet
changes; app publications are serialized and every write is checked by read-back.
Google does not provide cell-level compare-and-swap for external manual edits,
so an edit concurrent with a write is detected at read-back where possible and
must be reviewed. An outage or failed verification does not replace the last
published snapshot. Browser-only files and unpublished edits are not accessible
to the server until their owner publishes them. Candidate datasets are excluded.

## Tests

`node --test tests/odyssey-placement.test.cjs` tests validation, row roundtrip,
conflicts, reset, source/face guards, authorization and failed-readback safety.
Serve `public/` on port 8765 and run `python tests/odyssey-placement-browser.py`
with Playwright Chromium to test real Studio and Scry pages. Browser publication
uses a mocked authorized boundary; it does not write the real workbook.
