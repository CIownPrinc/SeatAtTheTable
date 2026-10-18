import { describe, expect, it } from 'vitest';
import type { LocalBusiness } from '../config/types';
import { localBusinessSilhouette, serviceBuildingSilhouette } from './placeRendering';

describe('map place rendering data', function () {
  it('uses distinct silhouettes for major service building types', function () {
    const bank = serviceBuildingSilhouette({ id:'bankHome', kind:'bankHome', name:'Bank', icon:'', district:'devlin', x:0, y:0 });
    const garage = serviceBuildingSilhouette({ id:'garage', kind:'garage', name:'Garage', icon:'', district:'westside', x:0, y:0 });
    const cityHall = serviceBuildingSilhouette({ id:'cityhall', kind:'cityhall', name:'City Hall', icon:'', district:'hub', x:0, y:0 });

    expect(bank.zoneType).toBe('service');
    expect(garage.zoneType).toBe('industrial');
    expect(cityHall.w).toBeGreaterThan(bank.w);
    expect(garage.h).toBeLessThan(bank.h);
  });

  it('uses recognizable silhouettes for local business types', function () {
    const base: LocalBusiness = { id:'bar', name:'Bar', icon:'', owner:'', robBase:0, extortIncome:0, extortHeat:0, district:'devlin', x:0, y:0, extorted:false, nextRobAt:0 };
    const bar = localBusinessSilhouette(base);
    const chopshop = localBusinessSilhouette({ ...base, id:'chopshop' });
    const shop = localBusinessSilhouette({ ...base, id:'patel' });

    // LEGAL: zoneType now comes from the place's ARCHETYPE rather than which config bucket it
    // LEGAL: sits in, so a bar and a grocer are both shopfronts and a chop shop is a works.
    expect(bar.zoneType).toBe('shop');
    expect(shop.zoneType).toBe('shop');
    expect(chopshop.zoneType).toBe('industrial');
    expect(chopshop.w).toBeGreaterThan(shop.w);
  });
});
