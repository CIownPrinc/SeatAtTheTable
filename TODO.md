# SeatAtTheTable — Roadmap / TODO

Single consolidated backlog for the game (this file replaces the old
`SeatAtTheTable/MAP_TODO.md`, now merged in below). Single trunk: **`main`**.

Verify with (this is also the pre-push hook):
`pnpm lint && pnpm typecheck && pnpm -w run test && pnpm --dir SeatAtTheTable build`

Comments in source must be prefixed `// LEGAL:` / `// TODO:` / `// COMPLIANCE:`.

## Branch workflow (important)
Do all work on `main`, or a short-lived feature branch that is merged and **deleted
immediately** — never keep committing to an already-merged branch. Always
`git pull --rebase origin main` before starting and before pushing. Point **every**
agent (Codex + Claude Code) at the **same** branch. The old two-branch setup
(`main` + `fix/map-playability`, Codex PRs landing on one and Claude on the other)
caused duplicate-feature merges (e.g. the "two heat bars" HUD bug).
`fix/map-playability` and `refactor/config-split-and-types` are merged and deleted.

---

## ACTIVE INITIATIVE — Diegetic device + in-person interactions + multi-bank

**Problem being solved:** interior hotspots currently just call `setTab('bank'/'assets'/
'politics')` — "interactions go straight to a tab." Reframe the whole game along a
real-world line: **online things happen on a phone you can open anywhere; physical things
require physically going there.**

### The phone (online, always available)
- A phone button in the HUD opens a full-screen "Windhaven OS" overlay (same pattern as
  the map / minigame overlays; freezes map input while open, like `minigameOpen()`).
- Apps: **Bank** (accounts across multiple banks — open/deposit/withdraw/transfer),
  **Stocks** (RCN exchange — *online only*), **AutoMart** (curated online catalog — a
  *subset* of cars/properties, delivered), **Empire** (business management — kept online
  so you don't have to drive to every venture to expand).
- Politics & Gang come *off* the flat tabs and become in-person (city hall, gang spots).
- Event wiring is delegated (`e.target.closest` on document listeners), so the existing
  `#bank-panel` / `#assets-*` render containers can be relocated into the overlay and
  keep working. `renderBankPanel` already switches on `state.financeView` ('vault' vs
  'market'), so Bank and Stocks split cleanly into two apps.

### In-person (go there) — similar but UNIQUE per business
No cookie-cutter modal. Each business type gets its own flavour of interaction:
- **Haggle** at some (pawn / market / corner) — the haggle minigame belongs *here*, where
  bargaining is natural, to earn a discount. (Removed from the generic amenity path.)
- **Territory-gated**: some refuse service or give worse prices in rival turf
  (`districtStatus(d)==='rival'`).
- **Unique inventories**: dealer-only cars at the garage, guns at the armory, pets at the
  pet store — each catalogue distinct.
- Cars: **store**, **detail/customize**, and buy **dealer-only** models at the garage
  (things AutoMart doesn't sell online).

### Multiple banks (hybrid online + in-person)
A roster of banks, each a distinct entity with tradeoffs. **No passive theft** — the
"risk" is purely about robbery:
- **Interest rate** + a **heist profile** (payout vs difficulty/heat when *you* rob it).
  Your deposits at a bank are exposed only if a *rival* heists that same bank.
- **Online + in-person:** open accounts, deposit, withdraw, transfer.
- **In-person only:** rob it (the heist), with per-bank payout/difficulty.
- `state.bank` (a single balance) becomes **per-bank balances**; saved games migrate the
  old balance into the safe default bank.
- Draft roster (tune later): First Windhaven (safe, low interest, hard/low-payout heist),
  Rentport City National (mid), an offshore bank (high interest, easy/high-payout heist —
  so parking cash there earns more but is a fat target for you *and* rivals).

### Phasing (each phase ships green: lint+typecheck+test+build)
1. **Device shell — DONE.** Phone button in the HUD opens a "Windhaven OS" overlay
   (`#device-overlay`) with a home screen + app grid. Bank & Stocks share the relocated
   `#bank-panel` (icons preset `state.financeView` vault/lcn-home); AutoMart hosts the
   relocated `#assets-*` containers. Finance & Assets removed from the tab bar; number-key
   tab list, advisor-jump router, and the interior teller/dealer/agent hotspots all
   redirected to the phone. Map input (movement + E) freezes while the phone is open;
   Escape / backdrop closes it. Verified by `e2e/phone.e2e.ts`. Empire stays the landing
   tab (not moved). *Bank app still single-balance — multi-bank is Phase 2.*
2. **Multi-bank model — DONE.** `config/banks.ts` roster (First Windhaven / Rentport City
   National / Lakeside Offshore) differing by interest rate + heist profile. `state.bank`
   → `state.bankAccounts` (per-bank) + `state.selectedBank`; interest accrues per account
   at each bank's rate; `bankedTotal()` is the raid-safe pile everything reads. Saved games
   migrate the old single balance into the default bank. Bank app lists banks (tap to
   select → deposit/withdraw that account); the heist card + stocks card are gone from the
   phone (robbing is in person; stocks have their own app). Also: the phone is now a
   **Pomello** handset (bezels, earpiece, home button that returns to the app grid).
   Verified by `e2e/phone.e2e.ts`. Per-bank *heist payout* wiring is Phase 3.
3. **In-person banking + per-bank heist — DONE.** The teller hotspot opens an in-person
   preset deposit/withdraw modal for that branch's bank (`openTellerBanking`, tied to a
   `ServiceBuilding.bankId`); the phone keeps precise typed control. The vault hotspot
   opens a "pick a target" board (`openHeistPlanning`) and `resolveHeist` scales reward by
   the chosen bank's `heistPayoutMult` and odds by its security. AutoMart also split into
   two phone apps (AutoMart = cars, Realty = properties). Fixed 4 latent `byId`-throws /
   null bugs surfaced by a new page-error guard in `e2e/phone.e2e.ts` (one was a Phase-2
   regression: `start-heist` throwing every tick).
4. **Themed buildings + per-business unique interactions** (next) — bank buildings for all
   three banks on the map; multiple **themed dealerships** (used/luxury/bikes) and
   **themed realty brokerages** (cheap-with-a-caveat / luxury) selling their own stock
   in person; each shared type united under a brand (names to come from the user). Plus
   haggle where it fits, territory-gated service, unique inventories.
5. Retire remaining redundant tabs (Politics/Gang → in-person) + polish.

---

## Game systems & polish

### 1. De-bloat & polish (perf + redundancy + visuals)
`src/core/header.ts` is a ~3,900-line monolith. Goal the user stated:
"make the game run smoother, gameplay better, and more visually pleasing."
- **Done:** heat-breakdown innerHTML now rebuilds only when the `<details>` is open;
  district-locations panel rebuild throttled to ~4×/sec (was every frame, and was
  swallowing clicks by recreating Waypoint buttons mid-frame); dead helpers removed
  (`heatGenPerSec`, `inDistrict`, `buildingSolids`).
- **Open:** confirm the `renderAll()` (full rebuild, `header.ts:2289`) vs cheap
  `refreshHUD()` (`header.ts:2378`) split is respected everywhere — hot paths must not
  call `renderAll()` when only HUD numbers changed.
- **Open:** visual polish pass across panels and the 3D map.
- **Open:** sweep for any remaining merge leftovers / duplicate code.

### 2. Building interiors
The interior "room" scenes are the 2D canvas in `header.ts` (`drawInteriorScene` /
`hotspotsFor` / `InteriorState`).
- **Done:** per-building-type interior decor extracted to `src/map/interiorScene.ts`
  (bank vs corner shop vs car dealership etc.), unit-tested, wired into `header.ts`.
- **Done:** richer per-type interactions — every entered building now has a second,
  in-world "read the room" hotspot (`hotspotsFor` in `header.ts`) surfacing real state
  (wanted/fed-case/turf, banked-cash, cars/properties owned) plus a rep-building
  "Sponsor the block party" action at local businesses. Shared `showRoomBrief`/
  `statusRows`/`briefRow` helpers.
- **Open (optional):** deepen these into recurring events (e.g. the block board rotating
  actual requests), and give the heist room more than the single vault hotspot.

### 3. Amenity minigames + non-exploit interactions — **DONE**
Only amenities that are actually games are games: `src/map/minigames.ts` implements the
**basketball free-throw** and **park chess** skill games, with pure, unit-tested scoring
(`src/map/minigames.test.ts`). Launched via `src/map/amenities.ts` →
`runAmenityMinigame` in `header.ts`, which applies the returned cash/respect reward; map
movement + E-interact freeze while an overlay is up. The **pet store** and **newsstand**
are plain buy modals (buy pets/supplies/guard dog; buy a paper/snack/lottery ticket) —
no bolted-on game where one doesn't fit.
- **Follow-up (optional):** more amenity variety; tie rewards into reputation systems
  beyond flat respect (e.g. the guard dog actually lowering heat).

---

## Map engine (from the former MAP_TODO.md)

**Asset & system rule:** when a new library, asset pack, or map system is added, future
map work should actively use it. Don't download assets or add helpers that don't feed
scene building, collision, minimap, zoning, lighting, weather, or user-facing behavior.

### Status
- **Done:** `three` installed via pnpm (no CDN/global `THREE: any`); map code modularized
  under `src/map/*` (roaming, minimap, amenities + amenity rendering, scene building,
  street furniture, world data, zoning, interior decor, minigames).
- **Done:** GLB buildings via the shared map asset library (Kenney CC0 packs mirrored
  under `public/assets/map`). Cars/NPCs still use procedural models by choice.
- **In progress:** extracting `buildCityScene` out of `header.ts` into typed modules.

### Next steps (open)
- Continue extracting `buildCityScene` from `header.ts`: next pass should move named
  business / service / corner rendering into typed map modules.
- Use the GLB loader for more city props (street furniture, parking, docks/logistics,
  residential details) once exact CC0 sources are chosen.
- Expand roaming with lane-aware traffic rules and more believable pedestrian
  destination tables.
- Make road curves collision/minimap/path-aware beyond the current data-backed diagonals.
- Evaluate the mirrored CC0 car & character assets role by role; keep procedural as the
  primary look, swap in external meshes only where they clearly look better.
- **Done:** visual-regression e2e checks now cover WebGL boot, water/land color
  distinction, fullscreen sizing, expanded minimap behavior, hover, search, and waypoint
  placement.
- Replace more handmade primitives only where a CC0 asset fits the Chicago-parody style.
- **Done:** road-graph route hints now follow connected streets, bridges, and diagonal
  shortcut endpoints. Full non-grid road rewrite is deliberately *not* pursued — it would strand the ~40 hand-placed
  anchors and re-introduce buildings-in-streets. Offer only if the user wants to leave
  the grid entirely.

---

## QA / correctness
- **Runtime-verify the venture / crew / exploit interaction modals in-browser.** The
  fullscreen + modal z-index root causes were fixed, and the modal logic reads correct
  by inspection, but the exact reported symptom was never confirmed clicked in a live
  session. Worth an explicit manual pass (or extending the Playwright smoke e2e).

---

## Broader architecture (forward-looking, not game-loop work)
These come from the repo reality vs. target-stack gap; lower priority than gameplay.
- **`apps/web/` is still `create-next-app` boilerplate.** It's the intended home for the
  modern stack (Next.js 16 + React 19 + shadcn + TanStack Query + Prisma) but nothing
  game-specific is built there yet. Migration was deliberately deferred behind
  "harden the Vite game first."
- **Prisma version mismatch:** root uses Prisma v5, `apps/web` uses v7 — reconcile before
  building anything real on the DB. `prisma/schema.prisma` is still a placeholder `Post`
  model on sqlite.
- `services/` is empty; no Python/ML yet (the UV/Ruff/ML rules in AGENTS.md are
  forward-looking, not describing existing code).
- Note: the strict-typing effort on `SeatAtTheTable` is effectively complete —
  `pnpm typecheck` (strict `tsc --noEmit`) passes clean and is in the push gate.

---

## Shipped recently (for context)
- Heat redesign: WANTED ladder (heat) + sticky INVESTIGATION meter → **hybrid** raid
  (footprint damage + small capped fine; legit + bank-safe removes late-game wealth cap).
  Crackdown waves, **Lay Low** toggle, **Retain Counsel** lever, concave heat cooldown.
- Windhaven Wire: player-contextual city-news feed, distinct from the RCN stock ticker.
- Stock market with designed logos (lettermark fallback for FWT/HLG).
- Territory & war depth: buy/consume guns (armory), mid-war payoff decision, casualties,
  police fallout; territory pushes cost cash + draw heat + bust risk.
- Map: two tasteful intra-district diagonal roads (never crossing water); GTA-style City
  Map overlay (Map tab → "City Map") with icon glyphs, legend, click-to-waypoint;
  dealer-posting spawns a walk-up NPC + standing dealer figure.
- Exploitation rework: extortion squeeze **tiers** + owner **resentment** (Ease off /
  Send muscle); no more random 40%-per-raid drop.
- Kept useful Codex features: advisor panel + district-locations panel.
