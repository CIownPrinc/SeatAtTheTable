import type { Solid } from '../config/types';
import { isPointInWater, isPointOnWindhavenLand } from './geometry';

export function actorRadius(inVehicle: boolean): number {
  return inVehicle ? 24 : 8;
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
