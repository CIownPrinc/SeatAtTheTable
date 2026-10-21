import { COUNTRY_ROADS } from './countryRoads';
import { distancePointToSegment } from './layout';
import type { Point } from '../config/types';
import { circleInsidePolygon, boundsForPoints, isPointInWater } from './geometry';
import { OUTSKIRT_PLACE_LOTS, OUTSKIRT_REGIONS, type OutskirtRegion } from './world';
import { mallKeepClear } from './mall';
import { centralParkKeepClear } from './centralPark';
import { suburbKeepClear } from './suburb';
import { TRAIL_WIDTH, distanceToTrails } from './trails';

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
  // LEGAL: A forest should read as woods, not a field with trees in it.
  if(kind === 'forest') return { farmhouse:0, barn:0, silo:0, tree:300, suburbHouse:0, shed:0, tank:0 };
  if(kind === 'suburb') return { farmhouse:0, barn:0, silo:0, tree:18, suburbHouse:14, shed:0, tank:0 };
  return { farmhouse:0, barn:0, silo:0, tree:6, suburbHouse:0, shed:10, tank:4 };
}

// LEGAL: Keeps trees, barns and houses off the dirt lanes, verge included.
function nearCountryRoad(point: Point, radius: number): boolean {
  return COUNTRY_ROADS.some(function(road){
    const clearance = road.width / 2 + 9 + radius;
    return road.path.slice(0, -1).some(function(a, i){
      const b = road.path[i + 1];
      return distancePointToSegment(point.x, point.y, a.x, a.y, b.x, b.y) < clearance;
    });
  });
}

// LEGAL: Half the clear square round each countryside place: its building, yard and frontage.
const PLACE_CLEARANCE = 95;

// LEGAL: How far each kind reaches from its centre, which is what keeps it off the lanes and apart
// LEGAL: from its neighbours. Buildings were all 22, smaller than most of them (a barn is 52 x 36, a
// LEGAL: family house 60 wide with its lawn and fence 45 out in front), so some stood on the Ring Road.
export function radiusForKind(kind: OutskirtSceneryKind): number {
  if(kind === 'tree') return 10;
  if(kind === 'silo') return 12;
  if(kind === 'tank') return 14;
  if(kind === 'suburbHouse') return 50;
  if(kind === 'barn') return 34;
  return 26;
}

function samplesInRegion(region: OutskirtRegion, count: number, radius: number, random: () => number): Point[] {
  const bounds = boundsForPoints(region.area);
  const points: Point[] = [];
  // LEGAL: The mall, Central Park, the suburb's lots and every countryside place (the lodge, the
  // LEGAL: casino, the motel...) are built on; nothing wild grows there.
  const keepClear = [
    ...mallKeepClear(), ...centralParkKeepClear(), ...suburbKeepClear(),
    ...Object.values(OUTSKIRT_PLACE_LOTS).map(lot => ({ x:lot.x, y:lot.y, hw:PLACE_CLEARANCE, hd:PLACE_CLEARANCE })),
  ];
  for(let attempt = 0; points.length < count && attempt < count * 80; attempt++){
    const point = { x:bounds.minX + random() * (bounds.maxX - bounds.minX), y:bounds.minY + random() * (bounds.maxY - bounds.minY) };
    if(!circleInsidePolygon(point, radius, region.area)) continue;
    if(isPointInWater(point, radius)) continue;
    if(nearCountryRoad(point, radius)) continue;
    if(distanceToTrails(point) < TRAIL_WIDTH / 2 + 4 + radius) continue;
    if(keepClear.some(s => Math.abs(point.x - s.x) < s.hw + radius && Math.abs(point.y - s.y) < s.hd + radius)) continue;
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
