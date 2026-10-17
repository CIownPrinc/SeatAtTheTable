import type { Object3D } from 'three';

// LEGAL: Only groups confirmed to never move after the city is built. Places, actors, the train
// LEGAL: and rail-and-river stay live: markers, doors and vehicles in them change every frame.
const STATIC_SCENERY_PREFIXES: ReadonlySet<string> = new Set(['terrain', 'road', 'bridge', 'tree', 'outskirt', 'resort', 'filler', 'landmark']);

function sceneryPrefix(object: Object3D): string {
  return object.name.split(':')[0] ?? '';
}

export function freezeStaticScenery(worldGroup: Object3D): void {
  worldGroup.children.forEach(function(child){
    if(!STATIC_SCENERY_PREFIXES.has(sceneryPrefix(child))) return;
    child.updateMatrixWorld(true);
    child.traverse(function(object){
      object.matrixAutoUpdate = false;
      object.matrixWorldAutoUpdate = false;
    });
  });
}
