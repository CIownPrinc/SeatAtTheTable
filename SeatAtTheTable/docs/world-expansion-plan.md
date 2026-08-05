# Windhaven World Expansion Plan

> **STATUS: COMPLETE.** Every stage below shipped green (lint, typecheck, unit tests,
> build, e2e) and every item in the Definition of Done at the foot of this file is met.
> Kept as the record of what was built and why.
>
> Delivered: **1a** districts widened 40% via a tested coordinate transform · **1b**
> distinct coastlines (Devlin peninsula, compact West Side, Hub headland) · **1c**
> outskirts ring of farmland/forest/suburb/industrial · **2** lot allocator replacing
> `namedBuildingLots` · **3** neighbourhood character · **4** facade detailing · **5** shop
> silhouettes · **6** the player garage · **7** owned real estate on the map.
>
> **The outskirts second pass this file deferred has since landed** — see `TODO.md` §0c for
> current status. Shipped: scenery for every belt, the off-road dealership + woodland
> terrain rule, the Fire Road time trial, the airfield/Drive-In/Motel/Lodge venues, and
> sparse rural traffic. Still open: `resort`/`suburb` as real zoning `BlockCharacter`s
> (current scenery is procedural, not full zoning) and the Lakeridge Country Club
> (intentionally deferred into the in-person Politics work).

Supersedes the original map overhaul, which described the architecture that produced the
*previous* map and treated the three-district layout as correct — that layout is what this
plan replaced. Its still-relevant architecture rule (one data model drives the 3D world and
the minimap) now lives in `map-architecture-notes.md`.

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

## Decided with the player

**Outskirts: scenery first, populate later.** Pass 1 is terrain — farmland, forest, suburb
rooftops, an industrial edge — bounded by a drivable boundary highway, with **no
interactable places out there**. Gameplay stays urban. This kills the "three floating
squares" problem at a fraction of the cost, and is a first step rather than a dead end:
once the geometry and lot allocator exist, adding real places is additive.

*Pass 2 (later, not now):* roadside diner, motel, farm, freight depot; outskirt road
network, collision and minimap coverage.

**Sequencing: staged commits, each one green** (lint + typecheck + tests + build + e2e).
The map must never be left half-migrated — Codex is working on the mission system on the
same trunk, so a broken intermediate state is expensive.

**Division of work with Codex:** Codex owns missions (`core/missions.ts`, `config/npcs.ts`,
~185 mission references inside `header.ts`). This rebuild stays in `src/map/*` and
`src/config/*`, which touches `header.ts` in only ~19 places. Keep it that way — do not
drift into mission code, and do not build onboarding here (it is mission-shaped and would
collide).

## Staged delivery

Each stage ships green on its own. Stage 1 is split because moving district *size* and
district *arrangement* in one commit would make a failure impossible to bisect.

| Stage | Scope | Main risk |
| --- | --- | --- |
| **1a** | Enlarge districts. `DISTRICT_W` up, `DISTRICT_OFFSETS`/`WORLD_W` follow, land polygons, canals, road network and `config/blocks.ts` all widen with it. Arrangement unchanged. | All ~40 hand-placed anchors use district-local x (max ~1360), so a *wider* district keeps them valid. `layout.test.ts` proves it. |
| **1b** | Break the row: stagger the districts vertically into an irregular cluster, reshape coastlines. | Anchors carry **world** y, so vertical movement can drop them off their district's land. Move anchors in the same commit and lean on `layout.test.ts`. |
| **1c** | Outskirts terrain ring (scenery only) + drivable boundary highway. | `isPointOnWindhavenLand` currently gates *all* movement off one polygon; the ring must extend it without letting the player walk onto water. |
| **2** | Lot allocator replacing `namedBuildingLots`. | Overlap regressions — extend `layout.test.ts` to assert non-overlap. |
| **3** | Neighbourhood zoning character. | Mostly additive. |
| **4** | Filler variety. | Watch the water/land visual guard in `smoke.e2e.ts`. |
| **5-7** | Shop silhouettes, garage, owned property on the map. | Small, independent. |

### Known trip-hazards

- `isPointInWater` hard-codes `point.y < 56 + radius` as "north shore water". Any change to
  the coastline must revisit that constant or the player will swim or be walled off.
- The minimap caches a static layer keyed by `minimapStaticLayerCacheKey` — it includes
  landmass length, terrain and road versions. Confirm geometry changes actually bust it.
- `config/blocks.ts` derives blocks from `DISTRICT_W / 4`; `territory.test.ts` asserts 8
  blocks per district with unique resistances 0-7. Keep that invariant through every stage.
- The City Map viewport frames district land bounds, so it reframes automatically — but
  district `labelPoint`s sit at `y: -118` in open water and must stay north of the coast.

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
