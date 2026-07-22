# Windhaven World Expansion Plan

**Status: ACTIVE — not started.** Supersedes `map-overhaul-plan.md`, which described the
architecture that produced the *current* map and treated the three-district layout as
correct. That layout is now the thing being replaced.

## Goal

Windhaven is currently three identical 1500-wide squares in a perfect horizontal row,
joined by bridges, inside a `5500 × 1200` world. The player's words: "crazy unrealistic."
It is also cramped — buildings overlap, some stand in streets, and there is no room to add
places without making it worse.

Two changes, together:

1. **Grow each district** so there is room to place buildings properly.
2. **Wrap the city in outskirts** — suburbs, industrial edge, farmland, forest — and break
   the perfect row into an irregular cluster, so the city reads as sitting *in* a landscape
   rather than floating as three tiles.

## Why this blocks the rest

Most of the outstanding player-reported problems are downstream of geometry:

- Buildings overlapping and standing in streets — needs more room *and* a real allocator.
- Owned real estate having visible buildings — needs somewhere to put them.
- Distinct shop silhouettes — deferred because bigger footprints wall off the shoreline
  near spawn (see below).

Doing the allocator against the old geometry would mean writing it twice. Order matters.

## Open question (ask before starting)

**Are the outskirts drivable and populated, or scenery?**

- *Populated*: roads, filler buildings, a handful of interactable places (roadside diner,
  farm, motel, depot). Needs real road network, collision and minimap coverage out there.
- *Scenery*: the ring exists to make the city feel embedded, gameplay stays urban. Much
  cheaper — mostly terrain, vegetation and a boundary highway.

This is the difference between a large job and a very large one.

## Work items, in dependency order

### 1. Geometry

Enlarge the districts and re-lay them as an irregular cluster. Add the outskirts ring and a
highway connecting it.

Touches: `map/world.ts` (`WORLD_W`, `WORLD_H`, `DISTRICT_W`, `DISTRICT_OFFSETS`,
`WINDHAVEN_LANDMASS`), `map/mapModel.ts` (district land areas, label points),
`map/geometry.ts`, road network, bridges.

**Must move with it:** `config/blocks.ts`. Territory blocks are derived from district
dimensions (`DISTRICT_W / 4` across two bands) and will be wrong the moment the districts
change size. `map/territory.ts` is pure and tested, so the block *rules* survive — only the
geometry needs regenerating. `src/map/territory.test.ts` asserts 8 blocks per district with
unique resistances 0-7; keep that invariant.

Also check: `map/viewport.ts` (the City Map frames district land bounds), minimap static
layer cache key, `spawnPoints`, `districtParkSlots`.

### 2. Lot allocator (replaces `namedBuildingLots`)

`namedBuildingLots` in `map/world.ts` is a hand-authored `Record<id, Point>` — one fixed
point per building. It **structurally cannot** express "two shops on one block", which is
exactly what the player asked for, and it is the root cause of the cramping and overlap.

Replace with a real allocator:

- A block exposes buildable lots, set back from the road edge.
- Several interactable buildings pack into one block without overlapping.
- Placement is deterministic (seeded), so the map looks the same across sessions and saves.
- Nothing lands in a street or in water.

Keep it pure and unit-tested like `territory.ts` / `storefront.ts`. The existing guard in
`src/map/layout.test.ts` — every authored place must sit on its district's land — already
catches a whole class of mistakes here and passed throughout Phase 4. Extend it to also
assert no two placed buildings overlap.

### 3. Neighbourhood character in zoning

Keep zoning loose but readable. The player's reference is GTA: bougie neighbourhoods, poor
neighbourhoods, shopping areas, office districts, entertainment strips.

Feeds `map/zoning.ts`, `map/renderTheme.ts` and filler generation. Existing zone types
(`skyscraper`, `commercial`, `shop`, `residential`, `industrial`, `logistics`, `street`)
are a starting vocabulary but do not yet carry *class* — rough vs. affluent residential
should look different, not just be labelled differently.

### 4. Filler variety

More filler-building shapes and palettes matching those zones, so a rough block and a
bougie block read differently at a glance.

### 5. Distinct shop silhouettes (deferred from Phase 4)

`dealership` and `brokerage` buildings currently fall through to the generic service
silhouette. Giving them their own footprints was written and then **deliberately reverted**:
it cut visible water below the "map canvas keeps water and land visually distinct" smoke
guard (876 against a 900 floor). Confirmed by stashing that the guard was right — the larger
footprints wall off the shoreline near spawn.

Redo once the rebuild gives buildings proper setback from the water. `serviceBuildingSilhouette`
in `map/placeRendering.ts` is the single place to change.

### 6. Garage

**Decided with the player:** one garage in Devlin (home turf). Cars park where you leave
them for ~3 minutes, then return to the garage.

Needs per-car parked position plus a timestamp — `state.parkedCarPos` is currently a single
shared position, not per-car. Save migration required.

### 7. Owned real estate visible on the map

Properties you own should render as findable buildings, not just rows in the phone. Ties to
the allocator: they need lots too.

## Definition of done

- The city no longer reads as three aligned squares.
- Outskirts exist and are visually distinct from the urban core.
- No building overlaps another, and none stands in a street.
- Multiple interactable buildings can share one block.
- Rough, affluent, shopping and office areas are distinguishable at a glance.
- Owned property appears on the map.
- The garage exists and cars return to it.
- `layout.test.ts` covers land placement *and* non-overlap.
- Territory blocks still satisfy the invariants in `territory.test.ts`.
- Full gate green: lint, typecheck, unit tests, build, e2e.
