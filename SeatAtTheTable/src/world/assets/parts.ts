import type * as ThreeNamespace from 'three';

// LEGAL: The paint a Blender part was given: what the game uses for that part unless it recolours it.
export interface PartPaint { color: number; roughness: number; metalness: number; emissive?: number; emissiveIntensity?: number }
export interface ModelPart { geometry: ThreeNamespace.BufferGeometry; paint: PartPaint }
export type PartModel = ReadonlyMap<string, ModelPart>;

// LEGAL: Loads a Blender export whose parts are named by their material ('part-<name>', see
// LEGAL: art/blender/lib/kit.py) and returns each part as a plain float geometry in model space,
// LEGAL: with the paint it was given. The game then draws them with its own materials. Quantized
// LEGAL: exports store positions as normalised integers, which can't be transformed in place, so
// LEGAL: everything is copied to floats. Null when the file is missing or broken.
export async function loadPartModel(THREE: typeof ThreeNamespace, url: string): Promise<Map<string, ModelPart> | null> {
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  try {
    const gltf = await new GLTFLoader().loadAsync(url);
    const parts = new Map<string, ModelPart>();
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse(function(node){
      const mesh = node as ThreeNamespace.Mesh;
      if(!mesh.isMesh || !mesh.name.startsWith('part-')) return;
      const geometry = new THREE.BufferGeometry();
      ['position', 'normal'].forEach(function(name){
        const source = mesh.geometry.getAttribute(name);
        if(!source) return;
        const values = new Float32Array(source.count * 3);
        for(let i = 0; i < source.count; i++){ values[i * 3] = source.getX(i); values[i * 3 + 1] = source.getY(i); values[i * 3 + 2] = source.getZ(i); }
        geometry.setAttribute(name, new THREE.BufferAttribute(values, 3));
      });
      if(mesh.geometry.index) geometry.setIndex(Array.from(mesh.geometry.index.array as ArrayLike<number>));
      geometry.applyMatrix4(mesh.matrixWorld);
      geometry.computeBoundingSphere();
      const source = mesh.material as ThreeNamespace.MeshStandardMaterial;
      const lit = source.emissive && source.emissive.getHex() !== 0;
      parts.set(mesh.name.slice('part-'.length), {
        geometry,
        paint:{
          color:source.color?.getHex() ?? 0xffffff, roughness:source.roughness ?? 0.8, metalness:source.metalness ?? 0,
          ...(lit ? { emissive:source.emissive.getHex(), emissiveIntensity:source.emissiveIntensity ?? 1 } : {}),
        },
      });
    });
    return parts;
  } catch {
    return null;
  }
}

// LEGAL: Just the geometries, for callers that paint every part themselves.
export async function loadPartGeometries(THREE: typeof ThreeNamespace, url: string): Promise<Map<string, ThreeNamespace.BufferGeometry> | null> {
  const model = await loadPartModel(THREE, url);
  return model ? new Map([...model].map(([name, part]) => [name, part.geometry])) : null;
}
