import { test, expect } from '@playwright/test';

// LEGAL: Guards the diegetic-device migration — the phone hosts the online-only
// LEGAL: services (Bank / Stocks / AutoMart) that used to be flat Finance/Assets tabs.
// LEGAL: If relocating those render containers into the overlay breaks, this goes red.
test.describe('phone / Windhaven OS device', () => {
  test('phone opens, Bank + AutoMart apps render, and Finance/Assets tabs are gone', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Open the Cart' }).click();
    await expect(page.locator('#modal-overlay')).toHaveClass(/hidden/);

    // LEGAL: Finance and Assets are no longer flat tabs — they live on the phone now.
    await expect(page.locator('.tab-btn[data-tab="bank"]')).toHaveCount(0);
    await expect(page.locator('.tab-btn[data-tab="assets"]')).toHaveCount(0);

    // LEGAL: Open the phone → home screen with the app grid.
    await page.locator('#phone-btn').click();
    await expect(page.locator('#device-overlay')).not.toHaveClass(/hidden/);
    await expect(page.locator('#device-home')).toBeVisible();

    // LEGAL: Bank app → finance screen with a populated bank panel.
    await page.locator('.device-app[data-app="bank"]').click();
    await expect(page.locator('.device-screen[data-screen="finance"]')).toBeVisible();
    await expect(page.locator('#finance-appbar-title')).toHaveText('Bank');
    await expect(page.locator('#bank-panel')).not.toBeEmpty();

    // LEGAL: Back to home, then AutoMart → the cars catalogue is populated.
    await page.locator('.device-screen[data-screen="finance"] .device-back').click();
    await expect(page.locator('#device-home')).toBeVisible();
    await page.locator('.device-app[data-app="automart"]').click();
    await expect(page.locator('.device-screen[data-screen="automart"]')).toBeVisible();
    await expect(page.locator('#assets-cars')).not.toBeEmpty();

    // LEGAL: Escape closes the phone.
    await page.keyboard.press('Escape');
    await expect(page.locator('#device-overlay')).toHaveClass(/hidden/);
  });
});
