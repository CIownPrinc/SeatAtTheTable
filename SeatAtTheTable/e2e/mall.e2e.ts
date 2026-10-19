import { test, expect } from '@playwright/test';

interface Seat {
  state: { cash: number; appearance: { hat: string }; ownedWardrobe: string[] };
  enterBuilding(kind: string, refId: string, name: string): void;
  hotspots(): Array<{ id: string; action(): void }>;
}

// LEGAL: The mall's hat shop is a fitting room: pick a hat, pay, and walk out wearing it.
test('buying a fedora at Lakeridge Mall puts it on Arjun and in his wardrobe', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.locator('.tab-btn[data-tab="map"]').click();
  await page.waitForFunction(() => !!(window as unknown as { __seat?: unknown }).__seat, undefined, { timeout: 45_000 });
  await page.evaluate(() => {
    const seat = (window as unknown as { __seat: Seat }).__seat;
    seat.state.cash = 1000;
    seat.enterBuilding('mall', 'mallLakeridge', 'Lakeridge Mall');
    seat.hotspots().find(spot => spot.id === 'shop:crown')!.action();
  });
  const value = page.locator('#wardrobe-overlay [data-value="hat"]');
  for(let i = 0; i < 6 && !(await value.textContent())?.startsWith('Fedora'); i++) await page.getByRole('button', { name: 'Next Hat' }).click();
  await expect(page.locator('.wardrobe-save')).toHaveText('Buy and wear · $180');
  await page.locator('.wardrobe-save').click();
  const after = await page.evaluate(() => { const { state } = (window as unknown as { __seat: Seat }).__seat; return { cash: state.cash, hat: state.appearance.hat, owned: state.ownedWardrobe }; });
  expect(after).toEqual({ cash: 820, hat: 'fedora', owned: ['hat:fedora'] });
});
