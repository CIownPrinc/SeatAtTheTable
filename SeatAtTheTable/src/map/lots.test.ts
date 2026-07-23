import { describe, expect, it } from 'vitest';
import { allocateLots, districtLotSlots, spreadSlots, type LotRequest } from './lots';
import { rectsOverlap } from './layout';

const slotOptions = {
  districtOffset: 0,
  districtWidth: 2100,
  worldHeight: 1200,
  roadXs: [378, 980, 1582],
  roadYs: [300, 600, 900],
  roadClearance: 66,
  perCell: 2,
};

describe('lot allocator', function () {
  it('derives several candidate lots per block, so a block can hold more than one building', function () {
    const single = districtLotSlots({ ...slotOptions, perCell: 1 });
    const packed = districtLotSlots(slotOptions);

    expect(single.length).toBeGreaterThan(0);
    // LEGAL: This is the capability namedBuildingLots could not express at all.
    expect(packed.length).toBe(single.length * 4);
  });

  it('keeps every candidate lot clear of the road centre lines', function () {
    districtLotSlots(slotOptions).forEach(function (slot) {
      slotOptions.roadXs.forEach(function (roadX) {
        expect(Math.abs(slot.x - roadX), `lot at ${slot.x} sits on a vertical road`).toBeGreaterThan(20);
      });
      slotOptions.roadYs.forEach(function (roadY) {
        expect(Math.abs(slot.y - roadY), `lot at ${slot.y} sits on a horizontal road`).toBeGreaterThan(20);
      });
    });
  });

  it('places every request without overlapping anything', function () {
    const requests: LotRequest[] = Array.from({ length: 12 }, (_v, i) => ({
      id: `shop-${i}`, district: 'devlin', hw: 34, hd: 28,
    }));
    const result = allocateLots({
      requests,
      slotsByDistrict: { devlin: districtLotSlots(slotOptions) },
      obstacles: [],
      gap: 14,
    });

    expect(result.unplaced).toEqual([]);
    const placed = Object.entries(result.placed).map(([, p]) => ({ x: p.x, y: p.y, hw: 34, hd: 28 }));
    placed.forEach(function (a, i) {
      placed.slice(i + 1).forEach(function (b) {
        expect(rectsOverlap(a, b, 14), 'two allocated lots overlap').toBe(false);
      });
    });
  });

  it('refuses lots that would collide with a fixed obstacle', function () {
    const slots = districtLotSlots(slotOptions);
    const blocker = { x: slots[0].x, y: slots[0].y, hw: 60, hd: 60 };
    const result = allocateLots({
      requests: [{ id: 'a', district: 'devlin', hw: 34, hd: 28 }],
      slotsByDistrict: { devlin: slots },
      obstacles: [blocker],
      gap: 14,
    });

    expect(result.unplaced).toEqual([]);
    expect(rectsOverlap({ ...result.placed.a, hw: 34, hd: 28 }, blocker, 14)).toBe(false);
  });

  it('is deterministic and independent of request ordering', function () {
    const build = (ids: string[]): LotRequest[] => ids.map(id => ({ id, district: 'devlin', hw: 34, hd: 28 }));
    const slotsByDistrict = { devlin: districtLotSlots(slotOptions) };
    const forward = allocateLots({ requests: build(['a', 'b', 'c']), slotsByDistrict, obstacles: [], gap: 14 });
    const reversed = allocateLots({ requests: build(['c', 'b', 'a']), slotsByDistrict, obstacles: [], gap: 14 });

    // LEGAL: Adding a shop must not silently shuffle every other shop across the map.
    expect(forward.placed).toEqual(reversed.placed);
  });

  it('spreads candidates across the district instead of filling the first band', function () {
    const slots = districtLotSlots(slotOptions);
    const spread = spreadSlots(slots);

    // LEGAL: A permutation — same lots, different visiting order, nothing lost or repeated.
    expect(spread).toHaveLength(slots.length);
    expect(new Set(spread.map(s => `${s.x}:${s.y}`)).size).toBe(slots.length);

    // LEGAL: The first handful of candidates must not all share one band, which is exactly
    // LEGAL: the bunching that made the allocator's first output look no better than the
    // LEGAL: crowding it replaced.
    const firstEightRows = new Set(spread.slice(0, 8).map(s => Math.round(s.y)));
    expect(firstEightRows.size).toBeGreaterThan(2);
  });

  it('keeps the spread stable, so the map does not reshuffle between runs', function () {
    const slots = districtLotSlots(slotOptions);
    expect(spreadSlots(slots)).toEqual(spreadSlots(slots));
  });

  it('reports requests it could not place rather than stacking them', function () {
    const result = allocateLots({
      requests: [
        { id: 'a', district: 'devlin', hw: 34, hd: 28 },
        { id: 'b', district: 'devlin', hw: 34, hd: 28 },
      ],
      slotsByDistrict: { devlin: [{ x: 500, y: 450 }] },
      obstacles: [],
      gap: 14,
    });

    expect(Object.keys(result.placed)).toEqual(['a']);
    expect(result.unplaced).toEqual(['b']);
  });
});
