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
    test.setTimeout(120_000);

    await page.goto('/login');
    await expect(page.getByTestId('login-email')).toBeVisible();

    if (await page.getByText('Supabase is not configured').first().isVisible().catch(() => false)) {
      throw new Error(
        'Supabase is not configured for the dev server. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY ' +
          'to .env.local (local) or GitHub Actions secrets VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (CI). See tests/e2e/README.md.',
      );
    }

    await page.getByTestId('login-email').fill(email);
    await page.getByTestId('login-password').fill(password);
    await page.getByTestId('login-submit').click();

    try {
      await expect(page).toHaveURL(url => !url.pathname.includes('/login'), { timeout: 60_000 });
    } catch {
      const banner = await page.getByTestId('login-error').textContent().catch(() => null);
      const noSupabase = await page.getByText('Supabase is not configured').first().isVisible().catch(() => false);
      throw new Error(
        banner?.trim()
          ? `Login failed: ${banner.trim()}`
          : noSupabase
            ? 'Supabase env missing on the Playwright dev server. Ensure .env.local has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (playwright.config merges them into the spawned server). Kill any other process on port 5173 or avoid PW_REUSE_SERVER=1 with a stale server.'
            : 'Still on /login after 60s with no error banner — wrong E2E credentials, email not confirmed, or another app is bound to :5173 without your Supabase env.',
      );
    }

    const path = new URL(page.url()).pathname;
    if (path.startsWith('/teacher') || path.startsWith('/admin')) {
      test.skip(true, 'E2E user must be a student account (teacher/admin redirect away from practice).');
    }

    await page.goto('/practice');
    await expect(page.getByText(/Question 1 of 1/)).toBeVisible({ timeout: 45_000 });

    await page.locator('.grid.grid-cols-1').first().getByRole('button').first().click();
    await page.getByTestId('practice-continue').click();

    await expect(page).toHaveURL(/\/results\/?$/);
    await expect(page.getByRole('heading', { name: /practice complete/i })).toBeVisible();
  });
});
