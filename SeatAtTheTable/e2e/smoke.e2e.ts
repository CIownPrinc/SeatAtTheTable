import { test, expect } from '@playwright/test';

// LEGAL: Smoke test — the safety net that guards the header.ts split. If a
// LEGAL: refactor breaks how the game boots or switches tabs, this goes red
// LEGAL: before a player ever sees a white screen.
test.describe('game boot', () => {
  test.describe.configure({ mode: 'serial' });

  test('loads with the full-screen start page', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle('Seat at the Table');
    await expect(page.locator('#hud-cash')).toHaveText('$47');
    await expect(page.locator('#start-screen')).not.toHaveClass(/hidden/);
    await expect(page.locator('#modal-overlay')).toHaveClass(/hidden/);
    await expect(page.getByRole('button', { name: 'Start', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled();
  });

  test('starting the game and switching to the Map tab works', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await expect(page.locator('#start-screen')).toHaveClass(/hidden/);
    await expect(page.locator('#modal-overlay')).toHaveClass(/hidden/);

    await page.locator('.tab-btn[data-tab="map"]').click();
    await expect(page.locator('.tab-panel[data-tab="map"]')).toHaveClass(/active/);
  });

  test('map renders without WebGL shader failures or missing GLB assets', async ({ page }) => {
    const browserIssues: string[] = [];

    page.on('console', function(message){
      const text = message.text();
      if(text.includes('Shader Error') || text.includes('program not valid')) browserIssues.push(text);
    });
    page.on('response', function(response){
      if(response.url().includes('/assets/map/') && response.status() >= 400) browserIssues.push(`${response.status()} ${response.url()}`);
    });
    page.on('requestfailed', function(request){
      if(request.url().includes('/assets/map/')) browserIssues.push(request.url());
    });

    await page.goto('/');
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await page.locator('.tab-btn[data-tab="map"]').click();
    await expect(page.locator('#scene3d-container canvas.webgl-canvas')).toBeVisible();
    await page.waitForTimeout(1200);

    expect(browserIssues).toEqual([]);
  });

  test('minimap centers the player marker', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await page.locator('.tab-btn[data-tab="map"]').click();

    await expect.poll(async () => page.locator('#minimap-canvas').evaluate((canvas: HTMLCanvasElement) => {
      const context = canvas.getContext('2d');
      if(!context) return 0;
      const pixels = context.getImageData(50, 50, 50, 50).data;
      let goldPixels = 0;
      for(let i = 0; i < pixels.length; i += 4){
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];
        if(r > 150 && g > 95 && g < 190 && b < 80 && a > 180) goldPixels += 1;
      }
      return goldPixels;
    })).toBeGreaterThan(0);
  });

  test('minimap can pan while stopped and recenters while moving', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await page.locator('.tab-btn[data-tab="map"]').click();
    const minimap = page.locator('#minimap-canvas');
    await expect(minimap).toBeVisible();

    const box = await minimap.boundingBox();
    expect(box).not.toBeNull();
    if(!box) return;

    await page.mouse.move(box.x + 75, box.y + 75);
    await page.mouse.down();
    await page.mouse.move(box.x + 112, box.y + 75);
    await page.mouse.up();

    await expect.poll(async () => minimap.evaluate((canvas: HTMLCanvasElement) => {
      const context = canvas.getContext('2d');
      if(!context) return 0;
      const pixels = context.getImageData(68, 68, 14, 14).data;
      let goldPixels = 0;
      for(let i = 0; i < pixels.length; i += 4){
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];
        if(r > 150 && g > 95 && g < 190 && b < 80 && a > 180) goldPixels += 1;
      }
      return goldPixels;
    })).toBe(0);

    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(350);
    await page.keyboard.up('ArrowRight');

    await expect.poll(async () => minimap.evaluate((canvas: HTMLCanvasElement) => {
      const context = canvas.getContext('2d');
      if(!context) return 0;
      const pixels = context.getImageData(68, 68, 14, 14).data;
      let goldPixels = 0;
      for(let i = 0; i < pixels.length; i += 4){
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];
        if(r > 150 && g > 95 && g < 190 && b < 80 && a > 180) goldPixels += 1;
      }
      return goldPixels;
    })).toBeGreaterThan(0);
  });

  test('minimap expands before waypoint placement is allowed', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await page.locator('.tab-btn[data-tab="map"]').click();
    const minimap = page.locator('#minimap-canvas');
    await expect(minimap).toBeVisible();

    const minimapBox = await minimap.boundingBox();
    expect(minimapBox).not.toBeNull();
    if(!minimapBox) return;

    await page.mouse.click(minimapBox.x + 80, minimapBox.y + 80);
    await expect(page.locator('#citymap-overlay')).not.toHaveClass(/hidden/);
    await expect(page.locator('#minimap-clear')).not.toHaveClass(/show/);

    const cityMap = page.locator('#citymap-canvas');
    const cityBox = await cityMap.boundingBox();
    expect(cityBox).not.toBeNull();
    if(!cityBox) return;

    await page.mouse.click(cityBox.x + cityBox.width * 0.3, cityBox.y + cityBox.height * 0.55);
    await expect(page.locator('#minimap-clear')).toHaveClass(/show/);
  });
});
