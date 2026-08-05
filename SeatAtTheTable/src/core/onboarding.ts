import type { EventStatus, MissionWorldValue } from '../config/types';

export type OnboardingPanelTarget = 'empire' | 'map' | 'bank' | 'politics' | 'gang' | 'assets' | 'settings' | 'missions';
export type OnboardingActionKind = 'open' | 'missionGps';
export type OnboardingTone = 'lesson' | 'warning' | 'opportunity';
export type MissionOnboardingMode = 'mission' | 'contextual' | 'none';

export interface MissionOnboardingDefinition {
  mode: MissionOnboardingMode;
  teaches?: string;
}

export interface OnboardingMissionSnapshot {
  id: string;
  title: string;
  mode: MissionOnboardingMode;
  status: 'offered' | 'active';
  stageId?: string;
  objectiveLabel?: string;
}

export interface OnboardingAction {
  kind: OnboardingActionKind;
  label: string;
  target: OnboardingPanelTarget;
  missionId?: string;
}

export interface OnboardingStep {
  id: string;
  title: string;
  body: string;
  badge: string;
  tone: OnboardingTone;
  action: OnboardingAction;
  priority: number;
}

export interface OnboardingSnapshot {
  cash: number;
  heat: number;
  bankedCash: number;
  cartLevel: number;
  cartCrew: number;
  cartCrewNeeded: number;
  productLevel: number;
  canUpgradeLab: boolean;
  canPostFirstCorner: boolean;
  hasActiveCorner: boolean;
  missionLessons: OnboardingMissionSnapshot[];
  eventHistory: Record<string, EventStatus>;
  activeMissions: string[];
  completedMissions: string[];
  worldMemory: Record<string, MissionWorldValue>;
  canResearchCornerStore: boolean;
  hasUnlockedUnopenedVenture: boolean;
  unopenedVentureName?: string;
  hasUnderstaffedCart: boolean;
  hasUnderstaffedVenture: boolean;
  understaffedVentureName?: string;
  product: number;
  productCap: number;
  activeCornerCount: number;
  availableCornerCount: number;
}

function hasMissionState(snapshot: OnboardingSnapshot, missionId: string): boolean {
  return snapshot.activeMissions.includes(missionId) || snapshot.completedMissions.includes(missionId);
}

interface MissionLessonCopy {
  offered: string;
  active: Record<string, string>;
}

const MISSION_LESSON_COPY: Record<string, MissionLessonCopy> = {
  stolen_shipment:{
    offered:'Missing cargo is a choice between a quick recovery and a new, risky income stream. Open Missions to begin at the docks.',
    active:{
      travel:'Start with Dockmaster Bell. He knows who moved the shipment and where to look next.',
      chopshop:'Deke has the cargo. Recovering it helps now; partnering with him unlocks Black Market Trade, with more case risk.',
      airfield:'At Kettle Flats, take the guaranteed street payout or keep the runway route as Black Market Trade and accept more case risk.',
    },
  },
  alderman_fixer:{
    offered:'This favor teaches how political access is earned. Open Missions when you are ready to meet the City Hall bagman.',
    active:{
      travel:'The bagman will name the cost of getting City Hall on your side.',
      railyard:'At the railyard, choose whether to pay workers or apply pressure. Either route can unlock Political Favors.',
    },
  },
  turf_war:{
    offered:'Territory pressure needs an answer. Open Missions to defend Devlin before the dispute reaches your corners.',
    active:{
      travel:'Defend the corner first. The way you hold it changes the heat you carry into the next meeting.',
      capo:'At Marigold, a truce cools the city down; an assassination can win West Side control but carries a steep risk.',
      lodge:'Ridgewood is neutral ground. A narrow truce lowers heat; exposing the capo’s weak crew wins West Side control at a cost.',
    },
  },
  first_heist:{
    offered:'This is the first heist with preparation. Open Missions to case the bank before selecting an approach.',
    active:{
      travel:'Case First Windhaven Trust: observe guards, exits, and cameras before choosing the approach.',
      escape:'Your approach is set. At the bank, decide whether to push for the vault or leave safely with smaller cashier bundles.',
    },
  },
};

function missionLessonBody(mission: OnboardingMissionSnapshot): string {
  const copy = MISSION_LESSON_COPY[mission.id];
  if(!copy) return mission.status === 'active'
    ? `This mission is active. ${mission.objectiveLabel ? `Follow the objective to ${mission.objectiveLabel}.` : 'Open Missions to review the next objective.'}`
    : 'This mission introduces a new part of the operation. Open it when you are ready to take the next step.';
  if(mission.status === 'offered') return copy.offered;
  return copy.active[mission.stageId ?? 'travel']
    ?? `This mission is active. ${mission.objectiveLabel ? `Follow the objective to ${mission.objectiveLabel}.` : 'Open Missions to review the next objective.'}`;
}

export function getOnboardingSteps(snapshot: OnboardingSnapshot): OnboardingStep[] {
  const steps: OnboardingStep[] = [];
  const bankLessonOffered = snapshot.eventHistory.home_safe_robbery === 'offered';
  const bankLessonActive = snapshot.activeMissions.includes('home_safe_robbery');
  const bankLessonDone = hasMissionState(snapshot, 'home_safe_robbery') || snapshot.worldMemory.ignoredBankLesson === true;

  if(snapshot.cartLevel === 0){
    steps.push({
      id:'early-open-cart',
      title:'Open your first front',
      body:'The cart is your starting business. Open it to create your first reliable income and begin building the operation.',
      badge:'First move',
      tone:'lesson',
      action:{ kind:'open', label:'Open empire', target:'empire' },
      priority:150,
    });
  } else if(snapshot.cartCrew < snapshot.cartCrewNeeded){
    steps.push({
      id:'early-staff-cart',
      title:'Put someone on the cart',
      body:'An open front needs crew to run at full strength. Assign the cart its first worker before you spend on expansion.',
      badge:'First crew',
      tone:'lesson',
      action:{ kind:'open', label:'Assign crew', target:'empire' },
      priority:145,
    });
  } else if(snapshot.productLevel === 0 && snapshot.canUpgradeLab){
    steps.push({
      id:'early-upgrade-lab',
      title:'Build your supply chain',
      body:'The Lab makes product for street dealers. Upgrade it when you can so a future corner has something to sell.',
      badge:'Next system',
      tone:'lesson',
      action:{ kind:'open', label:'Upgrade Lab', target:'empire' },
      priority:140,
    });
  } else if(snapshot.productLevel > 0 && !snapshot.hasActiveCorner && snapshot.canPostFirstCorner){
    steps.push({
      id:'early-post-first-corner',
      title:'Put your first corner to work',
      body:'The Lab is producing. Post a dealer on the map to turn stored product into street income.',
      badge:'First corner',
      tone:'lesson',
      action:{ kind:'open', label:'Open map', target:'map' },
      priority:140,
    });
  }

  snapshot.missionLessons.forEach(function(mission){
    if(mission.id === 'home_safe_robbery' || mission.mode !== 'mission') return;
    const active = mission.status === 'active';
    steps.push({
      id:`mission-${mission.status}-${mission.id}`,
      title:mission.title,
      body:missionLessonBody(mission),
      badge:active ? 'Active mission' : 'New mission',
      tone:'lesson',
      action:active && mission.objectiveLabel
        ? { kind:'missionGps', label:'Set GPS', target:'missions', missionId:mission.id }
        : { kind:'open', label:'Open Missions', target:'missions' },
      priority:active ? 170 : 165,
    });
  });

  if(bankLessonActive){
    steps.push({
      id:'bank-lesson-active',
      title:'Protect your cash',
      body:'Cash on hand is exposed. Follow the bank lesson and move money somewhere raids and street theft cannot grab it.',
      badge:'Active lesson',
      tone:'lesson',
      action:{ kind:'missionGps', label:'Set GPS', target:'missions', missionId:'home_safe_robbery' },
      priority:180,
    });
  } else if(bankLessonOffered){
    steps.push({
      id:'bank-lesson-offered',
      title:'The bank lesson is waiting',
      body:'You have a phone message about why loose cash is unsafe. Open Missions and take it before that money walks away.',
      badge:'New lesson',
      tone:'lesson',
      action:{ kind:'open', label:'Open Missions', target:'missions' },
      priority:175,
    });
  } else if(!bankLessonDone && snapshot.cash >= 300 && snapshot.bankedCash <= 0){
    steps.push({
      id:'bank-lesson-risk',
      title:'Too much cash is sitting loose',
      body:'You are carrying enough cash to matter, but none of it is banked. Expect the bank lesson to matter as soon as it comes in.',
      badge:'Watch this',
      tone:'warning',
      action:{ kind:'open', label:'Open Bank', target:'bank' },
      priority:125,
    });
  }

  if(snapshot.heat > 70){
    steps.push({
      id:'heat-pressure',
      title:'Heat is getting loud',
      body:'Heat above 70 means the city is paying attention. Bribes, laying low, and informants are the fast ways to cool it.',
      badge:'Pressure',
      tone:'warning',
      action:{ kind:'open', label:'Reduce heat', target:'empire' },
      priority:110,
    });
  }

  if(snapshot.hasUnderstaffedCart){
    steps.push({
      id:'cart-staffing',
      title:'Staff the cart first',
      body:'The cart is your first front. If it is short on crew, its return drops immediately.',
      badge:'First front',
      tone:'lesson',
      action:{ kind:'open', label:'Assign crew', target:'empire' },
      priority:105,
    });
  } else if(snapshot.hasUnderstaffedVenture){
    steps.push({
      id:'venture-staffing',
      title:'Crew are stretched thin',
      body:`${snapshot.understaffedVentureName ?? 'A venture'} is short on crew, so you are paying for a front that cannot work at full strength.`,
      badge:'Operations',
      tone:'warning',
      action:{ kind:'open', label:'Assign crew', target:'empire' },
      priority:100,
    });
  }

  if(snapshot.canResearchCornerStore){
    steps.push({
      id:'corner-store-research',
      title:'Research unlocks the next front',
      body:'The Corner Store is affordable to research now. Research is the planning spend that turns a locked business into something you can open.',
      badge:'Expansion',
      tone:'opportunity',
      action:{ kind:'open', label:'Research it', target:'empire' },
      priority:90,
    });
  }

  if(snapshot.hasUnlockedUnopenedVenture){
    steps.push({
      id:'open-venture',
      title:'Open the next venture',
      body:`${snapshot.unopenedVentureName ?? 'A venture'} is already unlocked. Opening it turns an unlock into real capacity and income.`,
      badge:'Opportunity',
      tone:'opportunity',
      action:{ kind:'open', label:'Open venture', target:'empire' },
      priority:80,
    });
  }

  if(snapshot.product >= snapshot.productCap && snapshot.activeCornerCount < snapshot.availableCornerCount){
    steps.push({
      id:'product-cap',
      title:'Put product on the street',
      body:'Your stock is full while corners are still idle. The map is where you post dealers and turn inventory into cash flow.',
      badge:'Map lesson',
      tone:'lesson',
      action:{ kind:'open', label:'Open map', target:'map' },
      priority:75,
    });
  }

  if(snapshot.activeCornerCount > 0 && snapshot.product <= 0){
    steps.push({
      id:'empty-corners',
      title:'Dealers need supply',
      body:'Corners are staffed but there is nothing to sell. Upgrade the Lab so active corners are not standing around empty-handed.',
      badge:'Bottleneck',
      tone:'warning',
      action:{ kind:'open', label:'Upgrade Lab', target:'empire' },
      priority:70,
    });
  }

  if(steps.length === 0){
    steps.push({
      id:'quiet-street',
      title:'Nothing urgent is breaking',
      body:'That usually means you can choose your own next move: expand a front, claim turf, or build a safer cash buffer.',
      badge:'Quiet street',
      tone:'opportunity',
      action:{ kind:'open', label:'Review empire', target:'empire' },
      priority:10,
    });
  }

  return steps.sort(function(a, b){ return b.priority - a.priority; }).slice(0, 4);
}
