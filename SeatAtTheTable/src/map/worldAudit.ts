import type { Point } from '../config/types';
import { pointInPolygon } from './geometry';

// LEGAL: The world audit: the rules a correct map obeys, written once and run everywhere. Unit
// LEGAL: tests run it on the map data, the browser audit runs it on what the renderer drew, and
// LEGAL: dev builds run it at startup and mark every problem on the map in red. Each rule
// LEGAL: returns where the problem is, so a failure points at a place, not just a count.
export type AuditKind = 'building-on-road' | 'road-over-water' | 'scenery-on-road' | 'beach-gap' | 'hairline';

export interface AuditIssue { kind: AuditKind; message: string; at: Point }
export interface AuditRoad { name: string; width: number; path: Point[] }
export interface AuditFootprint { name: string; minX: number; maxX: number; minZ: number; maxZ: number }
export interface AuditScenery { name: string; x: number; y: number; radius: number }

function distanceToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x, dy = b.y - a.y;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(p.x - (a.x + dx * t), p.y - (a.y + dy * t));
}

function distanceToPath(p: Point, path: Point[]): { distance: number; at: Point } {
  let best = { distance:Infinity, at:path[0] };
  for(let i = 0; i < path.length - 1; i++){
    const d = distanceToSegment(p, path[i], path[i + 1]);
    if(d < best.distance) best = { distance:d, at:p };
  }
  return best;
}

// LEGAL: How far into the carriageway a building may reach before it counts as standing in the
// LEGAL: road: an awning or a step over the kerb is fine, a wall in the traffic lane is not.
const KERB_TOLERANCE = 4;

// LEGAL: Samples the footprint's edges and centre; a rectangle in the road has one of them
// LEGAL: within half the road's width of the centre line. The old audit only asked whether a
// LEGAL: building straddled the centre line, so one half-way into the street passed.
export function auditFootprintsOnRoads(footprints: AuditFootprint[], roads: AuditRoad[]): AuditIssue[] {
  const issues: AuditIssue[] = [];
  footprints.forEach(function(f){
    const samples: Point[] = [];
    const stepsX = Math.max(1, Math.ceil((f.maxX - f.minX) / 8));
    const stepsZ = Math.max(1, Math.ceil((f.maxZ - f.minZ) / 8));
    for(let i = 0; i <= stepsX; i++) for(let j = 0; j <= stepsZ; j++){
      if(i !== 0 && i !== stepsX && j !== 0 && j !== stepsZ && (i + j) % 3) continue;
      samples.push({ x:f.minX + (f.maxX - f.minX) * i / stepsX, y:f.minZ + (f.maxZ - f.minZ) * j / stepsZ });
    }
    for(const road of roads){
      const hit = samples.find(p => distanceToPath(p, road.path).distance < road.width / 2 - KERB_TOLERANCE);
      if(hit){
        issues.push({ kind:'building-on-road', message:`${f.name} stands in ${road.name}`, at:hit });
        break;
      }
    }
  });
  return issues;
}

// LEGAL: Walks every road at a short step and reports each stretch whose surface is over water.
export function auditRoadsOverWater(roads: AuditRoad[], isWater: (point: Point, radius: number) => boolean, step = 16): AuditIssue[] {
  const issues: AuditIssue[] = [];
  roads.forEach(function(road){
    let inWater = false;
    for(let i = 0; i < road.path.length - 1; i++){
      const a = road.path[i], b = road.path[i + 1];
      const length = Math.hypot(b.x - a.x, b.y - a.y);
      for(let d = 0; d <= length; d += step){
        const p = { x:a.x + (b.x - a.x) * d / (length || 1), y:a.y + (b.y - a.y) * d / (length || 1) };
        const wet = isWater(p, road.width * 0.3);
        // LEGAL: One issue per wet stretch, at the point it first leaves the land.
        if(wet && !inWater) issues.push({ kind:'road-over-water', message:`${road.name} runs over water at ${Math.round(p.x)},${Math.round(p.y)}`, at:p });
        inWater = wet;
      }
    }
  });
  return issues;
}

export function auditSceneryOnRoads(items: AuditScenery[], roads: AuditRoad[]): AuditIssue[] {
  const issues: AuditIssue[] = [];
  items.forEach(function(item){
    const road = roads.find(r => distanceToPath(item, r.path).distance < r.width / 2 + item.radius - KERB_TOLERANCE);
    if(road) issues.push({ kind:'scenery-on-road', message:`${item.name} stands in ${road.name} at ${Math.round(item.x)},${Math.round(item.y)}`, at:{ x:item.x, y:item.y } });
  });
  return issues;
}

// LEGAL: A beach should run unbroken along the shore it belongs to. Walks the shoreline between
// LEGAL: two x positions and reports where it leaves the sand.
export function auditBeachCoverage(beach: Point[], shore: Point[], fromX: number, toX: number, step = 24): AuditIssue[] {
  const issues: AuditIssue[] = [];
  let covered = true;
  for(let i = 0; i < shore.length - 1; i++){
    const a = shore[i], b = shore[i + 1];
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    for(let d = 0; d <= length; d += step){
      const p = { x:a.x + (b.x - a.x) * d / (length || 1), y:a.y + (b.y - a.y) * d / (length || 1) };
      if(p.x < Math.min(fromX, toX) || p.x > Math.max(fromX, toX)) continue;
      const onSand = pointInPolygon(p, beach);
      if(!onSand && covered) issues.push({ kind:'beach-gap', message:`The beach stops at ${Math.round(p.x)},${Math.round(p.y)}`, at:p });
      covered = onSand;
    }
  }
  return issues;
}
