import type { Point } from '../../config/types';
import { pointInPolygon } from '../../map/geometry';
import { characterForDistrictBlock, type BlockCharacter } from '../../map/neighbourhoods';
import { windhavenMapModel } from '../../map/mapModel';
import { DISTRICT_OFFSETS, DISTRICT_W, OUTSKIRT_REGIONS, WORLD_H } from '../../map/world';

// LEGAL: What the ground is, everywhere. City blocks keep their neighbourhood character (rough,
// LEGAL: affluent, corporate...), the countryside its region kind, and anything else is meadow.
// LEGAL: The renderer blurs these together so areas fade into each other like a real city does.
export type GroundZone = BlockCharacter | 'meadow' | 'farmland' | 'forest' | 'suburb' | 'works';

// LEGAL: Linear RGB in 0..1. Paved city zones are greyer, money is greener, rough is patchy
// LEGAL: brown, farmland is golden, forest floor is dark.
export const GROUND_COLORS: Record<GroundZone, [number, number, number]> = {
  affluent: [0.075, 0.20, 0.055],
  working: [0.11, 0.18, 0.07],
  rough: [0.19, 0.16, 0.085],
  shopping: [0.19, 0.18, 0.15],
  corporate: [0.21, 0.21, 0.20],
  entertainment: [0.19, 0.16, 0.14],
  industrial: [0.20, 0.18, 0.14],
  meadow: [0.10, 0.20, 0.065],
  farmland: [0.25, 0.21, 0.075],
  forest: [0.045, 0.11, 0.035],
  suburb: [0.10, 0.22, 0.07],
  works: [0.19, 0.17, 0.12],
};

const BLOCK_W = DISTRICT_W / 4;
const BLOCK_H = WORLD_H / 4;

export function groundZoneAt(point: Point): GroundZone {
  for(const district of windhavenMapModel.districts){
    if(!pointInPolygon(point, district.landArea)) continue;
    const xi = Math.max(0, Math.min(3, Math.floor((point.x - DISTRICT_OFFSETS[district.id]) / BLOCK_W)));
    const yi = Math.max(0, Math.min(3, Math.floor(point.y / BLOCK_H)));
    return characterForDistrictBlock(district.id, xi, yi);
  }
  const region = OUTSKIRT_REGIONS.find(r => pointInPolygon(point, r.area));
  if(!region) return 'meadow';
  return region.kind === 'industrial' ? 'works' : region.kind;
}

// LEGAL: Width of the fade between zones, in world units: about half a city block.
export const ZONE_BLEND_RADIUS = 140;
const RING = Array.from({ length: 12 }, (_, i) => ({ c: Math.cos(i / 12 * Math.PI * 2), s: Math.sin(i / 12 * Math.PI * 2) }));

// LEGAL: The colour the ground should be at a point: the average of the zones around it. The
// LEGAL: painted terrain texture does the same with a blur; this is the version tests can check.
export function blendedGroundColor(point: Point, radius = ZONE_BLEND_RADIUS): [number, number, number] {
  const sum = [0, 0, 0];
  let weight = 0;
  const add = (p: Point, w: number) => {
    const c = GROUND_COLORS[groundZoneAt(p)];
    sum[0] += c[0] * w; sum[1] += c[1] * w; sum[2] += c[2] * w; weight += w;
  };
  add(point, 2);
  [radius * 0.5, radius].forEach(function(r, ring){
    RING.forEach(o => add({ x:point.x + o.c * r, y:point.y + o.s * r }, ring === 0 ? 1 : 0.6));
  });
  return [sum[0] / weight, sum[1] / weight, sum[2] / weight];
}
