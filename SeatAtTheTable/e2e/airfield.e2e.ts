import { test, expect, type Page } from '@playwright/test';

// LEGAL: Kettle Flats Airfield (map/airfield): take the flying lesson, take off down the runway, fly
// LEGAL: the rings, land and get your licence; then fly one of Deke's cargo runs and get paid.

interface FlightView { mode: string; airborne: boolean; ring: number; zone: { x: number; y: number } | null; drop: string | null }
type Seat = {
  player: { x: number; y: number; vx: number; vy: number; facing: number };
  state: { cash: number; heat: number; nextEventAt: number; inVehicle: boolean; equippedCar: string | null; worldMemory: Record<string, unknown>; playSeconds: number };
  enterBuilding(kind: string, refId: string, name: string): void;
  hotspots(): { id: string; action(): void }[];
  flight(): FlightView | null;
};
const seat = (page: Page) => page.evaluate(() => (window as unknown as { __seat: Seat }).__seat.flight());

const RUNWAY_Y = 1245;
const RINGS = [{ x:300, y:1480 }, { x:-500, y:1700 }, { x:-1500, y:1150 }, { x:-1450, y:350 }, { x:-900, y:-350 }, { x:-250, y:250 }];

async function boot(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.locator('.tab-btn[data-tab="map"]').click();
  await page.waitForFunction(() => !!(window as unknown as { __seat?: unknown }).__seat, undefined, { timeout: 45_000 });
  await page.waitForTimeout(2500);
  await page.evaluate(() => {
    const s = (window as unknown as { __seat: Seat }).__seat;
    s.state.nextEventAt = 1e12; s.state.cash = 5000; s.state.playSeconds = 20;
  });
}

async function openDesk(page: Page, desk: string, button: string): Promise<void> {
  await page.evaluate(function(id){
    const s = (window as unknown as { __seat: Seat }).__seat;
    s.enterBuilding('missionOffice', 'airfieldKettle', 'Kettle Flats Airfield');
    s.hotspots().find(h => h.id === id)!.action();
  }, desk);
  await page.locator('#modal-footer button', { hasText: button }).click();
}

// LEGAL: A newspaper story or milestone can pop up at any moment and holds the keys while it's open.
async function dismissPopups(page: Page): Promise<void> {
  const popup = page.locator('#modal-overlay:not(.hidden) #modal-footer button').first();
  if(await popup.isVisible()) await popup.click();
}

async function takeOff(page: Page): Promise<void> {
  await dismissPopups(page);
  await page.keyboard.down('ArrowRight');
  await expect.poll(async () => (await seat(page))?.airborne, { timeout:15_000 }).toBe(true);
  await page.keyboard.up('ArrowRight');
}

async function flyTo(page: Page, x: number, y: number): Promise<void> {
  await page.evaluate(function([px, py]){
    const s = (window as unknown as { __seat: Seat }).__seat;
    s.player.x = px; s.player.y = py; s.player.vx = 0; s.player.vy = 0; s.player.facing = 0;
  }, [x, y]);
  await page.waitForTimeout(250);
}

async function landOnRunway(page: Page): Promise<void> {
  await dismissPopups(page);
  await flyTo(page, -600, RUNWAY_Y);
  await page.keyboard.press('e');
}

test('the lesson: take off, fly the rings, land, and get a pilot\'s licence', async ({ page }) => {
  test.setTimeout(120_000);
  await boot(page);
  await openDesk(page, 'flightschool', 'Take the lesson');
  expect((await seat(page))?.mode).toBe('lesson');
  await takeOff(page);
  await page.waitForTimeout(1500);
  await page.locator('#scene3d-container canvas.webgl-canvas').screenshot({ path:'test-results/airfield-takeoff.png' });
  // LEGAL: Landing off the runway is refused, and you stay in the air.
  await flyTo(page, 300, 1000);
  await page.keyboard.press('e');
  expect((await seat(page))?.airborne).toBe(true);
  for(const ring of RINGS) await flyTo(page, ring.x, ring.y);
  expect((await seat(page))?.ring).toBe(RINGS.length);
  await landOnRunway(page);
  await expect(page.locator('#modal-title')).toContainText("pilot's licence");
  const after = await page.evaluate(() => { const s = (window as unknown as { __seat: Seat }).__seat; return { licence:s.state.worldMemory.pilotLicence, car:s.state.equippedCar, inVehicle:s.state.inVehicle }; });
  expect(after.licence).toBe(true);
  expect(after.car).not.toBe('airfield-plane');
  expect(after.inVehicle).toBe(false);
});

test("Deke's cargo run: drop the crate on the mark, land, get paid", async ({ page }) => {
  test.setTimeout(120_000);
  await boot(page);
  await page.evaluate(() => { (window as unknown as { __seat: Seat }).__seat.state.worldMemory.pilotLicence = true; });
  await openDesk(page, 'cargo', 'Take the run');
  await takeOff(page);
  const zone = (await seat(page))!.zone!;
  await flyTo(page, zone.x, zone.y);
  await page.keyboard.press('e');
  expect((await seat(page))?.drop).toBe('bullseye');
  const before = await page.evaluate(() => (window as unknown as { __seat: Seat }).__seat.state.cash);
  await landOnRunway(page);
  await expect(page.locator('#modal-title')).toContainText('Bullseye delivery');
  const cash = await page.evaluate(() => (window as unknown as { __seat: Seat }).__seat.state.cash);
  expect(cash).toBeGreaterThan(before + 900);
});

test('photograph the airfield', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => {
    const s = (window as unknown as { __seat: Seat }).__seat;
    s.player.x = -760; s.player.y = 1140; s.player.vx = 0; s.player.vy = 0;
  });
  await page.waitForTimeout(1500);
  const popup = page.locator('#modal-footer button').first();
  if(await popup.isVisible()) await popup.click();
  await page.waitForTimeout(500);
  await page.locator('#scene3d-container canvas.webgl-canvas').screenshot({ path:'test-results/airfield-ground.png' });
});
