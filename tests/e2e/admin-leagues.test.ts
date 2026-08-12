import { test, expect } from '@playwright/test';

test.describe('Admin — leagues page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/leagues');
    await expect(page.getByRole('heading', { name: 'League settings' })).toBeVisible();
  });

  test('shows league admin management for the selected league', async ({ page }) => {
    const heading = page.getByRole('heading', { name: 'League admins' });

    if (await heading.count() === 0) {
      test.skip(true, 'No league is selected');
      return;
    }

    await expect(heading).toBeVisible();
    await expect(page.getByLabel('Registered user')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Assign admin' })).toBeVisible();
  });
});
