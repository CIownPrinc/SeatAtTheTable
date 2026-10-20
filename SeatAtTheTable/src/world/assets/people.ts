import type * as ThreeNamespace from 'three';
import { loadPartGeometries } from './parts';

// LEGAL: The person's sculpted parts (art/blender/people.py), keyed by the same names as the code's
// LEGAL: primitives in map/personModel.ts (exported with ':' written as '__').
export async function loadPersonGeometries(THREE: typeof ThreeNamespace): Promise<Map<string, ThreeNamespace.BufferGeometry> | null> {
  const parts = await loadPartGeometries(THREE, '/assets/world/people/person-parts.glb');
  if(!parts) return null;
  return new Map([...parts].map(([name, geometry]) => [name.replace('__', ':'), geometry]));
}
