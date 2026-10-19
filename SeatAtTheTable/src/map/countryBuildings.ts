import type * as ThreeNamespace from 'three';
import type { OutskirtSceneryKind } from './outskirtScenery';
import type { MapSceneMaterialCache } from './scenePerformance';
import { buildHouseModel } from './suburb';

// LEGAL: The countryside's buildings, each built to look like what it is. They were a box with a
// LEGAL: pyramid on top, whatever they were. Each is centred on the origin at ground level; the
// LEGAL: caller places and turns it. Roofs carry keys ending ':roof' so settling snow finds them.
type Builder = (THREE: typeof ThreeNamespace, materials: MapSceneMaterialCache, variant: number) => ThreeNamespace.Group;

function parts(THREE: typeof ThreeNamespace, materials: MapSceneMaterialCache, g: ThreeNamespace.Group) {
  return function(geometry: ThreeNamespace.BufferGeometry, color: string, x: number, y: number, z: number, key?: string): ThreeNamespace.Mesh {
    const mesh = new THREE.Mesh(geometry, materials.standard(key ?? `country:${color}`, { color, roughness:0.85 }));
    mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true;
    g.add(mesh);
    return mesh;
  };
}

// LEGAL: A roof prism along x: `profile` is its cross-section (y up), extruded `length` long.
function roofPrism(THREE: typeof ThreeNamespace, profile: Array<[number, number]>, length: number): ThreeNamespace.BufferGeometry {
  const shape = new THREE.Shape();
  profile.forEach(([z, y], i) => (i ? shape.lineTo(z, y) : shape.moveTo(z, y)));
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth:length, bevelEnabled:false });
  geometry.rotateY(Math.PI / 2);
  geometry.translate(-length / 2, 0, 0);
  return geometry;
}

const farmhouse: Builder = function(THREE, materials, variant){
  const g = new THREE.Group();
  const add = parts(THREE, materials, g);
  const walls = ['#ece6d6', '#e4d8c0', '#d8dccc'][variant % 3];
  const w = 36, d = 26, h = 30;
  add(new THREE.BoxGeometry(w, h, d), walls, 0, h / 2, 0);
  add(roofPrism(THREE, [[-d / 2 - 2, 0], [d / 2 + 2, 0], [0, 14]], w + 4), '#4a3a34', 0, h, 0, 'country:farmhouse:roof');
  add(new THREE.BoxGeometry(4, 12, 4), '#7a4a3a', w * 0.3, h + 10, -d * 0.12);
  // LEGAL: The porch across the front: deck, four posts, its own roof.
  add(new THREE.BoxGeometry(w, 2, 10), '#8a7458', 0, 1, d / 2 + 5);
  for(const x of [-w / 2 + 2, -w / 6, w / 6, w / 2 - 2]) add(new THREE.BoxGeometry(1.4, 12, 1.4), '#f4f2ea', x, 8, d / 2 + 9);
  add(new THREE.BoxGeometry(w + 2, 1.4, 11), '#4a3a34', 0, 14.5, d / 2 + 5, 'country:farmhouse:roof');
  add(new THREE.BoxGeometry(6, 11, 0.6), '#3f5a3a', 0, 7.5, d / 2 + 0.3);
  for(const x of [-11, 11]) for(const y of [9, 22]) add(new THREE.BoxGeometry(6, 6, 0.6), '#33475a', x, y, d / 2 + 0.3);
  return g;
};

const barn: Builder = function(THREE, materials){
  const g = new THREE.Group();
  const add = parts(THREE, materials, g);
  const w = 52, d = 36, h = 22;
  add(new THREE.BoxGeometry(w, h, d), '#9a2e26', 0, h / 2, 0);
  // LEGAL: The gambrel roof: steep lower slopes, shallow upper ones.
  add(roofPrism(THREE, [[-d / 2 - 2, 0], [d / 2 + 2, 0], [d / 2 - 3, 11], [0, 18], [-d / 2 + 3, 11]], w + 3), '#3a3d44', 0, h, 0, 'country:barn:roof');
  // LEGAL: Big double doors on the gable end, white-framed with the cross brace, and the hayloft door.
  const end = w / 2 + 0.4;
  add(new THREE.BoxGeometry(0.6, 16, 18), '#7a221c', end, 8, 0);
  add(new THREE.BoxGeometry(0.8, 1.4, 19), '#f4f2ea', end + 0.1, 16, 0);
  add(new THREE.BoxGeometry(0.8, 16, 1.4), '#f4f2ea', end + 0.1, 8, 0);
  for(const tilt of [-0.72, 0.72]){
    const brace = add(new THREE.BoxGeometry(0.8, 22, 1.2), '#f4f2ea', end + 0.15, 8, 0);
    brace.rotation.x = tilt;
  }
  add(new THREE.BoxGeometry(0.6, 6, 7), '#f4f2ea', end, h + 6, 0);
  add(new THREE.BoxGeometry(6, 6, 6), '#9a2e26', 0, h + 21, 0);
  add(new THREE.ConeGeometry(5, 5, 4), '#3a3d44', 0, h + 26.5, 0, 'country:barn:roof').rotation.y = Math.PI / 4;
  return g;
};

const silo: Builder = function(THREE, materials){
  const g = new THREE.Group();
  const add = parts(THREE, materials, g);
  const r = 9, h = 44;
  add(new THREE.CylinderGeometry(r, r, h, 16), '#c8c4b8', 0, h / 2, 0);
  for(let y = 8; y < h; y += 9) add(new THREE.CylinderGeometry(r + 0.3, r + 0.3, 1, 16), '#8f9296', 0, y, 0);
  add(new THREE.SphereGeometry(r, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), '#8f9296', 0, h, 0, 'country:silo:roof');
  add(new THREE.BoxGeometry(1.2, h, 2.4), '#5c5f66', 0, h / 2, r + 0.8);
  return g;
};

const shed: Builder = function(THREE, materials, variant){
  const g = new THREE.Group();
  const add = parts(THREE, materials, g);
  const w = 40, d = 30, h = 18;
  const cladding = ['#7c8288', '#6a7a6e', '#8a7c6a'][variant % 3];
  add(new THREE.BoxGeometry(w, h, d), cladding, 0, h / 2, 0);
  // LEGAL: Ribbed metal: vertical ribs down the long sides.
  for(let x = -w / 2 + 2; x < w / 2; x += 4) for(const z of [-d / 2 - 0.3, d / 2 + 0.3]) add(new THREE.BoxGeometry(0.8, h, 0.6), '#5c6268', x, h / 2, z);
  add(roofPrism(THREE, [[-d / 2 - 1.5, 0], [d / 2 + 1.5, 0], [0, 6]], w + 2), '#4b5051', 0, h, 0, 'country:shed:roof');
  add(new THREE.BoxGeometry(0.6, 13, 16), '#9aa0a8', w / 2 + 0.3, 6.5, 0);
  return g;
};

const tank: Builder = function(THREE, materials){
  const g = new THREE.Group();
  const add = parts(THREE, materials, g);
  const r = 12, h = 22;
  add(new THREE.CylinderGeometry(r, r, h, 18), '#d8d4c8', 0, h / 2, 0);
  add(new THREE.CylinderGeometry(r, r * 0.4, 4, 18), '#9a9ea6', 0, h + 2, 0, 'country:tank:roof');
  add(new THREE.TorusGeometry(r + 0.6, 0.35, 4, 24), '#5c5f66', 0, h + 3, 0).rotation.x = Math.PI / 2;
  add(new THREE.BoxGeometry(1.2, h + 3, 2.4), '#5c5f66', r + 0.8, (h + 3) / 2, 0);
  return g;
};

// LEGAL: Each building's walls (not its porch or yard), for collision.
const FOOTPRINTS: Record<Exclude<OutskirtSceneryKind, 'tree'>, { w: number; d: number }> = {
  farmhouse:{ w:36, d:26 }, barn:{ w:52, d:36 }, silo:{ w:18, d:18 }, shed:{ w:40, d:30 }, tank:{ w:24, d:24 }, suburbHouse:{ w:60, d:30 },
};
export function countryFootprint(kind: Exclude<OutskirtSceneryKind, 'tree'>): { w: number; d: number } { return FOOTPRINTS[kind]; }

const BUILDERS: Record<Exclude<OutskirtSceneryKind, 'tree'>, Builder> = {
  farmhouse, barn, silo, shed, tank,
  suburbHouse:(THREE, materials, variant) => buildHouseModel(THREE, materials, variant),
};

export function buildCountryBuilding(THREE: typeof ThreeNamespace, materials: MapSceneMaterialCache, kind: Exclude<OutskirtSceneryKind, 'tree'>, variant: number): ThreeNamespace.Group {
  return BUILDERS[kind](THREE, materials, variant);
}
