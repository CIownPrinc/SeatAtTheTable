import type * as ThreeNamespace from 'three';

// LEGAL: One-off Blender models (the landmarks): loaded by name, cloned where they stand. Modelled
// LEGAL: front-to-+Y in Blender, which exports as -Z; the game's fronts face +Z, so half a turn.
export interface ModelCatalog {
  create(name: string): ThreeNamespace.Group | null;
}

export async function loadModelCatalog(THREE: typeof ThreeNamespace, base: string, names: readonly string[]): Promise<ModelCatalog | null> {
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const loader = new GLTFLoader();
  const models = new Map<string, ThreeNamespace.Group>();
  try {
    await Promise.all(names.map(async function(name){ models.set(name, (await loader.loadAsync(`${base}${name}.glb`)).scene); }));
  } catch {
    return null;
  }
  return {
    create(name){
      const model = models.get(name);
      if(!model) return null;
      const clone = model.clone(true);
      clone.traverse(function(node){ const mesh = node as ThreeNamespace.Mesh; if(mesh.isMesh){ mesh.castShadow = true; mesh.receiveShadow = true; } });
      const turned = new THREE.Group();
      turned.rotation.y = Math.PI;
      turned.add(clone);
      const wrapper = new THREE.Group();
      wrapper.name = `model:${name}`;
      wrapper.add(turned);
      return wrapper;
    },
  };
}

export const LANDMARK_MODELS = ['water-tower', 'dome', 'potato'] as const;
