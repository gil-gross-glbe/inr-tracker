import { test, expect } from '@playwright/test';

test.describe('Pill Tab', () => {
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
        static now() {
          return new RealDate('2026-03-14T12:00:00Z').getTime();
        }
      }
      // @ts-expect-error mocking built-in
      globalThis.Date = MockDate;
    });
    await page.goto('/');
  });

  test('Mark pill as taken', async ({ page }) => {
    await expect(page.getByText('Have you taken your Coumadin today?')).toBeVisible();
    await expect(page.locator('button', { hasText: 'Mark as taken (0.5mg)' })).toBeVisible();
    await page.getByRole('button', { name: /Mark as taken/i }).click();

    await expect(page.getByText('Taken today at', { exact: false })).toBeVisible();
    await expect(page.getByRole('button', { name: "Edit today's entry" })).toBeVisible();
  });

  test('Change dose before logging', async ({ page }) => {
    await page.getByRole('button', { name: '0.75mg', exact: true }).click();
    await page.getByRole('button', { name: 'Mark as taken (0.75mg)' }).click();
    
    await expect(page.getByText('0.75mg', { exact: false })).toBeVisible();
  });

  test('Open and close settings', async ({ page }) => {
    await page.getByRole('button', { name: /Settings/i }).click();
    await expect(page.getByText('Pill strengths available')).toBeVisible();
    await page.getByRole('button', { name: /Settings/i }).click();
    await expect(page.getByText('Pill strengths available')).toBeHidden();
  });
});
