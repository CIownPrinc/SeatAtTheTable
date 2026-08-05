import type { Point } from '../config/types';
import { circleInsidePolygon, boundsForPoints, isPointInWater } from './geometry';
import { OUTSKIRT_REGIONS, type OutskirtRegion } from './world';

export type OutskirtSceneryKind = 'farmhouse' | 'barn' | 'silo' | 'tree' | 'suburbHouse' | 'shed' | 'tank';

export interface OutskirtSceneryItem {
  regionId: string;
  kind: OutskirtSceneryKind;
  x: number;
  y: number;
  rotation: number;
}

function seededRandom(seed: number): () => number {
  return function(): number {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function seedForRegion(region: OutskirtRegion): number {
  return region.id.split('').reduce(function(total, character, index){ return total + character.charCodeAt(0) * (index + 17); }, 0);
}

function countForKind(kind: OutskirtRegion['kind']): Record<OutskirtSceneryKind, number> {
  if(kind === 'farmland') return { farmhouse:1, barn:2, silo:2, tree:10, suburbHouse:0, shed:0, tank:0 };
  if(kind === 'forest') return { farmhouse:0, barn:0, silo:0, tree:42, suburbHouse:0, shed:0, tank:0 };
  if(kind === 'suburb') return { farmhouse:0, barn:0, silo:0, tree:18, suburbHouse:14, shed:0, tank:0 };
  return { farmhouse:0, barn:0, silo:0, tree:6, suburbHouse:0, shed:10, tank:4 };
}

function radiusForKind(kind: OutskirtSceneryKind): number {
  if(kind === 'tree') return 10;
  if(kind === 'silo' || kind === 'tank') return 12;
  return 22;
}

function samplesInRegion(region: OutskirtRegion, count: number, radius: number, random: () => number): Point[] {
  const bounds = boundsForPoints(region.area);
  const points: Point[] = [];
  for(let attempt = 0; points.length < count && attempt < count * 80; attempt++){
    const point = { x:bounds.minX + random() * (bounds.maxX - bounds.minX), y:bounds.minY + random() * (bounds.maxY - bounds.minY) };
    if(!circleInsidePolygon(point, radius, region.area)) continue;
    if(isPointInWater(point, radius)) continue;
    if(points.some(function(existing){ return Math.hypot(existing.x - point.x, existing.y - point.y) < radius * 3; })) continue;
    points.push(point);
  }
  return points;
}

export function createOutskirtSceneryLayout(regions: OutskirtRegion[] = OUTSKIRT_REGIONS): OutskirtSceneryItem[] {
  const items: OutskirtSceneryItem[] = [];
  regions.forEach(function(region){
    const random = seededRandom(seedForRegion(region));
    const counts = countForKind(region.kind);
    (Object.keys(counts) as OutskirtSceneryKind[]).forEach(function(kind){
      samplesInRegion(region, counts[kind], radiusForKind(kind), random).forEach(function(point){
        items.push({ regionId:region.id, kind, x:point.x, y:point.y, rotation:random() * Math.PI * 2 });
      });
    });
  });
  return items;
}
