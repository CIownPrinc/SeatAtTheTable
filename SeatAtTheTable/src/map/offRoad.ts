import type { Point } from '../config/types';
import { pointInPolygon } from './geometry';
import { OUTSKIRT_REGIONS } from './world';

export const OFF_ROAD_CONFIG = {
  standardWoodlandSpeedMultiplier: 0.52,
  mudsterWoodlandSpeedMultiplier: 1,
} as const;

export function isWoodlandTrack(point: Point): boolean {
  return OUTSKIRT_REGIONS
    .filter(function(region){ return region.kind === 'forest'; })
    .some(function(region){ return pointInPolygon(point, region.area); });
}

export function offRoadSpeedMultiplier(point: Point, carBrand: string | undefined): number {
  if(!isWoodlandTrack(point)) return 1;
  return carBrand === 'mudster'
    ? OFF_ROAD_CONFIG.mudsterWoodlandSpeedMultiplier
    : OFF_ROAD_CONFIG.standardWoodlandSpeedMultiplier;
}
