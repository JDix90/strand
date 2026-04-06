import { test, expect } from '@playwright/test';

/**
 * Smoke tests that do not require Supabase auth. For full student flows, run the dev server
 * with test credentials and extend tests with storageState.
 */
test.describe('curriculum shell (unauthenticated)', () => {
  test('landing page is public and shows sample practice', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /master russian cases/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /sample practice question/i })).toBeVisible();
  });

  test('login page shows Languini branding', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByTestId('brand-logo')).toBeVisible();
    await expect(page.getByText('Languini')).toBeVisible();
  });
});
