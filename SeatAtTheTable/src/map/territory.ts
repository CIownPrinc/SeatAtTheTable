import type { BlockOwner, Point, RivalGang, TerritoryBlock } from '../config/types';
import { BLOCKS_PER_DISTRICT } from '../config/blocks';
import { CONTESTED_COLOR, YOURS_COLOR, rivalGangForDistrict } from '../config/rivals';

// LEGAL: Pure territory logic, kept out of header.ts so the minimap overlay, the shop
// LEGAL: pricing, and the tests all read ownership from one place and cannot disagree.

export interface BlockHolding {
  block: TerritoryBlock;
  owner: BlockOwner;
  gang?: RivalGang;
  color: string;
}

// LEGAL: How many blocks a district's control buys you. Control is 0-100 over
// LEGAL: BLOCKS_PER_DISTRICT blocks, so each block is worth 12.5 points. The block whose
// LEGAL: resistance equals the count is the one you are currently fighting over, which is
// LEGAL: why a district in the middle always shows exactly one contested block.
export function ownedBlockCount(control: number): number {
  const clamped = Math.max(0, Math.min(100, control));
  return Math.floor((clamped / 100) * BLOCKS_PER_DISTRICT);
}

export function blockOwner(block: TerritoryBlock, control: number): BlockOwner {
  const owned = ownedBlockCount(control);
  if(block.resistance < owned) return 'yours';
  if(block.resistance === owned) return 'contested';
  return 'rival';
}

export function blockColor(owner: BlockOwner, district: string): string {
  if(owner === 'yours') return YOURS_COLOR;
  if(owner === 'contested') return CONTESTED_COLOR;
  return rivalGangForDistrict(district)?.color ?? CONTESTED_COLOR;
}

export function holdingFor(block: TerritoryBlock, control: number): BlockHolding {
  const owner = blockOwner(block, control);
  return {
    block,
    owner,
    gang: owner === 'yours' ? undefined : rivalGangForDistrict(block.district),
    color: blockColor(owner, block.district),
  };
}

// LEGAL: Blocks carry world coordinates once applyMapWorldCoordinates has run, so this is
// LEGAL: a plain world-space hit test. Returns null off the block grid (canals, shoreline).
export function blockAtPoint(blocks: TerritoryBlock[], point: Point): TerritoryBlock | null {
  return blocks.find(function(b){
    return point.x >= b.x && point.x < b.x + b.w && point.y >= b.y && point.y < b.y + b.h;
  }) ?? null;
}

export function blocksForDistrict(blocks: TerritoryBlock[], district: string): TerritoryBlock[] {
  return blocks.filter(b => b.district === district);
}

// LEGAL: Legend rows for the compact panel beside the minimap: your share of each
// LEGAL: district and which crew holds the remainder.
export interface TerritoryLegendRow {
  district: string;
  gang: RivalGang | undefined;
  yours: number;
  contested: number;
  rival: number;
}

export function territoryLegend(blocks: TerritoryBlock[], controls: Record<string, number>): TerritoryLegendRow[] {
  const districts = [...new Set(blocks.map(b => b.district))];
  return districts.map(function(district){
    const owned = blocksForDistrict(blocks, district).map(b => blockOwner(b, controls[district] ?? 0));
    return {
      district,
      gang: rivalGangForDistrict(district),
      yours: owned.filter(o => o === 'yours').length,
      contested: owned.filter(o => o === 'contested').length,
      rival: owned.filter(o => o === 'rival').length,
    };
  });
}
