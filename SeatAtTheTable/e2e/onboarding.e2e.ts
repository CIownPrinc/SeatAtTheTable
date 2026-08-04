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
});
