export type VentureCategory = 'legit' | 'street';

export type UnlockRule =
  | { type: 'start' }
  | { type: 'cash'; value: number }
  | { type: 'respect'; value: number };

export interface BusinessConfig {
  id: string;
  name: string;
  flavor: string;
  category: VentureCategory;
  icon: string;
  baseCost: number;
  researchCost: number;
  baseIncome: number;
  heatPerLevel?: number;
  unlock: UnlockRule;
  crewBaseCost: number;
  managerLevelReq: number;
  managerName: string;
}

export interface Business extends BusinessConfig {
  level: number;
  crew: number;
  manager: boolean;
  researched: boolean;
  tempMult: number;
  tempMultExpire: number;
}

export interface Rank {
  respect: number;
  title: string;
}

export interface Milestone {
  id: string;
  title: string;
  body: string;
}

export interface FamilyTier {
  name: string;
  desc: string;
}

export interface Car {
  id: string;
  name: string;
  icon: string;
  cost: number;
  speedMult: number;
  heistBonus: number;
  respectPerSec: number;
  color: string;
  len: number;
  wid: number;
}

export interface Property {
  id: string;
  name: string;
  icon: string;
  cost: number;
  incomePerSec: number;
}

export interface LocalBusiness {
  id: string;
  name: string;
  icon: string;
  owner: string;
  robBase: number;
  extortIncome: number;
  extortHeat: number;
  district: string;
  x: number;
  y: number;
  extorted: boolean;
  nextRobAt: number;
}

export interface ServiceBuilding {
  id: string;
  kind: string;
  name: string;
  icon: string;
  district: string;
  x: number;
  y: number;
}

export interface District {
  id: string;
  name: string;
  homeTurf: boolean;
  control: number;
  pushCount: number;
  nextPushAt: number;
}

export interface Corner {
  id: string;
  name: string;
  district: string;
  tier: number;
  rate: number;
  consumption: number;
  dealerCost: number;
  x: number;
  y: number;
  dealer: boolean;
  busted: boolean;
  bustCooldownAt: number;
}

export interface Politician {
  id: string;
  name: string;
  role: string;
  favor: number;
  pocketed: boolean;
  desc: string;
  flavor: string;
}

export interface GangRecruit {
  id: string;
  name: string;
  trait: string;
  reqRespect: number;
  cost: number;
  bonus: string;
  inducted: boolean;
  dialogueKey: string;
  district: string;
  x: number;
  y: number;
}

export interface Stock {
  symbol: string;
  name: string;
  logo: string;
  desc: string;
  founded: number;
  fullDesc: string;
  basePrice: number;
  vol: number;
}
