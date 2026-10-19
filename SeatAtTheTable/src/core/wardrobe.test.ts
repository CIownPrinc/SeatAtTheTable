import { describe, expect, it } from 'vitest';
import { cycleOption } from './wardrobe';
import { WARDROBE } from '../map/personModel';

describe('cycleOption', function () {
  it('steps to the next option in a slot', function () {
    expect(cycleOption('hat', 'none', 1)).toBe(WARDROBE.hat[1]);
  });

  it('wraps round both ways', function () {
    expect(cycleOption('hat', WARDROBE.hat[WARDROBE.hat.length - 1], 1)).toBe(WARDROBE.hat[0]);
    expect(cycleOption('hat', WARDROBE.hat[0], -1)).toBe(WARDROBE.hat[WARDROBE.hat.length - 1]);
  });
});
