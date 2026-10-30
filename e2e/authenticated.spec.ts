import { expect, test } from '@playwright/test';
import { expectNoSeriousA11yViolations } from './helpers/axe';

/**
 * Requires a running app + API and credentials:
 *   PLAYWRIGHT_EMAIL=...
 *   PLAYWRIGHT_PASSWORD=...
 * Skips when either is missing so CI without secrets still passes guest suite.
 */
const email = process.env['PLAYWRIGHT_EMAIL']?.trim() ?? '';
const password = process.env['PLAYWRIGHT_PASSWORD']?.trim() ?? '';
const hasCredentials = email.length > 0 && password.length > 0;

test.describe('Authenticated flows', () => {
  test.skip(!hasCredentials, 'Set PLAYWRIGHT_EMAIL and PLAYWRIGHT_PASSWORD to run');

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.locator('#login-email').fill(email);
    await page.locator('#login-password').fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).not.toHaveURL(/login/, { timeout: 15_000 });
  });

  test('lands on home with shell navigation', async ({ page }) => {
    await expect(page.getByRole('link', { name: /^home$/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /projects/i }).first()).toBeVisible();
  });

  test('home has no serious/critical a11y violations', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 });
    await expectNoSeriousA11yViolations(page);
  });

  test('can open projects list', async ({ page }) => {
    await page.getByRole('link', { name: /projects/i }).first().click();
    await expect(page).toHaveURL(/\/projects/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('can open profile', async ({ page }) => {
    await page.getByRole('link', { name: /profile/i }).first().click();
    await expect(page).toHaveURL(/\/profile/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('command palette opens with keyboard and closes with Escape', async ({ page }) => {
    const isMac = process.platform === 'darwin';
    await page.keyboard.press(isMac ? 'Meta+k' : 'Control+k');

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('#command-palette-search')).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('command palette can jump to projects', async ({ page }) => {
    const isMac = process.platform === 'darwin';
    await page.keyboard.press(isMac ? 'Meta+k' : 'Control+k');

    const search = page.locator('#command-palette-search');
    await expect(search).toBeVisible();
    await search.fill('projects');

    const option = page.getByRole('option').filter({ hasText: /projects/i }).first();
    await expect(option).toBeVisible({ timeout: 5_000 });
    await option.click();

    await expect(page).toHaveURL(/\/projects/);
  });

  test('theme toggle works while signed in', async ({ page }) => {
    const toggle = page.getByRole('button', { name: /light|dark|system|theme/i }).first();
    await expect(toggle).toBeVisible();
    const before = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    await toggle.click();
    const after = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(after).not.toBe(before);
  });
});
