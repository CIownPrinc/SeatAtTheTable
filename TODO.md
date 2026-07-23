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

**Still outstanding (reported, not yet fixed):**
- Random floating blocks; some buildings appear to float.
- NPCs stuck inside buildings and standing in roads.
- You can walk through the train (only vehicles are blocked today).
- Waypoint route hints do not show across bridges.
- Waypoint/GPS gold is the same yellow as the road markings — shift the hue.
- River and ocean read static; some water is miscoloured and has stray blocks in it.
- Too many untextured white buildings — the Kenney GLB set is plain. Find or build a better
  building collection.
- Interior "read the room" hotspots mostly just restate your wanted level, which the HUD
  already shows. Make them do something.
- Remove the travel-nodes strip above the map.

## 0a. Places must look like what they are

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

## 0b. New requests, not started

- **Outskirts pass 2**: the ring is scenery. Add countryside/suburb/forest content and
  places to stop at. Also extend the outskirts NORTH — pass 1 only widened the sides and
  bottom, because the lake sits north. Needs a decision: move the lake out, or accept north
  stays water.
- **New districts** covering the outskirts (1-3 of them), plus a **district overlay toggle**
  alongside the existing territory overlay.
- **Casino in the outskirts** — poker, blackjack, roulette played with Arjun's cash.
- **Vehicle customisation shop** — respray/modify your car.
- **Drive-in garage**: somewhere you can actually drive in and park, rather than the car
  teleporting home.

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
