export type VentureCategory = 'legit' | 'street';

export type UnlockRule =
  | { type: 'start' }
  | { type: 'cash'; value: number }
  | { type: 'respect'; value: number }
  | { type: 'family'; value: number };

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
  reinvestedIncome: number;
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

export interface Point {
  x: number;
  y: number;
}

// LEGAL: Axis-aligned collision box used by the map's building layout.
export interface Solid {
  x: number;
  y: number;
  hw: number;
  hd: number;
}

// LEGAL: Procedurally-placed decorative map fill: green space, empty lot, or
// LEGAL: a generic building. Discriminated on kind.
export type FillerItem =
  | { kind: 'park'; x0: number; y0: number; x1: number; y1: number }
  | { kind: 'lot'; x0: number; y0: number; x1: number; y1: number }
  | { kind: 'building'; x: number; y: number; w: number; d: number; h: number; hue: number };

export interface ProceduralNPC {
  name: string;
  disposition: string;
}

export interface InteriorState {
  kind: string;
  refId: string;
  name: string;
  returnX: number;
  returnY: number;
  returnDistrict: string;
}

export interface StockPosition {
  shares: number;
  avgCost: number;
}

export interface ModalButton {
  label: string;
  secondary?: boolean;
  onClick?: () => void;
}

export interface ModalOptions {
  eyebrow?: string;
  title?: string;
  body?: string;
  stamp?: string;
  buttons?: ModalButton[];
}

export interface DialogueChoice {
  label: string;
  next: string | null;
  effect?: () => void;
}

export interface DialogueNode {
  text: string;
  choices: DialogueChoice[];
}

export interface DialogueTree {
  npcName: string;
  nodes: Record<string, DialogueNode>;
}

// LEGAL: Central mutable game state. Keyed maps (waypoints, parkedCarPos,
// LEGAL: portfolio, market*) are indexed by district or stock symbol at runtime.
export interface GameState {
  cash: number;
  respect: number;
  heat: number;
  territoryTier: number;
  negotiateTier: number;
  muscleCount: number;
  ratCount: number;
  bribeOn: boolean;
  prestigeCount: number;
  seenMilestones: Set<string>;
  started: boolean;
  lastTick: number;
  nextEventAt: number;
  playSeconds: number;
  investorPenalty: number;
  procNpc: ProceduralNPC;
  bank: number;
  nextHeistAt: number;
  ownedCars: string[];
  equippedCar: string | null;
  ownedProperties: string[];
  currentDistrict: string;
  product: number;
  productLevel: number;
  currentInterior: InteriorState | null;
  inVehicle: boolean;
  waypoints: Record<string, Point | null>;
  parkedCarPos: Record<string, Point>;
  influence: number;
  influenceBuys: number;
  electedOffice: boolean;
  nextCampaignAt: number;
  nextWarAt: number;
  campaignActive: boolean;
  campaignEndAt: number;
  campaignStyle: string;
  portfolio: Record<string, StockPosition>;
  marketPrices: Record<string, number>;
  marketHistory: Record<string, number[]>;
  nextMarketTickAt: number;
  financeView: string;
  activeStock: string | null;
  currentNews: string[];
  newsQueue: string[];
  nextNewsAt: number;
}
