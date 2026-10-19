import { describe, expect, it } from 'vitest';
import { COUNTRY_ROADS, smoothPath } from './countryRoads';
import { isPointInWater } from './geometry';
import { routeHintBetween } from './queries';
import { OUTSKIRT_PLACE_LOTS } from './world';

// LEGAL: The mall sits at the end of a city street (Wabash Avenue), not out on a country lane.
const COUNTRY_LOTS = Object.entries(OUTSKIRT_PLACE_LOTS).filter(([id]) => id !== 'mallLakeridge');

function distanceToPath(point: { x: number; y: number }, path: Array<{ x: number; y: number }>): number {
  let best = Infinity;
  for(let i = 0; i < path.length - 1; i++){
    const a = path[i], b = path[i + 1];
    const dx = b.x - a.x, dy = b.y - a.y;
    const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
    best = Math.min(best, Math.hypot(point.x - (a.x + dx * t), point.y - (a.y + dy * t)));
  }
  return best;
}

describe('smoothPath', function () {
  it('passes through every control point', function () {
    const controls = [{ x: 0, y: 0 }, { x: 100, y: 50 }, { x: 200, y: 0 }];
    const path = smoothPath(controls, 20);
    controls.forEach(control => expect(distanceToPath(control, path)).toBeLessThan(0.5));
  });

  it('curves between control points instead of cutting straight across', function () {
    const path = smoothPath([{ x: 0, y: 0 }, { x: 100, y: 100 }, { x: 200, y: 0 }], 10);
    const nearCorner = path.filter(p => Math.abs(p.x - 100) < 15);
    expect(nearCorner.every(p => p.y > 80)).toBe(true);
    expect(path.length).toBeGreaterThan(10);
  });
});

describe('country roads', function () {
  it('stay on dry land along their whole length, with room for the road edge', function () {
    COUNTRY_ROADS.forEach(function(road){
      road.path.forEach(function(point){
        expect(isPointInWater(point, road.width / 2), `${road.name} at ${Math.round(point.x)},${Math.round(point.y)}`).toBe(false);
      });
    });
  });

  it('pass beside each countryside place instead of through its building', function () {
    COUNTRY_LOTS.forEach(function([id, lot]){
      const nearest = Math.min(...COUNTRY_ROADS.map(road => distanceToPath(lot, road.path)));
      expect(nearest, id).toBeGreaterThan(90);
      expect(nearest, id).toBeLessThan(260);
    });
  });

  it('let the GPS route from the city to every countryside place by road', function () {
    const home = { x: 980, y: 600 };
    COUNTRY_LOTS.forEach(function([id, lot]){
      const route = routeHintBetween(home, lot);
      expect(route.roads.some(road => road.roadClass === 'country'), id).toBe(true);
      route.waypoints.forEach(function(point){
        expect(isPointInWater(point, 0), `${id} route at ${Math.round(point.x)},${Math.round(point.y)}`).toBe(false);
      });
    });
  });

  it('reach the mall by road too: its plaza is where Wabash Avenue ends', function () {
    const route = routeHintBetween({ x: 980, y: 600 }, OUTSKIRT_PLACE_LOTS.mallLakeridge);
    expect(route.roads.some(road => road.name === 'Wabash Avenue')).toBe(true);
    route.waypoints.forEach(point => expect(isPointInWater(point, 0)).toBe(false));
  });
});
