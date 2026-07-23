import type { Point } from '../config/types';
import { OUTSKIRT_REGIONS, type OutskirtRegion } from './world';
import { pointInPolygon } from './geometry';

// LEGAL: The outskirts are land you can drive on but belong to no district, so anything
// LEGAL: that asks "where am I?" needs an answer out here too — otherwise the countryside
// LEGAL: reads as nowhere. Pure and unit-tested, like the rest of the map query layer.

export function outskirtRegionAt(point: Point, regions: OutskirtRegion[] = OUTSKIRT_REGIONS): OutskirtRegion | null {
  return regions.find(region => pointInPolygon(point, region.area)) ?? null;
}

const KIND_LABELS: Record<OutskirtRegion['kind'], string> = {
  farmland: 'Farmland',
  forest: 'Woodland',
  suburb: 'Suburb',
  industrial: 'Industrial edge',
};

export function outskirtKindLabel(kind: OutskirtRegion['kind']): string {
  return KIND_LABELS[kind];
}

// LEGAL: What to call a spot outside the three districts. Named belt if the point is in
// LEGAL: one, otherwise the generic ring — never an empty string, so callers can always
// LEGAL: show something.
export function outskirtPlaceLabel(point: Point, regions: OutskirtRegion[] = OUTSKIRT_REGIONS): string {
  const region = outskirtRegionAt(point, regions);
  return region ? `${region.name} - ${outskirtKindLabel(region.kind)}` : 'Windhaven outskirts';
}
