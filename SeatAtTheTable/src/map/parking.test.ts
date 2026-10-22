import { describe, expect, it } from 'vitest';
import { spawnPoints } from './world';
import { carSpawnPositionForDistrict, parkedCarFromSave } from './parking';

describe('map parking positions', function () {
  it('spawns a car beside the spawn point instead of on top of the player', function () {
    expect(carSpawnPositionForDistrict('devlin')).toEqual({ x:spawnPoints.devlin.x + 70, y:spawnPoints.devlin.y });
  });

  it('keeps one parked point, and reads the real one out of an older per-district save', function () {
    expect(parkedCarFromSave({ parkedCar:{ x:712, y:612 } })).toEqual({ x:712, y:612 });
    expect(parkedCarFromSave({ parkedCarPos:{ devlin:{ x:1, y:1 }, westside:{ x:900, y:400 } }, currentDistrict:'westside' })).toEqual({ x:900, y:400 });
    expect(parkedCarFromSave({})).toEqual(carSpawnPositionForDistrict('devlin'));
  });
});
