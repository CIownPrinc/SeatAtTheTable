import { describe, expect, it } from 'vitest';
import { resolveMapAssetUrl } from './assets';

describe('map asset loading', function () {
  it('replaces missing Kenney building colormap references with a safe fallback texture', function () {
    const resolved = resolveMapAssetUrl('Textures/colormap.png');

    expect(resolved.startsWith('data:image/png;base64,')).toBe(true);
    expect(resolveMapAssetUrl('/assets/map/kenney-modular-buildings/building-window-wide.glb')).toBe('/assets/map/kenney-modular-buildings/building-window-wide.glb');
  });
});
