import { test, expect } from '@playwright/test';

interface MapObject { kind: string; x: number; y: number; ref: { name?: string } }
interface Seat { player: { x: number; y: number }; mapObjects: MapObject[]; state: { nextEventAt: number } }

// LEGAL: Walking up to a building you can buy used to fall through to the stranger popup, with a
// LEGAL: random name like "Fatima Singh" and placeholder text. It opens the property's own panel.
test('interacting with a property shows the property, not a random stranger', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.locator('.tab-btn[data-tab="map"]').click();
  await page.waitForFunction(() => !!(window as unknown as { __seat?: unknown }).__seat, undefined, { timeout: 45_000 });
  const name = await page.evaluate(() => {
    const seat = (window as unknown as { __seat: Seat }).__seat;
    seat.state.nextEventAt = 1e12;
    const property = seat.mapObjects.find(o => o.kind === 'property')!;
    seat.player.x = property.x; seat.player.y = property.y;
    return property.ref.name!;
  });
  await page.waitForTimeout(400);
  await page.keyboard.press('e');
  await expect(page.locator('#modal-overlay')).not.toHaveClass(/hidden/);
  await expect(page.locator('#modal-title')).toHaveText(name);
  await expect(page.locator('#modal-eyebrow')).not.toHaveText('A Stranger');
});
