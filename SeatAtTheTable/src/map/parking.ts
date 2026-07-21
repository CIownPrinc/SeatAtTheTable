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
