import type { FillerItem, MapZoneType, Solid } from '../config/types';
import type { MapObject } from './objects';
import { buildableBands, distancePointToSegment, localXForDistrict, rectsOverlap, rotatedHalfExtents } from './layout';
import { DISTRICT_OFFSETS, DISTRICT_W, WORLD_H, districtParkSlots, districtSeeds, landmarks, roadNetwork } from './world';
import { zoneForDistrictBlock } from './zoning';

const ROAD_VISUAL_CLEARANCE_X = 56;
const ROAD_VISUAL_CLEARANCE_Y = 66;
const BUILDING_GAP = 14;
const MIN_FILLER_BUILDING_W = 34;
const MIN_FILLER_BUILDING_D = 30;
const MIN_FILLER_BUILDING_H = 24;

export interface FillerLayoutProvider {
  fillerFor(districtId: string): FillerItem[];
  fillerSolids(): Solid[];
}

export function seededRandom(seed: number): () => number {
  return function(){
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createFillerLayoutProvider(mapObjects: MapObject[]): FillerLayoutProvider {
  const fillerCache: Record<string, FillerItem[]> = {};

  function occupiedZones(districtId: string): { x: number; y: number; r: number }[] {
    const zones: { x: number; y: number; r: number }[] = [];
    mapObjects.filter(m=>m.district===districtId).forEach(function(m){
      const radius = m.bounds ? Math.max(m.bounds.hw, m.bounds.hd) + 24 : 50;
      zones.push({x:localXForDistrict(districtId, m.x, DISTRICT_OFFSETS),y:m.y,r:radius});
    });
    landmarks.filter(m=>m.district===districtId).forEach(m=> zones.push({x:localXForDistrict(districtId, m.x, DISTRICT_OFFSETS), y:m.y, r:70}));
    return zones;
  }

  function generateFillerLayout(districtId: string): FillerItem[] {
    const rand = seededRandom(districtSeeds[districtId]);
    const occupied = occupiedZones(districtId);
    const localRoadXs = [270,700,1130];
    const xBands = buildableBands(localRoadXs, DISTRICT_W, ROAD_VISUAL_CLEARANCE_X);
    const yBands = buildableBands(roadNetwork.horizontal.map(r=>r.y), WORLD_H, ROAD_VISUAL_CLEARANCE_Y);
    const lotBand = { xi:xBands.length-1, yi: districtId==='hub' ? yBands.length-1 : 0 };
    const parkSlots = districtParkSlots[districtId] || [];
    const filler: FillerItem[] = [];
    const placed: Solid[] = occupied.map(o=>({ x:o.x, y:o.y, hw:o.r, hd:o.r }));
    const jit = ()=> rand()-0.5;
    const fitsSolid = function(candidate: Solid): boolean {
      if(candidate.x-candidate.hw < 8 || candidate.x+candidate.hw > DISTRICT_W-8) return false;
      if(candidate.y-candidate.hd < 8 || candidate.y+candidate.hd > WORLD_H-8) return false;
      if(localRoadXs.some(x=> Math.abs(candidate.x-x) < candidate.hw+ROAD_VISUAL_CLEARANCE_X)) return false;
      if(roadNetwork.horizontal.some(r=> Math.abs(candidate.y-r.y) < candidate.hd+ROAD_VISUAL_CLEARANCE_Y)) return false;
      if(roadNetwork.diagonal.some(r=> {
        const x1 = localXForDistrict(districtId, r.x1, DISTRICT_OFFSETS);
        const x2 = localXForDistrict(districtId, r.x2, DISTRICT_OFFSETS);
        if((x1 < -200 && x2 < -200) || (x1 > DISTRICT_W+200 && x2 > DISTRICT_W+200)) return false;
        return distancePointToSegment(candidate.x, candidate.y, x1, r.y1, x2, r.y2) < Math.max(candidate.hw,candidate.hd)+r.w/2+18;
      })) return false;
      return !placed.some(s=>rectsOverlap(candidate, s, BUILDING_GAP));
    };
    const pushBuilding = function(zone: MapZoneType, x: number, y: number, w: number, d: number, h: number, hue: number, rot: number, style?: 'apartment'): void {
      const ext = rotatedHalfExtents(w, d, rot);
      const solid = { x, y, hw:ext.hw, hd:ext.hd };
      if(!fitsSolid(solid)) return;
      filler.push({kind:'building', zone, x, y, w, d, h, hue, rot, style});
      placed.push(solid);
    };
    const pushEdge = function(x: number, y: number, w: number, d: number, h: number, hue: number, rot: number): void {
      const ext = rotatedHalfExtents(w, d, rot);
      const solid = { x, y, hw:ext.hw, hd:ext.hd };
      if(!fitsSolid(solid)) return;
      filler.push({kind:'edge', x, y, w, d, h, hue, rot});
      placed.push(solid);
    };
    for(let xi=0; xi<xBands.length; xi++){
      for(let yi=0; yi<yBands.length; yi++){
        const x0=xBands[xi][0], x1=xBands[xi][1], y0=yBands[yi][0], y1=yBands[yi][1];
        const cx=(x0+x1)/2, cy=(y0+y1)/2;
        const blockSolid = { x:cx, y:cy, hw:(x1-x0)/2, hd:(y1-y0)/2 };
        const blockHasAnchor = placed.some(o=>rectsOverlap(blockSolid, o, 8));
        const parkSlot = parkSlots.find(function(slot){
          const slotYi = slot.yi === 'south' ? yBands.length - 1 : slot.yi;
          return slot.xi === xi && slotYi === yi;
        });
        if(parkSlot && !blockHasAnchor){ filler.push({kind:'park', name:parkSlot.name, x0,y0,x1,y1}); placed.push(blockSolid); continue; }
        if((xi===lotBand.xi && yi===lotBand.yi || (districtId!=='hub' && xi===0 && yi===1) || (districtId==='hub' && xi===2 && yi===2)) && !blockHasAnchor){ filler.push({kind:'lot', x0,y0,x1,y1}); placed.push(blockSolid); continue; }
        const bw = x1-x0, bd = y1-y0;
        const cols = 2 + Math.floor(rand()*2);
        const rows = 1 + Math.floor(rand()*3);
        const cellW = bw/cols, cellD = bd/rows;
        for(let ci=0; ci<cols; ci++){
          for(let ri=0; ri<rows; ri++){
            if(rand()<0.08) continue;
            const zone = zoneForDistrictBlock(districtId, xi, yi);
            const apartment = zone === 'residential' && rand() > 0.55;
            const w = Math.max(MIN_FILLER_BUILDING_W, cellW*(apartment ? 0.72+rand()*0.18 : 0.58+rand()*0.28));
            const d = Math.max(MIN_FILLER_BUILDING_D, cellD*(apartment ? 0.68+rand()*0.2 : 0.58+rand()*0.28));
            const h = apartment ? 42 + rand()*48 : (districtId==='hub' && yi < 2 ? 70 + rand()*rand()*210 : MIN_FILLER_BUILDING_H + rand()*rand()*82);
            const px = x0 + ci*cellW + (cellW-w)/2 + jit()*cellW*0.2;
            const py = y0 + ri*cellD + (cellD-d)/2 + jit()*cellD*0.2;
            const rot = jit()*0.18 + (rand()<0.12 ? jit()*0.6 : 0);
            pushBuilding(zone, px+w/2, py+d/2, w, d, h, rand(), rot, apartment ? 'apartment' : undefined);
          }
        }
      }
    }
    function skylineRow(yBase: number, yJit: number, tallBias: number): void {
      let x = 10;
      while(x < 1490){
        const w = 30 + rand()*70;
        const gap = 6 + rand()*30;
        const cxLocal = x + w/2;
        const y = yBase + jit()*yJit;
        if(rand()>0.15){
          const d = 40 + rand()*70;
          const h = 34 + rand()*rand()*170*tallBias;
          pushEdge(cxLocal, y, w, d, h, rand(), jit()*0.25);
        }
        x += w + gap;
      }
    }
    skylineRow(58, 34, districtId==='hub'?1.4:0.8);
    skylineRow(145, 38, districtId==='hub'?1.2:0.65);
    skylineRow(1010, 42, districtId==='hub'?1.3:0.75);
    skylineRow(1090, 55, districtId==='hub'?1.6:1.0);
    return filler;
  }

  function fillerFor(districtId: string): FillerItem[] {
    if(!fillerCache[districtId]) fillerCache[districtId] = generateFillerLayout(districtId);
    return fillerCache[districtId];
  }

  function fillerSolids(): Solid[] {
    const list: Solid[] = [];
    ['devlin','westside','hub'].forEach(function(distId){
      const off = DISTRICT_OFFSETS[distId];
      fillerFor(distId).filter((f): f is Extract<FillerItem, {kind:'building'|'edge'}> => f.kind==='building'||f.kind==='edge').forEach(function(f){
        const ext = rotatedHalfExtents(f.w, f.d, f.rot);
        list.push({x:f.x+off,y:f.y,hw:ext.hw+4,hd:ext.hd+4});
      });
    });
    return list;
  }

  return { fillerFor, fillerSolids };
}
