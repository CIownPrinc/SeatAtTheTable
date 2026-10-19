import type * as ThreeNamespace from 'three';
import type { Point, Solid } from '../config/types';
import type { MapSceneMaterialCache } from './scenePerformance';
import { addInstancedMesh, type SceneInstance } from './scenePerformance';
import { TREE_SCALE } from './scale';

// LEGAL: Central Park, where Cicero Avenue, Pulaski Road and Canal Yard Drive end on the city's
// LEGAL: south edge. Ridgewood Lane runs down the middle of it, so it's two halves: the west one
// LEGAL: round a big pond with a fountain, the east one a lawn with flower beds and a bandstand.
// LEGAL: The layout is plain data so the drawing and the collision read the same trees.
export interface ParkRect { x0: number; x1: number; y0: number; y1: number }
export interface ParkTree { x: number; y: number; size: number }

export const CENTRAL_PARK: ParkRect[] = [
  { x0:2900, x1:3546, y0:1275, y1:1500 },
  { x0:3624, x1:4250, y0:1275, y1:1500 },
];
const PATH_W = 12;
export const CENTRAL_POND = { x:3200, y:1395, rx:150, ry:62 };
export const BANDSTAND = { x:4030, y:1390, r:22 };

// LEGAL: The walks: one round each half and one across it, east to west.
export function parkPaths(): ParkRect[] {
  return CENTRAL_PARK.flatMap(function(p){
    const i = 16;
    return [
      { x0:p.x0 + i, x1:p.x1 - i, y0:p.y0 + i, y1:p.y0 + i + PATH_W },
      { x0:p.x0 + i, x1:p.x1 - i, y0:p.y1 - i - PATH_W, y1:p.y1 - i },
      { x0:p.x0 + i, x1:p.x0 + i + PATH_W, y0:p.y0 + i, y1:p.y1 - i },
      { x0:p.x1 - i - PATH_W, x1:p.x1 - i, y0:p.y0 + i, y1:p.y1 - i },
      { x0:p.x0 + i, x1:p.x1 - i, y0:(p.y0 + p.y1) / 2 - PATH_W / 2, y1:(p.y0 + p.y1) / 2 + PATH_W / 2 },
    ];
  });
}

export const FLOWER_BEDS = [{ x:3800, y:1340, r:18 }, { x:3800, y:1440, r:18 }, { x:3700, y:1390, r:14 }];

function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return function(){ s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}

function nearRect(point: Point, rect: ParkRect, margin: number): boolean {
  return point.x > rect.x0 - margin && point.x < rect.x1 + margin && point.y > rect.y0 - margin && point.y < rect.y1 + margin;
}

export function inPond(point: Point, margin = 0): boolean {
  const dx = (point.x - CENTRAL_POND.x) / (CENTRAL_POND.rx + margin), dy = (point.y - CENTRAL_POND.y) / (CENTRAL_POND.ry + margin);
  return dx * dx + dy * dy < 1;
}

let cachedTrees: ParkTree[] | null = null;
export function parkTrees(): ParkTree[] {
  if(cachedTrees) return cachedTrees;
  const random = seeded(7717);
  const paths = parkPaths();
  const trees: ParkTree[] = [];
  CENTRAL_PARK.forEach(function(p){
    for(let attempt = 0; attempt < 900 && trees.length < 90; attempt++){
      const point = { x:p.x0 + 12 + random() * (p.x1 - p.x0 - 24), y:p.y0 + 12 + random() * (p.y1 - p.y0 - 24) };
      if(paths.some(path => nearRect(point, path, 12))) continue;
      if(inPond(point, 18)) continue;
      if(Math.hypot(point.x - BANDSTAND.x, point.y - BANDSTAND.y) < BANDSTAND.r + 26) continue;
      if(FLOWER_BEDS.some(bed => Math.hypot(point.x - bed.x, point.y - bed.y) < bed.r + 16)) continue;
      if(trees.some(t => Math.hypot(t.x - point.x, t.y - point.y) < 30)) continue;
      trees.push({ ...point, size:(0.85 + random() * 0.45) * TREE_SCALE });
    }
  });
  cachedTrees = trees;
  return trees;
}

export function benchSpots(): Array<Point & { rot: number }> {
  return [
    { x:3080, y:1312, rot:0 }, { x:3320, y:1312, rot:0 }, { x:3080, y:1462, rot:Math.PI }, { x:3320, y:1462, rot:Math.PI },
    { x:3760, y:1374, rot:Math.PI }, { x:3900, y:1406, rot:0 }, { x:4120, y:1312, rot:0 }, { x:3700, y:1462, rot:Math.PI },
  ];
}

export function centralParkSolids(): Solid[] {
  return [
    ...parkTrees().map(t => ({ x:t.x, y:t.y, hw:4, hd:4 })),
    // LEGAL: The pond, as the box inside its ellipse, so you walk round the water, not into it.
    { x:CENTRAL_POND.x, y:CENTRAL_POND.y, hw:CENTRAL_POND.rx * 0.78, hd:CENTRAL_POND.ry * 0.78 },
  ];
}

// LEGAL: Where countryside scenery must not grow.
export function centralParkKeepClear(): Solid[] {
  return CENTRAL_PARK.map(p => ({ x:(p.x0 + p.x1) / 2, y:(p.y0 + p.y1) / 2, hw:(p.x1 - p.x0) / 2 + 12, hd:(p.y1 - p.y0) / 2 + 12 }));
}

export function buildCentralPark(THREE: typeof ThreeNamespace, materials: MapSceneMaterialCache, addSign: (parent: ThreeNamespace.Object3D, text: string, w: number, h: number, y: number, color: string) => void): ThreeNamespace.Group {
  const park = new THREE.Group();
  park.name = 'park:central';
  const flat = (geometry: ThreeNamespace.BufferGeometry, key: string, color: string, x: number, y: number, z: number) => {
    const mesh = new THREE.Mesh(geometry, materials.standard(key, { color, roughness:0.95 }));
    mesh.rotation.x = -Math.PI / 2; mesh.position.set(x, y, z); mesh.receiveShadow = true;
    park.add(mesh);
    return mesh;
  };
  CENTRAL_PARK.forEach(p => flat(new THREE.PlaneGeometry(p.x1 - p.x0, p.y1 - p.y0), 'terrain:park-lawn', '#3f7a3c', (p.x0 + p.x1) / 2, 0.14, (p.y0 + p.y1) / 2));
  parkPaths().forEach(r => flat(new THREE.PlaneGeometry(r.x1 - r.x0, r.y1 - r.y0), 'park:path', '#c8bb98', (r.x0 + r.x1) / 2, 0.2, (r.y0 + r.y1) / 2));

  // LEGAL: The pond: a stone rim, the water, and a fountain in the middle.
  const rim = flat(new THREE.CircleGeometry(1, 48), 'park:pond-rim', '#9a958a', CENTRAL_POND.x, 0.24, CENTRAL_POND.y);
  rim.scale.set(CENTRAL_POND.rx + 5, CENTRAL_POND.ry + 5, 1);
  const water = new THREE.Mesh(new THREE.CircleGeometry(1, 48), materials.standard('park:pond-water', { color:'#3f7fa8', roughness:0.15, metalness:0.1 }));
  water.rotation.x = -Math.PI / 2; water.position.set(CENTRAL_POND.x, 0.3, CENTRAL_POND.y);
  water.scale.set(CENTRAL_POND.rx, CENTRAL_POND.ry, 1);
  park.add(water);
  const stone = materials.standard('park:stone', { color:'#cfc9bb', roughness:0.8 });
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(16, 18, 5, 20), stone);
  basin.position.set(CENTRAL_POND.x, 2.5, CENTRAL_POND.y);
  const column = new THREE.Mesh(new THREE.CylinderGeometry(3, 4, 18, 10), stone);
  column.position.set(CENTRAL_POND.x, 9, CENTRAL_POND.y);
  const spray = new THREE.Mesh(new THREE.SphereGeometry(8, 12, 8), materials.standard('park:spray-water', { color:'#d8eef8', roughness:0.1, transparent:true, opacity:0.7 }));
  spray.scale.set(1, 0.7, 1); spray.position.set(CENTRAL_POND.x, 20, CENTRAL_POND.y);
  park.add(basin, column, spray);

  // LEGAL: The bandstand: a round deck, white posts and a green roof.
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(BANDSTAND.r, BANDSTAND.r + 2, 4, 8), stone);
  deck.position.set(BANDSTAND.x, 2, BANDSTAND.y);
  park.add(deck);
  const white = materials.standard('park:bandstand-post', { color:'#f0efe8', roughness:0.6 });
  for(let i = 0; i < 8; i++){
    const a = (i / 8) * Math.PI * 2;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 24, 6), white);
    post.position.set(BANDSTAND.x + Math.cos(a) * (BANDSTAND.r - 3), 16, BANDSTAND.y + Math.sin(a) * (BANDSTAND.r - 3));
    park.add(post);
  }
  const roof = new THREE.Mesh(new THREE.ConeGeometry(BANDSTAND.r + 5, 14, 8), materials.standard('park:bandstand-roof', { color:'#2f6b4a', roughness:0.7 }));
  roof.position.set(BANDSTAND.x, 35, BANDSTAND.y);
  park.add(roof);

  // LEGAL: Flower beds: soil with blooms in four colours.
  const blooms: Record<string, SceneInstance[]> = { '#e85a8a':[], '#f0c040':[], '#c070e0':[], '#f0efe8':[] };
  const bloomColours = Object.keys(blooms);
  FLOWER_BEDS.forEach(function(bed, b){
    flat(new THREE.CircleGeometry(bed.r, 24), 'park:soil', '#5a4632', bed.x, 0.26, bed.y);
    for(let i = 0; i < 26; i++){
      const a = i * 2.4, rr = Math.sqrt((i + 0.5) / 26) * (bed.r - 3);
      blooms[bloomColours[(i + b) % 4]].push({ x:bed.x + Math.cos(a) * rr, y:2, z:bed.y + Math.sin(a) * rr });
    }
  });
  bloomColours.forEach(color => addInstancedMesh(THREE, park, new THREE.SphereGeometry(2.2, 6, 5), materials.standard(`park:bloom:${color}`, { color, roughness:0.7 }), blooms[color]));

  // LEGAL: Trees with round crowns, the same shape as the street trees.
  const trunks: SceneInstance[] = [], crowns: SceneInstance[] = [];
  parkTrees().forEach(function(tree, i){
    trunks.push({ x:tree.x, y:7.5 * tree.size, z:tree.y });
    crowns.push({ x:tree.x, y:22 * tree.size, z:tree.y, rotationY:i });
  });
  addInstancedMesh(THREE, park, new THREE.CylinderGeometry(2.4, 3, 15, 7), materials.standard('prop:tree-trunk', { color:'#4a3624', roughness:0.9 }), trunks, { cast:true });
  addInstancedMesh(THREE, park, new THREE.SphereGeometry(13, 12, 9), materials.standard('prop:tree-crown-park', { color:'#2f6a3d', roughness:0.95 }), crowns, { cast:true });

  // LEGAL: Benches along the walks, and lamps at the corners of each half.
  const wood = materials.standard('park:bench', { color:'#6a4a32', roughness:0.8 });
  benchSpots().forEach(function(spot){
    const bench = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.BoxGeometry(22, 2, 6), wood);
    seat.position.y = 5;
    const back = new THREE.Mesh(new THREE.BoxGeometry(22, 7, 1.5), wood);
    back.position.set(0, 9, -3);
    bench.add(seat, back);
    bench.position.set(spot.x, 0, spot.y); bench.rotation.y = spot.rot;
    park.add(bench);
  });
  const lampPost = materials.standard('park:lamp-post', { color:'#2f333c', roughness:0.5, metalness:0.5 });
  const lampGlass = materials.standard('park:lamp-glass', { color:'#ffe6a0', emissive:'#ffcf70', emissiveIntensity:0.6 });
  CENTRAL_PARK.forEach(function(p){
    for(const [x, y] of [[p.x0 + 22, p.y0 + 22], [p.x1 - 22, p.y0 + 22], [p.x0 + 22, p.y1 - 22], [p.x1 - 22, p.y1 - 22]] as const){
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.3, 26, 6), lampPost);
      pole.position.set(x, 13, y);
      const glass = new THREE.Mesh(new THREE.SphereGeometry(3, 8, 6), lampGlass);
      glass.position.set(x, 27, y);
      park.add(pole, glass);
    }
  });
  const signPost = new THREE.Group();
  signPost.position.set(3585, 0, 1268);
  park.add(signPost);
  addSign(signPost, 'CENTRAL PARK', 48, 10, 18, '#a8d0a8');
  return park;
}
