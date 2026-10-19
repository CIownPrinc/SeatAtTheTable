import { describe, expect, it } from 'vitest';
import { auditBeachCoverage, auditFootprintsOnRoads, auditRoadsOverWater, auditSceneryOnRoads, type AuditRoad } from './worldAudit';

const street: AuditRoad = { name: 'Test Street', width: 40, path: [{ x: 0, y: 0 }, { x: 400, y: 0 }] };

describe('auditFootprintsOnRoads', function () {
  it('flags a building that only partly overhangs the carriageway', function () {
    const issues = auditFootprintsOnRoads([{ name: 'shop', minX: 100, maxX: 160, minZ: 12, maxZ: 80 }], [street]);
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toContain('shop');
    expect(issues[0].message).toContain('Test Street');
  });

  it('passes a building that stands back on the pavement', function () {
    expect(auditFootprintsOnRoads([{ name: 'shop', minX: 100, maxX: 160, minZ: 24, maxZ: 80 }], [street])).toEqual([]);
  });

  it('catches a building on a diagonal or curved road, not just the grid', function () {
    const diagonal: AuditRoad = { name: 'Bend', width: 40, path: [{ x: 0, y: 0 }, { x: 200, y: 200 }, { x: 400, y: 200 }] };
    expect(auditFootprintsOnRoads([{ name: 'kiosk', minX: 95, maxX: 105, minZ: 95, maxZ: 105 }], [diagonal])).toHaveLength(1);
  });
});

describe('auditRoadsOverWater', function () {
  it('flags the stretch of a road that runs out over water', function () {
    const isWater = (p: { x: number; y: number }) => p.x > 300;
    const issues = auditRoadsOverWater([street], isWater);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].at.x).toBeGreaterThan(290);
  });

  it('passes a road on dry land', function () {
    expect(auditRoadsOverWater([street], () => false)).toEqual([]);
  });
});

describe('auditSceneryOnRoads', function () {
  it('flags a tree standing in a lane', function () {
    expect(auditSceneryOnRoads([{ name: 'tree', x: 200, y: 5, radius: 8 }], [street])).toHaveLength(1);
  });

  it('passes a tree on the verge', function () {
    expect(auditSceneryOnRoads([{ name: 'tree', x: 200, y: 40, radius: 8 }], [street])).toEqual([]);
  });
});

describe('auditBeachCoverage', function () {
  const beach = [{ x: 0, y: 0 }, { x: 200, y: 0 }, { x: 200, y: 30 }, { x: 0, y: 30 }];

  it('passes a shore the sand covers end to end', function () {
    expect(auditBeachCoverage(beach, [{ x: 10, y: 5 }, { x: 190, y: 5 }], 10, 190)).toEqual([]);
  });

  it('flags where the beach stops short of the shore it should cover', function () {
    const issues = auditBeachCoverage(beach, [{ x: 10, y: 5 }, { x: 400, y: 5 }], 10, 400);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].at.x).toBeGreaterThan(200);
  });
});
