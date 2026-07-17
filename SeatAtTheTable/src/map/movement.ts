import type { Solid } from '../config/types';
import { WORLD_H, WORLD_W, roadNetwork } from './world';

export function actorRadius(inVehicle: boolean): number {
  return inVehicle ? 24 : 8;
}

export function collidesSolid(x: number, y: number, solids: Solid[], padding: number): boolean {
  return solids.some(s=> Math.abs(x-s.x)<s.hw+padding && Math.abs(y-s.y)<s.hd+padding);
}

export function isInsideWorld(x: number, y: number, radius: number): boolean {
  return x>=16+radius && x<=WORLD_W-16-radius && y>=16+radius && y<=WORLD_H-16-radius;
}

export function isWaterBlocked(x: number, y: number, radius: number): boolean {
  if(y < 46 + radius) return true;
  const inCanal1 = x > 1530 - radius && x < 1970 + radius;
  const inCanal2 = x > 3530 - radius && x < 3970 + radius;
  if(!inCanal1 && !inCanal2) return false;
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
