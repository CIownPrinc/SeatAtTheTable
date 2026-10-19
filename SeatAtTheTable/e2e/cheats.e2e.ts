import { test, expect, type Page } from '@playwright/test';

async function start(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
}

function heat(page: Page): Promise<number> {
  return page.evaluate(function(){ return (window as unknown as { __seat: { state: { heat: number } } }).__seat.state.heat; });
}

test.describe('cheat codes', () => {
  test('typing cheatcode lists every cheat', async ({ page }) => {
    await start(page);
    await page.keyboard.type('cheatcode');
    await expect(page.locator('#modal-eyebrow')).toHaveText('Cheat codes');
    await expect(page.locator('#modal-body')).toContainText('cash4ever');
    await expect(page.locator('#modal-body')).toContainText('cleanrecord');
  });

  test('cash4ever pays a billion', async ({ page }) => {
    await start(page);
    await page.keyboard.type('cash4ever');
    await expect(page.locator('#hud-cash')).toHaveText('$1.00B');
  });

  test('cleanrecord wipes heat', async ({ page }) => {
    test.setTimeout(60_000);
    await start(page);
    // LEGAL: The dev-only __seat hook exists once the map scene has been built.
    await page.locator('.tab-btn[data-tab="map"]').click();
    await page.waitForFunction(function(){ return !!(window as unknown as { __seat?: unknown }).__seat; }, undefined, { timeout: 45_000 });
    await page.evaluate(function(){ (window as unknown as { __seat: { state: { heat: number } } }).__seat.state.heat = 60; });
    await page.keyboard.type('cleanrecord');
    await expect.poll(() => heat(page)).toBe(0);
  });

  test('every fun cheat runs cleanly, and the helicopter actually flies', async ({ page }) => {
    test.setTimeout(90_000);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await start(page);
    await page.locator('.tab-btn[data-tab="map"]').click();
    await page.waitForFunction(function(){ return !!(window as unknown as { __seat?: unknown }).__seat; }, undefined, { timeout: 45_000 });
    for(const code of ['bigheadmode', 'liquidcourage', 'rocketman', 'beammeup', 'bigdumper', 'getdachoppa']){
      await page.keyboard.type(code);
      await page.waitForTimeout(300);
    }
    await page.waitForTimeout(1500);
    const height = await page.evaluate(function(){
      const seat = (window as unknown as { __seat: { scene: import('three').Scene } }).__seat;
      let y = 0;
      seat.scene.traverse(function(node){ if(node.name === 'rotor'){ const p = node.getWorldPosition(new (node.position.constructor as typeof import('three').Vector3)()); y = p.y; } });
      return y;
    });
    expect(height).toBeGreaterThan(60);
    expect(errors).toEqual([]);
  });
});
