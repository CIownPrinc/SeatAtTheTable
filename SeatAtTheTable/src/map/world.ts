import type { MapZoneType, Point } from '../config/types';
import { MALL_ENTRANCE } from './mall';

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
  // LEGAL: North and south ends. The canals open into the lake and stop at the city's southern
  // LEGAL: edge; without these they were infinite strips, so the countryside north of the lake had
  // LEGAL: two invisible walls of "canal" running through it.
  top: number;
  bottom: number;
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

// LEGAL: How far north of the city the world now reaches. The water north of Windhaven used
// LEGAL: to be called a lake while being wide open to the ocean that surrounds the whole map,
// LEGAL: which is not a lake, it is a bay. It is now a genuine ENCLOSED lake with land on all
// LEGAL: sides — which is also what makes room for the northern outskirts, since the old
// LEGAL: shoreline was the reason stage 1c could only widen the sides and the bottom.
// LEGAL: Nothing clamps play to y >= 0; movement is bounded by the landmass polygon alone.
export const WORLD_N = -1240;

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
// LEGAL: Chaikin corner cutting, twice: turns the authored polygon into a smooth curve that stays
// LEGAL: inside its corners. Applied to the data, so the water rules, beach, roads and scenery all
// LEGAL: follow the same rounded shore the player sees.
function smoothClosed(points: Point[], passes = 2): Point[] {
  // LEGAL: Drop repeated points (the authored rings close on their first point); a zero-length
  // LEGAL: edge has no direction and would survive smoothing as a spike.
  let out = points.filter((p, i) => { const q = points[(i + 1) % points.length]; return Math.hypot(p.x - q.x, p.y - q.y) > 0.5; });
  for(let pass = 0; pass < passes; pass++){
    const next: Point[] = [];
    out.forEach(function(p, i){
      const q = out[(i + 1) % out.length];
      next.push({ x:p.x * 0.75 + q.x * 0.25, y:p.y * 0.75 + q.y * 0.25 }, { x:p.x * 0.25 + q.x * 0.75, y:p.y * 0.25 + q.y * 0.75 });
    });
    out = next;
  }
  return out;
}

function widenPoints(points: Point[]): Point[] {
  return points.map(p => ({ x: widenAuthoredX(p.x), y: p.y }));
}

export const WORLD_W = WIDENED_BREAKPOINTS[WIDENED_BREAKPOINTS.length - 1];
export const NORTH_SHORE_LOT_Y = 205;

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
// LEGAL: That coastline is now the lake's SOUTH shore rather than the edge of the world —
// LEGAL: see WINDHAVEN_LAKE below. It still sits far enough north of the y=205 north-shore
// LEGAL: lots that those buildings keep their footprints on land.
export const WINDHAVEN_LANDMASS: Point[] = smoothClosed(widenPoints([
  // LEGAL: ---- North shore of the WORLD, west to east ----
  // LEGAL: The land now wraps over the top of the lake. Everything between this line and the
  // LEGAL: district coastline below is northern outskirts; the lake itself is punched out of
  // LEGAL: it by WINDHAVEN_LAKE, the same way the canals are.
  { x: -1150, y: -300 },
  { x: -1010, y: -640 },
  { x: -740, y: -910 },
  { x: -300, y: -1080 },
  { x: 300, y: -1165 },
  { x: 1000, y: -1200 },
  { x: 1800, y: -1215 },
  { x: 2600, y: -1198 },
  { x: 3400, y: -1216 },
  { x: 4200, y: -1180 },
  { x: 4900, y: -1120 },
  { x: 5500, y: -1000 },
  { x: 5990, y: -790 },
  { x: 6290, y: -470 },
  { x: 6410, y: -120 },
  { x: 6450, y: 210 },
  // LEGAL: ---- East, south and west outskirts ring (stage 1c) ----
  // LEGAL: The ring used to start at (5700, 182) and (6100, 302), where it was spliced onto the
  // LEGAL: north shore: the coast doubled back on itself and left a needle of sea in the land.
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
  { x: -1180, y: 120 },
  { x: -1150, y: -300 },
]));

// LEGAL: ---- The lake ----
// LEGAL: Its SOUTH shore is the district coastline authored in stage 1b, point for point, so
// LEGAL: Devlin's setback, the West Side's hard river edge and the Hub's northward headland
// LEGAL: all still read exactly as before. Only the far side is new: the water now closes
// LEGAL: back on itself instead of running away into the ocean.
export const WINDHAVEN_LAKE: Point[] = smoothClosed(widenPoints([
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
  // LEGAL: East end, curling back north.
  { x: 5480, y: 20 },
  { x: 5530, y: -240 },
  { x: 5380, y: -470 },
  // LEGAL: North shore, east to west.
  { x: 5000, y: -600 },
  { x: 4400, y: -662 },
  { x: 3700, y: -690 },
  { x: 3000, y: -668 },
  { x: 2300, y: -700 },
  { x: 1600, y: -672 },
  { x: 900, y: -700 },
  { x: 250, y: -658 },
  { x: -180, y: -560 },
  // LEGAL: West end, closing onto the start of the south shore.
  { x: -380, y: -330 },
  { x: -400, y: -80 },
  { x: -300, y: 60 },
  { x: -210, y: 120 },
]));

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
  // LEGAL: ---- Northern belts (only possible now the lake is enclosed) ----
  // LEGAL: Stage 1c could not extend north because the north edge WAS the water. With land
  // LEGAL: wrapped over the top of the lake there is now a whole northern shore to fill.
  {
    id: 'northshore', name: 'Sunset Shore', kind: 'suburb',
    area: widenPoints([
      // LEGAL: Held clear of the waterline rather than sharing the lake's shore points, so a
      // LEGAL: belt corner is never both on the beach and in the water.
      { x: -150, y: -600 }, { x: 250, y: -700 }, { x: 900, y: -742 }, { x: 1600, y: -714 },
      { x: 2300, y: -742 }, { x: 2400, y: -900 }, { x: 1700, y: -940 },
      { x: 900, y: -960 }, { x: 200, y: -900 }, { x: -260, y: -780 },
    ]),
  },
  {
    id: 'northwoods', name: 'Kestrel Woods', kind: 'forest',
    area: widenPoints([
      { x: 2400, y: -900 }, { x: 2300, y: -742 }, { x: 3000, y: -710 }, { x: 3700, y: -732 },
      { x: 4400, y: -704 }, { x: 4600, y: -880 }, { x: 3900, y: -960 }, { x: 3100, y: -980 },
    ]),
  },
  {
    id: 'northfarms', name: 'Harrow End', kind: 'farmland',
    area: widenPoints([
      // LEGAL: Inset from the world's north edge rather than sharing its points — a belt
      // LEGAL: corner sitting exactly ON the landmass boundary is neither in nor out of it.
      { x: -260, y: -1030 }, { x: 300, y: -1120 }, { x: 1000, y: -1155 }, { x: 1800, y: -1170 },
      { x: 2600, y: -1152 }, { x: 3400, y: -1170 }, { x: 4180, y: -1135 },
      { x: 4600, y: -880 }, { x: 3100, y: -980 }, { x: 2400, y: -900 },
      { x: 900, y: -960 }, { x: 200, y: -900 }, { x: -260, y: -780 },
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
  { x: widenAuthoredX(1500), width: CANAL_W, top: 0, bottom: WORLD_H, name: 'South Branch Canal' },
  { x: widenAuthoredX(3500), width: CANAL_W, top: 0, bottom: WORLD_H, name: 'Lakefront Cut' },
];


// LEGAL: ---- Beach paradise ----
// LEGAL: Now that the lake is genuinely enclosed, its southern shore is a resort strip rather
// LEGAL: than a working waterfront: sand, palms, loungers and umbrellas (see buildLakeshore).
// LEGAL: Runs from the Hub headland west along the whole city shore, following the same
// LEGAL: coastline points so the sand can never drift off the water's edge.
// LEGAL: Derived from the lake's own south shore, from the city's west edge to its east edge.
// LEGAL: It used to be its own hand-drawn outline, which stopped well short of both ends, so the
// LEGAL: sand ended abruptly. The waterline sits just into the water so no sliver of grass shows.
const BEACH_DEPTH = 42;

function cityShoreline(): Point[] {
  const eastTip = WINDHAVEN_LAKE.reduce((best, p, i) => (p.x > WINDHAVEN_LAKE[best].x ? i : best), 0);
  const shore = WINDHAVEN_LAKE.slice(0, eastTip + 1);
  const out: Point[] = [];
  for(let i = 0; i < shore.length - 1; i++){
    const a = shore[i], b = shore[i + 1];
    const clip = (x: number) => ({ x, y: a.y + (b.y - a.y) * (x - a.x) / (b.x - a.x) });
    if(a.x < 0 && b.x > 0) out.push(clip(0));
    if(a.x >= 0 && a.x <= WORLD_W) out.push(a);
    if(a.x < WORLD_W && b.x > WORLD_W) out.push(clip(WORLD_W));
  }
  const last = shore[shore.length - 1];
  if(last.x >= 0 && last.x <= WORLD_W) out.push(last);
  return out;
}

const CITY_SHORE = cityShoreline();
// LEGAL: First half is the waterline west to east, the second the inland edge coming back;
// LEGAL: buildBeachResort relies on that order.
export const LAKEFRONT_BEACH: Point[] = [
  ...CITY_SHORE.map(p => ({ x: p.x, y: p.y - 6 })),
  ...[...CITY_SHORE].reverse().map(p => ({ x: p.x, y: p.y + BEACH_DEPTH })),
];

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

// LEGAL: ---- Hand-placed outskirt lots ----
// LEGAL: The lot allocator works district by district, and the outskirts are not a district,
// LEGAL: so anything out here is placed by hand in ABSOLUTE world coordinates. These are
// LEGAL: merged into namedBuildingLots below, which is the branch of applyMapWorldCoordinates
// LEGAL: that takes a position as given rather than treating it as district-local — and
// LEGAL: serviceLots excludes them from allocation so a district lot cannot overwrite them.
export const OUTSKIRT_PLACE_LOTS: Record<string, Point> = {
  // LEGAL: Out in Lakeridge, the suburb belt on the south-east edge. Deliberately a drive
  // LEGAL: rather than a stroll: a casino you can walk to from your own block is not a trip.
  casinoLakeridge: { x: widenAuthoredX(5500), y: 1560 },
  // LEGAL: The mall's front plaza, where Wabash Avenue's turning circle ends (map/mall).
  mallLakeridge: MALL_ENTRANCE,
  airfieldKettle: { x: widenAuthoredX(-760), y: 760 },
  lodgeRidgewood: { x: widenAuthoredX(3100), y: 1560 },
  driveInBoundary: { x: widenAuthoredX(800), y: 1570 },
  motelSunset: { x: widenAuthoredX(1100), y: -790 },
  fireRoadKestrel: { x: widenAuthoredX(3300), y: -830 },
  mudsterTrailhead: { x: widenAuthoredX(4186), y: -820 },
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
  ...OUTSKIRT_PLACE_LOTS,
};

export const landmarks: Landmark[] = [
  { id: 'devlinHall', name: 'DEVLIN HALL', district: 'devlin', x: lotX(125), y: 820 },
  // LEGAL: y=800, not 850: the works yard reached into Cermak Road's carriageway.
  { id: 'ciceroWorks', name: 'CICERO WORKS', district: 'westside', x: lotX(2125), y: 800 },
  // LEGAL: The Potato — Windhaven's mirror-polished civic sculpture in the Hub, the
  // LEGAL: in-universe answer to a certain bean. Parody naming per config/parodyGeography.
  // LEGAL: y=500, not 560. The plaza is 100 deep, so at 560 its southern edge reached into
  // LEGAL: Roosevelt Road's carriageway (y 563..637). Sits clear of Grand Avenue too.
  // LEGAL: x=4790, not 4760: the plaza's west edge reached into Wabash Avenue.
  { id: 'thePotato', name: 'THE POTATO', district: 'hub', x: lotX(4790), y: 500 },
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
