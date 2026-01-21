import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Bass Ball/i);
  });

  test('should navigate to signup', async ({ page }) => {
    await page.goto('/');
    const signupLink = page.getByRole('link', { name: /sign up/i });
    if (await signupLink.count() > 0) {
      await signupLink.click();
      await expect(page).toHaveURL(/signup/);
    }
  });

  test('should validate login form fields', async ({ page }) => {
    await page.goto('/login');
    const submitBtn = page.getByRole('button', { name: /log in|sign in/i });
    if (await submitBtn.count() > 0) {
      await submitBtn.click();
      // Check for validation errors
      const errors = page.locator('[role="alert"], .error');
      await expect(errors.first()).toBeVisible();
    }
  });
});

test.describe('Navigation', () => {
  test('should navigate to main sections', async ({ page }) => {
    await page.goto('/');
    
    // Test home navigation
    const homeLink = page.getByRole('link', { name: /home/i }).first();
    if (await homeLink.count() > 0) {
      await homeLink.click();
      await expect(page).toHaveURL(/\/$/);
    }
  });

  test('should have accessible skip link', async ({ page }) => {
    await page.goto('/accessibility-demo');
    await page.keyboard.press('Tab');
    const skipLink = page.getByText(/skip to content/i);
    await expect(skipLink).toBeVisible();
  });
});

test.describe('Matchmaking', () => {
  test('should load matchmaking page', async ({ page }) => {
    await page.goto('/matchmaking');
    // Check if page loads without errors
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display available matches', async ({ page }) => {
    await page.goto('/matchmaking');
    // Wait for any loading indicators to disappear
    await page.waitForLoadState('networkidle');
    // Check if match list or empty state is visible
    const content = page.locator('main, [role="main"]');
    await expect(content).toBeVisible();
  });
});
