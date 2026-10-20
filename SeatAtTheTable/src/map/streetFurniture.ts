import { STREET_FURNITURE_SCALE } from './scale';
import type * as ThreeNamespace from 'three';
import type { SignalState } from './trafficRules';

export interface LampHead { x: number; y: number; z: number }

export interface StreetFurnitureOptions {
  THREE: typeof ThreeNamespace;
  worldGroup: ThreeNamespace.Group;
  streetLamps: LampHead[];
}

// LEGAL: The city has dozens of lamps, but every real light is compiled into every lit
// LEGAL: shader and paid for on every pixel. So a small, fixed pool of lights moves to the
// LEGAL: lamps nearest the player; the rest glow (emissive bulbs) without lighting the road.
export function nearestLamps(lamps: LampHead[], x: number, z: number, count: number): LampHead[] {
  return [...lamps]
    .sort((a, b) => Math.hypot(a.x - x, a.z - z) - Math.hypot(b.x - x, b.z - z))
    .slice(0, count);
}

// LEGAL: One material per finish, shared by every pole and arm in the city, so the static furniture
// LEGAL: merges into a few meshes instead of one per part.
const finishes = new Map<string, ThreeNamespace.MeshStandardMaterial>();
function finish(THREE: typeof ThreeNamespace, color: number | string, roughness: number, metalness: number): ThreeNamespace.MeshStandardMaterial {
  const key = `${color}:${roughness}:${metalness}`;
  let material = finishes.get(key);
  if(!material){ material = new THREE.MeshStandardMaterial({ color, roughness, metalness }); finishes.set(key, material); }
  return material;
}

function box(THREE: typeof ThreeNamespace, w: number, h: number, d: number, color: number | string): ThreeNamespace.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), finish(THREE, color, 0.85, 0.05));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// LEGAL: One bulb material for every street lamp, so the day/night cycle can switch them all off
// LEGAL: in daylight with a single change (each lamp used to glow at full strength at noon).
let bulbMaterial: import('three').MeshStandardMaterial | null = null;
export function streetLampBulbs(THREE: typeof import('three')): import('three').MeshStandardMaterial {
  if(!bulbMaterial) bulbMaterial = new THREE.MeshStandardMaterial({ color:'#ffe6a0', emissive:'#ffd27a', emissiveIntensity:1.4 });
  return bulbMaterial;
}

// LEGAL: `toward` is the point the arm reaches out over, normally the middle of the junction.
export function buildStreetLight(options: StreetFurnitureOptions, x: number, z: number, toward: { x: number; z: number }): void {
  const { THREE, worldGroup, streetLamps } = options;
  const group = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(1.3,1.8,34,8), finish(THREE, '#3b3e47', 0.55, 0.4));
  pole.position.set(0,17,0); pole.castShadow=true; group.add(pole);
  const arm = box(THREE, 14,1.8,1.8,'#3b3e47');
  arm.position.set(6,33,0); group.add(arm);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(3.2,10,8), streetLampBulbs(THREE));
  bulb.position.set(13,32,0); group.add(bulb);
  // LEGAL: The arm is built along +X; turn it to point at `toward` so the lamp hangs over the road.
  const angle = Math.atan2(toward.z - z, toward.x - x);
  group.rotation.y = -angle;
  group.position.set(x,0,z);
  group.scale.setScalar(STREET_FURNITURE_SCALE);
  worldGroup.add(group);
  streetLamps.push({ x: x + Math.cos(angle) * 13 * STREET_FURNITURE_SCALE, y: 32 * STREET_FURNITURE_SCALE, z: z + Math.sin(angle) * 13 * STREET_FURNITURE_SCALE });
}

// LEGAL: A signal pole on the junction's north-east corner with two heads: one on an arm over the
// LEGAL: north-south street and one over the east-west street. Each head has one lamp, which
// LEGAL: showSignal moves to the red, amber or green slot and colours to match.
export interface SignalHeads { junction: { x: number; y: number }; ns: ThreeNamespace.Mesh; ew: ThreeNamespace.Mesh; shown: { ns: SignalState | null; ew: SignalState | null } }

const SLOT: Record<SignalState, { y: number; color: string }> = {
  red:{ y:5, color:'#ff3b30' }, amber:{ y:0, color:'#ffb000' }, green:{ y:-5, color:'#2fd36f' },
};

export function buildTrafficLight(options: StreetFurnitureOptions, x: number, z: number, junction: { x: number; y: number }): SignalHeads {
  const { THREE, worldGroup } = options;
  const group = new THREE.Group();
  const dark = '#2f333c';
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(1,1.4,30,8), finish(THREE, dark, 0.5, 0.5));
  pole.position.set(0,15,0); pole.castShadow=true; group.add(pole);
  const westArm = box(THREE, 22,2,2,dark); westArm.position.set(-10,29,0); group.add(westArm);
  const southArm = box(THREE, 2,2,22,dark); southArm.position.set(0,27,10); group.add(southArm);
  const nsHousing = box(THREE, 7,18,5,'#1b1d23'); nsHousing.position.set(-22,24,0); group.add(nsHousing);
  const ewHousing = box(THREE, 5,18,7,'#1b1d23'); ewHousing.position.set(0,22,22); group.add(ewHousing);
  const lamp = (px: number, py: number, pz: number) => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(2.3,10,8), new THREE.MeshStandardMaterial({color:SLOT.red.color, emissive:SLOT.red.color, emissiveIntensity:1.2}));
    mesh.position.set(px, py, pz);
    mesh.userData.baseY = py;
    group.add(mesh);
    return mesh;
  };
  // LEGAL: The north-south head faces the traffic coming up from the south; the east-west head
  // LEGAL: faces the traffic coming from the east.
  const ns = lamp(-22, 24, 2.7);
  const ew = lamp(2.7, 22, 22);
  group.position.set(x,0,z); group.scale.setScalar(STREET_FURNITURE_SCALE);
  // LEGAL: Its own name, so the static street merge leaves it alone: its lamps move and change colour.
  group.name = `signal:${Math.round(junction.x)},${Math.round(junction.y)}`;
  worldGroup.add(group);
  return { junction, ns, ew, shown:{ ns:null, ew:null } };
}

export function showSignal(heads: SignalHeads, axis: 'ns' | 'ew', state: SignalState): void {
  if(heads.shown[axis] === state) return;
  heads.shown[axis] = state;
  const lamp = heads[axis];
  lamp.position.y = (lamp.userData.baseY as number) + SLOT[state].y;
  const material = lamp.material as ThreeNamespace.MeshStandardMaterial;
  material.color.set(SLOT[state].color);
  material.emissive.set(SLOT[state].color);
}

// LEGAL: Every junction is signalled (map/trafficRules), so each has a working light and no stop
// LEGAL: sign: a stop sign under a traffic light would say two different things.
export function buildIntersectionFurniture(options: StreetFurnitureOptions, x: number, z: number): SignalHeads {
  buildStreetLight(options, x - 46, z - 46, { x, z });
  buildStreetLight(options, x + 46, z + 46, { x, z });
  return buildTrafficLight(options, x + 42, z - 42, { x, y:z });
}
