import { describe, expect, it } from 'vitest';
import { boundsForPoints, isPointInWater, isPointOnBridge, isPointOnWindhavenLand, pointInPolygon } from './geometry';
import { districtIdAtPlayablePoint, districtIdAtPoint, nearestRoadAtPoint, roadLandSegments, windhavenMapModel } from './mapModel';
import { createMapPlaceRecords, mapPlaceCategoryLabel, minimapIconForLocalBusiness, minimapIconForService, nearestMapPlace, placeRecordFromMapObject } from './places';
import type { MapObject } from './objects';
import type { MapNpc } from './markers';
import { clampPointToBounds, createMapViewport, screenToWorld, worldToScreen } from './viewport';
import { CANAL_CHANNELS, WINDHAVEN_LANDMASS, districtParkSlots, roadNetwork } from './world';
import { serviceBuildings } from '../config/serviceBuildings';
import { widenAuthoredX } from './world';

// LEGAL: Authored against the original 1500-wide districts, widened at read time — see
// LEGAL: map/world.ts. Keeps these points meaningful rather than magic numbers.
const wx = widenAuthoredX;
import { localBusinesses } from '../config/localBusinesses';
import { businesses } from '../config/ventures';
import { corners } from '../config/trade';
import { gangRecruits } from '../config/gang';
import { mapAmenities } from './amenities';
import { createMapBuildings, mapNpcs } from './markers';
import { buildMapObjects } from './objectFactory';
import { mapTerrainTheme, mapTransportTheme, terrainForDistrict } from './renderTheme';
import { minimapStaticLayerCacheKey, type MinimapRenderOptions } from './minimap';

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
    expect(pointInPolygon({ x: wx(700), y: 600 }, windhavenMapModel.landmass)).toBe(true);
    expect(isPointOnWindhavenLand({ x: wx(18), y: 600 }, 8)).toBe(true);
    expect(isPointInWater({ x: wx(700), y: 30 }, 8)).toBe(true);
    expect(isPointInWater({ x: wx(-180), y: 40 }, 8)).toBe(true);
    expect(isPointInWater({ x: wx(5700), y: 1180 }, 8)).toBe(true);
    expect(isPointInWater({ x: wx(1700), y: 560 }, 24)).toBe(true);
    expect(isPointOnBridge({ x: wx(1700), y: 600 }, 24)).toBe(true);
    expect(isPointInWater({ x: wx(1700), y: 600 }, 24)).toBe(false);
  });

  it('resolves districts from shared map model label and center data', function () {
    expect(districtIdAtPoint({ x: wx(700), y: 600 })).toBe('devlin');
    expect(districtIdAtPoint({ x: wx(2700), y: 600 })).toBe('westside');
    expect(districtIdAtPoint({ x: wx(4700), y: 600 })).toBe('hub');
    expect(districtIdAtPoint({ x: wx(700), y: 30 })).toBeNull();
    expect(districtIdAtPoint({ x: wx(1700), y: 600 })).toBeNull();
    expect(districtIdAtPlayablePoint({ x: wx(700), y: 30 }, 8)).toBeNull();
    expect(districtIdAtPlayablePoint({ x: wx(1700), y: 600 }, 24)).toBeNull();
    expect(windhavenMapModel.districts.map(district => district.name)).toEqual(['Devlin', 'West Side', 'The Hub']);
    expect(windhavenMapModel.districts.every(district => district.landArea.length > 4)).toBe(true);
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

  it('keeps terrain rendering theme complete for every district', function () {
    expect(mapTerrainTheme.openWater).not.toBe(mapTerrainTheme.baseLand);
    expect(windhavenMapModel.districts.map(district => terrainForDistrict(district.id).id)).toEqual(['devlin', 'westside', 'hub']);
    expect(mapTransportTheme.roadSurface).not.toBe(mapTransportTheme.sidewalk);
    expect(mapTransportTheme.bridgeDeck).not.toBe(mapTransportTheme.bridgeRail);
  });

  it('keys cached minimap static layers by viewport instead of dynamic player overlays', function () {
    const options = {
      ctx: {} as CanvasRenderingContext2D,
      indoors: false,
      dragging: false,
      pan: { x: 0, y: 0 },
      player: { x: 700, y: 600, vx: 0, vy: 0, facing: 0 },
      mapObjects: [],
      districtOffsets: { devlin: 0, westside: 2000, hub: 4000 },
      fillerFor: function(){ return []; },
      worldWidth: 5500,
      worldHeight: 1200,
      landmass: windhavenMapModel.landmass,
      landmarks: windhavenMapModel.landmarks,
      waypoint: null,
      viewW: 900,
      viewH: 520,
      scale: 0.15,
      center: { x: 2700, y: 600 },
      glyphScale: 1.9,
    } satisfies MinimapRenderOptions;

    const movedPlayerOptions = { ...options, player: { x: 900, y: 760, vx: 50, vy: 0, facing: 1 } };

    expect(minimapStaticLayerCacheKey(movedPlayerOptions)).toBe(minimapStaticLayerCacheKey(options));
    expect(minimapStaticLayerCacheKey({ ...options, center: { x: 2800, y: 600 } })).not.toBe(minimapStaticLayerCacheKey(options));
  });

  it('derives typed road paths, bridges, and rail lines from the shared map model', function () {
    const legacyRoadCount = roadNetwork.vertical.length + roadNetwork.horizontal.length + roadNetwork.diagonal.length;
    const diagonalRoads = windhavenMapModel.roadPaths.filter(road => road.roadClass === 'diagonal');

    expect(windhavenMapModel.roadPaths).toHaveLength(legacyRoadCount);
    expect(diagonalRoads.every(road => road.path.length > 2)).toBe(true);
    expect(windhavenMapModel.bridges).toHaveLength(CANAL_CHANNELS.length * roadNetwork.horizontal.length);
    expect(windhavenMapModel.railLines[0]).toMatchObject({
      id: 'cicero-freight-line',
      trainCycleMs: 38000,
      activeWindow: { start: 0.12, end: 0.92 },
    });
    expect(windhavenMapModel.roadPaths.find(road => road.name === 'Roosevelt Road')?.roadClass).toBe('arterial');
  });

  it('exposes only land-backed road render segments for the renderer and minimap', function () {
    const segments = roadLandSegments();

    expect(segments.length).toBeGreaterThan(windhavenMapModel.roadPaths.length);
    segments.forEach(function(segment){
      const midpoint = {
        x: (segment.path[0].x + segment.path[1].x) / 2,
        y: (segment.path[0].y + segment.path[1].y) / 2,
      };
      expect(districtIdAtPoint(midpoint), `${segment.road.name} segment should be on district land`).not.toBeNull();
    });
  });

  it('finds the nearest named road through map-model road paths', function () {
    expect(nearestRoadAtPoint({ x: wx(700) + 10, y: 520 }).road.name).toBe('Devlin Street');
    const canalBend = windhavenMapModel.roadPaths.find(road => road.name === 'Canal Bend Road')!;
    expect(nearestRoadAtPoint(canalBend.path[1]).road.name).toBe('Canal Bend Road');
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
    expect(mapPlaceCategoryLabel(record)).toBe('Person');
    expect(places.some(place => place.id === 'devlinHall' && place.category === 'landmark')).toBe(true);
    expect(nearestMapPlace(places, { x: 1304, y: 961 }, 42)?.name).toBe('Sanjay');
  });

  it('keeps service and local-shop icon categories centralized', function () {
    expect(minimapIconForService(serviceBuildings.find(service => service.kind === 'bankHome')!)).toBe('bank');
    expect(minimapIconForService(serviceBuildings.find(service => service.kind === 'dealership')!)).toBe('garage');
    expect(minimapIconForService(serviceBuildings.find(service => service.kind === 'brokerage')!)).toBe('realty');
    expect(minimapIconForLocalBusiness(localBusinesses.find(business => business.id === 'bar')!)).toBe('bar');
    expect(minimapIconForLocalBusiness(localBusinesses.find(business => business.id === 'patel')!)).toBe('shop');
    expect(mapPlaceCategoryLabel({ category:'service', icon:'bank', sourceKind:'service' })).toBe('Bank');
    expect(mapPlaceCategoryLabel({ category:'local', icon:'shop', sourceKind:'local' })).toBe('Local shop');
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
