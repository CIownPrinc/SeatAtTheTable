import { test, type Page } from '@playwright/test';

// LEGAL: Not an assertion — a camera on the railyard and the freight train, to check by eye that the
// LEGAL: yard sits on the line and that wagons, people and buildings are in proportion.

interface SeatHook {
  player: { x: number; y: number; vx: number; vy: number };
  state: { inVehicle: boolean; playSeconds: number };
  mapObjects: { kind: string; id: string; x: number; y: number }[];
}

async function waitForScene(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.locator('.tab-btn[data-tab="map"]').click();
  await page.waitForFunction(() => !!(window as never as { __seat?: unknown }).__seat, undefined, { timeout: 45000 });
  await page.waitForTimeout(2500);
}

async function standAt(page: Page, x: number, y: number): Promise<void> {
  await page.evaluate(function([px, py]){
    const seat = (window as never as { __seat: SeatHook }).__seat;
    seat.state.inVehicle = false;
    seat.player.x = px; seat.player.y = py; seat.player.vx = 0; seat.player.vy = 0;
    seat.state.playSeconds = 20;
  }, [x, y]);
  await page.waitForTimeout(1500);
}

const canvas = (page: Page) => page.locator('#scene3d-container canvas.webgl-canvas');

test('photograph the railyard and the freight train', async function ({ page }) {
  test.setTimeout(240000);
  await waitForScene(page);
  const yard = await page.evaluate(() => (window as never as { __seat: SeatHook }).__seat.mapObjects.find(o => o.id === 'railyard')!);
  await standAt(page, yard.x, yard.y + 60);
  await canvas(page).screenshot({ path: 'test-results/railyard-gate.png' });
  await standAt(page, yard.x + 75, yard.y - 180);
  await canvas(page).screenshot({ path: 'test-results/railyard-sidings.png' });
  await standAt(page, yard.x + 100, yard.y - 420);
  await canvas(page).screenshot({ path: 'test-results/railyard-lead.png' });
  // LEGAL: The line's train, met at Roosevelt Road: wait for the moment it reaches the crossing.
  const cycle = 93000, start = 0.12, end = 0.92, from = -1150, to = 1800;
  const wait = await page.evaluate(function([c, s, e, f, t]){
    const want = s + (600 - f) / (t - f) * (e - s);
    return ((want * c - Date.now() % c) + c) % c;
  }, [cycle, start, end, from, to]);
  await standAt(page, 4600, 600);
  await page.waitForTimeout(wait);
  await canvas(page).screenshot({ path: 'test-results/railyard-train.png' });
});
