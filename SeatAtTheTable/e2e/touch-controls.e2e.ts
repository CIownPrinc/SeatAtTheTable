import { test, expect } from '@playwright/test';

interface SeatHook { player: { x: number; y: number }; state: { nextEventAt: number } }

test.describe('touch-screen map controls', () => {
  test.use({ viewport: { width: 412, height: 839 }, isMobile: true, hasTouch: true });

  test('the thumbstick appears on a touch screen and walks the player', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/');
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await page.locator('.tab-btn[data-tab="map"]').click();
    await page.waitForFunction(function(){ return !!(window as unknown as { __seat?: unknown }).__seat; });
    await page.evaluate(function(){ (window as unknown as { __seat: SeatHook }).__seat.state.nextEventAt = Number.MAX_SAFE_INTEGER; });

    const stick = page.locator('.touch-stick');
    await expect(stick).toBeVisible();
    const box = (await stick.boundingBox())!;
    const startX = await page.evaluate(function(){ return (window as unknown as { __seat: SeatHook }).__seat.player.x; });

    // LEGAL: Push the stick hard left: the spawn has open road west of it.
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x, box.y + box.height / 2, { steps: 4 });
    await page.waitForTimeout(1200);
    await page.mouse.up();

    const endX = await page.evaluate(function(){ return (window as unknown as { __seat: SeatHook }).__seat.player.x; });
    expect(startX - endX).toBeGreaterThan(40);
  });
});

test('a mouse-and-keyboard desktop never shows the thumbstick', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.locator('.tab-btn[data-tab="map"]').click();
  await expect(page.locator('.touch-stick')).toBeHidden();
});
