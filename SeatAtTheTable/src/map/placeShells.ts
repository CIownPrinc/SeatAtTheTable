import type * as ThreeNamespace from 'three';
import { ALLEY_FLANK_W, BAY_WALL, LOT_CARGO, LOT_CARGO_SIZE, LOT_HUT, archetypeForm, type PlaceArchetype } from './archetypes';

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

// LEGAL: An alley is the GAP BETWEEN TWO BUILDINGS. The first version drew thin walls at the
// LEGAL: edges of the gap, which read as a fenced strip standing on its own in the open —
// LEGAL: correct as a walkway, wrong as an alley, because there was nothing for it to be
// LEGAL: between. It now builds the two buildings that form it: full-height blocks either
// LEGAL: side, with windows on their outward faces and fire escapes on the inward ones, so
// LEGAL: the alley exists because they do. They are part of the alley object rather than
// LEGAL: separate places, so nothing can allocate a lot into the middle of them.
export function buildAlleyShell(THREE: typeof ThreeNamespace, w: number, d: number, h: number): ThreeNamespace.Group {
  const group = new THREE.Group();
  group.add(groundPlate(THREE, w, d, archetypeForm('alley').ground ?? '#2b2b30'));

  // LEGAL: Deep enough to read as a building from the street, not a screen wall.
  const flankW = ALLEY_FLANK_W;
  const flankOffset = w/2 + flankW/2 - 2;

  [-1, 1].forEach(function(side){
    const wallHeight = h * (side < 0 ? 1.55 : 1.25);
    const flank = mesh(THREE, new THREE.BoxGeometry(flankW, wallHeight, d), side < 0 ? '#4a423c' : '#443c39', { roughness:0.95 });
    flank.position.set(side * flankOffset, wallHeight/2, 0);
    group.add(flank);

    // LEGAL: Windows on the OUTWARD face only — an alley wall is a blind party wall, which
    // LEGAL: is exactly why the alley is dark.
    const glass = mesh(THREE, new THREE.PlaneGeometry(6, 7), '#20303c', { roughness:0.3 });
    for(let row = 0; row < Math.max(2, Math.floor(wallHeight / 22)); row += 1){
      for(let col = -1; col <= 1; col += 1){
        const pane = glass.clone();
        pane.position.set(side * (flankOffset + flankW/2 + 0.3), 16 + row * 20, col * d * 0.28);
        pane.rotation.y = side > 0 ? Math.PI/2 : -Math.PI/2;
        group.add(pane);
      }
    }

    // LEGAL: A parapet, so the roofline is not a bare cut.
    const cornice = mesh(THREE, new THREE.BoxGeometry(flankW + 2.5, 2.5, d + 2.5), '#38322e', { roughness:0.9 });
    cornice.position.set(side * flankOffset, wallHeight + 1, 0);
    group.add(cornice);

    // LEGAL: Fire escape — the clearest "this is the back of a building" read there is.
    // LEGAL: On the INWARD face, hanging over the alley.
    for(let i = 0; i < 3; i += 1){
      const platform = mesh(THREE, new THREE.BoxGeometry(6, 1, d * 0.26), '#33383c', { roughness:0.6, metalness:0.4 });
      platform.position.set(side * (w/2 - 3), h * (0.34 + i * 0.24), (i % 2 === 0 ? -1 : 1) * d * 0.2);
      group.add(platform);
      const rail = mesh(THREE, new THREE.BoxGeometry(0.6, 5, d * 0.26), '#33383c', { roughness:0.6, metalness:0.4 });
      rail.position.set(side * (w/2 - 6), h * (0.34 + i * 0.24) + 2.5, (i % 2 === 0 ? -1 : 1) * d * 0.2);
      group.add(rail);
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

  const hut = mesh(THREE, new THREE.BoxGeometry(w * LOT_HUT.w, h, d * LOT_HUT.d), '#5c5348', { roughness:0.85 });
  hut.position.set(w * LOT_HUT.x, h/2, d * LOT_HUT.z);
  group.add(hut);
  const hutRoof = mesh(THREE, new THREE.BoxGeometry(w * (LOT_HUT.w + 0.04), 2, d * (LOT_HUT.d + 0.04)), '#3b3630', { roughness:0.8 });
  hutRoof.position.set(w * LOT_HUT.x, h + 1, d * LOT_HUT.z);
  group.add(hutRoof);

  // LEGAL: Stacked containers and pallets — cargo, not architecture. Solid (archetypes LOT_CARGO).
  LOT_CARGO.forEach(function(item){
    const { w:cw, h:ch, d:cd } = LOT_CARGO_SIZE;
    const container = mesh(THREE, new THREE.BoxGeometry(cw, ch, cd), item.color, { roughness:0.8 });
    container.position.set(w * item.x, ch / 2 + (item.stacked ? ch : 0), d * item.z);
    group.add(container);
  });

  return group;
}

// LEGAL: A garage you drive into: three walls, a roof, and an open mouth on the +y face with
// LEGAL: the roller door sitting UP in its housing. The opening is not decoration — the
// LEGAL: matching solids (archetypeExtraSolids, 'bay') are the three walls only, so the car
// LEGAL: goes exactly where the picture says it can. Everything inside is pushed against a
// LEGAL: wall, because the middle of the floor is the parking space.
export function buildBayShell(THREE: typeof ThreeNamespace, w: number, d: number, h: number, color: string): ThreeNamespace.Group {
  const group = new THREE.Group();
  group.add(groundPlate(THREE, w, d, archetypeForm('bay').ground ?? '#3a3833'));

  // LEGAL: An apron of the same slab spilling out of the mouth, so the entrance reads as
  // LEGAL: somewhere to aim a car from the street rather than a hole in a wall.
  const apron = groundPlate(THREE, w - BAY_WALL * 2, 30, '#4c4a43');
  apron.position.z = d/2 + 15;
  group.add(apron);

  // LEGAL: Chevrons on the apron pointing IN. The bay is the only place on the map you enter
  // LEGAL: by driving rather than by pressing a key, so it has to say so without a tutorial.
  [0, 1, 2].forEach(function(i){
    const chevron = mesh(THREE, new THREE.BoxGeometry(w * 0.42, 0.4, 3), '#d8c37a', { roughness:1 });
    chevron.position.set(0, 0.4, d/2 + 26 - i * 9);
    group.add(chevron);
  });

  const sideGeometry = new THREE.BoxGeometry(BAY_WALL, h, d);
  [-1, 1].forEach(function(side){
    const wall = mesh(THREE, sideGeometry, color, { roughness:0.9 });
    wall.position.set(side * (w/2 - BAY_WALL/2), h/2, 0);
    group.add(wall);
  });

  const back = mesh(THREE, new THREE.BoxGeometry(w, h, BAY_WALL), color, { roughness:0.9 });
  back.position.set(0, h/2, -(d/2 - BAY_WALL/2));
  group.add(back);

  // LEGAL: NO ROOF. A garage has one, obviously — and drawing it is exactly wrong here. The
  // LEGAL: camera looks down from the south at a shallow angle, so a roof panel does not
  // LEGAL: merely cover the ceiling, it hangs in front of the floor behind it: the first
  // LEGAL: version was a featureless dark box in which you could not see the bay, the
  // LEGAL: markings, or whether your own car was in there. Roofing only the back half was
  // LEGAL: still enough to hide the lot. So the bay is drawn as a cutaway, which is what a
  // LEGAL: top-down game is: walls, a lintel over the door, and an open floor you can read at
  // LEGAL: a glance. The lintel and the cornice carry the "there is a building here" read
  // LEGAL: that the missing roof would otherwise have carried.
  const lintel = mesh(THREE, new THREE.BoxGeometry(w + 4, 7, 6), '#5c4f42', { roughness:0.85 });
  lintel.position.set(0, h - 1.5, d/2 - 3);
  group.add(lintel);

  const cornice = mesh(THREE, new THREE.BoxGeometry(w + 4, 3, BAY_WALL + 4), '#5c4f42', { roughness:0.85 });
  cornice.position.set(0, h + 1.5, -(d/2 - BAY_WALL/2));
  group.add(cornice);

  [-1, 1].forEach(function(side){
    const capping = mesh(THREE, new THREE.BoxGeometry(BAY_WALL + 3, 3, d), '#5c4f42', { roughness:0.85 });
    capping.position.set(side * (w/2 - BAY_WALL/2), h + 1.5, 0);
    group.add(capping);
  });

  // LEGAL: The roller door, rolled up: a slatted drum tucked under the lintel. Drawn open
  // LEGAL: because it IS open — a shut door you can drive through would be the same lie the
  // LEGAL: back alley was telling.
  const drum = mesh(THREE, new THREE.CylinderGeometry(4, 4, w - BAY_WALL * 2, 10), '#8a8f96', { roughness:0.5, metalness:0.5 });
  drum.rotation.z = Math.PI/2;
  drum.position.set(0, h - 5, d/2 - 4);
  group.add(drum);

  // LEGAL: Painted bay markings on the floor, which is what tells you where to stop.
  [-1, 1].forEach(function(side){
    const stripe = mesh(THREE, new THREE.PlaneGeometry(2, d - BAY_WALL - 14), '#c8b46a', { roughness:1 });
    stripe.rotation.x = -Math.PI/2;
    stripe.position.set(side * (w/2 - BAY_WALL - 12), 0.3, 4);
    stripe.castShadow = false;
    group.add(stripe);
  });

  // LEGAL: Workbench along the back wall, tool board above it, tyres stacked in a corner.
  const bench = mesh(THREE, new THREE.BoxGeometry(w - BAY_WALL * 2 - 20, 9, 9), '#5c5348', { roughness:0.85 });
  bench.position.set(0, 4.5, -(d/2 - BAY_WALL - 5));
  group.add(bench);

  const board = mesh(THREE, new THREE.PlaneGeometry(w - BAY_WALL * 2 - 24, 12), '#2f3a3f', { roughness:0.8 });
  board.position.set(0, 20, -(d/2 - BAY_WALL - 0.5));
  group.add(board);

  for(let i = 0; i < 3; i += 1){
    const tyre = mesh(THREE, new THREE.TorusGeometry(4.4, 1.8, 6, 12), '#26282c', { roughness:0.95 });
    tyre.rotation.x = -Math.PI/2;
    tyre.position.set(-(w/2 - BAY_WALL - 7), 2 + i * 3.6, -(d/2 - BAY_WALL - 16));
    group.add(tyre);
  }

  // LEGAL: A strip light under the roof, so the bay is legible from the street at night.
  const strip = mesh(THREE, new THREE.BoxGeometry(4, 1.4, d - BAY_WALL - 10), '#fff2cc', { roughness:0.3 });
  strip.position.set(0, h - 2.5, -2);
  group.add(strip);

  return group;
}

// LEGAL: Single entry point so callers never have to know which builder goes with which
// LEGAL: archetype. Returns null for archetypes that DO have a building shell, so the caller
// LEGAL: falls through to the detailed-building renderer.
// LEGAL: A paved forecourt: stone paving with a darker border, planters with trees, and lamps.
export function buildPlazaShell(THREE: typeof ThreeNamespace, w: number, d: number): ThreeNamespace.Group {
  const group = new THREE.Group();
  group.add(groundPlate(THREE, w, d, archetypeForm('plaza').ground ?? '#b5ad9c'));
  const border = groundPlate(THREE, w - 12, d - 12, '#c9c1ae');
  border.position.y = 0.16;
  group.add(border);
  [-1, 1].forEach(function(side){
    const planter = mesh(THREE, new THREE.BoxGeometry(22, 6, 22), '#8a7a62', { roughness:0.9 });
    planter.position.set(side * w * 0.36, 3, 0);
    const tree = mesh(THREE, new THREE.SphereGeometry(12, 10, 8), '#3c7a44', { roughness:0.95 });
    tree.position.set(side * w * 0.36, 20, 0);
    const lamp = mesh(THREE, new THREE.CylinderGeometry(1, 1, 30, 6), '#3a3d44', { roughness:0.6, metalness:0.4 });
    lamp.position.set(side * w * 0.18, 15, d * 0.3);
    const bulb = mesh(THREE, new THREE.SphereGeometry(3, 8, 8), '#ffe6a0', { roughness:0.3 });
    bulb.position.set(side * w * 0.18, 31, d * 0.3);
    group.add(planter, tree, lamp, bulb);
  });
  return group;
}

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
  if(shell === 'bay') return buildBayShell(THREE, w, d, h, color);
  if(shell === 'open'){
    if(archetype === 'alley') return buildAlleyShell(THREE, w, d, h);
    return archetype === 'plaza' ? buildPlazaShell(THREE, w, d) : buildLotShell(THREE, w, d, h);
  }
  return null;
}
