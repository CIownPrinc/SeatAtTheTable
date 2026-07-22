import { describe, expect, it } from 'vitest';
import { businesses } from '../config/ventures';
import { amenityHasSolidFootprint, mapAmenities } from './amenities';
import { createFillerLayoutProvider } from './filler';
import { buildableBands, distancePointToSegment, localXForDistrict, rectsOverlap, rotatedHalfExtents } from './layout';
import { districtIdAtPlayablePoint } from './mapModel';
import { applyMapWorldCoordinates, createMapBuildings } from './markers';
import { actorRadius, canMoveTo, isWaterBlocked } from './movement';
import { buildMapObjects, ventureFootprint } from './objectFactory';
import { DISTRICT_OFFSETS, districtParkSlots, namedBuildingLots, roadNetwork, ventureDistricts, ventureLots, ventureMapLots } from './world';
import { zoneForDistrictBlock } from './zoning';
import { serviceBuildings } from '../config/serviceBuildings';
import { localBusinesses } from '../config/localBusinesses';
import { corners } from '../config/trade';
import { gangRecruits } from '../config/gang';

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

  it('keeps venture building footprints on playable district land', function () {
    createMapBuildings(businesses).forEach(function(marker){
      const footprint = ventureFootprint(marker);
      const points = [
        { x: marker.x - footprint.w / 2, y: marker.y - footprint.d / 2 },
        { x: marker.x + footprint.w / 2, y: marker.y - footprint.d / 2 },
        { x: marker.x - footprint.w / 2, y: marker.y + footprint.d / 2 },
        { x: marker.x + footprint.w / 2, y: marker.y + footprint.d / 2 },
      ];

      points.forEach(function(point){
        expect(districtIdAtPlayablePoint(point, 0)).toBe(marker.district);
      });
    });
  });

  it('keeps authored service, local, corner, amenity, and recruit points on playable district land', function () {
    const serviceCopies = serviceBuildings.map(service => ({ ...service }));
    const localCopies = localBusinesses.map(business => ({ ...business }));
    const cornerCopies = corners.map(corner => ({ ...corner }));
    const recruitCopies = gangRecruits.map(recruit => ({ ...recruit }));
    applyMapWorldCoordinates(serviceCopies);
    applyMapWorldCoordinates(localCopies);
    applyMapWorldCoordinates(cornerCopies);
    applyMapWorldCoordinates(recruitCopies);

    [...serviceCopies, ...localCopies, ...cornerCopies, ...recruitCopies, ...mapAmenities].forEach(function(item){
      expect(districtIdAtPlayablePoint({ x:item.x, y:item.y }, 16), `${item.id} should sit on ${item.district} land`).toBe(item.district);
    });
  });

  it('keeps every bounded authored map object footprint inside playable land', function () {
    const serviceCopies = serviceBuildings.map(service => ({ ...service }));
    const localCopies = localBusinesses.map(business => ({ ...business }));
    const cornerCopies = corners.map(corner => ({ ...corner }));
    const recruitCopies = gangRecruits.map(recruit => ({ ...recruit }));
    applyMapWorldCoordinates(serviceCopies);
    applyMapWorldCoordinates(localCopies);
    applyMapWorldCoordinates(cornerCopies);
    applyMapWorldCoordinates(recruitCopies);
    const objects = buildMapObjects({
      mapBuildings:createMapBuildings(businesses),
      serviceBuildings:serviceCopies,
      localBusinesses:localCopies,
      amenities:mapAmenities,
      corners:cornerCopies,
      npcs:[],
      gangRecruits:recruitCopies,
    });

    objects.forEach(function(object){
      if(!object.bounds) return;
      [
        { x:object.bounds.x-object.bounds.hw, y:object.bounds.y-object.bounds.hd },
        { x:object.bounds.x+object.bounds.hw, y:object.bounds.y-object.bounds.hd },
        { x:object.bounds.x-object.bounds.hw, y:object.bounds.y+object.bounds.hd },
        { x:object.bounds.x+object.bounds.hw, y:object.bounds.y+object.bounds.hd },
      ].forEach(function(point){
        expect(districtIdAtPlayablePoint(point, 0), `${object.id} footprint should stay on ${object.district} land`).toBe(object.district);
      });
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

  it('crosses canals only on horizontal bridge decks, never via diagonals over water', function () {
    const carRadius = actorRadius(true);

    // LEGAL: On the horizontal bridge deck spanning the canal: passable.
    expect(isWaterBlocked(1775, 600, carRadius)).toBe(false);
    // LEGAL: Between bridges, mid-canal: blocked — no diagonal jumps the water.
    expect(isWaterBlocked(1775, 560, carRadius)).toBe(true);

    // LEGAL: Structural guarantee: no diagonal road's x-span overlaps a canal channel.
    const canals = [{ lo: 1530, hi: 1970 }, { lo: 3530, hi: 3970 }];
    roadNetwork.diagonal.forEach(function (road) {
      const loX = Math.min(road.x1, road.x2);
      const hiX = Math.max(road.x1, road.x2);
      canals.forEach(function (c) {
        expect(hiX < c.lo || loX > c.hi).toBe(true);
      });
    });
  });

  it('uses vehicle radius for world bounds and solid collision', function () {
    const solids = [{ x: 200, y: 200, hw: 20, hd: 20 }];

    expect(canMoveTo(18, 600, [], true)).toBe(true);
    expect(canMoveTo(-280, 600, [], false)).toBe(false);
    expect(canMoveTo(245, 200, solids, true)).toBe(true);
    expect(canMoveTo(243, 200, solids, true)).toBe(false);
  });

  it('keeps filler buildings large enough and off diagonal roads', function () {
    const markers = createMapBuildings(businesses);
    const provider = createFillerLayoutProvider(markers.map(function(marker){
      return { kind:'building' as const, id:marker.id, district:marker.district, x:marker.x, y:marker.y, bounds:{x:marker.x,y:marker.y,hw:40,hd:34}, interactRadius:46, minimapColor:'#fff', minimapSize:3, ref:marker };
    }));

    ['devlin','westside','hub'].forEach(function(districtId){
      provider.fillerFor(districtId).forEach(function(filler){
        if(filler.kind !== 'building') return;
        expect(filler.w).toBeGreaterThanOrEqual(34);
        expect(filler.d).toBeGreaterThanOrEqual(30);
        expect(filler.h).toBeGreaterThanOrEqual(24);
        const off = DISTRICT_OFFSETS[districtId];
        roadNetwork.diagonal.forEach(function(road){
          const distance = distancePointToSegment(filler.x+off, filler.y, road.x1, road.y1, road.x2, road.y2);
          expect(distance).toBeGreaterThan(Math.max(filler.w,filler.d)/2 + road.w/2);
        });
      });
    });
  });

  it('keeps filler buildings, lots, and parks inside their district land polygons', function () {
    const markers = createMapBuildings(businesses);
    const provider = createFillerLayoutProvider(markers.map(function(marker){
      return { kind:'building' as const, id:marker.id, district:marker.district, x:marker.x, y:marker.y, bounds:{x:marker.x,y:marker.y,hw:40,hd:34}, interactRadius:46, minimapColor:'#fff', minimapSize:3, ref:marker };
    }));

    ['devlin','westside','hub'].forEach(function(districtId){
      const off = DISTRICT_OFFSETS[districtId];
      provider.fillerFor(districtId).forEach(function(filler){
        if(filler.kind === 'building'){
          const ext = rotatedHalfExtents(filler.w, filler.d, filler.rot);
          [
            { x:filler.x-ext.hw+off, y:filler.y-ext.hd },
            { x:filler.x+ext.hw+off, y:filler.y-ext.hd },
            { x:filler.x-ext.hw+off, y:filler.y+ext.hd },
            { x:filler.x+ext.hw+off, y:filler.y+ext.hd },
          ].forEach(function(point){
            expect(districtIdAtPlayablePoint(point, 0), `${filler.kind} should stay on ${districtId} land`).toBe(districtId);
          });
          return;
        }
        if(filler.kind === 'edge') return;
        [
          { x:filler.x0+off, y:filler.y0 },
          { x:filler.x1+off, y:filler.y0 },
          { x:filler.x0+off, y:filler.y1 },
          { x:filler.x1+off, y:filler.y1 },
        ].forEach(function(point){
          expect(districtIdAtPlayablePoint(point, 0), `${filler.kind} should stay on ${districtId} land`).toBe(districtId);
        });
      });
    });
  });

  it('adds apartment buildings to residential filler blocks', function () {
    const provider = createFillerLayoutProvider([]);
    const apartments = ['devlin','westside','hub'].flatMap(districtId=>provider.fillerFor(districtId)).filter(f=>f.kind==='building' && f.style==='apartment');

    expect(apartments.length).toBeGreaterThan(0);
    apartments.forEach(function(apartment){
      if(apartment.kind !== 'building') return;
      expect(apartment.zone).toBe('residential');
      expect(apartment.h).toBeGreaterThanOrEqual(42);
    });
  });

  it('keeps open-space amenities walkable while storefront amenities have collision', function () {
    const solidKinds = new Set(mapAmenities.filter(a=>amenityHasSolidFootprint(a.kind)).map(a=>a.kind));
    const walkableKinds = new Set(mapAmenities.filter(a=>!amenityHasSolidFootprint(a.kind)).map(a=>a.kind));

    expect(solidKinds).toEqual(new Set(['petstore', 'shop']));
    expect(walkableKinds).toEqual(new Set(['basketball', 'parkgame']));
  });
});
