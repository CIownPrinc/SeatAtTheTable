import { test, expect } from '@playwright/test';

interface Seat {
  player: { x: number; y: number };
  state: { ownedCars: string[]; equippedCar: string | null; inVehicle: boolean; cash: number; nextEventAt: number; currentDistrict: string; parkedCar: { x: number; y: number }; carParkedAt: number | null };
  refreshParkedCar: () => void;
  worldGroup: { getObjectByName: (name: string) => { position: { x: number; z: number } } | undefined };
}

// LEGAL: Written after "I can't find my car on the map". The parked car was kept per district, so
// LEGAL: walking from Devlin into West Side made it vanish and another appear at West Side's spawn.
// LEGAL: It must stay where you left it wherever you go, and the tow truck must bring it home.
test('your parked car stays put across districts, and the tow truck brings it home', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.locator('.tab-btn[data-tab="map"]').click();
  await page.waitForFunction(() => !!(window as unknown as { __seat?: unknown }).__seat, undefined, { timeout: 45_000 });
  await page.waitForTimeout(2000);
  const parked = { x: 1500, y: 600 };
  await page.evaluate(spot => {
    const s = (window as unknown as { __seat: Seat }).__seat;
    s.state.nextEventAt = 1e12;
    s.state.ownedCars = ['sedan']; s.state.equippedCar = 'sedan'; s.state.cash = 5000;
    s.state.parkedCar = spot; s.state.carParkedAt = null;
    s.player.x = spot.x + 2600; s.player.y = spot.y;
    s.state.currentDistrict = 'westside';
    s.refreshParkedCar();
  }, parked);
  // LEGAL: Walking on rebuilds the parked car; it must still be where it was parked.
  await page.keyboard.down('d'); await page.waitForTimeout(800); await page.keyboard.up('d');
  await expect.poll(() => page.evaluate(() => { const car = (window as unknown as { __seat: Seat }).__seat.worldGroup.getObjectByName('vehicle:parked'); return car ? [Math.round(car.position.x), Math.round(car.position.z)] : null; })).toEqual([parked.x, parked.y]);

  // LEGAL: The cash given above sets off the first-profit milestone; close it.
  const milestone = page.locator('#modal-footer button').first();
  if(await milestone.isVisible()) await milestone.click();
  await page.locator('#phone-btn').click();
  await page.locator('.device-app[data-app="contacts"]').click();
  await page.locator('[data-tow]').click();
  const after = await page.evaluate(() => ({ car: (window as unknown as { __seat: Seat }).__seat.state.parkedCar, cash: (window as unknown as { __seat: Seat }).__seat.state.cash }));
  expect(Math.hypot(after.car.x - parked.x, after.car.y - parked.y)).toBeGreaterThan(200);
  expect(after.cash).toBeLessThan(5000);
});
