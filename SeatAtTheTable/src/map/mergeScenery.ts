import type { BufferGeometry, Material, Mesh, Object3D } from 'three';

type ThreeModule = typeof import('three');
export type MergeGeometries = (geometries: BufferGeometry[], useGroups?: boolean) => BufferGeometry | null;

interface MaterialBatch {
  geometries: BufferGeometry[];
  castShadow: boolean;
  receiveShadow: boolean;
}

function collectPlainMeshes(group: Object3D): Mesh[] | null {
  const meshes: Mesh[] = [];
  let mergeable = true;
  group.traverse(function(object){
    if(object === group) return;
    const mesh = object as Mesh;
    if(mesh.isMesh && !Array.isArray(mesh.material) && !(object as { isInstancedMesh?: boolean }).isInstancedMesh){ meshes.push(mesh); return; }
    if(object.type !== 'Group' && object.type !== 'Object3D') mergeable = false;
  });
  return mergeable ? meshes : null;
}

function sharedAttributeNames(geometries: BufferGeometry[]): string[] {
  const first = geometries[0];
  if(!first) return [];
  return Object.keys(first.attributes).filter(function(name){
    return geometries.every(function(geometry){ return geometry.getAttribute(name) !== undefined; });
  });
}

function normaliseForMerge(geometries: BufferGeometry[]): BufferGeometry[] {
  const keep = new Set(sharedAttributeNames(geometries));
  const mixedIndexing = geometries.some(function(g){ return g.index; }) && geometries.some(function(g){ return !g.index; });
  return geometries.map(function(geometry){
    const prepared = mixedIndexing && geometry.index ? geometry.toNonIndexed() : geometry;
    Object.keys(prepared.attributes).forEach(function(name){ if(!keep.has(name)) prepared.deleteAttribute(name); });
    return prepared;
  });
}

// LEGAL: Draw calls, not triangles, are what this city is bound by: a palm was ~43 separate
// LEGAL: meshes. Merging within ONE group keeps each palm its own object, so the scene audit
// LEGAL: still checks every palm's footprint against the water individually.
export function mergeMeshesWithin(THREE: ThreeModule, group: Object3D, merge: MergeGeometries): boolean {
  const meshes = collectPlainMeshes(group);
  if(!meshes || meshes.length < 2) return false;
  group.updateMatrixWorld(true);
  const toGroupSpace = new THREE.Matrix4().copy(group.matrixWorld).invert();
  const batches = new Map<Material, MaterialBatch>();
  meshes.forEach(function(mesh){
    const material = mesh.material as Material;
    const batch = batches.get(material) ?? { geometries:[], castShadow:false, receiveShadow:false };
    const local = new THREE.Matrix4().multiplyMatrices(toGroupSpace, mesh.matrixWorld);
    batch.geometries.push(mesh.geometry.clone().applyMatrix4(local));
    batch.castShadow = batch.castShadow || mesh.castShadow;
    batch.receiveShadow = batch.receiveShadow || mesh.receiveShadow;
    batches.set(material, batch);
  });
  const merged: Mesh[] = [];
  for(const [material, batch] of batches){
    const geometry = merge(normaliseForMerge(batch.geometries));
    if(!geometry) return false;
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = batch.castShadow;
    mesh.receiveShadow = batch.receiveShadow;
    merged.push(mesh);
  }
  group.clear();
  merged.forEach(function(mesh){ group.add(mesh); });
  return true;
}
