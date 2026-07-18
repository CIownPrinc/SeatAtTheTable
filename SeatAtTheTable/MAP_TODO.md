# Map Todo

## Current Status

- Done: Install `three` through pnpm and remove CDN/global `THREE: any`.
- In progress: Split map code out of `header.ts`.
- Done: Delete the dead legacy district scene builder body. A compatibility wrapper remains for saved-game boot paths.
- Mostly done: Shared map data for objects, bounds, collisions, interactions, minimap, filler layout, movement, zoning, and amenity markers.
- In progress: GLB/GLTF asset loading. Kenney CC0 Modular Buildings, Car Kit, and Blocky Characters assets are mirrored under `public/assets/map` and loaded through the shared map asset library. Buildings use GLB assets now; cars and NPCs use the better procedural models until the mirrored actor packs can be art-directed instead of forced in.
- Started: Immersion systems on top of shared map objects. Basketball courts, pet stores, shops, park-game spots, moving notable NPCs, gang recruits, pedestrians, and ambient traffic now exist in the map scene.
- Done: Roaming actor logic is extracted to `src/map/roaming.ts`.
- Done: Minimap rendering is extracted to `src/map/minimap.ts`.
- Done: Amenity data, interaction modal construction, and amenity model rendering are extracted to map modules.
- Started: Scene building extraction. Base ground, district tints, canals, roads, intersections, and bridge geometry live in `src/map/sceneBuilding.ts`.
- Deferred: Pathfinding/physics until product direction requires it.

## Asset And System Rule

When a new library, asset pack, or map system is added, future map work should actively use it. Avoid downloading assets or adding helpers that do not feed scene building, collision, minimap, zoning, lighting, weather, or user-facing map behavior.

## Next Steps

- Use the existing GLB loader for more city props after choosing exact CC0 sources: street furniture, parking details, docks/logistics props, and residential details.
- Continue extracting `buildCityScene` from `header.ts` into a typed scene-building module. Next pass should move parks, parking lots, street trees, river/rail details, and landmarks.
- Expand roaming with lane-aware traffic rules and more believable pedestrian destination tables.
- Evaluate the mirrored CC0 car and character assets role by role. Keep procedural cars as the current primary look, and only use external actor meshes where they look better than the procedural model.
- Add a visual regression e2e check for the 3D map canvas so shader/render failures are caught before manual testing.
- Replace more handmade primitives only where the asset fits the Chicago-parody city style and location.
