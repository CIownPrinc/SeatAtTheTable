import { describe, expect, it } from 'vitest';
import { CANAL_CHANNELS, DISTRICT_OFFSETS, DISTRICT_W, WORLD_W, widenAuthoredX } from './world';

// LEGAL: Guards the district-widening transform. Every coordinate in map/world.ts is
// LEGAL: authored against 1500-wide districts and stretched through widenAuthoredX, so if
// LEGAL: this mapping is wrong the whole map silently drifts off its own land.
describe('district widening transform', function () {
  it('leaves the origin alone', function () {
    expect(widenAuthoredX(0)).toBe(0);
  });

  it('maps each authored district edge onto the widened layout', function () {
    expect(widenAuthoredX(1500)).toBe(DISTRICT_W);
    expect(widenAuthoredX(2000)).toBe(DISTRICT_OFFSETS.westside);
    expect(widenAuthoredX(3500)).toBe(DISTRICT_OFFSETS.westside + DISTRICT_W);
    expect(widenAuthoredX(4000)).toBe(DISTRICT_OFFSETS.hub);
    expect(widenAuthoredX(5500)).toBe(WORLD_W);
  });

  it('widens districts but leaves canals their authored width', function () {
    const canalOne = widenAuthoredX(2000) - widenAuthoredX(1500);
    const canalTwo = widenAuthoredX(4000) - widenAuthoredX(3500);
    expect(canalOne).toBe(500);
    expect(canalTwo).toBe(500);
    CANAL_CHANNELS.forEach(function (channel) {
      expect(channel.width, channel.name).toBe(500);
    });
  });

  it('gives every district the same widened width', function () {
    expect(widenAuthoredX(1500) - widenAuthoredX(0)).toBe(DISTRICT_W);
    expect(widenAuthoredX(3500) - widenAuthoredX(2000)).toBe(DISTRICT_W);
    expect(widenAuthoredX(5500) - widenAuthoredX(4000)).toBe(DISTRICT_W);
  });

  it('actually makes the districts bigger than they were authored', function () {
    expect(DISTRICT_W).toBeGreaterThan(1500);
    expect(WORLD_W).toBeGreaterThan(5500);
  });

  it('is strictly increasing, so nothing can fold over itself', function () {
    let previous = -Infinity;
    for(let x = -400; x <= 6000; x += 25){
      const widened = widenAuthoredX(x);
      expect(widened, `x=${x}`).toBeGreaterThan(previous);
      previous = widened;
    }
  });

  it('extrapolates past both ends so the coastline stretches with the world', function () {
    // LEGAL: The landmass polygon runs to x=-260 and x=5810, outside every breakpoint.
    expect(widenAuthoredX(-260)).toBeLessThan(0);
    expect(widenAuthoredX(5810)).toBeGreaterThan(WORLD_W);
  });

  it('keeps district-local offsets consistent with the district width', function () {
    expect(DISTRICT_OFFSETS.westside).toBe(DISTRICT_W + 500);
    expect(DISTRICT_OFFSETS.hub).toBe(DISTRICT_W * 2 + 1000);
    expect(WORLD_W).toBe(DISTRICT_W * 3 + 1000);
  });
});
