import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { ribbonGeometry } from './ribbon';

function positions(geometry: THREE.BufferGeometry): THREE.Vector3[] {
  const attr = geometry.getAttribute('position');
  return Array.from({ length: attr.count }, (_, i) => new THREE.Vector3().fromBufferAttribute(attr, i));
}

describe('ribbonGeometry', function () {
  it('is one strip as wide as asked, lying flat at the given height', function () {
    const geometry = ribbonGeometry(THREE, [{ x: 0, y: 0 }, { x: 100, y: 0 }], 40, 0.06);
    const pts = positions(geometry);
    pts.forEach(p => expect(p.y).toBeCloseTo(0.06, 5));
    const zs = pts.map(p => p.z);
    expect(Math.max(...zs) - Math.min(...zs)).toBeCloseTo(40);
  });

  it('keeps its width through a bend, with no gap at the joint', function () {
    const geometry = ribbonGeometry(THREE, [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }], 40, 0);
    const pts = positions(geometry);
    // LEGAL: The joint's two edge vertices are shared by both legs, so there's nothing to see through.
    const atCorner = pts.filter(p => Math.hypot(p.x - 100, p.z) < 40);
    expect(atCorner.length).toBeGreaterThanOrEqual(2);
    atCorner.forEach(p => expect(Math.hypot(p.x - 100, p.z)).toBeLessThan(40 * 0.75));
  });

  it('can round off its ends for a turning circle', function () {
    const flat = ribbonGeometry(THREE, [{ x: 0, y: 0 }, { x: 100, y: 0 }], 40, 0);
    const capped = ribbonGeometry(THREE, [{ x: 0, y: 0 }, { x: 100, y: 0 }], 40, 0, { capEnd: 30 });
    const furthest = (g: THREE.BufferGeometry) => Math.max(...positions(g).map(p => p.x));
    expect(furthest(capped)).toBeCloseTo(130, 0);
    expect(furthest(flat)).toBeCloseTo(100);
  });

  it('carries texture coordinates along its length, for a dirt texture to tile', function () {
    const geometry = ribbonGeometry(THREE, [{ x: 0, y: 0 }, { x: 200, y: 0 }], 40, 0);
    const uv = geometry.getAttribute('uv');
    const us = Array.from({ length: uv.count }, (_, i) => uv.getX(i));
    expect(Math.max(...us)).toBeGreaterThan(Math.min(...us));
  });
});
