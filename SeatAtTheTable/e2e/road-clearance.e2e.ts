import { test, expect } from '@playwright/test';

// LEGAL: ---- Road clearance audit ----
// LEGAL: Everything that drives or walks does so at ground height, so a road's carriageway must be
// LEGAL: clear from just above the tarmac to head height. This caught nothing until it was written;
// LEGAL: before it, the railway's raised rails and sleepers ran four units proud across every road it
// LEGAL: met, and canal bridges had decks four units up that people walked inside. It samples the
// LEGAL: middle and both lanes of every road the map draws, casting down through the live scene, and
// LEGAL: fails on any solid surface between CLEAR_FROM and CLEAR_TO. Road users (traffic, people, the
// LEGAL: train) and things drawn on the road (markings, crossings, flush rails) are not obstacles.
const CLEAR_FROM = 1.2;
const CLEAR_TO = 14;
const STEP = 16;

test('every road is clear from the tarmac to head height', async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto('/');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.locator('.tab-btn[data-tab="map"]').click();
  await page.waitForFunction(() => !!(window as never as { __seat?: unknown }).__seat, undefined, { timeout: 45_000 });
  await page.waitForTimeout(2500);
  const problems = await page.evaluate(async ({ from, to, step }) => {
    const seat = (window as never as { __seat: { THREE: typeof import('three'); worldGroup: import('three').Group } }).__seat;
    const { THREE, worldGroup } = seat;
    const { roadLandSegments } = await import('/src/map/mapModel.ts');
    const IGNORE = /^(actor:|vehicle|dealer|train|player|waypoint|mission)/;
    worldGroup.updateMatrixWorld(true);
    // LEGAL: Every solid mesh with its world box, so each ray only tests the meshes over its point.
    const candidates: Array<{ mesh: import('three').Mesh; box: import('three').Box3; owner: string }> = [];
    worldGroup.children.forEach(function(child){
      if(IGNORE.test(child.name)) return;
      child.traverse(function(node){
        const mesh = node as import('three').Mesh;
        if(!mesh.isMesh || (node as { isSprite?: boolean }).isSprite) return;
        const box = new THREE.Box3().setFromObject(mesh);
        if(box.max.y < from || box.min.y > to) return;
        candidates.push({ mesh, box, owner:child.name || '(unnamed)' });
      });
    });
    const ray = new THREE.Raycaster();
    const down = new THREE.Vector3(0, -1, 0);
    const found = new Map<string, { at: string; height: number; road: string }>();
    for(const segment of roadLandSegments()){
      const path = segment.path;
      for(let i = 0; i < path.length - 1; i++){
        const a = path[i], b = path[i + 1];
        const len = Math.hypot(b.x - a.x, b.y - a.y);
        if(len < 1) continue;
        const ux = (b.x - a.x) / len, uy = (b.y - a.y) / len;
        for(let d = 0; d <= len; d += step){
          // LEGAL: Five lines across the carriageway, out to near each kerb.
          for(const lane of [-0.44, -0.22, 0, 0.22, 0.44].map(f => f * segment.road.width)){
            const x = a.x + ux * d - uy * lane, z = a.y + uy * d + ux * lane;
            const origin = new THREE.Vector3(x, to + 1, z);
            const over = candidates.filter(c => x >= c.box.min.x && x <= c.box.max.x && z >= c.box.min.z && z <= c.box.max.z);
            if(!over.length) continue;
            ray.set(origin, down); ray.far = to + 1 - from;
            for(const c of over){
              const hit = ray.intersectObject(c.mesh, false)[0];
              const key = `${c.owner}|${segment.road.name}`;
              if(hit && hit.point.y > from && hit.point.y < to && !found.has(key)) found.set(key, { at:`${Math.round(x)},${Math.round(z)}`, height:Math.round(hit.point.y * 10) / 10, road:segment.road.name });
            }
          }
        }
      }
    }
    return [...found.entries()].map(([key, f]) => `${key.split('|')[0]} stands ${f.height} high in ${f.road} at ${f.at}`);
  }, { from:CLEAR_FROM, to:CLEAR_TO, step:STEP });
  expect(problems, problems.join('\n')).toEqual([]);
});
