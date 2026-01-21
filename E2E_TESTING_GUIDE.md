# E2E Testing Guide

## Overview
Comprehensive end-to-end testing suite using Playwright covering authentication, navigation, matchmaking, performance, load testing, and accessibility compliance.

## Setup

Install Playwright:
```bash
npm install -D @playwright/test
npx playwright install
```

## Test Structure

- `e2e/basic.spec.ts` - Core functionality (auth, navigation, matchmaking)
- `e2e/performance/web-vitals.spec.ts` - Performance metrics (LCP, CLS, TTFB)
- `e2e/load/matchmaking-load.spec.ts` - Load testing for concurrent users
- `e2e/scenarios/user-journeys.spec.ts` - Complete user flows
- `e2e/scenarios/accessibility.spec.ts` - WCAG compliance tests

## Running Tests

Run all tests:
```bash
npx playwright test
```

Run specific suite:
```bash
npx playwright test e2e/basic.spec.ts
npx playwright test e2e/performance
npx playwright test e2e/load
npx playwright test e2e/scenarios
```

Run in headed mode (see browser):
```bash
npx playwright test --headed
```

Run specific browser:
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

Debug mode:
```bash
npx playwright test --debug
```

Generate HTML report:
```bash
npx playwright show-report
```

## Performance Budgets

- TTFB (Time to First Byte): < 600ms
- LCP (Largest Contentful Paint): < 2500ms
- CLS (Cumulative Layout Shift): < 0.1
- Total JS Bundle: < 500KB (gzipped)
- Page Load Time: < 3000ms

## Load Testing Thresholds

- Concurrent matchmaking users: 20+
- Average response time under load: < 2000ms
- Max response time: < 5000ms
- Concurrent profile requests: 15+

## Accessibility Standards

- WCAG 2.1 AA compliance
- Keyboard navigation on all interactive elements
- Skip links present and functional
- ARIA landmarks (header, main, nav, footer)
- Form labels properly associated
- Focus indicators visible
- Color contrast ≥ 4.5:1 for body text
- Screen reader announcements via aria-live

## CI Integration

Add to your CI pipeline (GitHub Actions example):
```yaml
- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npx playwright test

- name: Upload report
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Writing New Tests

1. Create test file in appropriate directory
2. Import test utilities:
   ```ts
   import { test, expect } from '@playwright/test';
   ```
3. Group related tests:
   ```ts
   test.describe('Feature Name', () => {
     test('should do something', async ({ page }) => {
       await page.goto('/path');
       await expect(page.locator('selector')).toBeVisible();
     });
   });
   ```

## Best Practices

- Use semantic selectors (role, label, text) over CSS selectors
- Wait for stable state before assertions (`waitForLoadState('networkidle')`)
- Clean up resources (close pages/contexts in load tests)
- Use data-testid for dynamic elements
- Test critical paths first
- Keep tests isolated and independent
- Use fixtures for reusable setup
- Mock external dependencies when appropriate

## Troubleshooting

- Flaky tests: Add explicit waits or `page.waitForLoadState()`
- Timeout errors: Increase timeout in `playwright.config.ts`
- Element not found: Verify selector with `npx playwright codegen`
- Performance variance: Run multiple times and average results
