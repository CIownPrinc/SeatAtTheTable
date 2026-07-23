import { test, type Page } from '@playwright/test';

// LEGAL: Not an assertion — a camera. Points the game at the drive-in bay and saves a frame,
// LEGAL: because the palm trees passed every test I wrote for them and still looked like sea
// LEGAL: urchins. Some things can only be checked by looking.

interface SeatHook {
  player: { x: number; y: number; vx: number; vy: number };
  state: { inVehicle: boolean; playSeconds: number };
  mapObjects: { kind: string; id: string; x: number; y: number }[];
}

async function waitForScene(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.locator('.tab-btn[data-tab="map"]').click();
  await page.waitForFunction(() => !!(window as never as { __seat?: unknown }).__seat, undefined, { timeout: 45000 });
  await page.waitForTimeout(2500);
}

test('photograph the drive-in bay', async function ({ page }) {
  await waitForScene(page);
  await page.evaluate(function(){
    const seat = (window as never as { __seat: SeatHook }).__seat;
    const garage = seat.mapObjects.find(o => o.kind === 'service' && o.id === 'playerGarage')!;
    seat.player.x = garage.x;
    seat.player.y = garage.y + 30;
    seat.player.vx = 0; seat.player.vy = 0;
    // LEGAL: Noon, so colours are judged in daylight rather than under a street lamp.
    seat.state.playSeconds = 20;
  });
  await page.waitForTimeout(1200);
  await page.locator('#scene3d-container canvas.webgl-canvas').screenshot({ path: 'test-results/garage-bay.png' });
});
