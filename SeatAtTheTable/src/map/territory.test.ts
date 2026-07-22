import { describe, expect, it } from 'vitest';
import { territoryBlocks, BLOCKS_PER_DISTRICT } from '../config/blocks';
import { rivalGangs, YOURS_COLOR } from '../config/rivals';
import { districts } from '../config/districts';
import { blockAtPoint, blockColor, blockOwner, blocksForDistrict, ownedBlockCount, territoryLegend } from './territory';

describe('territory blocks', function () {
  it('gives every district a full grid of blocks with unique resistances', function () {
    districts.forEach(function (district) {
      const blocks = blocksForDistrict(territoryBlocks, district.id);
      expect(blocks, `${district.id} block count`).toHaveLength(BLOCKS_PER_DISTRICT);
      const resistances = blocks.map(b => b.resistance).sort((a, b) => a - b);
      expect(resistances, `${district.id} resistances`).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    });
  });

  it('gives every district a named rival crew', function () {
    districts.forEach(function (district) {
      expect(rivalGangs.filter(g => g.district === district.id), district.id).toHaveLength(1);
    });
  });

  it('uses unique block ids so the overlay never draws two blocks as one', function () {
    const ids = territoryBlocks.map(b => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('converts district control into a count of blocks you hold', function () {
    expect(ownedBlockCount(0)).toBe(0);
    expect(ownedBlockCount(65)).toBe(5);
    expect(ownedBlockCount(100)).toBe(8);
  });

  it('clamps control outside 0-100 instead of inventing blocks', function () {
    expect(ownedBlockCount(-40)).toBe(0);
    expect(ownedBlockCount(180)).toBe(BLOCKS_PER_DISTRICT);
  });

  it('always leaves exactly one contested block while a district is in play', function () {
    const blocks = blocksForDistrict(territoryBlocks, 'devlin');
    const owners = blocks.map(b => blockOwner(b, 65));
    expect(owners.filter(o => o === 'yours')).toHaveLength(5);
    expect(owners.filter(o => o === 'contested')).toHaveLength(1);
    expect(owners.filter(o => o === 'rival')).toHaveLength(2);
  });

  it('flips blocks one at a time as control rises, lowest resistance first', function () {
    const block = blocksForDistrict(territoryBlocks, 'devlin').find(b => b.resistance === 3)!;
    expect(blockOwner(block, 30)).toBe('rival');      // LEGAL: owned count 2
    expect(blockOwner(block, 40)).toBe('contested');  // LEGAL: owned count 3
    expect(blockOwner(block, 55)).toBe('yours');      // LEGAL: owned count 4
  });

  it('colors blocks by holder, using the district crew color for rival turf', function () {
    const block = blocksForDistrict(territoryBlocks, 'westside').find(b => b.resistance === 7)!;
    expect(blockColor(blockOwner(block, 100), 'westside')).toBe(YOURS_COLOR);
    expect(blockColor(blockOwner(block, 0), 'westside')).toBe(rivalGangs.find(g => g.district === 'westside')!.color);
  });

  it('finds the block under a point and returns null off the grid', function () {
    const block = territoryBlocks[0];
    expect(blockAtPoint(territoryBlocks, { x: block.x + 5, y: block.y + 5 })?.id).toBe(block.id);
    expect(blockAtPoint(territoryBlocks, { x: -5000, y: -5000 })).toBeNull();
  });

  it('summarises each district for the legend', function () {
    const rows = territoryLegend(territoryBlocks, { devlin: 65, westside: 15, hub: 10 });
    const devlin = rows.find(r => r.district === 'devlin')!;
    expect(devlin.yours).toBe(5);
    expect(devlin.gang?.name).toBe('Rockwell Kings');
    rows.forEach(function (row) {
      expect(row.yours + row.contested + row.rival, row.district).toBe(BLOCKS_PER_DISTRICT);
    });
  });
});
