import { test, expect, type Page } from '@playwright/test';

// LEGAL: ---- Scene audit ----
// LEGAL: The unit suite checks placement DATA. That is why a world which passed 175 tests
// LEGAL: still drew buildings on top of roads: the data was self-consistent, it had simply
// LEGAL: stopped agreeing with the scene. This audits what the renderer ACTUALLY produced,
// LEGAL: by walking the live three.js scene through the dev-only window.__seat hook and
// LEGAL: measuring with three's own Box3.setFromObject rather than re-deriving geometry.

async function waitForScene(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.locator('.tab-btn[data-tab="map"]').click();
  await expect(page.locator('#scene3d-container canvas.webgl-canvas')).toBeVisible({ timeout: 45000 });
  await page.waitForFunction(() => !!(window as never as { __seat?: unknown }).__seat, undefined, { timeout: 45000 });
  await page.waitForTimeout(2500);
}

interface AuditBox {
  name: string;
  minX: number; maxX: number;
  minY: number; maxY: number;
  minZ: number; maxZ: number;
}

// LEGAL: Every world mesh with a real footprint, measured with three's Box3.
async function worldBoxes(page: Page): Promise<AuditBox[]> {
  return page.evaluate(() => {
    const seat = (window as never as { __seat: { THREE: typeof import('three'); worldGroup: import('three').Group } }).__seat;
    const boxes: AuditBox[] = [];
    const box = new seat.THREE.Box3();
    seat.worldGroup.children.forEach(function(child){
      box.setFromObject(child);
      if(!isFinite(box.min.x) || !isFinite(box.max.x)) return;
      const w = box.max.x - box.min.x;
      const d = box.max.z - box.min.z;
      const h = box.max.y - box.min.y;
      // LEGAL: Ignore ground planes, water and decorative lines — only solid massing.
      if(h < 8) return;
      if(w > 900 || d > 900) return;
      boxes.push({
        name: child.name || child.type,
        minX: box.min.x, maxX: box.max.x,
        minY: box.min.y, maxY: box.max.y,
        minZ: box.min.z, maxZ: box.max.z,
      });
    });
    return boxes;
  }) as Promise<AuditBox[]>;
}

test.describe('scene audit — what the renderer actually drew', () => {
  test('no solid building sits on a road', async ({ page }) => {
    test.setTimeout(120000);
    await waitForScene(page);

    const offenders = await page.evaluate(() => {
      const seat = (window as never as {
        __seat: { THREE: typeof import('three'); worldGroup: import('three').Group; roadNetwork: { vertical: { x: number; w: number; name: string }[]; horizontal: { y: number; w: number; name: string }[] } };
      }).__seat;
      const bad: string[] = [];
      const box = new seat.THREE.Box3();
      seat.worldGroup.children.forEach(function(child){
        box.setFromObject(child);
        if(!isFinite(box.min.x)) return;
        const h = box.max.y - box.min.y;
        const w = box.max.x - box.min.x;
        const d = box.max.z - box.min.z;
        if(h < 8 || w > 900 || d > 900) return;
        // LEGAL: Some things are SUPPOSED to cross a road: bridges, the train, traffic
        // LEGAL: lights and other intersection furniture, and street trees on the verge.
        // LEGAL: They are tagged so the audit can tell them from a building in the way.
        if(/bridge|train|rail|furniture|tree|light|sign/i.test(child.name)) return;
        seat.roadNetwork.vertical.forEach(function(road){
          if(box.min.x < road.x && box.max.x > road.x) bad.push(`${child.name || child.type} straddles ${road.name}`);
        });
        seat.roadNetwork.horizontal.forEach(function(road){
          if(box.min.z < road.y && box.max.z > road.y) bad.push(`${child.name || child.type} straddles ${road.name}`);
        });
      });
      return bad.slice(0, 24);
    });

    expect(offenders, `buildings standing in the road:\n${offenders.join('\n')}`).toEqual([]);
  });

  test('nothing floats above the ground', async ({ page }) => {
    test.setTimeout(120000);
    await waitForScene(page);
    const boxes = await worldBoxes(page);

    expect(boxes.length, 'no massing found — the audit is measuring nothing').toBeGreaterThan(50);

    // LEGAL: A solid whose lowest point sits well above the ground plane is floating. Roof
    // LEGAL: plant and signage hang off their parent so they are measured with it, not
    // LEGAL: separately, which is why the whole child is measured rather than each mesh.
    const floating = boxes.filter(b => b.minY > 12).map(b => `${b.name} floats at y=${Math.round(b.minY)}`);
    expect(floating.slice(0, 24), `floating geometry:\n${floating.slice(0, 24).join('\n')}`).toEqual([]);
  });

  test('nothing is buried under the ground', async ({ page }) => {
    test.setTimeout(120000);
    await waitForScene(page);
    const boxes = await worldBoxes(page);

    const sunken = boxes.filter(b => b.maxY < 1).map(b => `${b.name} is below ground`);
    expect(sunken.slice(0, 24), `buried geometry:\n${sunken.slice(0, 24).join('\n')}`).toEqual([]);
  });
});
