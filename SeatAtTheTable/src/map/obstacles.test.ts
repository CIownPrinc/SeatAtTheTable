import { describe, expect, it } from 'vitest';
import { circleHitsObstacle, isRunOverBy, vehicleObstacle } from './obstacles';

describe('circleHitsObstacle', function () {
  // LEGAL: A car 50 long and 24 wide, centred on the origin, driving along +x.
  const car = vehicleObstacle(0, 0, 0, 50, 24);

  it('blocks a person standing beside the car body', function () {
    expect(circleHitsObstacle(0, 14, 8, car)).toBe(true);
  });

  it('lets a person pass just clear of its side', function () {
    expect(circleHitsObstacle(0, 22, 8, car)).toBe(false);
  });

  it('turns with the car: a car facing +y is long in y', function () {
    const turned = vehicleObstacle(0, 0, Math.PI / 2, 50, 24);
    expect(circleHitsObstacle(0, 30, 8, turned)).toBe(true);
    expect(circleHitsObstacle(30, 0, 8, turned)).toBe(false);
  });
});

describe('isRunOverBy', function () {
  const car = vehicleObstacle(0, 0, 0, 50, 24);

  it('splats a person the moving car drives into', function () {
    expect(isRunOverBy(28, 0, 8, car, { x: 80, y: 0 })).toBe(true);
  });

  it('does not splat someone behind the car', function () {
    expect(isRunOverBy(-28, 0, 8, car, { x: 80, y: 0 })).toBe(false);
  });

  it('does not splat anyone when the car is barely moving', function () {
    expect(isRunOverBy(28, 0, 8, car, { x: 5, y: 0 })).toBe(false);
  });
});
