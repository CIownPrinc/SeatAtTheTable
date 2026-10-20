import type { Solid } from '../config/types';
import { isPointInWater, isPointOnWindhavenLand } from './geometry';

export function actorRadius(inVehicle: boolean): number {
  // LEGAL: A car is drawn VEHICLE_SCALE big (map/scale); a circle a little under half its length.
  return inVehicle ? 28 : 8;
}

export function collidesSolid(x: number, y: number, solids: Solid[], padding: number): boolean {
  return solids.some(s=> Math.abs(x-s.x)<s.hw+padding && Math.abs(y-s.y)<s.hd+padding);
}

export function isInsideWorld(x: number, y: number, radius: number): boolean {
  return isPointOnWindhavenLand({ x, y }, radius);
}

export function isWaterBlocked(x: number, y: number, radius: number): boolean {
  return isPointInWater({ x, y }, radius);
}

export function canMoveTo(x: number, y: number, solids: Solid[], inVehicle: boolean): boolean {
  const radius = actorRadius(inVehicle);
  if(!isInsideWorld(x, y, radius)) return false;
  if(isWaterBlocked(x, y, radius)) return false;
  if(collidesSolid(x, y, solids, radius)) return false;
  return true;
}

// LEGAL: How far a solid's padded bounds overlap a point. 0 means clear. Used to let an
// LEGAL: actor that is already stuck move in whichever direction digs it out.
export function penetrationDepth(x: number, y: number, solids: Solid[], padding: number): number {
  return solids.reduce(function(worst, s){
    const overlapX = (s.hw + padding) - Math.abs(x - s.x);
    const overlapY = (s.hd + padding) - Math.abs(y - s.y);
    if(overlapX <= 0 || overlapY <= 0) return worst;
    return Math.max(worst, Math.min(overlapX, overlapY));
  }, 0);
}

// LEGAL: Getting into a car grows the actor radius from 8 to 24 (actorRadius), so a spot
// LEGAL: you legally walked to on foot can be *inside* a building's padded bounds the
// LEGAL: instant you're driving. Every axis-separated fallback then fails and the car is
// LEGAL: stuck in front of the building forever. This finds the nearest legal spot so the
// LEGAL: actor can be nudged clear instead of being trapped.
export function nearestFreePoint(
  x: number,
  y: number,
  solids: Solid[],
  inVehicle: boolean,
  maxDistance = 120,
): { x: number; y: number } | null {
  if(canMoveTo(x, y, solids, inVehicle)) return { x, y };
  // LEGAL: Expanding rings; 16 directions is fine granularity for the gaps involved.
  for(let distance = 8; distance <= maxDistance; distance += 8){
    for(let i = 0; i < 16; i += 1){
      const angle = (i / 16) * Math.PI * 2;
      const candidateX = x + Math.cos(angle) * distance;
      const candidateY = y + Math.sin(angle) * distance;
      if(canMoveTo(candidateX, candidateY, solids, inVehicle)) return { x: candidateX, y: candidateY };
    }
  }
  return null;
}
