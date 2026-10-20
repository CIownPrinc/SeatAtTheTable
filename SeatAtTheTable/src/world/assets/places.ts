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
export type PlaceModelName = typeof PLACE_MODELS[number];

export async function loadPlaceModels(THREE: typeof ThreeNamespace): Promise<Map<PlaceModelName, PartModel>> {
  const loaded = await Promise.all(PLACE_MODELS.map(name => loadPartModel(THREE, `/assets/world/places/${name}.glb`)));
  const models = new Map<PlaceModelName, PartModel>();
  loaded.forEach(function(model, i){ if(model) models.set(PLACE_MODELS[i], model); });
  return models;
}
