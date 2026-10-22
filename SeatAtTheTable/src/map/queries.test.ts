import { describe, expect, it } from 'vitest';
import type { MapObject } from './objects';
import type { MapNpc } from './markers';
import { createMapPlaceRecords } from './places';
import { activeTrainSnapshot, bridgeAtPoint, isPointOnPlayableLand, mapPointContext, nearestPlaceAtPoint, placesByCategory, projectPointToRoad, routeHintBetween, routeSummary, trainCrossingBlockAtPoint } from './queries';
import { windhavenMapModel } from './mapModel';
import { widenAuthoredX } from './world';

// LEGAL: World x values here are authored against the original 1500-wide districts and
// LEGAL: widened, so they keep meaning "on Devlin Street" or "mid-canal" instead of being
// LEGAL: magic numbers that have to be re-derived every time the world grows.
const wx = widenAuthoredX;

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
    expect(isPointOnPlayableLand({ x:wx(700), y:600 }, 8)).toBe(true);
    expect(isPointOnPlayableLand({ x:wx(700), y:30 }, 8)).toBe(false);
    expect(mapPointContext({ x:wx(1700), y:560 }, places, { radius:24 }).isWater).toBe(true);
    expect(bridgeAtPoint({ x:wx(1700), y:600 }, 24)?.roadName).toBe('Roosevelt Road');
  });

  it('projects arbitrary points to nearest roads for future route and patrol systems', function () {
    const projection = projectPointToRoad({ x:wx(700) + 10, y:520 });

    expect(projection.road.name).toBe('Devlin Street');
    expect(projection.point.x).toBeCloseTo(wx(700));
    expect(projection.distance).toBeCloseTo(10);
  });

  it('builds a route hint with bridge crossings between districts', function () {
    const route = routeHintBetween({ x:wx(700), y:600 }, { x:wx(2700), y:600 });
    const summary = routeSummary(route);

    expect(route.waypoints[0]).toEqual({ x:wx(700), y:600 });
    expect(route.waypoints[route.waypoints.length - 1]).toEqual({ x:wx(2700), y:600 });
    expect(route.bridges.map(bridge => bridge.roadName)).toContain('Roosevelt Road');
    expect(route.roads.map(road => road.name)).toContain('Roosevelt Road');
    expect(route.distance).toBeGreaterThan(1900);
    expect(summary.label).toContain('via Roosevelt Road');
    expect(summary.label).toContain('crossing Roosevelt Road Bridge');
  });

  it('routes through connected road turns instead of cutting across blocks', function () {
    const route = routeHintBetween({ x:wx(700), y:520 }, { x:wx(1130), y:840 });

    expect(route.waypoints).toContainEqual({ x:wx(700), y:600 });
    expect(route.waypoints).toContainEqual({ x:wx(1130), y:600 });
    expect(route.roads.map(road => road.name)).toEqual(['Devlin Street', 'Roosevelt Road', 'Ashland Row']);
    expect(route.distance).toBeGreaterThan(740);
  });

  it('routes diagonal shortcuts through their real endpoints', function () {
    const route = routeHintBetween({ x:wx(2270), y:900 }, { x:wx(3130), y:300 });

    expect(route.roads.map(road => road.name)).toContain('Canal Bend Road');
    expect(route.waypoints).toContainEqual({ x:wx(2270), y:900 });
    expect(route.waypoints).toContainEqual({ x:wx(3130), y:300 });
    expect(route.distance).toBeLessThan(1500);
  });

  it('reports train positions and crossing blocks from the shared rail timing', function () {
    const rail = windhavenMapModel.railLines[0];
    // LEGAL: When the train is at Roosevelt Road, wherever that falls along the line.
    const along = (600 - rail.path[0].y) / (rail.path[rail.path.length - 1].y - rail.path[0].y);
    const crossingCycle = rail.activeWindow.start + along * (rail.activeWindow.end - rail.activeWindow.start);
    const crossingTime = crossingCycle * rail.trainCycleMs;
    const inactiveTime = (rail.activeWindow.start / 2) * rail.trainCycleMs;

    const at = activeTrainSnapshot(crossingTime, rail)!.point;
    expect(at.x).toBeCloseTo(wx(3470), 6);
    expect(at.y).toBeCloseTo(600, 6);
    expect(activeTrainSnapshot(inactiveTime, rail)).toBeNull();
    expect(trainCrossingBlockAtPoint({ x:wx(3470), y:600 }, crossingTime)?.road.name).toBe('Roosevelt Road');
    expect(trainCrossingBlockAtPoint({ x:wx(3470), y:600 }, inactiveTime)).toBeNull();
  });
});
