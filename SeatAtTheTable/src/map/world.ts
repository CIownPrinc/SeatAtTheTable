import type { MapZoneType, Point } from '../config/types';

export interface VerticalRoad {
  x: number;
  w: number;
  name: string;
}

export interface HorizontalRoad {
  y: number;
  w: number;
  name: string;
}

export interface DiagonalRoad {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  w: number;
  name: string;
}

export interface Landmark {
  id: string;
  name: string;
  district: string;
  x: number;
  y: number;
}

export interface VentureMapLot extends Point {
  district: string;
  zone: MapZoneType;
}

export type BandIndex = number | 'south';

export interface DistrictParkSlot {
  xi: number;
  yi: BandIndex;
  name: string;
}

export const VIEW_W = 760;
export const VIEW_H = 440;
export const WORLD_W = 5500;
export const WORLD_H = 1200;
export const DISTRICT_W = 1500;

export const WINDHAVEN_LANDMASS: Point[] = [
  { x: -210, y: 64 },
  { x: -42, y: -18 },
  { x: 320, y: -52 },
  { x: 780, y: -18 },
  { x: 1250, y: -70 },
  { x: 1705, y: -10 },
  { x: 2210, y: -46 },
  { x: 2760, y: -4 },
  { x: 3290, y: -58 },
  { x: 3840, y: -12 },
  { x: 4310, y: -64 },
  { x: 4770, y: -22 },
  { x: 5260, y: 18 },
  { x: 5685, y: 128 },
  { x: 5780, y: 292 },
  { x: 5660, y: 456 },
  { x: 5810, y: 650 },
  { x: 5650, y: 838 },
  { x: 5752, y: 1022 },
  { x: 5540, y: 1228 },
  { x: 5050, y: 1302 },
  { x: 4520, y: 1260 },
  { x: 4040, y: 1322 },
  { x: 3490, y: 1272 },
  { x: 2970, y: 1316 },
  { x: 2420, y: 1266 },
  { x: 1900, y: 1328 },
  { x: 1390, y: 1288 },
  { x: 900, y: 1332 },
  { x: 420, y: 1284 },
  { x: -130, y: 1224 },
  { x: -245, y: 1006 },
  { x: -120, y: 796 },
  { x: -252, y: 600 },
  { x: -96, y: 366 },
  { x: -210, y: 64 },
];

export const DISTRICT_OFFSETS: Record<string, number> = {
  devlin: 0,
  westside: 2000,
  hub: 4000,
};

export const districtSeeds: Record<string, number> = {
  devlin: 1001,
  westside: 2002,
  hub: 3003,
};

export const spawnPoints: Record<string, Point> = {
  devlin: { x: 700, y: 600 },
  westside: { x: 2700, y: 600 },
  hub: { x: 4700, y: 600 },
};

export const ventureDistricts = ['devlin', 'devlin', 'devlin', 'devlin', 'devlin', 'westside', 'westside', 'westside', 'westside', 'hub', 'hub', 'hub'];

export const ventureLots: Record<string, Point[]> = {
  devlin: [{ x: 120, y: 130 }, { x: 485, y: 130 }, { x: 915, y: 130 }, { x: 1330, y: 130 }, { x: 120, y: 450 }],
  westside: [{ x: 2120, y: 130 }, { x: 2485, y: 130 }, { x: 2915, y: 130 }, { x: 3330, y: 130 }],
  hub: [{ x: 4120, y: 130 }, { x: 4485, y: 130 }, { x: 4915, y: 130 }, { x: 5330, y: 130 }],
};

export const ventureMapLots: Record<string, VentureMapLot> = {
  cart: { district: 'devlin', x: 120, y: 130, zone: 'smallBusiness' },
  store: { district: 'devlin', x: 485, y: 130, zone: 'smallBusiness' },
  laundromat: { district: 'devlin', x: 915, y: 130, zone: 'smallBusiness' },
  backroom_cards: { district: 'devlin', x: 1330, y: 130, zone: 'street' },
  garage: { district: 'westside', x: 2120, y: 130, zone: 'industrial' },
  cab: { district: 'westside', x: 2485, y: 130, zone: 'logistics' },
  chop_ring: { district: 'westside', x: 2915, y: 130, zone: 'street' },
  restaurant: { district: 'devlin', x: 120, y: 450, zone: 'smallBusiness' },
  lounge: { district: 'hub', x: 4485, y: 450, zone: 'entertainment' },
  wire_network: { district: 'hub', x: 4915, y: 450, zone: 'street' },
  realestate: { district: 'hub', x: 5330, y: 450, zone: 'corporate' },
  syndicate_logistics: { district: 'westside', x: 3330, y: 130, zone: 'logistics' },
  family_office: { district: 'hub', x: 4120, y: 750, zone: 'corporate' },
};

export const namedBuildingLots: Record<string, Point> = {
  bankHome: { x: 485, y: 450 },
  cardealer: { x: 915, y: 450 },
  realty: { x: 1330, y: 450 },
  patel: { x: 485, y: 750 },
  pawn: { x: 915, y: 750 },
  herbalist: { x: 1330, y: 750 },
  bar: { x: 485, y: 1030 },
  chopshop: { x: 2120, y: 450 },
  liquor: { x: 3330, y: 450 },
  jewelers: { x: 4485, y: 450 },
  marlowe: { x: 4915, y: 450 },
  cityhall: { x: 5330, y: 450 },
  heistTarget: { x: 4120, y: 750 },
};

export const landmarks: Landmark[] = [
  { id: 'devlinHall', name: 'DEVLIN HALL', district: 'devlin', x: 125, y: 820 },
  { id: 'ciceroWorks', name: 'CICERO WORKS', district: 'westside', x: 2125, y: 850 },
];

export const districtParkSlots: Record<string, DistrictParkSlot[]> = {
  devlin: [
    { xi: 0, yi: 'south', name: 'INDIAN BOUNDARY PARK' },
    { xi: 2, yi: 'south', name: 'ROCKWELL GREEN' },
    { xi: 3, yi: 'south', name: 'DEVLIN PLAYLOT' },
  ],
  westside: [
    { xi: 0, yi: 'south', name: 'CICERO GREEN' },
    { xi: 1, yi: 2, name: 'PULASKI COMMONS' },
    { xi: 2, yi: 'south', name: 'CANAL YARD PARK' },
    { xi: 3, yi: 2, name: 'CERMAK POCKET PARK' },
  ],
  hub: [
    { xi: 0, yi: 1, name: 'MILLENNIUM PARK' },
    { xi: 1, yi: 'south', name: 'WABASH PLAZA' },
    { xi: 2, yi: 'south', name: 'RIVERWALK LAWN' },
    { xi: 3, yi: 'south', name: 'LAKEFRONT SQUARE' },
  ],
};

export const roadNetwork: { vertical: VerticalRoad[]; horizontal: HorizontalRoad[]; diagonal: DiagonalRoad[] } = {
  vertical: [
    { x: 270, w: 74, name: 'Rockwell Avenue' },
    { x: 700, w: 74, name: 'Devlin Street' },
    { x: 1130, w: 74, name: 'Ashland Row' },
    { x: 2270, w: 74, name: 'Cicero Avenue' },
    { x: 2700, w: 74, name: 'Pulaski Road' },
    { x: 3130, w: 74, name: 'Canal Yard Drive' },
    { x: 4270, w: 74, name: 'LaSalle Street' },
    { x: 4700, w: 74, name: 'Wabash Avenue' },
    { x: 5130, w: 74, name: 'Lakefront Drive' },
  ],
  horizontal: [
    { y: 300, w: 74, name: 'Grand Avenue' },
    { y: 600, w: 74, name: 'Roosevelt Road' },
    { y: 900, w: 74, name: 'Cermak Road' },
  ],
  // LEGAL: Diagonals used sparingly and only WITHIN a single district: every endpoint
  // LEGAL: is a real grid intersection (vertical x by horizontal y), so they never
  // LEGAL: dead-end, and each route was chosen to thread between the hand-placed fixed
  // LEGAL: buildings and to stay on the district's land (never spanning a canal).
  // LEGAL: Devlin's grid is too dense to route one cleanly, so it has none.
  diagonal: [
    // LEGAL: Westside: (Cicero & Cermak) -> (Canal Yard & Grand); passes empty cells at ~(2485,750) & (2915,450).
    { x1: 2270, y1: 900, x2: 3130, y2: 300, w: 56, name: 'Canal Bend Road' },
    // LEGAL: Hub: (Wabash & Cermak) -> (Lakefront & Roosevelt); short cut through the open ~(4915,750) block.
    { x1: 4700, y1: 900, x2: 5130, y2: 600, w: 54, name: 'Lake Shore Cut' },
  ],
};
