import { describe, expect, it } from 'vitest';
import { FIRE_ROAD_COURSE, advanceRacer, buildCourse, placings, pointAlong, progressAlong, racePrize } from './race';
import { isPointInWater } from './geometry';

const straight = buildCourse([{ x: 0, y: 0 }, { x: 1000, y: 0 }, { x: 2000, y: 0 }], 500);

describe('buildCourse', function () {
  it('spaces checkpoints along the course and ends on the finish line', function () {
    expect(straight.checkpoints.map(c => Math.round(c.x))).toEqual([500, 1000, 1500, 2000]);
    expect(straight.length).toBeCloseTo(2000);
  });
});

describe('the Fire Road course', function () {
  it('is a real race: several checkpoints over thousands of units', function () {
    expect(FIRE_ROAD_COURSE.checkpoints.length).toBeGreaterThanOrEqual(8);
    expect(FIRE_ROAD_COURSE.length).toBeGreaterThan(3000);
  });

  it('runs on dry land the whole way', function () {
    for(let d = 0; d < FIRE_ROAD_COURSE.length; d += 40){
      expect(isPointInWater(pointAlong(FIRE_ROAD_COURSE, d).point, 10), `at ${Math.round(d)}`).toBe(false);
    }
  });
});

describe('racing', function () {
  it('moves a rival along the course at its speed', function () {
    const racer = { id: 'a', along: 0, speed: 200, finishedAt: null as number | null };
    advanceRacer(racer, straight, 1, 0, 0);
    expect(racer.along).toBeCloseTo(200, -1);
  });

  it('lets a rival who is well behind the player catch up a little, so the race stays close', function () {
    const behind = { id: 'a', along: 0, speed: 200, finishedAt: null as number | null };
    const level = { id: 'b', along: 0, speed: 200, finishedAt: null as number | null };
    advanceRacer(behind, straight, 1, 800, 0);
    advanceRacer(level, straight, 1, 0, 0);
    expect(behind.along).toBeGreaterThan(level.along);
  });

  it('marks a rival finished when it crosses the line', function () {
    const racer = { id: 'a', along: 1990, speed: 200, finishedAt: null as number | null };
    advanceRacer(racer, straight, 1, 0, 12.5);
    expect(racer.finishedAt).toBe(12.5);
  });

  it('reads the player\'s progress from where they are on the road', function () {
    expect(progressAlong(straight, { x: 740, y: 30 }, 600)).toBeCloseTo(740, -1);
  });

  it('ranks finishers by time and everyone else by distance', function () {
    const order = placings([
      { id: 'slow', along: 900, finishedAt: null },
      { id: 'winner', along: 2000, finishedAt: 30 },
      { id: 'fast', along: 1500, finishedAt: null },
      { id: 'second', along: 2000, finishedAt: 33 },
    ]);
    expect(order).toEqual(['winner', 'second', 'fast', 'slow']);
  });

  it('pays most for first and nothing for last', function () {
    expect(racePrize(1, 4).cash).toBeGreaterThan(racePrize(2, 4).cash);
    expect(racePrize(4, 4).cash).toBe(0);
  });
});
