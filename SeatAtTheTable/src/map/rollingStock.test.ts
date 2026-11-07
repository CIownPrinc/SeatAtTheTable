import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { FREIGHT_WAGON, LINE_TRAIN, LOCOMOTIVE, TRAIN_HALF_LENGTH, buildCar, carOffsets, carSize, trainLength } from './rollingStock';
import { PERSON_HEIGHT, UNITS_PER_METRE } from './scale';

const metres = (units: number) => units / UNITS_PER_METRE;

// LEGAL: The line's train was 1.7 m tall, shorter than a person, and the yard's wagons under 2 m long.
describe('rolling stock', () => {
  it('is real size: a wagon about 14.5 m long and 4 m tall, a locomotive longer and taller', () => {
    expect(metres(FREIGHT_WAGON.length)).toBeGreaterThan(13);
    expect(metres(FREIGHT_WAGON.length)).toBeLessThan(17);
    expect(metres(FREIGHT_WAGON.height)).toBeGreaterThan(3.8);
    expect(metres(FREIGHT_WAGON.width)).toBeGreaterThan(2.8);
    expect(LOCOMOTIVE.length).toBeGreaterThan(FREIGHT_WAGON.length);
    expect(FREIGHT_WAGON.height).toBeGreaterThan(PERSON_HEIGHT * 2);
  });

  it('is drawn at that size before the Blender models load', () => {
    (['wagon', 'locomotive'] as const).forEach(function(kind){
      const size = new THREE.Box3().setFromObject(buildCar(THREE, kind, '#7a3b2a')).getSize(new THREE.Vector3());
      expect(size.z, kind).toBeCloseTo(carSize(kind).length, -1);
      expect(size.y, kind).toBeCloseTo(carSize(kind).height, -1);
      expect(size.x, kind).toBeLessThanOrEqual(carSize(kind).width + 0.01);
    });
  });

  it('couples the line train end to end round its centre, locomotive in front', () => {
    const offsets = carOffsets(LINE_TRAIN);
    expect(LINE_TRAIN[0]).toBe('locomotive');
    expect(offsets[0] + carSize('locomotive').length / 2).toBeCloseTo(trainLength(LINE_TRAIN) / 2, 6);
    expect(offsets[offsets.length - 1] - carSize('wagon').length / 2).toBeCloseTo(-trainLength(LINE_TRAIN) / 2, 6);
    expect(TRAIN_HALF_LENGTH).toBeCloseTo(trainLength(LINE_TRAIN) / 2, 6);
  });
});
