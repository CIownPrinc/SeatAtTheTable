# Map rebuild plan

The map is being rebuilt from scratch in `src/world/`, beside the old one, and replaces it when it
matches. Decided 2026-10-18. It stays in this game, Seat at the Table; it is not part of
SeatAtTheTable 2. `TODO.md` sections 10 (every play-through note) and 11 (the short version of this
plan) point here.

## Why rebuild instead of patch

The old map's problems come from its foundations, so fixing them one at a time keeps producing
new ones:

| Foundation | What it caused |
| --- | --- |
| Coordinates authored for a 1,500-wide district, then stretched by `widenAuthoredX` | Lots, roads and shorelines drift apart whenever anything moves |
| A street grid drawn full-width, then clipped to district outlines | Roads stopping short of bridges, ending in grass or the sea, stubs to nowhere |
| Buildings allocated without knowing about diagonal or curved roads | Buildings standing in streets |
| Countryside scenery scattered at random | Trees and barns in the lanes, no believable layout |
| Ground as stacked flat polygons per region | Hard-edged colour bands, z-fighting, no gradual zoning |
| Every model built from boxes and cylinders in code | The primitive look the player keeps pointing at |
| The whole 3D scene inside the 7,000-line `core/header.ts` | Every change is a risky patch |

## What stays

Everything that isn't the world itself: missions, economy, ventures, crew, heat, banks, stocks,
the phone, saves, onboarding, and the list of places (`config/` and `core/`). The new map has to
offer the same things the game asks of the old one: where each place is, whether a point is
walkable, the route between two points, what's near the player, and what to draw on the minimap.

## Principles

1. **The audit comes first.** `map/worldAudit.ts` defines what a correct world is: no road over
   water, nothing in a road, beaches unbroken along their shore, no hairline strokes. Every phase
   adds its rules there before building the thing they check. Dev builds mark violations on the
   map in red, and the e2e scene audit fails on any new one.
2. **One source of truth per fact.** Roads are a graph; lots are cut from the blocks the graph
   encloses; collision, the GPS, traffic and the minimap all read that same data. Nothing is
   authored twice.
3. **World coordinates from the start.** No authored-then-stretched numbers.
4. **Data first, then drawing.** `src/world/data/` is plain TypeScript with no three.js, so it's
   fast to unit test. `src/world/build/` turns it into meshes.
5. **Real models.** Buildings, vehicles, people and props are made in Blender from scripts in
   `art/blender/`, exported as `.glb`, instanced, and kept within a triangle budget per category.
6. **Gradual zoning.** Zoning is a smooth field over the whole world: wealth, density, use,
   greenery. It decides the ground colour, the building types, scenery and traffic, so areas fade
   into each other like real cities and countryside.

## Layout

```
src/world/
  data/      terrain, zoning field, road graph, blocks and lots, place assignments (no three.js)
  build/     terrain mesh, roads, water, buildings, scenery, props, from the data above
  assets/    the model catalog: Blender glb files, instancing, levels of detail
  runtime/   camera, people, vehicles, traffic, police, collision, day and night, weather
  index.ts   createWorld(): what core/header.ts calls when "New map (beta)" is on
art/blender/
  lib/       shared helpers: palette, bevels, export, preview renders
  *.py       one script per model family; `pnpm --dir SeatAtTheTable art` rebuilds them all
public/assets/world/   exported glb files (committed, so the game never needs Blender to run)
```

Blender scripts run inside Blender's own Python (`bpy`), so they can't use the project's normal
Python tooling (uv, ruff). They stay small, deterministic and free of third-party imports.

## Phases

Each phase ends with its audit rules passing, unit and e2e tests green, and screenshots checked.
The bracketed numbers are `TODO.md` section 10 items each phase closes.

0. **Foundations.** This plan; the world audit (done); the Blender pipeline with a first exported
   model loading in the game; the "New map (beta)" setting showing an empty new world.
1. **Ground and water.** One terrain mesh cut to the coastline, coloured by the zoning field, with
   smooth coasts and real beaches; water with shader waves and shoreline foam. [3, 13, 27, 28, 29]
2. **Roads.** A road graph with real curves, junctions, lane markings, turning circles and
   dead-end signs; country lanes and dirt trails; bridges built from the graph. The GPS routes on
   it. [7, 9, 14, 30]
3. **Lots and buildings.** Blocks cut from the road graph, lots along their frontage, every game
   place given a lot and a building type that fits it, plus filler by zoning. Construction sites.
   [8, 31, 37]
4. **Scenery and streets.** Trees, parks and greenery from zoning; streetlights facing the road,
   on only at night; signs, benches, bins. Icons only where they matter, not over every building.
   [12, 21, 35]
5. **Models.** The Blender catalog: buildings by type and wealth, cars by class (sports car,
   pickup, SUV, sedan, beater, luxury, truck, bike, police, taxi), people, props, with instancing
   and levels of detail. [25, 32]
6. **Life.** Collision for buildings, trees, cars and trains; traffic that drives in lanes and
   stops at junctions; police patrols; getting splatted by a car and getting back up; breakdown
   smoke and a warning. [10, 11, 18, 23, 24]
7. **Minimap and wardrobe.** A GTA-style minimap drawn from the same data; the clothing UI. [19, 22]
8. **Interiors.** Walkable 3D interiors: a front desk that looks like one, people to talk to, a
   bulletin board you can read. [33]
9. **New places.** The mall with a parking garage and an outdoor-feeling inside, a central park,
   the suburbs, and snow that settles with a plow that clears the roads. [34, 35, 36, 38]
10. **Switch over.** A parity checklist against the old map (every place reachable, every mission
    objective standing on its place, saves load, performance on a 4x-throttled phone at least as
    good). Then the new map becomes the default and the old map code is deleted.

## Performance budget

Measured with the method in the project memory: production build, `vite preview`, 4x CPU
throttling. Opening the map in under 0.5 s, at least 40 fps on the phone profile, and no more
than about 500 draw calls on screen. Instancing, merged static geometry and levels of detail are
how the extra detail fits in that budget.
