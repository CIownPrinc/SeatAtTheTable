# SeatAtTheTable — Roadmap / TODO

Working notes for the game. Single trunk: **`main`** (see below). Verify with
`pnpm lint && pnpm typecheck && pnpm -w run test && pnpm --dir SeatAtTheTable build`
(this is also the pre-push hook). Comments must be prefixed `// LEGAL:` / `// TODO:` / `// COMPLIANCE:`.

## Branch workflow (important)
Do all work on `main`, or a short-lived feature branch that is merged and **deleted immediately** — never keep committing to an already-merged branch. Always `git pull --rebase origin main` before starting and before pushing. Point **every** agent (Codex + Claude Code) at the **same** branch. The old two-branch setup (`main` + `fix/map-playability`, with Codex PRs landing on one and Claude on the other) caused duplicate-feature merges (e.g. the "two heat bars" HUD bug). `fix/map-playability` and `refactor/config-split-and-types` are merged and deleted.

## Remaining tasks

### 1. De-bloat & polish (perf + redundancy + visuals)
`src/core/header.ts` is a ~3,900-line monolith. Audit for:
- Dead/duplicate code and redundant work (the main<-branch merge already left some, e.g. two heat HUDs — now reconciled). Sweep for other merge leftovers.
- Performance: the 250ms game tick and the `requestAnimationFrame` map loop (`mapHub`) rebuild/redraw a lot. `updateHeatHud()` rebuilds the heat-breakdown innerHTML every tick even when the `<details>` is collapsed — gate it on open. Check `renderAll()` vs the cheap `refreshHUD()` split is respected everywhere.
- Visual polish pass across panels and the 3D map.
- Goal the user stated: "make the game run smoother, gameplay better, and more visually pleasing."

### 2. Upgrade building interiors
The interior "room" scenes are the 2D canvas in `header.ts` (`drawInteriorScene` / `hotspotsFor` / `InteriorState`). Improve the visuals/detail and add richer interactions inside buildings (right now interiors are sparse). Consider per-building-type interiors (restaurant vs bank vs home).

### 3. Amenity minigames + non-exploit interactions
`MapAmenity` kinds exist but are thin: `basketball`, `petstore`, `shop`, `parkgame` (see `src/config/types.ts` `MapAmenityKind`, and amenity objects in the map). Design & implement actual minigames/interactions for them (e.g. basketball court free-throw, park game), plus meaningful interactions for **businesses that aren't meant to be exploited** (a non-extort interaction — buy something, gather info, build rep). Amenity interaction entry point is `nearestMarker()` / the interact (E) handler in `header.ts`.

## Shipped this session (for context)
- Heat redesign: WANTED ladder (heat) + sticky INVESTIGATION meter drives a **hybrid** raid (footprint damage + small capped fine; legit + bank safe → removes late-game wealth cap). Crackdown waves, **Lay Low** toggle, **Retain Counsel** lever. Heat cooldown is now concave/quadratic (light rackets are visibly "Noticed"). HUD shows wanted tier + live %, a distinct **FED. CASE %** bar, and a **Details** breakdown (reimplemented on the new model from the Codex feature).
- Windhaven Wire: separate player-contextual city-news feed (Empire tab + log) with effectful broadcasts — distinct from the RCN stock ticker.
- Stock market: designed logos from `public/` now render (lettermark fallback for FWT/HLG).
- Territory & war depth: buy **guns** (armory), guns/cash required & consumed, mid-war pay-off decision, casualties (crew / inducted members / corner dealers), police fallout. Territory pushes cost cash + draw heat + bust risk.
- Map: two tasteful intra-district **diagonal roads** (on grid intersections, between fixed buildings, never crossing water); diagonals can no longer bridge canals. **GTA-style City Map** overlay (Map tab → "City Map"): categorized icon glyphs, side legend, district labels, click-to-set-waypoint.
- **Dealer arrival**: posting a dealer spawns an NPC that walks up to the corner; posted corners now show a standing dealer figure.
- **Exploitation rework**: extortion now has squeeze **tiers** (Protection → Heavy Cut → Total Control, scaling income + heat) and owner **resentment** (0-100) you manage via Ease off / Send muscle; unmanaged resentment ends it and spikes heat/case. No more random 40%-per-raid drop.
- Progression: global income +6%.
- Kept useful Codex features: **advisor panel** + **district-locations panel**.
