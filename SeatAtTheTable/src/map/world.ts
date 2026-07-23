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

// LEGAL: ---- Coastline (world expansion stage 1b) ----
// LEGAL: The old outline was a rounded rectangle with a near-uniform north edge (y about
// LEGAL: -70 to 64) and south edge (1224 to 1332), which is why the city read as three
// LEGAL: identical squares in a row. Each district now has its own shape:
// LEGAL:   Devlin    — set back from the water at the north, running out into a long
// LEGAL:               peninsula in the south. The oldest, most sprawling district.
// LEGAL:   West Side — compact and pushed hard up against the river; short in the south,
// LEGAL:               which suits a working industrial district hemmed in by freight.
// LEGAL:   The Hub   — a headland pushing north into the lake, with a bay cut into its
// LEGAL:               southern edge, so downtown sits on a promontory.
// LEGAL: The north edge everywhere stays south of NORTH_RIVER's southern bank so the
// LEGAL: shoreline never overlaps the drawn river, and far enough north of the y=205
// LEGAL: north-shore lots that those buildings keep their footprints on land.
export const WINDHAVEN_LANDMASS: Point[] = widenPoints([
  // LEGAL: North coast, west to east.
  { x: -210, y: 120 },
  { x: -40, y: 152 },
  { x: 300, y: 164 },
  { x: 640, y: 148 },
  { x: 980, y: 120 },
  { x: 1290, y: 100 },
  { x: 1500, y: 94 },
  { x: 1705, y: 90 },
  { x: 1960, y: 84 },
  { x: 2210, y: 74 },
  { x: 2600, y: 68 },
  { x: 2980, y: 72 },
  { x: 3290, y: 84 },
  { x: 3500, y: 94 },
  { x: 3840, y: 106 },
  { x: 4060, y: 134 },
  { x: 4310, y: 166 },
  { x: 4560, y: 118 },
  { x: 4770, y: 78 },
  { x: 4980, y: 98 },
  { x: 5260, y: 142 },
  // LEGAL: ---- Outskirts (stage 1c) ----
  // LEGAL: The lake is north, so the city only opens onto countryside on its landward
  // LEGAL: sides. East, south and west the coast is replaced by an outskirts ring — the
  // LEGAL: land simply keeps going. The districts' own southern edges survive as the
  // LEGAL: boundary between district ground colour and outskirt terrain, so the shapes
  // LEGAL: authored in stage 1b still read; they are just no longer waterfront.
  { x: 5700, y: 182 },
  { x: 6100, y: 302 },
  { x: 6320, y: 560 },
  { x: 6250, y: 862 },
  { x: 6420, y: 1150 },
  { x: 6200, y: 1500 },
  { x: 5700, y: 1752 },
  { x: 5100, y: 1880 },
  { x: 4400, y: 1820 },
  { x: 3700, y: 1902 },
  { x: 3000, y: 1860 },
  { x: 2300, y: 1922 },
  { x: 1600, y: 1870 },
  { x: 900, y: 1930 },
  { x: 200, y: 1862 },
  { x: -500, y: 1780 },
  { x: -1000, y: 1560 },
  { x: -1150, y: 1200 },
  { x: -1050, y: 820 },
  { x: -1200, y: 480 },
  { x: -900, y: 222 },
  { x: -520, y: 150 },
  { x: -210, y: 120 },
]);

// LEGAL: Terrain belts in the outskirts. Scenery only for now — no interactable places out
// LEGAL: here (that is the deferred second pass). They render like district ground: a
// LEGAL: polygon in their own colour on top of the base land, so the ring reads as farmland
// LEGAL: and forest rather than one flat green field.
export interface OutskirtRegion {
  id: string;
  name: string;
  kind: 'farmland' | 'forest' | 'suburb' | 'industrial';
  area: Point[];
}

export const OUTSKIRT_REGIONS: OutskirtRegion[] = [
  {
    id: 'westfarms', name: 'Kettle Flats', kind: 'farmland',
    area: widenPoints([
      { x: -1200, y: 480 }, { x: -900, y: 222 }, { x: -520, y: 150 }, { x: -210, y: 120 },
      { x: -140, y: 600 }, { x: -120, y: 1080 }, { x: -400, y: 1300 },
      { x: -1000, y: 1240 }, { x: -1150, y: 900 },
    ]),
  },
  {
    id: 'southfields', name: 'Boundary Meadows', kind: 'farmland',
    area: widenPoints([
      { x: -400, y: 1300 }, { x: 400, y: 1360 }, { x: 1200, y: 1400 }, { x: 1900, y: 1330 },
      { x: 2100, y: 1700 }, { x: 1400, y: 1800 }, { x: 600, y: 1820 }, { x: -200, y: 1720 },
      { x: -800, y: 1560 },
    ]),
  },
  {
    id: 'ridgewood', name: 'Ridgewood Stand', kind: 'forest',
    area: widenPoints([
      { x: 1900, y: 1330 }, { x: 2900, y: 1300 }, { x: 3800, y: 1340 }, { x: 4200, y: 1420 },
      { x: 4100, y: 1780 }, { x: 3200, y: 1820 }, { x: 2300, y: 1800 }, { x: 2100, y: 1700 },
    ]),
  },
  {
    id: 'lakeridge', name: 'Lakeridge', kind: 'suburb',
    area: widenPoints([
      { x: 4200, y: 1420 }, { x: 5100, y: 1300 }, { x: 5700, y: 1240 }, { x: 6100, y: 1400 },
      { x: 5900, y: 1700 }, { x: 5100, y: 1800 }, { x: 4400, y: 1760 }, { x: 4100, y: 1780 },
    ]),
  },
  {
    id: 'eastworks', name: 'Cicero Outworks', kind: 'industrial',
    area: widenPoints([
      { x: 5700, y: 182 }, { x: 6100, y: 302 }, { x: 6320, y: 560 }, { x: 6250, y: 862 },
      { x: 6400, y: 1140 }, { x: 5900, y: 1180 }, { x: 5560, y: 900 }, { x: 5520, y: 500 },
      { x: 5460, y: 220 },
    ]),
  },
];

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
