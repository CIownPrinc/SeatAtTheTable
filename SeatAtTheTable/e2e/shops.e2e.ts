import { test, expect } from '@playwright/test';

// LEGAL: Guards Phase 4 — buying moved off the phone and into branded shops on the map,
// LEGAL: and the minimap gained a territory overlay so turf-gated pricing is legible.
test.describe('branded shops + territory overlay', () => {
  test('the phone lists only online stock; dealer-only stock is not orderable', async ({ page }) => {
    // LEGAL: Same page-error guard as phone.e2e — removing the generic dealer/realty
    // LEGAL: buildings is exactly the kind of change that leaves a per-tick byId() throw.
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(e.message));

    await page.goto('/');
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await expect(page.locator('#modal-overlay')).toHaveClass(/hidden/);

    await page.locator('#phone-btn').click();
    await page.locator('.device-app[data-app="automart"]').click();
    await expect(page.locator('.device-screen[data-screen="automart"]')).toBeVisible();

    // LEGAL: Karolla is online:true, so the catalog still carries it.
    await expect(page.locator('#assets-cars')).toContainText('Karolla');
    // LEGAL: The Diamond Veyra and the Outlaw Chopper are dealer-only — you have to drive
    // LEGAL: to Diamond Exotics / Outlaw Riders to buy them.
    await expect(page.locator('#assets-cars')).not.toContainText('Diamond Veyra');
    await expect(page.locator('#assets-cars')).not.toContainText('Outlaw Chopper');
    await expect(page.locator('#assets-cars [data-car-buy="exotic"]')).toHaveCount(0);

    await page.waitForTimeout(800);
    expect(pageErrors, `uncaught page errors: ${pageErrors.join(' | ')}`).toEqual([]);
  });

  test('the minimap territory overlay toggles and names the crew holding each district', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(e.message));

    await page.goto('/');
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await page.locator('.tab-btn[data-tab="map"]').click();

    // LEGAL: Off by default, so the minimap is untouched until you ask for it.
    await expect(page.locator('#territory-legend')).toHaveClass(/hidden/);

    // LEGAL: dispatchEvent rather than click() — the sticky HUD overlaps the minimap
    // LEGAL: controls, the same reason the smoke suite dispatches on #minimap-expand.
    await page.locator('#territory-toggle').dispatchEvent('click');
    await expect(page.locator('#territory-legend')).not.toHaveClass(/hidden/);
    await expect(page.locator('#territory-toggle')).toHaveClass(/active/);

    // LEGAL: Every district must name its crew, or the colors mean nothing.
    await expect(page.locator('#territory-legend')).toContainText('Rockwell Kings');
    await expect(page.locator('#territory-legend')).toContainText('Cicero Firm');
    await expect(page.locator('#territory-legend')).toContainText('Meridian Group');
    await expect(page.locator('#territory-legend .territory-row')).toHaveCount(3);

    // LEGAL: Let the map loop run with the overlay up — the tint is drawn every frame.
    await page.waitForTimeout(1000);

    await page.locator('#territory-toggle').dispatchEvent('click');
    await expect(page.locator('#territory-legend')).toHaveClass(/hidden/);

    expect(pageErrors, `uncaught page errors: ${pageErrors.join(' | ')}`).toEqual([]);
  });

  test('every branded shop is searchable on the expanded city map', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await page.locator('.tab-btn[data-tab="map"]').click();
    await page.locator('#minimap-expand').dispatchEvent('click');
    await expect(page.locator('#citymap-overlay')).not.toHaveClass(/hidden/);

    // LEGAL: The branded lots replaced the generic Auto Exchange / Whitfield Realty, so
    // LEGAL: they must be reachable the same way any other place is.
    await page.locator('#citymap-search').fill('No Problem Auto');
    await expect(page.locator('#citymap-results')).toContainText('No Problem Auto');

    await page.locator('#citymap-search').fill('Lakeshore');
    await expect(page.locator('#citymap-results')).toContainText('Lakeshore Development');

    // LEGAL: The generic buildings are gone for good.
    await page.locator('#citymap-search').fill('Windhaven Auto Exchange');
    await expect(page.locator('#citymap-results')).not.toContainText('Windhaven Auto Exchange');
  });
});
