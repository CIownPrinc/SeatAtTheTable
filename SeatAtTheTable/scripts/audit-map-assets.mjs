import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const gameRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const publicMapRoot = join(gameRoot, 'public', 'assets', 'map');
const manifestPath = join(gameRoot, 'src', 'map', 'assetManifest.ts');
const manifestSource = readFileSync(manifestPath, 'utf8');

const baseUrls = {
  BUILDING_ASSET_BASE: '/assets/map/kenney-modular-buildings/',
  CAR_ASSET_BASE: '/assets/map/kenney-car-kit/',
};

function publicAssetFiles(dir) {
  return readdirSync(dir, { withFileTypes:true }).flatMap(function(entry){
    const fullPath = join(dir, entry.name);
    if(entry.isDirectory()) return publicAssetFiles(fullPath);
    const pathFromMapRoot = relative(publicMapRoot, fullPath).replace(/\\/g, '/');
    return [`/assets/map/${pathFromMapRoot}`];
  });
}

function resolveManifestPath(rawPath) {
  if(rawPath.startsWith('MAP_ASSET_PATHS.')) {
    const key = rawPath.slice('MAP_ASSET_PATHS.'.length);
    const keyMatch = manifestSource.match(new RegExp(`${key}: \`\\$\\{([A-Z_]+)\\}([^\`]+)\``));
    if(!keyMatch) return rawPath;
    return `${baseUrls[keyMatch[1]]}${keyMatch[2]}`;
  }
  const templateMatch = rawPath.match(/^\`\$\{([A-Z_]+)\}([^\`]+)\`$/);
  if(templateMatch) return `${baseUrls[templateMatch[1]]}${templateMatch[2]}`;
  return rawPath.replace(/^['"`]|['"`]$/g, '');
}

function parseManifestAssets() {
  const assetBlock = manifestSource.slice(manifestSource.indexOf('export const DOWNLOADED_MAP_ASSETS'));
  const objectMatches = assetBlock.split(/\r?\n/).map(line => line.trim()).filter(line => line.startsWith('{ path:'));
  return objectMatches.map(function(entry){
    const pathMatch = entry.match(/path:([^,]+),/);
    const statusMatch = entry.match(/status:'([^']+)'/);
    const futureUseMatch = entry.match(/futureUse:\[([^\]]+)]/);
    const noteMatch = entry.match(/note:'([^']+)'/);
    const path = pathMatch ? resolveManifestPath(pathMatch[1].trim()) : 'unknown';
    const futureUse = futureUseMatch ? futureUseMatch[1].split(',').map(value => value.trim().replace(/^'|'$/g, '')) : [];
    return {
      path,
      status: statusMatch ? statusMatch[1] : 'unknown',
      futureUse,
      note: noteMatch ? noteMatch[1] : '',
    };
  });
}

function printSection(title, values) {
  console.log(`\n${title}:`);
  if(values.length === 0) {
    console.log('- none');
    return;
  }
  values.forEach(function(value){
    console.log(`- ${value}`);
  });
}

const publicFiles = publicAssetFiles(publicMapRoot);
const manifestAssets = parseManifestAssets();
const manifestPaths = new Set(manifestAssets.filter(asset => asset.status !== 'fallback').map(asset => asset.path));
const unlistedFiles = publicFiles.filter(path => !manifestPaths.has(path));
const used = manifestAssets.filter(asset => asset.status === 'used').map(asset => asset.path);
const missingOrBroken = manifestAssets.filter(asset => asset.status === 'fallback').map(function(asset){
  return asset.note ? `${asset.path} (${asset.note})` : asset.path;
});
const reserved = manifestAssets.filter(asset => asset.status === 'reserved').map(function(asset){
  const suffix = asset.futureUse.length ? ` futureUse: ${asset.futureUse.join(', ')}` : ' futureUse: missing';
  return `${asset.path} (${suffix})`;
});

console.log('Map Asset Usage Audit');
console.log(`Inventory: ${publicFiles.length} downloaded files under public/assets/map`);
printSection('USED', used);
printSection('MISSING / BROKEN', missingOrBroken);
printSection('UNUSED', unlistedFiles);
printSection('INTENTIONALLY RESERVED', reserved);

if(unlistedFiles.length > 0) {
  process.exitCode = 1;
}
