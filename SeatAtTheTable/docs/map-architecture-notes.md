# Map Architecture & Verification Notes

Reference, not a plan. Replaces `map-overhaul-plan.md` and `map-screenshot-review.md`
(both superseded/closed) — this keeps only the facts from them that still constrain how the
map is edited and tested today. For active map work, see `world-expansion-plan.md`
(outskirts follow-up) and `TODO.md`.

## The one rule that still governs every map edit

**One map data model drives both the 3D world and the minimap.** Buildings and icons use
exact authored coordinates — never separate "pretty" minimap coordinates. If an icon looks
off from its place, fix the source coordinate, not the renderer. This is what the original
map overhaul (2026-07) built and what every later pass (world expansion, outskirts,
missions) must not regress.

`MapViewport` (`src/map/viewport.ts`) is the shared projection layer between world
coordinates and screen coordinates. It powers expanded/compact minimap rendering, hover
detection, waypoint placement, and test screenshots — one implementation, so an icon can
never appear in one place but resolve clicks or hovers to another.

## What the automated visual review checks

`e2e/smoke.e2e.ts`'s "map screenshot review" test starts a fresh game at three viewports —
desktop (1280×720), laptop (1024×640), mobile (390×844) — opens the map, captures the WebGL
canvas, and checks:

- the map container has usable width and height
- water pixels are present
- land pixels are present
- the canvas has enough colour variety to catch blank or flat-colour regressions

## What the dev timing profile reports

The map build path emits a local-dev-only timing profile:

`[map-build] terrain:...ms street-trees:...ms places:...ms actors:...ms fill-and-landmarks:...ms gameplay-overlays:...ms total:...ms`

`map/scenePerformance.ts` is the source; `e2e/smoke.e2e.ts` asserts the profile is emitted.
Expect the numbers to shift as districts and scenery grow — the format is what's contractual.
