import { test, expect } from '@playwright/test';

interface Seat {
  enterBuilding(kind: string, refId: string, name: string): void;
  hotspots(): Array<{ id: string; action(): void }>;
  scene: import('three').Scene;
}

// LEGAL: The street race used to be a timing bar in a popup. Now you line up against real cars.
test('lining up at the Fire Road starts a race against three rival cars', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.locator('.tab-btn[data-tab="map"]').click();
  await page.waitForFunction(() => !!(window as unknown as { __seat?: unknown }).__seat, undefined, { timeout: 45_000 });
  await page.evaluate(() => {
    const seat = (window as unknown as { __seat: Seat }).__seat;
    seat.enterBuilding('missionOffice', 'fireRoadKestrel', 'Kestrel Woods Fire Road');
    seat.hotspots().find(spot => spot.id === 'trailhead')!.action();
  });
  await page.getByRole('button', { name: 'Line up' }).click();
  await expect(page.locator('#race-hud .race-count')).toBeVisible();
  const rivals = await page.evaluate(() => {
    let n = 0;
    (window as unknown as { __seat: Seat }).__seat.scene.traverse(o => { if(o.name.startsWith('race:rival')) n++; });
    return n;
  });
  expect(rivals).toBe(3);
  await expect(page.locator('#race-hud .race-line')).toContainText('Checkpoint 1/', { timeout: 10_000 });
});
