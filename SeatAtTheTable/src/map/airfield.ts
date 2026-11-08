import type * as ThreeNamespace from 'three';
import type { Point, Solid } from '../config/types';
import { addPlaceModel, localMaterials, placeModel } from './placeModels';
import { UNITS_PER_METRE } from './scale';

// LEGAL: Kettle Flats Airfield, a grass-country strip south of Cermak Lane where the Ring Road bends
// LEGAL: north-east. It was a 25 m runway squeezed between two lanes with a hangar 4 m across, and
// LEGAL: nothing to do there but meet one mission contact. Now: a real strip and hangar, a flight
// LEGAL: school that gives you a pilot's licence, a crop-duster to charter, and Deke's cargo runs.
// LEGAL: Absolute world coordinates, plain data, so the drawing, collision and scenery agree.
const metres = (m: number) => m * UNITS_PER_METRE;

export const AIRFIELD_AREA = { x0:-1080, x1:-40, y0:970, y1:1310 };
// LEGAL: About 95 m of tarmac, east-west, 11 m wide.
export const RUNWAY = { x0:-1060, x1:-80, y:1245, width:metres(10.5) };
export const HANGAR = { x:-900, y:1060, w:metres(22), d:metres(14.3), h:metres(7) };
export const APRON = { x0:HANGAR.x - HANGAR.w / 2, x1:HANGAR.x + HANGAR.w / 2, y0:HANGAR.y + HANGAR.d / 2, y1:RUNWAY.y - RUNWAY.width / 2 };
export const FUEL_TANK = { x:-1050, y:1030, r:metres(1.6), h:metres(3.2) };
export const WINDSOCK: Point = { x:-150, y:1175 };
// LEGAL: The car park by the hangar's side door: where the place sits on the map and where you stand
// LEGAL: to use it. The country lane is a short walk north.
export const AIRFIELD_GATE: Point = { x:-710, y:1080 };
// LEGAL: Where the plane waits on the apron, nose toward the runway, and where a flight starts.
export const PLANE_STAND: Point = { x:HANGAR.x, y:APRON.y0 + 30 };
export const TAKEOFF_START: Point & { facing: number } = { x:RUNWAY.x0 + 60, y:RUNWAY.y, facing:0 };

export function airfieldSolids(): Solid[] {
  return [
    { x:HANGAR.x, y:HANGAR.y, hw:HANGAR.w / 2, hd:HANGAR.d / 2 },
    { x:FUEL_TANK.x, y:FUEL_TANK.y, hw:FUEL_TANK.r, hd:FUEL_TANK.r },
  ];
}

export function airfieldKeepClear(): Solid[] {
  const { x0, x1, y0, y1 } = AIRFIELD_AREA;
  return [{ x:(x0 + x1) / 2, y:(y0 + y1) / 2, hw:(x1 - x0) / 2 + 12, hd:(y1 - y0) / 2 + 12 }];
}

export function onAirfield(p: Point): boolean {
  return p.x >= AIRFIELD_AREA.x0 && p.x <= AIRFIELD_AREA.x1 && p.y >= AIRFIELD_AREA.y0 && p.y <= AIRFIELD_AREA.y1;
}

export function onRunway(p: Point): boolean {
  return p.x >= RUNWAY.x0 && p.x <= RUNWAY.x1 && Math.abs(p.y - RUNWAY.y) <= RUNWAY.width / 2;
}

// LEGAL: ---- Flying rules (tunable) ----
export const FLIGHT_RULES = {
  // LEGAL: How far off the runway's line the nose may point and still take off or land.
  alignment:0.45,
  // LEGAL: Lift-off at this share of the plane's top speed, on the runway.
  takeoffSpeed:0.7,
  // LEGAL: Touch down no faster than this share of top speed.
  landingSpeed:0.85,
};

function alignedWithRunway(facing: number): boolean {
  const off = Math.abs(Math.atan2(Math.sin(facing), Math.cos(facing)));
  return off <= FLIGHT_RULES.alignment || Math.PI - off <= FLIGHT_RULES.alignment;
}

export function canTakeOff(p: Point, facing: number, speed: number, topSpeed: number): boolean {
  return onRunway(p) && alignedWithRunway(facing) && speed >= topSpeed * FLIGHT_RULES.takeoffSpeed;
}

export type LandingCheck = 'ok' | 'not-runway' | 'not-aligned' | 'too-fast';
export function landingCheck(p: Point, facing: number, speed: number, topSpeed: number): LandingCheck {
  if(!onRunway(p)) return 'not-runway';
  if(!alignedWithRunway(facing)) return 'not-aligned';
  if(speed > topSpeed * FLIGHT_RULES.landingSpeed) return 'too-fast';
  return 'ok';
}

// LEGAL: ---- The flying lesson: a loop of rings over the west farms, the coast and the lake ----
export const RING_RADIUS = 70;
export const LESSON_RINGS: Point[] = [
  { x:300, y:1480 },
  { x:-500, y:1700 },
  { x:-1500, y:1150 },
  { x:-1450, y:350 },
  { x:-900, y:-350 },
  { x:-250, y:250 },
];

export function ringPassed(p: Point, ring: Point): boolean {
  return Math.hypot(p.x - ring.x, p.y - ring.y) <= RING_RADIUS;
}

// LEGAL: The course's length from the runway's far end round every ring and back, at cruising speed,
// LEGAL: with two and a half times that for turning and finding the next ring.
export function lessonTimeLimit(cruiseSpeed: number): number {
  const stops = [{ x:RUNWAY.x1, y:RUNWAY.y }, ...LESSON_RINGS, { x:RUNWAY.x0, y:RUNWAY.y }];
  let length = 0;
  for(let i = 1; i < stops.length; i++) length += Math.hypot(stops[i].x - stops[i - 1].x, stops[i].y - stops[i - 1].y);
  return Math.ceil(length / cruiseSpeed * 2.5 + 30);
}

// LEGAL: ---- Deke's cargo runs: drop a crate on a mark out in the country, then land back here ----
export interface DropZone extends Point { id: string; name: string }
export const DROP_ZONES: DropZone[] = [
  { id:'boundary-meadows', name:'a hay field in Boundary Meadows', x:2300, y:1560 },
  { id:'north-shore', name:'a clearing on the north shore', x:2200, y:-860 },
  { id:'lakeridge-farm', name:'a farm track past Lakeridge', x:6300, y:1550 },
  { id:'outworks', name:'the Cicero Outworks yard', x:7300, y:150 },
  { id:'kestrel', name:'a clearing in Kestrel Woods', x:4950, y:-900 },
];
export const DROP_RADIUS = 90;
export const BULLSEYE_RADIUS = 35;

export type DropResult = 'bullseye' | 'hit' | 'miss';
export function dropResult(p: Point, zone: Point): DropResult {
  const d = Math.hypot(p.x - zone.x, p.y - zone.y);
  if(d <= BULLSEYE_RADIUS) return 'bullseye';
  if(d <= DROP_RADIUS) return 'hit';
  return 'miss';
}

export const AIRFIELD_PRICES = {
  lessonFee:150,
  charterFee:300,
  licenceRespect:10,
  cargoBase:900,
  // LEGAL: Per unit of distance from the strip, so far drops pay more.
  cargoPerUnit:0.25,
  bullseyeBonus:0.5,
  cargoHeat:6,
  missedDropHeat:10,
};

export function cargoPay(zone: Point, result: DropResult): number {
  if(result === 'miss') return 0;
  const distance = Math.hypot(zone.x - RUNWAY.x0, zone.y - RUNWAY.y);
  const base = AIRFIELD_PRICES.cargoBase + distance * AIRFIELD_PRICES.cargoPerUnit;
  return Math.round(base * (result === 'bullseye' ? 1 + AIRFIELD_PRICES.bullseyeBonus : 1) / 10) * 10;
}

// LEGAL: A different zone each run, never the same one twice in a row.
export function nextDropZone(previous: string | null, roll: number): DropZone {
  const pool = DROP_ZONES.filter(z => z.id !== previous);
  return pool[Math.min(pool.length - 1, Math.floor(roll * pool.length))];
}

// LEGAL: ---- Drawing: the strip, the apron, the hangar, the fuel tank and the windsock, round the gate ----
export function buildAirfield(THREE: typeof ThreeNamespace): ThreeNamespace.Group {
  const g = new THREE.Group();
  g.name = 'airfield';
  const materials = localMaterials(THREE);
  const mat = (key: string, color: string, roughness = 0.85, metalness = 0) => materials.standard(`airfield:${key}`, { color, roughness, metalness });
  const lit = (key: string, color: string) => materials.standard(`airfield:${key}`, { color:'#000000', emissive:color, emissiveIntensity:1 });
  const local = (p: Point) => ({ x:p.x - AIRFIELD_GATE.x, z:p.y - AIRFIELD_GATE.y });
  const put = (mesh: ThreeNamespace.Mesh, p: Point, y: number, shadow = true) => {
    const at = local(p);
    mesh.position.set(at.x, y, at.z); mesh.castShadow = shadow; mesh.receiveShadow = true;
    g.add(mesh);
    return mesh;
  };
  const flat = (w: number, d: number) => new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2);
  const runwayLength = RUNWAY.x1 - RUNWAY.x0, runwayMid = { x:(RUNWAY.x0 + RUNWAY.x1) / 2, y:RUNWAY.y };
  put(new THREE.Mesh(flat(runwayLength, RUNWAY.width), mat('tarmac', '#3a3c42', 0.95)), runwayMid, 0.14, false);
  for(let x = RUNWAY.x0 + 90; x < RUNWAY.x1 - 90; x += 60) put(new THREE.Mesh(flat(30, 2.4), mat('paint', '#f0efe8', 0.7)), { x, y:RUNWAY.y }, 0.2, false);
  for(const end of [RUNWAY.x0 + 24, RUNWAY.x1 - 24]){
    for(let i = -3; i <= 3; i++) put(new THREE.Mesh(flat(30, 6), mat('paint', '#f0efe8', 0.7)), { x:end, y:RUNWAY.y + i * 14 }, 0.2, false);
  }
  for(let x = RUNWAY.x0; x <= RUNWAY.x1; x += 70){
    for(const side of [-1, 1]) put(new THREE.Mesh(new THREE.BoxGeometry(2, 1.6, 2), lit('edge-light', '#fff4c8')), { x, y:RUNWAY.y + side * (RUNWAY.width / 2 + 4) }, 0.8, false);
  }
  put(new THREE.Mesh(flat(APRON.x1 - APRON.x0, APRON.y1 - APRON.y0 + 2), mat('apron', '#7a7c80', 0.95)), { x:HANGAR.x, y:(APRON.y0 + APRON.y1) / 2 }, 0.12, false);
  put(new THREE.Mesh(flat(150, 110), mat('gravel', '#8a8070', 1)), AIRFIELD_GATE, 0.1, false);
  addHangar(THREE, g, local({ x:HANGAR.x, y:HANGAR.y }));
  put(new THREE.Mesh(new THREE.CylinderGeometry(FUEL_TANK.r, FUEL_TANK.r, FUEL_TANK.h, 16), mat('fuel-tank', '#d8d4c8', 0.5, 0.3)), FUEL_TANK, FUEL_TANK.h / 2);
  put(new THREE.Mesh(new THREE.BoxGeometry(FUEL_TANK.r * 1.6, 1.2, FUEL_TANK.r * 2.2), mat('fuel-band', '#c0392b', 0.6)), FUEL_TANK, FUEL_TANK.h * 0.6);
  put(new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, metres(6), 8), mat('pole', '#d8d8d8', 0.5, 0.4)), WINDSOCK, metres(3));
  const sock = put(new THREE.Mesh(new THREE.ConeGeometry(4, 22, 12, 1, true), mat('windsock', '#e8742a', 0.7)), { x:WINDSOCK.x + 11, y:WINDSOCK.y }, metres(6) - 3);
  sock.rotation.z = Math.PI / 2;
  return g;
}

function addHangar(THREE: typeof ThreeNamespace, g: ThreeNamespace.Group, at: { x: number; z: number }): void {
  const hangar = new THREE.Group();
  hangar.name = 'airfield:hangar';
  hangar.position.set(at.x, 0, at.z);
  const model = placeModel('hangar');
  if(model) addPlaceModel(THREE, hangar, model, localMaterials(THREE), 'special:hangar');
  else {
    const shell = new THREE.Mesh(new THREE.BoxGeometry(HANGAR.w, HANGAR.h, HANGAR.d), new THREE.MeshStandardMaterial({ color:'#8f949c', roughness:0.5, metalness:0.4 }));
    shell.position.y = HANGAR.h / 2;
    const door = new THREE.Mesh(new THREE.BoxGeometry(HANGAR.w * 0.8, HANGAR.h * 0.8, 1), new THREE.MeshStandardMaterial({ color:'#1a1c20', roughness:0.9 }));
    door.position.set(0, HANGAR.h * 0.4, HANGAR.d / 2 + 0.5);
    [shell, door].forEach(mesh => { mesh.castShadow = true; mesh.receiveShadow = true; hangar.add(mesh); });
  }
  g.add(hangar);
}
