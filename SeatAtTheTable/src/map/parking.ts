import type { Point } from '../config/types';
import { spawnPoints } from './world';

export type ParkingDistrictId = keyof typeof spawnPoints;

export const PARKING_DISTRICT_IDS: ParkingDistrictId[] = ['devlin', 'westside', 'hub'];

export function carSpawnPositionForDistrict(districtId: string): Point {
  const spawn = spawnPoints[districtId] ?? spawnPoints.devlin;
  return { x:spawn.x + 70, y:spawn.y };
}

export function defaultParkedCarPositions(): Record<ParkingDistrictId, Point> {
  return PARKING_DISTRICT_IDS.reduce<Record<ParkingDistrictId, Point>>(function(positions, districtId): Record<ParkingDistrictId, Point> {
    positions[districtId] = carSpawnPositionForDistrict(districtId);
    return positions;
  }, {
    devlin: carSpawnPositionForDistrict('devlin'),
    westside: carSpawnPositionForDistrict('westside'),
    hub: carSpawnPositionForDistrict('hub'),
  });
}

export function parkedCarPositionForDistrict(parkedCarPos: Record<string, Point>, districtId: string): Point {
  return parkedCarPos[districtId] ?? carSpawnPositionForDistrict(districtId);
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
