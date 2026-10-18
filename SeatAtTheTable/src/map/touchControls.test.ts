import { describe, expect, it } from 'vitest';
import { STICK_DEADZONE, stickVector } from './touchControls';

describe('stickVector', function () {
  it('reads a thumb at the rim as full speed in that direction', function () {
    expect(stickVector(50, 0, 50)).toEqual({ x: 1, y: 0 });
    expect(stickVector(0, -50, 50)).toEqual({ x: 0, y: -1 });
  });

  it('keeps partial pushes partial, so a light touch walks slowly', function () {
    const half = stickVector(25, 0, 50);
    expect(half.x).toBeGreaterThan(0.3);
    expect(half.x).toBeLessThan(0.7);
  });

  it('caps a thumb dragged past the rim at full speed', function () {
    const v = stickVector(300, 400, 50);
    expect(Math.hypot(v.x, v.y)).toBeCloseTo(1);
    expect(v.x / v.y).toBeCloseTo(300 / 400);
  });

  it('ignores a resting thumb inside the dead zone', function () {
    expect(stickVector(50 * STICK_DEADZONE * 0.9, 0, 50)).toEqual({ x: 0, y: 0 });
  });
});
