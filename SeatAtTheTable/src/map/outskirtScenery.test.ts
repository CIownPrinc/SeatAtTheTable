import { describe, expect, it } from 'vitest';
import { circleInsidePolygon, isPointInWater } from './geometry';
import { createOutskirtSceneryLayout } from './outskirtScenery';
import { OUTSKIRT_REGIONS } from './world';

describe('outskirt scenery layout', function(){
  it('is deterministic and keeps every item inside its own irregular belt', function(){
    const first = createOutskirtSceneryLayout();
    expect(createOutskirtSceneryLayout()).toEqual(first);
    expect(first.length).toBeGreaterThan(100);
    first.forEach(function(item){
      const region = OUTSKIRT_REGIONS.find(function(candidate){ return candidate.id === item.regionId; });
      expect(region).toBeDefined();
      expect(circleInsidePolygon(item, item.kind === 'tree' ? 10 : 12, region!.area)).toBe(true);
      expect(isPointInWater(item, item.kind === 'tree' ? 10 : 22)).toBe(false);
    });
  });
});
