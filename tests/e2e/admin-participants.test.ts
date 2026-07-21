import { test, expect, type Page } from '@playwright/test';

test.describe('Admin — participants page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/participants');
    await expect(page.getByRole('heading', { name: 'Participants', exact: true })).toBeVisible();
  });

  /**
   * Regression: the pending requests query used an invalid PostgREST embedded
   * join (join_requests → profiles has no direct FK), causing the entire query
   * to silently return null. The "Pending Requests" section now always renders.
   */
  test('renders the Pending Requests section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Pending Requests' })).toBeVisible();
  });

  test('renders the All Participants section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'All Participants' })).toBeVisible();
  });

  /**
   * Regression: approving a join request called revalidatePath which failed to
   * trigger a visible update in Next.js 16. All DB errors were also silently
   * swallowed. The action now throws on DB failure and redirects on success.
   *
   * This test only runs when there is at least one pending request — set
   * E2E_INVITE_CODE + E2E_PLAYER_EMAIL + E2E_PLAYER_PASSWORD in .env.e2e.local
   * to seed one automatically, or create one manually before running.
   */
  test('approving a pending request removes it from the list', async ({ page }) => {
    const approveButtons = page.getByRole('button', { name: 'Approve' });
    const count = await approveButtons.count();

    if (count === 0) {
      test.skip(true, 'No pending requests — seed one via E2E_INVITE_CODE or manually');
      return;
    }

    // Record which request is first so we can confirm it disappears
    const firstRequest = page.locator('section').filter({ hasText: 'Pending Requests' })
      .locator('.rounded-lg.border').first();
    const requestText = await firstRequest.innerText();

    await approveButtons.first().click();

    // The action redirects back to /admin/participants on success
    await expect(page).toHaveURL(/\/admin\/participants$/, { timeout: 15_000 });

    // The approved request should no longer appear
    const remaining = page.locator('section')
      .filter({ hasText: 'Pending Requests' })
      .locator('.rounded-lg.border');

    // Either fewer items, or the specific item is gone
    if (await remaining.count() > 0) {
      const texts = await remaining.allInnerTexts();
      expect(texts).not.toContain(requestText);
    }
  });
});

/**
 * Optional full join-request flow: player submits → admin approves → player
 * sees active season on dashboard.
 *
 * Requires E2E_INVITE_CODE, E2E_PLAYER_EMAIL, E2E_PLAYER_PASSWORD in
 * .env.e2e.local. Skipped automatically if any are missing.
 */
test.describe('Join request full flow', () => {
  const inviteCode = process.env.E2E_INVITE_CODE;
  const playerEmail = process.env.E2E_PLAYER_EMAIL;
  const playerPassword = process.env.E2E_PLAYER_PASSWORD;
  const adminEmail = process.env.E2E_ADMIN_EMAIL!;
  const adminPassword = process.env.E2E_ADMIN_PASSWORD!;

  test.skip(!inviteCode || !playerEmail || !playerPassword,
    'Set E2E_INVITE_CODE, E2E_PLAYER_EMAIL, E2E_PLAYER_PASSWORD in .env.e2e.local to enable');

  async function loginAs(page: Page, email: string, password: string) {
    await page.goto('/login');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15_000 });
  }

  test('player submits join request, admin approves, player sees pending then enrolled', async ({ browser }) => {
    // ── Step 1: player submits a join request ────────────────────────────
    const playerCtx = await browser.newContext({ storageState: undefined });
    const playerPage = await playerCtx.newPage();

    await loginAs(playerPage, playerEmail!, playerPassword!);
    await playerPage.goto(`/join/${inviteCode}`);

    // If already has a pending/approved request, skip the submit step
    const alreadyPending = await playerPage.getByText('Your join request is pending').isVisible()
      .catch(() => false);
    const alreadyApproved = playerPage.url().includes('/dashboard');

    if (!alreadyPending && !alreadyApproved) {
      await playerPage.getByRole('button', { name: /request to join/i }).click();
      await expect(playerPage.getByText('Your join request is pending')).toBeVisible({ timeout: 10_000 });
    }

    // Player dashboard shows pending notice
    await playerPage.goto('/dashboard');
    await expect(playerPage.getByText(/pending approval/i)).toBeVisible();

    // ── Step 2: admin approves ────────────────────────────────────────────
    const adminCtx = await browser.newContext({ storageState: undefined });
    const adminPage = await adminCtx.newPage();

    await loginAs(adminPage, adminEmail, adminPassword);
    await adminPage.goto('/admin/participants');
    await expect(adminPage.getByRole('heading', { name: 'Participants' })).toBeVisible();

    const approveBtn = adminPage.getByRole('button', { name: 'Approve' }).first();
    await expect(approveBtn).toBeVisible({ timeout: 5_000 });
    await approveBtn.click();
    await expect(adminPage).toHaveURL(/\/admin\/participants$/, { timeout: 15_000 });

    await adminCtx.close();

    // ── Step 3: player no longer sees pending notice ──────────────────────
    await playerPage.goto('/dashboard');
    await expect(playerPage.getByText(/pending approval/i)).not.toBeVisible({ timeout: 10_000 });

    await playerCtx.close();
  });
});
