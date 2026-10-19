import type * as ThreeNamespace from 'three';
import type { PropKind, StreetProp } from '../data/streetProps';

// LEGAL: The street-furniture catalog (art/blender/props.py), drawn instanced: every bench in the city
// LEGAL: is one InstancedMesh per material, so a few hundred props cost a couple of dozen draw calls.
export const PROP_KINDS: PropKind[] = ['bench', 'bin', 'hydrant', 'shelter', 'mailbox', 'planter'];
const PROP_BASE = '/assets/world/props/';

export interface PropLibrary {
  instanced(props: readonly StreetProp[]): ThreeNamespace.Group;
}

export async function loadPropLibrary(THREE: typeof ThreeNamespace): Promise<PropLibrary | null> {
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const loader = new GLTFLoader();
  const models = new Map<PropKind, ThreeNamespace.Group>();
  try {
    await Promise.all(PROP_KINDS.map(async function(kind){ models.set(kind, (await loader.loadAsync(`${PROP_BASE}${kind}.glb`)).scene); }));
  } catch {
    return null;
  }
  return {
    instanced(props){
      const group = new THREE.Group();
      group.name = 'props:street';
      // LEGAL: Modelled front-to-+Y in Blender, which exports as -Z; props face +Z, so half a turn.
      const turn = new THREE.Matrix4().makeRotationY(Math.PI);
      PROP_KINDS.forEach(function(kind){
        const list = props.filter(p => p.kind === kind);
        if(!list.length) return;
        const scene = models.get(kind)!;
        scene.updateMatrixWorld(true);
        scene.traverse(function(node){
          const mesh = node as ThreeNamespace.Mesh;
          if(!mesh.isMesh) return;
          const instances = new THREE.InstancedMesh(mesh.geometry, mesh.material, list.length);
          instances.castShadow = true; instances.receiveShadow = true;
          const matrix = new THREE.Matrix4();
          list.forEach(function(prop, i){
            const place = new THREE.Matrix4().makeTranslation(prop.x, 0, prop.y).multiply(new THREE.Matrix4().makeRotationY(prop.rot)).multiply(turn);
            instances.setMatrixAt(i, matrix.multiplyMatrices(place, mesh.matrixWorld));
          });
          instances.instanceMatrix.needsUpdate = true;
          instances.computeBoundingSphere();
          instances.name = `prop:${kind}`;
          group.add(instances);
        });
      });
      return group;
    },
  };
}
