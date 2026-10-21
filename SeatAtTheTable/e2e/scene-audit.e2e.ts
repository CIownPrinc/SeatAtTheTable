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
        // LEGAL: An InstancedMesh's GEOMETRY box is one instance sitting at the origin, so
        // LEGAL: measuring it that way reported every road marking in the city as a single
        // LEGAL: object at (0,0). three knows how to account for the instance matrices.
        const instanced = mesh as import('three').InstancedMesh;
        if((instanced as { isInstancedMesh?: boolean }).isInstancedMesh){
          instanced.computeBoundingBox();
          if(instanced.boundingBox) box.union(instanced.boundingBox.clone().applyMatrix4(instanced.matrixWorld));
          return;
        }
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
  // LEGAL: The world audit (src/map/sceneAudit.ts) on the live scene: buildings in any road
  // LEGAL: (grid, diagonals, lanes, turning circles) and hairline strokes. Dev builds run the same
  // LEGAL: check at startup and mark each problem with a red beacon.
  // LEGAL: KNOWN_ISSUES is a ratchet: any new problem fails, and so does a known one that has been
  // LEGAL: fixed but is still listed. It's empty: the six buildings once in roads are all clear.
  const KNOWN_ISSUES: string[] = [];
  test('the world audit finds no new problems in what was drawn', async ({ page }) => {
    test.setTimeout(120000);
    await waitForScene(page);
    const found = await page.evaluate(() => (window as never as { __seat: { audit(): { message: string }[] } }).__seat.audit().map(issue => issue.message));
    const fresh = found.filter(message => !KNOWN_ISSUES.includes(message));
    const fixed = KNOWN_ISSUES.filter(message => !found.includes(message));
    expect(fresh, 'new world-audit problems').toEqual([]);
    expect(fixed, 'fixed, so remove from KNOWN_ISSUES').toEqual([]);
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

  // LEGAL: Pedestrians spawn on their map object's authored point. Nobody checked it was
  // LEGAL: standable, so one authored inside a building stood in the wall forever: every
  // LEGAL: candidate destination failed the walkability test, and being blocked sent it back
  // LEGAL: to the home point it was already trapped in.
  test('no pedestrian is standing inside a building', async ({ page }) => {
    test.setTimeout(120000);
    await waitForScene(page);

    const stuck = await page.evaluate(() => {
      const seat = (window as never as {
        __seat: {
          roamingActors: { id: string; kind: string; x: number; y: number }[];
          canWalk: (x: number, y: number) => boolean;
        };
      }).__seat;
      return seat.roamingActors
        .filter(actor => actor.kind !== 'car' && !seat.canWalk(actor.x, actor.y))
        .map(actor => `${actor.id} is stuck at (${Math.round(actor.x)}, ${Math.round(actor.y)})`);
    });

    expect(stuck.slice(0, 24), `pedestrians stuck in geometry:\n${stuck.slice(0, 24).join('\n')}`).toEqual([]);
  });

  // LEGAL: The places that are NOT buildings must not behave like them. A back alley you
  // LEGAL: bump into is still the map lying about what is there, even once it is drawn
  // LEGAL: correctly — so this checks the world lets you walk in, not just that the config
  // LEGAL: says it should.
  test('you can walk into the places that are not buildings', async ({ page }) => {
    test.setTimeout(120000);
    await waitForScene(page);

    const blocked = await page.evaluate(() => {
      const seat = (window as never as {
        __seat: {
          mapObjects: { id: string; x: number; y: number }[];
          canWalk: (x: number, y: number) => boolean;
        };
      }).__seat;
      const walkable = ['devlinAlley', 'railyard', 'docksDockmaster', 'backroom_cards', 'wire_network', 'cab'];
      return walkable
        .map(id => ({ id, place: seat.mapObjects.find(object => object.id === id) }))
        .filter(entry => entry.place && !seat.canWalk(entry.place.x, entry.place.y))
        .map(entry => `${entry.id} blocks you at its own centre`);
    });

    expect(blocked, `places that should be open ground but are not:\n${blocked.join('\n')}`).toEqual([]);
  });

  // LEGAL: Solid scenery standing in the lake or out in the ocean is the "random blocks
  // LEGAL: floating across the map" report. Nothing in the world's own name list is exempt by
  // LEGAL: default: the only things allowed over water are the ones that are SUPPOSED to be
  // LEGAL: there, and they say so in their name.
  test('no solid scenery stands in the water', async ({ page }) => {
    test.setTimeout(120000);
    await waitForScene(page);

    const offenders = await page.evaluate(() => {
      const seat = (window as never as {
        __seat: {
          THREE: typeof import('three');
          worldGroup: import('three').Group;
          isWater: (x: number, y: number) => boolean;
        };
      }).__seat;
      const bad: string[] = [];
      // LEGAL: Water, terrain, coastline dressing, bridges, the rail crossing and jetties all
      // LEGAL: legitimately sit on or over water.
      const allowed = /water|terrain|coast|foam|bridge|rail|pier|jetty|waypoint|train/i;
      seat.worldGroup.children.forEach(function(child){
        if(allowed.test(child.name)) return;
        child.updateWorldMatrix(true, true);
        const box = new seat.THREE.Box3();
        child.traverse(function(node){
          const m = node as import('three').Mesh;
          if(!(m as { isMesh?: boolean }).isMesh || !m.geometry) return;
          const inst = m as import('three').InstancedMesh;
          if((inst as { isInstancedMesh?: boolean }).isInstancedMesh){
            inst.computeBoundingBox();
            if(inst.boundingBox) box.union(inst.boundingBox.clone().applyMatrix4(inst.matrixWorld));
            return;
          }
          if(!m.geometry.boundingBox) m.geometry.computeBoundingBox();
          const local = m.geometry.boundingBox;
          if(!local) return;
          box.union(local.clone().applyMatrix4(m.matrixWorld));
        });
        if(box.isEmpty()) return;
        const h = box.max.y - box.min.y;
        const w = box.max.x - box.min.x;
        const d = box.max.z - box.min.z;
        // LEGAL: Ground planes and hairline dressing are not "blocks".
        if(h < 4) return;
        if(w > 1200 || d > 1200) return;
        const cx = (box.min.x + box.max.x) / 2;
        const cz = (box.min.z + box.max.z) / 2;
        if(seat.isWater(cx, cz)) bad.push(`${child.name || child.type} stands in water at (${Math.round(cx)}, ${Math.round(cz)})`);
      });
      return bad.slice(0, 24);
    });

    expect(offenders, 'solid scenery in the water:' + offenders.join('; ')).toEqual([]);
  });

  test('nothing is buried under the ground', async ({ page }) => {
    test.setTimeout(120000);
    await waitForScene(page);
    const boxes = await worldBoxes(page, GROUNDED_PREFIXES);

    const sunken = boxes.filter(b => b.maxY < 1).map(b => `${b.name} is below ground`);
    expect(sunken.slice(0, 24), `buried geometry:\n${sunken.slice(0, 24).join('\n')}`).toEqual([]);
  });
});

// LEGAL: The resort along the lake shore places nothing where its spot tests as water. When the
// LEGAL: coast was rounded, every spot did, and the beach lost all its palms and loungers without a
// LEGAL: single test noticing.
test('the beach resort has its palms and loungers', async ({ page }) => {
  await waitForScene(page);
  const counts = await page.evaluate(() => {
    const seat = (window as never as { __seat: { worldGroup: import('three').Group } }).__seat;
    const named = (name: string) => seat.worldGroup.children.filter(child => child.name === name).length;
    return { palms:named('resort:palm'), loungers:named('resort:loungers') };
  });
  expect(counts.palms).toBeGreaterThan(20);
  expect(counts.loungers).toBeGreaterThan(10);
});
