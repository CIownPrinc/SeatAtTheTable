import type { Point } from '../config/types';
import { COUNTRY_ROADS } from './countryRoads';
import { routeHintBetween } from './queries';
import { roadNetwork } from './world';
import type { PavementCrossing } from './pavements';
import type { ParkingLot } from '../world/data/parkingLots';

// LEGAL: Traffic routes, built on the same road graph the GPS uses. They used to be hand-drawn
// LEGAL: rectangles: three city cars down the middle of the road, and countryside vehicles cutting
// LEGAL: straight across fields. Every route is now real directions between junctions, driven in
// LEGAL: the right-hand lane with rounded corners.
export interface TrafficRoute { id: string; color: string; speed: number; route: Point[]; marks?: Array<RouteMark | undefined> }

// LEGAL: What to do on the way to one point of a route: wait there (a car parked in a bay), back up
// LEGAL: to it, go slower, or (for a walker) wait for the lights before a crossing.
export interface RouteMark { dwell?: number; reverse?: boolean; slow?: number; crossing?: PavementCrossing }

// LEGAL: Shifts a path to the driver's right. On this map +y is south, so the right of a car
// LEGAL: heading east is +y.
export function laneOffsetPath(points: Point[], offset: number): Point[] {
  return points.map(function(p, i){
    const prev = points[Math.max(0, i - 1)], next = points[Math.min(points.length - 1, i + 1)];
    const dx = next.x - prev.x, dy = next.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    return { x:p.x - dy / len * offset, y:p.y + dx / len * offset };
  });
}

// LEGAL: Swaps each sharp corner for a short arc, so cars turn instead of pivoting on the spot.
export function roundCorners(points: Point[], radius: number, steps = 4): Point[] {
  const out: Point[] = [points[0]];
  for(let i = 1; i < points.length - 1; i++){
    const a = points[i - 1], b = points[i], c = points[i + 1];
    const inLen = Math.hypot(b.x - a.x, b.y - a.y), outLen = Math.hypot(c.x - b.x, c.y - b.y);
    const ux = (b.x - a.x) / (inLen || 1), uy = (b.y - a.y) / (inLen || 1);
    const vx = (c.x - b.x) / (outLen || 1), vy = (c.y - b.y) / (outLen || 1);
    if(ux * vx + uy * vy > 0.97){ out.push(b); continue; }
    const r = Math.min(radius, inLen / 2, outLen / 2);
    const start = { x:b.x - ux * r, y:b.y - uy * r }, end = { x:b.x + vx * r, y:b.y + vy * r };
    // LEGAL: A quadratic curve through the corner: starts along the incoming road, ends along the outgoing.
    for(let s = 0; s <= steps; s++){
      const t = s / steps;
      out.push({ x:(1 - t) * (1 - t) * start.x + 2 * (1 - t) * t * b.x + t * t * end.x, y:(1 - t) * (1 - t) * start.y + 2 * (1 - t) * t * b.y + t * t * end.y });
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return function(){ s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}

// LEGAL: Every crossing of two city streets; the traffic lights stand at these (map/trafficRules).
export const CITY_JUNCTIONS: Point[] = roadNetwork.vertical.flatMap(v => roadNetwork.horizontal.map(h => ({ x:v.x, y:h.y })));
const RING = COUNTRY_ROADS.find(road => road.id === 'road-country-ring')!;
const COUNTRY_STOPS: Point[] = RING.path.filter((_p, i) => i % 9 === 0);

// LEGAL: A closed loop through `stops` random stops: real directions from each to the next and
// LEGAL: back to the first, offset into the lane and smoothed.
function loopThrough(stops: Point[], laneWidth: number): Point[] {
  const legs: Point[] = [];
  stops.forEach(function(stop, i){
    const next = stops[(i + 1) % stops.length];
    const leg = routeHintBetween(stop, next).waypoints;
    legs.push(...(legs.length ? leg.slice(1) : leg));
  });
  const dedup = legs.filter((p, i) => i === 0 || Math.hypot(p.x - legs[i - 1].x, p.y - legs[i - 1].y) > 1);
  return roundCorners(laneOffsetPath(dedup, laneWidth / 4), 26);
}

function pick(points: Point[], count: number, random: () => number): Point[] {
  const pool = [...points];
  const chosen: Point[] = [];
  while(chosen.length < count && pool.length) chosen.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
  return chosen;
}

function route(id: string, color: string, speed: number, stops: Point[], laneWidth: number): TrafficRoute {
  return { id, color, speed, route:loopThrough(stops, laneWidth) };
}

// LEGAL: Built on first use, not at import: routing ten loops over the road graph takes about a
// LEGAL: second, which would otherwise land on every page load.
let cached: TrafficRoute[] | null = null;
export function trafficRoutes(): TrafficRoute[] {
  if(cached) return cached;
  const random = seeded(4242);
  // LEGAL: The id decides the model (map/vehicleModels vehicleClassForTraffic): cruiser, cab, van,
  // LEGAL: tractor, freight; anything else is a sedan.
  cached = [
  // LEGAL: One patrol, not three: three cruisers to four civilian cars made the city a police state.
  route('patrol-cruiser-1', '#1c1f26', 82, pick(CITY_JUNCTIONS, 4, random), 74),
  route('city-cab-1', '#d4a017', 86, pick(CITY_JUNCTIONS, 5, random), 74),
  route('city-cab-2', '#d4a017', 84, pick(CITY_JUNCTIONS, 4, random), 74),
  route('city-sedan-1', '#704040', 76, pick(CITY_JUNCTIONS, 4, random), 74),
  route('city-sedan-2', '#3e6b8a', 78, pick(CITY_JUNCTIONS, 4, random), 74),
  route('city-sedan-3', '#6b6f78', 74, pick(CITY_JUNCTIONS, 4, random), 74),
  route('city-beater', '#8a7a5a', 66, pick(CITY_JUNCTIONS, 4, random), 74),
  route('city-suv', '#20242c', 80, pick(CITY_JUNCTIONS, 4, random), 74),
  route('city-pickup', '#3d4a35', 74, pick(CITY_JUNCTIONS, 4, random), 74),
  route('city-ev', '#d8dce2', 80, pick(CITY_JUNCTIONS, 4, random), 74),
  route('delivery-van', '#e8e2d2', 70, pick(CITY_JUNCTIONS, 4, random), 74),
  route('city-truck', '#59616c', 60, pick(CITY_JUNCTIONS, 4, random), 74),
  route('kettle-tractor', '#5d753e', 34, pick(COUNTRY_STOPS, 3, random), 44),
  route('harrow-tractor', '#b37a32', 32, pick(COUNTRY_STOPS, 3, random), 44),
  route('ring-freight', '#59616c', 60, pick(COUNTRY_STOPS, 4, random), 44),
  // LEGAL: The snow plow, a municipal truck that only comes out once snow has settled (map/snow).
  route('snowplow-truck', '#e8a317', 56, pick(CITY_JUNCTIONS, 5, random), 74),
  ];
  return cached;
}

// LEGAL: ---- Cars that park ----
// LEGAL: A few cars do the rounds with a stop at a car park (world/data/parkingLots): down the street in
// LEGAL: the lane on the car park's side, turn in, nose into the bay kept for them, sit there a while,
// LEGAL: back out and drive off. Every lap of their loop they stop again.
const LANE = 74 / 4;
const PARKED_SECONDS = 24;
const ERRAND_CARS = [
  { id:'errand-wagon-1', color:'#5a6e4a', speed:72 },
  { id:'errand-suv-1', color:'#8a2f2f', speed:76 },
  { id:'errand-ev-1', color:'#2f5a8a', speed:74 },
];

const dot = (a: Point, b: Point) => a.x * b.x + a.y * b.y;
const plus = (a: Point, b: Point, k: number) => ({ x:a.x + b.x * k, y:a.y + b.y * k });

export function errandRoute(id: string, color: string, speed: number, lot: ParkingLot, seed: number): TrafficRoute | null {
  const bay = lot.bays.find(b => b.reserved);
  if(!bay) return null;
  // LEGAL: Driving with the car park on its right: that's the lane next to it.
  const ahead = { x:-lot.out.y, y:lot.out.x };
  const front = plus(bay, lot.out, dot({ x:lot.street.x - bay.x, y:lot.street.y - bay.y }, lot.out));
  const lane = (u: number) => plus(plus(front, lot.out, -LANE), ahead, u);
  const onStreet = CITY_JUNCTIONS.filter(j => Math.abs(dot({ x:j.x - front.x, y:j.y - front.y }, lot.out)) < 1);
  const along = (p: Point) => dot({ x:p.x - front.x, y:p.y - front.y }, ahead);
  const behind = onStreet.filter(j => along(j) < -120).sort((a, b) => along(b) - along(a))[0];
  const next = onStreet.filter(j => along(j) > 120).sort((a, b) => along(a) - along(b))[0];
  if(!behind || !next || along(next) - along(behind) > 800) return null;
  const random = seeded(seed);
  const nearby = CITY_JUNCTIONS.filter(j => j !== behind && j !== next && Math.abs(j.x - front.x) < 700);
  const loop = loopThrough([behind, next, ...pick(nearby, 2, random)], 74);
  // LEGAL: The stretch of the loop that runs past the car park in its lane; the stop goes in there.
  const at = loop.findIndex(function(p, i){
    const q = loop[i + 1];
    if(!q) return false;
    const inLane = (r: Point) => Math.abs(dot({ x:r.x - front.x, y:r.y - front.y }, lot.out) + LANE) < 6;
    return inLane(p) && inLane(q) && along(p) < -80 && along(q) > 90;
  });
  if(at < 0) return null;
  const aisle = plus(bay, lot.out, dot({ x:lot.aisle.x - bay.x, y:lot.aisle.y - bay.y }, lot.out));
  const stop: Array<{ point: Point; mark?: RouteMark }> = [
    { point:lane(-70) },
    { point:plus(aisle, ahead, -40), mark:{ slow:0.5 } },
    { point:{ x:bay.x, y:bay.y }, mark:{ slow:0.35, dwell:PARKED_SECONDS } },
    { point:aisle, mark:{ slow:0.3, reverse:true } },
    { point:plus(aisle, ahead, 45), mark:{ slow:0.5 } },
    { point:lane(80), mark:{ slow:0.7 } },
  ];
  const route = [...loop.slice(0, at + 1), ...stop.map(s => s.point), ...loop.slice(at + 1)];
  const marks = [...loop.slice(0, at + 1).map(() => undefined), ...stop.map(s => s.mark), ...loop.slice(at + 1).map(() => undefined)];
  return { id, color, speed, route, marks };
}

export function errandRoutes(parking: readonly ParkingLot[]): TrafficRoute[] {
  const routes: TrafficRoute[] = [];
  const used = new Set<string>();
  ERRAND_CARS.forEach(function(car, n){
    for(let k = 0; k < parking.length; k++){
      const lot = parking[(n * 3 + k) % parking.length];
      if(used.has(lot.id)) continue;
      const route = errandRoute(car.id, car.color, car.speed, lot, 5150 + n);
      if(!route) continue;
      used.add(lot.id);
      routes.push(route);
      return;
    }
  });
  return routes;
}
