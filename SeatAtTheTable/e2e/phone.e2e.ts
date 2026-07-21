import { test, expect } from '@playwright/test';

// LEGAL: Guards the diegetic-device migration — the phone hosts the online-only
// LEGAL: services (Bank / Stocks / AutoMart) that used to be flat Finance/Assets tabs.
// LEGAL: If relocating those render containers into the overlay breaks, this goes red.
test.describe('phone / Windhaven OS device', () => {
  test('phone opens, Bank + AutoMart apps render, and Finance/Assets tabs are gone', async ({ page }) => {
    // LEGAL: A per-tick byId() on a removed element throws every frame; catch that class
    // LEGAL: of regression by failing on ANY uncaught page error during the flow.
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(e.message));

    await page.goto('/');
    await page.getByRole('button', { name: 'Open the Cart' }).click();
    await expect(page.locator('#modal-overlay')).toHaveClass(/hidden/);

    // LEGAL: Finance and Assets are no longer flat tabs — they live on the phone now.
    await expect(page.locator('.tab-btn[data-tab="bank"]')).toHaveCount(0);
    await expect(page.locator('.tab-btn[data-tab="assets"]')).toHaveCount(0);

    // LEGAL: Open the phone → it's a Pomello handset showing the home screen app grid.
    await page.locator('#phone-btn').click();
    await expect(page.locator('#device-overlay')).not.toHaveClass(/hidden/);
    await expect(page.locator('#device-home')).toBeVisible();
    await expect(page.locator('.device-brand')).toHaveText('Pomello');

    // LEGAL: Sit in the Stocks view for a beat so the tick loop runs while the vault-only
    // LEGAL: HUD elements are absent — this is exactly where the removed-element throw hit.
    await page.locator('.device-app[data-app="stocks"]').click();
    await expect(page.locator('.device-screen[data-screen="finance"]')).toBeVisible();
    await page.waitForTimeout(1200);
    await page.locator('#device-home-btn').click();

    // LEGAL: Bank app → finance screen listing all banks; robbing is NOT on the phone.
    await page.locator('.device-app[data-app="bank"]').click();
    await expect(page.locator('.device-screen[data-screen="finance"]')).toBeVisible();
    await expect(page.locator('#finance-appbar-title')).toHaveText('Bank');
    await expect(page.locator('#bank-panel [data-bank-select]')).toHaveCount(3);
    await expect(page.locator('#bank-panel #start-heist')).toHaveCount(0);

    // LEGAL: Selecting a different bank marks it SELECTED and shows its deposit form.
    await page.locator('#bank-panel [data-bank-select="lakeside-offshore"]').click();
    await expect(page.locator('#bank-panel [data-bank-select="lakeside-offshore"] .col-status')).toHaveText('SELECTED');
    await expect(page.locator('#deposit-input')).toBeVisible();

    // LEGAL: The home button returns to the app grid, then AutoMart's cars populate.
    await page.locator('#device-home-btn').click();
    await expect(page.locator('#device-home')).toBeVisible();
    await page.locator('.device-app[data-app="automart"]').click();
    await expect(page.locator('.device-screen[data-screen="automart"]')).toBeVisible();
    await expect(page.locator('#assets-cars')).not.toBeEmpty();

    // LEGAL: Realty is now its own app (split out of AutoMart) → the properties list.
    await page.locator('#device-home-btn').click();
    await page.locator('.device-app[data-app="realty"]').click();
    await expect(page.locator('.device-screen[data-screen="realty"]')).toBeVisible();
    await expect(page.locator('#assets-buildings')).not.toBeEmpty();

    // LEGAL: Escape closes the phone.
    await page.keyboard.press('Escape');
    await expect(page.locator('#device-overlay')).toHaveClass(/hidden/);

    // LEGAL: No uncaught errors should have fired at any point in the flow.
    expect(pageErrors).toEqual([]);
  });
});
