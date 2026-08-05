import { describe, expect, it } from 'vitest';
import { missionEventPool } from './missions';

describe('mission definitions', function () {
  it('gives every mission a unique id and an explicit onboarding responsibility', function () {
    expect(new Set(missionEventPool.map(function(mission){ return mission.id; })).size).toBe(missionEventPool.length);
    expect(missionEventPool.every(function(mission){ return mission.onboarding.mode === 'mission' || mission.onboarding.mode === 'contextual' || mission.onboarding.mode === 'none'; })).toBe(true);
  });

  it('requires every major mission to meet the reusable playable-story quality contract', function () {
    const majorMissionIds = ['tribune', 'home_safe_robbery', 'stolen_shipment', 'alderman_fixer', 'turf_war', 'first_heist'];
    const majorMissions = missionEventPool.filter(function(mission){ return majorMissionIds.includes(mission.id); });

    expect(majorMissions).toHaveLength(majorMissionIds.length);
    expect(majorMissions.every(function(mission){
      const quality = mission.quality;
      return quality !== undefined
        && quality.decisionBeats >= 2
        && quality.savesDistinctOutcome
        && quality.hasLaterConsequenceOrUnlock
        && quality.hasInPersonSceneBeyondOneModal;
    })).toBe(true);
  });
});
