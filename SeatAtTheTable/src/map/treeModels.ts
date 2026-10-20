import type * as ThreeNamespace from 'three';

// LEGAL: The Blender trees (art/blender/trees.py): a broadleaf for streets, parks and yards, and a
// LEGAL: pine for the forests. Each is a bark and a leaves geometry standing on the ground at the
// LEGAL: origin, drawn with the game's own materials (so settling snow still finds the leaves).
// LEGAL: Null until loaded; every caller falls back to its own simple shape.
export type TreeKind = 'broadleaf' | 'pine';
export interface TreeShape { bark: ThreeNamespace.BufferGeometry; leaves: ThreeNamespace.BufferGeometry }

let shapes: Partial<Record<TreeKind, TreeShape>> = {};
export function useTreeShapes(loaded: Partial<Record<TreeKind, TreeShape>>): void { shapes = loaded; }
export function treeShape(kind: TreeKind): TreeShape | null { return shapes[kind] ?? null; }

export interface TreePlacement { x: number; z: number; size: number; rot: number }

// LEGAL: A whole stand of one kind of tree as two InstancedMeshes, each tree its own size and turn.
export function instancedTrees(THREE: typeof ThreeNamespace, shape: TreeShape, bark: ThreeNamespace.Material, leaves: ThreeNamespace.Material, trees: readonly TreePlacement[]): ThreeNamespace.InstancedMesh[] {
  return ([[shape.bark, bark], [shape.leaves, leaves]] as const).map(function([geometry, material]){
    const mesh = new THREE.InstancedMesh(geometry, material, trees.length);
    const matrix = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    trees.forEach(function(tree, i){
      matrix.compose(new THREE.Vector3(tree.x, 0, tree.z), q.setFromAxisAngle(up, tree.rot), new THREE.Vector3(tree.size, tree.size, tree.size));
      mesh.setMatrixAt(i, matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
    mesh.castShadow = true; mesh.receiveShadow = true;
    return mesh;
  });
}
