import { test, expect, type Page } from '@playwright/test';

interface Seat { player: { x: number; y: number }; mapObjects: Array<{ x: number; y: number; ref: { id?: string } }>; state: { nextEventAt: number; cash: number } }

// LEGAL: The amenity games (the court, the park chess tables) played through to the end with the real
// LEGAL: buttons, twice each, from the map: no page error, the overlay closes, and the map keeps
// LEGAL: drawing afterwards. Written after a report that playing any amenity game crashed the game.
async function walkUpAndPlay(page: Page, id: string): Promise<void> {
  await page.evaluate(placeId => {
    const seat = (window as unknown as { __seat: Seat }).__seat;
    const place = seat.mapObjects.find(o => o.ref?.id === placeId)!;
    seat.player.x = place.x; seat.player.y = place.y + 30;
  }, id);
  await page.waitForTimeout(400);
  await page.keyboard.press('e');
  await page.locator('#modal-footer button').first().click();
  await expect(page.locator('.mg-overlay')).toHaveCount(1);
}

test('the court and the chess tables play to the end without breaking the map', async ({ page }) => {
  test.setTimeout(150_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if(message.type() === 'error') errors.push(message.text()); });
  await page.goto('/');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.locator('.tab-btn[data-tab="map"]').click();
  await page.waitForFunction(() => !!(window as unknown as { __seat?: unknown }).__seat, undefined, { timeout: 45_000 });
  await page.evaluate(() => { (window as unknown as { __seat: Seat }).__seat.state.nextEventAt = 1e12; });
  for(let round = 0; round < 2; round++){
    await walkUpAndPlay(page, 'devlin-court');
    for(let shot = 0; shot < 5; shot++){
      await page.locator('.mg-overlay button', { hasText: 'Shoot' }).click();
      await page.waitForTimeout(2400);
    }
    await expect(page.locator('.mg-overlay')).toHaveCount(0, { timeout: 5000 });
    // LEGAL: How it went, on screen, rather than the game just vanishing.
    await expect(page.locator('#modal-title')).toHaveText(/of 5/);
    await page.locator('#modal-footer button', { hasText: 'Done' }).click();
    await walkUpAndPlay(page, 'millennium-chess');
    for(let puzzle = 0; puzzle < 3 && await page.locator('.mg-overlay').count(); puzzle++){
      await page.locator('.mg-overlay .mg-foot button').first().click();
      await page.waitForTimeout(1500);
    }
    await expect(page.locator('.mg-overlay')).toHaveCount(0, { timeout: 8000 });
    await expect(page.locator('#modal-title')).toHaveText(/of 3/);
    await page.locator('#modal-footer button', { hasText: 'Done' }).click();
  }
  // LEGAL: The map still animates: frames keep coming.
  const frames = await page.evaluate(() => new Promise<number>(resolve => { let n = 0; const start = performance.now(); const tick = () => { n++; if(performance.now() - start < 1000) requestAnimationFrame(tick); else resolve(n); }; requestAnimationFrame(tick); }));
  expect(frames).toBeGreaterThan(20);
  expect(errors).toEqual([]);
});
