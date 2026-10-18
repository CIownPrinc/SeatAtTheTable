import { test, expect } from '@playwright/test';

interface SeatHook {
  state: {
    cash: number;
    nextEventAt: number;
    prestigeCount: number;
    bankAccounts: Record<string, number>;
    portfolio: Record<string, { shares: number; avgCost: number }>;
  };
}

test('bringing family over takes banked money and stocks too, not just cash on hand', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.locator('.tab-btn[data-tab="map"]').click();
  await page.waitForFunction(function(){ return !!(window as unknown as { __seat?: unknown }).__seat; });
  await page.evaluate(function(){
    const state = (window as unknown as { __seat: SeatHook }).__seat.state;
    state.nextEventAt = Number.MAX_SAFE_INTEGER;
    state.cash = 50_000;
    state.bankAccounts = { 'first-windhaven': 400_000 };
    const symbol = Object.keys(state.portfolio)[0];
    state.portfolio[symbol] = { shares: 500, avgCost: 10 };
  });
  await page.waitForTimeout(600);
  while(await page.locator('#modal-overlay').evaluate(function(element){ return !element.classList.contains('hidden'); })){
    await page.locator('#modal-footer button').first().click();
    await page.waitForTimeout(200);
  }

  await page.locator('#prestige-btn').click();
  await page.getByRole('button', { name: 'Make the transfer' }).click();

  const after = await page.evaluate(function(){
    const state = (window as unknown as { __seat: SeatHook }).__seat.state;
    return {
      prestigeCount: state.prestigeCount,
      banked: Object.values(state.bankAccounts).reduce(function(sum, balance){ return sum + balance; }, 0),
      shares: Object.values(state.portfolio).reduce(function(sum, position){ return sum + position.shares; }, 0),
    };
  });
  expect(after).toEqual({ prestigeCount: 1, banked: 0, shares: 0 });
});
