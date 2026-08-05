import { defineConfig, devices } from '@playwright/test';

// LEGAL: End-to-end config for the game. Boots the real Vite dev server and
// LEGAL: drives it in a real browser. testMatch uses *.e2e.ts so Vitest (which
// LEGAL: owns *.test.ts / *.spec.ts) never tries to run these browser specs.
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  // LEGAL: Nearly every spec boots the full WebGL city (three.js + GLB loads). Playwright's
  // LEGAL: default worker count runs enough of those at once that scene boot outruns the
  // LEGAL: readiness timeouts and tests fail on contention rather than on real defects.
  // LEGAL: Two workers is stable and still roughly as fast as the serial run.
  workers: 2,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    headless: true,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'node ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
