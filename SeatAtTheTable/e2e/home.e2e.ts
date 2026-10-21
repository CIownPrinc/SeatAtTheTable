import { test, expect, type Page } from '@playwright/test';

interface Seat {
  state: { cash: number; vaultCash: number; appearance: { hat: string } };
  enterBuilding(kind: string, refId: string, name: string): void;
  hotspots(): { id: string; action(): void }[];
}
const seat = () => (window as unknown as { __seat: Seat }).__seat;

async function inTheGarage(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.locator('.tab-btn[data-tab="map"]').click();
  await page.waitForFunction(() => !!(window as unknown as { __seat?: unknown }).__seat, undefined, { timeout: 45_000 });
  await page.evaluate(() => (window as unknown as { __seat: Seat }).__seat.enterBuilding('playerGarage', 'playerGarage', 'Your Garage'));
  // LEGAL: The flat is upstairs: take the stairs from the garage floor.
  await page.evaluate(() => (window as unknown as { __seat: Seat }).__seat.hotspots().find(h => h.id === 'stairs-up')!.action());
  await expect.poll(() => page.evaluate(() => (window as unknown as { __seat: Seat }).__seat.hotspots().some(h => h.id === 'wardrobe'))).toBe(true);
}

test.describe("Arjun's flat above the garage", () => {
  test('the vault keeps cash out of your pocket and gives it back', async ({ page }) => {
    test.setTimeout(90_000);
    await inTheGarage(page);
    await page.evaluate(() => { const s = (window as unknown as { __seat: Seat }).__seat; s.state.cash = 5000; s.hotspots().find(h => h.id === 'vault')!.action(); });
    await expect(page.locator('#modal-title')).toHaveText('The Vault');
    await page.getByRole('button', { name: 'Deposit everything' }).click();
    expect(await page.evaluate(() => { const s = (window as unknown as { __seat: Seat }).__seat; return [s.state.cash, s.state.vaultCash]; })).toEqual([0, 5000]);
    await page.getByRole('button', { name: 'Take everything' }).click();
    expect(await page.evaluate(() => { const s = (window as unknown as { __seat: Seat }).__seat; return [s.state.cash, s.state.vaultCash]; })).toEqual([5000, 0]);
    void seat;
  });

  test('the wardrobe changes what Arjun wears', async ({ page }) => {
    test.setTimeout(90_000);
    await inTheGarage(page);
    const before = await page.evaluate(() => (window as unknown as { __seat: Seat }).__seat.state.appearance.hat);
    await page.evaluate(() => (window as unknown as { __seat: Seat }).__seat.hotspots().find(h => h.id === 'wardrobe')!.action());
    await expect(page.locator('#wardrobe-overlay')).toBeVisible();
    await page.getByRole('button', { name: 'Next Hat' }).click();
    await page.getByRole('button', { name: 'Wear this' }).click();
    await expect(page.locator('#wardrobe-overlay')).toHaveCount(0);
    const after = await page.evaluate(() => (window as unknown as { __seat: Seat }).__seat.state.appearance.hat);
    expect(after).not.toBe(before);
  });
});
