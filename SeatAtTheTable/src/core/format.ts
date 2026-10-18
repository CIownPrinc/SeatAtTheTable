const MONEY_UNITS = ['', 'K', 'M', 'B', 'T'];

export function formatMoney(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  let value = Math.abs(amount);
  if(value < 1000) return sign + '$' + Math.floor(value);
  let unit = 0;
  while(value >= 1000 && unit < MONEY_UNITS.length - 1){ value /= 1000; unit++; }
  return sign + '$' + value.toFixed(value < 10 ? 2 : 1) + MONEY_UNITS[unit];
}

// LEGAL: Early income is cents per second; whole dollars would read as $0 and look broken.
export function formatMoneyRate(perSecond: number): string {
  if(Math.abs(perSecond) >= 10) return formatMoney(perSecond);
  return (perSecond < 0 ? '-' : '') + '$' + Math.abs(perSecond).toFixed(1);
}

export function formatCount(count: number): string {
  return Math.floor(count).toLocaleString();
}
