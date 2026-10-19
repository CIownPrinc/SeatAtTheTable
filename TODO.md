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
| [`docs/map-rebuild-plan.md`](SeatAtTheTable/docs/map-rebuild-plan.md) | The from-scratch map rebuild: why, principles, layout, phases, budget | Active |

That's the complete set. If a `.md` file isn't in this table, it's
`SeatAtTheTable/README.md` (game description, not a plan). Any new plan/audit doc must be
added here when created.

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

**Lanes.** Codex wrote most of the missions and onboarding (`core/missions.ts`,
`config/missions.ts`, `config/npcs.ts`, `core/onboarding.ts` and the mission code inside
`header.ts`) and knows them best. Since 2026-10-18 Claude Code may edit those files too,
but only for missions it understands; a mission it doesn't know stays with Codex. Claude Code
owns the map, phone, shops and everything else under `src/map/*` and `src/config/*`.

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
| ~~**Phone stuck open.**~~ The Aug 5 mission pass replaced the spec's Escape key press with a popup dismissal, so nothing ever closed the phone. Escape is back. | Claude | Fixed 2026-10-16 |
| ~~**Minimap clear button.**~~ The spec clicked a fixed 26%/44% of the City Map, which drifted into the lake as the world grew; water correctly refuses waypoints. It now projects a real place's coordinates. | Claude | Fixed 2026-10-16 |
| ~~**`shot-garage.e2e.ts` flake**~~ and most suite slowness. Headless Chromium rendered WebGL in software at ~2 fps; `playwright.config.ts` now asks for the GPU (55 fps). Suite: 42/46 in 9.8 min → 49/49 in 1.5 min, twice in a row. | Claude | Fixed 2026-10-16 |
| ~~**Automatic popups replaced open ones.**~~ Real game bug the phone spec caught: the $200 milestone opened over Dockmaster Bell's report and erased it. Milestones now queue while any popup is up and show when it closes; mission offers and follow-ups wait a tick instead of being used up. Guarded by a new `phone.e2e.ts` spec. | Claude | Fixed 2026-10-16 |
| ~~**Map screenshot spec flake (1 in 3 under the suite).**~~ The game saves on `beforeunload`, so the spec's own reload left a save, "Start New Game" appeared, and confirming it reloads the page; the map-tab click raced that reload. The spec now waits for it. 10/10 repeats. | Claude | Fixed 2026-10-16 |
| ~~**Real-world names.**~~ "O'Hare" and "Chicago" broke the parody-geography rule; now Windhaven International / Windhaven. | Claude | Fixed 2026-10-16 |
| ~~`raccoon_keycard` said heat -6 where it promised -5.~~ The mission removed exactly 5. The "Exact changes" ledger was wrong: it measured from accepting the mission to finishing it, so heat that cooled off and income earned while driving counted as rewards. Now it measures only the choices (`core/missionLedger.ts`, unit-tested). | Codex | Fixed 2026-10-16 |
| ~~`pigeon_summit` never resolves.~~ Two causes. The spec boots the full 3D city and took 38s of its 60s budget alone, so it timed out under contention (budget now 120s). And the result said "heat -4" even at zero heat. It now reports what was removed, rounded, because heat cools off in fractions (unrounded, it printed "heat -3.2495013163719824"). | Codex | Fixed 2026-10-16 |

## 2. Truthful results audit — DONE 2026-10-16

- **One central fix instead of ~40 string edits.** `reconcileResultText` (`core/missionLedger.ts`,
  unit-tested) rewrites every numeric clause of a mission result (`heat -6`, `$1,600 spent`,
  `50 product lost`, `crew +1`) to what the final choice really changed, and drops a clause
  that didn't happen. `finishMission` runs it before saving or showing the result, so any
  mission written later is covered too. Non-numeric clauses ("family loyalty +2", timed income
  effects) are left alone; those aren't ledger stats.
- **Paid choices need the money.** Every paid mission choice used `Math.max(0, cash - N)`, so
  with $40 you could "Contain it ($2,500)" and keep the full benefit. `ModalButton.cost` now
  disables the button (with a "You need $N" tooltip) when you can't pay; all 17 paid choices
  carry it, and each sits beside a free alternative so nobody gets stuck.
- Found along the way: `hireFreeCrew` pays a $400 fee instead of crew when no spot is open, and
  the cousin result still claimed "crew +1" — now corrected by the reconcile pass.
- Guarded by `missions.e2e.ts` "paid choices you cannot afford are disabled, and capped results
  report what really changed".
- **Not changed, on purpose:** button labels state the intended effect ("+16 heat"); the result
  states what happened. `log()` lines still carry the intended numbers.

## 3. Browser coverage for what exists — DONE 2026-10-17

- `e2e/mission-branches.e2e.ts`: a table of 65 branch rows and 10 decline routes covering
  every stage and ending of the five main chains, the follow-ups, the comic missions, all
  five Herald tones and the first heist's crew approach. Each row fails on any page error.
- `e2e/onboarding.e2e.ts` now walks the whole early-game sequence (cart, crew, lab, first
  corner) through the real UI.
- Bugs this coverage turned up, all fixed:
  - **Herald headlines.** The answer buttons passed `evasive`/`humorous`/`controversial`/
    `aggressive`, but the headline table only knew `guarded`/`warm`/`scandal`, so four of five
    answers printed the same "warning" headline. Answers now map to a press tone first.
  - **Hires that weren't.** `hireFreeCrew` pays a $400 fee when no spot is open; the results
    claimed a new recruit anyway.
  - **Dead-end choice.** The Rival Capo's "Bring leverage" ended the mission with nothing when
    clicked without leverage; it's now greyed out (`ModalButton.disabled`).
  - **Silent dealer button.** "Post a dealer ($N)" without the cash closed the popup and did
    nothing; it now uses the same `cost` gate as paid mission choices.
- Suite: 126 tests, green twice in a row (~3.5 min).

## 4. In-browser QA — Claude

- ~~**Venture / crew / exploit interaction modals.**~~ DONE 2026-10-17. `e2e/interior-sweep.e2e.ts`
  walks into all 50 enterable buildings (13 ventures, 29 services, 8 local businesses), presses
  every hotspot, then every button in every popup it opens, each from a fresh visit: 298 presses.
  It fails if a hotspot does nothing a player could see or if anything throws. Zero problems.
- **One full play-through** from a new game, logging every bug, dead end and confusing
  moment. That log becomes the polish list for §6. This one needs a human: it's about feel,
  and the automated suite can't judge whether something is confusing or dull.

## 5. Smoother — DONE 2026-10-17

Measured on the map with the GPU, idle and walking, 15 s windows:

| Change | Idle fps | Median frame |
| --- | --- | --- |
| Before | 39 | 24.5 ms |
| `pointInPolygon` caches each polygon's bounds and rejects points outside them (was 7% of CPU while standing still; equivalence-tested across the whole world) | — | — |
| Static scenery stops recomputing its matrices every frame (`map/staticScenery.ts`) | 44 | 22.0 ms |
| The beach resort (1,900 of 5,000 scene objects) merges into one mesh per material per palm/lounger set (`map/mergeScenery.ts`); per-group so the water audit still checks every palm | **56** | **17.4 ms** |

- `renderAll()` never fires during normal play (counted with a MutationObserver), so the
  `renderAll` vs `refreshHUD` split is already respected on hot paths.
- Tried and reverted: merging trees, outskirts, filler and landmarks too. No measurable gain.
- ~~Merge-leftovers / duplicate-code sweep.~~ DONE: `jscpd` (min 80 tokens) found 4 clones,
  0.31% of lines, none in `header.ts`. All four removed (`circleSamplePoints`, `rehomeActor`,
  `traceLandmass`); it now reports 0.
- What remains of frame time is three.js drawing ~2,500 meshes; going further means
  instancing, which is V2 territory.

## 6. Polish — from the play-through

Visual and feel fixes to existing panels and the 3D map. Driven by the §4 play-through log,
not invented up front. Polish means fixing what's there, not adding scenery.

## 7. De-bloat — DONE 2026-10-16

Removed the web-stack scaffolding V1 never used; its reasons now live in `SEATATTHETABLE2.md`
("Platform" and "Decide these before writing code"). Gone: `apps/web/` (empty
`create-next-app` template), `prisma/` and `.env.example` (placeholder `Post` model),
unused root deps (`@shadcn/ui`, TanStack Query, `framer-motion`, Prisma, Testing Library),
the dead `packages/eslint-config` and root `eslint-plugin-comment-policy/` copies (the live
rule is `packages/eslint-plugin-comment-policy`, saboteur-tested after the cleanup), and
`fix-comments.cjs`, which bulk-prefixed bad comments with `LEGAL:` and so defeated the rule
instead of enforcing it. Kept on purpose: the `.gitignore` secret rules, the Husky gate and
every test. Locally, `.tmp-assets/` (ignored Kenney zips) can be deleted by hand.

## 8. Dependency upkeep — DONE 2026-10-18

- All Dependabot PRs closed after the toolchain moved to Vite 7 + Vitest 4. `pnpm audit`:
  24 vulnerabilities → 0. The security headers (CSP, nosniff, referrer and permissions
  policy) live in `vercel.json`, and `vite preview` serves the same ones.
- One stale remote branch is left, `dependabot/npm_and_yarn/vitest-4.1.11`. Delete it by hand.

## 9. Audit, devices and screen shapes — DONE 2026-10-18

- **Bugs fixed:** the prestige loophole (bank balances and stocks survived a reset), saves
  written after "Start New Game", events firing instantly on load, the game ticking in a
  hidden tab, the $200 milestone firing early, and the Stocks app overflowing phone screens.
- **Map load:** 4.9 s → 0.28 s on desktop and 3.6 s → 0.53 s on a 4×-throttled phone. 54 lamp
  lights became a pool of 6, and the scene is preloaded on the title screen. On phones,
  15 → 39 fps: a frame-rate governor turns sun shadows off on slow devices.
- **Touch and layout:** a thumbstick and an interact button for the map. The layout fits
  360 px phones, landscape phones and 1920 px monitors, each guarded by `layout.e2e.ts`.
- **Assets:** logos are resized WebP (960 KB → 59 KB, about 110 MB less decoded memory).
- **Cleanup:** dead code and stray scripts removed, `noUnusedLocals` turned on.
- **Title screen:** the start screen became a night skyline with a neon sign.
- Suite: 286 unit tests and 143 e2e tests, green.

## 10. Map overhaul: every note from the 2026-10-18 play-through (ACTIVE)

Every request the player made while playing, word for word in intent, so none get lost.
Status: **DONE** shipped and verified · **PART** partly done (what's left is noted) · open.
V1 stays feature-frozen everywhere else; this list is the exception the player asked for.
Most of the open items will be built in the new map engine (section 11), not patched into the
old one.

**A. Broken things**
1. **DONE** Lines strobed (z-fighting between stacked road, sidewalk and paint layers). The camera
   near plane moved from 1 to 40.
2. **DONE** Bridge ends clipped: the canal walls ran through the decks.
3. **PART** Beach, coast and canal lines showed in the ocean. All hairlines are removed and the canal
   water and walls now stop at the canal's ends. Still open: shoreline foam done properly.
4. **DONE** Waves were broken (strips sliding over land); they're now drawn by the water shader.
5. **DONE** Shadows were broken (striped, and missing outside the world's middle).
6. **DONE** The GPS broke in the countryside: there were no roads there. Country lanes fix it.
7. **DONE** Roads end in the middle of the ocean (reported after the lane change). The world audit
   tests check every road for water (`worldAudit.world.test.ts`, `roadEnds.test.ts`); none do.
8. **DONE** A few buildings stood fully or partly in the streets. The lot allocators and filler
    now keep clear of the diagonal streets, and two landmarks moved off the road; the world audit
    finds none.
9. **DONE** Roads meant to curve were drawn as straight pieces. The diagonals are real curves,
    and every street is drawn as one continuous ribbon.
10. **DONE** Cars, trains and trees weren't solid. Traffic and the train are now moving obstacles
    (`map/obstacles.ts`), and street trees, countryside trees, barns and silos are solid. The train
    was also drawn at a different position from the one that blocked you; both now use one.
11. **DONE** A car breakdown gave no warning (it threw the player out). The map now shows a
    "broken down" message when it happens and when you try to get back in, and the car smokes.
12. **DONE** Streetlights faced the wrong way and stayed on in daytime. Each arm now reaches over
    its junction, and all bulbs share one material the day/night cycle dims to off by day.
13. **DONE** The beach stopped abruptly. It's now derived from the lake shore end to end.
14. **DONE** Roads lead nowhere. Short stubs are now T-junctions and real dead ends have a turning
    circle and sign; `roadEnds.test.ts` checks every dead end has one, on dry land.

**B. A checker that catches map mistakes**
15. **DONE** The world audit (`map/worldAudit.ts`, `map/sceneAudit.ts`) catches roads over water,
    buildings in any road, scenery in lanes, beach gaps and hairline strokes. Unit tests run it on
    the map data; dev builds run it on the drawn scene, log each problem and mark it with a red
    beacon; `e2e/scene-audit.e2e.ts` is a ratchet over it. Its first run found and fixed: 15
    trees, houses and a silo in the new lanes, both beach ends, and 27 stop-sign hairlines.
    Still flagged, and fixed by the new engine: six buildings in roads (items 8 and 9).

**C. Feel**
16. **DONE** The camera was primitive. It now follows smoothly, leads where you're heading and
    pulls back at speed.
17. **DONE** Arjun looked like Gru (bald, stiff, big nose). There's a new animated figure in the
    game's own style. The Kenney blocky characters were tried and dropped as too Roblox-like.
18. **DONE** Get splatted when a car hits you: you're knocked flat and squashed beside the road for
    about two seconds, then you get back up.
19. **DONE** Customise Arjun's clothes: a wardrobe in his flat above the garage, with a turning
    3D preview, arrows for each slot and colour swatches (`core/wardrobe.ts`).
20. **DONE** Cheat codes; type `cheatcode` for the list. `moneymoneymoney` / `cash4ever` (+$1B),
    `cleanrecord`, `respectme`, `daylight`, `nightowl`, `letitrain`, `letitsnow`, `clearskies`,
    `beammeup` (teleport), `rocketman` (fly with a jetpack, 2.6x speed), `getdachoppa`
    (helicopter), `bigdumper` (garbage truck), `liquidcourage` (drunk) and `bigheadmode`.
    Getting into any vehicle cancels rocketman.
21. **DONE** The floating 3D icons over places are gone; the minimap already shows them. Mission
    objectives and the waypoint beacon keep their markers.
22. **DONE** A simpler, easier-on-the-eyes, GTA-style minimap: one dark muted palette, light
    roads as the brightest thing, no outlines on every region, no dashed centre lines.
23. **DONE** Traffic looked random. Routes now come from the road graph (`map/traffic.ts`): real
    directions between junctions, driven in the right-hand lane with rounded corners, and the
    countryside vehicles stay on the lanes instead of crossing fields. Every city junction now has
    working traffic lights, and cars stop on red and keep their distance from the car in front
    (`map/trafficRules.ts`). The lights are out of step across the city, so it never all stops at once.
24. **DONE** Three police cruisers patrol the city on random loops between junctions.
25. **PART** Cars that look like what they are. 19 Blender models are in the game: beater,
    wagon, muscle car, SUV, armoured SUV, pickup, van, EV, EV luxury, EV van, supercar, roadster,
    police car, taxi, box truck, tractor, garbage truck and helicopter (`art/blender/vehicles.py`,
    `map/vehicleModels.ts`). Still open: the motorbikes, and spinning wheels.

**D. How the world looks**
26. Audit the whole map for primitive designs that could be better, not just the ground.
27. **PART** The map was very polygonal. The coast and lake shore are now smoothed in the map data
    itself (Chaikin, two passes), and a spliced-on needle of sea in the east coast is gone. Still
    open: curves elsewhere (roads come with the new road graph).
28. **PART** Countryside ground was flat polygons with hard-edged shades. The new map (beta) has one
    blended terrain painted from a zoning field (`world/render/terrain.ts`). Still open: making it
    the default once the rest of the new map catches up.
29. Zoning: make rich, poor, commercial, residential, countryside, farmland and forest areas
    clearly distinct, but grade them into each other gradually, like real life.
30. **PART** Dirt trails in the countryside. The country lanes are in. Still open: smaller trails
    off them.
31. **PART** Building models that look like what they are. Named places now use seven Blender
    models (`art/blender/buildings.py`, `map/buildingModels.ts`): tenement, storefront, showroom,
    office, tower, civic hall and works. Still open: filler buildings, houses, farms (new engine).
32. **PART** Remodel everything properly in Blender, step by step. Blender 5.2 is installed and
    scripted (`art/blender/`); the first model, a sedan, is exported. Next: the full catalog.

33. **DONE** Proportions were off between people, cars, buildings and street furniture. One
    scale in `map/scale.ts` (10.5 units per metre): people 22 units, building heights x1.9,
    lamps and signs x1.8, street trees x1.6; cars were already right.

41. **DONE** More police cars than normal ones. Now one patrol among 13 city vehicles of nine
    kinds (cabs, sedans, a beater, SUV, pickup, EV, van, truck), each sized to its type.
42. **DONE** A living city: 36 unnamed walkers loop round city blocks on the pavements, with
    no name signs. People are baked into six meshes each so a crowd stays cheap to draw.
43. **DONE** The territory toggle and the minimap were overwhelming. The minimap's toggle and its
    panel of small text are gone: the rim takes the colour of whoever holds the block you're on,
    and one line underneath names it. The City Map fills its window, its territory layer shows
    district names instead of a label on every block, and its legend folds away.

44. **DONE** Clearing a GPS waypoint wasn't obvious. A labelled "Clear GPS" button sits under the
    minimap whenever one is set, and clicking the waypoint again on the City Map clears it.
45. **DONE** Wardrobe: Arjun's skin is fixed brown (he's Indian; it's part of the story) and the
    skin option is gone. The top colour is named after what you wear (coat, jacket, hoodie, suit).
    Nine hairstyles with sideburns and fringes, six hats, shoes/sneakers/boots, more hair and shoe
    colours, real glasses and sunglasses, a heavier chain with a pendant, a watch and an earring.
    The mall now has the accessory shops: Crown & Brim (hats), Spectacle (eyewear), Gold Standard
    (chains, watches, earrings), Sole Society (shoes) and The Fade Room (haircuts). Each shop is a
    fitting room with prices; what you buy stays in your wardrobe at home (`config/mallShops.ts`).
46. **DONE** Minigames look primitive: make them 3D, or even first person. The court is now first
    person from the free-throw line: the timing bar sets the shot and the ball flies on its arc,
    through the net, in off the rim, rimmed out, short or off the backboard. Park chess is a 3D
    board on a stone table, with lathe-turned pieces (`map/minigameScenes.ts`). The street race
    (47) is the third.
47. **DONE** Street racing like GTA. At the Kestrel Woods trailhead you line up on a grid against
    three rival cars (muscle, supercar, roadster) for a 3-2-1-GO start, then race ten checkpoint
    rings west along the north-shore road with the GPS on the next gate. The HUD shows your place,
    checkpoint and time. Prizes go by place, and first in your own car earns the Fire Road stripe.
    No car? They lend you one and take it back. Getting out of the car forfeits the race.

48. **DONE** Pulling a dealer made them vanish; now they walk off the corner down the street.

**E. Interiors**
34. **PART** Interiors you walk around in like outside, in 3D. Today most rooms are a few small icons that
    open a text box or restate the obvious, and some buildings have secondary areas with nothing
    in them. Instead: a front desk looks like a front desk, and every hotspot is something real
    (a person to talk to, a bulletin board you can read, an office for an office), seen in first
    person or at least in 3D. "Nothing fancy, just an upgrade from a text box." The mall (36)
    takes this furthest.
    Done: every room is now 3D (`map/interiorLayout.ts`, `map/interiorRoom3d.ts`). A counter has a
    clerk behind it, boards have notices pinned up, the garage has a wardrobe, a safe and your car,
    the casino has slot machines and a card table with a dealer. Furniture blocks you, each hotspot
    has a ring you stand on and a name card, and the minimap hides indoors. Still open: first
    person, and rooms bigger than one hall (the mall).

**F. New places**
35. **DONE** A home of your own: Arjun's flat above the garage, with the wardrobe and a vault
    (`core/vault.ts`). Vault cash isn't in your pocket, so pay-offs that take a share can't
    touch it. A bigger home could come later with property.
36. **DONE** A big mall with a parking garage. Inside should feel like walking around outside: an indoor
    playground, stall owners trying to get you to try their perfume, ice cream vendors, a food
    court.
    Lakeridge Mall stands at the end of Wabash Avenue, with a paved plaza, a glass atrium and a
    three-deck parking garage (`map/mall.ts`). Inside (`map/mallInterior.ts`) are five shops, a
    fountain, a perfume seller who comes out to spray you, an ice cream cart, a food court, a play
    area with a slide and a ball pit, and shoppers and kids walking round.
37. A central park, with more greenery generally.
38. A suburbs area.
39. Construction sites.
40. Snow that collects on the ground and turns it white, and a plow that comes through.

## 11. New map engine (decided 2026-10-18)

Full plan: [`docs/map-rebuild-plan.md`](SeatAtTheTable/docs/map-rebuild-plan.md).

Rebuild the map from scratch in `SeatAtTheTable/src/world/`, beside the old one, instead of
patching the old map's foundations: authored coordinates stretched by `widenAuthoredX`, a street
grid clipped to district outlines, randomly scattered scenery, and a 3D scene inside the
7,000-line `header.ts`. A "New map (beta)" setting switches between them. Missions, economy,
places, the phone and saves stay as they are. When the new map matches the old one, the old map
is deleted. The new map stays in this game (Seat at the Table); it is not a SeatAtTheTable 2
piece.

Build order:
1. The world audit (item 15) comes first, so correctness is tested from the first line.
2. Ground: one terrain mesh, with zoning as a smooth field driving its colour and what's built.
3. A road graph with real curves, and building lots laid out along the roads.
4. Scenery placed from zoning that keeps clear of roads.
5. Models: Blender-made, instanced, with levels of detail.
6. The new places from section 10F, built on the new engine rather than the old one.

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
dockmaster's yard**, **West Side Holdings**, **Windhaven Cab Co.** (a depot yard).

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

### The game's name
The game is **Seat at the Table**, with no version number, the way a video game is just its
name. Sequels get a number or a subtitle ("Seat at the Table 2"). "V1" in these docs means
the first game, and the V1.0-V5.0 entries in `CHANGELOG.md` are internal build history, so
never show them to the player.

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
