import { test, expect } from '@playwright/test';

interface Seat {
  enterBuilding(kind: string, refId: string, name: string): void;
  interiorRoom(): import('three').Object3D | null;
}

// LEGAL: Rooms used to be a flat 2D sketch with an emoji per hotspot. Now they're 3D: a counter
// LEGAL: with a clerk behind it, a regular you can talk to, the stairs up to the council chamber, and
// LEGAL: the minimap steps aside while you're in.
test('walking into City Hall puts you in a 3D room with a clerk at the window', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.locator('.tab-btn[data-tab="map"]').click();
  await page.waitForFunction(() => !!(window as unknown as { __seat?: unknown }).__seat, undefined, { timeout: 45_000 });
  await page.evaluate(() => (window as unknown as { __seat: Seat }).__seat.enterBuilding('cityhall', 'cityhall', 'City Hall'));
  await expect.poll(() => page.evaluate(() => {
    const room = (window as unknown as { __seat: Seat }).__seat.interiorRoom();
    if(!room) return null;
    let people = 0, labels = 0;
    room.traverse(o => { if(o.name.startsWith('character:')) people++; if(o.name.startsWith('interior:label:')) labels++; });
    return { name: room.name, people, labels };
  }), { timeout: 10_000 }).toEqual({ name: 'interior:cityhall', people: 2, labels: 4 });
  await expect(page.locator('#minimap-canvas')).toBeHidden();
});

// LEGAL: Using a thing in a room moves the camera in to it and draws the popup as the thing (here the
// LEGAL: workbench, as a clipboard); closing the popup brings the room view back. This replaced a
// LEGAL: first-person mode.
test('using the workbench moves in on it and shows a clipboard, and stepping back returns', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.locator('.tab-btn[data-tab="map"]').click();
  await page.waitForFunction(() => !!(window as unknown as { __seat?: unknown }).__seat, undefined, { timeout: 45_000 });
  type Spot = { id: string; x: number; y: number };
  type Full = Seat & { hotspots(): Spot[]; player: { x: number; y: number }; interiorCamera(): import('three').PerspectiveCamera | null; state: { nextEventAt: number } };
  await page.evaluate(() => {
    const seat = (window as unknown as { __seat: Full }).__seat;
    seat.state.nextEventAt = 1e12;
    seat.enterBuilding('playerGarage', 'playerGarage', 'Your Garage');
  });
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    const seat = (window as unknown as { __seat: Full }).__seat;
    const bench = seat.hotspots().find(h => h.id === 'bench')!;
    seat.player.x = bench.x; seat.player.y = bench.y;
  });
  const cameraHeight = () => page.evaluate(() => (window as unknown as { __seat: Full }).__seat.interiorCamera()?.position.y ?? -1);
  await expect.poll(cameraHeight).toBeGreaterThan(80);
  await page.keyboard.press('e');
  await expect(page.locator('#modal-overlay')).toHaveClass(/skin-clipboard/);
  await expect.poll(cameraHeight, { timeout:5000 }).toBeLessThan(45);
  await page.locator('#modal-footer button').last().click();
  await expect(page.locator('#modal-overlay')).toHaveClass(/hidden/);
  await expect.poll(cameraHeight, { timeout:5000 }).toBeGreaterThan(80);
  await expect(page.locator('#view-toggle')).toHaveCount(0);
});
