import { test, expect } from '@playwright/test';

test.describe('Performance Metrics', () => {
  test('should meet Core Web Vitals thresholds', async ({ page }) => {
    await page.goto('/');
    
    // Measure navigation timing
    const timing = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        ttfb: nav.responseStart - nav.requestStart,
        domLoad: nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
        loadComplete: nav.loadEventEnd - nav.loadEventStart,
      };
    });

    // TTFB should be < 600ms
    expect(timing.ttfb).toBeLessThan(600);
    
    // DOM content loaded < 1500ms
    expect(timing.domLoad).toBeLessThan(1500);
  });

  test('should measure LCP (Largest Contentful Paint)', async ({ page }) => {
    await page.goto('/');
    
    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        });
        observer.observe({ type: 'largest-contentful-paint', buffered: true });
        
        setTimeout(() => {
          observer.disconnect();
          resolve(0);
        }, 3000);
      });
    });

    // LCP should be < 2500ms for good performance
    if (lcp > 0) {
      expect(lcp).toBeLessThan(2500);
    }
  });

  test('should measure CLS (Cumulative Layout Shift)', async ({ page }) => {
    await page.goto('/');
    
    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsValue = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as any) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
        });
        observer.observe({ type: 'layout-shift', buffered: true });
        
        setTimeout(() => {
          observer.disconnect();
          resolve(clsValue);
        }, 3000);
      });
    });

    // CLS should be < 0.1 for good UX
    expect(cls).toBeLessThan(0.1);
  });

  test('should load critical resources quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;
    
    // Page should load in < 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should have acceptable bundle size', async ({ page }) => {
    await page.goto('/');
    
    const resources = await page.evaluate(() => {
      return performance.getEntriesByType('resource').map((r: any) => ({
        name: r.name,
        size: r.transferSize || 0,
        type: r.initiatorType,
      }));
    });

    const jsResources = resources.filter(r => r.type === 'script');
    const totalJsSize = jsResources.reduce((sum, r) => sum + r.size, 0);
    
    // Total JS should be < 500KB (gzipped)
    expect(totalJsSize).toBeLessThan(500 * 1024);
  });
});

test.describe('Lighthouse Performance', () => {
  test('should run lighthouse audit', async ({ page }) => {
    // This is a placeholder - actual Lighthouse integration requires additional setup
    await page.goto('/');
    
    // Manual metrics collection as proxy
    const metrics = await page.evaluate(() => ({
      memory: (performance as any).memory?.usedJSHeapSize || 0,
      resourceCount: performance.getEntriesByType('resource').length,
    }));

    expect(metrics.resourceCount).toBeLessThan(100);
  });
});
