import type * as ThreeNamespace from 'three';
import type { Point, Solid } from '../config/types';
import type { MapSceneMaterialCache } from './scenePerformance';
import { addInstancedMesh, type SceneInstance } from './scenePerformance';
import { TREE_SCALE } from './scale';
import { instancedTrees, treeShape } from './treeModels';

// LEGAL: Grunt Park (the city's Grant Park, with its Duckingham Fountain), at the south end of Canal
// LEGAL: Yard Drive, west of Ridgewood Lane. It was two long strips either side of the lane, 1.3 km of
// LEGAL: lawn with a path across the pond and water you could walk on (TODO 112). Now one park: the
// LEGAL: pond and fountain in the west, the bandstand and the chess tables in the east, a loop round
// LEGAL: the edge to run, and a path down the middle. The layout is plain data so the drawing and
// LEGAL: the collision read the same trees. The code keeps the CENTRAL_PARK names it has always had.
export interface ParkRect { x0: number; x1: number; y0: number; y1: number }
export interface ParkTree { x: number; y: number; size: number }

export const PARK_NAME = 'Grunt Park';
export const FOUNTAIN_NAME = 'Duckingham Fountain';
export const CENTRAL_PARK: ParkRect[] = [{ x0:2900, x1:3546, y0:1275, y1:1530 }];
const PARK = CENTRAL_PARK[0];
const PATH_W = 12;
const INSET = 16;
export const CENTRAL_POND = { x:3115, y:1402, rx:150, ry:70 };
export const BANDSTAND = { x:3440, y:1350, r:22 };
// LEGAL: Where the chess tables and the run's start board stand (map/amenities).
export const PARK_CHESS = { x:3440, y:1455 };
export const PARK_RUN_BOARD = { x:3492, y:1322 };
const MIDDLE_PATH_X = 3330;

export function parkPaths(): ParkRect[] {
  const p = PARK, i = INSET;
  return [
    { x0:p.x0 + i, x1:p.x1 - i, y0:p.y0 + i, y1:p.y0 + i + PATH_W },
    { x0:p.x0 + i, x1:p.x1 - i, y0:p.y1 - i - PATH_W, y1:p.y1 - i },
    { x0:p.x0 + i, x1:p.x0 + i + PATH_W, y0:p.y0 + i, y1:p.y1 - i },
    { x0:p.x1 - i - PATH_W, x1:p.x1 - i, y0:p.y0 + i, y1:p.y1 - i },
    { x0:MIDDLE_PATH_X - PATH_W / 2, x1:MIDDLE_PATH_X + PATH_W / 2, y0:p.y0 + i, y1:p.y1 - i },
  ];
}

// LEGAL: The run: twice round the loop, touching each corner of it, starting from the board.
export function parkRunCheckpoints(): Point[] {
  const p = PARK, c = INSET + PATH_W / 2;
  const corners = [{ x:p.x1 - c, y:p.y0 + c }, { x:p.x1 - c, y:p.y1 - c }, { x:p.x0 + c, y:p.y1 - c }, { x:p.x0 + c, y:p.y0 + c }];
  return [...corners, ...corners, corners[0]];
}
export const PARK_RUN_RADIUS = 30;
export const PARK_RUN_LIMIT = 34;

export const FLOWER_BEDS = [{ x:3392, y:1402, r:14 }, { x:3490, y:1402, r:14 }, { x:3250, y:1300 + 22, r:10 }];

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

export function inPark(point: Point): boolean {
  return CENTRAL_PARK.some(r => nearRect(point, r, 0));
}

function clearOfFeatures(point: Point, margin: number): boolean {
  if(inPond(point, margin)) return false;
  // LEGAL: The bandstand and the chess tables stand in open lawn, to be seen from the paths.
  if(Math.hypot(point.x - BANDSTAND.x, point.y - BANDSTAND.y) < BANDSTAND.r + margin + 30) return false;
  if(FLOWER_BEDS.some(bed => Math.hypot(point.x - bed.x, point.y - bed.y) < bed.r + margin)) return false;
  if(Math.abs(point.x - PARK_CHESS.x) < 29 + margin + 20 && Math.abs(point.y - PARK_CHESS.y) < 18 + margin + 20) return false;
  return Math.hypot(point.x - PARK_RUN_BOARD.x, point.y - PARK_RUN_BOARD.y) > 12 + margin;
}

let cachedTrees: ParkTree[] | null = null;
export function parkTrees(): ParkTree[] {
  if(cachedTrees) return cachedTrees;
  const random = seeded(7717);
  const paths = parkPaths();
  const trees: ParkTree[] = [];
  const p = PARK;
  for(let attempt = 0; attempt < 3000 && trees.length < 60; attempt++){
    const point = { x:p.x0 + 10 + random() * (p.x1 - p.x0 - 20), y:p.y0 + 10 + random() * (p.y1 - p.y0 - 20) };
    if(paths.some(path => nearRect(point, path, 10))) continue;
    if(!clearOfFeatures(point, 14)) continue;
    if(trees.some(t => Math.hypot(t.x - point.x, t.y - point.y) < 28)) continue;
    trees.push({ ...point, size:(0.85 + random() * 0.45) * TREE_SCALE });
  }
  cachedTrees = trees;
  return trees;
}

export function benchSpots(): Array<Point & { rot: number }> {
  const north = PARK.y0 + INSET + PATH_W + 6, south = PARK.y1 - INSET - PATH_W - 6;
  return [
    { x:3040, y:north, rot:0 }, { x:3190, y:north, rot:0 }, { x:3040, y:south, rot:Math.PI }, { x:3190, y:south, rot:Math.PI },
    { x:MIDDLE_PATH_X + 16, y:1380, rot:-Math.PI / 2 }, { x:MIDDLE_PATH_X + 16, y:1424, rot:-Math.PI / 2 }, { x:3400, y:south, rot:Math.PI },
  ];
}

// LEGAL: The pond as strips of box, together covering all of the oval: the old single box sat inside
// LEGAL: it, so you could walk out onto the water round its edge.
const POND_STRIPS = 10;
export function pondSolids(): Solid[] {
  const { x, y, rx, ry } = CENTRAL_POND;
  return Array.from({ length:POND_STRIPS }, function(_unused, k){
    const a = -ry + (2 * ry * k) / POND_STRIPS, b = -ry + (2 * ry * (k + 1)) / POND_STRIPS;
    const nearest = a <= 0 && b >= 0 ? 0 : Math.min(Math.abs(a), Math.abs(b));
    const hw = rx * Math.sqrt(Math.max(0, 1 - (nearest / ry) ** 2));
    return { x, y:y + (a + b) / 2, hw, hd:(b - a) / 2 };
  });
}

export function centralParkSolids(): Solid[] {
  return [
    ...parkTrees().map(t => ({ x:t.x, y:t.y, hw:4, hd:4 })),
    ...pondSolids(),
    { x:BANDSTAND.x, y:BANDSTAND.y, hw:BANDSTAND.r * 0.7, hd:BANDSTAND.r * 0.7 },
  ];
}

// LEGAL: Where countryside scenery must not grow.
export function centralParkKeepClear(): Solid[] {
  return CENTRAL_PARK.map(p => ({ x:(p.x0 + p.x1) / 2, y:(p.y0 + p.y1) / 2, hw:(p.x1 - p.x0) / 2 + 12, hd:(p.y1 - p.y0) / 2 + 12 }));
}

// LEGAL: The ducks on the pond, each a spot and a heading.
export function pondDucks(): Array<Point & { rot: number }> {
  const random = seeded(4410);
  return Array.from({ length:9 }, function(){
    const angle = random() * Math.PI * 2, reach = 0.35 + random() * 0.5;
    return { x:CENTRAL_POND.x + Math.cos(angle) * CENTRAL_POND.rx * reach, y:CENTRAL_POND.y + Math.sin(angle) * CENTRAL_POND.ry * reach, rot:random() * Math.PI * 2 };
  });
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

  // LEGAL: The pond: a stone rim, the water, Duckingham Fountain in the middle, and its ducks.
  const rim = flat(new THREE.CircleGeometry(1, 48), 'park:pond-rim', '#9a958a', CENTRAL_POND.x, 0.24, CENTRAL_POND.y);
  rim.scale.set(CENTRAL_POND.rx + 5, CENTRAL_POND.ry + 5, 1);
  const water = new THREE.Mesh(new THREE.CircleGeometry(1, 48), materials.standard('park:pond-water', { color:'#3f7fa8', roughness:0.15, metalness:0.1 }));
  water.rotation.x = -Math.PI / 2; water.position.set(CENTRAL_POND.x, 0.3, CENTRAL_POND.y);
  water.scale.set(CENTRAL_POND.rx, CENTRAL_POND.ry, 1);
  park.add(water);
  const stone = materials.standard('park:stone', { color:'#cfc9bb', roughness:0.8 });
  // LEGAL: Three tiers like the real one, each basin smaller and higher.
  [[30, 5, 2.5], [18, 4, 9], [9, 3, 15]].forEach(function([r, h, y]){
    const basin = new THREE.Mesh(new THREE.CylinderGeometry(r, r + 2, h, 24), stone);
    basin.position.set(CENTRAL_POND.x, y, CENTRAL_POND.y);
    park.add(basin);
  });
  const column = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 3.5, 16, 10), stone);
  column.position.set(CENTRAL_POND.x, 10, CENTRAL_POND.y);
  const spray = new THREE.Mesh(new THREE.SphereGeometry(8, 12, 8), materials.standard('park:spray-water', { color:'#d8eef8', roughness:0.1, transparent:true, opacity:0.7 }));
  spray.scale.set(1, 1.3, 1); spray.position.set(CENTRAL_POND.x, 25, CENTRAL_POND.y);
  park.add(column, spray);
  const ducks = pondDucks();
  const duckBody = materials.standard('park:duck', { color:'#f2efe6', roughness:0.8 });
  const duckHead = materials.standard('park:duck-head', { color:'#2f6b3a', roughness:0.6 });
  const duckBill = materials.standard('park:duck-bill', { color:'#e8a020', roughness:0.6 });
  addInstancedMesh(THREE, park, new THREE.SphereGeometry(2.6, 8, 6).scale(1.5, 0.8, 1), duckBody, ducks.map(d => ({ x:d.x, y:1.6, z:d.y, rotationY:d.rot })));
  addInstancedMesh(THREE, park, new THREE.SphereGeometry(1.5, 8, 6), duckHead, ducks.map(d => ({ x:d.x + Math.cos(d.rot) * 3.2, y:3.8, z:d.y - Math.sin(d.rot) * 3.2 })));
  addInstancedMesh(THREE, park, new THREE.BoxGeometry(1.6, 0.5, 1), duckBill, ducks.map(d => ({ x:d.x + Math.cos(d.rot) * 4.8, y:3.6, z:d.y - Math.sin(d.rot) * 4.8, rotationY:d.rot })));

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
    const count = Math.round(bed.r * 1.6);
    for(let i = 0; i < count; i++){
      const a = i * 2.4, rr = Math.sqrt((i + 0.5) / count) * (bed.r - 3);
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
  const trunk = materials.standard('prop:tree-trunk', { color:'#4a3624', roughness:0.9 });
  const crown = materials.standard('prop:tree-crown-park', { color:'#3b8044', roughness:0.95 });
  const broadleaf = treeShape('broadleaf');
  if(broadleaf){
    instancedTrees(THREE, broadleaf, trunk, crown, parkTrees().map((tree, i) => ({ x:tree.x, z:tree.y, size:tree.size, rot:i * 1.7 }))).forEach(mesh => park.add(mesh));
  } else {
    addInstancedMesh(THREE, park, new THREE.CylinderGeometry(2.4, 3, 15, 7), trunk, trunks, { cast:true });
    addInstancedMesh(THREE, park, new THREE.SphereGeometry(13, 12, 9), crown, crowns, { cast:true });
  }

  // LEGAL: Benches along the walks, and lamps at the corners.
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
    for(const [x, y] of [[p.x0 + 10, p.y0 + 10], [p.x1 - 10, p.y0 + 10], [p.x0 + 10, p.y1 - 10], [p.x1 - 10, p.y1 - 10]] as const){
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.3, 26, 6), lampPost);
      pole.position.set(x, 13, y);
      const glass = new THREE.Mesh(new THREE.SphereGeometry(3, 8, 6), lampGlass);
      glass.position.set(x, 27, y);
      park.add(pole, glass);
    }
  });
  // LEGAL: The name over the gate by Ridgewood Lane, and the fountain's own plaque by the water.
  const gate = new THREE.Group();
  gate.position.set(PARK.x1 - 60, 0, PARK.y0 + 6);
  park.add(gate);
  addSign(gate, PARK_NAME.toUpperCase(), 48, 10, 18, '#a8d0a8');
  const plaque = new THREE.Group();
  plaque.position.set(CENTRAL_POND.x, 0, CENTRAL_POND.y - CENTRAL_POND.ry - 12);
  park.add(plaque);
  addSign(plaque, FOUNTAIN_NAME.toUpperCase(), 44, 6, 8, '#e8e0c8');
  return park;
}
