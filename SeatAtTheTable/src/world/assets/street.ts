import type * as ThreeNamespace from 'three';
import type { StreetModels } from '../../map/streetFurniture';
import { loadPartGeometries } from './parts';

// LEGAL: The Blender lamp post and signal frame (art/blender/streetlights.py).
export async function loadStreetModels(THREE: typeof ThreeNamespace): Promise<StreetModels> {
  const [post, signal] = await Promise.all([
    loadPartGeometries(THREE, '/assets/world/street/lamp-post.glb'),
    loadPartGeometries(THREE, '/assets/world/street/signal-frame.glb'),
  ]);
  const models: StreetModels = {};
  const iron = post?.get('iron'), glass = post?.get('glass');
  if(iron && glass) models.lampPost = { iron, glass };
  const frame = signal?.get('signal');
  if(frame) models.signalFrame = frame;
  return models;
}
