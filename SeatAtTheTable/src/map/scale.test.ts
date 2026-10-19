import { describe, expect, it } from 'vitest';
import { PERSON_HEIGHT, UNITS_PER_METRE, storeys } from './scale';
import { cars } from '../config/assets';
import { roadNetwork } from './world';

const metres = (units: number) => units / UNITS_PER_METRE;

describe('world scale', function () {
  it('is pinned to the roads: a two-lane street is about seven metres', function () {
    expect(metres(roadNetwork.horizontal[0].w)).toBeGreaterThan(6.5);
    expect(metres(roadNetwork.horizontal[0].w)).toBeLessThan(7.5);
  });

  it('makes a person a person-sized, a touch over life so faces read from above', function () {
    expect(metres(PERSON_HEIGHT)).toBeGreaterThan(1.7);
    expect(metres(PERSON_HEIGHT)).toBeLessThan(2.3);
  });

  it('makes a four-storey tenement about twelve metres tall', function () {
    // LEGAL: The tenement silhouette is authored at 62 units, from before there was a scale.
    expect(metres(storeys(62))).toBeGreaterThan(9.5);
    expect(metres(storeys(62))).toBeLessThan(14);
  });

  it('keeps cars car-sized: three to six metres long once drawn at city scale', function () {
    cars.filter(car => car.len > 22).forEach(function(car){
      expect(metres(car.len * 1.6), car.id).toBeGreaterThan(3.5);
      expect(metres(car.len * 1.6), car.id).toBeLessThan(6);
    });
  });
});
