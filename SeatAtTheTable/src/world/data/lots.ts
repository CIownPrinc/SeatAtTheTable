import type { Point, Solid } from '../../config/types';
import { isPointInWater, pointInPolygon } from '../../map/geometry';
import { clearOfDiagonalRoads, districtIdAtPlayablePoint, windhavenMapModel } from '../../map/mapModel';
import { characterForDistrictBlock, characterProfile, type BlockCharacter } from '../../map/neighbourhoods';
import { storeys } from '../../map/scale';
import { DISTRICT_OFFSETS, DISTRICT_W, WORLD_H, roadNetwork } from '../../map/world';

// LEGAL: The city's buildings, laid out the way a real city is: in rows along every street, each
// LEGAL: facing its street, set back behind the pavement and the street trees. Blocks are the spaces
// LEGAL: between the streets; each side of a block that faces a street is cut into lots. The old
// LEGAL: filler dropped a few boxes in a grid inside each block, which left the city mostly grass.
// LEGAL: The named places keep the lots they already have; nothing is laid out on top of them.
export type LotModel = 'tenement' | 'storefront' | 'showroom' | 'office' | 'tower' | 'works';

export interface Lot {
  x: number;
  y: number;
  // LEGAL: Along the street (w) and back from it (d).
  w: number;
  d: number;
  h: number;
  // LEGAL: Turned so the front (+Z) faces the street.
  rot: number;
  model: LotModel;
  color: string;
  district: string;
  character: BlockCharacter;
  // LEGAL: A lot being built on (map/construction) rather than a finished building.
  site: boolean;
}

// LEGAL: From a street's centre line to the front of its buildings: half the road, the pavement,
// LEGAL: then the strip the street trees stand in.
export const FRONTAGE = 70;
// LEGAL: The corners of a block stay open, so the rows along two streets don't run into each other.
const CORNER = 132;
const GAP = 8;
const MAX_SITES_PER_DISTRICT = 2;

interface Style { models: LotModel[]; width: [number, number]; depth: [number, number]; height: [number, number] }
const STYLES: Record<BlockCharacter, Style> = {
  affluent:      { models:['tenement', 'office'], width:[54, 72], depth:[44, 58], height:[54, 96] },
  working:       { models:['tenement', 'tenement', 'storefront'], width:[44, 60], depth:[40, 54], height:[40, 76] },
  rough:         { models:['tenement', 'storefront', 'works'], width:[40, 58], depth:[38, 52], height:[30, 58] },
  shopping:      { models:['storefront', 'storefront', 'showroom'], width:[46, 64], depth:[40, 54], height:[28, 52] },
  corporate:     { models:['office', 'tower', 'office'], width:[62, 84], depth:[52, 68], height:[90, 240] },
  entertainment: { models:['storefront', 'showroom'], width:[50, 70], depth:[44, 58], height:[32, 60] },
  industrial:    { models:['works', 'works', 'storefront'], width:[64, 90], depth:[50, 70], height:[28, 46] },
};

function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return function(){ s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}

function characterAt(point: Point, district: string): BlockCharacter {
  const xi = Math.max(0, Math.min(3, Math.floor((point.x - DISTRICT_OFFSETS[district]) / (DISTRICT_W / 4))));
  const yi = Math.max(0, Math.min(3, Math.floor(point.y / (WORLD_H / 4))));
  return characterForDistrictBlock(district, xi, yi);
}

function overlaps(a: Solid, b: Solid, gap: number): boolean {
  return Math.abs(a.x - b.x) < a.hw + b.hw + gap && Math.abs(a.y - b.y) < a.hd + b.hd + gap;
}

// LEGAL: The lot's footprint on the ground, axis-aligned (lots only ever face along an axis).
export function lotSolid(lot: Pick<Lot, 'x' | 'y' | 'w' | 'd' | 'rot'>): Solid {
  const across = Math.abs(Math.sin(lot.rot)) > 0.5;
  return { x:lot.x, y:lot.y, hw:(across ? lot.d : lot.w) / 2, hd:(across ? lot.w : lot.d) / 2 };
}

function buildable(solid: Solid, district: string): boolean {
  const corners = [
    { x:solid.x - solid.hw, y:solid.y - solid.hd }, { x:solid.x + solid.hw, y:solid.y - solid.hd },
    { x:solid.x - solid.hw, y:solid.y + solid.hd }, { x:solid.x + solid.hw, y:solid.y + solid.hd }, { x:solid.x, y:solid.y },
  ];
  if(!corners.every(p => districtIdAtPlayablePoint(p, 0) === district)) return false;
  if(corners.some(p => isPointInWater(p, 6) || pointInPolygon(p, windhavenMapModel.lakefrontBeach))) return false;
  return clearOfDiagonalRoads(solid, 14);
}

// LEGAL: One side of a block: a straight run from `from` to `to` (world points), with the street
// LEGAL: on the side given by `out` (a unit vector pointing from the buildings to the street).
interface Side { from: Point; to: Point; out: Point }

// LEGAL: A span between two lines across the city, and whether each line is a street. The outer
// LEGAL: spans run from the last street to the coast, a canal or the edge of town: only their street
// LEGAL: side gets buildings, and the land test drops whatever would stand in the water.
interface Span { a: number; b: number; streetA: boolean; streetB: boolean }
const EDGE_SPAN = 640;

function spans(lines: number[]): Span[] {
  const out: Span[] = [{ a:lines[0] - EDGE_SPAN, b:lines[0], streetA:false, streetB:true }];
  for(let i = 0; i < lines.length - 1; i++){
    const a = lines[i], b = lines[i + 1];
    // LEGAL: Streets either side of a canal don't make one block: each faces its own edge strip.
    if(b - a > 900) out.push({ a, b:a + EDGE_SPAN, streetA:true, streetB:false }, { a:b - EDGE_SPAN, b, streetA:false, streetB:true });
    else out.push({ a, b, streetA:true, streetB:true });
  }
  out.push({ a:lines[lines.length - 1], b:lines[lines.length - 1] + EDGE_SPAN, streetA:true, streetB:false });
  return out;
}

function blockSides(x: Span, y: Span): Side[] {
  const sides: Side[] = [];
  // LEGAL: Rows stop short of a corner only where a street turns it.
  const x0 = x.a + (x.streetA ? CORNER : 0), x1 = x.b - (x.streetB ? CORNER : 0);
  const y0 = y.a + (y.streetA ? CORNER : 0), y1 = y.b - (y.streetB ? CORNER : 0);
  if(y.streetA) sides.push({ from:{ x:x0, y:y.a + FRONTAGE }, to:{ x:x1, y:y.a + FRONTAGE }, out:{ x:0, y:-1 } });
  if(y.streetB) sides.push({ from:{ x:x0, y:y.b - FRONTAGE }, to:{ x:x1, y:y.b - FRONTAGE }, out:{ x:0, y:1 } });
  if(x.streetA) sides.push({ from:{ x:x.a + FRONTAGE, y:y0 }, to:{ x:x.a + FRONTAGE, y:y1 }, out:{ x:-1, y:0 } });
  if(x.streetB) sides.push({ from:{ x:x.b - FRONTAGE, y:y0 }, to:{ x:x.b - FRONTAGE, y:y1 }, out:{ x:1, y:0 } });
  return sides;
}

// LEGAL: The ground between a place and its nearest street, so nothing is built in front of it: a
// LEGAL: place is seen from, and reached from, its street (the garage's apron must stay open).
export function frontageClearance(place: Solid): Solid {
  const street = roadNetwork.horizontal.reduce((best, h) => (Math.abs(h.y - place.y) < Math.abs(best.y - place.y) ? h : best));
  const avenue = roadNetwork.vertical.reduce((best, v) => (Math.abs(v.x - place.x) < Math.abs(best.x - place.x) ? v : best));
  if(Math.abs(street.y - place.y) <= Math.abs(avenue.x - place.x)){
    const y0 = Math.min(street.y, place.y), y1 = Math.max(street.y, place.y);
    return { x:place.x, y:(y0 + y1) / 2, hw:place.hw, hd:(y1 - y0) / 2 };
  }
  const x0 = Math.min(avenue.x, place.x), x1 = Math.max(avenue.x, place.x);
  return { x:(x0 + x1) / 2, y:place.y, hw:(x1 - x0) / 2, hd:place.hd };
}

// LEGAL: `taken` is everything already standing: the named places, landmarks, amenities, dealers'
// LEGAL: corners and the like, each as a footprint to keep clear of.
export function generateLots(taken: readonly Solid[]): Lot[] {
  const xs = [...new Set(roadNetwork.vertical.map(v => v.x))].sort((a, b) => a - b);
  const ys = [...new Set(roadNetwork.horizontal.map(h => h.y))].sort((a, b) => a - b);
  const lots: Lot[] = [];
  const placed: Solid[] = [];
  const sites: Record<string, number> = {};
  spans(xs).forEach(function(xSpan, i){
    spans(ys).forEach(function(ySpan, j){
      const random = seeded(i * 7919 + j * 104729 + 17);
      blockSides(xSpan, ySpan).forEach(function(side){
        const along = { x:Math.sign(side.to.x - side.from.x), y:Math.sign(side.to.y - side.from.y) };
        const length = Math.hypot(side.to.x - side.from.x, side.to.y - side.from.y);
        // LEGAL: Front (+Z) toward the street: the turn that takes +Z onto `out`.
        const rot = Math.atan2(side.out.x, side.out.y);
        let at = 0;
        while(at < length){
          const probe = { x:side.from.x + along.x * at, y:side.from.y + along.y * at };
          const district = districtIdAtPlayablePoint(probe, 0);
          if(!district){ at += 30; continue; }
          const character = characterAt(probe, district);
          const style = STYLES[character];
          const profile = characterProfile(character);
          const w = style.width[0] + random() * (style.width[1] - style.width[0]);
          const d = style.depth[0] + random() * (style.depth[1] - style.depth[0]);
          const h = storeys(style.height[0] + random() * random() * (style.height[1] - style.height[0]));
          const model = style.models[Math.floor(random() * style.models.length)];
          const color = profile.palette[Math.floor(random() * profile.palette.length)];
          const vacant = random() < profile.vacancyChance;
          const siteRoll = random();
          if(at + w > length) break;
          const centre = { x:probe.x + along.x * w / 2 - side.out.x * d / 2, y:probe.y + along.y * w / 2 - side.out.y * d / 2 };
          at += w + GAP;
          if(vacant) continue;
          const lot = { x:centre.x, y:centre.y, w, d, h, rot, model, color, district, character, site:false };
          const solid = lotSolid(lot);
          if(!buildable(solid, district)) continue;
          if(taken.some(t => overlaps(solid, t, 12)) || placed.some(p => overlaps(solid, p, 4))) continue;
          if(siteRoll < 0.05 && (sites[district] ?? 0) < MAX_SITES_PER_DISTRICT && w > 52){
            lot.site = true;
            sites[district] = (sites[district] ?? 0) + 1;
          }
          lots.push(lot);
          placed.push(solid);
        }
      });
    });
  });
  return lots;
}
