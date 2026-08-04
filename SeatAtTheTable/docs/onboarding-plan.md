# Progressive Onboarding Plan

## Product rule

Onboarding is learn-as-you-go teaching. The player learns a system at the moment a decision makes that system useful, through a short explanation and a concrete next action. It should feel like the game is noticing what the player is trying to do, not like a manual has been opened.

The advisor briefing is no longer the primary teacher. The HUD panel is a small, contextual street lesson feed: it points to the most important next action, explains why it matters, and routes the player to the relevant screen, map target, or mission objective. Mission dialogue, phone messages, map markers, and result messages carry the deeper teaching.

## What deserves onboarding

Content deserves onboarding when the player could reasonably fail to understand a new rule, a new decision, or the consequence of an action. This includes:

- A new system or resource: banking, heat management, territory, crew assignment, research, production, or a new unlock path.
- A new interaction pattern: a multi-stage mission, map travel to a target, interior resolution, GPS, or a choice whose result changes future play.
- A high-cost or irreversible decision: permanent income cuts, gang war, mission failure, or a major unlock.
- A bottleneck the player has reached but cannot yet diagnose from the current UI.

Do not add onboarding just because content is new. A new story beat, a variation on an existing choice, a repeatable event, a small balance change, or a feature whose controls already explain themselves does not need a lesson. Those should use normal labels, feedback, and result messages.

## Required classification for missions

Every mission definition must declare one onboarding mode:

- `mission`: the mission is the first guided teaching path for a system, or it has a meaningful sequence the player should be led through.
- `contextual`: the mission reinforces an existing system when the related pressure or decision appears. It may need a small advisor card, but it should not create a separate tutorial chain.
- `none`: the mission is primarily narrative or a variation on known play. Use clear objectives and consequences, but do not add tutorial copy.

The `teaches` field names the mechanic or decision so a reviewer can check that the mission has a teaching path. It is not player-facing copy.

## Required classification for features

When adding a feature outside the mission system, answer these questions in the feature's plan or pull request:

1. What can the player misunderstand or lose by not knowing this feature?
2. What is the first useful moment when that knowledge is needed?
3. Which existing surface teaches it: mission, map, phone, result message, or contextual advisor card?
4. What is the single next action the player can take?
5. Why is a new lesson necessary instead of a clearer label or result message?

If the feature has no credible answer to the first question, it does not need onboarding. If it does, add the teaching path before calling the feature complete.

## Implementation rules

- Keep one lesson focused on one decision. Do not explain an entire subsystem in a card.
- Prefer a mission when the player needs to travel, make a consequential choice, or see a mechanic resolve over time.
- Prefer a contextual card when the player is already in the relevant screen and only needs a nudge or diagnosis.
- Suppress a lesson after the player completes or explicitly declines its teaching path, unless the feature has materially changed.
- Every lesson needs a route or action. A card that only describes a feature is an advisor briefing with new wording.
- Add a pure unit test for each new priority rule and browser coverage when the lesson changes a real interaction.
- Keep the advisor feed short. It is a prioritized set of current lessons and pressures, not a backlog of every available feature.

## Current teaching paths

| Path | Mode | Teaches |
| --- | --- | --- |
| Early-game sequence | `mission` | Cart, production, crew, first venture, and first corner |
| `home_safe_robbery` | `mission` | Banking and cash safety |
| Empire contextual cards | `contextual` | Heat, staffing, research, opening a venture |
| Map contextual card | `contextual` | Moving full product to active corners |
| Lab contextual card | `contextual` | Diagnosing empty staffed corners |

The early-game sequence is implemented in `onboarding.ts` (`getOnboardingSteps`): cart →
crew → lab → first corner, one step at a time, driven off live state rather than a fixed
script. The next slice is mission-specific teaching paths for the missions tagged `mission`
in `missionEventPool` that don't yet have a dedicated lesson beyond the generic fallback
copy — `stolen_shipment`, `alderman_fixer`, `turf_war`, `first_heist` — followed by browser
coverage for each, on the pattern in `e2e/onboarding.e2e.ts`.

When a new mission or feature is added, update this table if it owns a teaching path. If it is intentionally `none`, record that decision in the mission definition or feature plan so the omission is deliberate.
