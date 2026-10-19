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

  // LEGAL: GTA-style: no panel over the game. The minimap's rim takes the colour of whoever holds
  // LEGAL: the block you're on, and one line underneath says whose turf it is.
  test('the minimap says whose turf you are standing on', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(e.message));

    await page.goto('/');
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await page.locator('.tab-btn[data-tab="map"]').click();

    const turf = page.locator('#minimap-turf');
    await expect(turf).toBeVisible();
    await expect(turf).toContainText(/turf|Contested|open ground/);
    await expect(page.locator('#territory-toggle')).toHaveCount(0);

    // LEGAL: Moving to another district changes the label.
    await page.waitForFunction(() => !!(window as unknown as { __seat?: unknown }).__seat, undefined, { timeout: 45000 });
    const before = await turf.textContent();
    await page.evaluate(() => { const seat = (window as unknown as { __seat: { player: { x: number; y: number } } }).__seat; seat.player.x = 6200; seat.player.y = 450; });
    await expect.poll(() => turf.textContent()).not.toBe(before);

    expect(pageErrors, `uncaught page errors: ${pageErrors.join(' | ')}`).toEqual([]);
  });

  test('the city map carries the same territory layer, with block names', async ({ page }) => {
    test.setTimeout(60000);
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(e.message));

    await page.goto('/');
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await page.locator('.tab-btn[data-tab="map"]').click();
    await page.locator('#minimap-expand').dispatchEvent('click');
    await expect(page.locator('#citymap-overlay')).not.toHaveClass(/hidden/);

    await expect(page.locator('#citymap-territory-legend')).toHaveClass(/hidden/);
    await page.locator('#citymap-territory').dispatchEvent('click');
    await expect(page.locator('#citymap-territory-legend')).not.toHaveClass(/hidden/);
    await expect(page.locator('#citymap-territory')).toHaveClass(/active/);
    await expect(page.locator('#citymap-territory-legend')).toContainText('Rockwell Kings');
    await expect(page.locator('#citymap-territory-legend .territory-row')).toHaveCount(3);

    await page.locator('#citymap-territory').dispatchEvent('click');
    await expect(page.locator('#citymap-territory-legend')).toHaveClass(/hidden/);

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
