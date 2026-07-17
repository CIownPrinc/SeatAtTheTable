import { test, expect } from '@playwright/test';

// LEGAL: Smoke test — the safety net that guards the header.ts split. If a
// LEGAL: refactor breaks how the game boots or switches tabs, this goes red
// LEGAL: before a player ever sees a white screen.
test.describe('game boot', () => {
  test('loads with the HUD and opens on the intro case file', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle('Seat at the Table');
    await expect(page.locator('#hud-cash')).toHaveText('$47');
    await expect(page.getByRole('button', { name: 'Open the Cart' })).toBeVisible();
  });

  test('starting the game and switching to the Map tab works', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Open the Cart' }).click();
    await expect(page.locator('#modal-overlay')).toHaveClass(/hidden/);

    await page.locator('.tab-btn[data-tab="map"]').click();
    await expect(page.locator('.tab-panel[data-tab="map"]')).toHaveClass(/active/);
  });

  test('minimap centers the player marker', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Open the Cart' }).click();
    await page.locator('.tab-btn[data-tab="map"]').click();

    await expect.poll(async () => page.locator('#minimap-canvas').evaluate((canvas: HTMLCanvasElement) => {
      const context = canvas.getContext('2d');
      if(!context) return 0;
      const pixels = context.getImageData(68, 68, 14, 14).data;
      let goldPixels = 0;
      for(let i = 0; i < pixels.length; i += 4){
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];
        if(r > 150 && g > 95 && g < 190 && b < 80 && a > 180) goldPixels += 1;
      }
      return goldPixels;
    })).toBeGreaterThan(6);
  });
});
