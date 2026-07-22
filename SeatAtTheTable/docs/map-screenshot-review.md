# Map Screenshot And Profile Review

> **STATUS: dated record of one review pass, not a plan.** Nothing here is outstanding.
> Kept because it documents what the automated visual review actually checks and what the
> `[map-build]` timing profile reports — both still live in `e2e/smoke.e2e.ts` and
> `map/scenePerformance.ts`. Expect these numbers and thresholds to change when
> `world-expansion-plan.md` lands.

Date: 2026-07-22

## Viewports Covered

- Desktop: 1280 x 720
- Laptop: 1024 x 640
- Mobile: 390 x 844

## Automated Review

The Playwright smoke suite now includes `map screenshot review covers desktop, laptop, and mobile viewports`.

That test starts a fresh game at each viewport, opens the map, captures the WebGL canvas, and checks:

- The map container has usable width and height.
- Water pixels are present.
- Land pixels are present.
- The canvas has enough color variety to catch blank or flat-color regressions.

## Profile Review

The map build path now emits a local development timing profile:

`[map-build] terrain:...ms street-trees:...ms places:...ms actors:...ms fill-and-landmarks:...ms gameplay-overlays:...ms total:...ms`

The Playwright smoke suite checks that this profile is emitted in local dev.

## Optimization Completed

Corner rendering moved into `src/map/placeRendering.ts` and now reuses pole/orb geometry and orb materials within the corner render pass instead of recreating them for every corner. This is a safe first optimization because it does not change map data, placement, collision, or interaction behavior.
