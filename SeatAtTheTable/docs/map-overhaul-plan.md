# Windhaven Map Overhaul Plan

> **STATUS: SUPERSEDED — historical record. Do not plan new work from this file.**
>
> This plan built the map system that exists today: the shared map model, typed map data,
> `MapViewport`, the cached minimap layers, road/bridge/rail records, place-specific 3D
> buildings, and the single global waypoint. Its "Definition of Done" below was met.
>
> It is superseded because its *premise* no longer holds. It treated the three-district
> horizontal layout as the target shape and explicitly settled on it. The player has since
> called that layout unrealistic and asked for larger districts plus an outskirts ring.
>
> **For current map work, read `world-expansion-plan.md` instead.**
>
> Kept because the architecture rationale — one data model driving both the 3D world and the
> minimap, authored coordinates over separate "pretty" minimap coordinates — still governs
> how the map should be edited, and the expansion must not regress it.

## Goal

Rebuild the map system so Windhaven feels like a real city space, not a rectangular prototype grid. The map should load faster, be easier to edit without breaking unrelated systems, and become a strong foundation for future gameplay where location, movement, territory, services, and events matter more.

## Current Problem

The current map is mostly a procedural rectangular grid. The 3D map, minimap, collision, roads, bridges, district labels, icons, and waypoints are close together in behavior, but they are not driven by one clean map model. That makes small visual updates risky because a change can fix the minimap while making the 3D world, marker positions, or movement feel wrong.

Curves are not the hard part. The hard part is making curved roads, coastlines, bridges, parks, building lots, collision, hover labels, and waypoints all agree. The overhaul should solve that by using one source of truth.

## Design Principles

- One map data model drives both the 3D world and the minimap.
- Visual shape and gameplay shape stay aligned.
- Buildings and icons use exact authored coordinates, never separate "pretty" minimap coordinates.
- The map should be pleasant to edit: adding a shop, bridge, park, road, district, or landmark should mean editing typed map data, not hunting through renderer code.
- The map should feel like Windhaven, a Chicago-inspired city: lake edge, river/canal systems, rail, dense streets, neighborhoods, parks, civic spaces, industrial corridors, and downtown density.
- Performance matters: load only what is needed, reuse geometry/materials, avoid rebuilding static map layers every frame.

## Proposed Architecture

### 1. Map Schema

Create typed map data files under `src/map/data/`.

Core objects:

- `Landmass`: coastline polygon and water bodies.
- `District`: name, soft boundary polygon, label point, visual theme.
- `RoadPath`: curved or straight path with width, road class, lanes, walkability.
- `Bridge`: path segment that crosses water, with bridge style and height.
- `RailLine`: path with schedule metadata for trains.
- `Park`: polygon, name, amenities, vegetation style.
- `Lot`: buildable polygon or rectangle, connected to a road.
- `Place`: shop, bank, garage, civic building, heist target, home, landmark, person, corner.
- `Waypoint`: one global target point.

The smallest building block is a point: `{ x, y }`. Curves can be represented as polylines first, then upgraded to Bezier curves if needed. A polyline is just a list of points; it is easier to test, easier to collide with, and easier to draw consistently.

### 2. Shared Projection Layer

Build a `MapViewport` helper that converts between world coordinates and screen coordinates.

It should power:

- Expanded minimap rendering.
- Compact minimap rendering.
- Hover detection.
- Waypoint placement.
- Canvas screenshots in tests.

This prevents the current class of bugs where an icon appears in one place but clicking or hovering resolves another place.

### 3. Static Layer Caching

Split minimap drawing into cached and dynamic layers.

Static layers:

- Water.
- Landmass.
- Parks.
- Roads.
- Bridges.
- Rail.
- District labels.

Dynamic layers:

- Player.
- Vehicles.
- Train.
- Waypoint.
- Hover highlight.
- Icons for changing state, like staffed corners or busted corners.

Use an offscreen canvas for static minimap layers. Redraw static layers only when the map data or viewport changes. Redraw dynamic layers every frame.

Expected benefit: faster minimap rendering and less frame work during map movement.

### 4. 3D Scene Performance

Reduce map load time and frame cost.

Steps:

- Reuse shared materials instead of creating many duplicate materials.
- Use instanced meshes for repeated props: trees, windows, road markings, street furniture, rail ties, parked cars.
- Precompute filler layouts once.
- Split scene construction into named builders: terrain, transport, districts, lots, places, props, actors.
- Defer distant decorative props until after the first playable frame.
- Keep GLB loading centralized and cache loaded assets.
- Add timing logs in development for terrain, buildings, actors, and assets.

Success target:

- First playable map frame should appear noticeably faster on a laptop.
- No blank WebGL scene during load.
- Static minimap should not be redrawn every frame unless needed.

### 5. Better 3D Map Visuals

Upgrade the world itself, not only the minimap.

Terrain:

- Natural coastline around playable city bounds.
- Lakefront edge with beach, seawall, or piers where appropriate.
- River and canal banks with different materials from open water.
- Districts separated by natural features and urban cues, not straight color blocks.

Roads:

- Different visual types: arterials, local streets, alleys, bridges, service roads.
- Curved roads where useful.
- Road markings, sidewalks, crosswalks, intersections.

Buildings:

- Place-specific building models for banks, garages, realty, city hall, shops, bars, heist targets.
- Better storefront signs.
- More varied height, roof shape, facade material, windows, and props by district.

Icons and interaction:

- In-world signs and markers should match minimap categories.
- Interactable buildings should be recognizable before the player reaches them.
- Hover and proximity text should use the exact same place data.

### 6. Minimap Visual Overhaul

Target: GTA-inspired, readable, useful, and accurate.

Features:

- Compact minimap for orientation.
- Expanded map for planning.
- One global waypoint.
- Hover text: district, exact place name, and category.
- Search/filter: banks, properties, people, shops, heist targets, corners.
- Distinct visual layers:
  - Water: blue fills.
  - Parks: green fills.
  - Roads: gray hierarchy by road class.
  - Bridges: separate deck style over water.
  - Rail: dark bed, rails, ties, moving train marker.
  - Districts: soft labels, not hard borders.
  - Places: recognizable icons.

Implementation detail:

Use the same `Place` coordinates as the 3D world. If an icon looks centered in a block, the lot/place data is wrong or too coarse, not the minimap. Fix the source coordinate.

### 7. Gameplay Readiness

The map should be ready for future systems:

- Physical missions.
- More heists.
- Delivery routes.
- Police patrols.
- Territory pressure by actual location.
- Shop ownership and protection.
- NPC schedules.
- Train timing and blocked crossings.
- District-specific events.
- Map-based tutorials.

This means the map model should expose queries:

- Nearest place.
- Places by category.
- District at point.
- Road at point.
- Is point on land.
- Is point on bridge.
- Is point in water.
- Route hint from A to B, with distance and street summary.

### 8. Testing Plan

Unit tests:

- Projection maps world to canvas and back.
- District lookup returns expected districts.
- Road/bridge/water classification works.
- One global waypoint replaces old per-district waypoints.
- Places preserve exact authored coordinates.

Integration tests:

- 3D place markers and minimap icons use the same place data.
- Roads and bridges render from the same transport layer.
- Hovering the expanded map resolves the expected place.

End-to-end tests:

- Start game, open map, expand minimap.
- Hover a bank and see the bank name.
- Set one waypoint, set another, confirm the first is replaced.
- Verify minimap has water, parks, roads, bridges, rail, icons, and player marker.
- Verify map loads without WebGL errors and without missing assets.

Visual checks:

- Desktop and mobile screenshots.
- Canvas pixel checks for nonblank water, land, roads, parks, and icons.
- Confirm the 3D map fits its allotted page space.

## Suggested Implementation Order

1. Create typed map schema and migrate existing roads, districts, places, parks, rail, water, and bridges into data files.
2. Build `MapViewport` and use it for expanded minimap hover, click, icons, and waypoints.
3. Replace per-district waypoint shape with one global waypoint in saved state, keeping save migration.
4. Rebuild minimap renderer around cached static layers and dynamic overlays.
5. Move 3D scene builders to consume the same map data.
6. Add road classes, curved paths, bridge records, and rail records.
7. Replace placeholder district rectangles with natural land/water/park shapes.
8. Add place-specific 3D building models and clearer in-world signs.
9. Add train path animation and train-crossing gameplay hooks.
10. Add focused unit, integration, e2e, and visual tests.

## Definition of Done

- Map loads faster than the current implementation on a normal laptop.
- The 3D map and minimap use one shared map data model.
- Icons appear at exact place coordinates.
- Hover text names the correct district and place.
- Only one waypoint can exist at a time.
- Water, parks, roads, bridges, rail, buildings, and landmarks are visually distinct.
- The 3D map fits its UI space on desktop and mobile.
- New map places can be added through typed data without touching renderer logic.
- Tests cover projection, hover, waypoint, and major visual layers.
