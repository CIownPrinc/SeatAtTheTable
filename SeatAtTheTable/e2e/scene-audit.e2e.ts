import { test, expect, type Page } from '@playwright/test';

// LEGAL: ---- Scene audit ----
// LEGAL: The unit suite checks placement DATA. That is why a world which passed 175 tests
// LEGAL: still drew buildings on top of roads: the data was self-consistent, it had simply
// LEGAL: stopped agreeing with the scene. This audits what the renderer ACTUALLY produced,
// LEGAL: by walking the live three.js scene through the dev-only window.__seat hook and
// LEGAL: measuring with three's own Box3.setFromObject rather than re-deriving geometry.
// LEGAL:
// LEGAL: Every world object is named at the point it is added (see tagWorld in header.ts),
// LEGAL: so a failure names the offender instead of reporting "Mesh".

// LEGAL: Buildings — the things that must stand on a lot, never in a carriageway and never
// LEGAL: in mid-air. Anything outside this list is scenery, infrastructure or a road user
// LEGAL: (traffic, pedestrians, the El, bridges, street trees) and is audited differently.
// LEGAL: A whitelist rather than a list of exceptions: new scenery cannot silently opt itself
// LEGAL: into the audit and new BUILDINGS cannot silently opt themselves out.
const BUILDING_PREFIXES = ['filler:', 'venture:', 'service:', 'property:', 'local:', 'amenity:', 'landmark:'];

// LEGAL: Objects that stand on the ground but are not buildings. Audited for floating only.
const GROUNDED_PREFIXES = [...BUILDING_PREFIXES, 'corner:'];

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

// LEGAL: Measures every named world object, filtered to the given name prefixes. Groups are
// LEGAL: measured whole, so a dome counts as part of the hall it sits on rather than as a
// LEGAL: block hanging in the air.
// LEGAL:
// LEGAL: SOLID MESHES ONLY. Box3.setFromObject expands a Sprite by its scale on every axis,
// LEGAL: so measuring an object whole made a food cart's name label give it a 4000-unit
// LEGAL: footprint and a 2300-unit height — and the audit duly reported the cart as standing
// LEGAL: in four roads on opposite sides of the city. Signage and guide lines are not
// LEGAL: masonry; only Mesh geometry defines where a building physically is.
async function worldBoxes(page: Page, prefixes: string[]): Promise<AuditBox[]> {
  return page.evaluate((wanted: string[]) => {
    const seat = (window as never as { __seat: { THREE: typeof import('three'); worldGroup: import('three').Group } }).__seat;
    const boxes: AuditBox[] = [];
    seat.worldGroup.children.forEach(function(child){
      if(!wanted.some(prefix => child.name.startsWith(prefix))) return;
      child.updateWorldMatrix(true, true);
      const box = new seat.THREE.Box3();
      child.traverse(function(node){
        const mesh = node as import('three').Mesh;
        if(!(mesh as { isMesh?: boolean }).isMesh || !mesh.geometry) return;
        if(!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
        const local = mesh.geometry.boundingBox;
        if(!local) return;
        box.union(local.clone().applyMatrix4(mesh.matrixWorld));
      });
      if(box.isEmpty() || !isFinite(box.min.x) || !isFinite(box.max.x)) return;
      boxes.push({
        name: child.name,
        minX: box.min.x, maxX: box.max.x,
        minY: box.min.y, maxY: box.max.y,
        minZ: box.min.z, maxZ: box.max.z,
      });
    });
    return boxes;
  }, prefixes) as Promise<AuditBox[]>;
}

test.describe('scene audit — what the renderer actually drew', () => {
  test('no building stands in a road', async ({ page }) => {
    test.setTimeout(120000);
    await waitForScene(page);

    const roads = await page.evaluate(() => {
      const seat = (window as never as {
        __seat: { roadNetwork: { vertical: { x: number; w: number; name: string }[]; horizontal: { y: number; w: number; name: string }[] } };
      }).__seat;
      return { vertical: seat.roadNetwork.vertical, horizontal: seat.roadNetwork.horizontal };
    });
    const boxes = await worldBoxes(page, BUILDING_PREFIXES);
    expect(boxes.length, 'no buildings found — the audit is measuring nothing').toBeGreaterThan(50);

    // LEGAL: Straddling the centre line means the building is standing in the carriageway,
    // LEGAL: not merely overhanging the kerb.
    const offenders: string[] = [];
    boxes.forEach(function(b){
      roads.vertical.forEach(function(road){
        if(b.minX < road.x && b.maxX > road.x) offenders.push(`${b.name} stands in ${road.name}`);
      });
      roads.horizontal.forEach(function(road){
        if(b.minZ < road.y && b.maxZ > road.y) offenders.push(`${b.name} stands in ${road.name}`);
      });
    });

    expect(offenders.slice(0, 24), `buildings standing in the road:\n${offenders.slice(0, 24).join('\n')}`).toEqual([]);
  });

  test('nothing floats above the ground', async ({ page }) => {
    test.setTimeout(120000);
    await waitForScene(page);
    const boxes = await worldBoxes(page, GROUNDED_PREFIXES);
    expect(boxes.length, 'nothing found — the audit is measuring nothing').toBeGreaterThan(50);

    // LEGAL: A solid whose LOWEST point sits well above the ground plane is floating. Roof
    // LEGAL: plant, signage and lamp orbs hang off their parent so they are measured with it.
    const floating = boxes.filter(b => b.minY > 12).map(b => `${b.name} floats at y=${Math.round(b.minY)}`);
    expect(floating.slice(0, 24), `floating geometry:\n${floating.slice(0, 24).join('\n')}`).toEqual([]);
  });

  test('nothing is buried under the ground', async ({ page }) => {
    test.setTimeout(120000);
    await waitForScene(page);
    const boxes = await worldBoxes(page, GROUNDED_PREFIXES);

    const sunken = boxes.filter(b => b.maxY < 1).map(b => `${b.name} is below ground`);
    expect(sunken.slice(0, 24), `buried geometry:\n${sunken.slice(0, 24).join('\n')}`).toEqual([]);
  });
});
