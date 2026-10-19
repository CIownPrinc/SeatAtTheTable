import { test, expect } from '@playwright/test';

// LEGAL: A breakdown throws you out of the car. The warning used to go only to the news feed on
// LEGAL: another tab, so it looked like being ejected for no reason.
test('a breakdown is announced on the map and the car smokes', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.locator('.tab-btn[data-tab="map"]').click();
  await page.waitForFunction(() => !!(window as unknown as { __seat?: unknown }).__seat, undefined, { timeout: 45_000 });
  await page.keyboard.type('bigdumper');
  await page.evaluate(() => (window as unknown as { __seat: { breakDownCar(): void } }).__seat.breakDownCar());
  await expect(page.locator('#scene3d-container .map-toast')).toHaveClass(/show/);
  await expect(page.locator('#scene3d-container .map-toast')).toContainText('broken down');
  const smoking = await page.evaluate(() => {
    let found = false;
    (window as unknown as { __seat: { scene: import('three').Scene } }).__seat.scene.traverse(node => { if(node.name === 'smoke-plume') found = true; });
    return found;
  });
  expect(smoking).toBe(true);
});
