import { describe, expect, it } from 'vitest';
import { spawnPoints } from './world';
import { carSpawnPositionForDistrict, defaultParkedCarPositions, parkedCarPositionForDistrict } from './parking';

describe('map parking positions', function () {
  it('spawns cars beside each district spawn instead of on top of the player', function () {
    const defaults = defaultParkedCarPositions();

    expect(defaults.devlin).toEqual({ x:spawnPoints.devlin.x + 70, y:spawnPoints.devlin.y });
    expect(defaults.westside).toEqual({ x:spawnPoints.westside.x + 70, y:spawnPoints.westside.y });
    expect(defaults.hub).toEqual({ x:spawnPoints.hub.x + 70, y:spawnPoints.hub.y });
  });

  it('uses a saved parked point when one exists and a spawn fallback otherwise', function () {
    expect(parkedCarPositionForDistrict({ devlin:{ x:712, y:612 } }, 'devlin')).toEqual({ x:712, y:612 });
    expect(parkedCarPositionForDistrict({}, 'hub')).toEqual(carSpawnPositionForDistrict('hub'));
    expect(parkedCarPositionForDistrict({}, 'unknown')).toEqual(carSpawnPositionForDistrict('devlin'));
  });
});
