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

export interface CanalChannel {
  x: number;
  width: number;
  name: string;
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
export const WORLD_H = 1200;

// LEGAL: ---- District widening (world expansion stage 1a) ----
// LEGAL: Every coordinate in this file was authored against 1500-wide districts separated
// LEGAL: by 500-wide canals. Widening the districts by hand would mean rewriting ~60
// LEGAL: numbers across landmass, rivers, roads, lots and landmarks, with no way to check
// LEGAL: the result. Instead the authored numbers stay exactly as they were and
// LEGAL: `widenAuthoredX` stretches them into the wider world.
// LEGAL:
// LEGAL: Districts stretch; canals and building footprints do NOT. That is the whole point
// LEGAL: — buildings keep their size while the gaps between them grow, which is what fixes
// LEGAL: the cramping. Y is untouched, so every hand-placed anchor stays on its own land.
const AUTHORED_DISTRICT_W = 1500;
const CANAL_W = 500;
export const DISTRICT_W = 2100;

// LEGAL: Authored breakpoints (district edges and canal edges) and where each one lands
// LEGAL: after widening. Between breakpoints the mapping is linear; outside the ends it
// LEGAL: extrapolates at the district scale so the coastline, which runs past both edges
// LEGAL: of the world, stretches with everything else instead of detaching.
const AUTHORED_BREAKPOINTS = [0, 1500, 2000, 3500, 4000, 5500];
const WIDENED_BREAKPOINTS = [
  0,
  DISTRICT_W,
  DISTRICT_W + CANAL_W,
  DISTRICT_W * 2 + CANAL_W,
  DISTRICT_W * 2 + CANAL_W * 2,
  DISTRICT_W * 3 + CANAL_W * 2,
];
const DISTRICT_SCALE = DISTRICT_W / AUTHORED_DISTRICT_W;

export function widenAuthoredX(x: number): number {
  const first = AUTHORED_BREAKPOINTS[0];
  if(x <= first) return WIDENED_BREAKPOINTS[0] + (x - first) * DISTRICT_SCALE;
  for(let i = 0; i < AUTHORED_BREAKPOINTS.length - 1; i += 1){
    const a0 = AUTHORED_BREAKPOINTS[i];
    const a1 = AUTHORED_BREAKPOINTS[i + 1];
    if(x <= a1){
      const t = (x - a0) / (a1 - a0);
      return WIDENED_BREAKPOINTS[i] + t * (WIDENED_BREAKPOINTS[i + 1] - WIDENED_BREAKPOINTS[i]);
    }
  }
  const lastAuthored = AUTHORED_BREAKPOINTS[AUTHORED_BREAKPOINTS.length - 1];
  const lastWidened = WIDENED_BREAKPOINTS[WIDENED_BREAKPOINTS.length - 1];
  return lastWidened + (x - lastAuthored) * DISTRICT_SCALE;
}

// LEGAL: Convenience wrappers so the authored literals below stay readable.
function widenPoints(points: Point[]): Point[] {
  return points.map(p => ({ x: widenAuthoredX(p.x), y: p.y }));
}

export const WORLD_W = WIDENED_BREAKPOINTS[WIDENED_BREAKPOINTS.length - 1];
export const NORTH_SHORE_LOT_Y = 205;
export const DEVLIN_NORTHWEST_LOT_X = widenAuthoredX(400);

export const WINDHAVEN_LANDMASS: Point[] = widenPoints([
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
]);

// LEGAL: Canals keep their authored 500 width — only their position moves, so the
// LEGAL: crossings stay the same length and the bridges still fit.
export const CANAL_CHANNELS: CanalChannel[] = [
  { x: widenAuthoredX(1500), width: CANAL_W, name: 'South Branch Canal' },
  { x: widenAuthoredX(3500), width: CANAL_W, name: 'Lakefront Cut' },
];

export const NORTH_RIVER: Point[] = widenPoints([
  { x: -260, y: -140 },
  { x: 5780, y: -140 },
  { x: 5780, y: 118 },
  { x: 5400, y: 88 },
  { x: 5050, y: 110 },
  { x: 4630, y: 72 },
  { x: 4210, y: 96 },
  { x: 3790, y: 70 },
  { x: 3340, y: 92 },
  { x: 2890, y: 64 },
  { x: 2440, y: 84 },
  { x: 1960, y: 60 },
  { x: 1510, y: 86 },
  { x: 1040, y: 62 },
  { x: 610, y: 82 },
  { x: 190, y: 58 },
  { x: -260, y: 102 },
]);

export const LAKEFRONT_BEACH: Point[] = widenPoints([
  { x: 3970, y: 52 },
  { x: 4240, y: 88 },
  { x: 4560, y: 64 },
  { x: 4860, y: 104 },
  { x: 5180, y: 86 },
  { x: 5520, y: 124 },
  { x: 5520, y: 52 },
]);

export const DISTRICT_OFFSETS: Record<string, number> = {
  devlin: widenAuthoredX(0),
  westside: widenAuthoredX(2000),
  hub: widenAuthoredX(4000),
};

export const districtSeeds: Record<string, number> = {
  devlin: 1001,
  westside: 2002,
  hub: 3003,
};

export const spawnPoints: Record<string, Point> = {
  devlin: { x: widenAuthoredX(700), y: 600 },
  westside: { x: widenAuthoredX(2700), y: 600 },
  hub: { x: widenAuthoredX(4700), y: 600 },
};

export const ventureDistricts = ['devlin', 'devlin', 'devlin', 'devlin', 'devlin', 'westside', 'westside', 'westside', 'westside', 'hub', 'hub', 'hub'];

export const ventureLots: Record<string, Point[]> = {
  devlin: widenPoints([{ x: 400, y: NORTH_SHORE_LOT_Y }, { x: 555, y: NORTH_SHORE_LOT_Y }, { x: 915, y: NORTH_SHORE_LOT_Y }, { x: 1330, y: NORTH_SHORE_LOT_Y }, { x: 120, y: 450 }]),
  westside: widenPoints([{ x: 2120, y: NORTH_SHORE_LOT_Y }, { x: 2485, y: NORTH_SHORE_LOT_Y }, { x: 2915, y: NORTH_SHORE_LOT_Y }, { x: 3330, y: NORTH_SHORE_LOT_Y }]),
  hub: widenPoints([{ x: 4120, y: NORTH_SHORE_LOT_Y }, { x: 4485, y: NORTH_SHORE_LOT_Y }, { x: 4915, y: NORTH_SHORE_LOT_Y }, { x: 5330, y: NORTH_SHORE_LOT_Y }]),
};

// LEGAL: Authored lot x values, widened once here so the tables below stay readable.
function lotX(x: number): number { return widenAuthoredX(x); }

export const ventureMapLots: Record<string, VentureMapLot> = {
  cart: { district: 'devlin', x: lotX(400), y: NORTH_SHORE_LOT_Y, zone: 'smallBusiness' },
  store: { district: 'devlin', x: lotX(555), y: NORTH_SHORE_LOT_Y, zone: 'smallBusiness' },
  laundromat: { district: 'devlin', x: lotX(915), y: NORTH_SHORE_LOT_Y, zone: 'smallBusiness' },
  backroom_cards: { district: 'devlin', x: lotX(1330), y: NORTH_SHORE_LOT_Y, zone: 'street' },
  garage: { district: 'westside', x: lotX(2120), y: NORTH_SHORE_LOT_Y, zone: 'industrial' },
  cab: { district: 'westside', x: lotX(2485), y: NORTH_SHORE_LOT_Y, zone: 'logistics' },
  chop_ring: { district: 'westside', x: lotX(2915), y: NORTH_SHORE_LOT_Y, zone: 'street' },
  restaurant: { district: 'devlin', x: lotX(120), y: 450, zone: 'smallBusiness' },
  lounge: { district: 'hub', x: lotX(4485), y: 450, zone: 'entertainment' },
  wire_network: { district: 'hub', x: lotX(4915), y: 450, zone: 'street' },
  realestate: { district: 'hub', x: lotX(5330), y: 450, zone: 'corporate' },
  syndicate_logistics: { district: 'westside', x: lotX(3330), y: NORTH_SHORE_LOT_Y, zone: 'logistics' },
  family_office: { district: 'hub', x: lotX(4120), y: 750, zone: 'corporate' },
};

export const namedBuildingLots: Record<string, Point> = {
  bankHome: { x: lotX(485), y: 450 },
  patel: { x: lotX(485), y: 750 },
  pawn: { x: lotX(915), y: 750 },
  herbalist: { x: lotX(1330), y: 750 },
  bar: { x: lotX(485), y: 1030 },
  chopshop: { x: lotX(2120), y: 450 },
  liquor: { x: lotX(3330), y: 450 },
  jewelers: { x: lotX(4485), y: 450 },
  marlowe: { x: lotX(4915), y: 450 },
  cityhall: { x: lotX(5330), y: 450 },
  heistTarget: { x: lotX(4120), y: 750 },
};

export const landmarks: Landmark[] = [
  { id: 'devlinHall', name: 'DEVLIN HALL', district: 'devlin', x: lotX(125), y: 820 },
  { id: 'ciceroWorks', name: 'CICERO WORKS', district: 'westside', x: lotX(2125), y: 850 },
  // LEGAL: The Potato — Windhaven's mirror-polished civic sculpture in the Hub, the
  // LEGAL: in-universe answer to a certain bean. Parody naming per config/parodyGeography.
  { id: 'thePotato', name: 'THE POTATO', district: 'hub', x: lotX(4760), y: 560 },
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
  // LEGAL: Road positions widen with the districts; road WIDTHS stay authored, so the
  // LEGAL: blocks between them grow while the streets themselves stay the same size.
  vertical: [
    { x: lotX(270), w: 74, name: 'Rockwell Avenue' },
    { x: lotX(700), w: 74, name: 'Devlin Street' },
    { x: lotX(1130), w: 74, name: 'Ashland Row' },
    { x: lotX(2270), w: 74, name: 'Cicero Avenue' },
    { x: lotX(2700), w: 74, name: 'Pulaski Road' },
    { x: lotX(3130), w: 74, name: 'Canal Yard Drive' },
    { x: lotX(4270), w: 74, name: 'LaSalle Street' },
    { x: lotX(4700), w: 74, name: 'Wabash Avenue' },
    { x: lotX(5130), w: 74, name: 'Lakefront Drive' },
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
    { x1: lotX(2270), y1: 900, x2: lotX(3130), y2: 300, w: 56, name: 'Canal Bend Road' },
    // LEGAL: Hub: (Wabash & Cermak) -> (Lakefront & Roosevelt); short cut through the open ~(4915,750) block.
    { x1: lotX(4700), y1: 900, x2: lotX(5130), y2: 600, w: 54, name: 'Lake Shore Cut' },
  ],
};
