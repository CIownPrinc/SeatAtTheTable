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

// LEGAL: A retail brand (see config/brands). Vehicles and properties belong to a brand;
// LEGAL: each brand gets a themed building on the map where its stock is bought in person.
// LEGAL: `online` items are also orderable from the phone (AutoMart / Realty); the rest
// LEGAL: are dealer-only. `caveat` is the theme's downside, wired into gameplay later.
// LEGAL: A named crew holding turf in one district. Territory used to be an anonymous
// LEGAL: "rival"; the minimap overlay needs a name and a color per holder.
export interface RivalGang {
  id: string;
  name: string;
  short: string;
  district: string;
  color: string;
  blurb: string;
}

// LEGAL: Who holds a block. 'yours' and 'rival' mirror districtStatus's buckets so the
// LEGAL: block layer can never disagree with the district-level bonuses.
export type BlockOwner = 'yours' | 'contested' | 'rival';

// LEGAL: One named block inside a district. `resistance` is the fixed order in which
// LEGAL: blocks fall to you as district control rises (0 = flips first, easiest); it is
// LEGAL: authored, not random, so the map looks the same across saves and sessions.
export interface TerritoryBlock {
  id: string;
  name: string;
  district: string;
  resistance: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Brand {
  id: string;
  name: string;
  sells: 'vehicle' | 'property';
  category: string;
  district: string;
  blurb: string;
  caveat?: string;
  // LEGAL: District-local lot position; applyMapWorldCoordinates turns x into a world x.
  x: number;
  y: number;
  // LEGAL: Cash-only lots bargain; glass showrooms do not. Gates the haggle interaction.
  haggle?: boolean;
  // LEGAL: What the counter staff say when turf status blocks or sours the sale.
  rivalLine: string;
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
  brand?: string;
  online?: boolean;
}

export interface Property {
  id: string;
  name: string;
  icon: string;
  cost: number;
  incomePerSec: number;
  brand?: string;
  online?: boolean;
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
  // LEGAL: Extortion depth: squeeze tier (1-3, bigger cut = more income + heat) and the
  // LEGAL: owner's resentment (0-100). Unmanaged resentment ends the arrangement and
  // LEGAL: burns you. Optional so existing saves/config default them at runtime.
  extortTier?: number;
  resentment?: number;
  nextRobAt: number;
}

export type MapAmenityKind = 'basketball' | 'petstore' | 'shop' | 'parkgame';

export interface MapAmenity {
  id: string;
  kind: MapAmenityKind;
  name: string;
  district: string;
  x: number;
  y: number;
  prompt: string;
}

export interface ServiceBuilding {
  id: string;
  kind: string;
  name: string;
  icon: string;
  district: string;
  x: number;
  y: number;
  // LEGAL: For bank branches (kind 'bankHome'): which config/banks account this teller
  // LEGAL: serves, so in-person deposit/withdraw here hits the right account.
  bankId?: string;
  // LEGAL: For kinds 'dealership' / 'brokerage': which config/brands stock is sold here.
  brandId?: string;
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

// LEGAL: A bank the player can hold accounts at. Banks differ by interest and by their
// LEGAL: heist profile — no passive theft, the "risk" is only about robbery: you can rob
// LEGAL: a bank in person for a payout, and deposits sit exposed if a rival robs it.
export interface Bank {
  id: string;
  name: string;
  short: string;
  interestRate: number;    // LEGAL: per-second fraction, before the hub multiplier & dt
  rateLabel: string;       // LEGAL: display bucket — 'Low' | 'Moderate' | 'High'
  heistPayoutMult: number; // LEGAL: scales what a heist here nets (wired in Phase 3)
  security: string;        // LEGAL: display bucket — 'Hardened' | 'Standard' | 'Soft'
  blurb: string;
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

export type MapZoneType = 'smallBusiness' | 'residential' | 'industrial' | 'corporate' | 'entertainment' | 'logistics' | 'street' | 'civic';

// LEGAL: Procedurally-placed decorative map fill: green space, empty lot, or
// LEGAL: a generic building. Discriminated on kind.
export type FillerItem =
  | { kind: 'park'; name: string; x0: number; y0: number; x1: number; y1: number }
  | { kind: 'lot'; x0: number; y0: number; x1: number; y1: number }
  | { kind: 'building'; zone: MapZoneType; x: number; y: number; w: number; d: number; h: number; hue: number; rot: number; style?: 'apartment' }
  // LEGAL: 'edge' = cheap background block forming the city's rough outer skyline.
  | { kind: 'edge'; x: number; y: number; w: number; d: number; h: number; hue: number; rot: number };

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

export type EventStatus = 'offered' | 'declined' | 'accepted' | 'completed' | 'failed';

export type MissionStageStatus = 'active' | 'completed' | 'failed';

export interface MissionObjective extends Point {
  label: string;
  district: string;
  placeId: string;
}

export interface MissionState {
  id: string;
  stageId: string;
  status: MissionStageStatus;
  startedAt: number;
  updatedAt: number;
  objective: MissionObjective | null;
}

export interface MissionOutcome {
  id: string;
  result: string;
  completedAt: number;
}

export type MissionWorldValue = boolean | number | string;

export interface MissionSaveState {
  eventRepeats: Record<string, number>;
  eventHistory: Record<string, EventStatus>;
  activeMissions: Record<string, MissionState>;
  completedMissions: Record<string, MissionOutcome>;
  worldMemory: Record<string, MissionWorldValue>;
}

// LEGAL: Central mutable game state. Keyed maps (waypoints, parkedCarPos,
// LEGAL: portfolio, market*) are indexed by district or stock symbol at runtime.
export interface GameState {
  cash: number;
  respect: number;
  heat: number;
  // LEGAL: The slow, sticky federal case. Fills under sustained high heat and
  // LEGAL: decays slowly (hysteresis); at 100 it triggers the raid, not `heat`.
  investigation: number;
  // LEGAL: Player-controlled "keep operations quiet" toggle: bleeds heat and
  // LEGAL: investigation fast at the cost of illegal income.
  layingLow: boolean;
  // LEGAL: playSeconds until which a citywide crackdown wave is active (0 = none).
  crackdownUntil: number;
  // LEGAL: playSeconds when the next crackdown wave may begin.
  nextCrackdownAt: number;
  territoryTier: number;
  negotiateTier: number;
  muscleCount: number;
  // LEGAL: Firearms stockpile. Required to wage war and back a territory push; armed
  // LEGAL: crew fight harder (Gang Strength) and guns are consumed/lost in the fighting.
  guns: number;
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
  // LEGAL: Per-bank balances (see config/banks). Replaces the old single `bank` number;
  // LEGAL: saved games migrate the old balance into the default bank on load.
  bankAccounts: Record<string, number>;
  selectedBank: string;
  nextHeistAt: number;
  ownedCars: string[];
  equippedCar: string | null;
  ownedProperties: string[];
  // LEGAL: playSeconds at purchase, per property id — drives waterfront appreciation.
  propertyOwnedAt: Record<string, number>;
  // LEGAL: Used cars that have broken down and need paying to repair before they drive.
  brokenCars: string[];
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
  // LEGAL: The Windhaven Wire — a SEPARATE, player-contextual city-news feed (distinct
  // LEGAL: from the RCN stock-market ticker above). Broadcasts react to the player's
  // LEGAL: own operations and can affect heat, income, and the market.
  cityNews: string[];
  nextCityNewsAt: number;
  eventRepeats: Record<string, number>;
  eventHistory: Record<string, EventStatus>;
  activeMissions: Record<string, MissionState>;
  completedMissions: Record<string, MissionOutcome>;
  worldMemory: Record<string, MissionWorldValue>;
}
