import type { Point, Solid } from '../../config/types';
import { VEHICLE_SCALE } from '../../map/scale';
import { trafficFootprint } from '../../map/vehicleModels';
import { roadNetwork } from '../../map/world';
import type { BlockCharacter } from '../../map/neighbourhoods';
import { FRONTAGE, buildable, lotSolid, type Lot } from './lots';

// LEGAL: Surface car parks along the shopping, office and industrial streets (TODO 163). The city
// LEGAL: had nowhere to leave a car but the kerb, and nobody else's car was ever parked anywhere. A
// LEGAL: car park takes the place of a run of buildings on one side of a block: open asphalt from
// LEGAL: the pavement back, one row of bays at the back, the aisle in front of them open to the
// LEGAL: street. Your car left in one stays there; left in the street it still goes home.
export interface ParkedCar { cls: string; colour: string }

export interface ParkingBay {
  x: number;
  y: number;
  // LEGAL: The way a car parked in it points: nose in, toward the back of the car park.
  facing: number;
  car: ParkedCar | null;
  // LEGAL: Kept free for the traffic that pulls in to park (map/traffic errandRoute).
  reserved: boolean;
}

export interface ParkingLot {
  id: string;
  name: string;
  x: number;
  y: number;
  // LEGAL: Along the street (w) and back from it (d), turned like a lot so +Z faces the street.
  w: number;
  d: number;
  rot: number;
  district: string;
  bays: ParkingBay[];
  // LEGAL: The middle of the aisle, and the street's centre line straight out in front of it.
  aisle: Point;
  street: Point;
  // LEGAL: Unit vector from the car park to its street.
  out: Point;
}

export const BAY_WIDTH = 34;
export const BAY_DEPTH = 62;
// LEGAL: The car park runs from the pavement's edge to just short of the buildings behind it.
const NEAR = 48;
const FAR = 150;
const DEPTH = FAR - NEAR;
const MIN_WIDTH = 190;
const MAX_WIDTH = 290;
const MAX_PER_DISTRICT = 4;
const ROW_BREAK = 120;
const CHARACTERS: ReadonlySet<BlockCharacter> = new Set(['shopping', 'corporate', 'entertainment', 'industrial', 'working']);
const PARKED_CLASSES = ['sedan', 'beater', 'wagon', 'suv', 'pickup', 'van', 'ev'];
const PARKED_COLOURS = ['#704040', '#3e6b8a', '#6b6f78', '#20242c', '#d8dce2', '#8a7a5a', '#3d4a35'];

function hash(a: number, b: number): number {
  let h = Math.imul(Math.round(a) ^ 0x9e3779b1, 0x85ebca6b) ^ Math.imul(Math.round(b) ^ 0xc2b2ae35, 0x27d4eb2f);
  h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12;
  return (h >>> 0) / 4294967296;
}

function outOf(rot: number): Point {
  return { x:Math.round(Math.sin(rot)), y:Math.round(Math.cos(rot)) };
}

// LEGAL: From the car park's own frame (u along the street, v toward it, from its centre) to the map.
export function parkingToWorld(lot: Pick<ParkingLot, 'x' | 'y' | 'out'>, u: number, v: number): Point {
  const along = { x:-lot.out.y, y:lot.out.x };
  return { x:lot.x + along.x * u + lot.out.x * v, y:lot.y + along.y * u + lot.out.y * v };
}

function overlaps(a: Solid, b: Solid, gap: number): boolean {
  return Math.abs(a.x - b.x) < a.hw + b.hw + gap && Math.abs(a.y - b.y) < a.hd + b.hd + gap;
}

export function parkingSolid(lot: Pick<ParkingLot, 'x' | 'y' | 'w' | 'd' | 'rot'>): Solid {
  return lotSolid(lot);
}

// LEGAL: Named by its street and the nearest cross street, since one street has several.
function parkingName(street: Point, out: Point): string {
  const horizontal = roadNetwork.horizontal.reduce((best, h) => (Math.abs(h.y - street.y) < Math.abs(best.y - street.y) ? h : best)).name;
  const vertical = roadNetwork.vertical.reduce((best, v) => (Math.abs(v.x - street.x) < Math.abs(best.x - street.x) ? v : best)).name;
  return out.y !== 0 ? `the car park on ${horizontal} by ${vertical}` : `the car park on ${vertical} by ${horizontal}`;
}

function layBays(lot: Omit<ParkingLot, 'bays'>): ParkingBay[] {
  const count = Math.floor((lot.w - 16) / BAY_WIDTH);
  const facing = Math.atan2(-lot.out.y, -lot.out.x);
  const middle = Math.floor(count / 2);
  return Array.from({ length:count }, function(_unused, i){
    const u = (i - (count - 1) / 2) * BAY_WIDTH;
    const at = parkingToWorld(lot, u, -lot.d / 2 + BAY_DEPTH / 2 + 4);
    const reserved = i === middle;
    const roll = hash(at.x, at.y);
    // LEGAL: The bay beside the reserved one is always free, so there's room for you.
    const car = !reserved && i !== middle + 1 && roll < 0.6
      ? { cls:PARKED_CLASSES[Math.floor(hash(at.y, at.x) * PARKED_CLASSES.length)], colour:PARKED_COLOURS[Math.floor(roll / 0.6 * PARKED_COLOURS.length)] }
      : null;
    return { x:at.x, y:at.y, facing, car, reserved };
  });
}

interface Side { key: string; lots: Lot[]; out: Point; front: number }

// LEGAL: The lots in a row along one street, in order along it.
function sidesOf(lots: readonly Lot[]): Side[] {
  const sides = new Map<string, Side>();
  lots.forEach(function(lot){
    if(lot.site) return;
    const out = outOf(lot.rot);
    const front = out.y !== 0 ? lot.y + out.y * lot.d / 2 : lot.x + out.x * lot.d / 2;
    const key = `${out.x},${out.y},${Math.round(front / 4)}`;
    const side = sides.get(key) ?? { key, lots:[], out, front };
    side.lots.push(lot);
    sides.set(key, side);
  });
  // LEGAL: One street runs past many blocks: a row ends where a cross street or a place breaks it.
  const rows: Side[] = [];
  [...sides.values()].sort((a, b) => a.key.localeCompare(b.key)).forEach(function(side){
    const along = (lot: Lot) => (side.out.y !== 0 ? lot.x : lot.y);
    side.lots.sort((a, b) => along(a) - along(b));
    let row: Side | null = null;
    side.lots.forEach(function(lot, i){
      const previous = side.lots[i - 1];
      if(!row || !previous || along(lot) - lot.w / 2 - (along(previous) + previous.w / 2) > ROW_BREAK){
        row = { key:`${side.key}#${rows.length}`, lots:[], out:side.out, front:side.front };
        rows.push(row);
      }
      row.lots.push(lot);
    });
  });
  return rows;
}

export interface ParkingLayout { lots: Lot[]; parking: ParkingLot[] }

// LEGAL: Turns some runs of buildings into car parks. `taken` is what generateLots kept clear of; a
// LEGAL: car park comes further forward than a building (to the pavement), so it's checked again.
// LEGAL: Deterministic: the same city every session and every save.
export function carveParkingLots(lots: readonly Lot[], taken: readonly Solid[]): ParkingLayout {
  const removed = new Set<Lot>();
  const parking: ParkingLot[] = [];
  const perDistrict: Record<string, number> = {};
  sidesOf(lots).forEach(function(side){
    const first = side.lots[0];
    if(!first || !CHARACTERS.has(first.character)) return;
    if((perDistrict[first.district] ?? 0) >= MAX_PER_DISTRICT) return;
    const along = (lot: Lot) => (side.out.y !== 0 ? lot.x : lot.y);
    const half = (lot: Lot) => lot.w / 2;
    const streetLine = side.front + (side.out.y !== 0 ? side.out.y : side.out.x) * FRONTAGE;
    // LEGAL: Roughly two rows in five, picked by where they are, not by chance.
    if(hash(streetLine, along(first)) > 0.4) return;
    for(let i = 0; i < side.lots.length; i++){
      let j = i;
      while(j < side.lots.length && along(side.lots[j]) + half(side.lots[j]) - (along(side.lots[i]) - half(side.lots[i])) < MIN_WIDTH) j++;
      if(j >= side.lots.length) break;
      const run = side.lots.slice(i, j + 1);
      if(run.some(lot => lot.district !== first.district)) continue;
      const start = along(run[0]) - half(run[0]);
      const end = along(run[run.length - 1]) + half(run[run.length - 1]);
      // LEGAL: A gap in the row is a side street or a place's frontage, not something to pave over.
      if(end - start > MAX_WIDTH) continue;
      const w = end - start;
      const centreAlong = (start + end) / 2;
      const sign = side.out.y !== 0 ? side.out.y : side.out.x;
      const centreAcross = streetLine - sign * (NEAR + DEPTH / 2);
      const x = side.out.y !== 0 ? centreAlong : centreAcross;
      const y = side.out.y !== 0 ? centreAcross : centreAlong;
      const rot = run[0].rot;
      const solid = parkingSolid({ x, y, w, d:DEPTH, rot });
      if(!buildable(solid, first.district)) continue;
      if(taken.some(t => overlaps(solid, t, 6))) continue;
      const others = lots.filter(lot => !run.includes(lot) && !removed.has(lot));
      if(others.some(lot => overlaps(solid, lotSolid(lot), 4))) continue;
      if(parking.some(p => overlaps(solid, parkingSolid(p), 12))) continue;
      const n = (perDistrict[first.district] ?? 0) + 1;
      perDistrict[first.district] = n;
      run.forEach(lot => removed.add(lot));
      const out = side.out;
      const street = side.out.y !== 0 ? { x, y:streetLine } : { x:streetLine, y };
      const base = { id:`parking-${first.district}-${n}`, name:'', x, y, w, d:DEPTH, rot, district:first.district, out, street, aisle:{ x:0, y:0 } };
      base.aisle = parkingToWorld(base, 0, DEPTH / 2 - (DEPTH - BAY_DEPTH - 4) / 2);
      base.name = parkingName(street, out);
      parking.push({ ...base, bays:layBays(base) });
      return;
    }
  });
  // LEGAL: Two car parks facing each other across a street get told apart by their side of it.
  const shared = new Set(parking.filter(lot => parking.some(other => other !== lot && other.name === lot.name)).map(lot => lot.name));
  parking.forEach(function(lot){
    if(!shared.has(lot.name)) return;
    const side = lot.out.y > 0 ? 'north' : lot.out.y < 0 ? 'south' : lot.out.x > 0 ? 'west' : 'east';
    lot.name = lot.name.replace('the car park on', `the car park on the ${side} side of`);
  });
  return { lots:lots.filter(lot => !removed.has(lot)), parking };
}

export function parkingLotAt(parking: readonly ParkingLot[], point: Point, margin = 0): ParkingLot | null {
  return parking.find(function(lot){
    const s = parkingSolid(lot);
    return Math.abs(point.x - s.x) <= s.hw + margin && Math.abs(point.y - s.y) <= s.hd + margin;
  }) ?? null;
}

// LEGAL: The nearest bay you can leave a car in: not taken by a parked car, not kept for traffic.
export function nearestFreeBay(lot: ParkingLot, point: Point): ParkingBay | null {
  let best: ParkingBay | null = null, bestDistance = Infinity;
  lot.bays.forEach(function(bay){
    if(bay.car || bay.reserved) return;
    const distance = Math.hypot(bay.x - point.x, bay.y - point.y);
    if(distance < bestDistance){ best = bay; bestDistance = distance; }
  });
  return best;
}

// LEGAL: The bay a point is parked in, to turn the car to face into it.
export function bayAt(parking: readonly ParkingLot[], point: Point): ParkingBay | null {
  for(const lot of parking){
    const bay = lot.bays.find(b => Math.hypot(b.x - point.x, b.y - point.y) < 2);
    if(bay) return bay;
  }
  return null;
}

// LEGAL: The id a parked car is drawn and sized by, the way traffic is (map/vehicleModels).
export function parkedCarId(car: ParkedCar): string {
  return `parked-${car.cls}`;
}

// LEGAL: The parked cars are solid; the asphalt is open, so you can drive in.
export const PARKED_LENGTH = 35 * VEHICLE_SCALE;
export function parkingSolids(parking: readonly ParkingLot[]): Solid[] {
  return parking.flatMap(lot => lot.bays.filter(bay => bay.car).map(function(bay){
    const size = trafficFootprint(parkedCarId(bay.car!));
    const length = size.length * VEHICLE_SCALE, width = size.width * VEHICLE_SCALE;
    const lengthwiseY = Math.abs(Math.sin(bay.facing)) > 0.5;
    return { x:bay.x, y:bay.y, hw:(lengthwiseY ? width : length) / 2, hd:(lengthwiseY ? length : width) / 2 };
  }));
}

// LEGAL: The pay-and-display sign by the street corner of each car park; solid like any post.
export function parkingSignSpot(lot: ParkingLot): Point {
  return parkingToWorld(lot, -lot.w / 2 + 6, lot.d / 2 - 6);
}
