import { describe, expect, it } from 'vitest';
import { auditBeachCoverage, auditRoadsOverWater, auditSceneryOnRoads } from './worldAudit';
import { auditRoads } from './sceneAudit';
import { windhavenMapModel } from './mapModel';
import { isPointInWater } from './geometry';
import { createOutskirtSceneryLayout, radiusForKind } from './outskirtScenery';
import { WORLD_W } from './world';

// LEGAL: The audit rules run against the real map data. These fail the build (the pre-push hook
// LEGAL: runs them) the moment a change puts a road in the sea or a tree in a lane. Buildings are
// LEGAL: audited against what the renderer drew, in e2e/scene-audit.e2e.ts.
function report(issues: { message: string }[]): string {
  return issues.slice(0, 30).map(i => i.message).join('\n');
}

describe('the real map passes the world audit', function () {
  it('has no road over water', function () {
    const issues = auditRoadsOverWater(auditRoads(), isPointInWater);
    expect(issues, report(issues)).toEqual([]);
  });

  it('has no countryside scenery standing in a road', function () {
    const items = createOutskirtSceneryLayout().map(item => ({ name:`${item.kind} (${item.regionId})`, x:item.x, y:item.y, radius:radiusForKind(item.kind) }));
    const issues = auditSceneryOnRoads(items, auditRoads());
    expect(issues, report(issues)).toEqual([]);
  });

  it('has a beach running the whole city shore of the lake', function () {
    // LEGAL: The lake polygon starts at its south-west corner and runs east along the city shore.
    const lake = windhavenMapModel.lake;
    const eastTip = lake.findIndex(p => p.x === Math.max(...lake.map(q => q.x)));
    const shore = lake.slice(0, eastTip + 1).map(p => ({ x:p.x, y:p.y + 12 }));
    const issues = auditBeachCoverage(windhavenMapModel.lakefrontBeach, shore, 0, WORLD_W);
    expect(issues, report(issues)).toEqual([]);
  });
});
