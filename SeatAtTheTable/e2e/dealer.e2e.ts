import { test, expect } from '@playwright/test';

interface Corner { id: string; dealer: boolean; busted: boolean; dealerCost: number }
interface Seat { state: { cash: number }; corners: Corner[]; assignDealer(c: Corner): void; fireDealer(c: Corner): void; scene: import('three').Scene }

// LEGAL: Pulling a dealer used to make them blink out of existence on the next rebuild.
test('a pulled dealer walks off the corner instead of vanishing', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.locator('.tab-btn[data-tab="map"]').click();
  await page.waitForFunction(() => !!(window as unknown as { __seat?: unknown }).__seat, undefined, { timeout: 45_000 });
  await page.evaluate(() => {
    const seat = (window as unknown as { __seat: Seat }).__seat;
    seat.state.cash = 100000;
    const corner = seat.corners.find(c => !c.dealer && !c.busted)!;
    seat.assignDealer(corner);
    (window as unknown as { __corner: Corner }).__corner = corner;
  });
  await page.waitForTimeout(1800);
  await page.evaluate(() => { const seat = (window as unknown as { __seat: Seat }).__seat; seat.fireDealer((window as unknown as { __corner: Corner }).__corner); });
  const count = () => page.evaluate(() => { let n = 0; (window as unknown as { __seat: Seat }).__seat.scene.traverse(o => { if(o.name === 'dealer:leaving') n++; }); return n; });
  await page.waitForTimeout(800);
  expect(await count()).toBe(1);
  await expect.poll(count, { timeout: 8000 }).toBe(0);
});
