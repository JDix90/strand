import { test, expect } from '@playwright/test';

test('complete one case round and one vocabulary session', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Practice Russian with focused lessons' })).toBeVisible();

  await page.getByRole('link', { name: 'Case Practice' }).first().click();
  await expect(page.getByRole('heading', { name: 'Case Practice' })).toBeVisible();

  await page.getByTestId('focus-cell-pronoun-nominative').click();
  await page.getByTestId('start-focused-practice').click();
  await expect(page.getByText(/Question 1 of 8/)).toBeVisible();

  for (let i = 0; i < 8; i += 1) {
    await page.getByTestId('answer-choice-0').click();
    await page.getByTestId('practice-continue').click();
  }

  await expect(page.getByRole('heading', { name: /Practice Session Complete/ })).toBeVisible();

  await page.getByRole('button', { name: /Back to Case Practice/ }).click();
  await expect(page.getByRole('heading', { name: 'Case Practice' })).toBeVisible();

  await page.getByRole('link', { name: 'Vocabulary' }).first().click();
  await expect(page.getByText(/Question 1 of/)).toBeVisible();
});
