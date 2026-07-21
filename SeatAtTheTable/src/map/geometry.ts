import type { Point } from '../config/types';
import { CANAL_CHANNELS, WINDHAVEN_LANDMASS, roadNetwork } from './world';

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

export function pointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  for(let i = 0, j = polygon.length - 1; i < polygon.length; j = i++){
    const pi = polygon[i];
    const pj = polygon[j];
    const intersects = ((pi.y > point.y) !== (pj.y > point.y)) && point.x < ((pj.x - pi.x) * (point.y - pi.y)) / (pj.y - pi.y) + pi.x;
    if(intersects) inside = !inside;
  }
  return inside;
}

export function circleInsidePolygon(point: Point, radius: number, polygon: Point[]): boolean {
  return [
    point,
    { x: point.x - radius, y: point.y },
    { x: point.x + radius, y: point.y },
    { x: point.x, y: point.y - radius },
    { x: point.x, y: point.y + radius },
  ].every(check => pointInPolygon(check, polygon));
}

export function isPointOnWindhavenLand(point: Point, radius: number): boolean {
  return circleInsidePolygon(point, radius, WINDHAVEN_LANDMASS);
}

export function isPointInCanal(point: Point, radius: number): boolean {
  return CANAL_CHANNELS.some(channel => point.x > channel.x + 30 - radius && point.x < channel.x + channel.width - 30 + radius);
}

export function isPointOnBridge(point: Point, radius: number): boolean {
  return roadNetwork.horizontal.some(road => Math.abs(point.y - road.y) <= road.w/2 - Math.min(radius, 18));
}

export function isPointInWater(point: Point, radius: number): boolean {
  if(point.y < 56 + radius) return true;
  return isPointInCanal(point, radius) && !isPointOnBridge(point, radius);
}
