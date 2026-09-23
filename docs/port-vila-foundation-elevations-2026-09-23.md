# Floor anchors and foundation inspection — 0.1.19

23 September 2026, Pacific/Efate. This release improves the representation and review of building floor levels. It does **not** replace the global DEM with surveyed terrain or claim new measured elevations.

## Use

Open **View options → Ground and floor levels** on any device, or **Elevations** on desktop. Search all standing buildings by name or OSM ID, select a result, or export the audit. The default list ranks flagged footprints by exposed base plus terrain above floor. The full export contains every standing footprint.

Choose **Show inspection on map** to display floor outlines and review flags in 3D or plan. Amber indicates a review flag, blue an anchor; neither signifies measured accuracy. Selecting a building shows perimeter samples (amber), source DEM samples in 3D (purple), floor connections and the anchor cross. The 3D inspection bypasses post-processing so diagnostic lines remain visible; closing inspection restores normal rendering.

The building inspector separates floor elevation, sampled ground range, exposed base, terrain above floor, source, recorded date, observation uncertainty and source-to-rendered terrain differences. Values are in **model coordinates**, not verified heights above sea level. Foundation exposure is not footing embedment depth.

In **Editor**, select a building and expand **Set floor / entrance level**. Relative anchors specify a local map point and floor height above its rendered ground. Absolute observations require a named vertical datum and an explicit additive offset into the model coordinate system. User-supplied surveys additionally require uncertainty. Their absolute alignment remains unverified. A photo interpretation never becomes survey evidence automatically.

Changes affect **Edited city**, including visible geometry, picking and selection. They survive save/export/import, and support undo, redo and resetting just the floor anchor. Existing city retains its baseline. Removed/demolished sites are excluded from foundation review unless explicitly reconstructed in a scenario.

## Implementation and evidence boundary

- Source map checksum remains `ebafee2a7c9e4cb3fb72e39230b4c65a96e5b67f4118a970f9a94cdf416fbf7e`.
- Four inherited placements (Cathedral, City Hall, Paton Memorial and Club Vanuatu) are now explicit, sourced **modelling estimates**. The 0.10 m offsets remain assumptions. Their original photographs are not measurements; 23 September is the date the interpretation was recorded in this register, not a new site survey.
- Other building elevations retain their existing highest-corner estimate. Automatically lowering every building to the lowest corner would replace one unsupported assumption with another.
- Foundation wall panels follow the rendered terrain triangles and terminate where uphill terrain reaches the floor. The former deep uniform extrusion is removed. A thin horizontal cap closes the modeled floor. No underground structural foundations or unobserved split-level layout are asserted.
- Diagnostics sample terrain-grid crossings and perimeter intervals of at most 5 m. More samples reveal geometry issues but do not increase source resolution. The original DEM grid is approximately 32 × 23 m; the render mesh is 20 m.
- The baseline audit has **2,922 standing footprints, 4 interpreted anchors and 1,468 flagged footprints**. The largest exposed base is approximately 18.0 m. These counts include deliberately graded waterfront terrain and legitimate hillside arrangements, so they are not error counts.
- Perimeter checks can miss an interior terrain peak; these are screening diagnostics, not a survey validation. Source observations, vertical transformations and uncertainty still require independent checks.

Implementation: `src/elevation.ts`, `elevation-ui.ts`, `elevation-audit.ts`, shared building/scenario types, 3D and plan renderers. The importer validates anchor ranges, coordinates, dates, source text, uncertainty and datum conversion. Existing baseline/scenario IDs are preserved.

## LiDAR investigation

1. [NAB: LiDAR Maps — Vanuatu Globe](https://www.nab.vu/dataset/lidar-maps-vanuatu-globe) documents Efate flights in 2012 and refers data-access enquiries to VMGD. Its downloadable KML was retrieved successfully on 23 September 2026, but contains only a Google Maps Engine link, not elevation samples. The page itself reports that Maps Engine was discontinued. The downloaded index is retained in local evidence.
2. [SPC's 2022 hydrographic activity presentation, page 19](https://iho.int/uploads/user/Inter-Regional%20Coordination/RHC/SWPHC/SWPHC19/SWPHC19-08C%20-%20SWPHC19_PP_Presentation-SPC_2022.pdf) explicitly includes Efate in the newer acquisition programme. The [2023 SPC completion article](https://gem.spc.int/fr/actualite/actus-web/2023/08/imagerie-lidar-pour-le-vanuatu-et-les-tonga) gives a PREP contact. Exact downtown tile coverage, acquisition dates, download access, licence and QA metadata remain unverified. The dates in the programme reports are not fully consistent; use delivery metadata before selecting a dataset. Do not interpret the article's “30 cm” wording as a certified vertical error bound.
3. [Vanuatu Future Fund's December 2025 Newtown survey](https://futurefund.vu/lidar-surveying-of-newtown-cbd-recovery-plan-site-complete/) describes a site from Bellevue toward the airport. It is not established as coverage of the existing waterfront CBD and has no direct reusable DTM attached on the inspected page.

No authenticated data request, email, purchase or survey booking has been sent. No usable bare-earth raster, verified vertical transformation or independent building floor survey was obtained. The global DEM and coastal grading remain in place pending that evidence.

## Concrete data request to send when authorized

To VMGD / DUAP / SPC GEM PREP data custodians:

> We are improving a public Port Vila city reconstruction and would like the newest available bare-earth LiDAR DTM covering the market, waterfront and surrounding downtown area. Could you provide the coverage index and GeoTIFF DTM (and classified ground points if available), horizontal CRS, vertical datum/geoid and benchmark ties, acquisition dates, grid spacing, nodata convention, independent vertical-accuracy report, licence and permission for public derivative terrain tiles? Please also identify any post-December-2024 control checks or updated surveys. We can provide the exact project bounding box and requested attribution. DSM/roof elevations alone would not establish building ground-floor levels.

Before use: establish a common vertical reference with independent check points; compare survey epochs; classify ground/vegetation/buildings; retain nodata gaps; validate against checkpoints not used to fit the transformation. Package cropped terrain for the client, not the full point cloud. Retain measured floors separately from terrain heights.

## Calibration queue

Start with Central Market, City Hall, Cathedral, Paton Memorial, Club Vanuatu, Grand Hotel, Reserve Bank and the Prime Minister's Office courtyard wings. `evidence/foundation-2026-09-23/calibration-queue.csv` contains identifiers and current estimates, with measurement fields deliberately blank. Obtain entrance position, benchmark/datum, finished-floor level, nearby ground levels, dated source, uncertainty and a separate check measurement before treating any correction as measured. Pay particular attention to lower-ground storeys and disconnected wings.

## Validation and release preservation

58 automated source tests pass, including floor/height independence, datum conversion, invalid imports, export/undo/redo, terrain peaks between corners, exposed wall clipping, and agreement between 3D geometry, pickers and selection. TypeScript and production build pass. Browser checks cover a reversible City Hall floor edit in plan, undo, 3D rendering, and phone-width inspection access. More detailed browser observations are recorded with the release evidence.

Local 0.1.12 source was reconciled against deployed 0.1.18 before building. The source now includes the live timeout/storage/renderer recovery guards, reduced shadow/reflection sizes, current initial camera, mobile detection, navigation-state preservation, current onboarding, loader image, back-navigation guard and canonical lazy-module graph. The website release changes only Sandbox assets and its relevant verification/documentation paths; older assets remain for rollback.

The reproducible editable source is in the local `port-vila-sandbox` project. `tmp/foundation-before` preserves the pre-change source. `scripts/restore-live-source.mjs` is a one-time migration record, not a routine build command. Repeat builds with `build:production`; use `scripts/prepare-foundation-release.mjs` to prepare the bounded release on a freshly fetched website parent.
