import { describe, expect, it } from 'vitest';
import { PLOW_COVER, SNOW_MELT_SECONDS, SNOW_SETTLE_SECONDS, plowOut, snowSurfaceFor, snowWhiteness, stepPlowed, stepSnowCover } from './snow';

function run(cover: number, snowing: boolean, seconds: number): number {
  for(let t = 0; t < seconds; t += 0.5) cover = stepSnowCover(cover, snowing, 0.5);
  return cover;
}

describe('settling snow', function () {
  it('covers the ground while it snows, and no further than fully white', function () {
    expect(run(0, true, SNOW_SETTLE_SECONDS / 2)).toBeCloseTo(0.5, 1);
    expect(run(0, true, SNOW_SETTLE_SECONDS * 3)).toBe(1);
  });

  it('melts away once it stops', function () {
    expect(run(1, false, SNOW_MELT_SECONDS / 2)).toBeCloseTo(0.5, 1);
    expect(run(1, false, SNOW_MELT_SECONDS * 2)).toBe(0);
  });

  it('sends the plow out once enough has settled, and it clears the roads', function () {
    expect(plowOut(PLOW_COVER / 2, 0)).toBe(false);
    expect(plowOut(PLOW_COVER, 0)).toBe(true);
    let plowed = 0;
    for(let t = 0; t < 60; t += 0.5) plowed = stepPlowed(plowed, 0.8, 0.5);
    expect(plowed).toBe(1);
    expect(snowWhiteness('road', 0.8, plowed)).toBeLessThan(snowWhiteness('road', 0.8, 0));
    expect(snowWhiteness('road', 0.8, plowed)).toBeLessThan(snowWhiteness('ground', 0.8, plowed));
  });

  it('starts the plow from scratch after a thaw', function () {
    expect(stepPlowed(1, 0, 0.5)).toBe(0);
  });

  it('settles on grass, roofs, trees and roads, but not on water', function () {
    expect(snowSurfaceFor('ground:#5f7445:1')).toBe('ground');
    expect(snowSurfaceFor('outskirt:barn:roof')).toBe('ground');
    expect(snowSurfaceFor('outskirt:tree-canopy')).toBe('tree');
    expect(snowSurfaceFor('path:#414753:0.9')).toBe('road');
    expect(snowSurfaceFor('terrain:canal-water')).toBeNull();
    expect(snowSurfaceFor('outskirt:barn:base')).toBeNull();
  });
});
