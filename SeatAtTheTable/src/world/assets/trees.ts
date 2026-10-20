import type * as ThreeNamespace from 'three';
import type { TreeKind, TreeShape } from '../../map/treeModels';
import { loadPartGeometries } from './parts';

export async function loadTreeShapes(THREE: typeof ThreeNamespace): Promise<Partial<Record<TreeKind, TreeShape>>> {
  const kinds: TreeKind[] = ['broadleaf', 'pine'];
  const loaded = await Promise.all(kinds.map(kind => loadPartGeometries(THREE, `/assets/world/trees/${kind}.glb`)));
  const shapes: Partial<Record<TreeKind, TreeShape>> = {};
  kinds.forEach(function(kind, i){
    const parts = loaded[i];
    const bark = parts?.get('bark'), leaves = parts?.get('leaves');
    if(bark && leaves) shapes[kind] = { bark, leaves };
  });
  return shapes;
}
