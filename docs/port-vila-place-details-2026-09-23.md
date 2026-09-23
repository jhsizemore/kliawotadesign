# Port Vila place details — 0.1.21

This release adds all six of the requested recognition improvements: denser island and hillside planting; selected building colours; harbour boats and piers; B-plate minibuses; market activity; and street/place orientation with lagoon crossings.

## What is mapped and what is illustrative

- **Mapped:** 30 pier geometries, three bridge centre lines, 15 additional road features including bridge approaches, 13 woodland polygons, and Iririki's shoreline. Public OpenStreetMap data retrieved 23 September 2026 is projected into the existing baseline's UTM coordinates. Original map records are untouched. Source way IDs, versions and timestamps are packaged with the details.
- **Interpreted from photographs:** palettes for 13 standing building components. The BSP green frontage, Eric Wong/Stanley green roofs, grey seafront tower roof, white Finance building and other matched premises use the July 2025 DUAP photographs. The inspector links each palette to its reference page. Three earlier candidate palettes were excluded because the demolition register supersedes those photographs.
- **Illustrative:** individual tree positions, garden shading, pier and bridge deck heights, boat locations/types, market stalls and people, and traffic. Minibuses have generic bodies and close-range B plates. Their animation is not a bus-route or service map. No new claims about current business occupancy or post-earthquake reopening are made.

Sources: [OpenStreetMap attribution and licence](https://www.openstreetmap.org/copyright), [DUAP July 2025 CBD report](https://duap.gov.vu/images/Projects/250825_a3_Report_Port%20Vila_FINAL.pdf), [Vanuatu Tourism Office: getting around Efate](https://www.vanuatu.travel/en/plan/planning-tools/guides/how-to-get-around-efate), [Vanuatu Tourism Office: markets](https://www.vanuatu.travel/en/plan/planning-tools/guides/how-to-shop-at-the-markets-in-vanuatu), [Iririki: ferry access](https://www.iririki.com/experiences/iririki-day-pass/).

## Rendering and interaction

- Two instanced batches create the broader tree crowns and trunks, capped at 1,700 trees. Roads, source building footprints, demolition sites, park interiors and water are excluded. Existing waterfront palms remain.
- Woodland and island ground tinting adds no geometry. All mapped infrastructure uses one vertex-colour batch; boats and market life use one batch each. No new image assets or runtime map-service requests are required.
- Minibuses replace one third of the existing traffic budget. Fleet sizes and route spacing are unchanged: 28 vehicles on balanced desktop and 12 at phone width. Six instanced batches cover cars and vans. Reduced motion, pause, distance culling and quality settings continue to apply.
- Light graphics hides decorative vegetation, boats and market activity; mapped crossings and piers remain useful for orientation.
- New 3D labels have zoom limits, collision suppression and a clear upper UI area. Plan view includes mapped woods, bridges, piers, roads and scalable street labels. View options provides a keyboard-accessible place selector on desktop and phones.
- Market activity moves with a floor anchor and hides when the market is removed or replaced in a proposal. Decorative geometry cannot intercept building selection.

## Compatibility

The baseline ID remains `port-vila-cbd-2026-09-15`; checksum remains `ebafee2a7c9e4cb3fb72e39230b4c65a96e5b67f4118a970f9a94cdf416fbf7e`. All 2,940 building records and 338 source roads remain byte-identical. The supplemental feature pack checks this checksum before attaching. No changes to scenario schema, saved edits, floor observations, DEM values, demolition evidence or import/export.

## Verification

TypeScript and all 66 source tests pass. New checks cover source compatibility, connected bridge approaches, tree clearance including demolished footprints, water placement of complete boat envelopes, bounded geometry and the shared car/minibus fleet. Existing tests cover floor anchors, saved proposals, source integrity, research/vision and phone camera behavior.

At the same 1280 × 720 default waterfront view and balanced quality, the original 0.1.20 build measured 60 fps and 16.8 ms p95 in both WebGPU and WebGL 2 (600 samples). It reported 1,614 rendering calls and 20,140,797 triangles across the renderer's passes. The final 0.1.21 WebGL view measured 60 fps and 16.8 ms p95, 1,670 calls and 12,567,293 triangles. The tree replacement reduces total reported triangles about 38%, with approximately 3.5% more calls. These are desktop browser observations, not physical-phone or Vanuatu mobile-network benchmarks. A tool-controlled startup timing attempt was inconclusive due to browser inspection timing out during compilation; startup latency is not claimed to be quantitatively benchmarked.

Local visual review: market, Iririki, Erakor Bridge and connected approaches; desktop WebGPU/WebGL; phone-width menu and navigation; plan fallback and lagoon context. Final live artifact hashes and release checks are recorded separately in `evidence/place-details-2026-09-23/`.

## Rebuild and publication

Use the cached `source/place-details/osm.json` and `approaches.json` with `scripts/build-place-details.mjs`. `scripts/fetch-place-details.mjs` is the explicit public-data refresh, not a client request. Build with the `/portvilasandbox/` base. Prepare the scoped release using `scripts/prepare-place-release.mjs`, run the retained deployment stability tests and publish from the latest remote tree without forcing the branch. Preserve all other site paths and old hashed assets for existing clients.
