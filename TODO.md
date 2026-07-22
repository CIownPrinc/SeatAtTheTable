# SeatAtTheTable — Roadmap / TODO

The single answer to **"what's next?"**. Design detail for the two big systems lives in
`SeatAtTheTable/docs/` — this file says what to do and points there for how.

| Doc | Covers | Status |
| --- | --- | --- |
| [`docs/world-expansion-plan.md`](SeatAtTheTable/docs/world-expansion-plan.md) | Bigger districts, outskirts ring, lot allocator, zoning, garage | **Active, not started** |
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

## 1. World rebuild — see [`world-expansion-plan.md`](SeatAtTheTable/docs/world-expansion-plan.md)

The biggest job, and most placement work depends on it. In dependency order: grow the
districts + add the outskirts ring → replace `namedBuildingLots` with a real lot allocator
(the root cause of overlapping buildings and buildings in streets) → neighbourhood zoning
character → filler variety → restore distinct shop silhouettes → garage → owned property
visible on the map.

**Blocking question for the player:** are the outskirts drivable and populated, or scenery?

## 2. Onboarding / just-in-time tutorial

Replace the advisor briefing, which the player finds "clunky and primitive". Wants
progressive, contextual, mission-based teaching rather than a static priority list.
**Design questions still open — ask before building.** Likely overlaps the mission system,
so read `mission-overhaul-plan.md` first.

## 3. Finish the mission chains

`home_safe_robbery`, `stolen_shipment`, `alderman_fixer`, `turf_war`, `first_heist` have
initial playable implementations only. Lana Vance's Herald interview is the one fully
realised map → interior → dialogue mission and is the model to follow.

## 4. Initiative Phase 5 — retire the last redundant tabs

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

**Recent bug fixes**: waypoint trail now follows you (was computed once at set time); shop
nametags no longer clipped (fixed-size font overflowed the sign canvas past ~31 chars);
district labels moved into the water and out of the landmass clip; buying a car in person
now equips it; cars no longer get permanently stuck on buildings (actor radius jumps 8 → 24
when you get in, so a legal on-foot spot could be inside a building's bounds with no escape
path); bikes render as bikes; The Potato added as a Hub landmark.
