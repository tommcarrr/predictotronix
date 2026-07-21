import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'fs';

// Load e2e credentials from .env.e2e.local (not committed to git).
// Copy tests/e2e/.env.e2e.example → .env.e2e.local and fill in your values.
if (existsSync('.env.e2e.local')) {
  process.loadEnvFile('.env.e2e.local');
}

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const isLocalhost = BASE_URL === 'http://localhost:3000';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    navigationTimeout: 60_000,
    actionTimeout: 30_000,
  },
  projects: [
    {
      name: 'setup',
      testMatch: '**/global.setup.ts',
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/admin.json',
      },
      dependencies: ['setup'],
      testIgnore: '**/global.setup.ts',
    },
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
        storageState: 'tests/e2e/.auth/admin.json',
      },
      dependencies: ['setup'],
      testIgnore: '**/global.setup.ts',
    },
  ],
  webServer: isLocalhost
    ? {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
      }
    : undefined,
});
