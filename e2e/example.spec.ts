import { expect, test } from '@playwright/test';

test('app title includes SprintLine', async ({ page }) => {
  await page.goto('/login');
  await expect(page).toHaveTitle(/SprintLine/);
});
