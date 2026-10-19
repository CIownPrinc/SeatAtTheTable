// LEGAL: Rebuilds every model from art/blender/ and shrinks it. Blender runs headless from the
// LEGAL: scripts, then gltf-transform quantizes positions and normals (three's GLTFLoader reads
// LEGAL: KHR_mesh_quantization natively), which cuts each file by about 60%.
// LEGAL: Usage: pnpm --dir SeatAtTheTable art  (set BLENDER to override the Blender path).
import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const gameRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const blender = process.env.BLENDER || 'C:/Program Files/Blender Foundation/Blender 5.2/blender.exe';
const families = [['vehicles.py', 'vehicles'], ['buildings.py', 'buildings'], ['props.py', 'props']];

for (const [script, folder] of families) {
  const out = join(gameRoot, 'public', 'assets', 'world', folder);
  console.log(`[art] building ${folder}`);
  execFileSync(blender, ['--background', '--factory-startup', '--python', join(gameRoot, 'art', 'blender', script), '--', out, ''], { stdio: 'inherit' });
  for (const file of readdirSync(out).filter(name => name.endsWith('.glb'))) {
    const path = join(out, file);
    execFileSync('npx', ['--yes', '@gltf-transform/cli@4.1.1', 'quantize', path, path], { stdio: 'inherit', shell: true });
  }
}
