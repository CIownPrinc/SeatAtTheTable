import type * as ThreeNamespace from 'three';
import type { Point } from '../config/types';

// LEGAL: A flat strip that follows a path: roads, lanes, paths. The old renderer laid one rectangle
// LEGAL: per straight piece, which left wedge gaps on the outside of every bend, overlapped on the
// LEGAL: inside (and the overlaps strobed), and cost a mesh per piece. This is one mesh with mitred
// LEGAL: joints. `capEnd` adds a round turning circle of that radius past the last point.
export interface RibbonOptions { capEnd?: number; capStart?: number }

// LEGAL: A mitre on a near-reverse bend would shoot off to infinity; past this it's clamped.
const MAX_MITRE = 2.2;

export function ribbonGeometry(THREE: typeof ThreeNamespace, points: Point[], width: number, height: number, options: RibbonOptions = {}): ThreeNamespace.BufferGeometry {
  const half = width / 2;
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  let travelled = 0;
  points.forEach(function(point, i){
    const prev = points[Math.max(0, i - 1)];
    const next = points[Math.min(points.length - 1, i + 1)];
    if(i > 0) travelled += Math.hypot(point.x - prev.x, point.y - prev.y);
    // LEGAL: Average of the incoming and outgoing directions; the normal to it is the mitre line.
    const inX = point.x - prev.x, inY = point.y - prev.y;
    const outX = next.x - point.x, outY = next.y - point.y;
    const inLen = Math.hypot(inX, inY) || 1, outLen = Math.hypot(outX, outY) || 1;
    let tx = (i > 0 ? inX / inLen : 0) + (i < points.length - 1 ? outX / outLen : 0);
    let ty = (i > 0 ? inY / inLen : 0) + (i < points.length - 1 ? outY / outLen : 0);
    const tLen = Math.hypot(tx, ty) || 1;
    tx /= tLen; ty /= tLen;
    const nx = -ty, ny = tx;
    // LEGAL: Lengthen the mitre so the strip keeps its full width through the bend.
    const segX = i < points.length - 1 ? outX / outLen : inX / inLen;
    const segY = i < points.length - 1 ? outY / outLen : inY / inLen;
    const cos = Math.abs(nx * -segY + ny * segX) || 1;
    const reach = half * Math.min(MAX_MITRE, 1 / cos);
    vertices.push(point.x + nx * reach, height, point.y + ny * reach, point.x - nx * reach, height, point.y - ny * reach);
    uvs.push(travelled / width, 0, travelled / width, 1);
    if(i > 0){
      const a = (i - 1) * 2;
      indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  });

  function cap(at: Point, from: Point, radius: number): void {
    // LEGAL: A disc of triangles centred on the end point: the turning circle at a dead end.
    const dx = at.x - from.x, dy = at.y - from.y;
    const len = Math.hypot(dx, dy) || 1;
    const fx = dx / len, fy = dy / len;
    const centerX = at.x, centerY = at.y;
    const centre = vertices.length / 3;
    vertices.push(centerX, height, centerY);
    uvs.push(0.5, 0.5);
    const steps = 16;
    for(let s = 0; s <= steps; s++){
      const angle = Math.atan2(fy, fx) - Math.PI / 2 + (s / steps) * Math.PI * 2;
      vertices.push(centerX + Math.cos(angle) * radius, height, centerY + Math.sin(angle) * radius);
      uvs.push(0.5 + Math.cos(angle) * 0.5, 0.5 + Math.sin(angle) * 0.5);
      if(s > 0) indices.push(centre, centre + s + 1, centre + s);
    }
  }
  if(options.capEnd && points.length > 1) cap(points[points.length - 1], points[points.length - 2], options.capEnd);
  if(options.capStart && points.length > 1) cap(points[0], points[1], options.capStart);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  // LEGAL: The winding above faces down for some bends; force every normal up so lighting is even.
  const normals = geometry.getAttribute('normal');
  for(let i = 0; i < normals.count; i++) normals.setXYZ(i, 0, 1, 0);
  return geometry;
}
