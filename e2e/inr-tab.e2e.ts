import { test, expect } from '@playwright/test';

test.describe('INR Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
      const RealDate = Date;
      class MockDate extends RealDate {
        constructor(...args: unknown[]) {
          if (args.length === 0) {
            super('2026-03-14T12:00:00Z');
          } else {
            // @ts-expect-error args forwarding
            super(...args);
          }
        }
        static now() { return new RealDate('2026-03-14T12:00:00Z').getTime(); }
      }
      // @ts-expect-error mocking built-in
      globalThis.Date = MockDate;
    });
    await page.goto('/');
    await page.getByRole('button', { name: 'INR' }).click();
  });

  test('Add a valid INR result', async ({ page }) => {
    await page.getByPlaceholder('0.0').fill('2.4');
    await page.getByRole('button', { name: 'Save result' }).click();

    await expect(page.getByText('2.4', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('In range')).toBeVisible();
  });

  test('Validation — missing INR value', async ({ page }) => {
    await page.getByRole('button', { name: 'Save result' }).click();
    await expect(page.getByText('INR value is required')).toBeVisible();
  });

  test('Validation — rejected value > 10', async ({ page }) => {
    await page.getByPlaceholder('0.0').fill('15');
    await page.getByRole('button', { name: 'Save result' }).click();
    await expect(page.getByText('INR value must be 10 or less')).toBeVisible();
  });
});
