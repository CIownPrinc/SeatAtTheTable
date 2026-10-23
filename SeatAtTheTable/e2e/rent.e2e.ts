import { test, expect } from '@playwright/test';

type Seat = {
  state: { cash: number; nextEventAt: number; ownedProperties: string[]; propertyOwnedAt: Record<string, number>; playSeconds: number; rentPots: Record<string, number>; managedProperties: string[] };
  enterBuilding(kind: string, refId: string, name: string): void;
  hotspots(): { id: string; action(): void }[];
};

// LEGAL: The player asked to go into the properties they own and collect the rent there. Rent from a
// LEGAL: building you collect yourself fills its rent book; you walk in and empty it.
test('rent fills the book at your property and you collect it in person', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.locator('.tab-btn[data-tab="map"]').click();
  await page.waitForFunction(() => !!(window as unknown as { __seat?: unknown }).__seat, undefined, { timeout: 45_000 });
  await page.evaluate(() => {
    const s = (window as unknown as { __seat: Seat }).__seat;
    s.state.nextEventAt = 1e12;
    s.state.ownedProperties = ['twoflat']; s.state.propertyOwnedAt = { twoflat:s.state.playSeconds }; s.state.managedProperties = [];
  });
  await expect.poll(() => page.evaluate(() => (window as unknown as { __seat: Seat }).__seat.state.rentPots.twoflat ?? 0), { timeout: 10_000 }).toBeGreaterThan(5);
  const before = await page.evaluate(() => {
    const s = (window as unknown as { __seat: Seat }).__seat;
    s.enterBuilding('property', 'twoflat', 'Rockwell Two-Flat');
    return s.state.cash;
  });
  await page.evaluate(() => (window as unknown as { __seat: Seat }).__seat.hotspots().find(h => h.id === 'rentbook')!.action());
  await page.locator('#modal-footer button', { hasText: 'Collect' }).click();
  const after = await page.evaluate(() => ({ cash:(window as unknown as { __seat: Seat }).__seat.state.cash, pot:(window as unknown as { __seat: Seat }).__seat.state.rentPots.twoflat }));
  expect(after.cash).toBeGreaterThan(before + 5);
  // LEGAL: Emptied, give or take the second or so of rent since.
  expect(after.pot).toBeLessThan(6);
});
