import { describe, expect, it } from 'vitest';
import type { MapObject } from './objects';
import type { MapNpc } from './markers';
import { createMapPlaceRecords } from './places';
import { bridgeAtPoint, isPointOnPlayableLand, mapPointContext, nearestPlaceAtPoint, placesByCategory, projectPointToRoad, routeHintBetween } from './queries';
import { windhavenMapModel } from './mapModel';

describe('map gameplay queries', function () {
  const npc: MapNpc = { id:'sanjay', name:'Sanjay', district:'devlin', x:1300, y:960, type:'named' };
  const npcObject: MapObject<'npc', MapNpc> = {
    kind:'npc',
    id:npc.id,
    district:npc.district,
    x:npc.x,
    y:npc.y,
    interactRadius:46,
    minimapColor:'#f0efe8',
    minimapSize:2,
    minimapIcon:'person',
    ref:npc,
  };
  const places = createMapPlaceRecords([npcObject], windhavenMapModel.landmarks);

  it('returns place lists and nearest place records from one place source', function () {
    expect(placesByCategory(places, 'person').map(place => place.name)).toEqual(['Sanjay']);
    expect(placesByCategory(places, 'landmark').map(place => place.id)).toContain('devlinHall');
    expect(nearestPlaceAtPoint(places, { x:1306, y:962 }, 42)?.id).toBe('sanjay');
    expect(nearestPlaceAtPoint(places, { x:900, y:900 }, 42)).toBeNull();
  });

  it('classifies one gameplay point for land, water, bridge, district, road, and place', function () {
    const context = mapPointContext({ x:1302, y:958 }, places, { placeMaxDistance:42 });

    expect(context.districtId).toBe('devlin');
    expect(context.isLand).toBe(true);
    expect(context.isWater).toBe(false);
    expect(context.bridge).toBeNull();
    expect(context.nearestRoad.road.name).toBe('Cermak Road');
    expect(context.nearestPlace?.name).toBe('Sanjay');
  });

  it('separates water, playable land, and bridge crossings', function () {
    expect(isPointOnPlayableLand({ x:700, y:600 }, 8)).toBe(true);
    expect(isPointOnPlayableLand({ x:700, y:30 }, 8)).toBe(false);
    expect(mapPointContext({ x:1700, y:560 }, places, { radius:24 }).isWater).toBe(true);
    expect(bridgeAtPoint({ x:1700, y:600 }, 24)?.roadName).toBe('Roosevelt Road');
  });

  it('projects arbitrary points to nearest roads for future route and patrol systems', function () {
    const projection = projectPointToRoad({ x:710, y:520 });

    expect(projection.road.name).toBe('Devlin Street');
    expect(projection.point.x).toBeCloseTo(700);
    expect(projection.distance).toBeCloseTo(10);
  });

  it('builds a route hint with bridge crossings between districts', function () {
    const route = routeHintBetween({ x:700, y:600 }, { x:2700, y:600 });

    expect(route.waypoints[0]).toEqual({ x:700, y:600 });
    expect(route.waypoints[route.waypoints.length - 1]).toEqual({ x:2700, y:600 });
    expect(route.bridges.map(bridge => bridge.roadName)).toContain('Roosevelt Road');
    expect(route.roads.map(road => road.name)).toContain('Roosevelt Road');
    expect(route.distance).toBeGreaterThan(1900);
  });
});
