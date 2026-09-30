# Island Together scenario packs

Island Together treats geography as game data rather than a live map service. A scenario can therefore use a fictional island, a simplified real coastline, or a workshop-specific map while keeping the game fast and offline.

## Scenario pipeline

1. Start with a reviewed GeoJSON file containing coastlines and optional point locations.
2. Run `node scripts/build-island-scenario-from-geojson.cjs input.geojson draft.json`.
3. The converter normalizes the geography into the game's 1080 × 720 board coordinates and creates SVG landform paths.
4. Review and simplify the generated board. The goal is strategic legibility, not GIS precision.
5. Add or review named game nodes such as ports, settlements, clinics, schools, freshwater sources, gardens and candidate sites.
6. Add road, path and boat links.
7. Map project cards to the places where they can operate.
8. Map hazards to exposed places.
9. Define scenario goals and any special rules.
10. Playtest with people who know the context before treating the scenario as workshop material.

The runtime structure is documented by `public/climate-game/scenario.schema.json`.

## Recommended geographic source material

For public-domain base geography, prefer Natural Earth 1:10m physical vectors for regional coastlines, major and minor islands, and reefs. The game should simplify those shapes aggressively rather than render raw GIS geometry. For a named workshop scenario, supplement the coastline with locally reviewed infrastructure and service information instead of assuming a global dataset knows the practical road, landing, water or settlement network.

The current fictional maps are hand-authored composites rather than traced named islands. Their shapes are intended to evoke recognizable Pacific geographic types while keeping the gameplay clearly fictional.

## GeoJSON authoring conventions

Polygon and MultiPolygon features become landforms. Point features become playable nodes. A point can use these optional properties:

```json
{
  "id": "main-wharf",
  "label": "Main wharf",
  "short": "Wharf",
  "kind": "port",
  "island": "main",
  "stats": ["community", "supplies"],
  "note": "Most imported construction materials enter here."
}
```

LineString features are retained as visual features. Strategic road, path and boat connections should be authored explicitly in the scenario's `links` array rather than inferred from geometry.

## Real maps are intentionally simplified

The game board should not imply that a simplified coastline or icon is an authoritative map. Real-map scenarios should be treated as edited teaching models. Important reasons include:

- infrastructure and transport conditions change;
- informal paths, customary land relationships and service access are poorly represented by many public datasets;
- hazard exposure at household scale is sensitive and easy to overstate;
- a workshop game should not publish household-level vulnerability or personal information;
- relocation, adaptation and development choices involve rights, consent, culture, livelihoods and governance as well as physical infrastructure.

For a public scenario, retain source metadata separately and document the date and scope of the source data.

## Current scenario mechanics

The prototype supports several topology types with the same engine:

- **Archipelago Logistics** — a main island and outer islands linked through a port and small-boat freight.
- **Atoll Water Security** — low-lying motu with fragile freshwater and little spare land.
- **Relocation Pathways** — an exposed home community and two fictional receiving sites, with explicit limits on what the game model can represent.

The point of the scenario system is not to declare one "Pacific island model". Different countries and communities can have materially different island counts, distances, topography, service networks and climate pressures while still using the same underlying game engine.


## Landscape layer

Scenario geography can include a lightweight `landscape` array in addition to physical terrain. These are deliberately simple board-game scenery pieces rather than GIS features. Current kinds include forest, palm clusters, reef patches, canoes, workboats, gardens and village clusters.

The runtime also derives small settlement scenes from playable nodes: ports show wharves and freight, towns show houses and market structures, clinics and schools appear as distinct buildings, gardens show cultivation, and outer-island communities mix contemporary and island-style buildings with palms and canoes.

Completed projects alter this scenery. Rain tanks, strengthened roofs, gardens, mangroves, radio towers, stored materials, drainage, bridges, clinics and wharf works appear on the map after they come into service. Construction sites show scaffolding while work is underway. Local pressure adds visible flooding and damage, and planned relocation grows the receiving site into a visible settlement.

This layer should remain subordinate to strategic readability. If scenery obscures routes, exposed places or game markers, reduce or move it rather than adding more.
