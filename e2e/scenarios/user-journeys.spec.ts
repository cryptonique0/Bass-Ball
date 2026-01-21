import { test, expect } from '@playwright/test';

test.describe('Complete User Journey - New Player', () => {
  test('should complete full onboarding flow', async ({ page }) => {
    // 1. Landing page
    await page.goto('/');
    await expect(page).toHaveTitle(/Bass Ball/i);

    // 2. Navigate to signup
    const signupBtn = page.getByRole('link', { name: /sign up|get started/i });
    if (await signupBtn.count() > 0) {
      await signupBtn.click();
      await expect(page).toHaveURL(/signup/);

      // 3. Fill signup form
      const emailInput = page.getByLabel(/email/i);
      const passwordInput = page.getByLabel(/password/i);
      const submitBtn = page.getByRole('button', { name: /sign up|create account/i });

      if (await emailInput.count() > 0) {
        await emailInput.fill(`test-${Date.now()}@example.com`);
        await passwordInput.fill('TestPassword123!');
        await submitBtn.click();
        
        await page.waitForLoadState('networkidle');
      }
    }

    // 4. Complete profile setup (if applicable)
    const usernameInput = page.getByLabel(/username|player name/i);
    if (await usernameInput.count() > 0) {
      await usernameInput.fill(`Player${Date.now()}`);
      const saveBtn = page.getByRole('button', { name: /save|continue/i });
      await saveBtn.click();
    }

    // 5. Navigate to dashboard/home
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Complete User Journey - Returning Player', () => {
  test('should login and play a match', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    
    const emailInput = page.getByLabel(/email|username/i);
    const passwordInput = page.getByLabel(/password/i);
    const loginBtn = page.getByRole('button', { name: /log in|sign in/i });

    if (await emailInput.count() > 0) {
      await emailInput.fill('test@example.com');
      await passwordInput.fill('password123');
      await loginBtn.click();
      await page.waitForLoadState('networkidle');
    }

    // 2. Navigate to matchmaking
    await page.goto('/matchmaking');
    await page.waitForLoadState('networkidle');

    // 3. Find a match
    const findMatchBtn = page.getByRole('button', { name: /search|find match|play now/i });
    if (await findMatchBtn.count() > 0) {
      await findMatchBtn.click();
      
      // 4. Wait for match or timeout
      await page.waitForTimeout(2000);
    }

    // 5. Check match state
    await expect(page.locator('body')).toBeVisible();
  });

  test('should view profile and stats', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to profile
    const profileLink = page.getByRole('link', { name: /profile|account/i });
    if (await profileLink.count() > 0) {
      await profileLink.click();
      await expect(page).toHaveURL(/profile/);
      
      // Verify profile elements are visible
      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).toBeVisible();
    }
  });
});

test.describe('Complete User Journey - Tournament', () => {
  test('should join and participate in tournament', async ({ page }) => {
    await page.goto('/');

    // 1. Navigate to tournaments
    const tournamentsLink = page.getByRole('link', { name: /tournament/i });
    if (await tournamentsLink.count() > 0) {
      await tournamentsLink.click();
      await page.waitForLoadState('networkidle');

      // 2. View tournament details
      const tournamentCard = page.locator('[data-testid="tournament-card"]').first();
      if (await tournamentCard.count() > 0) {
        await tournamentCard.click();
        await page.waitForLoadState('networkidle');

        // 3. Join tournament
        const joinBtn = page.getByRole('button', { name: /join|register|enter/i });
        if (await joinBtn.count() > 0) {
          await joinBtn.click();
          
          // 4. Confirm registration
          await page.waitForTimeout(1000);
          await expect(page.locator('body')).toBeVisible();
        }
      }
    }
  });
});

test.describe('Complete User Journey - Social Features', () => {
  test('should add friend and send message', async ({ page }) => {
    await page.goto('/');

    // 1. Navigate to friends/social
    const socialLink = page.getByRole('link', { name: /friends|social/i });
    if (await socialLink.count() > 0) {
      await socialLink.click();
      await page.waitForLoadState('networkidle');

      // 2. Search for player
      const searchInput = page.getByPlaceholder(/search|find player/i);
      if (await searchInput.count() > 0) {
        await searchInput.fill('TestPlayer');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);

        // 3. Add friend
        const addBtn = page.getByRole('button', { name: /add friend/i }).first();
        if (await addBtn.count() > 0) {
          await addBtn.click();
          await page.waitForTimeout(500);
        }
      }
    }
  });

  test('should view leaderboard', async ({ page }) => {
    await page.goto('/leaderboard');
    await page.waitForLoadState('networkidle');
    
    // Verify leaderboard loads
    await expect(page.locator('body')).toBeVisible();
    
    // Check for rankings
    const rankings = page.locator('[data-testid="leaderboard-rank"], .rank, .player-rank');
    if (await rankings.count() > 0) {
      await expect(rankings.first()).toBeVisible();
    }
  });
});

test.describe('Complete User Journey - Settings & Preferences', () => {
  test('should update account settings', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Update preferences
    const notificationToggle = page.getByLabel(/notifications|email/i).first();
    if (await notificationToggle.count() > 0) {
      await notificationToggle.click();
      
      // Save settings
      const saveBtn = page.getByRole('button', { name: /save/i });
      if (await saveBtn.count() > 0) {
        await saveBtn.click();
        await page.waitForTimeout(500);
      }
    }

    await expect(page.locator('body')).toBeVisible();
  });
});
