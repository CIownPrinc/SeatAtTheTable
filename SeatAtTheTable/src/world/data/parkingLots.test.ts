import { describe, expect, it } from 'vitest';
import { auditRoads } from '../../map/sceneAudit';
import { auditFootprintsOnRoads } from '../../map/worldAudit';
import { isPointInWater } from '../../map/geometry';
import { generateLots, lotSolid } from './lots';
import { BAY_WIDTH, PARKED_LENGTH, bayAt, carveParkingLots, nearestFreeBay, parkingLotAt, parkingSolid, parkingSolids } from './parkingLots';

const all = generateLots([]);
const { lots, parking } = carveParkingLots(all, []);

describe('car parks', function () {
  it('puts a few in every district, on the busy streets, each with bays and some cars', function () {
    for(const district of ['devlin', 'westside', 'hub']) expect(parking.filter(p => p.district === district).length, district).toBeGreaterThanOrEqual(2);
    parking.forEach(function(lot){
      expect(lot.bays.length).toBeGreaterThanOrEqual(5);
      expect(lot.bays.some(b => b.car)).toBe(true);
      expect(lot.bays.filter(b => b.reserved).length).toBe(1);
    });
    expect(new Set(parking.map(p => p.name)).size).toBe(parking.length);
  });

  it('takes the place of the buildings it replaces and overlaps none of the rest', function () {
    expect(lots.length).toBeLessThan(all.length);
    parking.forEach(function(lot){
      const s = parkingSolid(lot);
      lots.forEach(other => { const o = lotSolid(other); expect(Math.abs(s.x - o.x) < s.hw + o.hw && Math.abs(s.y - o.y) < s.hd + o.hd).toBe(false); });
      expect(isPointInWater({ x:s.x, y:s.y }, 0)).toBe(false);
    });
  });

  it('stays off the road: it starts at the pavement', function () {
    const footprints = parking.map(p => { const s = parkingSolid(p); return { name:p.id, minX:s.x - s.hw, maxX:s.x + s.hw, minZ:s.y - s.hd, maxZ:s.y + s.hd }; });
    expect(auditFootprintsOnRoads(footprints, auditRoads())).toEqual([]);
    parking.forEach(lot => expect(Math.hypot(lot.street.x - lot.aisle.x, lot.street.y - lot.aisle.y)).toBeLessThan(110));
  });

  it('lays the bays side by side across the back, nose in, each car inside the car park', function () {
    parking.forEach(function(lot){
      const s = parkingSolid(lot);
      lot.bays.forEach(function(bay, i){
        expect(parkingLotAt(parking, bay)?.id).toBe(lot.id);
        // LEGAL: Nose in: pointing away from the street.
        expect(Math.cos(bay.facing) * lot.out.x + Math.sin(bay.facing) * lot.out.y).toBeCloseTo(-1);
        if(i > 0) expect(Math.hypot(bay.x - lot.bays[i - 1].x, bay.y - lot.bays[i - 1].y)).toBeCloseTo(BAY_WIDTH);
        const back = Math.abs((bay.x - s.x) * lot.out.x + (bay.y - s.y) * lot.out.y);
        expect(back + PARKED_LENGTH / 2).toBeLessThan(lot.d / 2);
      });
    });
  });

  it('makes the parked cars solid and leaves the free bays for you', function () {
    const cars = parking.flatMap(p => p.bays.filter(b => b.car));
    expect(parkingSolids(parking).length).toBe(cars.length);
    const lot = parking[0];
    const bay = nearestFreeBay(lot, lot.aisle)!;
    expect(bay.car).toBeNull();
    expect(bay.reserved).toBe(false);
    expect(bayAt(parking, bay)).toBe(bay);
    expect(parkingLotAt(parking, { x:lot.street.x, y:lot.street.y })).toBeNull();
  });

  it('keeps clear of whatever is already standing', function () {
    const first = parkingSolid(parking[0]);
    const again = carveParkingLots(all, [{ x:first.x, y:first.y, hw:10, hd:10 }]).parking;
    expect(again.some(p => Math.abs(p.x - first.x) < first.hw && Math.abs(p.y - first.y) < first.hd)).toBe(false);
  });
});
