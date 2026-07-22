# Windhaven Map Remaining TODO

## Finished In This Pass

- [x] Add real route-summary text for waypoint feedback.
- [x] Reuse the road-graph route data for expanded-map waypoint messages.
- [x] Add dev-only scene-build timing so slow map stages are visible during local runs.
- [x] Keep browser map tests stable for animated WebGL screenshots.
- [x] Verify car parking/spawn positions use one shared source of truth.

## Completed From The Remaining List

- [x] Move business, service, local shop, corner, and actor scene rendering out of `src/core/header.ts` into typed map-rendering modules.
- [x] Add place-specific 3D building silhouettes for banks, garages, realty offices, city hall, bars, shops, and heist targets.
- [x] Add map gameplay hooks that use location: missions, deliveries, police patrols, territory pressure, and tutorials.
- [x] Add train warnings and consequences around blocked crossings.
- [x] Profile scene-build timings on a normal laptop and optimize the slowest measured stage first.
- [x] Add a screenshot review pass for desktop, laptop, and mobile viewports before large visual changes.

## Completion Notes

- Scene rendering modules: `src/map/placeRendering.ts` and `src/map/actorRendering.ts`.
- Gameplay hooks: `src/map/gameplayHooks.ts`.
- Screenshot/profile review: `docs/map-screenshot-review.md`.
- Browser coverage: `e2e/smoke.e2e.ts`.

## Not Currently Blocked

- Map fullscreen behavior is covered by Playwright.
- Land and water visual distinction is covered by a canvas pixel test.
- Expanded minimap hover, search, and waypoint placement are covered by Playwright.
- Route, bridge, train, parking, and map query behavior are covered by unit tests.
