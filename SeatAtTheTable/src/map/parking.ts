import type { Point } from '../config/types';
import { spawnPoints } from './world';

export function carSpawnPositionForDistrict(districtId: string): Point {
  const spawn = spawnPoints[districtId] ?? spawnPoints.devlin;
  return { x:spawn.x + 70, y:spawn.y };
}

// LEGAL: Where your car is. There's one of it, so one point. It used to be kept per district, left
// LEGAL: over from when the districts were separate maps: walk from Devlin into West Side and the car
// LEGAL: you'd parked vanished and another appeared at West Side's spawn, so you couldn't find it.
// LEGAL: Older saves held a point per district; the one for the district you were in is the real one.
export function parkedCarFromSave(saved: { parkedCar?: unknown; parkedCarPos?: unknown; currentDistrict?: unknown }): Point {
  const point = (value: unknown): Point | null => {
    const p = value as Partial<Point> | null | undefined;
    return p && typeof p.x === 'number' && typeof p.y === 'number' ? { x:p.x, y:p.y } : null;
  };
  const legacy = saved.parkedCarPos as Record<string, unknown> | undefined;
  const district = typeof saved.currentDistrict === 'string' ? saved.currentDistrict : 'devlin';
  return point(saved.parkedCar) ?? point(legacy?.[district]) ?? carSpawnPositionForDistrict('devlin');
}

// LEGAL: ---- Return to garage (world expansion stage 6) ----
// LEGAL: A car left in the street stays exactly where you parked it for a few minutes, then
// LEGAL: goes back to your garage in Devlin. That keeps the world feeling lived-in without
// LEGAL: letting you strand your only car on the far side of the map.
export const GARAGE_RETURN_SECONDS = 180;

export function secondsUntilGarageReturn(parkedAt: number | null, now: number): number | null {
  if(parkedAt === null) return null;
  return Math.max(0, GARAGE_RETURN_SECONDS - (now - parkedAt));
}

export function shouldReturnToGarage(parkedAt: number | null, now: number): boolean {
  if(parkedAt === null) return false;
  return now - parkedAt >= GARAGE_RETURN_SECONDS;
}
