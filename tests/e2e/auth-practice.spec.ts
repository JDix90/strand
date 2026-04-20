import { test, expect } from '@playwright/test';

/**
 * Full flow: login → practice (1 question when VITE_E2E=true) → results.
 * Requires a real Supabase project in `.env` and a **student** test user.
 *
 * Set `E2E_EMAIL` and `E2E_PASSWORD` (e.g. in CI secrets). Without them, tests
 * are skipped so local/PR runs without credentials still pass.
 */
const email = process.env.E2E_EMAIL ?? '';
const password = process.env.E2E_PASSWORD ?? '';
const hasCredentials = Boolean(email && password);

/** Skip entire suite when env vars missing (local dev / forks without secrets). */
const describeAuth = hasCredentials ? test.describe : test.describe.skip;

describeAuth('authenticated practice', () => {
  test('login → practice → results', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByTestId('login-email')).toBeVisible();

    await page.getByTestId('login-email').fill(email);
    await page.getByTestId('login-password').fill(password);
    await page.getByTestId('login-submit').click();

    await page.waitForURL((url: URL) => !url.pathname.includes('/login'), { timeout: 45_000 });

    const path = new URL(page.url()).pathname;
    if (path.startsWith('/teacher') || path.startsWith('/admin')) {
      test.skip(true, 'E2E user must be a student account (teacher/admin redirect away from practice).');
    }

    await page.goto('/practice');
    await expect(page.getByText(/Question 1 of 1/)).toBeVisible({ timeout: 30_000 });

    await page.locator('.grid.grid-cols-1').first().getByRole('button').first().click();
    await page.getByTestId('practice-continue').click();

    await expect(page).toHaveURL(/\/results\/?$/);
    await expect(page.getByRole('heading', { name: /practice complete/i })).toBeVisible();
  });
});
