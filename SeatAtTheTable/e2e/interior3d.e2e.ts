import { test, expect } from '@playwright/test';

interface Seat {
  enterBuilding(kind: string, refId: string, name: string): void;
  interiorRoom(): import('three').Object3D | null;
}

// LEGAL: Rooms used to be a flat 2D sketch with an emoji per hotspot. Now they're 3D: a counter
// LEGAL: with a clerk behind it, and the minimap steps aside while you're in.
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
  }), { timeout: 10_000 }).toEqual({ name: 'interior:cityhall', people: 1, labels: 2 });
  await expect(page.locator('#minimap-canvas')).toBeHidden();
});

// LEGAL: First person indoors: the view button switches to Arjun's eyes, and W walks the way he faces.
test('first person indoors walks you the way you face', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.locator('.tab-btn[data-tab="map"]').click();
  await page.waitForFunction(() => !!(window as unknown as { __seat?: unknown }).__seat, undefined, { timeout: 45_000 });
  await page.evaluate(() => (window as unknown as { __seat: Seat }).__seat.enterBuilding('mall', 'mallLakeridge', 'Lakeridge Mall'));
  await page.locator('#view-toggle').click();
  await expect(page.locator('#view-toggle')).toHaveText(/Overhead/);
  type Player = { x: number; y: number; facing: number };
  const read = () => page.evaluate(() => { const p = (window as unknown as { __seat: { player: Player } }).__seat.player; return { x: p.x, y: p.y, facing: p.facing }; });
  const start = await read();
  await page.keyboard.down('w'); await page.waitForTimeout(600); await page.keyboard.up('w');
  const moved = await read();
  // LEGAL: Facing the back of the mall (-y): forward is up the room, and the heading hasn't changed.
  expect(moved.y).toBeLessThan(start.y - 20);
  expect(moved.facing).toBeCloseTo(start.facing, 2);
});
