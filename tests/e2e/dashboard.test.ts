import { test, expect } from '@playwright/test';

test.describe('Dashboard — admin user', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText('PREDICTOTRONIX')).toBeVisible();
  });

  /**
   * Regression: the admin panel link was missing from the dashboard entirely.
   * A super_admin must see the Admin panel button in the nav.
   */
  test('shows Admin panel link for super admins', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Admin panel' })).toBeVisible();
  });

  test('Admin panel link navigates to /admin', async ({ page }) => {
    await page.getByRole('link', { name: 'Admin panel' }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible();
  });
});
