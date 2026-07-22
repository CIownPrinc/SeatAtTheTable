import type { EventStatus, MissionObjective, MissionOutcome, MissionSaveState, MissionState } from '../config/types';

export const EMPTY_MISSION_SAVE_STATE: MissionSaveState = {
  eventRepeats: {},
  eventHistory: {},
  activeMissions: {},
  completedMissions: {},
  worldMemory: {},
};

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

export function setEventStatus(save: MissionSaveState, eventId: string, status: EventStatus): void {
  save.eventHistory[eventId] = status;
}

export function canOfferUniqueEvent(save: MissionSaveState, eventId: string): boolean {
  const status = save.eventHistory[eventId];
  return !status || status === 'declined' || status === 'failed';
}

export function canOfferRepeatableEvent(save: MissionSaveState, eventId: string, maxRepeats?: number): boolean {
  if(maxRepeats === undefined) return true;
  return (save.eventRepeats[eventId] ?? 0) < maxRepeats;
}

export function activeMissionCount(save: MissionSaveState): number {
  return Object.values(save.activeMissions).filter(function(mission){ return mission.status === 'active'; }).length;
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

export function failMission(save: MissionSaveState, missionId: string, result: string, failedAt: number): MissionOutcome | null {
  const mission = save.activeMissions[missionId];
  if(!mission) return null;
  mission.status = 'failed';
  const outcome = { id:missionId, result, completedAt:failedAt };
  save.completedMissions[missionId] = outcome;
  save.eventHistory[missionId] = 'failed';
  delete save.activeMissions[missionId];
  return outcome;
}

export function applyConsequenceOnce(save: MissionSaveState, key: string, effect: () => void): boolean {
  if(save.worldMemory[key]) return false;
  effect();
  save.worldMemory[key] = true;
  return true;
}
