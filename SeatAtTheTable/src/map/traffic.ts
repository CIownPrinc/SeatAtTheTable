import type { Point } from '../config/types';
import { COUNTRY_ROADS } from './countryRoads';
import { routeHintBetween } from './queries';
import { roadNetwork } from './world';

// LEGAL: Traffic routes, built on the same road graph the GPS uses. They used to be hand-drawn
// LEGAL: rectangles: three city cars down the middle of the road, and countryside vehicles cutting
// LEGAL: straight across fields. Every route is now real directions between junctions, driven in
// LEGAL: the right-hand lane with rounded corners.
export interface TrafficRoute { id: string; color: string; speed: number; route: Point[] }

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

const CITY_JUNCTIONS: Point[] = roadNetwork.vertical.flatMap(v => roadNetwork.horizontal.map(h => ({ x:v.x, y:h.y })));
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
  route('patrol-cruiser-1', '#1c1f26', 82, pick(CITY_JUNCTIONS, 4, random), 74),
  route('patrol-cruiser-2', '#1c1f26', 82, pick(CITY_JUNCTIONS, 4, random), 74),
  route('patrol-cruiser-3', '#1c1f26', 82, pick(CITY_JUNCTIONS, 4, random), 74),
  route('city-cab', '#d4a017', 86, pick(CITY_JUNCTIONS, 5, random), 74),
  route('city-sedan-1', '#704040', 76, pick(CITY_JUNCTIONS, 4, random), 74),
  route('city-sedan-2', '#3e6b8a', 78, pick(CITY_JUNCTIONS, 4, random), 74),
  route('delivery-van', '#e8e2d2', 70, pick(CITY_JUNCTIONS, 4, random), 74),
  route('kettle-tractor', '#5d753e', 34, pick(COUNTRY_STOPS, 3, random), 44),
  route('harrow-tractor', '#b37a32', 32, pick(COUNTRY_STOPS, 3, random), 44),
  route('ring-freight', '#59616c', 60, pick(COUNTRY_STOPS, 4, random), 44),
  ];
  return cached;
}
