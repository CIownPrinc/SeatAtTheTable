import type { BlockOwner, Brand, Car, Property } from '../config/types';

// LEGAL: In-person shop rules. Phase 4 moves buying off the phone and into branded shops,
// LEGAL: so this module owns what a brand stocks, what it charges on whose turf, and how
// LEGAL: haggling resolves. Pure and unit-tested — header.ts only renders the results.

export type StockItem =
  | { kind: 'car'; car: Car }
  | { kind: 'property'; property: Property };

export function stockItemId(item: StockItem): string {
  return item.kind === 'car' ? item.car.id : item.property.id;
}

export function stockItemName(item: StockItem): string {
  return item.kind === 'car' ? item.car.name : item.property.name;
}

export function stockItemCost(item: StockItem): number {
  return item.kind === 'car' ? item.car.cost : item.property.cost;
}

// LEGAL: Everything a brand sells, in price order so the cheap lots read cheap.
export function stockForBrand(brand: Brand, cars: Car[], properties: Property[]): StockItem[] {
  const items: StockItem[] = brand.sells === 'vehicle'
    ? cars.filter(c => c.brand === brand.id).map(car => ({ kind: 'car' as const, car }))
    : properties.filter(p => p.brand === brand.id).map(property => ({ kind: 'property' as const, property }));
  return items.sort((a, b) => stockItemCost(a) - stockItemCost(b));
}

// LEGAL: The phone apps (AutoMart / Realty) keep only the online-orderable subset. Anything
// LEGAL: without online:true is now dealer-only and must be bought by going there, which is
// LEGAL: the whole point of the initiative.
export function onlineCars(cars: Car[]): Car[] {
  return cars.filter(c => c.online);
}

export function onlineProperties(properties: Property[]): Property[] {
  return properties.filter(p => p.online);
}

export function isDealerOnly(item: StockItem): boolean {
  return item.kind === 'car' ? !item.car.online : !item.property.online;
}

// LEGAL: Turf effect on price. Standing on your own blocks earns a small local discount;
// LEGAL: rival blocks charge a premium because nobody wants your business there. Haggling
// LEGAL: is refused outright on rival turf — you have no leverage on someone else's street.
export const RIVAL_MARKUP = 1.25;
export const YOURS_DISCOUNT = 0.95;

export interface TurfPricing {
  multiplier: number;
  canHaggle: boolean;
  note: string;
}

export function turfPricing(brand: Brand, owner: BlockOwner): TurfPricing {
  if(owner === 'rival'){
    return { multiplier: RIVAL_MARKUP, canHaggle: false, note: brand.rivalLine };
  }
  if(owner === 'yours'){
    return { multiplier: YOURS_DISCOUNT, canHaggle: !!brand.haggle, note: 'Your blocks. They know who you are, and the number comes down a little.' };
  }
  return { multiplier: 1, canHaggle: !!brand.haggle, note: 'Contested street. Standard price, no favors either way.' };
}

// LEGAL: Final asking price. Haggle discount applies on top of the turf multiplier and is
// LEGAL: expressed as a fraction off (0.12 = 12% off).
export function askingPrice(baseCost: number, turfMultiplier: number, haggleDiscount: number): number {
  return Math.max(1, Math.round(baseCost * turfMultiplier * (1 - haggleDiscount)));
}

// LEGAL: ---- Haggling ----
// LEGAL: Only cash-only lots bargain (brand.haggle). You pick how hard to push; pushing
// LEGAL: harder pays more but can make the seller walk, which locks the discount at zero
// LEGAL: for this visit. Respect tilts the odds — a name on the street is leverage.

export type HagglePush = 'polite' | 'firm' | 'hard';

export interface HaggleOffer {
  push: HagglePush;
  label: string;
  discount: number;
  baseSuccess: number;
}

export const haggleOffers: HaggleOffer[] = [
  { push:'polite', label:'Ask politely',       discount:0.05, baseSuccess:0.92 },
  { push:'firm',   label:'Push for a real cut', discount:0.12, baseSuccess:0.68 },
  { push:'hard',   label:'Lowball him',         discount:0.22, baseSuccess:0.40 },
];

export function haggleOfferFor(push: HagglePush): HaggleOffer {
  return haggleOffers.find(o => o.push === push) ?? haggleOffers[0];
}

// LEGAL: Respect adds up to +18 percentage points of success at 900+ respect. Capped so a
// LEGAL: late-game player still cannot lowball with impunity.
export function haggleSuccessChance(offer: HaggleOffer, respect: number): number {
  const bonus = Math.min(0.18, Math.max(0, respect) / 5000);
  return Math.min(0.97, offer.baseSuccess + bonus);
}

export interface HaggleResult {
  won: boolean;
  discount: number;
  message: string;
}

// LEGAL: `roll` is injected (0..1) so tests are deterministic; header.ts passes Math.random().
export function resolveHaggle(offer: HaggleOffer, respect: number, roll: number): HaggleResult {
  const chance = haggleSuccessChance(offer, respect);
  if(roll < chance){
    return {
      won: true,
      discount: offer.discount,
      message: `He chews on it, then waves you off with a number ${Math.round(offer.discount * 100)}% under the sticker.`,
    };
  }
  return {
    won: false,
    discount: 0,
    message: 'He laughs, folds his arms, and goes back to the sticker price. That number is dead for today.',
  };
}
