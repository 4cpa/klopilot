import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3102',
    trace: 'on-first-retry',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 13'] } },
  ],

  // In CI: Next.js-App wurde bereits gebaut; `next start` serviert das .next-Verzeichnis.
  // Lokal: `pnpm dev` mit Hot Reload, reuse falls schon gestartet.
  webServer: {
    command: process.env.CI
      ? 'pnpm --filter @klopilot/web start'
      : 'pnpm --filter @klopilot/web dev',
    url: 'http://localhost:3102',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
