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

test('the tab bar stays visible after scrolling a long tab', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.evaluate(function(){ window.scrollTo(0, 900); });
  const topElement = await page.evaluate(function(){
    const tab = document.querySelector('.tab-btn[data-tab="map"]')!.getBoundingClientRect();
    return document.elementFromPoint(tab.left + tab.width / 2, tab.top + tab.height / 2)?.closest('.tab-btn')?.getAttribute('data-tab');
  });
  expect(topElement).toBe('map');
});

test.describe('phone held sideways', () => {
  test.use({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true });

  test('opening the map fits the whole map on screen', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/');
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await page.locator('.tab-btn[data-tab="map"]').click();
    await page.locator('#scene3d-container canvas.webgl-canvas').waitFor();
    await page.waitForTimeout(300);
    const box = (await page.locator('#scene3d-container').boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(390 + 1);
  });
});

test.describe('large monitor', () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  test('the map grows past its laptop size', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await page.locator('.tab-btn[data-tab="map"]').click();
    const box = (await page.locator('#scene3d-container').boundingBox())!;
    expect(box.width).toBeGreaterThan(1000);
  });
});
