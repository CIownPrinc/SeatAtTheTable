# SeatAtTheTable — V1 finish list

**V1 is feature-frozen.** The goal is to take the features it has today and make them work
with no bugs. New features, and designs that were never built, moved to
**[`SEATATTHETABLE2.md`](SEATATTHETABLE2.md)**, the starting brief for the remake in a new
repo. If a task below starts turning into a new feature, it belongs there instead.

## Every planning/reference doc in this repo — start here, don't go searching

| Doc | Covers | Status |
| --- | --- | --- |
| **`AGENTS.md`** (root) | Engineering rules — types, TDD, comments, quality gates | Active, authoritative |
| **`TODO.md`** (this file) | The V1 finish list | Active |
| **`SEATATTHETABLE2.md`** (root) | Remake brief: why, design canon, lessons, the moved-out feature backlog | Handoff — copy into the V2 repo |
| **`CHANGELOG.md`** (root) | Version history V1.0-V5.0, tied to commit hashes | Reference |
| [`docs/mission-overhaul-plan.md`](SeatAtTheTable/docs/mission-overhaul-plan.md) | Mission state, event history, world memory, per-mission checklist | Reference; open V1 items are mirrored below |
| [`docs/onboarding-plan.md`](SeatAtTheTable/docs/onboarding-plan.md) | Progressive onboarding product rule, mission/feature classification | Reference — built |
| [`docs/world-expansion-plan.md`](SeatAtTheTable/docs/world-expansion-plan.md) | Bigger districts, outskirts, lot allocator, zoning, garage, real estate | Complete |
| [`docs/map-asset-usage-audit.md`](SeatAtTheTable/docs/map-asset-usage-audit.md) | Which CC0 assets are used vs. reserved | Reference |
| [`docs/map-architecture-notes.md`](SeatAtTheTable/docs/map-architecture-notes.md) | The one data-model rule map edits must not break, plus what the visual/perf review checks | Reference |

That's the complete set. If a `.md` file isn't in this table, it's either
`SeatAtTheTable/README.md` (game description, not a plan) or `create-next-app` boilerplate
under `apps/web/`. Any new plan/audit doc must be added here when created.

Verify with (this is also the pre-push hook):
`pnpm lint && pnpm typecheck && pnpm -w run test && pnpm --dir SeatAtTheTable build`
Plus `pnpm --dir SeatAtTheTable e2e` for anything touching the map, phone, shops or missions.

## Branch workflow (important)
Do all work on `main`, or a short-lived feature branch that is merged and **deleted
immediately** — never keep committing to an already-merged branch. Always
`git pull --rebase origin main` before starting and before pushing. Point **every**
agent (Codex + Claude Code) at the **same** branch. The old two-branch setup
(`main` + `fix/map-playability`, Codex PRs landing on one and Claude on the other)
caused duplicate-feature merges (e.g. the "two heat bars" HUD bug).

**Lanes.** Codex owns missions and onboarding (`core/missions.ts`, `config/missions.ts`,
`config/npcs.ts`, `core/onboarding.ts` and the mission code inside `header.ts`). Claude Code
owns the map, phone, shops and everything else under `src/map/*` and `src/config/*`. Each
task below names its lane; the player can reassign any of them.

## Definition of done for V1

V1 is finished when all of these hold at once:

- The full gate and the full e2e suite pass, twice in a row, on a clean checkout.
- No browser test sees a page error.
- A fresh game played from the start screen through every mission chain hits no bug, no stuck
  screen and no dead button.
- Every result screen tells the truth: a number shown is a number that actually changed.

---

# V1 FINISH LIST — in priority order

## 1. Known bugs

| Bug | Lane | Status |
| --- | --- | --- |
| **Phone stuck open.** `#device-overlay` never gets `.hidden` after Escape in `phone.e2e.ts` "Bank + AutoMart apps render, and Finance/Assets tabs are gone". Likely a result modal left open from an earlier step blocks Escape. | Claude | Open |
| **Minimap clear button.** `smoke.e2e.ts` "minimap expands before waypoint placement is allowed": `#minimap-clear` never gets `.show` on a countryside/outskirt waypoint click. | Claude | Open |
| **`shot-garage.e2e.ts` flake.** Times out under the 2-worker suite, passes alone. Contention, not a defect, but a flaky test hides real failures. | Claude | Open |
| ~~`raccoon_keycard` said heat -6 where it promised -5.~~ The mission removed exactly 5. The "Exact changes" ledger was wrong: it measured from accepting the mission to finishing it, so heat that cooled off and income earned while driving counted as rewards. Now it measures only the choices (`core/missionLedger.ts`, unit-tested). | Codex | Fixed 2026-10-16 |
| ~~`pigeon_summit` never resolves.~~ Two causes. The spec boots the full 3D city and took 38s of its 60s budget alone, so it timed out under contention (budget now 120s). And the result said "heat -4" even at zero heat. It now reports what was removed, rounded, because heat cools off in fractions (unrounded, it printed "heat -3.2495013163719824"). | Codex | Fixed 2026-10-16 |

## 2. Truthful results audit — Codex

The pigeon bug is one example of a class. Many mission choices apply a capped change, such
as `Math.max(0, state.heat - N)`, then print a hard-coded "heat -N". Sweep every
`finishMission` and `declineMissionOffer` result string, and make each one print what
actually changed, rounded, the way the raccoon and pigeon choices now do. Heat decays
continuously, so a capped heat change is almost never a whole number. Also check button labels
that promise numbers. Add a unit test where the logic is pure.

## 3. Browser coverage for what exists — Codex

Not new content, just proof that the content that exists works.
- Every stage and meaningful ending of the five main chains (`home_safe_robbery`,
  `stolen_shipment`, `alderman_fixer`, `turf_war`, `first_heist`).
- Every decline route, and the repeat/follow-up rules.
- The four mission-based onboarding paths, on the pattern in `e2e/onboarding.e2e.ts`.

## 4. In-browser QA — Claude

- **Venture / crew / exploit interaction modals.** The fullscreen and z-index root causes were
  fixed and the logic reads correct, but the reported symptom was never clicked through in a
  live session.
- **One full play-through** from a new game, logging every bug, dead end and confusing
  moment. That log becomes the polish list for §6.

## 5. Smoother — Claude

`src/core/header.ts` is now ~7,150 lines. V1 won't be re-architected (that's V2's job), but
it should run smoothly.
- Confirm hot paths call the cheap `refreshHUD()` rather than the full `renderAll()` rebuild
  when only HUD numbers changed. Profile before and after.
- Sweep for remaining merge leftovers and duplicate code.

## 6. Polish — from the play-through

Visual and feel fixes to existing panels and the 3D map. Driven by the §4 play-through log,
not invented up front. Polish means fixing what's there, not adding scenery.

## 7. De-bloat — needs a decision from the player

V1 carries scaffolding for a web stack it will never use. That stack now belongs to V2.
Candidates to delete from this repo:
- `apps/web/` — untouched `create-next-app` boilerplate. It's also the only reason Dependabot
  keeps opening Next.js security PRs here.
- `prisma/` and the root `prisma` dependency — a placeholder `Post` model nothing reads.
- Root dependencies the game doesn't import: `@shadcn/ui`, `@tanstack/react-query`,
  `@tanstack/query-devtools`, `framer-motion`.
- The duplicate root `eslint-plugin-comment-policy/` (the workspace one lives in `packages/`)
  and the one-off `fix-comments.cjs` script.
- `.tmp-assets/` — extracted Kenney zips, already ignored by git, safe to delete locally.

## 8. Dependency upkeep

- **Next.js security bump (PR #24)** — merge it, or delete `apps/web` per §7 and close it.
  PR #23 is a duplicate of #24.
- **Vitest 2 → 4 (PR #21)** — close it. Tested 2026-10-16: Vitest 4 needs Vite 6+, and the
  game is on Vite 5, so it fails at startup. A toolchain upgrade is not a V1 goal.

---

# Moved to SeatAtTheTable 2

Everything that was designed but unbuilt, or only an idea, is in
[`SEATATTHETABLE2.md`](SEATATTHETABLE2.md): outskirt zoning (`farmstead`, `suburb`, `resort`,
`woodland`, `works`), the resort strip, beach volleyball, rural wildlife and walkers, the
Lakeridge Country Club, non-grid roads and curves, lane-aware traffic, more 3D props, coast
and edge landmarks, deeper mission chains and follow-ups, more comic missions, more phone
contacts, recurring room events, more amenities, `buildCityScene` extraction, the Next.js
stack, server saves, and the undefined "readings" ML idea.

**Decided 2026-10-16: the drive out to the countryside is fun.** No fast travel to the
outskirts. The Travel Nodes strip stays deleted. The phone's taxi to a waypoint stays.

---

# THE MAP AT A GLANCE — what every region is and what is in it

Reference, not a task list. **Bold = shipped.** Plain = not in V1 (moved to `SEATATTHETABLE2.md`). The world is one
landmass in an ocean, with an enclosed lake in the north, two canals cutting it into three
city districts, and a ring of countryside around all of it.

## Water

| | What |
|---|---|
| **The ocean** | Surrounds everything. Hard world border. |
| **Windhaven Lake** | Enclosed body in the north. Was open to the ocean (which made it a bay, not a lake) until the landmass was wrapped over the top of it. |
| **South Branch Canal / Lakefront Cut** | The two north-south canals that separate the three city districts. Crossed by bridges on Grand, Roosevelt and Cermak. |
| **Beach ring** | Sand around the entire lake edge, derived from the lake polygon so it can't drift from the coast. |

## The three CITY districts — turf, control, the war

These carry gameplay: control %, turf pushes, spawn points, parking, territory blocks.
Character is mapped over a 4x4 block grid per district (`neighbourhoods.ts`).

### **Devlin District** — home turf, west
Working-class throughout, a **shopping strip** on the second row, and the blocks down by the
canal **gone to seed** (`rough`). Where Arjun starts.
Contains: **Your Garage** (drive-in bay), **Kailash's Cart** (a stall, not a building),
**Corner Store, Sudsy Laundromat, Windhaven Chaat House, Marigold Lounge**, **Devlin Back
Alley** (a real gap between two buildings, with the backroom card game and the wire network
off it), **Devlin Courts**, **Rockwell Pet Supply**, **Rentport City National**.

### **West Side** — industrial, centre
**Works and freight** across the north and the whole eastern edge; what housing exists sits
south-west and is **the poorest in the city**. The rail line runs down its east side.
Contains: **West Side Chop Shop**, **the railyard** (open ground, not a building), **the
dockmaster's yard**, **West Side Holdings**, **Windy City Cab Co.** (a depot yard).

### **The Hub** — money, east
**Financial core** north and centre (towers), **Gilt Shore money** along the east edge
(`affluent`), the **club strip** mid-south (`entertainment`, neon), **retail** on the southern
edge. The city's north edge is the lake's south beach.
Contains: **City Hall Annex**, **First Windhaven Trust** (the heist target), **Windhaven
Herald HQ** (Lana Vance's interview), **The Potato**, **Park Chess Tables**, **the piers**.

## The three OUTSKIRT districts — geography only, no turf

Named regions, not gameplay districts. No control, no pushes — a gang war in a wheat field is
not a thing anyone wants. Each groups terrain belts that were already out there.

### **Kestrel Reach** — the north, across the lake
Three belts: **Sunset Shore** (`suburb`), **Kestrel Woods** (`forest`), **Harrow End**
(`farmland`). Only reachable at all since the lake was enclosed.
Biome: woodland and farmland scenery are shipped as a simple procedural pass. `resort` and
`suburb` as real zoning are V2.
Contents: **Sunset Shore Motel** (lie low, and let a federal case decay — the one thing no
city interior offers) · **Kestrel Woods Fire Road** (no heat for driving offences + a time
trial) · **the off-road dealership** (Mudster's country branch — ATVs, quads, tractors) ·
**woodland tracks** that cars cannot use — all shipped. This is the busiest of the three.

### **Kettle Reach** — the west and south, wrapped around the city
Three belts: **Kettle Flats** (`farmland`, west), **Boundary Meadows** (`farmland`, south),
**Ridgewood Stand** (`forest`, south-east). An L-shape — which is why its map label needed a
grid walk to land inside it rather than in the middle of downtown.
Biome: farmland-with-farmsteads scenery is shipped; the quiet forest is shipped as terrain.
Contents, all shipped: **Kettle Flats Airfield** (`stolen_shipment`'s Black Market route
continuation) · **Boundary Meadows Drive-In** (a picture, an evening out) · **Ridgewood
Stand Lodge** (the `turf_war` truce's final negotiation).

### **Lakeridge County** — the east end
Two belts: **Lakeridge** (`suburb`), **Cicero Outworks** (`industrial`).
Biome: generic outskirt scenery. A real lakeside suburb and a chained-up industrial edge are V2.
Contains: **The Gilded Kettle** — the casino. Blackjack, roulette, five-card draw, slots.
Lakeridge Country Club is V2.

## The two forests, deliberately different

Not their own district — they sit 5,000 units apart with the whole city between them, and a
district like that is a category rather than a place.
- **Kestrel Woods** (north, Kestrel Reach) — the wild one. Fire road, tracks, the ATV dealer.
- **Ridgewood Stand** (south, Kettle Reach) — the quiet one. The Lodge, and nothing else.

## Zoning characters

**Shipped, city only:** `corporate` · `affluent` · `working` · `rough` · `shopping` ·
`entertainment` · `industrial`.
**V2, outskirts:** `farmstead` · `suburb` · `resort` · `woodland` · `works`. The V1
generator is scoped to the three city districts; the outskirts use the simpler scenery pass.

---

# Conventions worth keeping in view

### Parody geography
`src/config/parodyGeography.ts` holds the in-universe city references: San Plastica = Bay
Area / Northern California, Rentport = New York City, Flamingo Bay = Miami. Use those names
instead of real cities unless the player says otherwise.

### Named rival crews
`src/config/rivals.ts` — Rockwell Kings (Devlin), Cicero Firm (West Side), Meridian Group
(The Hub). One per district. Territory turf, shop pricing and the map overlay all read from
these.

### The online catalog is frozen
The phone's AutoMart/Realty apps sell exactly what the pre-phone Assets tab sold:
`sedan`, `impala`, `escalade`, `bentley` and `twoflat`, `retailstrip`, `aptbuilding`,
`loft`. Never add to that list. Every brand must instead keep in-person-only stock — both
rules are locked by tests in `src/map/storefront.test.ts`.

### e2e gotcha
Specs that read map pixels must `await waitForMapScene(page)` first — the canvas is blank
until three.js and the GLBs finish loading, and on a cold dev server that outruns the
default timeout. Workers are pinned to 2 in `playwright.config.ts` because nearly every
spec boots a full WebGL city and the default count fails on contention, not defects.

### The scene-audit detector
`e2e/scene-audit.e2e.ts` walks the live three.js scene through the dev-only `window.__seat`
hook and measures with three's own `Box3`. It asserts no building stands in a road, nothing
floats, nothing is buried, and no pedestrian stands inside a building. Every world object is
named where it is added, so a failure names the offender. Two traps worth remembering:
`Box3.setFromObject` expands a **Sprite** by its scale on every axis (a name label once gave
a food cart a 4000-unit footprint), so measure solid `Mesh` geometry only; and the audit uses
a **whitelist** of building prefixes, so new scenery cannot opt itself in and new buildings
cannot opt themselves out.

---

# Shipped (for context)

**Outskirts content (V5.0).** Kettle Flats Airfield (the `stolen_shipment` Black Market
continuation), Ridgewood Stand Lodge (the `turf_war` truce negotiation), Boundary Meadows
Drive-In, the Kestrel Woods Fire Road six-gate time trial with a car stripe, Sunset Shore Motel
(gated above investigation 20; lets a federal case decay), and Mudster Kestrel Trailhead, whose
off-road vehicles keep full speed in the woods where other cars drop to 52%. Farmstead,
woodland, suburb and works scenery in each belt, and three sparse rural vehicles. The
governing rule: a drive out must buy a rare experience, never a routine errand.

**Places look like what they are.** `map/archetypes.ts` assigns every place a shape by hand
(`cart`, `alley`, `lot`, `tenement`, `storefront`, `showroom`, `office`, `tower`, `civic`,
`works`, `bay`); collision comes from the same archetype; `archetypes.test.ts` fails if a place
has none.

**New places.** The enclosed lake and three northern belts, three named outskirt districts
with a Districts layer on the City Map, the Gilded Kettle casino (blackjack, roulette,
five-card draw, slots; RTP unit-tested), the respray bay, and the drive-in garage.

**Missions, onboarding and in-person politics (V5.0).** Five map-first chains, comic side
missions, connected follow-ups as delayed phone messages, Contacts (Dockmaster Bell, Lana,
Amit, a sponsor lead), taxi dispatch, a before/after result ledger, and the
learn-as-you-go onboarding sequence (`core/onboarding.ts`). Politics and Gang moved off flat
tabs into City Hall, the Chop Shop and the Marigold Lounge, closing the device initiative.

**Post-expansion cleanup.** The world expansion (below) shipped green on every gate but
played badly: filler built on stale road positions dropped buildings onto real streets,
two hard-coded shorelines authored against an old coastline cut stray stripes across the
land, collision bounds were fixed constants divorced from the drawn silhouette, and
`createFittedModel` multiplied a building's added detail by its own fit scale, throwing
markers thousands of units into the sky. All root-caused and fixed, guarded by
`scene-audit.e2e.ts` (see "Conventions worth keeping in view") and `assets.test.ts`. Also
closed: NPCs pacing into walls, the train/garage/bridge-waypoint bugs, static water and
lighting, the white-Kenney-building tint bug, and the Travel Nodes strip removal. Full
detail lives in git history if ever needed again.

**Diegetic device initiative, Phases 1-4.** Phone ("Windhaven OS" on a Pomello handset)
hosting the online-only services; multi-bank model (`config/banks.ts`) with per-bank
balances, interest and heist profiles; in-person banking and per-bank heists; all nine
brands as walk-in shops with their own stock, haggling at the cash-only lots, and
territory-gated pricing. The generic Auto Exchange and Whitfield Realty are gone.

**Brand caveats as real mechanics** (`map/brandEffects.ts`): used cars break down, bikes
add heat and halve heist cover, rough-block properties get raided, commercial fronts
launder, waterfront appreciates.

**Block-level territory** (`config/blocks.ts` + `map/territory.ts` + `config/rivals.ts`):
eight named blocks per district, ownership derived from district control via an authored
resistance order, with a toggleable overlay on both the minimap and the City Map.

**Missions**: mission-backed event flow, save state (`activeMissions`, `eventHistory`,
`worldMemory`), phone Missions app, and Lana Vance's Herald interview end to end.

**Heat redesign**: WANTED ladder + sticky INVESTIGATION meter → hybrid raid; crackdown
waves, Lay Low, Retain Counsel, concave cooldown.

**Other**: Windhaven Wire news feed; stock market with designed logos; territory war depth
(guns, mid-war payoff, casualties, police fallout); GTA-style City Map overlay with legend,
search and click-to-waypoint; extortion squeeze tiers + owner resentment; amenity minigames.

**World expansion (complete).** Districts 40% wider via a tested coordinate transform;
distinct coastlines per district (Devlin peninsula, compact West Side, Hub headland);
an outskirts ring of farmland, forest, suburb and industrial edge; a lot allocator
(`map/lots.ts`) that replaced hand-authored placement and fixed buildings overlapping and
standing in streets; neighbourhood character (`map/neighbourhoods.ts`) driving height,
vacancy, density and palette; per-character facade detailing; branded shop silhouettes;
the player garage in Devlin with a 3-minute street-parking return; and owned real estate
placed and findable on the map. See `docs/world-expansion-plan.md`.

**Recent bug fixes**: waypoint trail now follows you (was computed once at set time); shop
nametags no longer clipped (fixed-size font overflowed the sign canvas past ~31 chars);
district labels moved into the water and out of the landmass clip; buying a car in person
now equips it; cars no longer get permanently stuck on buildings (actor radius jumps 8 → 24
when you get in, so a legal on-foot spot could be inside a building's bounds with no escape
path); bikes render as bikes; The Potato added as a Hub landmark.
