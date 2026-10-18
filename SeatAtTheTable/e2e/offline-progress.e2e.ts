import { test, expect, type Page } from '@playwright/test';

interface SeatHook { state: { playSeconds: number; nextEventAt: number } }

// LEGAL: Playwright cannot background a tab, so fake what the browser reports and announce it.
async function setVisibility(page: Page, visibility: 'hidden' | 'visible'): Promise<void> {
  await page.evaluate(function(value){
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: function(){ return value; } });
    document.dispatchEvent(new Event('visibilitychange'));
  }, visibility);
}

function playSeconds(page: Page): Promise<number> {
  return page.evaluate(function(){ return (window as unknown as { __seat: SeatHook }).__seat.state.playSeconds; });
}

test('a hidden tab pauses the game, so time away is paid once, by the business report', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.locator('.tab-btn[data-tab="map"]').click();
  await page.waitForFunction(function(){ return !!(window as unknown as { __seat?: unknown }).__seat; });
  await page.evaluate(function(){
    (window as unknown as { __seat: SeatHook }).__seat.state.nextEventAt = Number.MAX_SAFE_INTEGER;
  });

  await setVisibility(page, 'hidden');
  const before = await playSeconds(page);
  await page.waitForTimeout(3000);
  expect(await playSeconds(page)).toBe(before);

  await setVisibility(page, 'visible');
  await expect.poll(function(){ return playSeconds(page); }).toBeGreaterThan(before);
});
