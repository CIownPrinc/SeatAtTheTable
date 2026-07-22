import { describe, expect, it } from 'vitest';
import { cars, properties } from '../config/assets';
import { brands, brandById } from '../config/brands';
import { serviceBuildings } from '../config/serviceBuildings';
import {
  RIVAL_MARKUP, askingPrice, haggleOfferFor, haggleOffers, haggleSuccessChance,
  isDealerOnly, onlineCars, onlineProperties, resolveHaggle, stockForBrand,
  stockItemCost, stockItemName, turfPricing,
} from './storefront';

describe('branded storefronts', function () {
  it('gives every brand a walk-in building on the map', function () {
    brands.forEach(function (brand) {
      const building = serviceBuildings.find(s => s.brandId === brand.id);
      expect(building, `${brand.id} building`).toBeDefined();
      expect(building!.kind).toBe(brand.sells === 'vehicle' ? 'dealership' : 'brokerage');
      expect(building!.district).toBe(brand.district);
    });
  });

  it('gives every brand stock to sell, so no shop is a dead end', function () {
    brands.forEach(function (brand) {
      expect(stockForBrand(brand, cars, properties).length, `${brand.id} stock`).toBeGreaterThan(0);
    });
  });

  it('assigns every car and property to a real brand', function () {
    [...cars.map(c => c.brand), ...properties.map(p => p.brand)].forEach(function (id) {
      expect(brandById(id), `brand ${id}`).toBeDefined();
    });
  });

  it('sells only its own stock, cheapest first', function () {
    const brand = brandById('no-problem-auto')!;
    const stock = stockForBrand(brand, cars, properties);
    expect(stock.every(i => i.kind === 'car' && i.car.brand === 'no-problem-auto')).toBe(true);
    const costs = stock.map(stockItemCost);
    expect([...costs].sort((a, b) => a - b)).toEqual(costs);
  });

  it('gives EVERY brand something you can only buy in person', function () {
    // LEGAL: Four brands (No Problem Auto, Mudster, Ironpoint, Lakeshore) once sold nothing
    // LEGAL: but online stock, so their shops were pointless to visit. Both dealerships and
    // LEGAL: realty offices must always have exclusives.
    brands.forEach(function (brand) {
      const exclusives = stockForBrand(brand, cars, properties).filter(isDealerOnly);
      expect(exclusives.length, `${brand.id} needs in-person-only stock`).toBeGreaterThan(0);
    });
  });

  it('keeps the online catalog frozen to the original pre-phone Assets tab', function () {
    // LEGAL: The rule the user set: whatever the Assets tab sold before the phone existed
    // LEGAL: stays orderable online, and nothing else is ever added to it.
    expect(onlineCars(cars).map(c => c.id).sort()).toEqual(['bentley', 'escalade', 'impala', 'sedan']);
    expect(onlineProperties(properties).map(p => p.id).sort()).toEqual(['aptbuilding', 'loft', 'retailstrip', 'twoflat']);
  });

  it('keeps some stock dealer-only so visiting the shop is worth the drive', function () {
    const dealerOnly = brands.flatMap(b => stockForBrand(b, cars, properties)).filter(isDealerOnly);
    expect(dealerOnly.length).toBeGreaterThan(0);
    expect(dealerOnly.map(stockItemName)).toContain('Diamond Veyra');
  });

  it('hides dealer-only stock from the online catalogs', function () {
    expect(onlineCars(cars).every(c => c.online)).toBe(true);
    expect(onlineProperties(properties).every(p => p.online)).toBe(true);
    expect(onlineCars(cars).map(c => c.name)).not.toContain('Diamond Veyra');
  });

  it('charges a markup and refuses to haggle on rival turf', function () {
    const brand = brandById('no-problem-auto')!;
    const pricing = turfPricing(brand, 'rival');
    expect(pricing.multiplier).toBe(RIVAL_MARKUP);
    expect(pricing.canHaggle).toBe(false);
    expect(pricing.note).toBe(brand.rivalLine);
  });

  it('discounts on your own turf and holds standard price when contested', function () {
    const brand = brandById('no-problem-auto')!;
    expect(turfPricing(brand, 'yours').multiplier).toBeLessThan(1);
    expect(turfPricing(brand, 'contested').multiplier).toBe(1);
  });

  it('only lets the cash-only lots haggle', function () {
    expect(turfPricing(brandById('no-problem-auto')!, 'contested').canHaggle).toBe(true);
    expect(turfPricing(brandById('diamond-exotics')!, 'contested').canHaggle).toBe(false);
  });

  it('compounds turf multiplier and haggle discount into the asking price', function () {
    expect(askingPrice(1000, 1, 0)).toBe(1000);
    expect(askingPrice(1000, RIVAL_MARKUP, 0)).toBe(1250);
    expect(askingPrice(1000, 1, 0.2)).toBe(800);
    expect(askingPrice(1000, RIVAL_MARKUP, 0.2)).toBe(1000);
  });

  it('never lets a price fall to zero or below', function () {
    expect(askingPrice(1, 0.95, 0.99)).toBeGreaterThan(0);
  });

  it('pays more for a harder push but succeeds less often', function () {
    const sorted = [...haggleOffers].sort((a, b) => a.discount - b.discount);
    expect(sorted.map(o => o.push)).toEqual(['polite', 'firm', 'hard']);
    expect(sorted[0].baseSuccess).toBeGreaterThan(sorted[2].baseSuccess);
  });

  it('lets respect improve the odds but caps the bonus', function () {
    const offer = haggleOfferFor('hard');
    expect(haggleSuccessChance(offer, 0)).toBe(offer.baseSuccess);
    expect(haggleSuccessChance(offer, 500)).toBeGreaterThan(offer.baseSuccess);
    expect(haggleSuccessChance(offer, 5_000_000)).toBeLessThanOrEqual(0.97);
    expect(haggleSuccessChance(offer, 5_000_000)).toBeCloseTo(offer.baseSuccess + 0.18, 5);
  });

  it('resolves a haggle deterministically from the injected roll', function () {
    const offer = haggleOfferFor('firm');
    expect(resolveHaggle(offer, 0, 0).won).toBe(true);
    expect(resolveHaggle(offer, 0, 0).discount).toBe(offer.discount);
    expect(resolveHaggle(offer, 0, 0.99).won).toBe(false);
    expect(resolveHaggle(offer, 0, 0.99).discount).toBe(0);
  });
});
