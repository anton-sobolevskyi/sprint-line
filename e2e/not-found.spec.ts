import { expect, test } from '@playwright/test';

test.describe('Not found', () => {
  test('unknown path shows not-found page', async ({ page }) => {
    await page.goto('/this-route-does-not-exist-xyz');
    await expect(page).toHaveURL(/not-found/);
    await expect(page.getByRole('heading', { name: /not found/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /home/i })).toBeVisible();
  });
});
