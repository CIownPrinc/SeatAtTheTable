import { test, expect, type Page } from '@playwright/test';

// LEGAL: A camera, not an assertion — see shot-garage.e2e.ts. Opens the City Map with the
// LEGAL: district layer on, because an overlay is a picture and the only way to know whether
// LEGAL: a picture works is to look at it.

async function waitForScene(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.locator('.tab-btn[data-tab="map"]').click();
  await page.waitForFunction(() => !!(window as never as { __seat?: unknown }).__seat, undefined, { timeout: 45000 });
  await page.waitForTimeout(2500);
}

test('photograph the district overlay', async function ({ page }) {
  // LEGAL: Booting the world takes most of the default 30s budget on its own.
  test.setTimeout(90000);
  await waitForScene(page);
  await page.locator('#minimap-expand').click();
  await expect(page.locator('#citymap-overlay')).toBeVisible();
  await page.locator('#citymap-districts').click();
  await page.waitForTimeout(600);
  // LEGAL: Whole page: the City Map panel animates in, so waiting for a single element to be
  // LEGAL: "stable" never resolves.
  await page.screenshot({ path: 'test-results/district-overlay.png' });
});
