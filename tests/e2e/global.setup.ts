import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { mkdirSync } from 'fs';

export const ADMIN_AUTH = path.join(__dirname, '.auth/admin.json');

setup('authenticate as admin', async ({ page }) => {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      '\n\nE2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD must be set.\n' +
        'Copy tests/e2e/.env.e2e.example to .env.e2e.local and fill in your admin credentials.\n',
    );
  }

  await page.goto('/login');
  // Render free tier can take up to 30s to wake from cold start
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible({ timeout: 60_000 });

  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');

  // Wait for redirect away from /login (successful auth lands on /dashboard)
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15_000 });

  mkdirSync(path.dirname(ADMIN_AUTH), { recursive: true });
  await page.context().storageState({ path: ADMIN_AUTH });
});
