import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

interface VercelHeaders { headers: { headers: { key: string; value: string }[] }[] }

// LEGAL: `vite preview` serves the production build with the same security headers Vercel
// LEGAL: sends, read from vercel.json so the two can never disagree.
function deployedHeaders(): Record<string, string> {
  const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8')) as VercelHeaders;
  return Object.fromEntries(config.headers.flatMap((rule) => rule.headers).map((header) => [header.key, header.value]));
}

export default defineConfig({
  root: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 800,
  },
  preview: {
    headers: deployedHeaders(),
  },
});
