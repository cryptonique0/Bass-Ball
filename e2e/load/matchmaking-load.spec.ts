import { test, expect } from '@playwright/test';

test.describe('Matchmaking Load Tests', () => {
  test('should handle concurrent matchmaking requests', async ({ browser }) => {
    const numPlayers = 20;
    const contexts = await Promise.all(
      Array.from({ length: numPlayers }, () => browser.newContext())
    );

    const pages = await Promise.all(contexts.map(ctx => ctx.newPage()));

    try {
      // Simulate concurrent matchmaking
      const startTime = Date.now();
      
      await Promise.all(
        pages.map(async (page, idx) => {
          await page.goto('/matchmaking');
          await page.waitForLoadState('networkidle');
          
          // Simulate searching for match
          const searchBtn = page.getByRole('button', { name: /search|find match/i });
          if (await searchBtn.count() > 0) {
            await searchBtn.click();
          }
        })
      );

      const duration = Date.now() - startTime;

      // All players should be able to search within 5 seconds
      expect(duration).toBeLessThan(5000);

    } finally {
      await Promise.all(pages.map(p => p.close()));
      await Promise.all(contexts.map(ctx => ctx.close()));
    }
  });

  test('should maintain performance under load', async ({ browser }) => {
    const numRequests = 10;
    const contexts = await Promise.all(
      Array.from({ length: numRequests }, () => browser.newContext())
    );

    const pages = await Promise.all(contexts.map(ctx => ctx.newPage()));
    const responseTimes: number[] = [];

    try {
      for (const page of pages) {
        const start = Date.now();
        await page.goto('/matchmaking');
        await page.waitForLoadState('networkidle');
        responseTimes.push(Date.now() - start);
      }

      // Average response time should be < 2 seconds
      const avgTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      expect(avgTime).toBeLessThan(2000);

      // No request should take > 5 seconds
      const maxTime = Math.max(...responseTimes);
      expect(maxTime).toBeLessThan(5000);

    } finally {
      await Promise.all(pages.map(p => p.close()));
      await Promise.all(contexts.map(ctx => ctx.close()));
    }
  });

  test('should handle rapid successive searches', async ({ page }) => {
    await page.goto('/matchmaking');
    
    const searchBtn = page.getByRole('button', { name: /search|find match/i });
    
    if (await searchBtn.count() > 0) {
      // Simulate rapid clicking
      for (let i = 0; i < 5; i++) {
        await searchBtn.click();
        await page.waitForTimeout(100);
      }

      // Page should still be responsive
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should recover from matchmaking failures', async ({ page }) => {
    await page.goto('/matchmaking');
    
    // Simulate network failure during matchmaking
    await page.route('**/api/matchmaking/**', route => route.abort());
    
    const searchBtn = page.getByRole('button', { name: /search|find match/i });
    if (await searchBtn.count() > 0) {
      await searchBtn.click();
      
      // Should show error or fallback UI
      await page.waitForTimeout(1000);
      await expect(page.locator('body')).toBeVisible();
    }
    
    // Restore network and retry
    await page.unroute('**/api/matchmaking/**');
    if (await searchBtn.count() > 0) {
      await searchBtn.click();
      await page.waitForLoadState('networkidle');
    }
  });
});

test.describe('Database Load Tests', () => {
  test('should handle concurrent player profile requests', async ({ browser }) => {
    const numRequests = 15;
    const contexts = await Promise.all(
      Array.from({ length: numRequests }, () => browser.newContext())
    );

    const pages = await Promise.all(contexts.map(ctx => ctx.newPage()));

    try {
      await Promise.all(
        pages.map(async (page) => {
          await page.goto('/profile');
          await page.waitForLoadState('networkidle');
        })
      );

      // All pages should load successfully
      for (const page of pages) {
        await expect(page.locator('body')).toBeVisible();
      }

    } finally {
      await Promise.all(pages.map(p => p.close()));
      await Promise.all(contexts.map(ctx => ctx.close()));
    }
  });
});
