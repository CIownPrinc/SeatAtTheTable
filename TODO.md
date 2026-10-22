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
| **`PLAYTEST-CHANGES.md`** (root) | Plain-English list of what changed since the 2026-10-18 play-through | Reference; refresh before the next play-through |
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

Last check, 2026-10-20: the gate (lint, typecheck, 460 unit tests, build) and the full e2e suite
(157 tests) passed twice in a row. What's left needs a person: the full play-through (section 4).

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
- The stale `dependabot/npm_and_yarn/vitest-4.1.11` branch is gone; `main` is the only remote branch (checked 2026-10-20).

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

**Order of work for the open items (set 2026-10-21, after "don't work hastily"):**
1. Bugs and crashes first (111, 116, then 119, 120, 121, 129, 143).
2. Then put right what was done hastily before: Central Park (112), the beaches (113), the railyard
   and placement and proportion everywhere (91, 95, 110), the alleys (68). Placement, proportions and
   the inside matching the outside are standing checks for every place, new or old (110).
3. Then the half-finished interior work (57-63), mission joining (117) and the camera (118), together
   with the batch that makes missions and rooms real: mission scenes (125, 122), interiors that differ
   and only interactive where useful (126, 127), the copy pass (128) and simpler heat with fines
   (123, 140). Missions come from phone calls, fewer and bigger, with real outcomes and numbers
   (141, 145, 146, 148). All of this is planned first as one mission overhaul (151), designed on
   paper before it's built, with mission cutscenes (157) and the phone redesign (156).
4. Then the tycoon and street side: a bike as the first asset (135), office perks (133), Dice and the
   smaller gangs (134, 124), drug sales (130), choices that matter (137), the new characters (138) and
   the funny side content (132), crew shown on ventures (139), your property on the map (142), the
   taxi ride (149), swimming (144) and Arjun's animations (150).
5. Then the rest: mobile tests (60), the test review (105), NPCs and traffic (64, 73-75, 96), the dealer
   upgrade (69), the wardrobe (59), the race (90), the phone and tycoon audit (102), the docs audit (67).
6. Last, the big map rebuild (80-87, 108-109), done in one planned pass, not piecemeal, with the
   neighbourhoods that unlock as you go (131) built into it, the new mission locations (153) and
   rough, natural edges everywhere (154).
Each item is checked in the running game before it's marked done.
V1 stays feature-frozen everywhere else; this list is the exception the player asked for.
Most of the open items will be built in the new map engine (section 11), not patched into the
old one.

**A. Broken things**
1. **DONE** Lines strobed (z-fighting between stacked road, sidewalk and paint layers). The camera
   near plane moved from 1 to 40.
2. **DONE** Bridge ends clipped: the canal walls ran through the decks.
3. **DONE** Beach, coast and canal lines showed in the ocean. All hairlines are removed and the canal
   water and walls now stop at the canal's ends. Surf now breaks along the coast and the lake shore:
   a strip with real width, pushed out over the water and fading at both edges, its brightness
   running along the shore with the waves (`buildShoreFoam`, `applyShoreFoam`).
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
25. **DONE** Cars that look like what they are. 19 Blender models are in the game: beater,
    wagon, muscle car, SUV, armoured SUV, pickup, van, EV, EV luxury, EV van, supercar, roadster,
    police car, taxi, box truck, tractor, garbage truck and helicopter (`art/blender/vehicles.py`,
    `map/vehicleModels.ts`). The motorbikes are Blender models too now: a chopper (raked forks, fat
    rear tyre, V-twin, ape-hangers) and a streetfighter (nose fairing, clip-ons, mirrors), with the
    real, dressed Arjun seated on them (`map/bikeRider.ts`). Wheels spin: each is a separate part
    with spokes, turned by the distance travelled on your own vehicle and the race rivals
    (`spinWheels`); traffic is merged back into one mesh per material, where nobody would notice.

**D. How the world looks**
26. **DONE** Audit the whole map for primitive designs that could be better, not just the ground.
    Done so far: countryside buildings, filler buildings, the newsstand (now a kiosk), the park
    chess tables (round stone tables with inlaid boards), the pet store (a shopfront with an
    awning), Devlin Hall (a civic hall under its dome), parking-lot cars (real models, parked in
    the bays), building sites, parks, the suburb, the plow, the bikes and their rider. The tour of
    every countryside place and yard found the rest, now each built as itself
    (`map/placeSpecials.ts`): the airfield (runway, barrel hangar, windsock, crop-duster), the docks
    (wharf, bollards, container stacks, gantry crane), the railyard (tracks, freight wagons, signal
    hut), the drive-in (big screen, parking rows, projection booth, snack bar), the lodge (a log
    cabin), the motel (a row of rooms and its pylon sign) and the casino's lit marquee.
27. **DONE** The map was very polygonal. The coast and lake shore are now smoothed in the map data
    itself (Chaikin, two passes), and a spliced-on needle of sea in the east coast is gone. The
    diagonals, country lanes and trails are real curves, and the blended ground has no polygon
    edges left. The city grid and the canals stay straight: the user decided curved city streets
    aren't needed (2026-10-19).
28. **DONE** Countryside ground was flat polygons with hard-edged shades. One blended terrain is
    painted from a zoning field (`world/render/terrain.ts`), and it's now the default; the "New map
    (beta)" setting switches back to the classic flat ground. Snow settles on it too.
29. **DONE** Zoning: make rich, poor, commercial, residential, countryside, farmland and forest areas
    clearly distinct, but grade them into each other gradually, like real life. Each block's
    character (affluent, working, rough, shopping, corporate...) and each countryside kind has its
    own ground colour and detail (crop rows, forest-floor clumps, worn patches), blurred over half
    a block into its neighbours (`world/data/zoning.ts`); the farms, woods, suburb and city
    buildings on top of it now match what each area is.
30. **DONE** Dirt trails in the countryside. The country lanes are in, and five footpaths run off
    them (`map/trails.ts`): through Ridgewood forest to the lodge's door and to a clearing, from the
    Kestrel trailhead along the north woods, and tractor tracks into the south and west fields.
    They're for walking: the GPS and traffic don't use them. The forests are now real woods
    (300 trees each), and no countryside scenery grows inside a place like the lodge any more.
31. **DONE** Building models that look like what they are. Named places now use seven Blender
    models (`art/blender/buildings.py`, `map/buildingModels.ts`): tenement, storefront, showroom,
    office, tower, civic hall and works. The unnamed filler buildings now use the same models,
    picked by their block's land use (`fillerArchetype`). Countryside buildings are built to look
    like what they are (`map/countryBuildings.ts`, in code rather than Blender): a farmhouse with a
    porch, a red barn with a gambrel roof and cupola, banded silos, ribbed metal sheds, tanks, and
    the suburb houses; each region's buildings merge into one group.
32. **DONE** Remodel everything properly in Blender, step by step. Blender 5.2 is installed and
    scripted (`art/blender/`). Done: all 21 vehicle classes (cars, trucks, tractor, helicopter, the
    two motorbikes), the 7 building models (named places, filler and the new lots), six street
    props (bench, bin, hydrant, shelter, postbox, planter) and the three landmarks (the Cicero
    water tower, Devlin Hall's dome, the Potato; `art/blender/landmarks.py`), and people: the
    figure's coats (lapels, collar, belt, pockets), jacket, hoodie (front pocket), sleeves with
    cuffs, hands with thumbs, trouser legs, shoes, sneakers, boots and the fedora's pinched crown
    are sculpted in Blender (`art/blender/people.py`) at the same sizes and pivots as the code's
    shapes, so the silhouette and the walk are unchanged.
    Trees too: a broadleaf (streets, parks, yards, farms) and a tiered pine (forests), in
    `art/blender/trees.py`, drawn instanced with the game's own materials.
    And the street lamps and signal frames (`art/blender/streetlights.py`): a cast-iron post with a
    curved arm and lantern, and signal poles with backplates and hooded visors.

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
49. **DONE** Keep going on the map rebuild (section 11 steps 3-6), the Blender work (people, street
    furniture, props, landmarks) and the rest of this list. Done: lots along the streets, street
    furniture, landmarks, people's parts and spinning wheels in Blender, the countryside places,
    the frame-rate fixes and the switch-over. Curved city streets were dropped: the user said the
    straight grid is fine (2026-10-19).
50. **DONE** Move the rest of the code-built models into Blender too, even the ones that already look fine
    (user, 2026-10-20). Done so far: the suburb house, the farmhouse, barn, silo, shed and tank, the
    site cabin, toilet and a tower crane built from mast and jib bays, the mall and its garage, and the
    airfield, docks, railyard, drive-in, lodge and motel (`art/blender/places.py`, loaded by
    `world/assets/places.ts`, drawn by `map/placeModels.ts`; each keeps its old shapes as the
    fallback). Then the rooms: 29 pieces of furniture in `art/blender/furniture.py` (counters, boards,
    safes, the vault door, slot machines, the card table, desks, lockers, shelving, plants, columns,
    tool chests), the mall's fountain, kiosks, food court, climbing frame and ball pit, and the
    basketball hoop and stone chess table. Layouts name them as fixtures (`InteriorFixture` in
    `map/interiorPieces.ts`), each with its old shapes as the fallback.
55. Write a quick file of everything that's changed since the last play-test (user, 2026-10-20).
    **DONE**: `PLAYTEST-CHANGES.md`.
56. **DONE** Inside buildings, don't switch to first person. What the user meant: the things you use
    (an office chair at a desk, the workbench, the bulletin board) open as a first-person close-up of
    the thing itself, a laptop screen or the board with its notices, instead of a text popup (user,
    2026-10-20). First person is gone. Using a thing glides the camera in to it and draws the popup as
    the thing (`map/closeUps.ts`): a desk's screen, a cork board, a clipboard, a counter slip, a
    blueprint, card-table felt, a slot screen, a bar menu, a map. Talking to a person keeps the plain
    popup. `e2e/interior3d.e2e.ts` uses the workbench and checks the camera goes in and comes back.
57. Make each interior different, and reflect its building's outside (user, 2026-10-20). Repeated later:
    insides and outsides must match, and both can be upgraded to look better.
    Same-kind places must differ too, by brand and by area: the Mudster dealership is rugged, and it
    sits in a poorer, forested, rural spot, so its showroom shouldn't look like a city one. The same
    goes for every building and place: brand and neighbourhood shape what's inside.
    **PART** (2026-10-21): every place has its own plan now (`map/interiorPlans.ts`): one of 45 themes
    picked by what it is, its brand and its area (the Mudster trailhead is timber and mud, Diamond
    Exotics marble, Electron white and blue), a room sized from the building, and its own furniture
    (`map/interiorThemes.ts`, 35 new Blender pieces). `interiorPlans.test.ts` checks no furniture
    blocks a hotspot, the door, the stairs or a regular. Left: exterior colours and details carried
    inside, and a second look at each theme in play.
58. Add a nightclub and a police station (user, 2026-10-20).
59. Character customisation is janky: the selection carousel is broken, hair clips through the head,
    and there isn't much to choose from (user, 2026-10-20).
60. Set up tests for mobile gameplay so nothing breaks on phones (user, 2026-10-20).
61. **PART** Stairs in some buildings that you use to go up to the next floor (user, 2026-10-20). The
    casino and the mall definitely need upper floors, with stairs, lifts or escalators where they fit.
    Done: Arjun's flat over the garage (the wardrobe and vault are up there now), City Hall's council
    chamber, the casino's high-roller room, the Herald editor's office, the family office's boardroom
    (by lift) and the mall's upper concourse (by escalator: an arcade and a cinema). Left: the nightclub
    and police station when they're built (58).
62. **PART** People inside: NPCs, characters, maybe missions within the interiors (user, 2026-10-20).
    Staff at their posts, people walking round, and a regular or two in most places to talk to, each
    with their own lines. Left: missions that start from a regular.
63. **PART** Missions that happen inside buildings must keep working, and should be better for the new
    interiors (user, 2026-10-20). All 95 mission tests pass with the new rooms (they now stand at the
    hotspots' real positions instead of hard-coded ones). Left: the "better" part.
64. People and cars sometimes move weirdly and at random. They should path and react like GTA's, so
    they don't read as bots (user, 2026-10-20).
65. You must not be able to clip or phase through any building (user, 2026-10-20).
66. Some roads may be cut off; check and report back (user, 2026-10-20, "i might be wrong").
67. Audit the docs against each other and against the code, like the mission-plan boxes that were
    unticked while TODO said done: where one file says done and another doesn't, check the work the
    original file asked for is really finished, not just marked. Also look back for anything deleted
    recklessly along the way (user, 2026-10-20).
68. The places with alleys look odd, because the only alleys in town are the ones that do something.
    Add ordinary buildings with plain alleys between them, so the working ones blend in (user, 2026-10-20).
69. Upgrade posting a dealer: where they stand on the map, how it plays, the dealer pulling up when you
    post them, cops pulling up when one gets caught, and a message from a gang member when one does,
    with the details, in that member's voice, over a few different ways of getting caught. Tasteful,
    no bloat (user, 2026-10-20).
70. Make walking and sprinting look and feel distinct. Crouching only if it can be made useful (hiding
    from cops, missions); otherwise say so and put it in the SeatAtTheTable 2 plan (user, 2026-10-20).
71. **DONE** The cars look too small again, and the trees look too grey (user, 2026-10-20). The cars
    were a stale tab (confirmed fine after reloading). The grey was the near-black sky and fog at every
    hour and a blue-grey fill light: the sky is blue by day now, lit from sky and ground, trees greener.
72. **DONE** Some skyscraper walls are fully black instead of having windows (user, 2026-10-20). The
    tower was plain boxes of near-mirror glass, which renders black with no sky to reflect. Rebuilt
    with a floor band every storey, mullions and lit offices, and the shared glass made lighter.
73. More cars, and more variety of vehicles (user, 2026-10-20).
74. Make sure the city has every kind of building you'd expect, even ones you can't enter: apartments,
    condos, family houses, parks, restaurants, clothing shops, cafes, clubs, stores, corner shops,
    food stalls and so on (user, 2026-10-20).
75. Vehicle variety means: food trucks, garbage trucks, lorries, pickups, sports cars, electric cars,
    cyclists, motorbikes and unicycles. Common ones show up often, rare ones (unicyclists, garbage
    trucks) seldom (user, 2026-10-20).
76. A rare easter-egg mission: someone riding a horse past you falls off; talk to them and help them
    up, Arjun says it's a cool horse, the owner offers to sell it, and if you buy it Arjun takes it
    home and can customise it like himself and name it. The user is open to changes (2026-10-20).
    Decided: a one-off ride-past that can happen anywhere in the countryside; the horse lives at Arjun's
    garage and is rideable like a bike.
77. **DONE** A settings toggle (not the default) to try a camera that turns to follow the way Arjun
    faces (user, 2026-10-20). Settings > "Camera follows Arjun (experimental)": the camera swings
    round behind the way he's heading (and holds still when he stops), and the keys turn with it.
78. Many buildings have random spheres, circles, prisms and so on standing in front of them, like
    City Hall's floating rectangle. Find them and fix them (user, 2026-10-20).
79. **DONE** Scroll the mouse wheel to zoom the minimap (user, 2026-10-20). Half to four times, remembered.
80. Zone the city like a real one: commercial, rich, industrial, poor and middle-class areas, suburbs,
    woodland, farms, beach, a holiday spot, open space, sports fields, transport hubs, nature parks,
    museums and so on. Zones blend into each other gradually, not hard cut-outs (user, 2026-10-20).
81. A really big park in the spirit of Central Park, with things to do: chess hustlers, statues,
    yoga classes and so on, and a mission or two there, recreational (yoga) or a real one (user,
    2026-10-20).
82. A commuter rail line like Metra, separate from the freight train, running through the city with a
    station in each district that you can ride between (user, 2026-10-20).
83. Make the city bigger if the new things need it, but keep it alive and full. Maybe one to three new
    districts, conservatively; reshape the districts to be realistic and to fit the story and the
    zoning (user, 2026-10-20). Confirmed later the same day: enlarge the map. Things that belong near
    the city (the suburbs, the new buildings, a bigger city) are being squeezed out to the world's edge.
    Decided 2026-10-20: at least 1.5x bigger, and 2-3x if a proper think-through supports it. Two new
    districts: a rich lakefront district and a working-class south side, with the current three
    reshaped to fit.
84. Rebuild the train in Blender (it's too basic). Trains should come at random intervals, in different
    types, not one train on a loop, with level-crossing gates that stop cars, NPC cars included
    (user, 2026-10-20).
85. Develop the countryside districts from what each is for; they're thin right now (user, 2026-10-20).
86. Consider another biome, such as a swamp (user, 2026-10-20).
87. Make sure every note from this conversation is in this TODO (user, 2026-10-20). Checked: items
    49-87 cover them.
88. **DONE** Some buildings open a "Fatima Singh" stranger popup when you interact: a bug (user, 2026-10-20).
    Buildings you can buy weren't handled, so the interact key fell through to the stranger popup
    (and its placeholder line). They open their own panel now: owned or for sale, what it pays, and a
    GPS mark for the agent (`e2e/property.e2e.ts`).
89. **DONE** Car models have odd rectangles arranged in a circle on each side (user, 2026-10-20).
     The scattered-spoke bug, fixed earlier the same day; the user confirmed after reloading.
90. The street race isn't fun enough: a longer course with more turns and jumps, drifting, and a small
    fading popup at the start that shows the keys (and the touch controls on phones) (user, 2026-10-20).
91. Countryside homes are out of proportion; recheck proportions across the map (user, 2026-10-20).
92. Some amenities, buildings and interactions freeze for a while before they open (user, 2026-10-20).
    Measured: amenity panels ~20 ms; the first room 226 ms and a minigame 200 ms on a fast GPU (much
    worse on slow ones), both first-time shader and WebGL-context costs. Rooms now compile in the
    background after the city loads (first room 45 ms) and minigames share one renderer (about 60 ms
    the first time, 20-40 ms after). Still to do: spread the mall's build (~120 ms) over frames.
93. Characters and interiors must use Blender models too; fix the primitive-looking designs as a
    priority (user, 2026-10-20).
94. A minimap inside the larger interiors (user, 2026-10-20).
95. Some houses and yards sit in the streets or are scattered at random rather than laid out like a
    neighbourhood; the same goes for the newer buildings like factories (user, 2026-10-20).
96. People and vehicles that fit where they are, with the odd random one: dog walkers and kids in
    neighbourhoods, business people in the office district, rugged workers by factories, farmers and
    more tractors in farm country. Apply it across the whole game (user, 2026-10-20).
97. **DONE** The casino's gameplay and UI are bugged (user, 2026-10-20). Played through: walking up to
    the slots took the stake and spun at once (now the machine waits for a pull), and the draw-poker
    screen ran its Draw button off the window (popups now scroll, and you tap cards to hold them).
    Cards are drawn as cards (`e2e/casino.e2e.ts`). Its size and its people are item 98.
98. **DONE** The casino should be bigger, with people in it, waiters and so on (user, 2026-10-20). Now
    900 x 560 (from 480 x 280), with a cashier's cage, two banks of slots, four tables with dealers, a
    waiter and gamblers walking the floor, an aisle of ropes from the door, and a high-roller room upstairs.
99. **DONE** Flying vehicles pass through buildings (user, 2026-10-20). Flying ignored buildings on the
    idea you were over the roofs, but towers reach about 450 against a flight height of 80. You now
    climb over what's a second ahead, and can't fly into a building taller than you are yet.
100. **DONE** The garbage truck's load of trash looks odd; give it depth (user, 2026-10-20). An open
     hopper with walls and a dark well, and a heaped load of bags and boxes in it, not balls on the roof.
101. **DONE** Railways clip through roads, and Arjun walks inside a bridge instead of on top. Fix it,
    audit for similar problems, and add tests that catch them so they don't come back (user,
    2026-10-20). The raised rails and sleepers ran across every road and the rail bed shared the road's
    height; now each crossing is a level crossing with flush rails and a panel
    (`railCrossingSpans`/`railOpenSpans` in `map/queries.ts`). Bridge decks stood 4 up while people walk
    at 0; they're flush with the road now (`BRIDGE_DECK_TOP`). Guarded by `map/railCrossings.test.ts`
    and a new road-clearance audit (`e2e/road-clearance.e2e.ts`: every lane of every road must be clear
    from 1.2 to 14 high), which also found a traffic-light pole standing in Canal Bend Road. Junction
    furniture now checks for roads before it stands anywhere.
102. SeatAtTheTable 1 should still value the phone and tycoon side (SeatAtTheTable 2 leans on the map).
     Audit the code, features and how the game plays as a whole, and add what's found here, since the
     user hasn't said much about the tycoon and phone side (user, 2026-10-20).
103. **DONE** Diagonal roads clip through the roads they cross, and junctions clip too (user,
     2026-10-20). Overlapping road surfaces sat at the same height and flickered; each class now has
     its own depth offset and paint beats them all. Centre lines ran straight through junction boxes
     and over the crosswalks; they stop short of any other road now. Crosswalks and signals were laid
     at every pair of grid streets, even where one stopped short of the other; only real junctions now.
104. **DONE** Trees are standing in roads (user, 2026-10-20). Street trees only kept clear of the grid
     streets, so some stood in the curved Canal Bend Road; countryside buildings were spaced as if 22
     across, so a Lakeridge one stood on the Ring Road. Both now check every road (`onAnyRoad`), and the
     road-clearance audit samples five lines across each road, kerb to kerb.
105. Go through every test: make sure each works and is up to date, and fix what they flag. Then go
     through the whole game's code for systems that should have tests and don't, write them, and fix
     what they find (user, 2026-10-20).
106. **DONE** Some road ends are wrong: one runs through a beach and into the ocean (user, 2026-10-20).
     The northern streets stopped where their centre line met the beach, so their width and turning
     circles spread over the sand, and Wabash Avenue's reached the water. Dead ends are now pulled back
     until the whole circle is on dry ground, and `roadEnds.test.ts` checks the full kerb against the
     beach and the water (it only checked half the road against the water before).
107. **DONE** The beaches look bare now: where did the beach chairs, palm trees and so on go (user,
     2026-10-20)? A regression from rounding the coast: the resort skips any spot whose inland side
     touches water, and with the new shore 5-10 in from the beach's edge every spot did, so it placed
     nothing. It tests closer to its own spot now (96 palms and lounger sets), and `scene-audit.e2e.ts`
     fails if the beach empties again.
108. Alongside the commuter rail, a dock where you take a canoe out to an island, with things on it
     that are unique and fun, or that matter to missions, new or old (user, 2026-10-20).
109. Make the water look real: the lake to the north and the water between the districts are too
     geometric and perfect. Add peninsulas, islets and the like where they fit, and small ponds or
     lakes here and there (user, 2026-10-20).
110. The railyard isn't to scale and isn't near the rails. Standing rule for every new place and every
     old one reviewed: placement, proportions, and the inside matching the outside (user, 2026-10-20).
111. **PART** Playing any amenity game crashes the game (user, 2026-10-20). Couldn't reproduce a
     crash, headless or in a real Chrome: both games play through cleanly and the map keeps running.
     What did happen: when a game ended its window vanished with no result (the line was too minor for
     the street log), which reads like a crash. It now shows the score and what you won, a game that
     throws closes cleanly, and a lost GPU context is replaced. `e2e/amenity-games.e2e.ts` plays both
     to the end twice. Waiting on the user to confirm.
112. Central Park is poor: longer than it needs to be, parts of its water can be walked on, it's short of
     things to do, and it has no parody name. Fix the earlier hasty work properly before adding more
     (user, 2026-10-20: "dont work hastely ... set your priorities straight on the todo and fix the
     mistakes you made in the past being hasty").
113. The beaches: trees and chairs are spaced too evenly to look real. Give them real beach terrain,
     people, sandcastles, random placement and stalls, and a shoreline with curves and edges, not a
     straight strip (user, 2026-10-20).
114. The railway runs through water, which is impossible: give it a bridge, one the player can't walk
     onto (user, 2026-10-20). **DONE** (2026-10-21): the freight line now crosses the lake on a raised
     trestle bridge (7 up, ramped over 60), built wherever the line is over water. The train rides up onto
     it, and the deck has no walkable solid. The line also now runs the full length of the map. Checked
     by screenshot.
115. **DONE** A random floating plank-like rectangle on the right of the railway (user, 2026-10-20). It
     was a canal wall standing up out of the water where the bank was shallow. The canal walls are now low
     kerbs that start only where the bank is dry. Checked by screenshot.
116. The GPS breaks in the countryside, when flying, or off the streets; it could cover more places.
     And the place categories on the minimap are muddled (user, 2026-10-20).
117. Missions are cumbersome to find and join: make joining natural and less dependent on lots of
     phone messages, and cut down the flood of mission messages on the phone (user, 2026-10-21).
118. For the "camera follows Arjun" setting: make it first person if that's not too hard; otherwise a
     lower angle and the camera a little closer to Arjun (user, 2026-10-21).

**Batch of 2026-10-21 (second list).** Each says where it goes: V1 here, V2 in `SEATATTHETABLE2.md`,
or split, with the more advanced part in V2.

119. **DONE** Amenity games are broken and don't work in full screen (user, 2026-10-21). V1, bug. The
     map's full-screen mode covers the page at z-index 9999, and the game's window sat at 60, so it
     opened hidden behind the map: nothing to see and nothing to click. It now sits above the map and
     the phone, and the panel grows with the screen while keeping its buttons in view on short
     screens. The hover tooltip had the same problem and is raised too. `e2e/amenity-games.e2e.ts`
     plays the court in full screen and checks the Shoot button is the topmost thing (it fails on the
     old code).
120. **DONE** The garage interior has random cars in it (user, 2026-10-21). V1, bug. Arjun's garage
     drew the car he was driving, the same one parked outside on the street, so it was in two places
     at once, and it was turned sideways across the floor. Now the garage has two bays that hold the
     cars he owns and isn't out in, facing the door, and an empty bay leaves no invisible wall. Found
     while checking: every regular in every room was drawn inside a wooden post (the fallback prop for
     a hotspot with no furniture landed right on them), so they looked like barrels with heads. Talk
     spots and stairs no longer get a prop, with a test. Checked in the garage and the casino.
121. Missions sometimes repeat (user, 2026-10-21). V1, bug. Find which ones re-fire (one-off missions
     should be guarded by the mission ledger) and add a test that no one-off mission can be offered
     twice, including across a save and reload.
122. Too many missions are one and done, and too many are just a text box with choices (user,
     2026-10-21). Split. V1: every mission gets something to see or do in the world (see 125), and a few
     become repeatable side jobs with variety (deliveries, corner pickups, the fire brigade style call
     outs). V2: whole chains that run over days.
123. Heat is too complicated; make it simpler, like GTA's stars but not a copy (user, 2026-10-21). V1.
     Today heat is a 0-100 meter fed by seven sources and four multipliers, plus a separate
     investigation meter and five named tiers. Plan: one wanted level of 0-5 badges. Doing crimes in the
     open raises it, laying low or getting out of sight lowers it, and each level says plainly what
     happens (cops notice, cops chase, raids). The tycoon side keeps a slow background "attention" that
     only nudges the starting level. The investigation meter folds into it.
124. Gang wars and the dealer system have a lot of potential: do what fits now and leave the rest to
     V2 (user, 2026-10-21). Split. V1: finish 69 (dealers pulling up, cops on a bust, the gang text),
     plus gang wars as a short in-person fight at a block you're taking, not just a modal. V2: wars that
     spread block by block, gangs that retake turf, crews you command on the map.
125. Mission characters are always the same man with a briefcase in a corner; each mission should
     have its own scene (user, 2026-10-21). V1 for the main ones. Kailash's cart fire becomes a real
     fire you put out with an extinguisher. Lana's interview becomes a talk, then questions on camera in
     front of a crew. These play as close-ups, like the room interactions. Every mission contact gets a
     look and a place that fit them. The rest of the missions get the same treatment in V2.
     Also: when you interact with something inside, the popup moves to the side so you can see what
     you're facing (V1, part of the close-ups).
126. Interiors are still too alike: most are some mix of a bulletin board, a desk and a workbench
     (user, 2026-10-21). V1, finishes 57. Each theme gets its own main piece and its own hotspot
     (a florist's cold room, a gym's ring, a pawn counter's case), and the stock board, desk and bench
     come out where they don't belong.
127. Every interaction inside must do something useful; otherwise keep it as decoration and stop it
     being clickable (user, 2026-10-21). V1. Audit every hotspot and either give it a real effect or
     make it scenery. Add a test that every hotspot has an action with a game effect.
128. Too many corny, unnecessary lines left from the old model, clearly written by an AI, in popups and
     elsewhere (user, 2026-10-21). V1. A copy pass over every string the player sees: rewrite or cut.
129. The tycoon income maths is a little off (user, 2026-10-21). V1, bug. Check the shown income
     against what actually arrives each second, for every source (ventures, properties, corners,
     extortion, black market and the multipliers), and add tests that the display and the payout agree.
130. Expand the drug sales (user, 2026-10-21). Split, kept tasteful. V1: more than one product grade,
     buyers who differ by area, a supply you have to restock, and a bust or robbery chance that fits
     the new heat. V2: a supply chain across districts, and rival dealers who undercut you.
131. The map should slowly unlock places like Chinatown and Little Italy (user, 2026-10-21). V1,
     built into the map rebuild (80-87). The two new neighbourhoods, each with its own gang (134), and
     opened by story progress, shown on the map as closed until then. More unlockable areas go in V2.
132. Funny side content to break up the grim parts, like GTA's alien hallucination mission, the
     plants that turn you into an animal, or Saints Row's sewage truck (user, 2026-10-21). Split. V1:
     three or four, each with its own mechanic, starting with the pothead (138). V2: many more.
133. Holding office should give extra perks and features you can't get any other way (user,
     2026-10-21). V1. For example, police patrols kept off your blocks, city contracts for your
     ventures, permits that open locked places, and a lower wanted level after a crime.
134. Dice should be the main rival, with smaller gangs to fight, compete with or ally with over
     territory, like a Chinatown gang or an Italian mob (user, 2026-10-21). Split. V1: Dice leads the
     main rival crew. Today the game says Dice runs West Side, but `rivals.ts` gives West Side to the
     Cicero Firm, so that gets put right. Add the two smaller gangs with the new neighbourhoods (131),
     with a simple ally or fight choice. V2: real diplomacy and shifting alliances.
135. A bike as the first and cheapest thing you can buy (user, 2026-10-21). V1. There is already a
     rideable bike (`bikeRider.ts`); add it to the shop below the Karolla's $800.
136. Delhi, later in the game: you need to buy a plane, and some story has to happen (user,
     2026-10-21). V2. It needs a second map, a plane and a story arc. In V1 it stays as backstory.
137. The choose-your-own-adventure side isn't complex enough and barely changes what happens (user,
     2026-10-21). Split. V1: the big choices change visible things (who shows up, who calls, prices,
     which missions come next, how a gang treats you). V2: a fully branching story.
138. Characters to add: a random pothead, a rich businessman, an annoying apprentice, the local
     business council, the Dice gang leader, a politician, Sanjay, gang members and a biker gang (user,
     2026-10-21). V1 for most. Sanjay and Dice are already in; they get their own models and places.
     The biker gang builds on the Outlaw Riders brand. The others each come with a mission or a job.

**Batch of 2026-10-21 (third list).**

139. A venture doesn't say how many crew are on it (user, 2026-10-21). V1. The card shows a bare
     "2/4"; say it in words ("Crew: 2 of 4, needs 2 to run well") on the card and in the venture's room.
140. Heat doesn't make sense, and should start with fines rather than going straight to seizing things
     (user, 2026-10-21). V1, part of 123. Low wanted levels cost a fine sized to what you did, paid or
     owed. Seizures and raids only at the top levels, and the game says why each one happened.
141. Call contacts from the phone for missions, like GTA (user, 2026-10-21; Claude decides how). V1,
     with 117. A Contacts app: each contact shows whether they have work. Calling them plays a short
     call and offers it, and accepting puts the meeting on the map. Contacts reach out only for
     story beats, with one short text, not a stack of messages.
142. You should be able to see the real estate you own on the map (user, 2026-10-21). V1. Owned
     properties get your gold marker on the minimap and the city map, a "yours" sign on the building,
     and a filter in the map legend.
143. Only one mission accepted at a time (user, 2026-10-21). V1, bug. There is a one-mission cap
     (`activeMissionCap`), so some path gets round it. Find it, and test every way a mission can
     start (popup, phone, walking up to a contact).
144. Swimming where it makes sense (user, 2026-10-21). Split. V1: wading into the lake, canal or sea
     swims instead of hitting a wall, slow, with no phone and no vehicles, and you climb out at banks
     and beaches. Water that's deep or fast stays off limits. V2: diving and boats.
145. Mission outcomes need to be more developed (user, 2026-10-21). V1, with 122 and 137. Each ending
     shows what happened in a short scene and changes something that lasts: a contact, a place, a
     price, a follow-up.
146. Less vagueness in the interview and other missions: not just "get there, answer a popup, leave".
     More answers, more outcomes, more immersion (user, 2026-10-21). V1, with 125. The main missions
     get several steps, answers that lead to different places, and the scene played as a close-up.
147. Eventually, first person and shooting (user, 2026-10-21). V2. Both change the whole game's
     tone and controls and need combat, aim, cover and police responses designed together.
148. Missions come too fast and should feel like a bigger deal. And the consequences only say what
     changes, not by how much (user, 2026-10-21). V1. Fewer missions, spaced further apart, each
     announced properly. Every choice shows its numbers ("-$1,200 cash, wanted +1, Lana's trust up").
149. A taxi on the phone that drives you to the waypoint for a set fare (user, 2026-10-21). V1.
     Today the phone's taxi takes $150 and moves you to the waypoint instantly. Make a cab pull up,
     you get in, and it drives the real roads, with a skip that pays the fare and jumps there (city
     only, as decided). Hailing a passing cab stays in V2. The user stressed (2026-10-21) that today
     it's only paid fast travel: no cab on the map, nothing to get into, no ride. The V1 version must
     be a real cab: it drives to you, Arjun gets in the back, the camera rides along, the meter runs,
     and you can skip. Owning the Windhaven Cab Co. venture makes it cheaper.
150. Animations for Arjun: opening doors, walking, getting in and out of cars and onto bikes, and so
     on (user, 2026-10-21). Split. V1: a door push when entering, getting into and out of cars and
     onto and off bikes, and a phone-out pose. V2: a full animation set.

**Batch of 2026-10-21 (fourth list: the mission brief).** The player shared an older mission brief
as a suggestion to build on. Much of its first version is already in the game: all eleven of its
events exist (the Herald interview, the rival capo, Kowalski, Amit at the bus station, Miller,
the hustler, the investor, the cart fire, the missing cargo, the alderman's bagman and the turf
war), missions set the GPS to their objective, and repeats are counted (`eventRepeats`). What's
missing is the depth the brief asks for: most have two choices and one modal per stage.

151. The mission overhaul: choose your own adventure throughout the game (user, 2026-10-21). V1 for
     the overhaul, V2 for a fully branching story (137). What the player asked for:
     - Almost every popup becomes a real mission, conversation or branching scenario, with varying
       size: some short, some several stages, some unlocking parts of the game or new missions.
     - The interview as the model: a named reporter calls; declining loses it (or it comes back
       differently later); accepting means driving to the Herald, walking into the studio, and
       answering several questions in different tones (professional, funny, controversial, evasive,
       inspiring). Lana reacts to each answer, and the ending varies: reputation, new fans,
       criticism from some groups, new contacts or side missions, sponsorships, or bad press.
     - Choices leave lasting marks on reputation, relationships, which missions come, future events
       and parts of the story, so a second playthrough could go differently. Hidden standings (like
       family loyalty) can track this.
     - More variety, and each popup appears once per playthrough. When something does repeat, it
       comes back with a new context, new lines, new choices and new outcomes, and remembers what you
       did last time (Kowalski back with a higher price unless you blackmailed him; Amit's mistake if
       you hired him).
     How: first, a written design for every one of the current 26 events in
     `SeatAtTheTable/docs/mission-designs.md`, taking the brief's ideas as a start and going further:
     stages, places, the people in them, choices with their numbers (148), lasting effects, and what
     each unlocks. The player reviews it before any of it is built. Then build it on the existing
     mission engine (stages and objectives in `core/missions.ts`), with the scenes from 125 and 146.
152. The GPS should set the waypoint to the mission on its own (user, 2026-10-21). V1. It already
     does for a mission objective. Check that every stage of every mission does, including phone
     ones and the ones that move to a second place, and that it clears when the mission ends. Add it
     to the mission e2e tests.
153. New buildings and places for these missions (user, 2026-10-21). V1, in the map rebuild. Each
     needs a proper shape, collision, an interior, a GPS route and a label, as the location rule in
     `SEATATTHETABLE2.md` says. The list comes from the design in 151.
154. The map is too geometric and square: it should be rough at the edges like a real map, with
     GTA-like unique spots inside a city grid (user, 2026-10-21). V1, in the map rebuild, with 108-109
     (natural water). The coast, the district edges and the map border all get irregular outlines,
     and the grid gets bends, odd blocks and landmarks. Moves the "irregular coast" idea out of V2.
155. (merged into 149, the taxi).
156. The phone's icons, the contacts icon, and its layout and design could be much better (user,
     2026-10-21). V1. A redesign of the home screen, app icons and the contacts app, done with 141
     (calling contacts), and checked on mobile (60).
157. Cutscenes for missions, played in the world (user, 2026-10-21). Split. V1: short scenes in the
     map at a mission's start and end: the camera moves in close (the close-up camera), letterbox
     bars, the people in it moving and talking, and a skip. V2: full cinematics.
51. **DONE** The cars are too small (user, 2026-10-20: "the cars are so tiny bro"). They were drawn at life
    size next to people drawn 1.2x life, under a high camera. Worse, traffic was a bug: merging each
    car into one mesh transformed its quantized Blender geometry in place, which clamped every car to
    a speck 4 units long. Fixed (`map/mergeScenery.ts` copies to floats first, with a test), and cars
    now draw at `VEHICLE_SCALE` 2.0, bigger than life like a driving game; collision, the gap cars keep
    and where they stop at lights follow it. Bikes stay 1.6 so the rider fits. The Blender kit was also
    baking every box's position into its mesh, so a turned box swung round the world origin: wheel
    spokes were scattered. Fixed in `art/blender/lib/kit.py` and every model rebuilt.
52. **DONE** The streetlights are a little cumbersome and large (user, 2026-10-20). Now a slim pole with a flat LED head,
    drawn 20% smaller.
53. **DONE** The City Hall annex has an unnecessary rectangle on it (user, 2026-10-20). It was facade detail
    placed for the old box buildings (steps floating across the columns, a second dome); it's no longer
    added to Blender models, which also cleared the stray neon bars and awnings on other places. The
    civic dome had rendered black (fully metallic with nothing to reflect) and is gilt now.
54. **DONE** Walking looks too much like gliding (user, 2026-10-20). The user loves the interiors. The stride was two to three
    times what the legs reached, so feet skated. Steps now match the legs' reach, the hips drop as the
    legs spread so the leading foot stays down, and a run springs off each foot (`map/personModel.ts`).

**E. Interiors**
34. **DONE** Interiors you walk around in like outside, in 3D. Today most rooms are a few small icons that
    open a text box or restate the obvious, and some buildings have secondary areas with nothing
    in them. Instead: a front desk looks like a front desk, and every hotspot is something real
    (a person to talk to, a bulletin board you can read, an office for an office), seen in first
    person or at least in 3D. "Nothing fancy, just an upgrade from a text box." The mall (36)
    takes this furthest.
    Done: every room is now 3D (`map/interiorLayout.ts`, `map/interiorRoom3d.ts`). A counter has a
    clerk behind it, boards have notices pinned up, the garage has a wardrobe, a safe and your car,
    the casino has slot machines and a card table with a dealer. Furniture blocks you, each hotspot
    has a ring you stand on and a name card, and the minimap hides indoors. The mall is a hall far
    bigger than a room. First person indoors: the view button (or V) switches to Arjun's eyes,
    with a ceiling and a full front wall, and W/S walk forward and back while A/D turn.

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
37. **DONE** A central park, with more greenery generally. Central Park now spans the city's south
    edge where Cicero Avenue, Pulaski Road and Canal Yard Drive end, either side of Ridgewood Lane:
    about 90 trees, walks round and across it, a pond with a fountain, flower beds, a bandstand,
    benches and lamps (`map/centralPark.ts`). Trunks and the pond are solid. Any small block park
    the filler lays out now gets crossing walks and round-crowned trees too, not flat grass and cones.
38. **DONE** A suburbs area. Lakeridge Lane, south of where Lakefront Drive leaves the city, is now
    a paved suburban street with a dozen family houses down both sides: pitched roofs, porches,
    garages, driveways, lawns, picket fences, mailboxes and front-yard trees (`map/suburb.ts`).
    The street is one merged group, so it costs about 30 draw calls.
39. **DONE** Construction sites. A few plots in each district are building sites: a hoarding with a
    gate, a steel frame on concrete slabs, a tower crane with its load over the street, spoil,
    rebar, a site cabin and a portable toilet (`map/construction.ts`). They're picked by a hash of
    the plot, so the rest of the city didn't move.
40. **DONE** Snow that collects on the ground and turns it white, and a plow that comes through.
    While it snows the grass, roofs, trees and roads whiten over about 25 seconds and melt after
    (`map/snow.ts`). Once it has settled, a yellow plow truck with a blade and a beacon joins the
    traffic and the roads clear behind it; it goes back to the depot when the snow is gone.

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
1. **DONE** The world audit (item 15) comes first, so correctness is tested from the first line.
2. **DONE** Ground: one terrain mesh, with zoning as a smooth field driving its colour and what's
   built. On by default since 2026-10-19 (item 28).
3. **DONE** A road graph with real curves, and building lots laid out along the roads. Lots are
   done (`world/data/lots.ts`, `world/render/lots.ts`): every side of every block that faces a
   street is cut into lots set back behind the pavement and street trees, each building facing its
   street, its type, height and colour from the block's character, a few left as building sites.
   They keep clear of every place, its frontage and the garage's apron, and draw as instanced
   Blender models (about 25 draw calls a district). Curved city streets were dropped (user, 2026-10-19).
4. **DONE** Scenery placed from zoning that keeps clear of roads. Street furniture is in: benches,
   bins, hydrants, planters, postboxes and bus shelters modelled in Blender (`art/blender/props.py`)
   and set out in front of the lots by block character (`world/data/streetProps.ts`), instanced.
5. **DONE** Models: Blender-made and instanced (lots and props). Levels of detail weren't needed:
   the busiest view is about 490 draw calls.
6. **DONE** The new places from section 10F (mall, Central Park, suburb, building sites, snow).
7. **DONE** Switch over (2026-10-19). Parity held: every place reachable, mission objectives on their
   places, saves load, and the new map ran as fast as the old one (22.7 fps against 21.3 on the
   4x-throttled phone profile, after the frame-rate fixes doubled both). The "New map (beta)"
   setting, the classic flat ground and the old filler layout are deleted.

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
