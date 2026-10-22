import type { MissionObjective, MissionOutcome, MissionSaveState, MissionState } from '../config/types';

export function missionSaveDefaults(input?: Partial<MissionSaveState> | null): MissionSaveState {
  return {
    eventRepeats: input?.eventRepeats ?? {},
    eventHistory: input?.eventHistory ?? {},
    activeMissions: input?.activeMissions ?? {},
    completedMissions: input?.completedMissions ?? {},
    worldMemory: input?.worldMemory ?? {},
  };
}

export function recordEventOffer(save: MissionSaveState, eventId: string): number {
  const nextCount = (save.eventRepeats[eventId] ?? 0) + 1;
  save.eventRepeats[eventId] = nextCount;
  save.eventHistory[eventId] = 'offered';
  return nextCount;
}

// LEGAL: A one-off mission is offered once, and if you turn it down, once more; after a second no
// LEGAL: it's gone. It used to come back with the same words every time you declined it.
export const UNIQUE_EVENT_OFFERS = 2;
export function canOfferUniqueEvent(save: MissionSaveState, eventId: string): boolean {
  const status = save.eventHistory[eventId];
  if(!status) return true;
  return (status === 'declined' || status === 'failed') && (save.eventRepeats[eventId] ?? 0) < UNIQUE_EVENT_OFFERS;
}

// LEGAL: Phone messages waiting for an answer. Only one waits at a time, so the phone doesn't fill up.
export function pendingOfferCount(save: MissionSaveState): number {
  return Object.entries(save.eventHistory).filter(([id, status]) => status === 'offered' && !save.activeMissions[id]).length;
}

export function canOfferRepeatableEvent(save: MissionSaveState, eventId: string, maxRepeats?: number): boolean {
  if(maxRepeats === undefined) return true;
  return (save.eventRepeats[eventId] ?? 0) < maxRepeats;
}

export function activeMissionCount(save: MissionSaveState): number {
  return Object.values(save.activeMissions).filter(function(mission){ return mission.status === 'active'; }).length;
}

export function scheduleDelayedMission(save: MissionSaveState, key: string, now: number, delaySeconds: number): void {
  save.worldMemory[key] = now + delaySeconds;
}

export function delayedMissionReady(save: MissionSaveState, key: string, now: number, legacyCondition: boolean): boolean {
  const scheduledAt = save.worldMemory[key];
  return typeof scheduledAt === 'number' ? now >= scheduledAt : legacyCondition;
}

export function missionCompleted(save: MissionSaveState, missionId: string): boolean {
  return save.eventHistory[missionId] === 'completed' || !!save.completedMissions[missionId];
}

export function startMission(save: MissionSaveState, mission: MissionState): MissionState {
  save.activeMissions[mission.id] = mission;
  save.eventHistory[mission.id] = 'accepted';
  return mission;
}

export function declineMission(save: MissionSaveState, missionId: string): void {
  save.eventHistory[missionId] = 'declined';
  delete save.activeMissions[missionId];
}

export function advanceMissionStage(save: MissionSaveState, missionId: string, stageId: string, updatedAt: number, objective: MissionObjective | null): MissionState | null {
  const mission = save.activeMissions[missionId];
  if(!mission) return null;
  mission.stageId = stageId;
  mission.updatedAt = updatedAt;
  mission.objective = objective;
  return mission;
}

export function completeMission(save: MissionSaveState, missionId: string, result: string, completedAt: number): MissionOutcome | null {
  const mission = save.activeMissions[missionId];
  if(!mission) return null;
  mission.status = 'completed';
  const outcome = { id:missionId, result, completedAt };
  save.completedMissions[missionId] = outcome;
  save.eventHistory[missionId] = 'completed';
  delete save.activeMissions[missionId];
  return outcome;
}
