# Map Asset Usage Audit

Audit date: 2026-07-22

This file tracks downloaded map assets that live under `public/assets/map`. An asset must be one of four things:

- `USED`: requested by the running game today.
- `MISSING / BROKEN`: referenced by a model or loader but not present as a normal file.
- `UNUSED`: present on disk but not listed in the manifest.
- `INTENTIONALLY RESERVED`: kept for a named future feature.

The source of truth is `src/map/assetManifest.ts`. Run `pnpm run audit:map-assets` from the repo root to print the current report.

## Runtime Verification

The Playwright smoke test watches real browser requests for `/assets/map/...`. The test now proves that the eager building GLBs are requested by the running game and that missing `/assets/map` requests fail the test.

The game currently loads the Kenney modular building pack at runtime. The Kenney car kit and blocky character pack are reserved for later render-path work and should not be treated as active visual assets until the actor renderer requests them.

## USED

- `/assets/map/kenney-modular-buildings/building-sample-house-a.glb`
- `/assets/map/kenney-modular-buildings/building-sample-house-b.glb`
- `/assets/map/kenney-modular-buildings/building-sample-tower-a.glb`
- `/assets/map/kenney-modular-buildings/building-sample-tower-c.glb`
- `/assets/map/kenney-modular-buildings/building-window-awnings.glb`
- `/assets/map/kenney-modular-buildings/building-window-wide.glb`
- `/assets/map/kenney-modular-buildings/License.txt`
- `/assets/map/kenney-car-kit/License.txt`
- `/assets/map/kenney-blocky-characters/License.txt`

## MISSING / BROKEN

- `Textures/colormap.png`

Some Kenney building GLBs request this relative texture. The downloaded pack does not contain that file, so `src/map/assets.ts` redirects that request to a tiny inline fallback texture. This prevents black or failed model renders while keeping the missing dependency visible in the audit.

## UNUSED

- none

The audit script fails if a file exists under `public/assets/map` and is not listed in `src/map/assetManifest.ts`.

## INTENTIONALLY RESERVED

- `/assets/map/kenney-modular-buildings/detail-ac-a.glb`
  Future use: building facade dressing, district-specific roof details.
- `/assets/map/kenney-modular-buildings/roof-flat-detail-a.glb`
  Future use: rooftop clutter, train station variants.
- `/assets/map/kenney-car-kit/delivery.glb`
  Future use: delivery routes, job vehicles.
- `/assets/map/kenney-car-kit/police.glb`
  Future use: police patrol vehicle model, wanted-state roadblocks.
- `/assets/map/kenney-car-kit/sedan-sports.glb`
  Future use: traffic model variants, player garage variants.
- `/assets/map/kenney-car-kit/sedan.glb`
  Future use: traffic model variants, player garage variants.
- `/assets/map/kenney-car-kit/suv-luxury.glb`
  Future use: high-value traffic, player garage variants.
- `/assets/map/kenney-car-kit/suv.glb`
  Future use: traffic model variants, crew transport.
- `/assets/map/kenney-car-kit/taxi.glb`
  Future use: taxi traffic, district ambience.
- `/assets/map/kenney-car-kit/van.glb`
  Future use: delivery routes, crew transport.
- `/assets/map/kenney-blocky-characters/character-a.glb`
  Future use: pedestrian variants, named NPC variants.
- `/assets/map/kenney-blocky-characters/character-c.glb`
  Future use: pedestrian variants, named NPC variants.
- `/assets/map/kenney-blocky-characters/character-e.glb`
  Future use: pedestrian variants, named NPC variants.
- `/assets/map/kenney-blocky-characters/character-h.glb`
  Future use: pedestrian variants, named NPC variants.
- `/assets/map/kenney-blocky-characters/character-k.glb`
  Future use: pedestrian variants, named NPC variants.
- `/assets/map/kenney-blocky-characters/character-n.glb`
  Future use: pedestrian variants, named NPC variants.
- `/assets/map/kenney-blocky-characters/Textures/texture-a.png`
  Future use: pedestrian texture variants.
- `/assets/map/kenney-blocky-characters/Textures/texture-b.png`
  Future use: pedestrian texture variants.
- `/assets/map/kenney-blocky-characters/Textures/texture-c.png`
  Future use: pedestrian texture variants.
- `/assets/map/kenney-blocky-characters/Textures/texture-d.png`
  Future use: pedestrian texture variants.
- `/assets/map/kenney-blocky-characters/Textures/texture-e.png`
  Future use: pedestrian texture variants.
- `/assets/map/kenney-blocky-characters/Textures/texture-f.png`
  Future use: pedestrian texture variants.
- `/assets/map/kenney-blocky-characters/Textures/texture-g.png`
  Future use: pedestrian texture variants.
- `/assets/map/kenney-blocky-characters/Textures/texture-h.png`
  Future use: pedestrian texture variants.
- `/assets/map/kenney-blocky-characters/Textures/texture-i.png`
  Future use: pedestrian texture variants.
- `/assets/map/kenney-blocky-characters/Textures/texture-j.png`
  Future use: pedestrian texture variants.
- `/assets/map/kenney-blocky-characters/Textures/texture-k.png`
  Future use: pedestrian texture variants.
- `/assets/map/kenney-blocky-characters/Textures/texture-l.png`
  Future use: pedestrian texture variants.
- `/assets/map/kenney-blocky-characters/Textures/texture-m.png`
  Future use: pedestrian texture variants.
- `/assets/map/kenney-blocky-characters/Textures/texture-n.png`
  Future use: pedestrian texture variants.
- `/assets/map/kenney-blocky-characters/Textures/texture-o.png`
  Future use: pedestrian texture variants.
- `/assets/map/kenney-blocky-characters/Textures/texture-p.png`
  Future use: pedestrian texture variants.
- `/assets/map/kenney-blocky-characters/Textures/texture-q.png`
  Future use: pedestrian texture variants.
- `/assets/map/kenney-blocky-characters/Textures/texture-r.png`
  Future use: pedestrian texture variants.
