# Downtown aerial refinement — 0.1.24

The user supplied an aerial view of central Port Vila on 25 September 2026 and estimated its capture date as Q2 2025. The date is an estimate, not embedded capture metadata. The image was aligned approximately to the existing Cathedral, Central Market and Vila Mall footprints, then visually checked against the street grid and surrounding roofs. The correspondence is suitable for interpreted appearance and landscaping, not survey corrections. Tall-building parallax and local offsets remain.

## Result and source priority

The refinement applies 71 manually matched roof palettes, four interpreted hipped roofs (including Vila Mall's separate courtyard wings), and nine flat-roof treatments. Existing mapped outlines, floor counts, total height envelopes and foundations are retained. Hip panels are clipped to source footprints, including the mall's courtyard; they do not fill it with a rectangular block. Other roof shapes retain their existing geometry. The palette uses seven shared colours, interpreted visually rather than claiming measured paint values.

Six traced lawn areas and three narrow paths refine the waterfront gardens, cathedral grounds and Independence playing field. Nine wooded areas establish the green belts behind the commercial streets and around the western shoreline. Surface treatments exclude source building interiors and mapped roads; they follow the same terrain without changing its heights.

Of 136 interpreted tree candidates, 134 survive the existing land, road, building and park checks. Their heights and crown sizes remain illustrative. Replacing nearby procedural positions and clearing lawn interiors changes the total population from 11,032 to 11,125; Iririki retains its 294 trees. Observed positions use polygon-edge clearance, allowing an open concave courtyard to remain open space rather than treating a whole building bounding box as occupied. All crowns remain clear of actual footprints, including demolition footprints.

Ten older image matches are excluded because the later demolition register takes priority. Existing July 2025 photographed exterior palettes also retain priority. This release makes no new claims about current occupancy, reopening, floor levels or repairs. The inspector identifies the estimated Q2 2025 aerial for matched roofs, and Reconstruction explains the source priority. The original image remains a local reference and is not included in the public download.

**Downtown** in View options opens an overview matching the image's general orientation. `?mode=view&place=downtown` links directly to it; plan view also supports the same place.

## Cost and verification

The entry bundle grows by 4,408 bytes with the same gzip settings (499,503 → 503,911 bytes). There are no new image downloads or map-service requests. The added lawn/path/woodland ground geometry totals 6,175 triangles in three shared-material batches. Hipped roofs remain below 250 triangles across all four matches. The tree layer retains its existing three distance bands, maximum three draw batches and fixed quality budgets.

At the same 1280 × 720 waterfront camera, the previous public WebGPU view recorded 59 fps / 16.8 ms p95 over 600 samples; the new preview recorded 60 fps / 16.8 ms p95. Renderer totals changed from 1,714 calls / 10,668,047 triangles to 1,748 / 10,692,045. Tree selection used 59,708 of the 230,000 triangle allowance. These are desktop observations at a 60 Hz display limit, not evidence of a speed improvement or physical-phone performance. No cold-start comparison was made.

All 77 source tests pass, including footprint-clipped upward roof faces, fixed roof envelopes, road/building clearance for lawns and tree crowns, source priority, floor editing, saved-scenario compatibility and northern loading. TypeScript and the production build pass. The release also uses the retained deployment stability checks.

The original `public/data/world.json` remains byte-identical, file SHA-256 `319f4c84b9ce170c5956209f43eeef3eedbaf2fd4967f7549cc12a7659ce10be`, manifest checksum `ebafee2a7c9e4cb3fb72e39230b4c65a96e5b67f4118a970f9a94cdf416fbf7e`. Source interpretation and registration controls are in `source/downtown-aerial/interpretation.json`; image hash and audit results are in `evidence/downtown-aerial-2026-09-25/`.

## Rebuild

Run `scripts/build-downtown-aerial.ts`, then `scripts/build-canopy-population.ts`, using Node's TypeScript stripping. The first reads the local image only to constrain tree candidates within manually reviewed wooded polygons; it does not infer roofs, heights or buildings automatically. Run tests, TypeScript and the production build. Prepare a scoped release with `scripts/prepare-aerial-release.mjs`, preserving the northern section manifest, all prior hashed assets, unrelated site files and existing source records.
