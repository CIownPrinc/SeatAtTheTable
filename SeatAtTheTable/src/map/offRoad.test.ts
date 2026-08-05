import { describe, expect, it } from 'vitest';
import { offRoadSpeedMultiplier } from './offRoad';
import { OUTSKIRT_PLACE_LOTS, OUTSKIRT_REGIONS } from './world';
import { isPointOnPlayableLand } from './queries';

describe('off-road track speed', function(){
  it('slows ordinary cars in woodland while keeping Mudster vehicles capable', function(){
    const woods = OUTSKIRT_REGIONS.find(function(region){ return region.id === 'northwoods'; });
    if(!woods) throw new Error('northwoods is required for the off-road route');
    const point = woods.area[0];
    expect(offRoadSpeedMultiplier(point, 'no-problem-auto')).toBeLessThan(1);
    expect(offRoadSpeedMultiplier(point, 'mudster')).toBe(1);
  });

  it('does not slow a car on normal city ground', function(){
    expect(offRoadSpeedMultiplier({ x:700, y:700 }, 'no-problem-auto')).toBe(1);
  });

  it('has a dry, dealership-sized northern trailhead site', function(){
    const candidates = [
      { x:4340, y:-940 }, { x:4620, y:-900 }, { x:4900, y:-860 }, { x:5180, y:-860 }, { x:5460, y:-860 },
      { x:4620, y:-820 }, { x:4900, y:-820 }, { x:5180, y:-820 }, { x:5460, y:-820 },
    ];
    const valid = candidates.filter(function(point){
      return [{ x:point.x-40, y:point.y-36 }, { x:point.x+40, y:point.y-36 }, { x:point.x-40, y:point.y+36 }, { x:point.x+40, y:point.y+36 }]
        .every(function(corner){ return isPointOnPlayableLand(corner); });
    });
    expect(valid).toContainEqual({ x:5460, y:-820 });
    expect(OUTSKIRT_PLACE_LOTS.mudsterTrailhead).toEqual({ x:5460.4, y:-820 });
    expect(isPointOnPlayableLand(OUTSKIRT_PLACE_LOTS.mudsterTrailhead, 16)).toBe(true);
  });
});
