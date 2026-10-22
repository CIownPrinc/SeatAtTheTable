import { test, expect } from '@playwright/test';

interface Seat {
  state: { cash: number; playSeconds: number; nextEventAt: number; ownedProperties: string[]; propertyOwnedAt: Record<string, number>; bribeOn: boolean };
  businesses: Array<{ id: string; level: number; researched: boolean; category: string }>;
  income: () => { net: number; ventures: Record<string, number>; properties: Record<string, number> };
}

// LEGAL: Written after the player said the tycoon maths looked off: the cards showed base rates while
// LEGAL: the payout multiplied in bonuses they never showed. What the cards add up to, what the header
// LEGAL: says, and what actually lands in your cash each second must all be the same number.
test('the venture cards, the header and the cash that arrives agree', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.waitForFunction(() => !!(window as unknown as { __seat?: unknown }).__seat, undefined, { timeout: 45_000 });
  await page.evaluate(() => {
    const seat = (window as unknown as { __seat: Seat }).__seat;
    seat.state.nextEventAt = 1e12;
    seat.businesses.filter(b => b.category === 'legit').slice(0, 3).forEach((b, i) => { b.level = 3 + i; b.researched = true; });
    seat.state.ownedProperties = ['twoflat'];
    seat.state.propertyOwnedAt = { twoflat: seat.state.playSeconds };
    seat.state.bribeOn = true;
  });
  await page.locator('.tab-btn[data-tab="empire"]').click();
  await page.waitForTimeout(600);
  const shown = await page.evaluate(() => {
    const seat = (window as unknown as { __seat: Seat }).__seat;
    const income = seat.income();
    return { header: document.getElementById('hud-income')!.textContent!, net: income.net };
  });
  // LEGAL: The header shows the net to one decimal place.
  expect(Number(shown.header.replace(/[^0-9.-]/g, ''))).toBeCloseTo(shown.net, 0);
  const paid = await page.evaluate(async () => {
    const seat = (window as unknown as { __seat: Seat }).__seat;
    const cash0 = seat.state.cash, t0 = seat.state.playSeconds;
    await new Promise(resolve => setTimeout(resolve, 3000));
    return { perSecond: (seat.state.cash - cash0) / (seat.state.playSeconds - t0), net: seat.income().net };
  });
  expect(paid.perSecond).toBeCloseTo(paid.net, 1);
});
