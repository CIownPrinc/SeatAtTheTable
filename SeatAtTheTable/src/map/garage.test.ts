import { describe, expect, it } from 'vitest';
import { serviceBuildings } from '../config/serviceBuildings';
import { GARAGE_RETURN_SECONDS, secondsUntilGarageReturn, shouldReturnToGarage } from './parking';
import { serviceBuildingSilhouette } from './placeRendering';
import { minimapIconForService } from './places';

describe('player garage', function () {
  it('exists, on home turf, and is not a dealership', function () {
    const garage = serviceBuildings.find(s => s.id === 'playerGarage');

    expect(garage, 'the player has nowhere to keep cars').toBeDefined();
    expect(garage!.district).toBe('devlin');
    // LEGAL: A distinct kind matters: nothing that SELLS cars may be mistaken for the
    // LEGAL: player's own garage, which is what the old 'Garage / dealer' label did.
    expect(garage!.kind).toBe('playerGarage');
    expect(garage!.brandId).toBeUndefined();
  });

  it('looks unlike the dealerships it sits among', function () {
    const garage = serviceBuildingSilhouette({ id:'playerGarage', kind:'playerGarage', name:'Your Garage', icon:'', district:'devlin', x:0, y:0 });
    const dealership = serviceBuildingSilhouette({ id:'d', kind:'dealership', name:'D', icon:'', district:'devlin', x:0, y:0 });

    expect(garage.color).not.toBe(dealership.color);
    expect(garage.w).not.toBe(dealership.w);
  });

  // LEGAL: It used to share the dealership glyph and was labelled "Car dealership" on the City Map.
  it('has its own home glyph on the minimap, not the dealership one', function () {
    expect(minimapIconForService({ id:'playerGarage', kind:'playerGarage', name:'Your Garage', icon:'', district:'devlin', x:0, y:0 })).toBe('home');
  });

  it('leaves a parked car where you left it until the timer runs out', function () {
    expect(shouldReturnToGarage(100, 100)).toBe(false);
    expect(shouldReturnToGarage(100, 100 + GARAGE_RETURN_SECONDS - 1)).toBe(false);
  });

  it('brings the car home once the timer elapses', function () {
    expect(shouldReturnToGarage(100, 100 + GARAGE_RETURN_SECONDS)).toBe(true);
    expect(shouldReturnToGarage(100, 100 + GARAGE_RETURN_SECONDS * 4)).toBe(true);
  });

  it('never returns a car that is not parked in the street', function () {
    // LEGAL: null means the car is being driven or already home.
    expect(shouldReturnToGarage(null, 999999)).toBe(false);
    expect(secondsUntilGarageReturn(null, 999999)).toBeNull();
  });

  it('counts down, and never below zero', function () {
    expect(secondsUntilGarageReturn(100, 100)).toBe(GARAGE_RETURN_SECONDS);
    expect(secondsUntilGarageReturn(100, 160)).toBe(GARAGE_RETURN_SECONDS - 60);
    expect(secondsUntilGarageReturn(100, 100 + GARAGE_RETURN_SECONDS * 3)).toBe(0);
  });

  it('waits a few minutes — long enough to be worth parking, short enough not to strand you', function () {
    expect(GARAGE_RETURN_SECONDS).toBeGreaterThanOrEqual(120);
    expect(GARAGE_RETURN_SECONDS).toBeLessThanOrEqual(600);
  });
});
