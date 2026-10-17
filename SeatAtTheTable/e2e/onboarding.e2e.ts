import { test, expect } from '@playwright/test';

test.describe('progressive onboarding', () => {
  test('starts with the cart lesson and advances after opening the cart', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start', exact: true }).click();

    await expect(page.locator('#advisor-title')).toHaveText('Street Lessons');
    await expect(page.locator('#advisor-list')).toContainText('Open your first front');
    const openEmpire = page.getByRole('button', { name: 'Open empire', exact: true });
    await expect(openEmpire).toHaveCount(1);
    await expect(openEmpire).toHaveText('Open empire');
    await openEmpire.click();
    await expect(page.locator('.tab-panel[data-tab="empire"]')).toHaveClass(/active/);

    const openCart = page.locator('#grid-legit [data-action="expand"][data-id="cart"]');
    await expect(openCart).toHaveCount(1);
    await openCart.click();
    await expect(page.locator('#advisor-list')).toContainText('Put someone on the cart');
    await expect(page.locator('#advisor-list')).not.toContainText('Open your first front');
  });

  test('walks the whole early-game sequence: cart, crew, lab, first corner', async ({ page }) => {
    test.setTimeout(60_000);
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(e.message));
    await page.goto('/');
    await page.getByRole('button', { name: 'Start', exact: true }).click();

    // LEGAL: Earning each step's cash takes minutes, so grant it through the dev hook.
    await page.locator('.tab-btn[data-tab="map"]').click();
    await page.waitForFunction(function(){ return !!(window as unknown as { __seat?: unknown }).__seat; });
    const grantCash = () => page.evaluate(function(){
      const seat = (window as unknown as { __seat: { state: { cash: number; nextEventAt: number } } }).__seat;
      seat.state.cash = 20000;
      seat.state.nextEventAt = Number.MAX_SAFE_INTEGER;
    });
    await grantCash();
    // LEGAL: The cash crosses milestone thresholds; read each headline and carry on, as a player would.
    const dismissPopups = async () => {
      await page.waitForTimeout(400);
      while(await page.locator('#modal-overlay').evaluate(function(element){ return !element.classList.contains('hidden'); })){
        await page.locator('#modal-footer button').first().click();
        await page.waitForTimeout(200);
      }
    };
    await dismissPopups();

    await page.locator('.tab-btn[data-tab="empire"]').click();
    await page.locator('#grid-legit [data-action="expand"][data-id="cart"]').click();
    await expect(page.locator('#advisor-list')).toContainText('Put someone on the cart');

    await grantCash();
    await dismissPopups();
    await page.locator('#grid-legit [data-action="hirecrew"][data-id="cart"]').click();
    await expect(page.locator('#advisor-list')).toContainText('Build your supply chain');

    await grantCash();
    await dismissPopups();
    await page.locator('#upgrade-lab').click();
    await expect(page.locator('#advisor-list')).toContainText('Put your first corner to work');

    await grantCash();
    await dismissPopups();
    await page.locator('.tab-btn[data-tab="map"]').click();
    await page.evaluate(function(){
      const seat = (window as unknown as { __seat: { player: { x: number; y: number }; mapObjects: { kind: string; x: number; y: number }[] } }).__seat;
      const corner = seat.mapObjects.find(function(object){ return object.kind === 'corner'; });
      if(!corner) throw new Error('no corner on the map');
      seat.player.x = corner.x;
      seat.player.y = corner.y;
    });
    await page.keyboard.press('e');
    await page.locator('#modal-footer').getByRole('button', { name: /^Post a dealer/ }).click();
    await expect(page.locator('#advisor-list')).not.toContainText('Put your first corner to work');
    expect(pageErrors).toEqual([]);
  });
});
