# Northern expansion — 0.1.23

This first expansion reaches Bauerfield Airport and the northern residential corridor. The landscape grows from 9 × 6.5 km to 9 × 11.3 km (58.5 to 101.7 km²). This is an initial district extension, not complete Greater Port Vila coverage. The airport camera stops inside a landscape margin so that the cropped terrain edge is not presented as a coastline.

## Geographic sources and limits

The original `world.json`, city DEM, foundation elevations, saved proposals and scenario format are unchanged. Its checksum remains `ebafee2a7c9e4cb3fb72e39230b4c65a96e5b67f4118a970f9a94cdf416fbf7e`. The previous lagoon context is also retained. Northern height samples use the same Terrain Tiles / Mapzen source at 60 m spacing, with a transition outside the original landscape boundary. Terrain detail is interpolation of that source, not new survey precision.

OpenStreetMap data was retrieved on 24 September 2026 using the official map API, within longitude 168.291–168.340 and latitude −17.725–−17.689. The source cache and retrieval record are in `source/north/`. The release adds 9,036 mapped building footprints after excluding existing city source IDs and limiting the new context to the airport corridor. It includes mapped roads, Bauerfield's runway, taxiways and apron. Examples: [runway way 12663140](https://www.openstreetmap.org/way/12663140) and [airport way 52246235](https://www.openstreetmap.org/way/52246235). Attribution remains visible in the application.

New buildings are inexpensive, read-only context forms. Tagged heights or levels are used when available; otherwise the default is an illustrative 4.2 m. Heights are bounded to 2.5–24 m and grounded against the terrain. Road widths and runway markings are illustrative where untagged. This does not establish current building occupancy, construction condition or survey-quality floor levels. The existing tree population is unchanged; new northern forest coverage is not inferred.

## Loading and rendering

Terrain is divided into 120 sections of 960 m. The 32 sections around the existing city retain 20 m geometry. Other sections start at 80 m; up to nine nearby sections refine to 20 m as the camera approaches. The outer detailed-geometry cache holds at most twelve sections. Refinement builds one 480 m quarter-section at a time, at least 40 ms apart; unused geometry is disposed. Terrain picking checks the whole section group so editor placement continues to use the correct ground surface.

Northern roads and buildings are split into 98 sections of 480 m with content-hashed filenames. No northern data is requested while the camera remains at the waterfront. Exploring north selects at most 32 nearby sections, makes at most two concurrent same-origin requests, and retains at most 40 sections in memory. Stale responses do not create geometry after leaving the area. Failed requests surface a retry message; selecting **Airport & north** retries them. This loader is shared by 3D and plan view. There are no runtime calls to OpenStreetMap or a paid map service.

The initial airport view loads 32 sections containing 2,897 footprints, about 131 KB with local gzip compression. All 98 sections total about 401 KB gzip (2.27 MB uncompressed). These are compression estimates, not measured mobile transfer totals. The bundled terrain, index and rendering logic add about 48 KB gzip to the entry bundle: 451,579 → 499,503 bytes with the same gzip settings.

Terrain geometry drops from the previous entire-landscape mesh's 363,436 triangles to 200,081 at the city and 245,009 after airport refinement, despite the larger landscape. A local CPU audit measured quarter-section refinement p95 around 12 ms. This is not a physical-phone timing. Construction of the new terrain, including tinting and UVs, took 1.64 s; the previous geometry-only audit took 1.26 s, so these timings do not demonstrate faster startup.

## Verification

All 74 source tests pass, including old coastline/elevation preservation, terrain ray picking and cache limits, section geometry, no waterfront requests, bounded concurrency, manual retry, cache eviction and baseline compatibility. TypeScript and the production build pass. All eleven retained deployment stability tests also pass.

Desktop preview at the airport remained at the 60 Hz display limit with both WebGPU and WebGL. The final WebGL view recorded 600 samples, 60 fps, 16.9 ms p95, 61 calls and 728,432 renderer triangles, 41 detailed terrain sections, and 32 northern requests. Returning to Central Market retained 32 requests and zero loading sections (60 fps / 16.8 ms p95). Renderer totals include multiple passes and should not be compared directly with terrain geometry counts. Display refresh limits these results; no GPU-headroom claim is made.

At 390 × 844, the Light airport view and controls render correctly; the desktop-hosted WebGPU check records 60 fps / 16.9 ms p95 over 600 samples. The phone-size plan view shows the airport and its streets, returns to Central Market, and still opens the existing market inspector. No console errors were recorded in these checks.

Browser observations and reproducible cost results are recorded under `evidence/north-2026-09-24/`. Phone-size layout checks do not establish physical-phone performance or Vanuatu network startup times. The core application still initializes its existing city; this release makes the added district incremental, not the entire application.

## Rebuild and release

Use `scripts/build-north-context.mjs` for the terrain strip and `scripts/build-north-district.mjs` for the cached OSM sections. `scripts/fetch-north-district.mjs` retrieves the source only when intentionally refreshing data. Run the source tests and production build, then `scripts/prepare-north-release.mjs`. The release publishes only section filenames referenced by `src/north-index.json`, retains prior hashed assets and preserves unrelated website changes.
