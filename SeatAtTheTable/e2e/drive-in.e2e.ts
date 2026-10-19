import { test, expect, type Page } from '@playwright/test';
import { serviceBuildings } from '../src/config/serviceBuildings';
import { bayParkSpot, garageBay } from '../src/map/driveIn';
import { serviceBuildingSilhouette } from '../src/map/placeRendering';

// LEGAL: The garage's SHAPE is authored; only its position is chosen at boot. Taking the
// LEGAL: shape from the same function the renderer uses means this test cannot drift out of
// LEGAL: agreement with the building it is driving into.
const GARAGE_SHAPE = serviceBuildingSilhouette(serviceBuildings.find(s => s.id === 'playerGarage')!);

// LEGAL: ---- The drive-in garage ----
// LEGAL: driveIn.test.ts checks the geometry against the garage's AUTHORED position. The game
// LEGAL: does not use that position: the lot allocator picks a real lot at boot. So the unit
// LEGAL: test can pass while the actual garage in the actual city is walled in by a
// LEGAL: neighbour, sited half in a road, or facing a building. This drives a car at the real
// LEGAL: garage, in the real world, and checks it gets in.

async function waitForScene(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.locator('.tab-btn[data-tab="map"]').click();
  await expect(page.locator('#scene3d-container canvas.webgl-canvas')).toBeVisible({ timeout: 45000 });
  await page.waitForFunction(() => !!(window as never as { __seat?: unknown }).__seat, undefined, { timeout: 45000 });
  await page.waitForTimeout(2500);
}

interface SeatHook {
  player: { x: number; y: number; vx: number; vy: number };
  state: { inVehicle: boolean; carParkedAt: number | null; parkedCarPos: Record<string, { x: number; y: number }> };
  mapObjects: { kind: string; id: string; x: number; y: number }[];
  canWalk: (x: number, y: number) => boolean;
}

function hook(): SeatHook {
  return (window as never as { __seat: SeatHook }).__seat;
}

// LEGAL: The garage as the game actually placed it, not as it was authored.
async function garagePosition(page: Page): Promise<{ x: number; y: number }> {
  return page.evaluate(() => {
    const seat = (window as never as { __seat: SeatHook }).__seat;
    const garage = seat.mapObjects.find(o => o.kind === 'service' && o.id === 'playerGarage');
    if(!garage) throw new Error('no playerGarage in the world');
    return { x: garage.x, y: garage.y };
  });
}

test.describe('the drive-in garage', function () {
  // LEGAL: The approach matters as much as the bay. A garage whose mouth opens onto the side
  // LEGAL: of the building next door is a garage you cannot use.
  test('a car can reach the mouth and drive all the way in', async function ({ page }) {
    await waitForScene(page);
    const garage = await garagePosition(page);

    // LEGAL: The run ends at the parking position, not at the back wall — the back wall is
    // LEGAL: SUPPOSED to stop the car. What must be clear is every point between the street
    // LEGAL: and where the car comes to rest.
    const parkSpot = bayParkSpot(garageBay(garage, GARAGE_SHAPE.w, GARAGE_SHAPE.d));
    const start = garage.y + GARAGE_SHAPE.d/2 + 40;

    const result = await page.evaluate(function(run: { x: number; from: number; to: number }){
      const seat = (window as never as { __seat: SeatHook }).__seat;
      // LEGAL: canWalk uses the CAR radius while inVehicle, which is the whole question here.
      seat.state.inVehicle = true;
      const line: { y: number; clear: boolean }[] = [];
      for(let y = run.from; y >= run.to; y -= 4){
        line.push({ y, clear: seat.canWalk(run.x, y) });
      }
      line.push({ y: run.to, clear: seat.canWalk(run.x, run.to) });
      seat.state.inVehicle = false;
      return line;
    }, { x: parkSpot.x, from: start, to: parkSpot.y });

    const blocked = result.filter(step => !step.clear).map(step => step.y);
    expect(blocked, `blocked driving in at offsets ${blocked.join(', ')}`).toEqual([]);
  });

  test('driving into the bay parks the car and puts you out beside it', async function ({ page }) {
    await waitForScene(page);
    const garage = await garagePosition(page);

    const after = await page.evaluate(function(spot: { x: number; y: number }){
      const seat = (window as never as { __seat: SeatHook }).__seat;
      seat.state.inVehicle = true;
      seat.player.x = spot.x; seat.player.y = spot.y;
      seat.player.vx = 0; seat.player.vy = 0;
      return new Promise<{ inVehicle: boolean; parked: { x: number; y: number }; player: { x: number; y: number }; carParkedAt: number | null }>(function(resolve){
        // LEGAL: Two frames: one for the tick to see the car in the bay, one to settle.
        requestAnimationFrame(function(){
          requestAnimationFrame(function(){
            resolve({
              inVehicle: seat.state.inVehicle,
              parked: seat.state.parkedCarPos.devlin,
              player: { x: seat.player.x, y: seat.player.y },
              carParkedAt: seat.state.carParkedAt,
            });
          });
        });
      });
    }, garage);

    expect(after.inVehicle).toBe(false);
    // LEGAL: Car left in the bay...
    expect(Math.hypot(after.parked.x - garage.x, after.parked.y - garage.y)).toBeLessThan(40);
    // LEGAL: ...Arjun standing beside it, not on it...
    expect(Math.hypot(after.player.x - after.parked.x, after.player.y - after.parked.y)).toBeGreaterThan(8);
    // LEGAL: ...and no return-to-garage clock running, because it is already home.
    expect(after.carParkedAt).toBeNull();
  });

  // LEGAL: The bug: getting into a car parked in the bay started inside the bay, which counted as
  // LEGAL: "just drove in" and parked you again at once, and E near the car opened the garage.
  test('you can get back into the parked car and drive it out', async function ({ page }) {
    await waitForScene(page);
    const garage = await garagePosition(page);
    await page.evaluate(function(spot: { x: number; y: number }){
      const seat = (window as never as { __seat: SeatHook & { state: { ownedCars: string[]; equippedCar: string | null } } }).__seat;
      seat.state.ownedCars = ['sedan']; seat.state.equippedCar = 'sedan';
      seat.state.inVehicle = true;
      seat.player.x = spot.x; seat.player.y = spot.y; seat.player.vx = 0; seat.player.vy = 0;
    }, garage);
    await expect.poll(() => page.evaluate(() => (window as never as { __seat: SeatHook }).__seat.state.inVehicle)).toBe(false);
    await page.keyboard.press('e');
    await page.waitForTimeout(600);
    const after = await page.evaluate(() => {
      const seat = (window as never as { __seat: SeatHook & { state: { currentInterior: unknown } } }).__seat;
      return { inVehicle: seat.state.inVehicle, interior: seat.state.currentInterior };
    });
    expect(after.interior).toBeNull();
    expect(after.inVehicle).toBe(true);
  });
});
