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

## 0. Post-expansion cleanup — COMPLETE

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

**Closed after the report:**
- The Kenney models now clone and receive the intended neighborhood tint, so blocks no longer
  collapse into identical white buildings when their source colormap is missing.
- Interior ambient hotspots now provide place-specific information and a meaningful lie-low
  action instead of repeating HUD status.
- The Travel Nodes strip is removed; district travel is physical.
- River, canal, lake, and ocean highlights now travel continuously with a directional swell,
  rather than oscillating in place and reading as static texture.

**Visual pass closed:** the map screenshot review now passes at desktop, laptop, and mobile
sizes after the outskirt content landed. It checks usable map dimensions plus water, land,
and colour variety; no asset family failed the current live render review.

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

## 0b. New requests — COMPLETE

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
- **Outskirts pass 2** — FUNCTIONALLY COMPLETE. The scenery, destinations, mission hooks,
  Fire Road, motel, Mudster trail capability, and sparse rural traffic are shipped. The
  Country Club remains intentionally deferred to in-person Politics; resort/wildlife variety
  remains optional visual polish.

## 0c. Outskirts content — functionally complete

Three outskirt districts now exist, are named, and have exactly one thing to stop at between
them. This is the pass that gives you a reason to drive out.

### The rule this pass is built on

**The drive out must buy an EXPERIENCE you cannot get in the city or on the phone — and one
you do not need often.** Player's rule, stated directly. The casino is the model: you go for
an evening, not for an errand. The airfield is the model for the mission half: you go because
the story took you there.

The corollary is the sharp edge, and it killed two items from the first draft. **A
transaction fails this rule no matter how good its numbers are.** A grain co-op that
launders product at zero heat and a scrapyard that buys whole cars are both things you would
want to use *constantly* — so putting them 3 minutes out does not create an experience, it
creates a commute. Anything you would do routinely belongs in the city or on the phone.
Frequency is the test, not distance.

Second corollary, and the bigger one: **the drive is itself the experience, so there has to
be something to drive past.** See "The built environment" below — that is the real reason
the outskirts feel dead, and it is worth more than any single venue.

### THE BUILT ENVIRONMENT — do this first, it is worth more than any venue

**Status check, because it is worse than it sounds.** Inside the three city districts the
neighbourhood-character system is real and good: `neighbourhoods.ts` carries seven characters
— `rough` (24% vacant lots, crooked, boarded), `working`, `affluent` (balconies, cornices,
straight frontages), `shopping`, `corporate`, `entertainment`, `industrial` — each with its
own height, density, vacancy, jitter, palette and trim, mapped over a 4x4 block grid per
district. Run-down blocks, shopping strips, bougie blocks and downtown all exist and read
correctly.

**The first scenery pass now runs in the outskirts.** Deterministic farmsteads, woodland,
suburban homes, and industrial works are sampled inside each irregular belt, reject water,
and are guarded by `outskirtScenery.test.ts` plus the live water scene audit. It is still a
scenery pass, not a venue pass.

Before this pass, every belt was a single flat-coloured polygon
(`sceneBuilding.ts`, one `ShapeGeometry` per region). `northshore` and `lakeridge` are typed
`kind: 'suburb'` and contain **zero houses**. `northfarms` is farmland with no farms. The
filler generator is hard-scoped to `['devlin','westside','hub']` — see `districtSeeds` and
`DISTRICT_OFFSETS` in `filler.ts`.

So the outskirts are not empty because they lack a venue. They are empty because you drive
past a green field with a label on it. Fix that and the drive becomes the thing the player
described wanting; leave it and every venue below is a destination at the end of nothing.

The work: extend the character generator outward with belt-appropriate characters, generated
against the belt polygons rather than the district block grid.
- `farmstead` (`northfarms`, `westfarms`, `southfields`) — sparse: a house, a barn, a silo,
  long field lines, fence runs. Density an order of magnitude below the city.
- `suburb` (`northshore`, `lakeridge`) — low single houses, wide plots, curving lanes,
  driveways, garden trees. The middle-class ring.
- `resort` (`northshore`, and the city blocks fronting the south beach) — raised beach
  houses, cabanas, whitewash and sand. See "The resort strip" below: this is a real zoning
  character, not just a filler flavour.
- `woodland` (`northwoods`, `ridgewood`) — no buildings, dense trees, a cabin or two, tracks
  rather than roads.
- `works` (`eastworks`) — the chained-up industrial edge: sheds, tanks, spoil heaps.

Constraint: the scene audit applies out here too, and the belts are irregular polygons rather
than a rectangular grid, so generated items must be tested against the belt polygon and the
coastline, not against block bands. `circleInsidePolygon` already does this.

### The resort strip — zoning, amenities, and a geography correction

**First, the correction, because the plan was about to be built on a wrong assumption.**
"Sunset Shore" is NOT the tropical area. There are two different shores of the same enclosed
lake:

- **The existing beach** is `LAKEFRONT_BEACH` at y≈70-200 — the north edge of the *city*
  districts, i.e. the lake's SOUTH shore. This is where the sand, palms, loungers and
  umbrellas already are. It belongs to Devlin / West Side / the Hub.
- **Sunset Shore** (`northshore`) is at y≈-600 to -960 — the lake's NORTH shore, in Kestrel
  Reach, on the far side of the water. It is typed `kind:'suburb'` and currently contains
  nothing whatsoever.

They are ~800 units apart with a lake between them.

**DECIDED: the beach goes all the way round the lake.** A body of water with sand on one bank
and lawn on the other three is not a thing that exists — the shore is the shore. So the beach
becomes a **ring** following the entire lake edge: the city's south shore (where it already
is), Sunset Shore in the north, and both ends.

**Build it derived, not authored.** `LAKEFRONT_BEACH` is currently a hand-written out-and-back
ribbon of ~24 points tracing only the south shore. Replace it with a ring generated from
`WINDHAVEN_LAKE` itself, offset outward along each segment's normal — the identical technique
the surf lines already use (`sceneBuilding.ts`, "derived from the real coastline now, so they
can never drift again"). This matters: hard-coded shorelines authored against a coast that
later moved are exactly what produced the "random lines everywhere" bug, and this file is the
last hand-authored shoreline left.

Consumers to update: `mapModel.lakefrontBeach` (the source), the minimap sand polygon, and
`buildBeachResort`, which currently assumes the ribbon's first half is the waterline —
against a true ring the waterline is the whole inner edge, which is simpler.

This also settles Sunset Shore: it is beach by construction, and the resort filler sits on it.

**Zoning character: `resort`.** Add to `BlockCharacter` in `neighbourhoods.ts` alongside the
seven that exist. Proper planning term is *Resort Commercial* / *Recreational*; `resort` is
the short form, labelled "Resort / recreational" by `characterLabel`. Profile: very low
height, very low density, generous plots, near-zero vacancy, bright/pale palette (whitewash,
sand, teal, coral) — the opposite of `rough` on every axis. Applies to Sunset Shore and to
the city blocks fronting the south beach.

**Amenities.** `MapAmenityKind` is currently `'basketball' | 'petstore' | 'shop' | 'parkgame'`
and `basketball` already carries a skill minigame — so a beach amenity is a well-trodden
path, not new machinery.
- `volleyball` — a net, a court in the sand. Follows `basketball` exactly, including the
  minigame hook. Best value of the three.
- Loungers / umbrellas already exist as scenery (`buildBeachResort`); once the sand is a ring
  they follow it round automatically rather than needing re-authoring.

**DECIDED: the resorts themselves are cosmetic — filler, not venues.** Hotels, cabanas and
pool decks are generated scenery under the `resort` character. You do not walk into them and
they have no interior, no menu and no mechanic. This is the right call: a resort you can
enter would be another lie-low building, and there is one of those already. It also means the
whole resort strip costs a filler character and nothing else.

Consequence: **Sunset Shore Motel stays on the venue list**, un-redundant, because the resorts
around it are backdrop. The motel is the one building on that shore you can actually go into.

### Off-road dealership — `northwoods` or `northfarms`, Kestrel Reach

Player's idea, and it passes the drive-out rule more cleanly than anything else on this list:
you cannot buy an ATV in the city, you would buy one roughly once, and it is a purchase that
changes what you can DO rather than a transaction you repeat.

**It is also cheaper than it sounds, because the brand already exists.** `config/assets.ts`
has a `mudster` brand commented "SUVs / off-road" with the Mudster XL already in it. This is
that brand's country dealership — no new brand, no new economy, just a `dealership`-kind
service building with an off-road inventory: ATV, quad, pickup, tractor.

**The honest caveat, which decides whether this is worth building.** An ATV is only worth
owning if there is terrain a car cannot use. Otherwise it is a reskin with different numbers,
and the player will buy it once and never take it out. So this ships as a pair with **woodland
tracks** — unpaved trails through `northwoods` and `ridgewood` that cars handle badly or not
at all — or it does not ship. Same build-both-or-build-neither rule as the fire road, and
conveniently the fire road is in the same belt.

**Shipped:** Mudster Kestrel Trailhead is a second, country dealership in `northwoods`. Its
vehicles now keep full speed across both woodland belts, while every other car is reduced to
52% speed there. The terrain rule is isolated in `map/offRoad.ts` and covered by a unit test,
so the dealership is a capability purchase rather than another remote catalog.

### The forest question — recommendation: keep it terrain, not a district

There are already **two** forests, and they are in different districts: `northwoods` (Kestrel
Woods) in Kestrel Reach, and `ridgewood` (Ridgewood Stand) in Kettle Reach. They sit at
opposite ends of the map, roughly 5,000 units apart.

**Recommendation: do not make forest its own outskirt district.** A district whose two halves
are at opposite ends of the world with the entire city between them is a *category*, not a
place — and the three outskirt districts were drawn to be contiguous geography precisely so
they read as somewhere you can be. Grouping by terrain type instead would undo that.

Give the two woods separate identities through content rather than through boundaries:
- **Kestrel Woods** (north) — the wild one. Fire road, off-road tracks, the ATV dealership.
- **Ridgewood Stand** (south) — the quiet one. The Lodge, and nothing else. Somewhere to meet
  where nobody is watching.

That answers "which region has the forest" with: both, deliberately, and they are different
forests.

### Ambient life (cheap, do it alongside)

Nothing moves out there either. Roaming actors exist and take a district. Add sparse,
kind-appropriate life: a tractor working `northfarms`, walkers on `northshore`, deer in
`northwoods`, a freight truck on the `eastworks` road. Low counts — the countryside should
not be a painting, but it should not be busy either.

**Shipped first slice:** three sparse rural vehicles now move through the world — a Kettle
Flats tractor, a Harrow End tractor, and a Cicero freight truck. Their routes are separately
configured from city traffic and unit-tested to stay on dry land. Pedestrians and wildlife
remain optional visual variety rather than a reason to delay the functional outskirts pass.

### The venues

Cut from the first draft, on the player's rule: **Harrow End Grain Co-op** and **Cicero
Outworks Scrapyard**. Both were transactions you would use constantly, which makes them a
commute rather than an experience. If zero-heat laundering and no-questions car disposal are
wanted as mechanics, they belong in the city or on the phone.

**1. Kettle Flats Airfield** — `westfarms`, Kettle Reach. *Mission-shaped.*
A crop-duster strip where shipments arrive without troubling the docks. Hook for
`stolen_shipment`. Exactly the casino's shape of reason-to-go: the story takes you there, and
it could not be anywhere else, because an airstrip needs a mile of flat nothing.
**Shipped:** Deke's Black Market route now continues from the chop shop to a physical
airfield scene, where the player chooses a street payout or a riskier permanent trade route.
**Sequencing:** after the mission chains (§2). Codex owns missions; building it now would
collide on the same trunk, which is the setup that produced this repo's duplicate-feature
merges.

**2. Ridgewood Stand Lodge** — `ridgewood`, Kettle Reach. *Mission-shaped.*
Neutral ground: where the crews meet when nobody wants a meeting in the city. A turf-war and
politics venue. Same sequencing caveat as the airfield.
**Shipped for turf:** accepting the lounge truce now sends the player to a final in-person
Ridgewood negotiation, with a low-heat compromise or a riskier crew-exposure outcome.

**3. Boundary Meadows Drive-In** — `southfields`, Kettle Reach. *Cheap, high charm.*
A drive-in cinema. Park the car and sit through a picture: the clock runs fast, and it is an
evening out rather than an errand — the casino's shape at a tenth of the cost. Reuses the
`bay` drive-in geometry that shipped with the garage. Also the natural place to stage a
conversation you do not want overheard.

**4. Kestrel Woods Fire Road** — `northwoods`, Kestrel Reach. *Needs a minigame to land.*
Unpoliced road: driving offences cost **no heat**, making it the one place in the world you
can drive flat out. This is an experience by construction and you would do it rarely. Wants a
time trial to give it a score to beat; without one it is a nice road and nothing else, so
either build the time trial or do not build this.

**Shipped:** the Fire Road trailhead now runs a six-gate skill time trial. Three gates pays
$350, five pays $700, and a clean six pays $1,100. Every paid finish unlocks a persistent
Fire Road stripe on the car used for the run.

**5. Sunset Shore Motel** — `northshore`, Kestrel Reach. *Borderline on frequency.*
The resorts around it are cosmetic filler, so this is the one enterable building on that
shore and is not redundant.
Lie low properly: `lieLowButtons()` already exists, and the motel would be that lever with
the numbers up, plus the thing no city interior offers — letting a building **federal case**
decay, not just heat. It survives the rule *only* if it stays rare. If it becomes the
standard answer to being hot, it is a co-op with a bed in it and should be cut on the same
grounds. Gate it hard: only worth the drive when a federal case is actually building.

**6. Lakeridge Country Club** — `lakeridge`, Lakeridge County. *Defer.*
Where cash becomes standing. Genuinely good, but it overlaps the Politics tab, which §3
already plans to move in-person. Build it as part of that, not beside it.

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
The product and implementation rules live in [`docs/onboarding-plan.md`](SeatAtTheTable/docs/onboarding-plan.md).
Every mission must classify its onboarding responsibility as `mission`, `contextual`, or
`none`; every new feature must make the same decision before it is considered complete.
**Status:** the first implementation slice is underway. The next slice is the early-game
teaching sequence, followed by mission-specific teaching paths and browser coverage.

**Design rule:** keep onboarding mission-shaped where the player must travel, choose, or
see consequences over time. Use contextual cards for small nudges and bottleneck diagnosis.
The detailed decision rules live in `docs/onboarding-plan.md`.

## 2. Finish the mission chains

**Current status:** the five core chains now have phone or popup offers, GPS, physical
destinations, interior contacts or the outdoor Devlin corner, choices, saved outcomes,
dedicated onboarding where needed, connected follow-ups, and typed mission definitions in
`src/config/missions.ts`. Remaining work in this section is depth: richer scene writing,
more comic encounters and fuller browser coverage. Connected consequences now arrive as
delayed in-game messages, and active objectives have a distinct map marker instead of
looking like ordinary places.

### Mission scene standard

A major mission cannot resolve as “arrive, choose one popup answer, leave.” It must feel
like a scene the player participates in.

- Give the player a conversation or encounter with multiple exchanges, not one question.
- Include at least two meaningful decisions: an approach, a response, a sacrifice, or a
  piece of information to reveal or withhold.
- Decisions must create distinct immediate numbers and saved world memory that changes later
  dialogue, contact availability, offers, or city conditions.
- The Herald interview should be expanded first: Lana responds to earlier answers, asks
  follow-up questions, and produces several distinct public narratives rather than one
  single-tone choice.
- Use mission stages to move between conversation beats, physical objectives, and outcomes;
  do not use a modal as a substitute for the whole scene.
- In-person destinations must resolve in the place itself: an interior counter, NPC, desk,
  or scene. Do not redirect the player to a phone app after they travelled there, except
  when the phone is explicitly the story object they came to use.

### Comic-relief mission lane

Add optional, absurd city encounters to break up the serious campaign. They must be playful
detours with temporary chaos and a funny reward, never a punishment for interacting with an
unfamiliar object or accepting a mission.

- Start with a mystery-tonic encounter at a local business: a short surreal map state that
  changes normal interactions and ends safely with a small reward.
- The `pigeon_summit` civic farce now uses City Hall and the Wabash Newsstand, and
  `mayors_parrot` uses City Hall and Rockwell Pet Supply; `goose_permit` uses City Hall and
  Boundary Meadows Drive-In; `raccoon_keycard` uses City Hall and Golden Lotus Herbalist.
  Add further over-the-top side jobs
  with the same map, phone, interiors, and NPC dialogue standard.
- Keep comic missions clearly optional and separate from the main consequence-chain priority.

### Phone contacts and taxi dispatch

Add a Contacts app to the phone. Contacts are unlocked through missions and can offer
direct, contextual actions instead of only story dialogue.

- Start with Taxi Dispatch: choose a waypoint, pay a fixed fare, and ride to the selected
  destination. The taxi must have clear fare, destination, and cancellation feedback.
- Mission contacts should unlock as saved relationships, then expose only actions that fit
  their story role: a dockmaster can offer dock information, for example, while a reporter
  cannot become a universal menu.
- Contacts must be optional convenience or narrative tools; they cannot bypass active
  mission travel objectives unless that mission explicitly grants it.

**Shipped:** completing Missing Cargo unlocks Dockmaster Bell in Contacts. In addition to a
docks GPS route, Bell can report whether the Black Market route is active and how much live
investigation is sitting on the manifests; it never completes or redirects an active mission.

`home_safe_robbery`, `stolen_shipment`, `alderman_fixer`, `turf_war`, and `first_heist`
now have map, interior, dialogue, and saved-consequence flows. Missing Cargo now begins with
a dockside manifest-evidence beat that changes Bell's conversation before the chop-shop lead.
Lana Vance's Herald interview remains the model for a fully
realised map → interior → dialogue mission.

## 3. Initiative Phase 5 — COMPLETE

Politics and Gang moved off flat tabs and became in-person (City Hall, the Chop Shop,
Marigold Lounge, and recruit locations), closing the diegetic-device initiative. Phases 1-4
are done — see "Shipped" below.

**Shipped:** the City Hall Clerk's Window now handles influence funding, political favors,
politician meetings, and campaign discussion in the building itself instead of redirecting
the player to the Politics tab. The Chop Shop Armory now sells gun crates in person, and the
Marigold Lounge Back-Room Table now begins West Side operations. Recruit initiation and
check-ins already happen with the people on the map. The redundant Politics and Gang tabs
are removed from navigation, with stale routes safely redirecting to the map.

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
- The heist room now has both the vault board and a Security Office desk. The desk gives
  exact, in-world odds and payout comparisons for every bank before a job is chosen.
- **Optional:** deepen into recurring events (the block board rotating real requests).

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

# THE MAP AT A GLANCE — what every region is and what is in it

Reference, not a task list. **Bold = shipped. Plain = planned (§0c).** The world is one
landmass in an ocean, with an enclosed lake in the north, two canals cutting it into three
city districts, and a ring of countryside around all of it.

## Water

| | What |
|---|---|
| **The ocean** | Surrounds everything. Hard world border. |
| **Windhaven Lake** | Enclosed body in the north. Was open to the ocean (which made it a bay, not a lake) until the landmass was wrapped over the top of it. |
| **South Branch Canal / Lakefront Cut** | The two north-south canals that separate the three city districts. Crossed by bridges on Grand, Roosevelt and Cermak. |
| Beach ring | Sand around the ENTIRE lake edge, derived from the lake polygon. Currently only the south shore. |

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
Biome, planned: beach and `resort` filler along Sunset Shore; low suburban houses behind it;
dense woodland; open farmland with silos and field lines at the top of the world.
Planned contents: **Sunset Shore Motel** (lie low, and let a federal case decay — the one
thing no city interior offers) · **Kestrel Woods Fire Road** (no heat for driving offences +
a time trial) · **the off-road dealership** (Mudster's country branch — ATVs, quads,
tractors) · **woodland tracks** that cars cannot use. This is the busiest of the three.

### **Kettle Reach** — the west and south, wrapped around the city
Three belts: **Kettle Flats** (`farmland`, west), **Boundary Meadows** (`farmland`, south),
**Ridgewood Stand** (`forest`, south-east). An L-shape — which is why its map label needed a
grid walk to land inside it rather than in the middle of downtown.
Biome, planned: farmland with farmsteads; the quiet forest.
Planned contents: **Kettle Flats Airfield** (mission-shaped, `stolen_shipment`) ·
**Boundary Meadows Drive-In** (a picture, an evening out) · **Ridgewood Stand Lodge**
(neutral ground where the crews meet — mission-shaped). Both mission venues land AFTER the
mission chains (§2) to avoid colliding with Codex on the same trunk.

### **Lakeridge County** — the east end
Two belts: **Lakeridge** (`suburb`), **Cicero Outworks** (`industrial`).
Biome, planned: lakeside suburb; a chained-up industrial edge of sheds, tanks and spoil heaps.
Contains: **The Gilded Kettle** — the casino. Blackjack, roulette, five-card draw, slots.
Planned: **Lakeridge Country Club** (deferred into §3's in-person Politics work).

## The two forests, deliberately different

Not their own district — they sit 5,000 units apart with the whole city between them, and a
district like that is a category rather than a place.
- **Kestrel Woods** (north, Kestrel Reach) — the wild one. Fire road, tracks, the ATV dealer.
- **Ridgewood Stand** (south, Kettle Reach) — the quiet one. The Lodge, and nothing else.

## Zoning characters

**Shipped, city only:** `corporate` · `affluent` · `working` · `rough` · `shopping` ·
`entertainment` · `industrial`.
**Planned, outskirts:** `farmstead` · `suburb` · `resort` · `woodland` · `works`.
The generator is currently hard-scoped to the three city districts — extending it outward is
the single highest-value item in §0c, because the drive itself is the experience.

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
