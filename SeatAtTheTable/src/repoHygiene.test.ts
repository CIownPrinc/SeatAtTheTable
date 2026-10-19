/// <reference types="node" />
import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

// LEGAL: A source file that .gitignore swallows builds fine on this machine and is simply missing
// LEGAL: on Vercel. That is how src/world/build/ (caught by the "build/" output rule) broke a deploy
// LEGAL: while every local check passed.
function filesUnder(dir: string): string[] {
  return readdirSync(dir, { withFileTypes:true }).flatMap(entry => entry.isDirectory() ? filesUnder(join(dir, entry.name)) : [join(dir, entry.name)]);
}

describe('repository hygiene', function () {
  it('ignores no source file, so what builds here also builds on deploy', function () {
    const root = join(__dirname, '..');
    const files = [...filesUnder(join(root, 'src')), join(root, 'index.html')].map(f => relative(root, f).split('\\').join('/'));
    let ignored = '';
    try {
      ignored = execFileSync('git', ['check-ignore', '--no-index', ...files], { cwd:root, encoding:'utf8' });
    } catch(error){
      // LEGAL: git check-ignore exits 1 when nothing is ignored, which is the passing case.
      ignored = (error as { stdout?: string }).stdout ?? '';
    }
    expect(ignored.trim().split('\n').filter(Boolean)).toEqual([]);
  });
});
