import { test, type Page } from '@playwright/test';

// LEGAL: Not an assertion — a camera on the one-of-a-kind places, to check by eye that each stands at
// LEGAL: real size next to Arjun and where it belongs (the docks on the canal).

interface SeatHook {
  player: { x: number; y: number; vx: number; vy: number };
  state: { inVehicle: boolean; playSeconds: number; nextEventAt: number };
  mapObjects: { kind: string; id: string; x: number; y: number }[];
}

async function waitForScene(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.locator('.tab-btn[data-tab="map"]').click();
  await page.waitForFunction(() => !!(window as never as { __seat?: unknown }).__seat, undefined, { timeout: 45000 });
  await page.evaluate(() => { (window as never as { __seat: SeatHook }).__seat.state.nextEventAt = 1e12; });
  await page.waitForTimeout(2500);
}

test('photograph the docks, the drive-in, the lodge and the motel', async function ({ page }) {
  test.setTimeout(120000);
  await waitForScene(page);
  for(const id of ['docksDockmaster', 'driveInBoundary', 'lodgeRidgewood', 'motelSunset']){
    await page.evaluate(function(placeId){
      const seat = (window as never as { __seat: SeatHook }).__seat;
      const place = seat.mapObjects.find(o => o.id === placeId)!;
      seat.state.inVehicle = false;
      seat.player.x = place.x; seat.player.y = place.y + 20; seat.player.vx = 0; seat.player.vy = 0;
      seat.state.playSeconds = 20;
    }, id);
    await page.waitForTimeout(1500);
    const popup = page.locator('#modal-overlay:not(.hidden) #modal-footer button').first();
    if(await popup.isVisible()) await popup.click();
    await page.locator('#scene3d-container canvas.webgl-canvas').screenshot({ path: `test-results/place-${id}.png` });
  }
});
