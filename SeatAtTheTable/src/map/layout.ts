import type { Solid } from '../config/types';

export interface HalfExtents {
  hw: number;
  hd: number;
}

export function localXForDistrict(districtId: string, x: number, offsets: Record<string, number>): number {
  return x - (offsets[districtId] || 0);
}

export function rotatedHalfExtents(w: number, d: number, rot: number): HalfExtents {
  const c = Math.abs(Math.cos(rot));
  const s = Math.abs(Math.sin(rot));
  return { hw:(w*c + d*s)/2, hd:(w*s + d*c)/2 };
}

export function rectsOverlap(a: Solid, b: Solid, gap: number): boolean {
  return Math.abs(a.x-b.x) < a.hw+b.hw+gap && Math.abs(a.y-b.y) < a.hd+b.hd+gap;
}

export function distancePointToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx*dx + dy*dy;
  if(lenSq === 0) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1)*dx + (py - y1)*dy) / lenSq));
  const x = x1 + t*dx;
  const y = y1 + t*dy;
  return Math.hypot(px - x, py - y);
}

export function buildableBands(roadCenters: number[], max: number, clearance: number): [number, number][] {
  const bands: [number, number][] = [];
  let start = 15;
  roadCenters.forEach(function(center){
    const end = center - clearance;
    if(end-start > 70) bands.push([start, end]);
    start = center + clearance;
  });
  if(max-15-start > 70) bands.push([start, max-15]);
  return bands;
}
