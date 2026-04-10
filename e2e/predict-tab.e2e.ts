import { test, expect } from '@playwright/test';

test.describe('Predict Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Predict' }).click();
  });

  test('Placeholder shown with 0 results', async ({ page }) => {
    await expect(page.getByText('Add at least 2 INR results')).toBeVisible();
  });
});
