import type { Solid } from '../config/types';
import { CANAL_CHANNELS, WINDHAVEN_LANDMASS, roadNetwork } from './world';

export function actorRadius(inVehicle: boolean): number {
  return inVehicle ? 24 : 8;
}

export function collidesSolid(x: number, y: number, solids: Solid[], padding: number): boolean {
  return solids.some(s=> Math.abs(x-s.x)<s.hw+padding && Math.abs(y-s.y)<s.hd+padding);
}

function pointInPolygon(x: number, y: number, polygon: Array<{ x: number; y: number }>): boolean {
  let inside = false;
  for(let i = 0, j = polygon.length - 1; i < polygon.length; j = i++){
    const pi = polygon[i];
    const pj = polygon[j];
    const intersects = ((pi.y > y) !== (pj.y > y)) && x < ((pj.x - pi.x) * (y - pi.y)) / (pj.y - pi.y) + pi.x;
    if(intersects) inside = !inside;
  }
  return inside;
}

export function isInsideWorld(x: number, y: number, radius: number): boolean {
  const checks = [
    { x, y },
    { x: x - radius, y },
    { x: x + radius, y },
    { x, y: y - radius },
    { x, y: y + radius },
  ];
  return checks.every(point => pointInPolygon(point.x, point.y, WINDHAVEN_LANDMASS));
}

export function isWaterBlocked(x: number, y: number, radius: number): boolean {
  if(y < 56 + radius) return true;
  const inCanal = CANAL_CHANNELS.some(channel => x > channel.x + 30 - radius && x < channel.x + channel.width - 30 + radius);
  if(!inCanal) return false;
  // LEGAL: Canals are crossed ONLY on the horizontal road bridge decks. Diagonals stay
  // LEGAL: on district land and never span water, so they can't act as water crossings.
  const onBridge = roadNetwork.horizontal.some(r => Math.abs(y - r.y) <= r.w/2 - Math.min(radius, 18));
  return !onBridge;
}

export function canMoveTo(x: number, y: number, solids: Solid[], inVehicle: boolean): boolean {
  const radius = actorRadius(inVehicle);
  if(!isInsideWorld(x, y, radius)) return false;
  if(isWaterBlocked(x, y, radius)) return false;
  if(collidesSolid(x, y, solids, radius)) return false;
  return true;
}
