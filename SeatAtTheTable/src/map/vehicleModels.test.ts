import { describe, expect, it } from 'vitest';
import { cars } from '../config/assets';
import { brandById } from '../config/brands';
import { trafficCarRoutes, outskirtVehicleRoutes } from './roaming';
import { VEHICLE_CLASSES, fitScale, vehicleClassForCar, vehicleClassForTraffic } from './vehicleModels';

describe('vehicle classes', function () {
  it('gives every car on sale a model, except the bikes', function () {
    cars.filter(car => brandById(car.brand)?.category !== 'bike').forEach(function(car){
      expect(VEHICLE_CLASSES, car.id).toContain(vehicleClassForCar(car.id));
    });
  });

  it('keeps cars from different classes looking different', function () {
    expect(vehicleClassForCar('sedan')).toBe('beater');
    expect(vehicleClassForCar('exotic')).toBe('supercar');
    expect(vehicleClassForCar('mudster_pickup')).toBe('pickup');
  });

  it('gives every traffic and countryside vehicle a model', function () {
    [...trafficCarRoutes, ...outskirtVehicleRoutes].forEach(function(route){
      expect(VEHICLE_CLASSES, route.id).toContain(vehicleClassForTraffic(route.id));
    });
    expect(vehicleClassForTraffic('hub-cab')).toBe('taxi');
    expect(vehicleClassForTraffic('kettle-tractor')).toBe('tractor');
  });
});

describe('fitScale', function () {
  it('stretches a model to the car\'s length and width from the catalog', function () {
    const scale = fitScale({ x: 34, y: 12, z: 15 }, 26, 14);
    expect(scale.x * 34).toBeCloseTo(26);
    expect(scale.z * 15).toBeCloseTo(14);
  });

  it('scales height with the footprint so a small car is not squashed flat', function () {
    const scale = fitScale({ x: 34, y: 12, z: 15 }, 17, 7.5);
    expect(scale.y).toBeCloseTo(0.5);
  });
});
