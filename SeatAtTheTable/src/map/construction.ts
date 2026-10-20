import type * as ThreeNamespace from 'three';
import type { MapSceneMaterialCache } from './scenePerformance';
import { addPlaceModel, placeModel } from './placeModels';
import { storeys } from './scale';

// LEGAL: How many storeys of frame a site has got to.
export function frameFloors(seed: number): number { return 2 + (seed % 3); }

// LEGAL: A building site on an empty plot: a hoarding round a dirt lot with a gate on the street
// LEGAL: side, a steel frame going up on its concrete slabs, and the clutter of a site (spoil
// LEGAL: heap, rebar, site cabin, portable toilet); its crane is buildTowerCrane. Centred on the
// LEGAL: origin; the caller places it. `seed` picks how far the frame has got.

export function buildConstructionSite(THREE: typeof ThreeNamespace, materials: MapSceneMaterialCache, w: number, d: number, seed: number): ThreeNamespace.Group {
  const site = new THREE.Group();
  const material = (color: string, roughness = 0.85) => materials.standard(`construction:${color}`, { color, roughness });
  const add = (geometry: ThreeNamespace.BufferGeometry, color: string, x: number, y: number, z: number, rotY = 0) => {
    const mesh = new THREE.Mesh(geometry, material(color));
    mesh.position.set(x, y, z);
    mesh.rotation.y = rotY;
    mesh.castShadow = true; mesh.receiveShadow = true;
    site.add(mesh);
    return mesh;
  };

  const ground = add(new THREE.PlaneGeometry(w, d), '#6b5a44', 0, 0.1, 0);
  ground.rotation.x = -Math.PI / 2;
  ground.castShadow = false;

  // LEGAL: Plywood hoarding round the edge, painted in the developer's colours, with a gate gap.
  const hoarding = 14, gate = Math.min(36, w * 0.3);
  const panel = (x: number, z: number, len: number, alongX: boolean, color: string) => add(new THREE.BoxGeometry(alongX ? len : 1.6, hoarding, alongX ? 1.6 : len), color, x, hoarding / 2, z);
  panel(0, -d / 2, w, true, '#2f5d8a');
  panel(-w / 2, 0, d, false, '#2f5d8a');
  panel(w / 2, 0, d, false, '#2f5d8a');
  const side = (w - gate) / 2;
  panel(-w / 2 + side / 2, d / 2, side, true, '#2f5d8a');
  panel(w / 2 - side / 2, d / 2, side, true, '#2f5d8a');
  panel(0, d / 2 - 0.6, Math.min(w * 0.6, 60), true, '#f0efe8').scale.y = 0.35;

  // LEGAL: The frame: concrete slabs with steel columns, more storeys done on some sites than others.
  const frameW = w * 0.5, frameD = d * 0.5, floorH = storeys(12);
  const floors = frameFloors(seed);
  const fx = -w * 0.12, fz = -d * 0.1;
  for(let level = 0; level <= floors; level++){
    const slab = add(new THREE.BoxGeometry(frameW, 2, frameD), '#a7a59e', fx, level * floorH + 1, fz);
    // LEGAL: The top floor's slab isn't poured yet: just its edge beams.
    if(level === floors){ slab.scale.set(1, 0.6, 0.12); slab.position.z = fz - frameD / 2; }
  }
  for(let cx = -1; cx <= 1; cx++) for(let cz = -1; cz <= 1; cz += 2){
    add(new THREE.BoxGeometry(2, floors * floorH, 2), '#b5562a', fx + cx * frameW * 0.46, floors * floorH / 2, fz + cz * frameD * 0.46);
  }

  // LEGAL: Site clutter, kept to the front corner by the gate.
  const heap = add(new THREE.ConeGeometry(12, 9, 8), '#5a4632', -w * 0.32, 4.5, d * 0.28);
  heap.castShadow = false;
  for(let i = 0; i < 5; i++) add(new THREE.BoxGeometry(24, 0.8, 0.8), '#7a3b22', w * 0.08, 1 + i * 0.9, d * 0.32 + (i % 2) * 1.2);
  // LEGAL: The site cabin and the portable toilet are Blender models (art/blender/places.py) once loaded.
  const placed = (name: 'site-cabin' | 'site-toilet', x: number, z: number) => {
    const model = placeModel(name);
    if(!model) return false;
    const g = new THREE.Group();
    addPlaceModel(THREE, g, model, materials, `construction:${name}`);
    g.position.set(x, 0, z);
    site.add(g);
    return true;
  };
  if(!placed('site-cabin', w * 0.3, -d * 0.33)) add(new THREE.BoxGeometry(20, 10, 9), '#d8d2c0', w * 0.3, 5, -d * 0.33);
  if(!placed('site-toilet', w * 0.4, d * 0.36)) add(new THREE.BoxGeometry(5, 10, 5), '#2f6bb0', w * 0.4, 5, d * 0.36);
  return site;
}

// LEGAL: The tower crane that stands on a site. Kept as its own object because its jib swings out
// LEGAL: over the street, high above it, where a building's footprint never may.
export function buildTowerCrane(THREE: typeof ThreeNamespace, materials: MapSceneMaterialCache, w: number, d: number, seed: number): ThreeNamespace.Group {
  const crane = new THREE.Group();
  const material = (color: string) => materials.standard(`construction:${color}`, { color, roughness:0.85 });
  const add = (parent: ThreeNamespace.Object3D, geometry: ThreeNamespace.BufferGeometry, color: string, x: number, y: number, z: number) => {
    const mesh = new THREE.Mesh(geometry, material(color));
    mesh.position.set(x, y, z); mesh.castShadow = true;
    parent.add(mesh);
  };
  const mastH = frameFloors(seed) * storeys(12) + storeys(28);
  const mx = w * 0.3, mz = d * 0.22;
  const jibLength = Math.max(w, d) * 0.95;
  const mastBay = placeModel('crane-mast'), jibBay = placeModel('crane-jib'), head = placeModel('crane-head');
  if(mastBay && jibBay && head) return buildModelledCrane(THREE, materials, { mastBay, jibBay, head }, { mastH, jibLength, x:mx, z:mz, turn:(seed % 7) * 0.6 });
  add(crane, new THREE.BoxGeometry(5, mastH, 5), '#e8b923', mx, mastH / 2, mz);
  for(let y = 10; y < mastH; y += 14) add(crane, new THREE.BoxGeometry(6, 1, 6), '#c99a1a', mx, y, mz);
  // LEGAL: The long jib out one way, the short counter-jib with its concrete weights the other,
  // LEGAL: the operator's cab between, and a load of steel on the hook.
  const jib = new THREE.Group();
  jib.position.set(mx, mastH, mz);
  jib.rotation.y = (seed % 7) * 0.6;
  crane.add(jib);
  add(jib, new THREE.BoxGeometry(jibLength, 4, 4), '#e8b923', -jibLength / 2 + 6, 2, 0);
  add(jib, new THREE.BoxGeometry(30, 4, 4), '#e8b923', 15, 2, 0);
  add(jib, new THREE.BoxGeometry(10, 8, 7), '#4a4f58', 26, -4, 0);
  add(jib, new THREE.BoxGeometry(7, 7, 6), '#e8b923', 0, -4, 0);
  add(jib, new THREE.BoxGeometry(3, 10, 3), '#c99a1a', 0, 9, 0);
  const hookX = -jibLength * 0.6, drop = mastH * 0.45;
  add(jib, new THREE.BoxGeometry(0.5, drop, 0.5), '#2a2a2a', hookX, -drop / 2, 0);
  add(jib, new THREE.BoxGeometry(16, 3, 4), '#b5562a', hookX, -drop - 1.5, 0);
  return crane;
}

// LEGAL: The crane from its Blender pieces: mast bays stacked to the site's height, the head on top,
// LEGAL: and jib bays strung out from the head to the site's reach, each stretched a little so a
// LEGAL: whole number of them fits. Merged with the rest of the site's scenery, so the bays are free.
type CranePieces = Record<'mastBay' | 'jibBay' | 'head', NonNullable<ReturnType<typeof placeModel>>>;
function buildModelledCrane(THREE: typeof ThreeNamespace, materials: MapSceneMaterialCache, pieces: CranePieces, size: { mastH: number; jibLength: number; x: number; z: number; turn: number }): ThreeNamespace.Group {
  const crane = new THREE.Group();
  const piece = (parent: ThreeNamespace.Object3D, model: CranePieces['head']) => {
    const g = new THREE.Group();
    addPlaceModel(THREE, g, model, materials, 'construction:crane');
    parent.add(g);
    return g;
  };
  // LEGAL: A mast bay is 14 tall and a jib bay 10 long; the head's jib root reaches out to x = -2.
  const mastBays = Math.max(1, Math.round(size.mastH / 14)), mastStretch = size.mastH / (mastBays * 14);
  for(let i = 0; i < mastBays; i++){
    const bay = piece(crane, pieces.mastBay);
    bay.position.set(size.x, i * 14 * mastStretch, size.z);
    bay.scale.y = mastStretch;
  }
  const jib = new THREE.Group();
  jib.position.set(size.x, size.mastH, size.z);
  jib.rotation.y = size.turn;
  crane.add(jib);
  piece(jib, pieces.head);
  const reach = Math.max(10, size.jibLength - 8), jibBays = Math.max(1, Math.round(reach / 10)), jibStretch = reach / (jibBays * 10);
  for(let i = 0; i < jibBays; i++){
    const bay = piece(jib, pieces.jibBay);
    bay.position.set(-2 - i * 10 * jibStretch, 4, 0);
    bay.scale.x = jibStretch;
  }
  // LEGAL: The hook on its cable from the trolley, and a load of steel on it.
  const hookX = -size.jibLength * 0.6, drop = size.mastH * 0.45;
  const material = (color: string) => materials.standard(`construction:${color}`, { color, roughness:0.85 });
  const cable = new THREE.Mesh(new THREE.BoxGeometry(0.5, drop, 0.5), material('#2a2a2a'));
  cable.position.set(hookX, 4 - drop / 2, 0);
  const load = new THREE.Mesh(new THREE.BoxGeometry(16, 3, 4), material('#b5562a'));
  load.position.set(hookX, 4 - drop - 1.5, 0);
  [cable, load].forEach(function(mesh){ mesh.castShadow = true; jib.add(mesh); });
  return crane;
}
