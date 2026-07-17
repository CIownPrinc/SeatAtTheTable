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
});
