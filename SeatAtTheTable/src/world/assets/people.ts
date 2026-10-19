import type * as ThreeNamespace from 'three';

// LEGAL: The person's sculpted parts (art/blender/people.py), keyed by the same names as the code's
// LEGAL: primitives in map/personModel.ts. Each comes back as a plain float geometry in the part's
// LEGAL: own space, ready to be dropped in for that key.
export async function loadPersonGeometries(THREE: typeof ThreeNamespace): Promise<Map<string, ThreeNamespace.BufferGeometry> | null> {
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  try {
    const gltf = await new GLTFLoader().loadAsync('/assets/world/people/person-parts.glb');
    const parts = new Map<string, ThreeNamespace.BufferGeometry>();
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse(function(node){
      const mesh = node as ThreeNamespace.Mesh;
      if(!mesh.isMesh || !mesh.name.startsWith('part-')) return;
      // LEGAL: Quantized exports store positions as normalised integers; transforming those in place
      // LEGAL: would clip them, so every attribute is copied out as floats first.
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
      parts.set(mesh.name.slice('part-'.length).replace('__', ':'), geometry);
    });
    return parts;
  } catch {
    return null;
  }
}
