import { describe, expect, it } from 'vitest';
import { auditRoads } from '../../map/sceneAudit';
import { auditFootprintsOnRoads } from '../../map/worldAudit';
import { isPointInWater } from '../../map/geometry';
import { frontageClearance, generateLots, lotSolid } from './lots';

const lots = generateLots([]);
const solids = lots.map(lotSolid);

describe('city lots', function () {
  it('fills the city with rows of buildings, not a few boxes', function () {
    expect(lots.length).toBeGreaterThan(150);
    for(const district of ['devlin', 'westside', 'hub']) expect(lots.filter(l => l.district === district).length, district).toBeGreaterThan(40);
  });

  it('keeps every building out of every road, turning circle and diagonal', function () {
    const footprints = solids.map((s, i) => ({ name:`lot ${i}`, minX:s.x - s.hw, maxX:s.x + s.hw, minZ:s.y - s.hd, maxZ:s.y + s.hd }));
    expect(auditFootprintsOnRoads(footprints, auditRoads())).toEqual([]);
  });

  it('builds nothing in the water and nothing on top of another building', function () {
    solids.forEach(function(a, i){
      expect(isPointInWater({ x:a.x, y:a.y }, 0)).toBe(false);
      solids.slice(i + 1).forEach(b => expect(Math.abs(a.x - b.x) < a.hw + b.hw && Math.abs(a.y - b.y) < a.hd + b.hd).toBe(false));
    });
  });

  it('keeps clear of whatever is already there', function () {
    const taken = [{ x:solids[0].x, y:solids[0].y, hw:10, hd:10 }];
    expect(generateLots(taken).some(l => Math.abs(l.x - solids[0].x) < 1 && Math.abs(l.y - solids[0].y) < 1)).toBe(false);
  });

  it('turns every building to face a street, and leaves a few plots as building sites', function () {
    for(const lot of lots) expect(Math.abs(Math.sin(lot.rot)) < 0.01 || Math.abs(Math.cos(lot.rot)) < 0.01).toBe(true);
    const sites = lots.filter(l => l.site);
    expect(sites.length).toBeGreaterThan(0);
    expect(sites.length).toBeLessThanOrEqual(6);
  });
});

describe('frontage clearance', function () {
  it('keeps the ground between a place and its street open', function () {
    const place = { x: 700, y: 820, hw: 30, hd: 20 };
    const clear = frontageClearance(place);
    expect(clear.hw).toBe(30);
    expect(clear.y - clear.hd).toBeLessThanOrEqual(place.y);
    expect(generateLots([place, clear]).some(l => Math.abs(l.x - clear.x) < clear.hw && Math.abs(l.y - clear.y) < clear.hd)).toBe(false);
  });
});
