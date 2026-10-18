import { test, expect } from '@playwright/test';

test.describe('phone-width layout', () => {
  test.use({ viewport: { width: 360, height: 800 } });

  test('the page never scrolls sideways and the phone button stays on screen', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    for (const tab of ['empire', 'map', 'settings']) {
      await page.locator(`.tab-btn[data-tab="${tab}"]`).click();
      const scrollWidth = await page.evaluate(function(){ return document.documentElement.scrollWidth; });
      expect(scrollWidth, `${tab} tab`).toBeLessThanOrEqual(360);
    }
    await expect(page.locator('#phone-btn')).toBeInViewport();
  });
});
