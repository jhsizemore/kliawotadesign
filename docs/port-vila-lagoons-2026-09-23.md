# Erakor Lagoon and the Port Vila peninsula — 0.1.20

The original land builder closed the longest open coastline with an artificial eastern edge. It ignored the separate 552-node coastline around Erakor / First Lagoon and Emten / Second Lagoon. The result filled the lagoons with land and truncated the southern peninsula.

The corrected visual context joins OpenStreetMap coastline ways by node identity, includes the surrounding islands, closes the mainland outside the displayed region, and clips it to a bounded landscape. Both the plan and 3D view use this land mask, including placement, roads, vegetation and terrain picking. A “Lagoon & peninsula” button opens a wider view; on phones it is available in View options. `?place=lagoon` opens it directly and works with `view=plan`.

## Sources and reproduction

- OpenStreetMap, retrieved 23 September 2026. Main lagoon shoreline: [way 22574998](https://www.openstreetmap.org/way/22574998); southern peninsula: [way 242024138](https://www.openstreetmap.org/way/242024138); outer eastern coast: [way 23458635](https://www.openstreetmap.org/way/23458635). Exact query, retrieval timestamp, way versions and source timestamps are retained in `source/lagoon` and the bundled context.
- Mapzen Terrain Tiles / AWS Terrarium z13: surrounding elevations sampled at approximately 60 metres, using bilinear interpolation across tile boundaries. This remains a global DEM, not surveyed terrain or lagoon bathymetry.
- Local generation: run `node scripts/fetch-lagoon-context.mjs`, then `node scripts/build-lagoon-context.mjs`. The second command reuses cached elevation tiles and fails on an incomplete mainland chain or missing DEM coverage. It writes `src/lagoon-context.json`, packaged in the application bundle; visitors make no live OSM or elevation-service request.

## Preservation and limits

The immutable `world.json`, its checksum, all 2,940 building records, existing floor anchors, scenario format and saved proposals are unchanged. The context is enabled only for its matching baseline checksum. Original DEM values are retained exactly inside the old coverage; the surrounding DEM blends over 120 metres outside that boundary. Water classification is corrected, so estimated placement heights at newly recognised water or islands may change. Seven mapped resort structures extend beyond a lagoon island's shoreline; they remain in the original dataset rather than being deleted as an assumed mapping error.

The wider region provides landscape context. It does not imply a complete new building or road survey. Banks use terrain heights with an earth finish; the original CBD quay keeps its masonry treatment and grading. No new measured foundation or tidal datum is asserted. Distant water uses a simple surface to keep the shoreline clear and avoid an extra reflection render of the expanded landscape. Pan/zoom ranges and atmospheric haze support the larger extent.

## Validation

- 62 source tests: existing foundation/edit/import/undo/redo checks plus mapped water, entrance, islands, peninsula, polygon holes, terrain exclusion, context isolation, unchanged DEM samples and camera navigation.
- TypeScript and production build.
- Browser checks: desktop plan and 3D lagoon views, return to CBD, mobile View options access, shared view URL and no console errors.
- Release assets and deployment verification are recorded under `evidence/lagoon-2026-09-23`.

Publish with `scripts/prepare-lagoon-release.mjs` after fetching the current website parent. The release changes only Sandbox assets, its BUILD manifest and this documentation. Older releases remain available for rollback.
