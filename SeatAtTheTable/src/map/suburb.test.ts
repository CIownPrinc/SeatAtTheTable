import { describe, expect, it } from 'vitest';
import { COUNTRY_ROADS } from './countryRoads';
import { distancePointToSegment } from './layout';
import { MALL_GARAGE } from './mall';
import { isPointInWater } from './geometry';
import { suburbLots, suburbSolids } from './suburb';

describe('Lakeridge suburb', function () {
  // LEGAL: Six real-sized houses, not twelve the size of sheds (2026-10-22); more suburb streets come
  // LEGAL: with the bigger map.
  it('lines both sides of Lakeridge Lane with houses', function () {
    const lots = suburbLots();
    expect(lots.length).toBeGreaterThanOrEqual(6);
    expect(lots.filter(lot => lot.side === -1).length).toBe(lots.filter(lot => lot.side === 1).length);
  });

  it('keeps every house off the lanes, out of the water and clear of the mall garage', function () {
    for(const solid of suburbSolids()){
      for(const road of COUNTRY_ROADS){
        const d = Math.min(...road.path.slice(0, -1).map((a, i) => distancePointToSegment(solid.x, solid.y, a.x, a.y, road.path[i + 1].x, road.path[i + 1].y)));
        expect(d, road.id).toBeGreaterThan(road.width / 2 + Math.min(solid.hw, solid.hd));
      }
      expect(isPointInWater({ x: solid.x, y: solid.y }, solid.hw)).toBe(false);
      expect(solid.x - solid.hw).toBeGreaterThan(MALL_GARAGE.x + MALL_GARAGE.w / 2 + 40);
    }
  });

  it('turns each house to face the lane', function () {
    for(const lot of suburbLots()){
      const front = { x: Math.sin(lot.facing), y: Math.cos(lot.facing) };
      expect(Math.sign(front.x)).toBe(lot.side === -1 ? 1 : -1);
    }
  });
});
