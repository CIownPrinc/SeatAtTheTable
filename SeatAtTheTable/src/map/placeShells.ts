import type * as ThreeNamespace from 'three';
import { archetypeForm, type PlaceArchetype } from './archetypes';

// LEGAL: ---- Shells for places that are NOT buildings ----
// LEGAL: Section 0a, rule 2. A cart is a stall, an alley is a gap between two blocks and a
// LEGAL: yard is open ground. Drawing any of them as a box with a sign on it is the map lying
// LEGAL: about what is there. These builders deliberately produce no building shell, and the
// LEGAL: matching archetype carries solidScale 0 so you can walk straight in rather than
// LEGAL: bumping into a box where a gap should be.
// LEGAL:
// LEGAL: Origin is at GROUND level for every shell here, unlike buildDetailedBuilding whose
// LEGAL: origin is the centre of its mass. Callers position these at y=0.

function mesh(
  THREE: typeof ThreeNamespace,
  geometry: ThreeNamespace.BufferGeometry,
  color: string,
  options: { roughness?: number; metalness?: number; transparent?: boolean; opacity?: number } = {},
): ThreeNamespace.Mesh {
  const material = new THREE.MeshStandardMaterial({ color, roughness:options.roughness ?? 0.85, metalness:options.metalness ?? 0.05, transparent:options.transparent, opacity:options.opacity });
  const created = new THREE.Mesh(geometry, material);
  created.castShadow = true;
  created.receiveShadow = true;
  return created;
}

function groundPlate(THREE: typeof ThreeNamespace, w: number, d: number, color: string): ThreeNamespace.Mesh {
  const plate = mesh(THREE, new THREE.PlaneGeometry(w, d), color, { roughness:1 });
  plate.rotation.x = -Math.PI/2;
  plate.position.y = 0.12;
  plate.castShadow = false;
  return plate;
}

// LEGAL: A food stall: counter, canopy on four posts, a couple of crates. Roughly chest
// LEGAL: height, so it reads as something you walk UP TO rather than into.
export function buildStallShell(THREE: typeof ThreeNamespace, w: number, d: number, h: number, color: string): ThreeNamespace.Group {
  const group = new THREE.Group();
  group.add(groundPlate(THREE, w + 14, d + 14, '#3a3a34'));

  const counter = mesh(THREE, new THREE.BoxGeometry(w, h * 0.62, d * 0.62), color, { roughness:0.7 });
  counter.position.set(0, h * 0.31, -d * 0.1);
  group.add(counter);

  // LEGAL: Striped canopy above the counter, tilted towards the customer side.
  const canopy = mesh(THREE, new THREE.BoxGeometry(w + 8, 2, d + 6), '#b4432f', { roughness:0.6 });
  canopy.position.set(0, h * 1.08, 0);
  canopy.rotation.x = -0.12;
  group.add(canopy);

  [[-w/2 + 2, -d/2 + 2], [w/2 - 2, -d/2 + 2], [-w/2 + 2, d/2 - 2], [w/2 - 2, d/2 - 2]].forEach(function(p){
    const post = mesh(THREE, new THREE.CylinderGeometry(1, 1, h * 1.08, 6), '#6a5a44', { roughness:0.8 });
    post.position.set(p[0], h * 0.54, p[1]);
    group.add(post);
  });

  const pot = mesh(THREE, new THREE.CylinderGeometry(3.4, 3.4, 3, 10), '#8d8f96', { roughness:0.4, metalness:0.5 });
  pot.position.set(-w * 0.24, h * 0.62 + 1.5, -d * 0.1);
  group.add(pot);

  [[w * 0.34, d * 0.3], [w * 0.42, d * 0.12]].forEach(function(p, index){
    const crate = mesh(THREE, new THREE.BoxGeometry(7, 6, 7), index === 0 ? '#7a6244' : '#6a5438', { roughness:0.9 });
    crate.position.set(p[0], 3, p[1]);
    group.add(crate);
  });

  return group;
}

// LEGAL: A gap between two blocks. The flanking walls sit at the very edges so the middle
// LEGAL: stays walkable — that is the whole point of an alley, and why it has no collision.
export function buildAlleyShell(THREE: typeof ThreeNamespace, w: number, d: number, h: number): ThreeNamespace.Group {
  const group = new THREE.Group();
  group.add(groundPlate(THREE, w, d, archetypeForm('alley').ground ?? '#2b2b30'));

  [-1, 1].forEach(function(side){
    const wall = mesh(THREE, new THREE.BoxGeometry(3, h, d), side < 0 ? '#4a423c' : '#443c39', { roughness:0.95 });
    wall.position.set(side * (w/2 - 1.5), h/2, 0);
    group.add(wall);

    // LEGAL: Fire escape — the clearest "this is the back of a building" read there is.
    for(let i = 0; i < 3; i += 1){
      const platform = mesh(THREE, new THREE.BoxGeometry(5, 1, d * 0.26), '#33383c', { roughness:0.6, metalness:0.4 });
      platform.position.set(side * (w/2 - 5), h * (0.34 + i * 0.2), (i % 2 === 0 ? -1 : 1) * d * 0.2);
      group.add(platform);
    }
  });

  // LEGAL: Bins and a pallet down one side, leaving the centre clear to walk.
  [[-w * 0.24, -d * 0.28, '#3f5a44'], [-w * 0.24, -d * 0.06, '#4a4a52'], [w * 0.22, d * 0.3, '#3f5a44']].forEach(function(bin){
    const box = mesh(THREE, new THREE.BoxGeometry(9, 10, 7), bin[2] as string, { roughness:0.8 });
    box.position.set(bin[0] as number, 5, bin[1] as number);
    group.add(box);
  });

  const pallet = mesh(THREE, new THREE.BoxGeometry(12, 2, 9), '#6a5438', { roughness:0.95 });
  pallet.position.set(w * 0.2, 1, -d * 0.3);
  group.add(pallet);

  // LEGAL: A single caged bulb, so the alley is legible at night.
  const lamp = mesh(THREE, new THREE.SphereGeometry(2.2, 8, 8), '#ffe6a0', { roughness:0.3 });
  lamp.position.set(-(w/2 - 5), h * 0.78, 0);
  group.add(lamp);

  return group;
}

// LEGAL: Open ground behind a fence with a site hut in the corner — a railyard or a
// LEGAL: dockmaster's yard. Not a building, and not blocked: you drive and walk into a yard.
export function buildLotShell(THREE: typeof ThreeNamespace, w: number, d: number, h: number): ThreeNamespace.Group {
  const group = new THREE.Group();
  group.add(groundPlate(THREE, w, d, archetypeForm('lot').ground ?? '#33343a'));

  // LEGAL: Chain-link posts around the perimeter, with the front edge left open as the gate.
  const postGeometry = new THREE.CylinderGeometry(0.9, 0.9, 14, 5);
  for(let x = -w/2; x <= w/2; x += w/6){
    [-d/2, d/2].forEach(function(z){
      // LEGAL: Gap in the middle of the front edge — the way in.
      if(z > 0 && Math.abs(x) < w * 0.18) return;
      const post = mesh(THREE, postGeometry, '#6f7378', { roughness:0.6, metalness:0.35 });
      post.position.set(x, 7, z);
      group.add(post);
    });
  }
  [-d/2 + d/5, 0, d/2 - d/5].forEach(function(z){
    [-w/2, w/2].forEach(function(x){
      const post = mesh(THREE, postGeometry, '#6f7378', { roughness:0.6, metalness:0.35 });
      post.position.set(x, 7, z);
      group.add(post);
    });
  });

  const hut = mesh(THREE, new THREE.BoxGeometry(w * 0.26, h, d * 0.26), '#5c5348', { roughness:0.85 });
  hut.position.set(-w * 0.3, h/2, -d * 0.28);
  group.add(hut);
  const hutRoof = mesh(THREE, new THREE.BoxGeometry(w * 0.3, 2, d * 0.3), '#3b3630', { roughness:0.8 });
  hutRoof.position.set(-w * 0.3, h + 1, -d * 0.28);
  group.add(hutRoof);

  // LEGAL: Stacked containers and pallets — cargo, not architecture.
  [['#5a4a3e', w * 0.22, -d * 0.2], ['#3f5a5e', w * 0.3, d * 0.08], ['#6a4340', w * 0.1, d * 0.28]].forEach(function(item, index){
    const container = mesh(THREE, new THREE.BoxGeometry(22, 11, 13), item[0] as string, { roughness:0.8 });
    container.position.set(item[1] as number, 5.5 + (index === 1 ? 11 : 0), item[2] as number);
    group.add(container);
  });

  return group;
}

// LEGAL: Single entry point so callers never have to know which builder goes with which
// LEGAL: archetype. Returns null for archetypes that DO have a building shell, so the caller
// LEGAL: falls through to the detailed-building renderer.
export function buildArchetypeShell(
  THREE: typeof ThreeNamespace,
  archetype: PlaceArchetype,
  w: number,
  d: number,
  h: number,
  color: string,
): ThreeNamespace.Group | null {
  const shell = archetypeForm(archetype).shell;
  if(shell === 'stall') return buildStallShell(THREE, w, d, h, color);
  if(shell === 'open') return archetype === 'alley' ? buildAlleyShell(THREE, w, d, h) : buildLotShell(THREE, w, d, h);
  return null;
}
