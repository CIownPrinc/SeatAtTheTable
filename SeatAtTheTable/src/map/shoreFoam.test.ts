import { describe, expect, it } from 'vitest';
import { isPointInWater } from './geometry';
import { windhavenMapModel } from './mapModel';
import { shoreFoamPath } from './sceneBuilding';

describe('shore foam', function () {
  it('breaks on the water side of the coast and the lake shore, never on the land', function () {
    for(const shore of [windhavenMapModel.landmass, windhavenMapModel.lake]){
      const foam = shoreFoamPath(shore);
      const wet = foam.filter(point => isPointInWater(point, 0)).length;
      expect(wet / foam.length).toBeGreaterThan(0.97);
    }
  });
});
