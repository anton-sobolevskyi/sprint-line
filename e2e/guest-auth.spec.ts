import { expect, test } from '@playwright/test';

test.describe('Guest auth pages', () => {
  test('login page shows brand and theme toggle', async ({ page }) => {
    await page.goto('/login');

    await expect(page).toHaveTitle(/SprintLine/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: /theme/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /register|sign up|create/i })).toBeVisible();
  });

  test('register page is reachable from login', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: /register|sign up|create/i }).first().click();
    await expect(page).toHaveURL(/register/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('forgot password page loads', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test('unauthenticated home redirects to login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/login/);
  });

  test('theme toggle flips dark class on document', async ({ page }) => {
    await page.goto('/login');
    const toggle = page.getByRole('button', { name: /theme/i });
    await expect(toggle).toBeVisible();

    const before = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    await toggle.click();
    const after = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(after).not.toBe(before);
  });
});
