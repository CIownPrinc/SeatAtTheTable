import { test, expect } from '@playwright/test';

interface Spot { id: string; action(): void }
interface Seat { state: { cash: number; nextEventAt: number }; enterBuilding(kind: string, id: string, name: string): void; hotspots(): Spot[] }

// LEGAL: The casino's bugs: walking up to the slots took the stake and spun before you chose, and
// LEGAL: the draw-poker screen ran its Draw button off the bottom of the window.
test('the casino waits for you to pull, and draw poker fits on screen', async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.locator('.tab-btn[data-tab="map"]').click();
  await page.waitForFunction(() => !!(window as unknown as { __seat?: unknown }).__seat, undefined, { timeout: 45_000 });
  await page.evaluate(() => { const s = (window as unknown as { __seat: Seat }).__seat; s.state.nextEventAt = 1e12; s.state.cash = 5000; s.enterBuilding('casino', 'casinoLakeridge', 'The Gilded Kettle'); });
  await page.waitForTimeout(800);

  await page.evaluate(() => (window as unknown as { __seat: Seat }).__seat.hotspots().find(h => h.id === 'slots')!.action());
  await expect(page.locator('#modal-title')).toHaveText('The Kettle Seven');
  expect(await page.evaluate(() => (window as unknown as { __seat: Seat }).__seat.state.cash)).toBe(5000);
  await page.locator('#modal-footer button', { hasText: 'Walk away' }).click();

  await page.evaluate(() => (window as unknown as { __seat: Seat }).__seat.hotspots().find(h => h.id === 'tables')!.action());
  await page.locator('#modal-footer button', { hasText: 'Five-card draw' }).click();
  const cards = page.locator('#modal-body [data-hold]');
  await expect(cards).toHaveCount(5);
  await cards.nth(1).click();
  await expect(page.locator('#modal-body [data-hold]').nth(1)).toHaveAttribute('aria-pressed', 'true');
  const draw = page.locator('#modal-footer button', { hasText: 'Draw 4' });
  await expect(draw).toBeInViewport();
  await draw.click();
  await expect(page.locator('#modal-footer button', { hasText: 'Deal again' })).toBeVisible();
});
