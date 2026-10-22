import { describe, expect, it } from 'vitest';
import { BRIBE_SHARE, incomeBreakdown, LAYING_LOW_SHARE, REINVEST_SHARE, type IncomeInputs } from './income';

const base: IncomeInputs = {
  ventures:[{ id:'cart', perSec:10, street:false, reinvests:false }, { id:'dice', perSec:20, street:true, reinvests:false }],
  properties:[{ id:'twoflat', perSec:4 }],
  extortion:[{ id:'patel', perSec:3 }],
  corners:5, blackMarket:6, office:0,
  layingLow:false, homeTurfMult:1, globalMult:1, bribeOn:false,
};

// LEGAL: The sum of every line a card shows must be exactly what the header shows and what is paid.
function linesAddUp(b: ReturnType<typeof incomeBreakdown>): number {
  const sum = (r: Record<string, number>) => Object.values(r).reduce((s, n) => s + n, 0);
  return sum(b.ventures) + sum(b.properties) + sum(b.extortion) + b.corners + b.blackMarket + b.office;
}

describe('income', () => {
  it('adds every source with no bonuses', () => {
    const b = incomeBreakdown(base);
    expect(b.gross).toBe(48);
    expect(b.net).toBe(48);
    expect(b.illegal).toBe(20 + 3 + 5 + 6);
  });

  it('shows each card the bonuses it is actually paid with', () => {
    const b = incomeBreakdown({ ...base, homeTurfMult:1.15, globalMult:1.06 });
    expect(b.ventures.cart).toBeCloseTo(10 * 1.15 * 1.06);
    expect(b.properties.twoflat).toBeCloseTo(4 * 1.06);
    expect(linesAddUp(b)).toBeCloseTo(b.gross);
  });

  it('slows only the illegal side while laying low', () => {
    const b = incomeBreakdown({ ...base, layingLow:true });
    expect(b.ventures.cart).toBe(10);
    expect(b.ventures.dice).toBeCloseTo(20 * LAYING_LOW_SHARE);
    expect(b.properties.twoflat).toBe(4);
    expect(b.corners).toBeCloseTo(5 * LAYING_LOW_SHARE);
    expect(linesAddUp(b)).toBeCloseTo(b.gross);
  });

  it('takes the bribe and the reinvestment out of what you are paid', () => {
    const b = incomeBreakdown({ ...base, bribeOn:true, ventures:base.ventures.map(v => ({ ...v, reinvests:v.id === 'cart' })) });
    expect(b.bribe).toBeCloseTo(48 * BRIBE_SHARE);
    expect(b.reinvested.cart).toBeCloseTo(10 * REINVEST_SHARE);
    expect(b.net).toBeCloseTo(48 - 48 * BRIBE_SHARE - 10 * REINVEST_SHARE);
  });
});
