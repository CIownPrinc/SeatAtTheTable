import { describe, expect, it } from 'vitest';
import { nearestLamps } from './streetFurniture';

describe('nearestLamps', function () {
  const lamps = [
    { x: 0, y: 32, z: 0 },
    { x: 100, y: 32, z: 0 },
    { x: 500, y: 32, z: 500 },
    { x: 20, y: 32, z: 10 },
  ];

  it('picks the closest lamps on the ground plane, nearest first', function () {
    expect(nearestLamps(lamps, 5, 5, 2)).toEqual([lamps[0], lamps[3]]);
  });

  it('returns every lamp when there are fewer than asked for', function () {
    expect(nearestLamps(lamps, 0, 0, 10)).toHaveLength(4);
  });

  it('does not reorder the lamp list it was given', function () {
    const before = [...lamps];
    nearestLamps(lamps, 500, 500, 1);
    expect(lamps).toEqual(before);
  });
});
