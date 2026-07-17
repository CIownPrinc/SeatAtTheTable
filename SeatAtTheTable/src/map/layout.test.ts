import { describe, expect, it } from 'vitest';
import { businesses } from '../config/ventures';
import { amenityHasSolidFootprint, mapAmenities } from './amenities';
import { buildableBands, localXForDistrict, rectsOverlap, rotatedHalfExtents } from './layout';
import { createMapBuildings } from './markers';
import { actorRadius, canMoveTo, isWaterBlocked } from './movement';
import { districtParkSlots, namedBuildingLots, roadNetwork, ventureDistricts, ventureLots, ventureMapLots } from './world';
import { zoneForDistrictBlock } from './zoning';

describe('map layout helpers', function () {
  it('converts world x positions into district-local x positions', function () {
    expect(localXForDistrict('westside', 2450, { devlin: 0, westside: 2000 })).toBe(450);
    expect(localXForDistrict('devlin', 450, { devlin: 0, westside: 2000 })).toBe(450);
  });

  it('expands rotated rectangles to their axis-aligned half extents', function () {
    const extents = rotatedHalfExtents(80, 40, Math.PI / 2);

    expect(extents.hw).toBeCloseTo(20);
    expect(extents.hd).toBeCloseTo(40);
  });

  it('treats the requested gap as part of overlap rejection', function () {
    const first = { x: 100, y: 100, hw: 20, hd: 20 };
    const near = { x: 143, y: 100, hw: 20, hd: 20 };
    const far = { x: 151, y: 100, hw: 20, hd: 20 };

    expect(rectsOverlap(first, near, 4)).toBe(true);
    expect(rectsOverlap(first, far, 4)).toBe(false);
  });

  it('returns only road-free bands large enough for buildings', function () {
    expect(buildableBands([300, 600, 900], 1200, 72)).toEqual([
      [15, 228],
      [372, 528],
      [672, 828],
      [972, 1185],
    ]);
  });

  it('keeps named business lots clear of roads', function () {
    const lots = [...Object.values(namedBuildingLots), ...Object.values(ventureLots).flat()];

    lots.forEach(function(lot){
      expect(roadNetwork.vertical.some(r=>Math.abs(lot.x - r.x) < 77)).toBe(false);
      expect(roadNetwork.horizontal.some(r=>Math.abs(lot.y - r.y) < 71)).toBe(false);
    });
  });

  it('keeps named business lots from overlapping each other', function () {
    const lots = [...Object.values(namedBuildingLots), ...Object.values(ventureLots).flat()].map(lot=>({
      x: lot.x,
      y: lot.y,
      hw: 40,
      hd: 34,
    }));

    lots.forEach(function(lot, index){
      lots.slice(index + 1).forEach(function(other){
        expect(rectsOverlap(lot, other, 14)).toBe(false);
      });
    });
  });

  it('has a unique venture lot for every venture in each district', function () {
    const counts: Record<string, number> = {};

    businesses.forEach(function(_business, index){
      const district = ventureDistricts[index] || 'hub';
      counts[district] = (counts[district] || 0) + 1;
    });

    Object.entries(counts).forEach(function(entry){
      const [district, count] = entry;
      expect(ventureLots[district].length).toBeGreaterThanOrEqual(count);
    });
  });

  it('maps every buyable venture to an explicit physical lot', function () {
    const seen = new Set<string>();

    businesses.forEach(function(business){
      const lot = ventureMapLots[business.id];

      expect(lot).toBeDefined();
      expect(lot.zone.length).toBeGreaterThan(0);
      expect(roadNetwork.vertical.some(r=>Math.abs(lot.x - r.x) < 77)).toBe(false);
      expect(roadNetwork.horizontal.some(r=>Math.abs(lot.y - r.y) < 71)).toBe(false);
      const key = `${lot.x}:${lot.y}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    });
  });

  it('assigns district blocks to stable land-use zones', function () {
    expect(zoneForDistrictBlock('devlin', 0, 3)).toBe('residential');
    expect(zoneForDistrictBlock('westside', 3, 1)).toBe('industrial');
    expect(zoneForDistrictBlock('hub', 1, 0)).toBe('corporate');
    expect(zoneForDistrictBlock('hub', 2, 2)).toBe('entertainment');
  });

  it('keeps land-use zoning mixed inside each district', function () {
    ['devlin', 'westside', 'hub'].forEach(function(districtId){
      const zones = new Set<string>();

      for(let xi=0; xi<4; xi++){
        for(let yi=0; yi<4; yi++){
          zones.add(zoneForDistrictBlock(districtId, xi, yi));
        }
      }

      expect(zones.size).toBeGreaterThanOrEqual(2);
    });
  });

  it('creates non-overlapping venture markers from the venture list', function () {
    const markers = createMapBuildings(businesses);
    const seen = new Set<string>();

    markers.forEach(function(marker){
      const key = `${marker.x}:${marker.y}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
      expect(roadNetwork.vertical.some(r=>Math.abs(marker.x - r.x) < 77)).toBe(false);
      expect(roadNetwork.horizontal.some(r=>Math.abs(marker.y - r.y) < 71)).toBe(false);
    });
  });

  it('keeps multiple named park slots for each district', function () {
    Object.values(districtParkSlots).forEach(function(slots){
      const seen = new Set<string>();

      expect(slots.length).toBeGreaterThanOrEqual(3);
      slots.forEach(function(slot){
        const key = `${slot.xi}:${slot.yi}`;
        expect(seen.has(key)).toBe(false);
        expect(slot.name.length).toBeGreaterThan(0);
        seen.add(key);
      });
    });
  });

  it('blocks cars from water while allowing bridge crossings', function () {
    const carRadius = actorRadius(true);

    expect(isWaterBlocked(1700, 450, carRadius)).toBe(true);
    expect(isWaterBlocked(1700, 600, carRadius)).toBe(false);
  });

  it('uses vehicle radius for world bounds and solid collision', function () {
    const solids = [{ x: 200, y: 200, hw: 20, hd: 20 }];

    expect(canMoveTo(18, 600, [], true)).toBe(false);
    expect(canMoveTo(245, 200, solids, true)).toBe(true);
    expect(canMoveTo(243, 200, solids, true)).toBe(false);
  });

  it('keeps open-space amenities walkable while storefront amenities have collision', function () {
    const solidKinds = new Set(mapAmenities.filter(a=>amenityHasSolidFootprint(a.kind)).map(a=>a.kind));
    const walkableKinds = new Set(mapAmenities.filter(a=>!amenityHasSolidFootprint(a.kind)).map(a=>a.kind));

    expect(solidKinds).toEqual(new Set(['petstore', 'shop']));
    expect(walkableKinds).toEqual(new Set(['basketball', 'parkgame']));
  });
});
