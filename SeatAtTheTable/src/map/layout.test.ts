import { describe, expect, it } from 'vitest';
import { buildableBands, localXForDistrict, rectsOverlap, rotatedHalfExtents } from './layout';

describe('map layout helpers', function () {
  it('converts world x positions into district-local x positions', function () {
    expect(localXForDistrict('westside', 2450, { devlin: 0, westside: 2000 })).toBe(450);
    expect(localXForDistrict('devlin', 450, { devlin: 0, westside: 2000 })).toBe(450);
  });

  it('expands rotated rectangles to their axis-aligned half extents', function () {
    const extents = rotatedHalfExtents(80, 40, Math.PI / 2);

    expect(extents.hw).toBeCloseTo(20);
    expect(extents.hd).toBeCloseTo(40);
  });

  it('treats the requested gap as part of overlap rejection', function () {
    const first = { x: 100, y: 100, hw: 20, hd: 20 };
    const near = { x: 143, y: 100, hw: 20, hd: 20 };
    const far = { x: 151, y: 100, hw: 20, hd: 20 };

    expect(rectsOverlap(first, near, 4)).toBe(true);
    expect(rectsOverlap(first, far, 4)).toBe(false);
  });

  it('returns only road-free bands large enough for buildings', function () {
    expect(buildableBands([300, 600, 900], 1200, 72)).toEqual([
      [15, 228],
      [372, 528],
      [672, 828],
      [972, 1185],
    ]);
  });
});
