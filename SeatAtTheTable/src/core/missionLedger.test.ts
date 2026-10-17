import { describe, expect, it } from 'vitest';
import { describeMissionLedger, foldMissionLedger, openMissionLedger, rebaseMissionLedger } from './missionLedger';
import type { OutcomeSnapshot } from './missionLedger';

function snapshot(overrides: Partial<OutcomeSnapshot> = {}): OutcomeSnapshot {
  return { cash:1000, product:0, respect:0, heat:15, investigation:0, influence:0, muscle:0, crew:0, investorPenalty:0, ...overrides };
}

describe('mission outcome ledger', function () {
  it('reports only what the mission choices changed, not passive drift while travelling', function () {
    const accepted = openMissionLedger(snapshot());
    const travelled = foldMissionLedger(accepted, snapshot());
    const atCityHall = rebaseMissionLedger(travelled, snapshot({ cash:1800, heat:14 }));
    const afterCivicChoice = foldMissionLedger(atCityHall, snapshot({ cash:1800, heat:14, respect:5 }));
    const atHerbalist = rebaseMissionLedger(afterCivicChoice, snapshot({ cash:2400, heat:13, respect:5 }));

    expect(describeMissionLedger(atHerbalist, snapshot({ cash:2540, heat:8, respect:5 }))).toEqual(['+$140', 'respect +5', 'heat -5']);
  });

  it('keeps effects applied the moment a mission is accepted', function () {
    const accepted = openMissionLedger(snapshot({ cash:1000 }));

    expect(describeMissionLedger(accepted, snapshot({ cash:700 }))).toEqual(['-$300']);
  });

  it('reports nothing when the mission changed nothing', function () {
    const ledger = foldMissionLedger(openMissionLedger(snapshot()), snapshot());

    expect(describeMissionLedger(ledger, snapshot({ cash:5000 }))).toEqual([]);
  });

  it('shows a permanent income penalty as a negative percentage', function () {
    const ledger = openMissionLedger(snapshot());

    expect(describeMissionLedger(ledger, snapshot({ investorPenalty:0.1 }))).toEqual(['permanent income -10%']);
  });
});
