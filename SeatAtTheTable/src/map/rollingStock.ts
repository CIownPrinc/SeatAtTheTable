import type * as ThreeNamespace from 'three';
import type { PartModel } from '../world/assets/parts';
import { addPlaceModel, localMaterials, placeModel } from './placeModels';
import { UNITS_PER_METRE } from './scale';

// LEGAL: The freight line's trains and the railyard's wagons, at real size and from one set of
// LEGAL: numbers. The line's train was four boxes 1.7 m tall, shorter than Arjun, and the yard's
// LEGAL: wagons were under 2 m long. Lengths are buffer to buffer; heights from the ground to the roof.
export interface CarSize { length: number; width: number; height: number }

const metres = (m: number) => m * UNITS_PER_METRE;

export const FREIGHT_WAGON: CarSize = { length:metres(14.5), width:metres(3), height:metres(4.2) };
export const LOCOMOTIVE: CarSize = { length:metres(19), width:metres(3.1), height:metres(4.6) };
export const COUPLING_GAP = metres(1);

export type CarKind = 'locomotive' | 'wagon';
export const WAGON_COLOURS = ['#7a3b2a', '#3e5a6a', '#5a5a3a', '#6a4a2a'];

// LEGAL: The line's train, front first. It runs north to south, so the front is its +y end.
export const LINE_TRAIN: CarKind[] = ['locomotive', 'wagon', 'wagon', 'wagon', 'wagon'];

export function carSize(kind: CarKind): CarSize {
  return kind === 'locomotive' ? LOCOMOTIVE : FREIGHT_WAGON;
}

export function trainLength(cars: readonly CarKind[]): number {
  return cars.reduce((sum, kind) => sum + carSize(kind).length, 0) + COUPLING_GAP * (cars.length - 1);
}

// LEGAL: Each car's centre, measured from the train's centre toward its front.
export function carOffsets(cars: readonly CarKind[]): number[] {
  let front = trainLength(cars) / 2;
  return cars.map(function(kind){
    const length = carSize(kind).length;
    const centre = front - length / 2;
    front -= length + COUPLING_GAP;
    return centre;
  });
}

export const TRAIN_HALF_LENGTH = trainLength(LINE_TRAIN) / 2;
export const TRAIN_HALF_WIDTH = Math.max(FREIGHT_WAGON.width, LOCOMOTIVE.width) / 2;

// LEGAL: One car standing at its origin, its length along z and its front toward +z. The Blender model
// LEGAL: (art/blender/places.py) is fitted to the size above, so the two can't drift apart; until it
// LEGAL: loads, and in tests, it's drawn from boxes.
// LEGAL: Each kind and colour is built and fitted once, then copied: fitting every car of the train and
// LEGAL: the yard on its own added a quarter of a second to opening the map.
const built = new Map<string, ThreeNamespace.Group>();
export function buildCar(THREE: typeof ThreeNamespace, kind: CarKind, colour: string): ThreeNamespace.Group {
  const model = placeModel(kind === 'locomotive' ? 'locomotive' : 'freight-wagon');
  const key = `${kind}|${kind === 'wagon' ? colour : ''}|${model ? 'model' : 'shapes'}`;
  let template = built.get(key);
  if(!template){
    template = new THREE.Group();
    template.name = `rolling-stock:${kind}`;
    if(model) addFittedModel(THREE, template, model, carSize(kind), kind === 'wagon' ? { body:colour } : {});
    else addCarShapes(THREE, template, kind, colour);
    built.set(key, template);
  }
  return template.clone();
}

function addFittedModel(THREE: typeof ThreeNamespace, group: ThreeNamespace.Group, model: PartModel, size: CarSize, recolour: Record<string, string>): void {
  const holder = new THREE.Group();
  addPlaceModel(THREE, holder, model, localMaterials(THREE), 'rolling-stock', recolour);
  const box = new THREE.Box3().setFromObject(holder);
  const extent = box.getSize(new THREE.Vector3());
  holder.scale.set(size.width / (extent.x || 1), size.height / (extent.y || 1), size.length / (extent.z || 1));
  holder.position.y = -box.min.y * holder.scale.y;
  group.add(holder);
}

function addCarShapes(THREE: typeof ThreeNamespace, group: ThreeNamespace.Group, kind: CarKind, colour: string): void {
  const size = carSize(kind);
  const add = (w: number, h: number, d: number, color: string, x: number, y: number, z: number) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color, roughness:0.7 }));
    mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true;
    group.add(mesh);
  };
  const deck = metres(1.2);
  for(const end of [-1, 1]) add(size.width * 0.8, metres(0.9), metres(2.6), '#1e1e20', 0, metres(0.5), end * (size.length / 2 - metres(2.4)));
  add(size.width * 0.9, metres(0.3), size.length, '#2a2a2a', 0, deck - metres(0.15), 0);
  if(kind === 'wagon'){
    add(size.width, size.height - deck, size.length - metres(0.4), colour, 0, (size.height + deck) / 2, 0);
    return;
  }
  const cab = metres(3.2);
  add(size.width * 0.82, size.height - deck - metres(0.6), size.length - cab - metres(1.2), '#c8a028', 0, (size.height + deck - metres(0.6)) / 2, -cab / 2);
  add(size.width, size.height - deck, cab, '#2f4a6a', 0, (size.height + deck) / 2, size.length / 2 - cab / 2 - metres(0.6));
}
