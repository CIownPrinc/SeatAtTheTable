import { describe, expect, it } from 'vitest';
import { GROUND_COLORS, blendedGroundColor, groundZoneAt } from './zoning';
import { DISTRICT_OFFSETS, OUTSKIRT_PLACE_LOTS } from '../../map/world';

function difference(a: number[], b: number[]): number {
  return Math.max(...a.map((value, i) => Math.abs(value - b[i])));
}

describe('groundZoneAt', function () {
  it('reads a city block\'s character', function () {
    // LEGAL: Hub block (0, 1) is the financial core; West Side's northern rows are industrial.
    expect(groundZoneAt({ x: DISTRICT_OFFSETS.hub + 200, y: 400 })).toBe('corporate');
    expect(groundZoneAt({ x: DISTRICT_OFFSETS.westside + 200, y: 400 })).toBe('industrial');
  });

  it('reads the countryside region a point falls in', function () {
    expect(groundZoneAt(OUTSKIRT_PLACE_LOTS.airfieldKettle)).toBe('farmland');
    expect(groundZoneAt(OUTSKIRT_PLACE_LOTS.lodgeRidgewood)).toBe('forest');
  });

  it('falls back to open meadow between regions', function () {
    expect(groundZoneAt({ x: -1500, y: 0 })).toBe('meadow');
  });
});

describe('blendedGroundColor', function () {
  it('changes gradually across a zone boundary, not in a hard step', function () {
    // LEGAL: Walk across the boundary between Devlin's working blocks and its shopping row.
    const steps = Array.from({ length: 12 }, (_, i) => blendedGroundColor({ x: DISTRICT_OFFSETS.devlin + 300, y: 240 + i * 10 }));
    for(let i = 1; i < steps.length; i++) expect(difference(steps[i], steps[i - 1])).toBeLessThan(0.05);
    expect(difference(steps[0], steps[steps.length - 1])).toBeGreaterThan(0);
  });

  it('still lands on the zone\'s own colour in the middle of a big zone', function () {
    const middle = blendedGroundColor(OUTSKIRT_PLACE_LOTS.lodgeRidgewood);
    const forest = GROUND_COLORS.forest;
    expect(difference(middle, forest)).toBeLessThan(0.08);
  });
});
