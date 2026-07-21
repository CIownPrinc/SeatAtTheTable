import { describe, expect, it } from 'vitest';
import { boundsForPoints, isPointInWater, isPointOnBridge, isPointOnWindhavenLand, pointInPolygon } from './geometry';
import { districtIdAtPlayablePoint, districtIdAtPoint, nearestRoadAtPoint, windhavenMapModel } from './mapModel';
import { createMapPlaceRecords, minimapIconForLocalBusiness, minimapIconForService, nearestMapPlace, placeRecordFromMapObject } from './places';
import type { MapObject } from './objects';
import type { MapNpc } from './markers';
import { clampPointToBounds, createMapViewport, screenToWorld, worldToScreen } from './viewport';
import { CANAL_CHANNELS, WINDHAVEN_LANDMASS, districtParkSlots, roadNetwork } from './world';
import { serviceBuildings } from '../config/serviceBuildings';
import { localBusinesses } from '../config/localBusinesses';
import { businesses } from '../config/ventures';
import { corners } from '../config/trade';
import { gangRecruits } from '../config/gang';
import { mapAmenities } from './amenities';
import { createMapBuildings, mapNpcs } from './markers';
import { buildMapObjects } from './objectFactory';

describe('map viewport and geometry model', function () {
  it('exposes landmass bounds through the Windhaven map model', function () {
    const bounds = boundsForPoints(WINDHAVEN_LANDMASS);

    expect(windhavenMapModel.landBounds).toEqual(bounds);
    expect(windhavenMapModel.landmass).toBe(WINDHAVEN_LANDMASS);
  });

  it('round-trips world and screen points through one viewport', function () {
    const viewport = createMapViewport(900, 520, windhavenMapModel.landmass);
    const world = { x: 4700, y: 600 };
    const screen = worldToScreen(viewport, world);
    const roundTrip = screenToWorld(viewport, screen);

    expect(roundTrip.x).toBeCloseTo(world.x);
    expect(roundTrip.y).toBeCloseTo(world.y);
  });

  it('clamps expanded-map clicks to authored landmass bounds', function () {
    const viewport = createMapViewport(900, 520, windhavenMapModel.landmass);
    const point = clampPointToBounds({ x: -900, y: 2000 }, viewport.bounds);

    expect(point.x).toBe(viewport.bounds.minX);
    expect(point.y).toBe(viewport.bounds.maxY);
  });

  it('classifies land, river, canal, and bridge points from shared map data', function () {
    expect(pointInPolygon({ x: 700, y: 600 }, windhavenMapModel.landmass)).toBe(true);
    expect(isPointOnWindhavenLand({ x: 18, y: 600 }, 8)).toBe(true);
    expect(isPointInWater({ x: 700, y: 30 }, 8)).toBe(true);
    expect(isPointInWater({ x: 1700, y: 560 }, 24)).toBe(true);
    expect(isPointOnBridge({ x: 1700, y: 600 }, 24)).toBe(true);
    expect(isPointInWater({ x: 1700, y: 600 }, 24)).toBe(false);
  });

  it('resolves districts from shared map model label and center data', function () {
    expect(districtIdAtPoint({ x: 700, y: 600 })).toBe('devlin');
    expect(districtIdAtPoint({ x: 2700, y: 600 })).toBe('westside');
    expect(districtIdAtPoint({ x: 4700, y: 600 })).toBe('hub');
    expect(districtIdAtPlayablePoint({ x: 700, y: 30 }, 8)).toBeNull();
    expect(districtIdAtPlayablePoint({ x: 1700, y: 600 }, 24)).toBe('devlin');
    expect(windhavenMapModel.districts.map(district => district.name)).toEqual(['Devlin', 'West Side', 'The Hub']);
  });

  it('promotes named parks into shared map-model records', function () {
    const parkCount = Object.values(districtParkSlots).reduce(function(total, slots){
      return total + slots.length;
    }, 0);
    const firstPark = windhavenMapModel.parks[0];

    expect(windhavenMapModel.parks).toHaveLength(parkCount);
    expect(firstPark).toMatchObject({ district: 'devlin', name: 'INDIAN BOUNDARY PARK' });
    expect(firstPark.center.x).toBeGreaterThan(firstPark.x0);
    expect(firstPark.center.x).toBeLessThan(firstPark.x1);
  });

  it('derives typed road paths, bridges, and rail lines from the shared map model', function () {
    const legacyRoadCount = roadNetwork.vertical.length + roadNetwork.horizontal.length + roadNetwork.diagonal.length;

    expect(windhavenMapModel.roadPaths).toHaveLength(legacyRoadCount);
    expect(windhavenMapModel.bridges).toHaveLength(CANAL_CHANNELS.length * roadNetwork.horizontal.length);
    expect(windhavenMapModel.railLines[0]).toMatchObject({
      id: 'cicero-freight-line',
      trainCycleMs: 38000,
      activeWindow: { start: 0.12, end: 0.92 },
    });
    expect(windhavenMapModel.roadPaths.find(road => road.name === 'Roosevelt Road')?.roadClass).toBe('arterial');
  });

  it('finds the nearest named road through map-model road paths', function () {
    expect(nearestRoadAtPoint({ x: 710, y: 520 }).road.name).toBe('Devlin Street');
    expect(nearestRoadAtPoint({ x: 2460, y: 775 }).road.name).toBe('Canal Bend Road');
  });

  it('turns exact map objects and landmarks into queryable place records', function () {
    const npc: MapNpc = { id: 'sanjay', name: 'Sanjay', district: 'devlin', x: 1300, y: 960, type: 'named' };
    const object: MapObject<'npc', MapNpc> = {
      kind: 'npc',
      id: npc.id,
      district: npc.district,
      x: npc.x,
      y: npc.y,
      interactRadius: 46,
      minimapColor: '#f0efe8',
      minimapSize: 2,
      minimapIcon: 'person',
      ref: npc,
    };

    const record = placeRecordFromMapObject(object);
    const places = createMapPlaceRecords([object], windhavenMapModel.landmarks);

    expect(record).toMatchObject({ id: 'sanjay', name: 'Sanjay', x: 1300, y: 960, category: 'person' });
    expect(record.sourceObject).toBe(object);
    expect(places.some(place => place.id === 'devlinHall' && place.category === 'landmark')).toBe(true);
    expect(nearestMapPlace(places, { x: 1304, y: 961 }, 42)?.name).toBe('Sanjay');
  });

  it('keeps service and local-shop icon categories centralized', function () {
    expect(minimapIconForService(serviceBuildings.find(service => service.kind === 'bankHome')!)).toBe('bank');
    expect(minimapIconForService(serviceBuildings.find(service => service.kind === 'garage')!)).toBe('garage');
    expect(minimapIconForLocalBusiness(localBusinesses.find(business => business.id === 'bar')!)).toBe('bar');
    expect(minimapIconForLocalBusiness(localBusinesses.find(business => business.id === 'patel')!)).toBe('shop');
  });

  it('builds map objects for every authored place source', function () {
    const mapBuildings = createMapBuildings(businesses);
    const objects = buildMapObjects({ mapBuildings, serviceBuildings, localBusinesses, amenities:mapAmenities, corners, npcs:mapNpcs, gangRecruits });
    const kinds = new Set(objects.map(object => object.kind));

    expect(kinds).toEqual(new Set(['building', 'service', 'local', 'amenity', 'corner', 'npc', 'gangnpc']));
    expect(objects.find(object => object.id === 'cart')?.x).toBe(mapBuildings.find(building => building.id === 'cart')?.x);
    expect(objects.find(object => object.id === 'bankHome')?.minimapIcon).toBe('bank');
  });
});
