import type * as ThreeNamespace from 'three';
import type { Point, Solid } from '../config/types';
import { COUNTRY_ROADS } from './countryRoads';
import { rotatedHalfExtents } from './layout';
import type { MapSceneMaterialCache } from './scenePerformance';
import { TREE_SCALE } from './scale';
import { addPlaceModel, placeModel } from './placeModels';
import { treeShape } from './treeModels';

// LEGAL: Lakeridge, the suburb: a street of family houses down both sides of Lakeridge Lane, south of
// LEGAL: where Lakefront Drive leaves the city. Each lot has a house with a pitched roof and porch, an
// LEGAL: attached garage, a driveway out to the lane, a lawn, a picket fence, a mailbox and a tree.
export interface HouseLot { x: number; y: number; facing: number; side: 1 | -1; variant: number }

const LANE = COUNTRY_ROADS.find(road => road.id === 'road-country-lakeridge')!;
const FROM_Y = 1290, TO_Y = 1690, SPACING = 72;
// LEGAL: From the lane's centre line: half the lane, its verge, then the front lawn.
const LANE_HALF = 22, VERGE = 9, LAWN = 30;
export const HOUSE = { w:40, d:30, garageW:20 };
const FOOTPRINT_W = HOUSE.w + HOUSE.garageW;

function laneAt(y: number): { point: Point; tangent: Point } {
  const path = LANE.path;
  let i = 1;
  while(i < path.length - 1 && path[i].y < y) i++;
  const a = path[i - 1], b = path[i];
  const t = Math.max(0, Math.min(1, (y - a.y) / ((b.y - a.y) || 1)));
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  return { point:{ x:a.x + (b.x - a.x) * t, y }, tangent:{ x:(b.x - a.x) / len, y:(b.y - a.y) / len } };
}

let cached: HouseLot[] | null = null;
export function suburbLots(): HouseLot[] {
  if(cached) return cached;
  const lots: HouseLot[] = [];
  let variant = 0;
  for(let y = FROM_Y; y <= TO_Y; y += SPACING){
    const { point, tangent } = laneAt(y);
    // LEGAL: West of a southbound lane is its right-hand normal flipped; side -1 is west, 1 east.
    const normal = { x:-tangent.y, y:tangent.x };
    for(const side of [-1, 1] as const){
      const out = LANE_HALF + VERGE + LAWN + HOUSE.d / 2;
      const x = point.x - normal.x * side * out, cy = point.y - normal.y * side * out;
      // LEGAL: The house faces the lane: its front (+z in its own frame) points back at the road.
      const front = { x:point.x - x, y:point.y - cy };
      lots.push({ x, y:cy, facing:Math.atan2(front.x, front.y), side, variant:variant++ });
    }
  }
  cached = lots;
  return lots;
}

export function suburbSolids(): Solid[] {
  return suburbLots().map(function(lot){
    const ext = rotatedHalfExtents(FOOTPRINT_W, HOUSE.d, lot.facing);
    return { x:lot.x, y:lot.y, hw:ext.hw, hd:ext.hd };
  });
}

// LEGAL: Where countryside scenery must not grow: each lot from its back fence to the verge.
export function suburbKeepClear(): Solid[] {
  return suburbLots().map(lot => ({ x:lot.x, y:lot.y, hw:FOOTPRINT_W / 2 + LAWN + 6, hd:FOOTPRINT_W / 2 + LAWN + 6 }));
}

const SIDING = ['#d8c7a6', '#a8c0c8', '#c8a8a0', '#e0dccc', '#9fb59a', '#c9b48e', '#b8b0d0'];
const ROOFS = ['#5a4a42', '#3e4652', '#6a3a32', '#4a5040'];
const DOORS = ['#7a2630', '#2f4a6a', '#3f5a3a', '#1d2028', '#c9a227'];

// LEGAL: One family house at the origin, front (+z) toward its street; `variant` picks its colours.
export function buildHouseModel(THREE: typeof ThreeNamespace, materials: MapSceneMaterialCache, variant: number): ThreeNamespace.Group {
  const g = new THREE.Group();
  // LEGAL: Roofs, lawns and drives carry their own keys so settling snow (map/snow) finds them.
  const mat = (color: string, emissive?: string, key?: string) => materials.standard(key ?? `suburb:${color}${emissive ? ':' + emissive : ''}`, { color, roughness:0.85, ...(emissive ? { emissive, emissiveIntensity:0.35 } : {}) });
  const add = (geometry: ThreeNamespace.BufferGeometry, color: string, x: number, y: number, z: number, emissive?: string, key?: string) => {
    const mesh = new THREE.Mesh(geometry, mat(color, emissive, key));
    mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true;
    g.add(mesh);
    return mesh;
  };
  const v = variant;
  const siding = SIDING[v % SIDING.length], roof = ROOFS[(v * 3) % ROOFS.length], door = DOORS[(v * 2) % DOORS.length];
  const { w, d, garageW } = HOUSE;
  const hx = -garageW / 2, gx = w / 2;
  const wallH = 24;
  // LEGAL: The Blender house (art/blender/places.py) when it's loaded, painted in this lot's colours;
  // LEGAL: otherwise the simple shapes below. The lawn, drive and tree are the same either way.
  const model = placeModel('house');
  if(model) addPlaceModel(THREE, g, model, materials, 'suburb:house', { siding, roof, door, shutter:door, mailbox:DOORS[(v + 1) % DOORS.length] });
  else buildSimpleHouse();
  function buildSimpleHouse(): void {
    add(new THREE.BoxGeometry(w, wallH, d), siding, hx, wallH / 2, 0);
    const gable = new THREE.Shape();
    gable.moveTo(-d / 2 - 2, 0); gable.lineTo(d / 2 + 2, 0); gable.lineTo(0, 15); gable.closePath();
    const prism = new THREE.ExtrudeGeometry(gable, { depth:w + 4, bevelEnabled:false });
    prism.rotateY(Math.PI / 2);
    prism.translate(-(w + 4) / 2, 0, 0);
    add(prism, roof, hx, wallH, 0, undefined, `suburb:${roof}:roof`);
    add(new THREE.BoxGeometry(5, 12, 5), '#7a4a3a', hx - w * 0.28, wallH + 12, -d * 0.15);
    // LEGAL: Front door under a porch roof, two windows and a step.
    const front = d / 2 + 0.3;
    add(new THREE.BoxGeometry(7, 13, 0.6), door, hx - 6, 6.5, front);
    add(new THREE.BoxGeometry(16, 1.4, 7), roof, hx - 6, 15, front + 3, undefined, `suburb:${roof}:roof`);
    add(new THREE.BoxGeometry(14, 2, 6), '#b8b0a0', hx - 6, 1, front + 3);
    for(const wx of [hx + 9, hx - 18]) add(new THREE.BoxGeometry(8, 7, 0.6), '#33475a', wx, 12, front, '#2a3a4a');
    // LEGAL: The garage beside it, with its door onto the driveway.
    add(new THREE.BoxGeometry(garageW, 18, d - 4), siding, gx, 9, 2);
    add(new THREE.BoxGeometry(garageW + 2, 1.6, d - 2), roof, gx, 18.8, 2, undefined, `suburb:${roof}:roof`);
    add(new THREE.BoxGeometry(garageW - 5, 13, 0.6), '#e8e4d8', gx, 6.5, d / 2 + 0.3);
    const fenceZ = d / 2 + LAWN - 1;
    const fenceSpans: Array<[number, number]> = [[-(w + garageW) / 2 - 6, hx - 9], [hx - 3, gx - garageW / 2 - 2]];
    for(const [x0, x1] of fenceSpans){
      add(new THREE.BoxGeometry(x1 - x0, 1, 0.8), '#f4f2ea', (x0 + x1) / 2, 6, fenceZ);
      for(let x = x0 + 1.5; x < x1; x += 3.5) add(new THREE.BoxGeometry(1.4, 8, 0.6), '#f4f2ea', x, 4, fenceZ);
  }
  add(new THREE.BoxGeometry(1, 8, 1), '#3a3d44', gx + garageW / 2 + 3, 4, fenceZ + 1);
  add(new THREE.BoxGeometry(3, 3, 5), DOORS[(v + 1) % DOORS.length], gx + garageW / 2 + 3, 9, fenceZ + 1);
  }
  // LEGAL: Driveway and front path out to the verge, the lawn and a tree on it. The picket fence, with
  // LEGAL: gaps for both, and the mailbox at the end of the drive come with the house.
  const lawnZ = d / 2 + LAWN / 2;
  const flat = (width: number, depth: number, color: string, x: number, z: number, y: number, key: string) => {
    const mesh = add(new THREE.PlaneGeometry(width, depth), color, x, y, z, undefined, key);
    mesh.rotation.x = -Math.PI / 2; mesh.castShadow = false;
  };
  flat(w + garageW + 14, LAWN + 2, '#4f8a42', 0, lawnZ, 0.15, 'terrain:park-suburb-lawn');
  flat(garageW - 2, LAWN + VERGE, '#b5b0a4', gx, d / 2 + (LAWN + VERGE) / 2, 0.2, 'path:#b5b0a4:drive');
  flat(4, LAWN, '#b5b0a4', hx - 6, lawnZ, 0.2, 'path:#b5b0a4:drive');
  const broadleaf = treeShape('broadleaf');
  if(v % 3 !== 1 && broadleaf){
    // LEGAL: The Blender broadleaf on the front lawn (map/treeModels).
    [[broadleaf.bark, '#4a3624', 'prop:tree-trunk'], [broadleaf.leaves, '#2f6a3d', 'prop:tree-crown-yard']].forEach(function([geometry, color, key]){
      const mesh = add(geometry as ThreeNamespace.BufferGeometry, color as string, hx - w * 0.36, 0, lawnZ + 2, undefined, key as string);
      mesh.scale.setScalar(TREE_SCALE * 0.85);
    });
  } else if(v % 3 !== 1){
    add(new THREE.CylinderGeometry(1.8 * TREE_SCALE, 2.3 * TREE_SCALE, 14 * TREE_SCALE, 7), '#4a3624', hx - w * 0.36, 7 * TREE_SCALE, lawnZ + 2, undefined, 'prop:tree-trunk');
    const crown = add(new THREE.SphereGeometry(10 * TREE_SCALE, 12, 9), '#2f6a3d', hx - w * 0.36, 20 * TREE_SCALE, lawnZ + 2, undefined, 'prop:tree-crown-yard');
    crown.scale.y = 0.9;
  }
  return g;
}

// LEGAL: One group for the whole street, so it merges into one mesh per material: a dozen houses of a
// LEGAL: dozen materials each would otherwise be well over a hundred draw calls.
export function buildSuburb(THREE: typeof ThreeNamespace, materials: MapSceneMaterialCache): ThreeNamespace.Group {
  const street = new THREE.Group();
  street.name = 'suburb:lakeridge';
  suburbLots().forEach(function(lot){
    const house = buildHouseModel(THREE, materials, lot.variant);
    house.position.set(lot.x, 0, lot.y);
    house.rotation.y = lot.facing;
    street.add(house);
  });
  return street;
}
