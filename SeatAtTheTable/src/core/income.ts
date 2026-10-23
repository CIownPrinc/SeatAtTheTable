// LEGAL: Every dollar a second the empire makes, worked out in one place. The game loop pays exactly
// LEGAL: `net` each second, and every card that shows an income reads its own line from here, so a
// LEGAL: venture's card, the header and the cash that actually arrives always agree. Before this the
// LEGAL: cards showed base rates while the payout multiplied them by bonuses the cards never showed.

// LEGAL: Laying low runs the illegal side at this share of normal.
export const LAYING_LOW_SHARE = 0.4;
// LEGAL: Keeping the police paid costs this share of everything coming in.
export const BRIBE_SHARE = 0.12;
// LEGAL: With Deepak in, each managed venture puts this share of its takings back into itself.
export const REINVEST_SHARE = 0.1;
// LEGAL: A property under the agent's management pays its rent straight in, less the agent's cut.
// LEGAL: One you collect yourself fills its rent book instead, which you empty in person.
export const MANAGEMENT_SHARE = 0.15;

export interface IncomeInputs {
  // LEGAL: `perSec` is the venture's own rate (level, efficiency, any boost), before the bonuses below.
  ventures: Array<{ id: string; perSec: number; street: boolean; reinvests: boolean }>;
  properties: Array<{ id: string; perSec: number; managed: boolean }>;
  extortion: Array<{ id: string; perSec: number }>;
  corners: number;
  blackMarket: number;
  office: number;
  layingLow: boolean;
  // LEGAL: Holding (or losing) home turf scales every venture.
  homeTurfMult: number;
  // LEGAL: Family and investor effects that scale the whole empire.
  globalMult: number;
  bribeOn: boolean;
}

export interface IncomeBreakdown {
  ventures: Record<string, number>;
  properties: Record<string, number>;
  // LEGAL: Rent going into each self-collected property's rent book, not into your cash.
  rentAccruing: Record<string, number>;
  extortion: Record<string, number>;
  corners: number;
  blackMarket: number;
  office: number;
  // LEGAL: Everything coming in, before the bribe and reinvestment.
  gross: number;
  bribe: number;
  reinvested: Record<string, number>;
  reinvestedTotal: number;
  // LEGAL: What lands in your cash each second.
  net: number;
  // LEGAL: The illegal side alone: street ventures, corners, extortion and the black market.
  illegal: number;
}

export function incomeBreakdown(input: IncomeInputs): IncomeBreakdown {
  const low = input.layingLow ? LAYING_LOW_SHARE : 1;
  const g = input.globalMult;
  const ventures: Record<string, number> = {};
  const reinvested: Record<string, number> = {};
  let illegal = 0;
  input.ventures.forEach(v => {
    const amount = v.perSec * (v.street ? low : 1) * input.homeTurfMult * g;
    ventures[v.id] = amount;
    if(v.street) illegal += amount;
    if(v.reinvests) reinvested[v.id] = amount * REINVEST_SHARE;
  });
  const properties: Record<string, number> = {};
  const rentAccruing: Record<string, number> = {};
  input.properties.forEach(p => {
    if(p.managed) properties[p.id] = p.perSec * g * (1 - MANAGEMENT_SHARE);
    else { properties[p.id] = 0; rentAccruing[p.id] = p.perSec * g; }
  });
  const extortion: Record<string, number> = {};
  input.extortion.forEach(e => { extortion[e.id] = e.perSec * low * g; });
  const corners = input.corners * low * g;
  const blackMarket = input.blackMarket * low * g;
  const office = input.office * g;
  const sum = (values: Record<string, number>) => Object.values(values).reduce((s, n) => s + n, 0);
  illegal += sum(extortion) + corners + blackMarket;
  const gross = sum(ventures) + sum(properties) + sum(extortion) + corners + blackMarket + office;
  const bribe = input.bribeOn ? gross * BRIBE_SHARE : 0;
  const reinvestedTotal = sum(reinvested);
  return { ventures, properties, rentAccruing, extortion, corners, blackMarket, office, gross, bribe, reinvested, reinvestedTotal, net:gross - bribe - reinvestedTotal, illegal };
}
