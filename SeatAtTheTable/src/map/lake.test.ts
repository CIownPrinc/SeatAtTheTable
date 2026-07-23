import { describe, expect, it } from 'vitest';
import { circleInsidePolygon, isPointInWater, pointInPolygon } from './geometry';
import { OUTSKIRT_REGIONS, WINDHAVEN_LAKE, WINDHAVEN_LANDMASS, WORLD_N } from './world';

describe('the lake is actually a lake', function () {
  // LEGAL: The whole point of the change. The water north of Windhaven was called a lake
  // LEGAL: while being wide open to the ocean that surrounds the entire map, which makes it a
  // LEGAL: bay. A lake is enclosed, so every point of its shore must sit on land.
  it('is enclosed by land on every side', function () {
    const escaping = WINDHAVEN_LAKE.filter(point => !pointInPolygon(point, WINDHAVEN_LANDMASS));

    expect(escaping, `lake shore points outside the landmass: ${JSON.stringify(escaping)}`).toEqual([]);
  });

  it('holds water in the middle and land beyond its far shore', function () {
    // LEGAL: Sampled across the lake's width rather than at one spot, so a shore that drifts
    // LEGAL: on one side cannot pass.
    const insideLake = [-200, -300, -400].flatMap(y => [1000, 2500, 4000, 5000].map(x => ({ x, y })));
    insideLake.forEach(function(point){
      expect(isPointInWater(point, 8), `expected water at ${point.x},${point.y}`).toBe(true);
    });
  });

  // LEGAL: Stage 1c could only widen the sides and the bottom because the north edge WAS the
  // LEGAL: water. Enclosing the lake is what bought the northern outskirts their room.
  it('leaves room for northern outskirts between the lake and the top of the world', function () {
    const northern = OUTSKIRT_REGIONS.filter(region => region.area.every(point => point.y < -500));

    expect(northern.map(region => region.id)).toContain('northwoods');
    expect(northern.length).toBeGreaterThanOrEqual(3);
    northern.forEach(function(region){
      region.area.forEach(function(point){
        expect(pointInPolygon(point, WINDHAVEN_LANDMASS), `${region.id} corner off the landmass`).toBe(true);
        expect(pointInPolygon(point, WINDHAVEN_LAKE), `${region.id} corner in the lake`).toBe(false);
      });
    });
  });

  it('keeps the northern shore walkable rather than drowning it in the old y<40 rule', function () {
    // LEGAL: The backstop used to be y < 40, from when everything north of the coast was
    // LEGAL: ocean. Left alone it would have made every northern outskirt unreachable.
    expect(isPointInWater({ x: 3000, y: -900 }, 8)).toBe(false);
    expect(circleInsidePolygon({ x: 3000, y: -900 }, 8, WINDHAVEN_LANDMASS)).toBe(true);
    expect(isPointInWater({ x: 3000, y: WORLD_N - 40 }, 8)).toBe(true);
  });
});
