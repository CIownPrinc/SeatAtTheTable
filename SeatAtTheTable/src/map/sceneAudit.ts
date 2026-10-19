import type * as ThreeNamespace from 'three';
import { roadDeadEnds, roadLandSegments } from './mapModel';
import { auditFootprintsOnRoads, type AuditFootprint, type AuditIssue, type AuditRoad } from './worldAudit';

// LEGAL: The world audit run on what the renderer actually drew, not on the placement data. The
// LEGAL: data can be self-consistent and still disagree with the scene, which is how a world that
// LEGAL: passed every unit test drew buildings in the street. Dev builds run this after building
// LEGAL: the city and mark each problem in red; e2e/scene-audit.e2e.ts requires it to find none.

// LEGAL: Things that must stand on a lot, never in a carriageway. A whitelist: new buildings can't
// LEGAL: opt themselves out, and new scenery can't opt itself in.
export const BUILDING_PREFIXES = ['filler:', 'venture:', 'service:', 'property:', 'local:', 'amenity:', 'landmark:'];

export function auditRoads(): AuditRoad[] {
  const roads: AuditRoad[] = roadLandSegments().map(s => ({ name:s.road.name, width:s.road.width, path:s.path }));
  roadDeadEnds().forEach(end => roads.push({ name:`${end.road.name} turning circle`, width:end.road.width * 1.64, path:[end.point, end.point] }));
  return roads;
}

// LEGAL: Solid meshes only. Box3.setFromObject expands a Sprite by its scale on every axis, so a
// LEGAL: food cart's name label once gave it a 4,000-unit footprint.
export function measureFootprints(THREE: typeof ThreeNamespace, worldGroup: ThreeNamespace.Group, prefixes: string[]): AuditFootprint[] {
  const footprints: AuditFootprint[] = [];
  worldGroup.children.forEach(function(child){
    if(!prefixes.some(prefix => child.name.startsWith(prefix))) return;
    child.updateWorldMatrix(true, true);
    const box = new THREE.Box3();
    child.traverse(function(node){
      const mesh = node as ThreeNamespace.Mesh;
      if(!mesh.isMesh || !mesh.geometry) return;
      const instanced = mesh as ThreeNamespace.InstancedMesh;
      if(instanced.isInstancedMesh){
        instanced.computeBoundingBox();
        if(instanced.boundingBox) box.union(instanced.boundingBox.clone().applyMatrix4(instanced.matrixWorld));
        return;
      }
      if(!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
      if(mesh.geometry.boundingBox) box.union(mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld));
    });
    if(box.isEmpty() || !isFinite(box.min.x)) return;
    footprints.push({ name:child.name, minX:box.min.x, maxX:box.max.x, minZ:box.min.z, maxZ:box.max.z });
  });
  return footprints;
}

export function auditScene(THREE: typeof ThreeNamespace, worldGroup: ThreeNamespace.Group): AuditIssue[] {
  const issues = auditFootprintsOnRoads(measureFootprints(THREE, worldGroup, BUILDING_PREFIXES), auditRoads());
  // LEGAL: No hairlines: 1-pixel THREE.Line strokes alias and flicker, and were the source of
  // LEGAL: the stray lines across the water.
  worldGroup.traverse(function(node){
    const line = node as ThreeNamespace.Line;
    if(!line.isLine) return;
    const at = new THREE.Vector3();
    line.getWorldPosition(at);
    let owner: ThreeNamespace.Object3D = line;
    while(owner.parent && owner.parent !== worldGroup) owner = owner.parent;
    issues.push({ kind:'hairline', message:`hairline stroke in ${owner.name || 'an unnamed object'}`, at:{ x:at.x, y:at.z } });
  });
  return issues;
}

// LEGAL: A tall red beacon at each problem, so it's obvious on the map where to look.
export function flagIssues(THREE: typeof ThreeNamespace, worldGroup: ThreeNamespace.Group, issues: AuditIssue[]): void {
  const material = new THREE.MeshBasicMaterial({ color:'#ff2a2a', transparent:true, opacity:0.55, depthWrite:false });
  const geometry = new THREE.CylinderGeometry(10, 10, 220, 10);
  issues.forEach(function(issue){
    const beacon = new THREE.Mesh(geometry, material);
    beacon.position.set(issue.at.x, 110, issue.at.y);
    beacon.name = `audit:${issue.kind}`;
    beacon.renderOrder = 20;
    worldGroup.add(beacon);
  });
}
