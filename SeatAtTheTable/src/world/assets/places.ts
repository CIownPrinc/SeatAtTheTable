import type * as ThreeNamespace from 'three';
import { loadPartModel, type PartModel } from './parts';

// LEGAL: The Blender places (art/blender/places.py): the suburb's house, the countryside's buildings,
// LEGAL: the building-site pieces, the mall and the one-of-a-kind places. A model that fails to load
// LEGAL: is left out, and whatever draws it falls back to its own shapes.
export const PLACE_MODELS = [
  'house', 'farmhouse', 'barn', 'silo', 'shed', 'tank',
  'site-cabin', 'site-toilet', 'crane-mast', 'crane-jib', 'crane-head',
  'mall', 'mall-garage',
  'airfield', 'docks', 'railyard', 'drive-in', 'lodge', 'motel',
] as const;
// LEGAL: Room furniture and the minigames' set pieces (art/blender/furniture.py).
export const FURNITURE_MODELS = [
  'counter', 'notice-board', 'safe', 'vault-door', 'plan-table', 'wardrobe', 'workbench', 'slot-machine', 'card-table',
  'war-table', 'office-desk', 'lockers', 'potted-plant', 'tyre-stack', 'column', 'shop-shelf', 'tool-chest', 'filing-cabinet',
  'fountain', 'perfume-kiosk', 'ice-cream-cart', 'food-counter', 'food-table', 'climbing-frame', 'ball-pit', 'mall-bench', 'planter',
  'hoop', 'chess-table',
] as const;
export type FurnitureName = typeof FURNITURE_MODELS[number];
export type PlaceModelName = typeof PLACE_MODELS[number] | FurnitureName;

export async function loadPlaceModels(THREE: typeof ThreeNamespace): Promise<Map<PlaceModelName, PartModel>> {
  const wanted: Array<[PlaceModelName, string]> = [
    ...PLACE_MODELS.map((name): [PlaceModelName, string] => [name, `/assets/world/places/${name}.glb`]),
    ...FURNITURE_MODELS.map((name): [PlaceModelName, string] => [name, `/assets/world/furniture/${name}.glb`]),
  ];
  const loaded = await Promise.all(wanted.map(([, url]) => loadPartModel(THREE, url)));
  const models = new Map<PlaceModelName, PartModel>();
  loaded.forEach(function(model, i){ if(model) models.set(wanted[i][0], model); });
  return models;
}
