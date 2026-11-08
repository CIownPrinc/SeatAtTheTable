import { describe, expect, it } from 'vitest';
import { errandRoutes, laneOffsetPath, roundCorners, trafficRoutes } from './traffic';
import { generateLots } from '../world/data/lots';
import { carveParkingLots } from '../world/data/parkingLots';
import { roadLandSegments } from './mapModel';
import { isPointInWater } from './geometry';

function distanceToSegment(p: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = b.x - a.x, dy = b.y - a.y;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(p.x - (a.x + dx * t), p.y - (a.y + dy * t));
}

// LEGAL: Built once: rebuilding the road list for every route point made this test time out.
const SEGMENTS = roadLandSegments();
function onSomeRoad(p: { x: number; y: number }): boolean {
  return SEGMENTS.some(s => s.path.slice(0, -1).some((a, i) => distanceToSegment(p, a, s.path[i + 1]) <= s.road.width / 2 + 2));
}

describe('laneOffsetPath', function () {
  it('keeps traffic to the right of the centre line', function () {
    // LEGAL: Driving east along y=0; +y is to the driver's right on this map (y grows south).
    const lane = laneOffsetPath([{ x: 0, y: 0 }, { x: 100, y: 0 }], 18);
    lane.forEach(p => expect(p.y).toBeCloseTo(18));
  });
});

describe('roundCorners', function () {
  it('replaces a sharp corner with an arc', function () {
    const path = roundCorners([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }], 30);
    expect(path.length).toBeGreaterThan(3);
    expect(path.some(p => Math.abs(p.x - 100) < 1 && Math.abs(p.y) < 1)).toBe(false);
  });
});

describe('trafficRoutes', function () {
  const TRAFFIC_ROUTES = trafficRoutes();
  it('patrols with police, but mostly carries ordinary traffic', function () {
    const police = TRAFFIC_ROUTES.filter(route => route.id.includes('cruiser')).length;
    expect(police).toBeGreaterThanOrEqual(1);
    expect(TRAFFIC_ROUTES.length - police).toBeGreaterThan(police * 5);
  });

  it('keeps every car on a road and out of the water', function () {
    TRAFFIC_ROUTES.forEach(function(route){
      route.route.forEach(function(p){
        expect(onSomeRoad(p), `${route.id} at ${Math.round(p.x)},${Math.round(p.y)}`).toBe(true);
        expect(isPointInWater(p, 0), `${route.id} in water at ${Math.round(p.x)},${Math.round(p.y)}`).toBe(false);
      });
    });
  });

  it('gives every route somewhere to go', function () {
    TRAFFIC_ROUTES.forEach(route => expect(route.route.length, route.id).toBeGreaterThan(4));
  });
});

describe('errandRoutes', function () {
  const { parking } = carveParkingLots(generateLots([]), []);
  const errands = errandRoutes(parking);

  it('sends a few cars to park, each in a different car park', function () {
    expect(errands.length).toBeGreaterThanOrEqual(2);
    expect(new Set(errands.map(e => e.id)).size).toBe(errands.length);
  });

  it("parks each one in its car park's kept bay for a while, then backs it out", function () {
    errands.forEach(function(errand){
      const marks = errand.marks!;
      const stop = marks.findIndex(m => m?.dwell);
      expect(stop, errand.id).toBeGreaterThan(0);
      const point = errand.route[stop];
      const bay = parking.flatMap(p => p.bays).find(b => Math.hypot(b.x - point.x, b.y - point.y) < 1);
      expect(bay?.reserved, errand.id).toBe(true);
      expect(marks[stop + 1]?.reverse).toBe(true);
      expect(marks.length).toBe(errand.route.length);
    });
  });

  it('drives on the road everywhere but the turn into the car park', function () {
    errands.forEach(function(errand){
      errand.route.forEach(function(p, i){
        if(errand.marks![i] || errand.marks![i + 1]) return;
        expect(onSomeRoad(p), `${errand.id} at ${Math.round(p.x)},${Math.round(p.y)}`).toBe(true);
      });
    });
  });
});
