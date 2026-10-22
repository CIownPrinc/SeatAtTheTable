# SeatAtTheTable 2: starting brief

SeatAtTheTable 2 (V2) is a ground-up remake of SeatAtTheTable (V1). This file is the whole
handoff. Copy it into the new repo as its first planning doc. It assumes the reader has never
seen V1, so nothing here links into V1's files. V1 paths are written as `V1: path` and they
only matter if you go back to the old repo to read how something was done.

V1 stays frozen at its current feature set. It's being finished and polished, not extended.
Every feature idea that wasn't built in V1 lives here instead.

## Why a remake

V1 started as a quick browser game and grew into a 3D city. Its foundations didn't grow with
it.

| Problem in V1 | What it cost |
| --- | --- |
| One engine file, `V1: src/core/header.ts`, over 7,000 lines | Every feature touches it. Codex and Claude Code collided in it, which caused duplicate-feature merges. |
| Strict TypeScript added after the fact | 780 type errors had to be cleared by hand before the compiler could protect anything. |
| City placement started as hand-placed coordinates | About 40 fixed anchors made a non-grid road network too risky to attempt. |
| Collision bounds kept separately from the drawn shapes | Invisible walls, and buildings you could walk through. |
| Shorelines hand-written against a coast that later moved | Stray lines across the land after the map changed. |
| The planned web stack (Next.js, Prisma) was never adopted | V1 carried an empty `create-next-app` template and a placeholder Prisma schema until it was frozen, while the real game was a separate Vite app. Both were deleted from V1 on 2026-10-16. |

V2 gets to make these decisions on day one instead of retrofitting them.

## The game, as V1 proved it

V1 is a crime, business and politics tycoon set in Windhaven, a fictional city. You start
as Arjun with a food cart in Devlin and work up to a seat at the table. These systems shipped
and play well. V2 should keep the design and rebuild the code.

| System | What it does |
| --- | --- |
| Ventures and ranks | Legit and illegal businesses with income, crew, levels and research. Ranks run from street vendor upward. |
| Product and corners | A lab makes product, and corners sell it. Selling generates heat. |
| Heat | A WANTED ladder plus a sticky INVESTIGATION meter (a federal case), raids, crackdown waves, lay low, and retaining a lawyer. |
| Territory | Three city districts, each held by a named rival crew. Each district splits into 8 named blocks that fall one at a time as your control rises. |
| The phone | A diegetic device ("Windhaven OS" on a Pomello handset) for things you'd do online, like banking, stocks and buying from catalogs. Anything physical happens in person. |
| Multiple banks | Three banks that differ by interest rate and heist profile. You can rob them in person, and a rival heist exposes your deposits. |
| Branded shops | Nine brands, each a walk-in building with its own stock, turf pricing and haggling. Dealer-only stock is the reason to drive somewhere. |
| Brand side effects | Used cars break down, bikes add heat, rough-block properties get raided, commercial fronts launder money, waterfront property appreciates. |
| Missions | Multi-stage chains with GPS, physical destinations, conversations, saved world memory and delayed follow-ups. There are also optional comic side missions. |
| Onboarding | Learn-as-you-go. Missions teach the big systems, and small contextual cards nudge. There's no up-front tutorial wall. |
| The map | A 3D city of three districts split by two canals, an enclosed lake to the north, beaches, and a countryside ring of three outskirt regions. Includes driving, a minimap and a full City Map with waypoints. |
| Outskirt venues | A casino, a drive-in cinema, an airfield, a lodge, a motel, a fire-road time trial, and an off-road dealership. |
| Amenities | Basketball and park chess as small skill games. A pet store and a newsstand as plain shops. |
| Windhaven Wire | A city news feed that reacts to what you do. |

## Product rules to carry over

These came out of V1 playtesting. Treat them as decided unless the player reopens one.

| Rule | Why |
| --- | --- |
| Online things live on the phone, and physical things happen in person. | A building whose hotspot only flips a menu tab is a lie about the world. |
| The online catalog is a subset. Every brand keeps in-person-only stock. | Otherwise there's no reason to travel. |
| A drive out of town has to buy an experience you can't get in the city, and one you don't need often. | Frequency is the test, not distance. A routine errand placed far away is a commute. |
| The drive is part of the fun. | The player said so directly. Don't add fast travel to the outskirts. A taxi to a waypoint is fine. |
| Places look like what they are. | A cart is a stall, an alley is a gap between buildings, and a lot is open ground. Each place's shape is chosen by hand, never by which config list it sits in. |
| What a place blocks is what it draws. | Collision comes from the same shape definition as the visuals. |
| A major mission is a scene, not a popup. | At least two real decisions, distinct immediate numbers, and saved memory that changes something later. It resolves at the place you travelled to. |
| Comic missions are optional and never punish curiosity. | They're there to break up the serious campaign. |
| Result screens show true numbers. | "Heat −5" must mean five heat was removed, not that five was promised. |
| Parody geography only. | San Plastica is the Bay Area, Rentport is New York and Flamingo Bay is Miami. No real cities. |

## Engineering lessons from V1

| Lesson | What happened |
| --- | --- |
| Derive geometry, don't author it twice. | Beaches and surf generated from the lake polygon can't drift. Hand-written shorelines did. |
| One map data model drives both the 3D world and the minimap. | Separate "pretty" minimap coordinates made icons disagree with the places they marked. |
| Build a scene audit early. | V1's audit walks the live 3D scene and fails if anything stands in a road, floats, gets buried, or sits in water. It caught mistakes that passed every other test. |
| Look at it. | Every visual bug in V1 passed its tests and failed on sight. Screenshot tests that teleport the player, force noon and take a picture are cheap. |
| Browser tests that read map pixels must wait for the 3D scene to boot. | Loading three.js takes a while on a cold dev server, and tests fail on timing rather than real bugs. V1 runs with only 2 test workers because of this. |
| A mission's results ledger measures the choices, not the time between accept and finish. | V1's ledger first counted passive heat decay and income earned while driving as mission rewards. |
| A DOM lookup helper that throws must not be guarded with `if`. | `byId` throws on a missing element, so `if(byId(...))` guards were dead code. The game crashed every frame until a page-error check in a test caught it. |
| Keep to one trunk branch, and point every agent at it. | Two long-lived branches with Codex on one and Claude on the other produced the "two heat bars" bug. |
| Split ownership by module, not by feature. | It worked once there was a written rule. Codex owned missions, Claude owned the map, and the plan named the files each could touch. |

## Feature backlog moved out of V1

Each item is either designed but not built, or only an idea. "Designed" means V1's planning
docs already worked out how it should play.

### World and map

| Feature | State | Notes |
| --- | --- | --- |
| Real zoning for the outskirts (`farmstead`, `suburb`, `resort`, `woodland`, `works`) | Designed | V1 has a simpler scenery pass. Zoning sets height, density, vacancy and palette per area, the way the city's seven zoning types already do. Sunset Shore and the lakeside suburbs are the gap. |
| Resort strip | Designed | Resorts are cosmetic scenery, not venues. Whitewash, sand, teal and coral, with very low density. |
| Beach volleyball amenity | Designed | Follows the basketball amenity, including its skill minigame. |
| Ambient rural life | Partly built | V1 has two tractors and a freight truck. Still missing are walkers on the shore, deer in the woods, and more variety. Keep counts low. |
| Lakeridge Country Club | Designed | Where cash becomes standing. Build it as part of in-person politics, not beside it. |
| Non-grid roads with curves | Idea | V1 avoided this because of hand-placed anchors. V2 can design placement to allow it from the start. |
| Lane-aware traffic and smarter pedestrians | Idea | Includes police patrols, roadblocks, delivery routes, taxis and crew transport using the car models. |
| Hail a taxi | Requested | GTA-style. Call or flag down a cab, pick a destination (a waypoint, a place, or a mission objective), and ride while it drives you there on the real roads. You can skip the ride for a fare, but within the city only, per the "drive is part of the fun" rule. Should pair with the Windhaven Cab Co. venture: owning it could make rides cheaper or let your own drivers move crew. |
| More 3D props | Idea | Street furniture, parking, docks, roof clutter and pedestrian variety. V1 has unused CC0 asset packs (listed in `V1: SeatAtTheTable/docs/map-asset-usage-audit.md`). Only add assets that feed something visible. |
| Irregular coast and edge landmarks | Idea | Make the city read less like a rectangular board. |
| Visual regression tests for the 3D canvas | Idea | Compare screenshots across changes. |

### Missions and story

| Feature | State | Notes |
| --- | --- | --- |
| Deeper main chains | Designed | Early and late choices in the five chains (home safe robbery, stolen shipment, alderman fixer, turf war, first heist) should change later dialogue, contacts, offers or city conditions, not just stats. |
| Deeper follow-ups | Designed | Second and third beats for Amit's mistake, the arsonist, the Black Market investigation and the hostile press story. |
| Missions as chains over days (V1 TODO 122) | Requested | V1 gives each mission a scene and makes a few side jobs repeatable. V2 makes them chains. |
| Every mission played as a scene (V1 TODO 125) | Requested | V1 does the main ones (the cart fire, the interview). V2 does the rest. |
| Gang wars on the map (V1 TODO 124, 134) | Requested | Wars that spread block by block, gangs that retake turf, crews you command, real diplomacy and shifting alliances between Dice and the smaller gangs. |
| Drug supply chain (V1 TODO 130) | Requested | Supply across districts, and rival dealers who undercut you. Kept tasteful. |
| More unlockable neighbourhoods (V1 TODO 131) | Requested | V1 opens Chinatown and Little Italy as you progress. |
| Delhi (V1 TODO 136) | Requested | A later-game trip to Delhi: buy a plane, and a story arc gets you there. Needs a second map. |
| A branching story (V1 TODO 137) | Requested | V1 makes the big choices change visible things. V2 branches the story. |
| More comic encounters | Requested | Each should use a different mechanic, location and reward. V1 ships three or four (TODO 132), like a hallucination, a plant that turns you into an animal, or a sewage truck. |
| More phone contacts | Partly built | V1 has Dockmaster Bell, Lana Vance, Amit and a sponsor lead. Each contact only offers actions that fit their story role, and a reporter must not become a universal menu. |
| Location capacity rule | Designed | Before adding a chain that needs a new place, that place needs an honest shape, collision, scene-audit coverage, an interior interaction, a GPS route and a map label. |

### Interiors and amenities

| Feature | State | Notes |
| --- | --- | --- |
| Recurring room events | Idea | For example, a block board that rotates real requests. |
| More amenity variety | Idea | Rewards beyond flat respect, like a guard dog that lowers heat. |

### Platform

| Feature | State | Notes |
| --- | --- | --- |
| Server-side saves, accounts and leaderboards | Idea | V1 saves to the browser only. |
| Live 3D city title screen | Requested | GTA-style: the real Windhaven renders behind the start menu with the camera drifting slowly over the streets (Devlin at night, then the lakefront), with traffic and lit windows. V1 ships a flat SVG skyline instead, because loading three.js and the GLB pack before the player presses Start costs seconds on a cold load. Plan for it from the start: a low-detail "attract" scene (no interiors, few actors, capped pixel ratio) that loads behind the menu, which the game scene then reuses, so the wait happens once. A static skyline fallback for slow devices and reduced-motion settings. |
| Python service or ML "readings" | Undefined | Mentioned once and never given a product definition. Don't build it until it has one. |

## Decide these before writing code

1. **Is the web stack the game's home?** V1's rules name Next.js, React, shadcn/ui, Tailwind,
   Framer Motion and TanStack Query. That stack fits menus, panels and the phone. The 3D city
   is a render loop, not a React tree. Options are a React shell around a separate three.js
   engine, react-three-fiber, or a plain Vite game with a React UI layer. Pick one on
   purpose.
2. **Where does game state live?** It's client state (a store), not server state. Decide which
   store library, and what gets saved to a server.
3. **What's the module boundary for the engine?** V1's single file is the problem being fixed.
   Draw the map, missions, economy, heat, territory and UI as separate modules with typed
   interfaces before the first feature lands.
4. **Can V1 code be lifted?** V1's pure modules are typed and unit-tested and could port
   nearly as-is. Examples are `V1: src/map/territory.ts`, `storefront.ts`, `brandEffects.ts`,
   `casino.ts`, `lots.ts`, `neighbourhoods.ts`, `src/core/missions.ts` and
   `missionLedger.ts`. Decide whether V2 reuses them or rewrites them.
5. **Which agent owns which modules?** Write it down in the repo on day one.
