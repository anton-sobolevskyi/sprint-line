import { expect, test } from '@playwright/test';
import { expectNoSeriousA11yViolations } from './helpers/axe';

/**
 * Guest-route accessibility gates from docs/AUDIT.MD.
 * No API/credentials required — safe for default CI.
 */
test.describe('Guest a11y (axe)', () => {
  test('login has no serious/critical WCAG violations', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expectNoSeriousA11yViolations(page);
  });

  test('register has no serious/critical WCAG violations', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expectNoSeriousA11yViolations(page);
  });

  test('forgot-password has no serious/critical WCAG violations', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expectNoSeriousA11yViolations(page);
  });

  test('not-found has no serious/critical WCAG violations', async ({ page }) => {
    await page.goto('/this-route-does-not-exist-xyz');
    await expect(page).toHaveURL(/not-found/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expectNoSeriousA11yViolations(page);
  });
});
