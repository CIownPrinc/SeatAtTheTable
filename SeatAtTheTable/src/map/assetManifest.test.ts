/// <reference types="node" />
import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { DOWNLOADED_MAP_ASSETS, EAGER_MAP_ASSET_KEYS, MAP_ASSET_PATHS, MAP_ASSET_PUBLIC_BASE } from './assetManifest';

function downloadedPublicAssetPaths(dir: string, baseDir = dir): string[] {
  return readdirSync(dir, { withFileTypes:true }).flatMap(function(entry){
    const fullPath = join(dir, entry.name);
    if(entry.isDirectory()) return downloadedPublicAssetPaths(fullPath, baseDir);
    const relativePath = fullPath.slice(baseDir.length + 1).replace(/\\/g, '/');
    return [`${MAP_ASSET_PUBLIC_BASE}${relativePath}`];
  });
}

function gameRoot(): string {
  const directRoot = process.cwd();
  const nestedRoot = join(directRoot, 'SeatAtTheTable');
  return existsSync(join(directRoot, 'public', 'assets', 'map')) ? directRoot : nestedRoot;
}

describe('downloaded map asset manifest', function () {
  it('classifies every downloaded map asset as used, reserved, or fallback', function () {
    const assetRoot = join(gameRoot(), 'public', 'assets', 'map');
    const publicPaths = downloadedPublicAssetPaths(assetRoot);
    const manifestPaths = new Set(DOWNLOADED_MAP_ASSETS.filter(asset => asset.status !== 'fallback').map(asset => asset.path));

    expect(publicPaths.filter(path => !manifestPaths.has(path))).toEqual([]);
  });

  it('only marks runtime-loaded GLB models as used by the eager loader', function () {
    const eagerPaths = new Set(EAGER_MAP_ASSET_KEYS.map(key => MAP_ASSET_PATHS[key]));
    const usedModelPaths = DOWNLOADED_MAP_ASSETS.filter(asset => asset.status === 'used' && asset.path.endsWith('.glb')).map(asset => asset.path);

    expect(usedModelPaths.sort()).toEqual([...eagerPaths].sort());
  });

  it('documents future use for every reserved asset', function () {
    const undocumentedReservedAssets = DOWNLOADED_MAP_ASSETS.filter(asset => asset.status === 'reserved' && (!asset.futureUse || asset.futureUse.length === 0)).map(asset => asset.path);

    expect(undocumentedReservedAssets).toEqual([]);
  });

  // LEGAL: Every Kenney GLB samples Textures/colormap.png next to itself. Without it the
  // LEGAL: models rendered as flat tinted boxes, which is why the city looked untextured.
  it('ships the colormap texture each Kenney model pack samples', function () {
    const assetRoot = join(gameRoot(), 'public', 'assets', 'map');
    ['kenney-modular-buildings', 'kenney-car-kit'].forEach(function(pack){
      expect(existsSync(join(assetRoot, pack, 'Textures', 'colormap.png')), pack).toBe(true);
    });
  });
});
