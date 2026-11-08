import { test, expect, type Page } from '@playwright/test';

// LEGAL: The car parks (world/data/parkingLots): drive in, get out, and the car goes into a free bay
// LEGAL: and stays there; nobody tows it home. Also a camera on one, to check it by eye.

interface Bay { x: number; y: number; facing: number; car: unknown; reserved: boolean }
interface Lot { id: string; name: string; x: number; y: number; aisle: { x: number; y: number }; street: { x: number; y: number }; bays: Bay[] }
interface Seat {
  player: { x: number; y: number; vx: number; vy: number; facing: number };
  state: { ownedCars: string[]; equippedCar: string | null; inVehicle: boolean; nextEventAt: number; playSeconds: number; parkedCar: { x: number; y: number }; carParkedAt: number | null };
  refreshParkedCar: () => void;
  parking: () => Lot[];
}

async function boot(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.locator('.tab-btn[data-tab="map"]').click();
  await page.waitForFunction(() => !!(window as unknown as { __seat?: unknown }).__seat, undefined, { timeout: 45_000 });
  await page.waitForTimeout(2500);
}

async function dismissPopups(page: Page): Promise<void> {
  const popup = page.locator('#modal-overlay:not(.hidden) #modal-footer button').first();
  if(await popup.isVisible()) await popup.click();
}

test('leave your car in a car park: it goes in a bay and stays', async ({ page }) => {
  test.setTimeout(90_000);
  await boot(page);
  const lot = await page.evaluate(() => {
    const s = (window as unknown as { __seat: Seat }).__seat;
    s.state.nextEventAt = 1e12; s.state.playSeconds = 20;
    s.state.ownedCars = ['sedan']; s.state.equippedCar = 'sedan'; s.state.inVehicle = true;
    const lot = s.parking()[0];
    s.player.x = lot.aisle.x; s.player.y = lot.aisle.y; s.player.vx = 0; s.player.vy = 0;
    s.refreshParkedCar();
    return lot;
  });
  expect(lot.bays.length).toBeGreaterThan(4);
  await page.waitForTimeout(800);
  await dismissPopups(page);
  await page.keyboard.press('e');
  const after = await page.evaluate(() => { const s = (window as unknown as { __seat: Seat }).__seat; return { inVehicle:s.state.inVehicle, car:s.state.parkedCar, at:s.state.carParkedAt }; });
  expect(after.inVehicle).toBe(false);
  expect(after.at).toBeNull();
  const bay = lot.bays.find(b => Math.hypot(b.x - after.car.x, b.y - after.car.y) < 1);
  expect(bay).toBeTruthy();
  expect(bay!.car).toBeNull();
  expect(bay!.reserved).toBe(false);
  // LEGAL: Stand back in the street to photograph it.
  await page.evaluate(spot => { const s = (window as unknown as { __seat: Seat }).__seat; s.player.x = spot.x; s.player.y = spot.y; }, lot.street);
  await page.waitForTimeout(1500);
  await dismissPopups(page);
  await page.locator('#scene3d-container canvas.webgl-canvas').screenshot({ path:'test-results/parking-lot.png' });
});

interface Actor { id: string; x: number; y: number; route?: { x: number; y: number }[]; routeIndex: number; marks?: Array<{ dwell?: number } | undefined>; waitUntil?: number; crossing?: boolean; pavement?: unknown; targetX: number; targetY: number }

test('a car pulls into a car park, parks in its bay, and walkers cross at the lights', async ({ page }) => {
  test.setTimeout(120_000);
  await boot(page);
  const errand = await page.evaluate(() => {
    const s = (window as unknown as { __seat: Seat & { roamingActors: Actor[] } }).__seat;
    s.state.nextEventAt = 1e12; s.state.playSeconds = 20;
    const car = s.roamingActors.find(a => a.id.startsWith('errand-'))!;
    const stop = car.marks!.findIndex(m => m?.dwell);
    const start = car.route![stop - 2];
    car.x = start.x; car.y = start.y; car.routeIndex = stop - 1;
    car.targetX = car.route![stop - 1].x; car.targetY = car.route![stop - 1].y;
    s.player.x = car.route![stop].x; s.player.y = car.route![stop].y - 120;
    return { id:car.id, bay:car.route![stop] };
  });
  await dismissPopups(page);
  await expect.poll(() => page.evaluate(({ id, bay }) => {
    const car = (window as unknown as { __seat: { roamingActors: Actor[] } }).__seat.roamingActors.find(a => a.id === id)!;
    return car.waitUntil !== undefined && Math.hypot(car.x - bay.x, car.y - bay.y) < 6;
  }, errand), { timeout:30_000 }).toBe(true);
  await page.locator('#scene3d-container canvas.webgl-canvas').screenshot({ path:'test-results/parking-errand.png' });

  // LEGAL: The walkers go somewhere, and some of them cross a street on the way.
  const before = await page.evaluate(() => (window as unknown as { __seat: { roamingActors: Actor[] } }).__seat.roamingActors.filter(a => a.pavement).map(a => ({ x:a.x, y:a.y })));
  expect(before.length).toBeGreaterThan(20);
  await expect.poll(() => page.evaluate(() => (window as unknown as { __seat: { roamingActors: Actor[] } }).__seat.roamingActors.some(a => a.crossing)), { timeout:30_000 }).toBe(true);
  await page.waitForTimeout(4000);
  const moved = await page.evaluate(start => (window as unknown as { __seat: { roamingActors: Actor[] } }).__seat.roamingActors.filter(a => a.pavement).filter((a, i) => Math.hypot(a.x - start[i].x, a.y - start[i].y) > 60).length, before);
  expect(moved).toBeGreaterThan(before.length / 2);
});
