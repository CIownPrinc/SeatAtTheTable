import { describe, expect, it } from 'vitest';
import { cars, properties } from '../config/assets';
import { brandById, brands } from '../config/brands';
import {
  APPRECIATION_CAP, BIKE_HEAT_PER_SEC, LAUNDER_CUT_CAP,
  appreciationMult, breakdownChancePerSec, caveatEffectLabel, effectiveHeistBonus,
  launderingHeatMult, propertiesOfCategory, propertyRespectPerSec, repairCost,
  roughRaidChance, roughRaidLoss, vehicleHeatPerSec,
} from './brandEffects';

const waterfront = brandById('lakeshore')!;
const commercial = brandById('ironpoint')!;
const cheap = brandById('concrete-dreams')!;
const bikes = brandById('outlaw-riders')!;
const used = brandById('no-problem-auto')!;
const luxuryCars = brandById('diamond-exotics')!;

describe('brand caveat effects', function () {
  it('gives every brand with a caveat a mechanical effect, not just flavour text', function () {
    brands.filter(b => b.caveat).forEach(function (brand) {
      expect(caveatEffectLabel(brand), `${brand.id} effect label`).not.toBeNull();
    });
  });

  it('appreciates waterfront rent over time, up to a cap', function () {
    expect(appreciationMult(waterfront, 0)).toBe(1);
    expect(appreciationMult(waterfront, 3600)).toBeCloseTo(1.25, 5);
    expect(appreciationMult(waterfront, 3600 * 100)).toBe(1 + APPRECIATION_CAP);
  });

  it('appreciates nothing for other categories or negative time', function () {
    expect(appreciationMult(commercial, 3600 * 5)).toBe(1);
    expect(appreciationMult(undefined, 3600 * 5)).toBe(1);
    expect(appreciationMult(waterfront, -500)).toBe(1);
  });

  it('cuts heat for each commercial front but caps the discount', function () {
    expect(launderingHeatMult(0)).toBe(1);
    expect(launderingHeatMult(1)).toBeCloseTo(0.94, 5);
    expect(launderingHeatMult(50)).toBe(1 - LAUNDER_CUT_CAP);
    expect(launderingHeatMult(-3)).toBe(1);
  });

  it('pays no street respect for warehouses but does for homes', function () {
    expect(propertyRespectPerSec(commercial)).toBe(0);
    expect(propertyRespectPerSec(brandById('horizon'))).toBeGreaterThan(0);
    expect(propertyRespectPerSec(waterfront)).toBeGreaterThan(0);
  });

  it('raises rough-block raid risk with heat and lowers it on your own turf', function () {
    const base = roughRaidChance({ roughCount: 1, heat: 0, onYourTurf: false });
    expect(roughRaidChance({ roughCount: 0, heat: 90, onYourTurf: false })).toBe(0);
    expect(roughRaidChance({ roughCount: 1, heat: 100, onYourTurf: false })).toBeGreaterThan(base);
    expect(roughRaidChance({ roughCount: 1, heat: 0, onYourTurf: true })).toBeLessThan(base);
  });

  it('caps raid risk so owning many cheap flats is never a guaranteed loss', function () {
    expect(roughRaidChance({ roughCount: 999, heat: 100, onYourTurf: false })).toBeLessThanOrEqual(0.4);
  });

  it('takes a slice of the building value on a raid, with a floor', function () {
    expect(roughRaidLoss(10_000, 0)).toBe(800);
    expect(roughRaidLoss(10_000, 1)).toBe(2000);
    expect(roughRaidLoss(10, 0)).toBe(50);
  });

  it('adds heat only while actually riding a bike', function () {
    expect(vehicleHeatPerSec(bikes, true)).toBe(BIKE_HEAT_PER_SEC);
    expect(vehicleHeatPerSec(bikes, false)).toBe(0);
    expect(vehicleHeatPerSec(used, true)).toBe(0);
    expect(vehicleHeatPerSec(undefined, true)).toBe(0);
  });

  it('halves heist cover on a bike but leaves other cars alone', function () {
    const chopper = cars.find(c => c.id === 'chopper')!;
    const exotic = cars.find(c => c.id === 'exotic')!;
    expect(effectiveHeistBonus(chopper, bikes)).toBeCloseTo(chopper.heistBonus * 0.5, 6);
    expect(effectiveHeistBonus(exotic, luxuryCars)).toBe(exotic.heistBonus);
    expect(effectiveHeistBonus(null, bikes)).toBe(0);
  });

  it('only breaks down used cars that are actually being driven', function () {
    const beater = cars.find(c => c.id === 'sedan')!;
    const exotic = cars.find(c => c.id === 'exotic')!;
    expect(breakdownChancePerSec(beater, used, true)).toBeGreaterThan(0);
    expect(breakdownChancePerSec(beater, used, false)).toBe(0);
    expect(breakdownChancePerSec(exotic, luxuryCars, true)).toBe(0);
    expect(breakdownChancePerSec(null, used, true)).toBe(0);
  });

  it('breaks the cheaper beater more often than the pricier one on the same lot', function () {
    const karolla = cars.find(c => c.id === 'sedan')!;
    const chevalier = cars.find(c => c.id === 'impala')!;
    expect(breakdownChancePerSec(karolla, used, true)).toBeGreaterThan(breakdownChancePerSec(chevalier, used, true));
  });

  it('prices repairs off the car, never below a floor', function () {
    expect(repairCost(cars.find(c => c.id === 'impala')!)).toBe(600);
    expect(repairCost({ ...cars[0], cost: 10 })).toBe(150);
  });

  it('selects owned properties by brand category', function () {
    const owned = properties.map(p => p.id);
    const found = propertiesOfCategory(owned, properties, brandById, 'cheap');
    expect(found.length).toBeGreaterThan(0);
    expect(found.every(p => p.brand === cheap.id)).toBe(true);
  });
});
