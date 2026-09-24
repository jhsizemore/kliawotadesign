# Scalable Port Vila canopy — 0.1.22

The Iririki canopy was cheap enough for the island, but its two global instanced meshes rendered all 1,452 trees at full detail and cast shadows at every distance. Extending that geometry directly to 11,032 trees would require 2,868,320 triangles per pass before shadows and reflections. The replacement expands illustrative planting while bounding the visible work.

## Coverage and evidence

There are 11,032 deterministic tree positions, including 294 on Iririki (previously 297). Coverage extends through the packaged OpenStreetMap woodland polygons, Iririki gardens and plausible gaps within 1.9 km of the CBD. Individual positions and species are illustrative, not a tree census. Unmapped countryside is not assumed to be forest.

The offline generator checks the centre and eight points around each crown against land, excludes source building footprints (including demolished buildings), keeps roads/bridges and park interiors clear, and enforces minimum spacing. The full population is capped at 12,000. Placement generation is a development step, never a phone task. Positions are half-metre signed coordinate deltas, four bytes per tree, packaged in the existing application bundle: about 31 KB gzip for the placement data, no additional request or service fee.

The baseline, terrain, building foundations, demolition evidence, saved proposals and scenario format are unchanged. The packed positions check the baseline checksum before attaching. Existing waterfront palms and user-added proposal trees retain their current behavior.

## Rendering budget

| Detail | Geometry per tree | Shadows |
| --- | ---: | --- |
| Near | 260 triangles, three rounded crowns and trunk | Cast and receive |
| Middle | 66 triangles, three simpler crowns and trunk | Receive |
| Far | 14 triangles, solid crown silhouette and trunk | None |

All three prototypes use one opaque vertex-colour material, without image downloads, alpha leaves or individual leaf meshes. At most three instanced batches render the tree layer. Geometry is shared, and the maximum instance-buffer allocation is approximately 1.34 MB; total memory also includes the CPU transform cache and renderer overhead.

The population is indexed into 253 spatial tiles of 240 m. Conservative frustum checks discard offscreen tiles; projected crown size selects detail, with hysteresis to reduce switching. All selected trees start at the far level, then remaining geometry allowance goes to nearby tiles. The per-pass tree budget is 230,000 triangles for balanced desktop, 180,000 on phone layouts, 168,000 for Light and 350,000 for Detailed desktop. Even a view containing the entire population fits at its cheapest level. These budgets cover this canopy layer, not buildings, palms, proposed trees or the complete scene.

Transforms and terrain heights are cached once. Camera movement updates selection at most ten times per second; unchanged selections upload nothing, and stationary frames perform no terrain queries or buffer writes. The same tree positions remain across all quality levels. Light keeps simple trees while hiding the older decorative palms, boats and market props as before. The existing View performance panel reports tree counts, detail bands and budget use.

## Verification

See `evidence/canopy-2026-09-24/cost.json` for reproducible CPU and geometry measurements and `browser.json` for browser observations. Source tests cover placement regeneration, compatibility and corrupt-data rejection, crown clearance, quality budgets, fixed memory, culling, stationary updates and position continuity across detail changes. The full source suite has 70 passing tests.

At a matched 1280 × 720 balanced waterfront view, both WebGPU and WebGL 2 retain 60 fps and 16.8 ms p95 over 600 samples. The old renderer reported 1,670 calls and 12,567,293 triangles across its passes; the new renderer reports 1,668 calls and 11,165,409 triangles. The new canopy itself selects 1,698 trees and 54,098 triangles at this view, compared with the old layer's 377,520 triangles. These counts are distinct from the renderer's multipass totals. Display refresh caps the observed frame rate, so these results do not quantify GPU headroom.

CPU construction with a warm terrain cache measured 90.7 ms median before and 35.4 ms after; tile selection p95 was 0.13 ms over 1,000 camera positions. The full compressed entry bundle grows by about 33 KB (418,646 to 451,579 bytes with the same gzip settings), including placement and rendering logic.

Two paired warm-cache WebGL startups measured 14.18–14.53 seconds before and 14.04–14.35 seconds after. The first new WebGL compilation took 16.77 seconds, but no paired cold baseline was measured, so this does not establish cold-start parity. Inland WebGL's recent window after two camera drags measured 59 fps and 17.4 ms p95; the window also contains stationary frames. Iririki's equivalent WebGPU check remained 60 fps / 16.8 ms. Phone-size Light mode retained 788 selected trees in two batches and 18,364 triangles.

Desktop browser measurements and phone-size layout checks do not establish physical-phone performance or Vanuatu network load times. Tree setup CPU timing excludes downloads and GPU compilation. Local diagnostic startup timings are recorded separately with their scope and variability.

## Rebuild

Run `node --experimental-strip-types scripts/build-canopy-population.ts`, source tests, TypeScript and the normal production build. `scripts/audit-canopy-cost.ts` compares against the preserved 0.1.21 snapshot. `scripts/prepare-canopy-timing.mjs` creates local-only diagnostic HTML; it must not be published. Release using `scripts/prepare-canopy-release.mjs`, preserving unrelated website changes and old hashed assets.

Implementation references: [Three.js InstancedMesh](https://threejs.org/docs/pages/InstancedMesh.html), [distance levels and hysteresis](https://threejs.org/docs/pages/LOD.html). Geographic source and attribution remain as documented in `26-place-details.md`.
