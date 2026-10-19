import { describe, expect, it } from 'vitest';
import { isPointInWater } from './geometry';
import { createOutskirtSceneryLayout, radiusForKind } from './outskirtScenery';
import { TRAILS, TRAIL_WIDTH, distanceToTrails } from './trails';
import { OUTSKIRT_PLACE_LOTS } from './world';
import { CENTRAL_PARK } from './centralPark';

describe('countryside trails', function () {
  it('run on dry land, clear of Central Park', function () {
    for(const trail of TRAILS) for(const point of trail.path){
      expect(isPointInWater(point, TRAIL_WIDTH / 2), trail.id).toBe(false);
      expect(CENTRAL_PARK.some(r => point.x > r.x0 && point.x < r.x1 && point.y > r.y0 && point.y < r.y1), trail.id).toBe(false);
    }
  });

  it('leave the places themselves alone', function () {
    for(const [id, lot] of Object.entries(OUTSKIRT_PLACE_LOTS)) expect(distanceToTrails(lot), id).toBeGreaterThan(45);
  });

  it('keep trees, barns and houses off the path', function () {
    for(const item of createOutskirtSceneryLayout()) expect(distanceToTrails(item), `${item.kind} at ${Math.round(item.x)},${Math.round(item.y)}`).toBeGreaterThan(TRAIL_WIDTH / 2 + radiusForKind(item.kind) - 1);
  });
});

describe('countryside scenery', function () {
  it('never grows inside a countryside place', function () {
    for(const item of createOutskirtSceneryLayout()){
      for(const [id, lot] of Object.entries(OUTSKIRT_PLACE_LOTS)) expect(Math.max(Math.abs(item.x - lot.x), Math.abs(item.y - lot.y)), `${item.kind} in ${id}`).toBeGreaterThan(90);
    }
  });
});
