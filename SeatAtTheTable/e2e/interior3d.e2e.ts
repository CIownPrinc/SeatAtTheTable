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
