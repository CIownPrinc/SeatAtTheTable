import { test, expect, type Page } from '@playwright/test';

// LEGAL: Grunt Park (map/centralPark): run the loop round the paths against the clock, put on a free
// LEGAL: concert at the bandstand, and a camera on the park to check it by eye.

interface Seat {
  player: { x: number; y: number; vx: number; vy: number };
  state: { cash: number; respect: number; heat: number; nextEventAt: number; playSeconds: number; inVehicle: boolean; worldMemory: Record<string, unknown> };
  mapObjects: Array<{ id: string; x: number; y: number }>;
  parkRun: () => { next: number } | null;
}
const seat = (page: Page) => page.evaluate(() => (window as unknown as { __seat: Seat }).__seat.parkRun());

async function boot(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.locator('.tab-btn[data-tab="map"]').click();
  await page.waitForFunction(() => !!(window as unknown as { __seat?: unknown }).__seat, undefined, { timeout: 45_000 });
  await page.waitForTimeout(2500);
  await page.evaluate(() => { const s = (window as unknown as { __seat: Seat }).__seat; s.state.nextEventAt = 1e12; s.state.cash = 5000; s.state.playSeconds = 20; s.state.inVehicle = false; });
}

async function dismissPopups(page: Page): Promise<void> {
  const popup = page.locator('#modal-overlay:not(.hidden) #modal-footer button').first();
  if(await popup.isVisible()) await popup.click();
}

async function useAmenity(page: Page, id: string, button: string): Promise<void> {
  await dismissPopups(page);
  await page.evaluate(placeId => {
    const s = (window as unknown as { __seat: Seat }).__seat;
    const place = s.mapObjects.find(o => o.id === placeId)!;
    s.player.x = place.x; s.player.y = place.y + 4; s.player.vx = 0; s.player.vy = 0;
  }, id);
  await page.waitForTimeout(400);
  await page.keyboard.press('e');
  await page.locator('#modal-footer button', { hasText: button }).click();
}

const CORNERS = [{ x:3524, y:1297 }, { x:3524, y:1508 }, { x:2922, y:1508 }, { x:2922, y:1297 }];

test('run the Grunt Park loop and get on the board', async ({ page }) => {
  test.setTimeout(90_000);
  await boot(page);
  const respect = await page.evaluate(() => (window as unknown as { __seat: Seat }).__seat.state.respect);
  await useAmenity(page, 'grunt-loop', 'Run the loop');
  expect((await seat(page))?.next).toBe(0);
  for(const corner of [...CORNERS, ...CORNERS, CORNERS[0]]){
    await page.evaluate(p => { const s = (window as unknown as { __seat: Seat }).__seat; s.player.x = p.x; s.player.y = p.y; }, corner);
    await page.waitForTimeout(250);
  }
  await expect(page.locator('#modal-title')).toContainText('Round the loop in');
  expect(await seat(page)).toBeNull();
  const after = await page.evaluate(() => { const s = (window as unknown as { __seat: Seat }).__seat; return { best:s.state.worldMemory.parkRunBest, respect:s.state.respect }; });
  expect(typeof after.best).toBe('number');
  expect(after.respect).toBe(respect + 4);
});

test('put on a concert at the bandstand, and photograph the park', async ({ page }) => {
  test.setTimeout(90_000);
  await boot(page);
  const before = await page.evaluate(() => (window as unknown as { __seat: Seat }).__seat.state.cash);
  await useAmenity(page, 'grunt-bandstand', 'Put on a free concert');
  const after = await page.evaluate(() => (window as unknown as { __seat: Seat }).__seat.state.cash);
  expect(after).toBe(before - 400);
  await page.evaluate(() => { const s = (window as unknown as { __seat: Seat }).__seat; s.player.x = 3230; s.player.y = 1400; });
  await page.waitForTimeout(1500);
  await dismissPopups(page);
  await page.locator('#scene3d-container canvas.webgl-canvas').screenshot({ path:'test-results/park-pond.png' });
  await page.evaluate(() => { const s = (window as unknown as { __seat: Seat }).__seat; s.player.x = 3400; s.player.y = 1410; });
  await page.waitForTimeout(1200);
  await page.locator('#scene3d-container canvas.webgl-canvas').screenshot({ path:'test-results/park-bandstand.png' });
});
