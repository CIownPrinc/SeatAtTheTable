import { test, expect } from '@playwright/test';

test('standing in front of traffic gets you splatted, then you get back up', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.locator('.tab-btn[data-tab="map"]').click();
  await page.waitForFunction(() => !!(window as unknown as { __seat?: unknown }).__seat, undefined, { timeout: 45_000 });
  await page.waitForTimeout(1000);
  // LEGAL: Stand in the road just ahead of a moving traffic car, facing the way it drives.
  const toast = page.locator('#scene3d-container .map-toast');
  await expect.poll(async () => {
    await page.evaluate(() => {
      const seat = (window as unknown as { __seat: { player: { x: number; y: number }; roamingActors: { kind: string; x: number; y: number; facing: number }[] } }).__seat;
      const car = seat.roamingActors.find(actor => actor.kind === 'car')!;
      seat.player.x = car.x + Math.cos(car.facing) * 70;
      seat.player.y = car.y + Math.sin(car.facing) * 70;
    });
    await page.waitForTimeout(400);
    return (await toast.textContent()) ?? '';
  }, { timeout: 30_000 }).toContain('Splat');
});

// LEGAL: The traffic cars weren't solid to the player's car: they drove into it and through it. Parked
// LEGAL: across a moving car's lane, your car must stop it short.
test('traffic stops for your car instead of driving through it', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.locator('.tab-btn[data-tab="map"]').click();
  await page.waitForFunction(() => !!(window as unknown as { __seat?: unknown }).__seat, undefined, { timeout: 45_000 });
  await page.waitForTimeout(1000);
  type Seat = { player: { x: number; y: number }; state: { ownedCars: string[]; equippedCar: string | null; inVehicle: boolean; nextEventAt: number }; roamingActors: { id: string; kind: string; dormant?: boolean; x: number; y: number; facing: number }[] };
  const id = await page.evaluate(() => {
    const seat = (window as unknown as { __seat: Seat }).__seat;
    seat.state.nextEventAt = 1e12;
    seat.state.ownedCars = ['sedan']; seat.state.equippedCar = 'sedan'; seat.state.inVehicle = true;
    const car = seat.roamingActors.find(actor => actor.kind === 'car' && !actor.dormant)!;
    seat.player.x = car.x + Math.cos(car.facing) * 160;
    seat.player.y = car.y + Math.sin(car.facing) * 160;
    return car.id;
  });
  await page.waitForTimeout(4000);
  const gap = await page.evaluate(carId => {
    const seat = (window as unknown as { __seat: Seat }).__seat;
    const car = seat.roamingActors.find(actor => actor.id === carId)!;
    return Math.hypot(car.x - seat.player.x, car.y - seat.player.y);
  }, id);
  expect(gap).toBeGreaterThan(40);
});
