import { test, expect } from '@playwright/test';

/**
 * Smoke tests that do not require Supabase auth. For full student flows, run the dev server
 * with test credentials and extend tests with storageState.
 */
test.describe('curriculum shell (unauthenticated)', () => {
  test('login page shows app branding', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /^strand$/i })).toBeVisible();
  });
});
