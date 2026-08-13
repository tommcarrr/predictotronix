import { test, expect } from '@playwright/test';

test.describe('Admin — leagues page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/leagues');
    await expect(page.getByRole('heading', { name: 'Leagues', exact: true })).toBeVisible();
  });

  test('shows league admin management for the selected league', async ({ page }) => {
    const manageLinks = page.getByRole('link', { name: 'Manage league' });
    if (await manageLinks.count() === 0) {
      test.skip(true, 'No leagues are available');
      return;
    }

    await manageLinks.first().click();
    await page.getByRole('link', { name: 'Admins' }).click();
    await expect(page.getByRole('heading', { name: 'Current administrators' })).toBeVisible();
    await expect(page.getByLabel('Registered user')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Assign admin' })).toBeVisible();
  });
});
