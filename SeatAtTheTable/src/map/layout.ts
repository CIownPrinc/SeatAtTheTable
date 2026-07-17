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
