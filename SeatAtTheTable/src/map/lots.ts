import type { Point, Solid } from '../config/types';
import { buildableBands, rectsOverlap } from './layout';

// LEGAL: ---- Lot allocator (world expansion stage 2) ----
// LEGAL: Replaces hand-authored one-point-per-building placement for the buildings that
// LEGAL: compete for space. `namedBuildingLots` is a Record<id, Point>: it can only ever
// LEGAL: express ONE position per building and has no idea what else is nearby, which is
// LEGAL: why buildings ended up overlapping each other and standing in streets, and why
// LEGAL: "two shops on one block" was impossible to author.
// LEGAL:
// LEGAL: This packs several buildings into a block instead: it derives candidate lots from
// LEGAL: the road grid (so nothing lands in a street), then assigns them while rejecting
// LEGAL: anything that would collide with an already-placed building or a fixed obstacle.
// LEGAL: Pure and deterministic — same input, same map, every session and every save.

export interface LotRequest {
  id: string;
  district: string;
  /** Half-width and half-depth of the building footprint. */
  hw: number;
  hd: number;
}

export interface LotSlotOptions {
  districtOffset: number;
  districtWidth: number;
  worldHeight: number;
  /** District-local x centres of the vertical roads. */
  roadXs: number[];
  /** World y centres of the horizontal roads. */
  roadYs: number[];
  /** How far a lot must stay clear of a road centre line. */
  roadClearance: number;
  /** Lots per block cell along each axis. This is what allows several per block. */
  perCell: number;
}

// LEGAL: Candidate lots for one district: the road grid carves the district into blocks,
// LEGAL: and each block is subdivided into a perCell x perCell arrangement of lots, inset
// LEGAL: from the block edge so buildings sit back from the kerb rather than on it.
export function districtLotSlots(options: LotSlotOptions): Point[] {
  const xBands = buildableBands(options.roadXs, options.districtWidth, options.roadClearance);
  const yBands = buildableBands(options.roadYs, options.worldHeight, options.roadClearance);
  const slots: Point[] = [];

  yBands.forEach(function(yBand){
    xBands.forEach(function(xBand){
      for(let yi = 0; yi < options.perCell; yi += 1){
        for(let xi = 0; xi < options.perCell; xi += 1){
          // LEGAL: Centre of sub-cell (xi, yi) within this block.
          const fx = (xi + 0.5) / options.perCell;
          const fy = (yi + 0.5) / options.perCell;
          slots.push({
            x: options.districtOffset + xBand[0] + fx * (xBand[1] - xBand[0]),
            y: yBand[0] + fy * (yBand[1] - yBand[0]),
          });
        }
      }
    });
  });

  return slots;
}

// LEGAL: Taking the first free lot each time bunches every shop into the first block band,
// LEGAL: which looks no better than the crowding it replaced. Reordering the candidates by
// LEGAL: a golden-ratio stride walks them across the whole district instead. It is a fixed
// LEGAL: permutation, not randomness, so placement stays deterministic.
export function spreadSlots(slots: Point[]): Point[] {
  const count = slots.length;
  if(count < 3) return [...slots];
  // LEGAL: Round the golden-ratio step to the nearest integer coprime with count, so the
  // LEGAL: stride visits every slot exactly once instead of cycling a subset.
  let step = Math.max(1, Math.round(count * 0.6180339887));
  while(step > 1 && greatestCommonDivisor(step, count) !== 1) step -= 1;
  return Array.from({ length: count }, (_v, i) => slots[(i * step) % count]);
}

function greatestCommonDivisor(a: number, b: number): number {
  return b === 0 ? a : greatestCommonDivisor(b, a % b);
}

export interface AllocationInput {
  requests: LotRequest[];
  /** Candidate lots per district id. */
  slotsByDistrict: Record<string, Point[]>;
  /** Things already fixed in place that a new building must not collide with. */
  obstacles: Solid[];
  /** Minimum clear space between two footprints. */
  gap: number;
}

export interface AllocationResult {
  placed: Record<string, Point>;
  /** Requests that found no free lot — should always be empty; asserted in tests. */
  unplaced: string[];
}

// LEGAL: Assign each request the first candidate lot that collides with nothing. Requests
// LEGAL: are sorted by id first so allocation never depends on config ordering — adding a
// LEGAL: shop must not silently move every other shop.
export function allocateLots(input: AllocationInput): AllocationResult {
  const placed: Record<string, Point> = {};
  const unplaced: string[] = [];
  const taken: Solid[] = [...input.obstacles];
  const cursor: Record<string, number> = {};

  [...input.requests].sort((a, b) => a.id.localeCompare(b.id)).forEach(function(request){
    const slots = input.slotsByDistrict[request.district] ?? [];
    let index = cursor[request.district] ?? 0;

    while(index < slots.length){
      const slot = slots[index];
      index += 1;
      const footprint: Solid = { x: slot.x, y: slot.y, hw: request.hw, hd: request.hd };
      if(taken.some(other => rectsOverlap(footprint, other, input.gap))) continue;
      placed[request.id] = { x: slot.x, y: slot.y };
      taken.push(footprint);
      cursor[request.district] = index;
      return;
    }

    cursor[request.district] = index;
    unplaced.push(request.id);
  });

  return { placed, unplaced };
}
