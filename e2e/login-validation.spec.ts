import { expect, test } from '@playwright/test';

test.describe('Login form validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('shows validation when submitting empty form', async ({ page }) => {
    await page.getByRole('button', { name: /sign in/i }).click();

    // Bound field errors (aria-describedby / field-error)
    await expect(page.locator('#login-email-error, [id*="email"][class*="error"], hlm-field-error').first()).toBeVisible({
      timeout: 5_000,
    });
  });

  test('email field is marked invalid for malformed email', async ({ page }) => {
    await page.locator('#login-email').fill('not-an-email');
    await page.locator('#login-password').fill('ValidPass1');
    await page.getByRole('button', { name: /sign in/i }).click();

    const email = page.locator('#login-email');
    await expect(email).toHaveAttribute('aria-invalid', 'true');
  });

  test('password visibility toggle updates type and aria-pressed', async ({ page }) => {
    const password = page.locator('#login-password');
    await password.fill('Secret123');

    await expect(password).toHaveAttribute('type', 'password');

    const toggle = page.locator('#login-password').locator('..').getByRole('button');
    await expect(toggle).toBeVisible();

    await toggle.click();
    await expect(password).toHaveAttribute('type', 'text');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');

    await toggle.click();
    await expect(password).toHaveAttribute('type', 'password');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });

  test('email and password expose autocomplete hints', async ({ page }) => {
    await expect(page.locator('#login-email')).toHaveAttribute('autocomplete', 'email');
    await expect(page.locator('#login-password')).toHaveAttribute('autocomplete', 'current-password');
  });
});
