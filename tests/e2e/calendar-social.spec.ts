import { test, expect } from '@playwright/test';

/**
 * Smoke: protected routes redirect when unauthenticated. Full calendar / notes / profile flows need Supabase + storageState.
 */
test.describe('calendar & social shell (unauthenticated)', () => {
  test('student calendar redirects to login', async ({ page }) => {
    await page.goto('/home/calendar');
    await expect(page).toHaveURL(/\/login/);
  });

  test('teacher calendar redirects to login', async ({ page }) => {
    await page.goto('/teacher/calendar');
    await expect(page).toHaveURL(/\/login/);
  });

  test('settings is protected', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/login/);
  });
});
