import type * as ThreeNamespace from 'three';

// LEGAL: Loads a Blender export whose parts are named by their material ('part-<name>', see
// LEGAL: art/blender/lib/kit.py) and returns each part as a plain float geometry in model space.
// LEGAL: The game then draws them with its own materials. Quantized exports store positions as
// LEGAL: normalised integers, which can't be transformed in place, so everything is copied to floats.
export async function loadPartGeometries(THREE: typeof ThreeNamespace, url: string): Promise<Map<string, ThreeNamespace.BufferGeometry> | null> {
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  try {
    const gltf = await new GLTFLoader().loadAsync(url);
    const parts = new Map<string, ThreeNamespace.BufferGeometry>();
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
      parts.set(mesh.name.slice('part-'.length), geometry);
    });
    return parts;
  } catch {
    return null;
  }
}
