import { describe, expect, it } from 'vitest';
import { formatCount, formatMoney, formatMoneyRate } from './format';

describe('formatMoney', function () {
  it('shows whole dollars below a thousand', function () {
    expect(formatMoney(47)).toBe('$47');
    expect(formatMoney(999.9)).toBe('$999');
  });

  it('abbreviates thousands and up', function () {
    expect(formatMoney(12345)).toBe('$12.3K');
    expect(formatMoney(2_000_000)).toBe('$2.00M');
  });

  it('keeps the sign on losses', function () {
    expect(formatMoney(-250)).toBe('-$250');
  });
});

describe('formatMoneyRate', function () {
  it('shows cents-scale income instead of rounding it to nothing', function () {
    expect(formatMoneyRate(0.38)).toBe('$0.4');
    expect(formatMoneyRate(-0.5)).toBe('-$0.5');
  });

  it('matches formatMoney once the rate is large', function () {
    expect(formatMoneyRate(15)).toBe('$15');
    expect(formatMoneyRate(4200)).toBe('$4.20K');
  });
});

describe('formatCount', function () {
  it('floors and groups digits', function () {
    expect(formatCount(1234.9)).toBe((1234).toLocaleString());
  });
});
