import { describe, expect, it } from 'vitest';
import {
  activeMissionCount,
  advanceMissionStage,
  applyConsequenceOnce,
  canOfferRepeatableEvent,
  canOfferUniqueEvent,
  completeMission,
  delayedMissionReady,
  declineMission,
  missionCompleted,
  missionSaveDefaults,
  recordEventOffer,
  scheduleDelayedMission,
  startMission,
} from './missions';

describe('mission state helpers', function () {
  it('holds delayed consequences until their scheduled story beat while keeping old saves playable', function () {
    const save = missionSaveDefaults();

    expect(delayedMissionReady(save, 'amitDueAt', 100, true)).toBe(true);
    scheduleDelayedMission(save, 'amitDueAt', 100, 90);
    expect(delayedMissionReady(save, 'amitDueAt', 189, true)).toBe(false);
    expect(delayedMissionReady(save, 'amitDueAt', 190, true)).toBe(true);
  });

  it('migrates old saves with empty mission fields', function () {
    const save = missionSaveDefaults(null);

    expect(save.eventRepeats).toEqual({});
    expect(save.eventHistory).toEqual({});
    expect(save.activeMissions).toEqual({});
    expect(save.completedMissions).toEqual({});
    expect(save.worldMemory).toEqual({});
  });

  it('blocks a unique event after acceptance or completion but allows a declined offer to return later', function () {
    const save = missionSaveDefaults();

    expect(canOfferUniqueEvent(save, 'tribune')).toBe(true);
    startMission(save, { id:'tribune', stageId:'studio', status:'active', startedAt:10, updatedAt:10, objective:null });
    expect(canOfferUniqueEvent(save, 'tribune')).toBe(false);
    completeMission(save, 'tribune', 'professional', 20);
    expect(canOfferUniqueEvent(save, 'tribune')).toBe(false);

    declineMission(save, 'investor');
    expect(canOfferUniqueEvent(save, 'investor')).toBe(true);
  });

  it('tracks repeat counts for repeatable event variants', function () {
    const save = missionSaveDefaults();

    expect(recordEventOffer(save, 'inspector')).toBe(1);
    expect(recordEventOffer(save, 'inspector')).toBe(2);
    expect(save.eventRepeats.inspector).toBe(2);
    expect(canOfferRepeatableEvent(save, 'inspector', 2)).toBe(false);
  });

  it('starts, advances, and completes a mission exactly once', function () {
    const save = missionSaveDefaults();
    const objective = { label:'Windhaven Herald HQ', district:'hub', placeId:'mission-herald', x:4980, y:360 };

    startMission(save, { id:'tribune', stageId:'travel', status:'active', startedAt:10, updatedAt:10, objective });
    expect(activeMissionCount(save)).toBe(1);

    advanceMissionStage(save, 'tribune', 'interview', 15, null);
    expect(save.activeMissions.tribune.stageId).toBe('interview');

    const outcome = completeMission(save, 'tribune', 'humorous', 30);
    expect(outcome?.result).toBe('humorous');
    expect(missionCompleted(save, 'tribune')).toBe(true);
    expect(activeMissionCount(save)).toBe(0);
    expect(completeMission(save, 'tribune', 'duplicate', 31)).toBeNull();
  });

  it('treats saved completed outcomes as completed mission history', function () {
    const save = missionSaveDefaults({ completedMissions:{ first_heist:{ id:'first_heist', result:'crew', completedAt:40 } } });

    expect(missionCompleted(save, 'first_heist')).toBe(true);
    expect(missionCompleted(save, 'stolen_shipment')).toBe(false);
  });

  it('applies world consequences once', function () {
    const save = missionSaveDefaults();
    let heat = 0;

    expect(applyConsequenceOnce(save, 'kowalskiBlackmail', function(){ heat += 12; })).toBe(true);
    expect(applyConsequenceOnce(save, 'kowalskiBlackmail', function(){ heat += 12; })).toBe(false);
    expect(heat).toBe(12);
  });
});
