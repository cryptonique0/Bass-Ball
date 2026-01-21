# Performance Monitoring Quick Reference

- RUM Service: `services/rum-service.ts`
  - Initialize and start observers:
    ```tsx
    import rumService from '@/services/rum-service';
    // Usually run once on app boot (client)
    rumService.initialize();
    // Optional budgets
    rumService.setBudgets({ LCP: 2500, CLS: 0.1, INP: 200 });
    ```
  - SPA navigation tracking:
    ```tsx
    // Call on route changes
    rumService.recordNavigation('/new-route');
    ```
  - Custom events:
    ```tsx
    rumService.addEvent('ui.click', { id: 'buy-button' });
    ```
  - Reports:
    ```tsx
    const report = rumService.getReport();
    await rumService.sendReport(); // if endpoint configured
    ```

- Error Tracking: `services/error-tracking.ts`
  - Initialize (Sentry if available):
    ```tsx
    import errorTracking from '@/services/error-tracking';
    await errorTracking.init({ dsn: 'https://<public-dsn>', environment: 'prod', release: '1.0.0' });
    // Enable global crash handlers (window.onerror, unhandledrejection)
    errorTracking.enableGlobalHandlers();
    ```
  - Capture exceptions/messages:
    ```tsx
    try { /* ... */ } catch (err) {
      errorTracking.captureException(err as Error, { feature: 'checkout' });
    }
    errorTracking.captureMessage('User navigated to deprecated page', 'warning', { path: '/old' });
    ```
  - Enrich context:
    ```tsx
    errorTracking.setUser({ id: 'u_123', email: 'user@example.com' });
    errorTracking.setTag('region', 'us-east');
    errorTracking.setContext('feature', { name: 'inventory' });
    ```

## Notes
- INP is approximated via longest `event` duration if the browser supports `PerformanceEventTiming`.
- Long tasks are observed when the browser exposes the `longtask` entry type.
- If Sentry is not present, errors are queued and optionally sent to `endpoint` if configured.
