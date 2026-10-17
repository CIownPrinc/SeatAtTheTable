import type { Point } from '../config/types';
import { CANAL_CHANNELS, WINDHAVEN_LAKE, WINDHAVEN_LANDMASS, WORLD_N, roadNetwork } from './world';

export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export function boundsForPoints(points: Point[]): Bounds {
  return points.reduce<Bounds>(function(bounds, point){
    return {
      minX: Math.min(bounds.minX, point.x),
      maxX: Math.max(bounds.maxX, point.x),
      minY: Math.min(bounds.minY, point.y),
      maxY: Math.max(bounds.maxY, point.y),
    };
  }, { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });
}

const polygonBounds = new WeakMap<Point[], Bounds>();

function cachedBounds(polygon: Point[]): Bounds {
  const known = polygonBounds.get(polygon);
  if(known) return known;
  const bounds = boundsForPoints(polygon);
  polygonBounds.set(polygon, bounds);
  return bounds;
}

export function pointInPolygon(point: Point, polygon: Point[]): boolean {
  const bounds = cachedBounds(polygon);
  if(point.x < bounds.minX || point.x > bounds.maxX || point.y < bounds.minY || point.y > bounds.maxY) return false;
  let inside = false;
  for(let i = 0, j = polygon.length - 1; i < polygon.length; j = i++){
    const pi = polygon[i];
    const pj = polygon[j];
    const intersects = ((pi.y > point.y) !== (pj.y > point.y)) && point.x < ((pj.x - pi.x) * (point.y - pi.y)) / (pj.y - pi.y) + pi.x;
    if(intersects) inside = !inside;
  }
  return inside;
}

function circleSamplePoints(point: Point, radius: number): Point[] {
  return [
    point,
    { x: point.x - radius, y: point.y },
    { x: point.x + radius, y: point.y },
    { x: point.x, y: point.y - radius },
    { x: point.x, y: point.y + radius },
  ];
}

export function circleInsidePolygon(point: Point, radius: number, polygon: Point[]): boolean {
  return circleSamplePoints(point, radius).every(check => pointInPolygon(check, polygon));
}

export function isPointOnWindhavenLand(point: Point, radius: number): boolean {
  return circleInsidePolygon(point, radius, WINDHAVEN_LANDMASS);
}

// LEGAL: Land tests ask whether the WHOLE circle is inside; water tests must ask whether ANY
// LEGAL: of it is, or you can wade a body-width into the lake before it stops you.
export function circleTouchesPolygon(point: Point, radius: number, polygon: Point[]): boolean {
  return circleSamplePoints(point, radius).some(check => pointInPolygon(check, polygon));
}

// LEGAL: The lake is enclosed land-side, so unlike the old open bay it cannot be expressed as
// LEGAL: "north of the coast". It is punched out of the landmass exactly like the canals.
export function isPointInLake(point: Point, radius: number): boolean {
  return circleTouchesPolygon(point, radius, WINDHAVEN_LAKE);
}

export function isPointInCanal(point: Point, radius: number): boolean {
  return CANAL_CHANNELS.some(channel => point.x > channel.x + 30 - radius && point.x < channel.x + channel.width - 30 + radius);
}

export function isPointOnBridge(point: Point, radius: number): boolean {
  return roadNetwork.horizontal.some(road => Math.abs(point.y - road.y) <= road.w/2 - Math.min(radius, 18));
}

export function isPointInWater(point: Point, radius: number): boolean {
  if(!isPointOnWindhavenLand(point, radius)) return true;
  if(isPointInLake(point, radius)) return true;
  // LEGAL: This was `y < 40`, from when the water north of the city was open ocean and the
  // LEGAL: landmass simply stopped at the coast. The land now wraps over the top of the lake,
  // LEGAL: so a cut-off at y=40 would have drowned every northern outskirt. The backstop is
  // LEGAL: kept, moved to just beyond the northern edge of any authored land.
  if(point.y < WORLD_N + radius) return true;
  return isPointInCanal(point, radius) && !isPointOnBridge(point, radius);
}
