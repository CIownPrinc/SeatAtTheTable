import type * as ThreeNamespace from 'three';
import type { Point, Solid } from '../config/types';
import { addPlaceModel, localMaterials, placeModel } from './placeModels';
import { WAGON_COLOURS, buildCar, carSize, type CarKind } from './rollingStock';
import { UNITS_PER_METRE } from './scale';

// LEGAL: The railyard, beside the freight line where it runs out of the West Side to the Ring Road.
// LEGAL: It was an 11 by 8 m patch with doll-sized wagons, dropped on any free lot in the district,
// LEGAL: nowhere near the rails. Now three sidings branch off the line through one lead track and end
// LEGAL: at buffer stops, with a switching engine and wagons standing on them, a loading dock, the yard
// LEGAL: office by the gate and a fence round it. Absolute world coordinates, plain data, so the
// LEGAL: drawing, the collision and the countryside scenery all read the same layout.
const metres = (m: number) => m * UNITS_PER_METRE;

// LEGAL: The freight line's centre (map/world freightLinePath); a test keeps the two equal.
export const MAIN_LINE_X = 4658;
export const TRACK_BED = 40;
export const RAIL_OFFSET = 9;

export const RAILYARD_AREA = { x0:4270, x1:4630, y0:1110, y1:1680 };

// LEGAL: The lead leaves the line at the yard's north-east corner and runs south-west across the sidings.
export const LEAD = { from:{ x:MAIN_LINE_X, y:1130 }, to:{ x:4508, y:1370 } };
export const SIDING_XS = [4598, 4553, 4508];
export const SIDING_END_Y = 1650;

export function sidingStartY(x: number): number {
  const t = (LEAD.from.x - x) / (LEAD.from.x - LEAD.to.x);
  return LEAD.from.y + t * (LEAD.to.y - LEAD.from.y);
}

// LEGAL: The forecourt inside the gate: where the place sits on the map and where you stand to use it.
export const RAILYARD_GATE: Point = { x:4455, y:1610 };
export const GATE_GAP = { x0:4420, x1:4490 };

export const YARD_OFFICE = { x:4345, y:1600, w:metres(12.4), d:metres(7.6), h:metres(4) };
export const LOADING_DOCK = { x:4466, y:1460, w:metres(3.8), d:metres(15), h:metres(1.2) };
const CONTAINER = { length:metres(6.1), width:metres(2.44), height:metres(2.6) };
export const CONTAINER_STACKS: Array<Point & { tiers: number; colour: string }> = [
  { x:4330, y:1200, tiers:2, colour:'#a83228' },
  { x:4330, y:1240, tiers:1, colour:'#2f6bb0' },
  { x:4400, y:1300, tiers:2, colour:'#2f8f6a' },
];
export const FLOODLIGHTS: Point[] = [{ x:4290, y:1130 }, { x:4440, y:1300 }, { x:4290, y:1520 }];

// LEGAL: What stands on the sidings. The third siding stays empty, so the yard's middle is open.
export const STANDING_CARS: Array<{ siding: number; y: number; kind: CarKind; colour: string }> = [
  { siding:0, y:1345, kind:'locomotive', colour:'' },
  { siding:0, y:1535, kind:'wagon', colour:WAGON_COLOURS[0] },
  { siding:1, y:1400, kind:'wagon', colour:WAGON_COLOURS[1] },
  { siding:1, y:1562, kind:'wagon', colour:WAGON_COLOURS[2] },
];

const FENCE_HALF = 1.5;
function fenceRuns(): Array<{ a: Point; b: Point }> {
  const { x0, x1, y0, y1 } = RAILYARD_AREA;
  return [
    { a:{ x:x0, y:y0 }, b:{ x:x1, y:y0 } },
    { a:{ x:x0, y:y0 }, b:{ x:x0, y:y1 } },
    { a:{ x:x0, y:y1 }, b:{ x:GATE_GAP.x0, y:y1 } },
    { a:{ x:GATE_GAP.x1, y:y1 }, b:{ x:x1, y:y1 } },
  ];
}

export function railyardSolids(): Solid[] {
  const cars = STANDING_CARS.map(function(car){
    const size = carSize(car.kind);
    return { x:SIDING_XS[car.siding], y:car.y, hw:size.width / 2, hd:size.length / 2 };
  });
  const fences = fenceRuns().map(({ a, b }) => ({ x:(a.x + b.x) / 2, y:(a.y + b.y) / 2, hw:Math.abs(b.x - a.x) / 2 + FENCE_HALF, hd:Math.abs(b.y - a.y) / 2 + FENCE_HALF }));
  const containers = CONTAINER_STACKS.map(s => ({ x:s.x, y:s.y, hw:CONTAINER.length / 2, hd:CONTAINER.width / 2 }));
  const buffers = SIDING_XS.map(x => ({ x, y:SIDING_END_Y + 3, hw:RAIL_OFFSET + 3, hd:3 }));
  return [
    { x:YARD_OFFICE.x, y:YARD_OFFICE.y, hw:YARD_OFFICE.w / 2, hd:YARD_OFFICE.d / 2 },
    { x:LOADING_DOCK.x, y:LOADING_DOCK.y, hw:LOADING_DOCK.w / 2, hd:LOADING_DOCK.d / 2 },
    ...cars, ...fences, ...containers, ...buffers,
  ];
}

// LEGAL: The ground the yard covers, for the countryside scenery to keep off.
export function railyardKeepClear(): Solid[] {
  const { x0, x1, y0, y1 } = RAILYARD_AREA;
  return [{ x:(x0 + x1) / 2, y:(y0 + y1) / 2, hw:(x1 - x0) / 2 + 12, hd:(y1 - y0) / 2 + 12 }];
}

// LEGAL: The yard, built round the gate (its map position), so it's placed like any other place.
export function buildRailyard(THREE: typeof ThreeNamespace): ThreeNamespace.Group {
  const g = new THREE.Group();
  g.name = 'railyard';
  const materials = localMaterials(THREE);
  const mat = (key: string, color: string, roughness = 0.85, metalness = 0) => materials.standard(`railyard:${key}`, { color, roughness, metalness });
  const local = (p: Point) => ({ x:p.x - RAILYARD_GATE.x, z:p.y - RAILYARD_GATE.y });
  const put = (mesh: ThreeNamespace.Mesh, p: Point, y: number) => {
    const at = local(p);
    mesh.position.set(at.x, y, at.z); mesh.castShadow = true; mesh.receiveShadow = true;
    g.add(mesh);
    return mesh;
  };
  const { x0, x1, y0, y1 } = RAILYARD_AREA;
  const ground = put(new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, y1 - y0).rotateX(-Math.PI / 2), mat('gravel', '#6a6258', 1)), { x:(x0 + x1) / 2, y:(y0 + y1) / 2 }, 0.12);
  ground.castShadow = false;

  const tracks: Array<{ a: Point; b: Point }> = [
    { a:LEAD.from, b:LEAD.to },
    ...SIDING_XS.map(x => ({ a:{ x, y:sidingStartY(x) }, b:{ x, y:SIDING_END_Y } })),
  ];
  const sleepers: Array<{ p: Point; turn: number }> = [];
  tracks.forEach(function({ a, b }){
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    const turn = Math.atan2(b.x - a.x, b.y - a.y);
    const along = (d: number, across = 0) => ({ x:a.x + (b.x - a.x) * d / length + Math.cos(turn) * across, y:a.y + (b.y - a.y) * d / length - Math.sin(turn) * across });
    const bed = put(new THREE.Mesh(new THREE.BoxGeometry(TRACK_BED, 0.4, length), mat('ballast', '#2a2a2e', 1)), along(length / 2), 0.2);
    bed.rotation.y = turn; bed.castShadow = false;
    for(const side of [-1, 1]) put(new THREE.Mesh(new THREE.BoxGeometry(3, 3, length), mat('steel', '#a6a99e', 0.38, 0.55)), along(length / 2, side * RAIL_OFFSET), 2.1).rotation.y = turn;
    for(let d = 10; d < length - 4; d += 26) sleepers.push({ p:along(d), turn });
  });
  const sleeperMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(28, 1.6, 4), mat('sleeper', '#4a3a2a', 0.95), sleepers.length);
  const dummy = new THREE.Object3D();
  sleepers.forEach(function({ p, turn }, i){
    const at = local(p);
    dummy.position.set(at.x, 1, at.z); dummy.rotation.set(0, turn, 0); dummy.updateMatrix();
    sleeperMesh.setMatrixAt(i, dummy.matrix);
  });
  sleeperMesh.receiveShadow = true;
  g.add(sleeperMesh);
  SIDING_XS.forEach(x => put(new THREE.Mesh(new THREE.BoxGeometry(RAIL_OFFSET * 2 + 6, metres(1), 4), mat('buffer', '#c0392b', 0.6)), { x, y:SIDING_END_Y + 3 }, metres(0.5)));

  STANDING_CARS.forEach(function(car){
    const at = local({ x:SIDING_XS[car.siding], y:car.y });
    const built = buildCar(THREE, car.kind, car.colour);
    built.position.set(at.x, 0, at.z);
    g.add(built);
  });

  addOffice(THREE, g, local({ x:YARD_OFFICE.x, y:YARD_OFFICE.y }));
  put(new THREE.Mesh(new THREE.BoxGeometry(LOADING_DOCK.w, LOADING_DOCK.h, LOADING_DOCK.d), mat('dock', '#8a8478', 0.9)), LOADING_DOCK, LOADING_DOCK.h / 2);
  CONTAINER_STACKS.forEach(function(stack){
    for(let tier = 0; tier < stack.tiers; tier++) put(new THREE.Mesh(new THREE.BoxGeometry(CONTAINER.length, CONTAINER.height, CONTAINER.width), mat(`container-${stack.colour}`, tier ? '#d4a017' : stack.colour, 0.7, 0.2)), stack, CONTAINER.height * (tier + 0.5));
  });
  FLOODLIGHTS.forEach(function(p){
    put(new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.2, metres(12), 8), mat('mast', '#3a3d44', 0.6, 0.4)), p, metres(6));
    put(new THREE.Mesh(new THREE.BoxGeometry(8, 3, 3), materials.standard('railyard:lamp', { color:'#000000', emissive:'#fff2c8', emissiveIntensity:0.9 })), p, metres(12));
  });
  addSignal(THREE, g, mat, local({ x:LEAD.from.x - 28, y:LEAD.from.y - 10 }));
  addFence(THREE, g, mat, local);
  return g;
}

function addOffice(THREE: typeof ThreeNamespace, g: ThreeNamespace.Group, at: { x: number; z: number }): void {
  const office = new THREE.Group();
  office.name = 'railyard:office';
  // LEGAL: Modelled with its door on its front (+z); turned so the door opens east onto the forecourt.
  office.rotation.y = Math.PI / 2;
  office.position.set(at.x, 0, at.z);
  const model = placeModel('yard-office');
  if(model) addPlaceModel(THREE, office, model, localMaterials(THREE), 'special:yard-office');
  else {
    const walls = new THREE.Mesh(new THREE.BoxGeometry(YARD_OFFICE.d, YARD_OFFICE.h, YARD_OFFICE.w), new THREE.MeshStandardMaterial({ color:'#8a7a62', roughness:0.9 }));
    walls.position.y = YARD_OFFICE.h / 2;
    const roof = new THREE.Mesh(new THREE.BoxGeometry(YARD_OFFICE.d + 4, 2, YARD_OFFICE.w + 4), new THREE.MeshStandardMaterial({ color:'#4a4038', roughness:0.9 }));
    roof.position.y = YARD_OFFICE.h + 1;
    const door = new THREE.Mesh(new THREE.BoxGeometry(10, metres(2.1), 1), new THREE.MeshStandardMaterial({ color:'#4a3a2a', roughness:0.8 }));
    door.position.set(0, metres(1.05), YARD_OFFICE.w / 2 + 0.4);
    [walls, roof, door].forEach(mesh => { mesh.castShadow = true; mesh.receiveShadow = true; office.add(mesh); });
  }
  g.add(office);
}

type Mat = (key: string, color: string, roughness?: number, metalness?: number) => ThreeNamespace.Material;

function addSignal(THREE: typeof ThreeNamespace, g: ThreeNamespace.Group, mat: Mat, at: { x: number; z: number }): void {
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, metres(5), 8), mat('mast', '#3a3d44', 0.6, 0.4));
  post.position.set(at.x, metres(2.5), at.z);
  const head = new THREE.Mesh(new THREE.BoxGeometry(3, 7, 2.4), mat('signal', '#1a1a1a'));
  head.position.set(at.x, metres(5), at.z);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshStandardMaterial({ color:'#000000', emissive:'#ff2020', emissiveIntensity:1 }));
  lamp.position.set(at.x, metres(5) + 1.5, at.z + 1.3);
  [post, head, lamp].forEach(mesh => g.add(mesh));
}

// LEGAL: A chain-link fence, 2 m: posts, a top and bottom rail and a see-through mesh between them.
function addFence(THREE: typeof ThreeNamespace, g: ThreeNamespace.Group, mat: Mat, local: (p: Point) => { x: number; z: number }): void {
  const height = metres(2);
  const mesh = new THREE.MeshStandardMaterial({ color:'#9aa0a6', roughness:0.6, metalness:0.4, transparent:true, opacity:0.35, depthWrite:false });
  fenceRuns().forEach(function({ a, b }){
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    const turn = Math.atan2(b.x - a.x, b.y - a.y);
    const mid = local({ x:(a.x + b.x) / 2, y:(a.y + b.y) / 2 });
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(length, height), mesh);
    panel.rotation.y = turn + Math.PI / 2; panel.position.set(mid.x, height / 2, mid.z);
    g.add(panel);
    for(const y of [0.4, height]){
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, length, 6), mat('fence', '#7a8086', 0.6, 0.4));
      rail.rotation.set(Math.PI / 2, turn, 0, 'YXZ'); rail.position.set(mid.x, y, mid.z);
      g.add(rail);
    }
    const posts = Math.max(1, Math.round(length / metres(3)));
    for(let i = 0; i <= posts; i++){
      const p = local({ x:a.x + (b.x - a.x) * i / posts, y:a.y + (b.y - a.y) * i / posts });
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, height, 6), mat('fence', '#7a8086', 0.6, 0.4));
      post.position.set(p.x, height / 2, p.z);
      g.add(post);
    }
  });
}
