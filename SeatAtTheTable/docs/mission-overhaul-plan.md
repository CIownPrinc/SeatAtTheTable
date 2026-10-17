# Map And Phone Driven Mission Overhaul

## Goal

Turn random popups into mission starters that use the map, phone, interiors, NPC dialogue, and saved world memory.

Every mission definition must also declare its onboarding mode. Read [`onboarding-plan.md`](onboarding-plan.md): use `mission` for a guided mechanic or sequence, `contextual` for a small reinforcement of an existing mechanic, and `none` for narrative or familiar content. A mission is not complete until its teaching responsibility is explicit.

The player should not feel like events are disconnected modal interruptions. A message, call, or street encounter should point to a real place, create a clear objective, and leave behind consequences that can shape later missions.

## Current Shipped State

- Mission save state exists:
  - `eventRepeats`
  - `eventHistory`
  - `activeMissions`
  - `completedMissions`
  - `worldMemory`
- The phone has a Missions app.
- Mission messages can be accepted, declined, or used to set GPS.
- Active missions store their current objective and replace the global waypoint.
- Old saves migrate with empty mission fields.
- Existing random popup events have been converted into mission-backed offers or saved consequences.
- Expanded mission chains use the full map → interior/dialogue → consequence flow:
  - `home_safe_robbery`
  - `stolen_shipment`
  - `alderman_fixer`
  - `turf_war`
  - `first_heist`
- The first full map/interior/dialogue mission is Lana Vance's Herald interview.

## Core System Design

### Mission State

A mission keeps the current stage, status, objective, start time, and last update time.

The smallest useful mission objective is:

- label
- district
- place id
- world `x`
- world `y`

That lets the phone, minimap, expanded map, and GPS all read the same target instead of each system inventing its own destination.

### Event History

Event history answers a different question from active mission state.

- Active mission state says what the player is doing now.
- Event history says what the player has already been offered, accepted, declined, completed, or failed.
- Repeat counts let repeatable events change dialogue and costs across visits.

### World Memory

World memory is the lightweight long-term consequence store.

Examples:

- `kowalskiBlackmailed`
- `amitHired`
- `blackMarketTrade`
- `politicalFavorsUnlocked`
- `pressTone`
- `gangWarSparked`

Use this for mission unlocks, blocked follow-ups, passive rewards, later dialogue variants, and changed future offers.

## Mission Entry Points

### Phone

Use phone messages when the offer is remote, planned, or delayed.

Examples:

- reporter message
- cousin call
- burner phone from Detective Miller
- investor invitation
- bank tutorial warning
- delayed outcome messages

Phone mission messages must show:

- who sent it
- what happened
- where to go
- likely consequences: cash, heat, respect, income, unlocks, case risk, or blocked future offers
- accept and decline actions

Unread mission messages should create a visible phone notification badge.

Mission outcomes must also be visible immediately after the player chooses. Do not close
to a blank or unchanged screen and make the player infer the result from the ticker.
Each mission resolution should show either:

- a result modal with the outcome text and exact number changes, or
- a toast-style notification that summarizes the outcome and changed stats

Use the result modal for major branch endings and the toast for small message acknowledgements.

### Popups

Use popups when the situation is immediate.

Examples:

- rival crew pressure
- inspector visit
- grease fire
- turf pressure

Popup offers should still create mission state when accepted, and they should show consequence text before the player chooses.

### Map

Use the map for physical objectives.

- Permanent mission locations should be normal searchable map places.
- Temporary mission hotspots should appear only while the matching mission stage is active.
- GPS should move automatically when a mission starts or advances.
- Arriving at the target should resolve only the active mission tied to that place.

## Converted Existing Events

### `tribune`: Lana Vance Interview

- Entry: phone message.
- GPS target: Windhaven Herald HQ.
- Interior interaction: Herald studio.
- Dialogue tones:
  - professional
  - evasive
  - humorous
  - controversial
  - aggressive
- Consequences:
  - legit income changes
  - respect changes
  - heat changes
  - prestige changes
  - `worldMemory.pressTone`

### `rival`: Rival Crew Confrontation

- Entry: popup.
- GPS target: active corner or fallback corner.
- Choices:
  - pay off
  - intimidate
  - negotiate split
  - attack
- Consequences:
  - cash loss
  - respect gain
  - heat gain or reduction
  - temporary income cut
  - possible gang war memory

### `inspector`: Inspector Kowalski

- Entry: popup.
- GPS target: flagship legit venture.
- Repeatable with changed second-visit bribe cost.
- Choices:
  - pay bribe
  - comply
  - blackmail
  - intimidate
- Consequences:
  - cash cost
  - legit income slowdown
  - heat changes
  - blackmail can block future inspector offers

### `cousin`: Amit Arrival

- Entry: phone message.
- GPS target: Hub Bus Station.
- Choices:
  - pay debt
  - hire into legit work
  - turn away
- Consequences:
  - cash cost
  - respect change
  - possible crew gain
  - family memory for follow-ups

### `cops`: Detective Miller

- Entry: phone message.
- GPS target: Devlin Back Alley.
- Choices:
  - pay
  - snitch on rival
  - refuse
  - risk enforcement
- Consequences:
  - heat changes
  - investigation changes
  - respect loss
  - raid risk

### `hustler`: Bar Recruit Pitch

- Entry: popup.
- GPS target: O'Malley's Bar.
- Choices:
  - approve risky score
  - hire for legit work
  - reject
- Consequences:
  - cash chance
  - heat failure
  - crew gain
  - rival strength memory

### `investor`: Silent Investor

- Entry: phone message.
- GPS target: Whitfield Realty.
- Choices:
  - accept
  - negotiate
  - reject
  - threaten
- Consequences:
  - cash gain
  - permanent income cut
  - respect change
  - heat gain
  - City Hall attention memory

### `fire`: Kailash's Cart

- Entry: popup.
- GPS target: Kailash's Cart.
- Choices:
  - rebuild quietly
  - hunt arsonist
- Consequences:
  - cash cost
  - respect gain
  - heat gain
  - revenge path memory

## Expanded Mission Set

### `stolen_shipment`: Missing Cargo

- Stage 1: Docks, talk to Dockmaster Bell.
- Stage 2: West Side Chop Shop.
- Stage 3: Deke's route continues to Kettle Flats Airfield, where the cargo becomes either a
  quick street payout or a permanent Black Market Trade link with more case risk.
- Choices:
  - buy back cargo
  - take it by force
  - partner with Deke
- Long-term unlock:
  - Black Market Trade passive income
  - added case risk

### `alderman_fixer`: City Hall Bagman

- Stage 1: City Hall Annex.
- Stage 2: Railyard union leader.
- Choices:
  - pay the workers
  - pressure the union leader
- Long-term unlock:
  - Political Favors button in Politics
  - spend cash and influence to lower heat and investigation

### `turf_war`: West Side Pressure

- Stage 1: defend a Devlin corner.
- Stage 2: track the rival capo to Marigold Lounge.
- Choices:
  - truce
  - assassination attempt
- Consequences:
  - lower heat through truce
  - high-risk West Side control gain
  - cash, crew, and heat losses on failure

### `home_safe_robbery`: Bank Tutorial

- Entry: phone message when the player is carrying exposed cash and has no banked balance.
- GPS target: bank branch.
- Stage 1: speak with the guard/contact about the loss.
- Stage 2: hear the teller explain the deposit choice, then decide whether to bank future cash
  or deliberately keep carrying it.
- Teaches:
  - cash on hand is unsafe
  - banked cash is safer from raids and street theft
  - phone bank app is for exact deposits and withdrawals
  - in-person tellers offer quick preset actions

### `first_heist`: First Real Heist

- Replaces the first simple heist prompt once respect is high enough.
- Stage 1: case First Windhaven Trust.
- Stage 2: choose an approach, then decide at execution whether to push for the vault or leave with smaller cashier bundles.
- Choices:
  - smash-and-grab
  - crew approach if enough crew is assigned
- After completion, the regular per-bank heist board can be used again.

## Map Locations

Permanent mission locations:

- Windhaven Herald HQ
- Hub Bus Station
- Devlin Back Alley
- Docks Dockmaster
- Railyard
- Marigold Lounge
- City Hall Annex
- Whitfield Realty
- O'Malley's Bar
- West Side Chop Shop
- First Windhaven Trust

Future temporary mission locations:

- rival capo at active corner
- inspector at selected legit venture
- arsonist or revenge target
- union leader actor
- mission-only informants and couriers

## Event Repeat Rules

- Default mission events should be unique per playthrough.
- Repeatable events use `eventRepeats`.
- Follow-up events should use `worldMemory` and `eventHistory`.
- Active mission cap prevents message and popup flooding.
- Follow-up events should outrank generic repeatables when possible.
- Declined offers should not immediately reappear.

## Testing Plan

Unit tests:

- one-time missions do not repeat after acceptance or completion
- repeat counts change availability
- world memory blocks and unlocks follow-ups
- mission start, advance, complete, and fail mutate state once
- mission GPS replaces the current global waypoint
- old saves migrate with empty mission fields

Integration tests:

- each old popup becomes a mission or saved consequence
- phone Missions app and map waypoint read the same active mission state
- temporary mission hotspots appear only during matching active stages
- Lana interview reaches multiple outcomes
- Political Favors and Black Market Trade unlock from their missions

Playwright tests:

- accept interview, confirm phone mission entry and GPS marker
- travel to Herald HQ, enter studio, finish interview
- decline interview, confirm it does not immediately reappear
- complete one phone-started mission
- complete one map-hotspot mission
- expanded map shows mission location, hover label, and waypoint behavior
- Focused browser evidence currently covers phone GPS entry, bank/teller interaction, Herald
  interview and sponsor follow-up, Investor sponsor negotiation, Inspector venture-specific
  compliance, City Hall audit fallout, physical comic routes, first-heist security, dock
  evidence, and immediate Rival-to-Turf-War escalation. The broader all-branch matrix remains
  intentionally tracked below.

## Original Brief Completion Checklist

V1 is feature-frozen (2026-10-16). Unchecked items still in V1 scope are mirrored in
`TODO.md`; items marked "Moved" live in `SEATATTHETABLE2.md`. This is the remaining-work
checklist for the original request: choices must
produce different playable stories, not just different result text. Do not mark this section
complete until every unchecked item has browser evidence.

### Shared mission contract

- [x] Every mission offer has a typed definition, explicit onboarding responsibility, saved
  history, and a GPS objective when accepted.
- [x] Mission results show actual before/after numeric changes, including permanent unlocks
  and temporary effects in branch text.
- [x] Active missions are capped and offers are spaced out so the phone does not flood.
- [x] Unique events do not repeat after completion; the Inspector has bounded contextual
  repeats and connected follow-ups use saved world memory.
- [x] Major mission definitions now carry a reusable quality contract, tested in
  `src/config/missions.test.ts`: at least two decision beats, a saved distinct outcome, a later
  consequence/unlock, and an in-person scene beyond one modal.
- [ ] Audit every result branch for truthful capped values (for example, never promise heat
  reduction that cannot actually occur) and explicit future consequences.
- [ ] Add browser coverage for every major branch, decline route, and repeat/follow-up rule;
  passing one representative route is not enough.
- [x] ~~**Known e2e failures as of 2026-08-05 (`7a769a6`):**~~ pigeon and raccoon fixed
  2026-10-16; the phone-overlay failure is tracked in `TODO.md` §1. Original note:
  `pigeon_summit`'s "Give the flock a public apology" choice never opens the Mission Result
  modal (`missions.e2e.ts` times out at 60s); `raccoon_keycard`'s result text says
  `heat -6` where the mission promises `heat -5` (reward math or copy is wrong, pick one);
  a phone/modal flow leaves `#device-overlay` without `.hidden` after Escape
  (`phone.e2e.ts`, "Bank + AutoMart apps render, and Finance/Assets tabs are gone").

### Existing-event conversion

- [x] `tribune` — Herald HQ travel, studio interview, opening plus follow-up response, five
  tones, distinct reputation/economy outcomes, hostile-press follow-up.
- [x] `tribune` — the opening now changes Lana's follow-up answers and final article title;
  successful tones lead to a physical sponsor, supporter, source, or public-challenge meeting.
  Lana's saved contact dialogue also now varies for every recorded press tone.
- [x] `rival` — map objective at an active corner with pay, intimidate, split, and attack
  choices; attack immediately starts the physical Turf War chain at Devlin.
- [x] `rival` — the Marigold war table now shows live odds and records explicit win/loss;
  victory gives a temporary 12% income surge plus permanent West Side control, while losses
  retain the paid operation cost and casualties. Intimidation requires stated respect or muscle.
- [x] `inspector` — physical venture meeting, bounded repeat count, escalating bribe, and
  blackmail memory that removes future visits.
- [x] `inspector` — compliance now slows only the named inspected venture for 60 seconds;
  successful blackmail records permanent inspection protection and blocks future Kowalski
  visits. Intimidation schedules a Detective Miller route.
- [x] `cousin` — physical bus-station meeting, hire/pay/refuse choices, and Amit's delayed
  mistake can permanently remove a crew member.
- [x] `cousin` — pay, hire, and refusal now record family loyalty; containing or externalizing
  Amit's later mistake changes it again. Amit's saved phone contact reports distinct later
  family dialogue based on that standing.
- [x] `cops` — physical Devlin alley meeting with pay, snitch, and refusal choices.
- [x] `cops` — refusal has an explicit configured immediate-raid risk, while snitching lowers
  the case but permanently strengthens future rivals.
- [x] `hustler` — physical O'Malley's meeting with risky-score, legit-hire, and reject paths.
- [x] `hustler` — the risky score is a delayed return-to-O'Malley's mission with distinct
  success/fail outcomes and a potential recruit; rejection permanently strengthens rivals.
- [x] `investor` — physical Whitfield meeting with accept, negotiate, reject, and threaten.
- [x] `investor` — City Hall fallout recurs as an in-person complaint resolution; cash,
  leverage, and permanent-income terms now use named tuning values. A successful negotiation
  unlocks a saved Trade Group sponsor lead in Contacts.
- [x] `fire` — physical cart visit and arsonist-revenge follow-up.
- [x] `fire` — rebuild applies only to Kailash's Cart for its stated duration, and revenge is
  a Devlin-to-Marigold multi-stage confrontation.

### New major chains

- [x] `home_safe_robbery`, `stolen_shipment`, `alderman_fixer`, `turf_war`, and `first_heist`
  are map-first, multi-stage chains with physical objectives and saved outcomes.
- [ ] **Moved to `SEATATTHETABLE2.md`.** Deepen each chain until both early and late choices change later dialogue, contacts,
  offers, or city conditions; do not rely only on immediate stat changes.
- [x] Union refusal now schedules a physical City Hall audit: pay the named settlement or
  contest it and take a 90-second, 50% income hit at the named venture.
- [x] Turf-war failure now makes the paid operation cost and casualties explicit, while victory
  gives permanent control plus a transparent two-minute income surge.
- [ ] Add dedicated browser scenarios for every stage and meaningful ending of all five chains.

### Variety, continuity, and map support

- [x] Added several optional two-location comic missions, plus temporary safe surreal tonic
  effects, to break up serious story content.
- [ ] **Moved to `SEATATTHETABLE2.md`.** Continue adding optional comic encounters with different mechanics, locations, and
  rewards; none may punish unfamiliar interaction or be required for main progression.
- [x] Mission GPS, permanent mission locations, temporary markers, and an expanded outskirt
  ring are implemented.
- [ ] **Moved to `SEATATTHETABLE2.md`.** Continue the map shape pass: add irregular coast/edge landmarks, non-grid routes, and
  mission-specific places so the city reads less like a rectangular board and more like a
  lived-in place.
- [ ] **Moved to `SEATATTHETABLE2.md`.** Add location capacity rules before new chains: every required new place needs an honest
  archetype, collision, scene-audit coverage, interior interaction, GPS route, and map label.

## Open Follow-Ups

- Mission definitions now live in typed `src/config/missions.ts`; keep new mission data there.
- Active mission objectives now render a distinct temporary marker on the map.
- Connected consequence missions now schedule and deliver their phone messages after a short in-game delay.
- Optional comic missions include the Golden Lotus tonic, the two-stop `pigeon_summit` civic farce,
  `mayors_parrot`, a City Hall to pet-store civic absurdity, and `goose_permit`, a City Hall
  to Boundary Meadows Drive-In permit dispute, and `raccoon_keycard`, a City Hall to Golden
  Lotus humane-lure job. All comic missions are intentionally `onboarding: { mode: 'none' }`:
  optional detours should not interrupt the main teaching path.
- Mission result modals now include a captured before/after ledger for exact cash, product,
  respect, heat, investigation, influence, crew, muscle, and permanent-income changes.
  Keep temporary income effects and saved unlocks explicit in each branch's result text.
- Declining an offer also opens an immediate outcome modal rather than silently returning the
  player to an unchanged phone screen.
- Refusing the City Hall bagman, either from the offer or in person, schedules the typed
  `tax_audit` follow-up. At the physical City Hall contact, the player can pay the named
  settlement or contest it; the latter applies its transparent, temporary penalty only to the
  selected venture.
- **Moved to `SEATATTHETABLE2.md`:** deeper follow-up missions for:
  - Amit's later mistake
  - arsonist revenge
  - Black Market Trade investigation
  - hostile press after aggressive interview
- Add full browser coverage for the mission flows.
