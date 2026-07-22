# Map And Phone Driven Mission Overhaul

## Goal

Turn random popups into mission starters that use the map, phone, interiors, NPC dialogue, and saved world memory.

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
- Expanded mission chains have initial playable implementations:
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
- Teaches:
  - cash on hand is unsafe
  - banked cash is safer from raids and street theft
  - phone bank app is for exact deposits and withdrawals
  - in-person tellers offer quick preset actions

### `first_heist`: First Real Heist

- Replaces the first simple heist prompt once respect is high enough.
- Stage 1: case First Windhaven Trust.
- Stage 2: choose approach and execute.
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

## Open Follow-Ups

- Move mission definitions out of `src/core/header.ts` into a typed config module.
- Render mission-specific temporary markers distinct from normal place markers.
- Add delayed outcome messages for missions that resolve after time passes.
- Add a mission result UX pass so every choice shows an immediate result modal or toast
  with the outcome and exact cash, heat, respect, income, case, or unlock changes.
- Add deeper follow-up missions for:
  - Amit's later mistake
  - arsonist revenge
  - Black Market Trade investigation
  - hostile press after aggressive interview
- Add full browser coverage for the mission flows.
