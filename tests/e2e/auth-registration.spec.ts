import { test, expect } from '@playwright/test';

test.describe('registration + OTP (full stack)', () => {
  test.skip(
    process.env.E2E_WITH_DB !== '1',
    'Run with E2E_WITH_DB=1 after `docker compose up -d` and `npm run db:migrate`.',
  );

  test('register with email and verify OTP', async ({ page }) => {
    const email = `e2e-${Date.now()}@example.test`;
    const password = 'testpassword123';

    await page.goto('/register');
    await page.getByRole('button', { name: 'Email' }).click();
    await page.getByLabel(/Email/).fill(email);
    await page.getByLabel(/^Password$/).fill(password);
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page).toHaveURL(/\/verify\?channel=email/);

    await page.goto('/dev/otp');
    const row = page.locator('tbody tr').filter({ hasText: email });
    await expect(row).toBeVisible();
    const otp = (await row.locator('td').nth(3).textContent())?.trim() ?? '';
    expect(otp.length).toBeGreaterThanOrEqual(4);

    await page.goto(`/verify?channel=email&email=${encodeURIComponent(email)}`);
    await page.getByLabel('Code').fill(otp);
    await page.getByRole('button', { name: 'Verify' }).click();
    await expect(page).toHaveURL('/');
  });

  test('register with phone and verify OTP', async ({ page }) => {
    const suffix = Date.now().toString().slice(-8);
    const phone = `+1555${suffix}`;
    const password = 'testpassword123';

    await page.goto('/register');
    await page.getByRole('button', { name: 'Phone' }).click();
    await page.getByLabel(/Phone/).fill(phone);
    await page.getByLabel(/^Password$/).fill(password);
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page).toHaveURL(/\/verify\?channel=phone/);

    await page.goto('/dev/otp');
    const row = page.locator('tbody tr').filter({ hasText: phone });
    await expect(row).toBeVisible();
    const otp = (await row.locator('td').nth(3).textContent())?.trim() ?? '';
    expect(otp.length).toBeGreaterThanOrEqual(4);

    await page.goto(`/verify?channel=phone&phone=${encodeURIComponent(phone)}`);
    await page.getByLabel('Code').fill(otp);
    await page.getByRole('button', { name: 'Verify' }).click();
    await expect(page).toHaveURL('/');
  });
});
