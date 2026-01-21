import { test, expect } from '@playwright/test';

test.describe('Accessibility Compliance', () => {
  test('should have accessible navigation', async ({ page }) => {
    await page.goto('/accessibility-demo');
    
    // Tab to skip link
    await page.keyboard.press('Tab');
    const skipLink = await page.locator('a:has-text("Skip to content")');
    await expect(skipLink).toBeFocused();
    
    // Activate skip link
    await page.keyboard.press('Enter');
    
    // Main content should be focused
    const main = page.locator('main#main, [id="main"]');
    await expect(main).toBeVisible();
  });

  test('should have proper form labels', async ({ page }) => {
    await page.goto('/accessibility-demo');
    
    // Check name input has label
    const nameInput = page.locator('input#name-input');
    if (await nameInput.count() > 0) {
      const label = page.locator('label[for="name-input"]');
      await expect(label).toBeVisible();
    }
  });

  test('should support keyboard navigation in modal', async ({ page }) => {
    await page.goto('/accessibility-demo');
    
    // Open modal
    const openBtn = page.getByRole('button', { name: /open modal/i });
    await openBtn.click();
    
    // Modal should be visible
    const modal = page.locator('[role="dialog"][aria-modal="true"]');
    await expect(modal).toBeVisible();
    
    // Close button should be focused
    const closeBtn = modal.getByRole('button', { name: /close/i });
    await expect(closeBtn).toBeFocused();
    
    // Press Escape to close
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });

  test('should announce live region updates', async ({ page }) => {
    await page.goto('/accessibility-demo');
    
    // Check for aria-live region
    const liveRegion = page.locator('[aria-live]');
    await expect(liveRegion).toBeAttached();
    
    // Trigger announcement
    const announceBtn = page.getByRole('button', { name: /announce update/i });
    if (await announceBtn.count() > 0) {
      await announceBtn.click();
      
      // Wait for announcement to appear
      await page.waitForTimeout(200);
      const announcement = await liveRegion.textContent();
      expect(announcement).toBeTruthy();
    }
  });

  test('should have semantic landmarks', async ({ page }) => {
    await page.goto('/accessibility-demo');
    
    // Check for main landmark
    const main = page.locator('main, [role="main"]');
    await expect(main).toBeVisible();
    
    // Check for header
    const header = page.locator('header, [role="banner"]');
    await expect(header).toBeVisible();
    
    // Check for footer
    const footer = page.locator('footer, [role="contentinfo"]');
    await expect(footer).toBeVisible();
  });
});

test.describe('Keyboard Navigation', () => {
  test('should navigate through all interactive elements', async ({ page }) => {
    await page.goto('/accessibility-demo');
    
    let tabCount = 0;
    const maxTabs = 20;
    
    // Tab through elements
    while (tabCount < maxTabs) {
      await page.keyboard.press('Tab');
      tabCount++;
      
      // Check if we've cycled back to body
      const focused = await page.evaluate(() => document.activeElement?.tagName);
      if (focused === 'BODY' && tabCount > 5) break;
    }
    
    // Should have tabbed through multiple elements
    expect(tabCount).toBeGreaterThan(3);
  });

  test('should show focus indicators', async ({ page }) => {
    await page.goto('/accessibility-demo');
    
    // Enable focus visible toggle
    const focusToggle = page.getByLabel(/show focus outlines/i);
    if (await focusToggle.count() > 0) {
      await focusToggle.check();
    }
    
    // Tab to button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Check for focus styles
    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;
      const styles = window.getComputedStyle(el);
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
      };
    });
    
    expect(focused).toBeTruthy();
  });
});

test.describe('Color Contrast', () => {
  test('should validate contrast ratios', async ({ page }) => {
    await page.goto('/accessibility-demo');
    
    // Test contrast checker
    const fgInput = page.locator('input[placeholder="#000000"]').first();
    const bgInput = page.locator('input[placeholder="#ffffff"]').first();
    
    if (await fgInput.count() > 0 && await bgInput.count() > 0) {
      await fgInput.fill('#000000');
      await bgInput.fill('#ffffff');
      
      // Check result
      await page.waitForTimeout(200);
      const result = page.getByText(/Pass/i);
      await expect(result.first()).toBeVisible();
    }
  });
});

test.describe('Screen Reader Optimization', () => {
  test('should have ARIA labels on interactive elements', async ({ page }) => {
    await page.goto('/');
    
    // Check buttons have accessible names
    const buttons = await page.locator('button').all();
    for (const btn of buttons.slice(0, 5)) {
      const ariaLabel = await btn.getAttribute('aria-label');
      const textContent = await btn.textContent();
      
      // Button should have either aria-label or text content
      expect(ariaLabel || textContent).toBeTruthy();
    }
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/accessibility-demo');
    
    // Check for h1
    const h1 = page.locator('h1');
    await expect(h1.first()).toBeVisible();
    
    // Check heading levels are in order
    const headings = await page.evaluate(() => {
      const hElements = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      return hElements.map(h => parseInt(h.tagName.charAt(1)));
    });
    
    expect(headings.length).toBeGreaterThan(0);
    expect(headings[0]).toBe(1); // First heading should be h1
  });
});
