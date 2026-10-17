import { describe, expect, it } from 'vitest';
import { choiceDelta, describeMissionLedger, foldMissionLedger, openMissionLedger, rebaseMissionLedger, reconcileResultText } from './missionLedger';
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

  it('measures only the choice in progress, not earlier stages', function () {
    const earlierStage = foldMissionLedger(openMissionLedger(snapshot()), snapshot({ respect:5 }));
    const choosing = rebaseMissionLedger(earlierStage, snapshot({ respect:5 }));

    expect(choiceDelta(choosing, snapshot({ respect:13 })).respect).toBe(8);
  });

  it('shows a permanent income penalty as a negative percentage', function () {
    const ledger = openMissionLedger(snapshot());

    expect(describeMissionLedger(ledger, snapshot({ investorPenalty:0.1 }))).toEqual(['permanent income -10%']);
  });
});

describe('reconciling result text with what actually changed', function () {
  function delta(overrides: Partial<OutcomeSnapshot> = {}): OutcomeSnapshot {
    return { cash:0, product:0, respect:0, heat:0, investigation:0, influence:0, muscle:0, crew:0, investorPenalty:0, ...overrides };
  }

  it('keeps clauses that were true', function () {
    expect(reconcileResultText('respect +12; heat -4; pigeon truce recorded', delta({ respect:12, heat:-4 }))).toBe('respect +12; heat -4; pigeon truce recorded');
  });

  it('corrects a capped change to the amount that really moved', function () {
    expect(reconcileResultText('respect +18; heat +16; arson employer punished', delta({ respect:18, heat:3.4 }))).toBe('respect +18; heat +3; arson employer punished');
  });

  it('drops a clause when nothing moved', function () {
    expect(reconcileResultText('heat -6; protected Herald source recorded', delta({ heat:-0.2 }))).toBe('protected Herald source recorded');
  });

  it('corrects money spent, lost and gained', function () {
    expect(reconcileResultText('$1,600 spent; 1 muscle lost; heat +30; hit failed', delta({ cash:-450, muscle:0, heat:30 }))).toBe('$450 spent; heat +30; hit failed');
    expect(reconcileResultText('$1,100 gained; respect +10', delta({ cash:1100, respect:10 }))).toBe('$1,100 gained; respect +10');
  });

  it('corrects counted losses', function () {
    expect(reconcileResultText('50 product lost; investigation -8', delta({ product:-12, investigation:-8 }))).toBe('12 product lost; investigation -8');
  });

  it('leaves non-numeric clauses alone, even ones that mention a stat', function () {
    expect(reconcileResultText('Black Market Trade unlocked; investigation +6; airfield route recorded', delta({ investigation:6 }))).toBe('Black Market Trade unlocked; investigation +6; airfield route recorded');
    expect(reconcileResultText('family loyalty +2; legit income -25% for 2 minutes', delta())).toBe('family loyalty +2; legit income -25% for 2 minutes');
  });

  it('never returns an empty result', function () {
    expect(reconcileResultText('heat -6', delta())).toBe('no change');
  });
});
