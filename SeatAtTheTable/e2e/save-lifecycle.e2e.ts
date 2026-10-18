import { test, expect, type Page } from '@playwright/test';

interface SeatHook { state: { cash: number; playSeconds: number; nextEventAt: number } }

// LEGAL: Start a game, give it progress a fresh game cannot have, and reload so the
// LEGAL: game's own save-on-close stores it. Leaves the page on the start screen.
async function bootWithProgress(page: Page, cash: number): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.locator('.tab-btn[data-tab="map"]').click();
  await page.waitForFunction(function(){ return !!(window as unknown as { __seat?: unknown }).__seat; });
  await page.evaluate(function(amount){
    const seat = (window as unknown as { __seat: SeatHook }).__seat;
    seat.state.cash = amount;
    seat.state.nextEventAt = Number.MAX_SAFE_INTEGER;
  }, cash);
  await page.reload();
  await expect(page.locator('#continue-game-btn')).toBeEnabled();
}

async function dismissPopups(page: Page): Promise<void> {
  await page.waitForTimeout(400);
  while(await page.locator('#modal-overlay').evaluate(function(element){ return !element.classList.contains('hidden'); })){
    await page.locator('#modal-footer button').first().click();
    await page.waitForTimeout(200);
  }
}

test.describe('save lifecycle', () => {
  test.setTimeout(90_000);

  test('Start New Game throws away the old progress', async ({ page }) => {
    await bootWithProgress(page, 12345);
    await page.locator('#start-game-btn').click();
    await Promise.all([page.waitForEvent('load'), page.locator('#confirm-new-game-btn').click()]);
    await expect(page.locator('#hud-cash')).toHaveText('$47');
  });

  test('Reset Progress leaves no save behind', async ({ page }) => {
    await bootWithProgress(page, 12345);
    await page.locator('#continue-game-btn').click();
    await dismissPopups(page);
    await page.locator('.tab-btn[data-tab="settings"]').click();
    await page.locator('#reset-btn').click();
    await Promise.all([page.waitForEvent('load'), page.getByRole('button', { name: 'Reset Everything' }).click()]);
    await expect(page.locator('#continue-game-btn')).toBeDisabled();
    await expect(page.locator('#start-game-btn')).toHaveText('Start');
  });

  test('an imported save replaces the current game', async ({ page }) => {
    await bootWithProgress(page, 12345);
    const saved = await page.evaluate(function(){ return window.localStorage.getItem('seat-save-v1'); });
    const imported = { ...JSON.parse(saved ?? '{}'), cash: 777777 };
    await page.locator('#continue-game-btn').click();
    await dismissPopups(page);
    await page.locator('.tab-btn[data-tab="settings"]').click();
    await page.locator('#import-save-input').setInputFiles({
      name: 'imported.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(imported)),
    });
    await Promise.all([page.waitForEvent('load'), page.getByRole('button', { name: 'Enter Windhaven' }).click()]);
    await page.locator('#continue-game-btn').click();
    await expect(page.locator('#hud-cash')).toHaveText(/^\$7\d\d\.\dK$/);
  });

  test('the next random event keeps its schedule across a reload', async ({ page }) => {
    await bootWithProgress(page, 100);
    await page.locator('#continue-game-btn').click();
    await page.locator('.tab-btn[data-tab="map"]').click();
    await page.waitForFunction(function(){ return !!(window as unknown as { __seat?: unknown }).__seat; });
    await page.evaluate(function(){
      const seat = (window as unknown as { __seat: SeatHook }).__seat;
      seat.state.playSeconds = 1000;
      seat.state.nextEventAt = 5000;
    });
    await page.reload();
    await page.locator('#continue-game-btn').click();
    await page.locator('.tab-btn[data-tab="map"]').click();
    await page.waitForFunction(function(){ return !!(window as unknown as { __seat?: unknown }).__seat; });
    const nextEventAt = await page.evaluate(function(){
      return (window as unknown as { __seat: SeatHook }).__seat.state.nextEventAt;
    });
    expect(nextEventAt).toBe(5000);
  });
});
