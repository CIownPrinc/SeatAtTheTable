import type { Brand, Car } from '../config/types';

// LEGAL: Phase 4's last piece — the `caveat` line on each brand in config/brands stops
// LEGAL: being flavour text and starts costing you something. Every rule here is pure and
// LEGAL: unit-tested; header.ts only calls these and applies the result. Rolls are
// LEGAL: injected so the tests are deterministic.

// LEGAL: ---- Lakeshore: waterfront appreciates ----
// LEGAL: Rent climbs the longer you hold the building, capped so it cannot run away.
export const APPRECIATION_PER_HOUR = 0.25;
export const APPRECIATION_CAP = 0.5;

export function appreciationMult(brand: Brand | undefined, heldSeconds: number): number {
  if(brand?.category !== 'waterfront') return 1;
  const hours = Math.max(0, heldSeconds) / 3600;
  return 1 + Math.min(APPRECIATION_CAP, hours * APPRECIATION_PER_HOUR);
}

// LEGAL: ---- Ironpoint: commercial fronts wash money ----
// LEGAL: Each warehouse cuts heat generation, because more of the take has somewhere
// LEGAL: legitimate to land. Capped so fronts alone can never make you invisible.
export const LAUNDER_CUT_EACH = 0.06;
export const LAUNDER_CUT_CAP = 0.24;

export function launderingHeatMult(commercialCount: number): number {
  return 1 - Math.min(LAUNDER_CUT_CAP, Math.max(0, commercialCount) * LAUNDER_CUT_EACH);
}

// LEGAL: The flip side of the same caveat: warehouses are invisible on the street, so
// LEGAL: they pay no respect where a penthouse would.
export function propertyRespectPerSec(brand: Brand | undefined): number {
  if(brand?.category === 'commercial') return 0;
  if(brand?.category === 'luxury') return 0.25;
  if(brand?.category === 'waterfront') return 0.15;
  return 0.05;
}

// LEGAL: ---- Concrete Dreams: rough blocks get hit ----
// LEGAL: A crew turns over one of your cheap walk-ups now and then. Risk rises with heat
// LEGAL: (you are a known name) and falls on turf you control.
export const ROUGH_RAID_BASE_CHANCE = 0.05;

export interface RoughRaidInput {
  roughCount: number;
  heat: number;
  onYourTurf: boolean;
}

export function roughRaidChance(input: RoughRaidInput): number {
  if(input.roughCount <= 0) return 0;
  const heatFactor = 1 + Math.max(0, Math.min(100, input.heat)) / 100;
  const turfFactor = input.onYourTurf ? 0.5 : 1;
  return Math.min(0.4, ROUGH_RAID_BASE_CHANCE * input.roughCount * heatFactor * turfFactor);
}

// LEGAL: What a raid takes: a slice of the building's value, floored so it always stings.
export function roughRaidLoss(propertyCost: number, roll: number): number {
  const pct = 0.08 + roll * 0.12;
  return Math.max(50, Math.round(propertyCost * pct));
}

// LEGAL: ---- Outlaw Riders: bikes are loud and expose you ----
// LEGAL: Riding one adds heat outright and blunts the cover a car would give you.
export const BIKE_HEAT_PER_SEC = 0.55;

export function vehicleHeatPerSec(brand: Brand | undefined, inVehicle: boolean): number {
  if(!inVehicle || brand?.category !== 'bike') return 0;
  return BIKE_HEAT_PER_SEC;
}

// LEGAL: Bikes give half the heist cover of an equivalent car — nowhere to hide a crew.
export function effectiveHeistBonus(car: Car | null, brand: Brand | undefined): number {
  if(!car) return 0;
  return brand?.category === 'bike' ? car.heistBonus * 0.5 : car.heistBonus;
}

// LEGAL: ---- No Problem Auto: used cars break down ----
// LEGAL: Only while you are actually driving it, and only for the used lot's stock.
// LEGAL: Cheap cars fail more often than the pricier ones on the same lot.
export const BREAKDOWN_CHANCE_PER_SEC = 0.004;

export function breakdownChancePerSec(car: Car | null, brand: Brand | undefined, inVehicle: boolean): number {
  if(!car || !inVehicle || brand?.category !== 'used') return 0;
  // LEGAL: A $800 beater is roughly twice as fragile as a $5000 one.
  const wear = Math.max(0.5, Math.min(2, 2500 / Math.max(500, car.cost)));
  return BREAKDOWN_CHANCE_PER_SEC * wear;
}

export function repairCost(car: Car): number {
  return Math.max(150, Math.round(car.cost * 0.12));
}

// LEGAL: A short, readable summary of what a brand's caveat actually does mechanically,
// LEGAL: shown on the shop card so the downside is never a hidden surprise.
export function caveatEffectLabel(brand: Brand): string | null {
  switch(brand.category){
    case 'used': return 'Can break down while you drive it; repairs cost about 12% of the price.';
    case 'bike': return `Adds ${BIKE_HEAT_PER_SEC.toFixed(2)} heat/sec while ridden and gives half the heist cover.`;
    case 'cheap': return 'Rough blocks: crews can turn these over for a slice of their value.';
    case 'commercial': return `Washes money — up to ${Math.round(LAUNDER_CUT_CAP * 100)}% less heat — but earns no street respect.`;
    case 'waterfront': return `Appreciates: rent climbs ${Math.round(APPRECIATION_PER_HOUR * 100)}% an hour held, up to +${Math.round(APPRECIATION_CAP * 100)}%.`;
    default: return null;
  }
}
