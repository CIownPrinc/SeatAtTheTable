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

  it('documents the known missing texture fallback', function () {
    expect(DOWNLOADED_MAP_ASSETS.some(asset => asset.status === 'fallback' && asset.path === 'Textures/colormap.png')).toBe(true);
  });
});
