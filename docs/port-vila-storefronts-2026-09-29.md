# Northern waterfront façade pilot — 0.1.25

This is a **partial photo-reference pass**, not a completed Street View reconstruction of the cleared block's perimeter. The working target is the former Olympic site, inferred from the largest mapped clearance cluster. This target has not been confirmed with a user pin. The two treated buildings are on its western/northern-waterfront approach.

## Independent reference

The July 2025 *Port Vila CBD Vision and Concept Plan*, printed page 22, contains an existing aerial photograph credited to Paul Walter, 2025. It was inspected at native image resolution. The exact capture day/month is unknown. The original PDF and source photograph are reference material only and are not included as public model textures. No Google Maps imagery was used.

Reference: https://duap.gov.vu/images/Projects/250825_a3_Report_Port%20Vila_FINAL.pdf

SHA-256: `742de99f3b9997276f1520268496666e21df9b6872608ce83ada910ed5f93546`.

## Implemented scope

- **Fung Kuei main yellow block (`319762715`)**: yellow wall and matching floor bands, three columns of small paired upper windows over three rows, taller upper-left pair, arched ground opening, and removal of the fictitious continuous canopy on the observed parking-facing wall. Adjoining shopping wings are different footprints and are not treated as this four-storey block.
- **Aircalin corner block (`332685581`)**: white palette and narrow horizontal glazing on two observed upper elevations. Existing ground treatment remains schematic. Its folded roof is not reconstructed and its original roof envelope is retained.

Window dimensions, pane subdivision, colours and doorway proportions are interpreted rather than surveyed. No current business occupancy, shop signage, reopening, structural repair or September 2026 repainting is asserted. Other elevations retain their existing schematic detail.

## Safety and maintenance

Original footprints, source floor counts, total height/roof envelopes, foundations, demolition evidence and saved scenarios are unchanged. The detailed overlay is bypassed for demolished buildings, changed floor counts and edited footprints. Details use the supplied foundation height. Observations and unresolved questions are stored in `source/port-vila/storefront-observations-2026-09-29.json`; the inspector links to the historical source and explains the limits.

The release builder starts from a hash-checked retained entry, inserts a narrowly scoped renderer helper and rewrites the four mutually dependent JavaScript chunk names together. Original hashed assets remain present. No additional photograph downloads, API requests or image textures are introduced.

Rebuild with `python3 scripts/build-port-vila-storefronts.py` only against the retained 0.1.24 baseline; rebase this scoped builder before using it on another release. Run `node --test tests/port-vila-storefronts.test.mjs` with Three.js 0.180.0 available and the retained stability tests. Browser verification uses a test-only injected renderer handle; this handle is not written to release assets. The mobile test is a browser viewport/touch simulation, not a physical-phone benchmark.
