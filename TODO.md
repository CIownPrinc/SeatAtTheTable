# SeatAtTheTable — Roadmap / TODO

The single answer to **"what's next?"**. Design detail for the two big systems lives in
`SeatAtTheTable/docs/` — this file says what to do and points there for how.

| Doc | Covers | Status |
| --- | --- | --- |
| [`docs/world-expansion-plan.md`](SeatAtTheTable/docs/world-expansion-plan.md) | Bigger districts, outskirts, lot allocator, zoning, garage, real estate | **Complete** — outskirts pass 2 open |
| [`docs/mission-overhaul-plan.md`](SeatAtTheTable/docs/mission-overhaul-plan.md) | Mission state, event history, world memory, entry points | Active, partly built |
| [`docs/map-asset-usage-audit.md`](SeatAtTheTable/docs/map-asset-usage-audit.md) | Which CC0 assets are used vs. reserved | Reference |
| [`docs/map-overhaul-plan.md`](SeatAtTheTable/docs/map-overhaul-plan.md) | The map architecture as originally built | **Superseded** — history only |
| [`docs/map-screenshot-review.md`](SeatAtTheTable/docs/map-screenshot-review.md) | What the visual review + timing profile check | Dated record |

Engineering rules (types, TDD, comment policy, quality gates) live in **`AGENTS.md`** and
are not repeated here.

Verify with (this is also the pre-push hook):
`pnpm lint && pnpm typecheck && pnpm -w run test && pnpm --dir SeatAtTheTable build`
Plus `pnpm --dir SeatAtTheTable e2e` for anything touching the map, phone or shops.

## Branch workflow (important)
Do all work on `main`, or a short-lived feature branch that is merged and **deleted
immediately** — never keep committing to an already-merged branch. Always
`git pull --rebase origin main` before starting and before pushing. Point **every**
agent (Codex + Claude Code) at the **same** branch. The old two-branch setup
(`main` + `fix/map-playability`, Codex PRs landing on one and Claude on the other)
caused duplicate-feature merges (e.g. the "two heat bars" HUD bug).

---

# ACTIVE — in priority order

## 0. Post-expansion cleanup — REPORTED IN PLAY, MOSTLY OUTSTANDING

The world expansion shipped green on every gate but plays badly. Several are regressions it
introduced. **Fix these before building anything new.**

**Fixed so far:**
- Filler used un-widened road positions (`[270,700,1130]`) while the real roads moved to
  `378/980/1582`, so it carved blocks around streets that no longer exist and dropped
  buildings on the real ones. Root cause of "buildings on the road".
- Two hard-coded shoreline polylines authored against the ORIGINAL coast ran straight across
  the middle of the land as stray stripes. Root cause of "random lines everywhere". Now
  derived from the real coastline.
- Collision bounds were fixed constants (35x31) divorced from the drawn silhouette: you
  clipped into wide dealerships and hit an invisible wall ~30 units short of small ones.
  Now derived from the silhouette. Root cause of "invisible barriers around buildings".
- Interactable buildings enlarged — they read smaller than the scenery around them.
- Minimap train was ~6x30px on a 150px minimap. Now scales properly.
- Movement no longer continues underneath the open City Map.
- **Random floating blocks / floating buildings.** `createFittedModel` applied its fit to the
  group it RETURNED, so asset-backed buildings came back scaled to e.g. `(30, 41.6, 22)`.
  Every caller adds detail to that group in world units — awnings, cornices, fire escapes,
  category markers, signs — and all of it was multiplied, putting a food cart's marker two
  thousand units into the sky. The same function wrote its recentring offset to
  `group.position`, which callers then overwrote with `position.set(x, h/2, y)`, so
  asset-backed buildings sat off-centre too. Fit now lives on an inner child; the wrapper
  behaves exactly like the procedural fallback. Guarded by `assets.test.ts`.
- Street corners were three loose meshes (pole, orb, dealer), so the orb measured as a block
  at y=21 with nothing beneath it. Landmarks were loose meshes too, so a dome floated above
  its own base. Both are single named groups now.
- The Potato's plaza (100 deep) sat at y=560 and reached into Roosevelt Road. Moved to y=500.
- **NPCs pacing into walls.** Roam targets were accepted on the DESTINATION alone, but
  pedestrians walk in a straight line, so a target behind a building sent the actor into the
  wall, where it was blocked, retreated home, and repeated. Candidate targets are now sampled
  along the path. Spawns are also settled against the world's solids (preventative — the
  audit proves nothing is stuck at spawn today; verified by disabling the fix).

**The detector.** `e2e/scene-audit.e2e.ts` walks the live three.js scene through the dev-only
`window.__seat` hook and measures with three's own `Box3`. It asserts no building stands in a
road, nothing floats, nothing is buried, and no pedestrian stands inside a building. Every
world object is named where it is added, so a failure names the offender. Two traps worth
remembering: `Box3.setFromObject` expands a **Sprite** by its scale on every axis (a name
label gave one food cart a 4000-unit footprint), so measure solid `Mesh` geometry only; and
the audit uses a **whitelist** of building prefixes, so new scenery cannot opt itself in and
new buildings cannot opt themselves out.

**Also fixed:**
- Walking through the train. The level crossing was only checked while driving.
- Entering the garage equipping a car. The parked car was tested for interaction FIRST and
  won every tie, and your car parks at your own garage by design — so pressing interact at
  the door got you into the car. Doors win a contested press now, and the car parks in a bay
  beside the door rather than dead centre on it.
- No waypoint directions on bridges. Every route dot was pinned to y=0.15; a bridge deck sits
  at y=2 and is 4 thick, so the whole trail rendered *inside* the deck. Dots ride the surface
  they are on.
- Waypoint gold matching the road lane markings — the trail is cyan now.
- Stray blocks in the water. `no solid scenery stands in the water` in the scene audit asks
  the game's OWN water rule about every solid object. Nothing is exempt by default; the
  things allowed over water say so in their name.
- Cars were a stack of boxes. The body is one extruded, bevelled side profile now — same
  approach that fixed the bike.
- The motorcycle headlamp was an emissive sphere that threw no light. Real SpotLight,
  parented to the player, comes up through dusk.

**Still outstanding (reported, not yet fixed):**
- Too many untextured white buildings — the Kenney GLB set is plain. Find or build a better
  building collection.
- Interior "read the room" hotspots mostly just restate your wanted level, which the HUD
  already shows. Make them do something.
- Remove the travel-nodes strip above the map.
- River and ocean still read static (the miscolouring and stray blocks are fixed; the
  ANIMATION is still weak).

## 0a. Places must look like what they are — DONE

Everything on the map is currently a **box with a sign on it**, sized by a silhouette table
and coloured by neighbourhood. That is why the world reads as noise: the map says one thing
and draws another. Fixing the geometry does not fix this — a back alley rendered as a
building is the map lying to you.

The fix is an **archetype** per place, chosen by what the place IS, not by which config
array it happens to live in:

| Archetype | Should look like | Examples |
| --- | --- | --- |
| `cart` | A stall: canopy, counter, crates. No building shell. | Kailash's Cart |
| `alley` | A gap between two blocks — walls, bins, a fire escape. **No building.** | Devlin Back Alley |
| `lot` | Open ground, fencing, a hut | Railyard, Dockmaster |
| `tenement` | Low, worn, boarded windows, fire escapes | Concrete Dreams stock |
| `storefront` | Ground-floor shop, awning, signage band | Local businesses |
| `showroom` | Wide glass frontage | Dealerships |
| `office` | Mid-rise, clean, cornice | Brokerages, Horizon |
| `tower` | Tall, glass, roof plant | Lakeshore, Hub corporate |
| `civic` | Columns, steps, dome | City Hall, banks |
| `works` | Shed, vents, water tank | Ironpoint, chop shop |

Two rules this must enforce, both currently violated:

1. **A property's archetype comes from its brand's character.** A Concrete Dreams walk-up
   must be a run-down tenement standing on rough blocks — not the same clean box as a
   Horizon apartment. The `rough` neighbourhood character and the `cheap` brand category
   already encode this; the renderer just ignores them.
2. **Not everything is a building.** `cart`, `alley` and `lot` must render as their thing
   with NO building shell, and their collision must match — you should be able to walk INTO
   an alley, not bump into a box where one should be.

`map/neighbourhoods.ts` already has the per-character detailing (boarded windows, fire
escapes, cornices, awnings) — this is about picking the right shell to hang it on, and
about the places that should not be buildings at all.

**Shipped.** `map/archetypes.ts` is the single source of truth. Every venture, local
business, service building and property is assigned an archetype BY HAND with the reasoning
in a comment beside it — never derived from a config bucket, because that is what produced
the bug: twelve service buildings shared one `missionOffice` kind, so the Back Alley, the
Railyard, the Bus Station, the Herald newsroom, the Dockmaster's yard and the Marigold
Lounge were all drawn as the same box.

- `archetypes.test.ts` fails if any place in any config lacks an archetype, so a new place
  cannot quietly inherit a wrong shape.
- `map/placeShells.ts` draws the three archetypes that are NOT buildings: `cart` (counter,
  canopy, crates), `alley` (flanking walls at the extreme edges, fire escapes, bins down one
  side, centre left clear) and `lot` (chain-link fence with a gate gap, site hut, containers).
- **Collision comes from the archetype**, in one place, so what a place blocks is what it
  draws. `solidScale: 0` on cart/alley/lot means you walk in. A scene-audit e2e walks the
  live world at each open place to prove it — bounds maintained separately from the drawn
  silhouette are what produced the invisible barriers in the first place.
- Rule 1 holds: property archetype comes from the brand's category, so a Concrete Dreams
  walk-up is a `tenement` and a Horizon one is a `tower`.

## 0b. New requests — ALL DONE EXCEPT OUTSKIRTS CONTENT

- ~~**Extend NORTH**~~ — DONE. The north question is settled: the "lake" was open to the
  ocean, which makes it a bay, so it is now genuinely enclosed with land wrapped over the top
  of it. That bought three northern belts (Sunset Shore, Kestrel Woods, Harrow End) and a
  beach resort on the south shore. See `lake.test.ts`.
- ~~**New districts + district overlay toggle**~~ — DONE. Three outskirt districts (Kestrel
  Reach, Kettle Reach, Lakeridge County) grouping the eight terrain belts, plus a Districts
  layer on the City Map beside Territory. See `regions.ts` / `regions.test.ts`.
- ~~**Casino**~~ — DONE. The Gilded Kettle: blackjack, roulette, five-card draw, slots. Rules
  are pure and unit-tested, including an exhaustive RTP sweep. See `casino.ts`.
- ~~**Vehicle customisation shop**~~ — DONE. Respray bay.
- ~~**Drive-in garage**~~ — DONE. The `bay` archetype: three walls and an open mouth, so you
  line the car up and drive in. See `driveIn.ts`.
- **Outskirts pass 2** — THE ONE THING LEFT. Planned below.

## 0c. Outskirts content — planned, not started

Three outskirt districts now exist, are named, and have exactly one thing to stop at between
them. This is the pass that gives you a reason to drive out.

### The rule this pass is built on

**Every outskirt place must offer something the city physically cannot.** That is the whole
test. If a place would work just as well on a Devlin corner, it belongs on a Devlin corner —
the city is where the empire is, and a second, worse city in the fields is the failure mode
here. What the outskirts have that the city does not is *distance from the police*, *space*,
and *nobody watching*. Every place below is one of those three.

Corollary: **the drive must be paid for.** A three-minute drive to a shop that saves you 5%
is a chore. Each place either trades on heat (which nothing in the city can touch) or is
somewhere a mission sends you.

### The places

Ranked by value-for-effort. Each names the belt it sits in and what it is *for*.

**1. Sunset Shore Motel** — `northshore`, Kestrel Reach. *Cheap.*
Lie low properly. The `lieLowButtons()` mechanic already exists in interiors and sheds up to
30 heat for 45 seconds of clock. The motel is the same lever with the numbers turned up: pay
cash, shed heat several times faster, and — the part nothing in the city offers — let a
building **federal case** decay as well, not just heat. Nobody out here asks for a name.
This is the strongest single reason to own a car and drive north.

**2. Cicero Outworks Scrapyard** — `eastworks`, Lakeridge County. *Cheap.*
The natural other half of the respray shop. Respray a car to keep it; **scrap** it to make it
never have existed. Sell any car you own for cash, no paperwork, and clear whatever heat is
attached to it. `lot` archetype — it is open ground with a crusher, not a building.

**3. Harrow End Grain Co-op** — `northfarms`, Kestrel Reach. *Cheap.*
A buyer who pays cash and files nothing. Move product at a **worse rate than the city but
with zero heat**. Laundering as a place rather than a menu. Pairs with the banks: the co-op
is how dirty cash gets clean slowly, the banks are how clean cash earns.

**4. Boundary Meadows Drive-In** — `southfields`, Kettle Reach. *Cheap, high charm.*
A drive-in cinema. Park the car, sit through a picture: the clock runs fast, heat cools at
the ordinary rate, and your crew gains a little respect for being taken somewhere. Mostly
this is texture — but it is also the obvious place to stage a conversation, and it uses the
drive-in bay geometry that already shipped with the garage.

**5. Kestrel Woods Fire Road** — `northwoods`, Kestrel Reach. *Medium — needs a minigame.*
Unpoliced road. Driving offences cost **no heat** here, which makes it the one place in the
world you can drive flat out. Wants a time trial to give it a score to beat; without one it
is just a nice road. Defer the minigame if the budget is tight — the no-heat rule alone is
worth shipping.

**6. Ridgewood Stand Lodge** — `ridgewood`, Kettle Reach. *Medium — mission-shaped.*
Neutral ground. Where the crews meet when nobody wants a meeting in the city. This is a
**turf-war and politics** venue, so it should land *after* the mission chains (§2), not
before — building it now would collide with Codex on the same trunk, which is exactly the
setup that produced this repo's duplicate-feature merges.

**7. Kettle Flats Airfield** — `westfarms`, Kettle Reach. *Medium — mission-shaped.*
A crop-duster strip where shipments arrive without troubling the docks. Hook for
`stolen_shipment`. Same sequencing caveat as the Lodge.

**8. Lakeridge Country Club** — `lakeridge`, Lakeridge County. *Defer.*
Where cash becomes standing. Genuinely good, but it overlaps the Politics tab, which §3 is
already planning to move in-person. Build it as part of that, not separately.

### Ambient life (do this alongside, it is cheap)

The belts read as empty even where there is something to stop at, because nothing moves out
there. Roaming actors already exist and take a district. Add sparse, kind-appropriate life:
a tractor working `northfarms`, walkers on `northshore`, deer in `northwoods`, a freight
truck on the `eastworks` road. Low counts — the point is that the countryside is not a
painting, not that it is busy.

### Constraints to respect (learned the hard way)

- **Placement follows the casino's pattern, not the allocator's.** `OUTSKIRT_PLACE_LOTS` in
  `world.ts` holds hand-placed lots; the lot allocator only knows about district blocks and
  will silently overwrite an authored position. Anything with an entry there must be
  *excluded* from `allocateServiceLots` (see the filter already there).
- **Every new place needs an archetype**, and `archetypes.test.ts` fails if it does not. Pick
  honestly: the scrapyard and the airfield are `lot` (open ground, walk straight in), the
  motel and the co-op are buildings, the drive-in wants `bay`-like treatment.
- **The layout tests assert district membership**, which outskirt places do not have. They
  are asserted with `isPointOnPlayableLand` instead — four specs already do this for the
  casino; follow them.
- **The scene audit is not optional.** Anything new must pass: off the roads, on the land, not
  floating, not buried, not in the water. It has caught my own additions three times.
- **Look at it.** `e2e/shot-garage.e2e.ts` is the pattern: teleport the player, force noon,
  screenshot. Every visual mistake this project has had — the sea-urchin palms, the alley that
  was not between anything, the roofed-over garage — passed its tests and failed on sight.

### Open question for the player

Is the drive itself the point, or a tax? Every place above assumes you *want* the drive and
just need a destination. If the drive out is tedious rather than pleasant, the honest fix is
fast travel to district edges — but that is the Travel Nodes strip we deliberately deleted,
so it needs a decision rather than a quiet reversal.

## 1. Onboarding / just-in-time tutorial

Replace the advisor briefing, which the player finds "clunky and primitive". Wants
progressive, contextual, mission-based teaching rather than a static priority list.
**Design questions still open — ask before building.**

**Sequencing note:** this is mission-shaped, and Codex owns the mission system. Building it
now would collide on the same trunk — the setup that caused the duplicate-feature merges
this repo has already been bitten by. Do it *after* the mission chains land, so it builds
on them rather than beside them. Read `mission-overhaul-plan.md` first.

## 2. Finish the mission chains

`home_safe_robbery`, `stolen_shipment`, `alderman_fixer`, `turf_war`, `first_heist` have
initial playable implementations only. Lana Vance's Herald interview is the one fully
realised map → interior → dialogue mission and is the model to follow.

## 3. Initiative Phase 5 — retire the last redundant tabs

Politics and Gang move off flat tabs and become in-person (city hall, gang spots), closing
the diegetic-device initiative. Phases 1-4 are done — see "Shipped" below.

---

# Open backlog (smaller, unblocked)

### De-bloat & polish
`src/core/header.ts` is a ~5,000-line monolith. Player's stated goal: "make the game run
smoother, gameplay better, and more visually pleasing."
- Confirm the `renderAll()` (full rebuild) vs cheap `refreshHUD()` split is respected
  everywhere — hot paths must not call `renderAll()` when only HUD numbers changed.
- Visual polish pass across panels and the 3D map.
- Sweep for remaining merge leftovers / duplicate code.

### Building interiors
Per-type decor (`src/map/interiorScene.ts`) and per-type "read the room" hotspots are done.
- **Optional:** deepen into recurring events (the block board rotating real requests), and
  give the heist room more than the single vault hotspot.

### Map engine
**Asset rule:** when a library or asset pack is added, future map work should actively use
it. Don't add assets or helpers that don't feed scene building, collision, minimap, zoning,
lighting, weather, or user-facing behaviour.
- Continue extracting `buildCityScene` from `header.ts` into typed map modules.
- Use the GLB loader for more city props (street furniture, parking, docks, residential
  detail) once exact CC0 sources are chosen.
- Expand roaming with lane-aware traffic rules and better pedestrian destination tables.
- Make road curves collision/minimap/path-aware beyond the current data-backed diagonals.
- Move reserved asset metadata into visible work: building-detail GLBs → facade dressing,
  roof clutter, station variants; car-kit GLBs → delivery routes, police patrols,
  roadblocks, taxis, crew transport; character GLBs → pedestrian and named-NPC variants.
- A full non-grid road rewrite is deliberately **not** pursued — it would strand the ~40
  hand-placed anchors. Revisit only as part of the world rebuild.

### Amenities
Basketball, park chess, pet store and newsstand are done.
- **Optional:** more amenity variety; tie rewards into reputation beyond flat respect
  (e.g. the guard dog actually lowering heat).

### QA
- **Runtime-verify the venture / crew / exploit interaction modals in-browser.** The
  fullscreen + modal z-index root causes were fixed and the logic reads correct by
  inspection, but the reported symptom was never confirmed clicked in a live session.

### Broader architecture (forward-looking, lower priority than gameplay)
- **`apps/web/` is still `create-next-app` boilerplate** — intended home for Next.js 16 +
  React 19 + shadcn + TanStack Query + Prisma. Deferred behind "harden the Vite game first."
- **Prisma version mismatch:** root uses v5, `apps/web` uses v7. `prisma/schema.prisma` is
  still a placeholder `Post` model on sqlite.
- `services/` is empty; no Python/ML yet.
- Strict typing on `SeatAtTheTable` is effectively complete — `tsc --noEmit` passes clean
  and is in the push gate.

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

---

# Shipped (for context)

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
