# Map Todo

## Current Status

- Done: Install `three` through pnpm and remove CDN/global `THREE: any`.
- In progress: Split map code out of `header.ts`.
- Done: Delete the dead legacy district scene builder body. A compatibility wrapper remains for saved-game boot paths.
- Mostly done: Shared map data for objects, bounds, collisions, interactions, minimap, filler layout, movement, zoning, and amenity markers.
- In progress: GLB/GLTF asset loading. Kenney CC0 Modular Buildings assets, downloaded from OpenGameArt, are now mirrored in `public/assets/map/kenney-modular-buildings` and used for residential, commercial, and tower building variants.
- Started: Immersion systems on top of shared map objects. Basketball courts, pet stores, shops, park-game spots, moving notable NPCs, gang recruits, pedestrians, and ambient traffic now exist in the map scene.
- Deferred: Pathfinding/physics until product direction requires it.

## Asset And System Rule

When a new library, asset pack, or map system is added, future map work should actively use it. Avoid downloading assets or adding helpers that do not feed scene building, collision, minimap, zoning, lighting, weather, or user-facing map behavior.

## Next Steps

- Use the existing GLB loader for more city props after choosing exact CC0 sources: street furniture, parking details, docks/logistics props, and residential details.
- Continue extracting scene-building code from `header.ts` into typed modules.
- Extract roaming actor logic into a typed module, then expand it with road-aware traffic rules and district-safe pedestrian destinations.
- Add or mirror CC0 car and character asset packs before replacing the improved procedural car/person models with external meshes.
- Extract minimap drawing and interaction into a typed module.
- Add a visual regression e2e check for the 3D map canvas so shader/render failures are caught before manual testing.
- Replace more handmade primitives only where the asset fits the Chicago-parody city style and location.
