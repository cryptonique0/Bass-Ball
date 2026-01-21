# Batch 8: Error Handling & Observability - Setup Guide

## Overview

This batch implements a comprehensive error handling and observability system with:
- **Structured error classes** with semantic error types
- **Retry logic** with exponential backoff and jitter
- **Sentry breadcrumbs** for detailed error tracking
- **Error recovery strategies** (retry, fallback, cache, graceful degrade)
- **Circuit breaker pattern** for failing services
- **React error boundaries** for component errors
- **Error metrics and monitoring**

## Files Created/Modified

### 1. Core Error Handling

**[lib/errors.ts](lib/errors.ts)** (existing, referenced)
- `ErrorCode` enum with semantic error types
- `ErrorSeverity` enum (LOW, MEDIUM, HIGH, CRITICAL)
- `CustomError` class with serialization

**[lib/errorHandler.ts](lib/errorHandler.ts)** (existing, enhanced)
- `ErrorHandler` class for centralized error management
- Sentry integration with dynamic initialization
- Breadcrumb tracking for user actions
- Error metrics collection
- `getErrorHandler()` singleton

### 2. Retry Logic

**[lib/retry.ts](lib/retry.ts)** (new)
- `RetryConfig` interface with configuration options
- `retry()` function with exponential backoff
- `retryGenerator()` for streaming operations
- `CircuitBreaker` class for protecting failing services
- Predefined configurations:
  - `DEFAULT_RETRY_CONFIG` - balanced approach
  - `AGGRESSIVE_RETRY_CONFIG` - for transient errors
  - `CONSERVATIVE_RETRY_CONFIG` - for critical operations
- Helper functions: `retryWithBackoff()`, `retryAll()`, `retryAllSettled()`, `retryWithTimeout()`

### 3. Error Recovery Strategies

**[hooks/useErrorRecovery.ts](hooks/useErrorRecovery.ts)** (enhanced)
- `useErrorRecovery()` hook with multiple strategies:
  - **Retry**: Exponential backoff with jitter
  - **Fallback**: Use fallback data when primary fails
  - **Cache**: Cache results and serve from cache on failure
  - **Graceful Degrade**: Full → degraded functionality
  - **User Action**: Wait for user action (e.g., reconnect wallet)
  - **Reload**: Page reload as last resort
- Circuit breaker integration
- Recovery state management
- `useResilientFetch()` for data fetching

### 4. React Components

**[components/ErrorBoundary.tsx](components/ErrorBoundary.tsx)** (new)
- `ErrorBoundary` class component for catching React errors
- `useErrorBoundary()` hook for functional components
- `AsyncErrorBoundary` for unhandled promise rejections
- Default error UI with technical details in dev
- Customizable fallback UI

**[components/ErrorHandlingExamples.tsx](components/ErrorHandlingExamples.tsx)** (new)
- 7 working examples demonstrating:
  1. Simple retry with exponential backoff
  2. Error recovery strategies
  3. Circuit breaker pattern
  4. Error boundary usage
  5. Aggressive retry configuration
  6. Conservative retry configuration
  7. Error tracking with Sentry breadcrumbs

## Installation & Setup

### 1. Install Dependencies

```bash
npm install @sentry/nextjs
```

### 2. Environment Variables

Add to `.env.local`:

```env
# Sentry configuration (optional, but recommended)
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Environment
NODE_ENV=development
```

### 3. Initialize Error Handler

In your Next.js `app.tsx` or `_app.tsx`:

```typescript
import { initErrorHandler } from '@/lib/errorHandler';

// Initialize at app startup
export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initErrorHandler({
      sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
    });
  }, []);

  return (
    <html>
      <body>
        <ErrorBoundary level="page">
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

### 4. Wrap Components with Error Boundary

```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function Page() {
  return (
    <ErrorBoundary level="page">
      <YourComponent />
    </ErrorBoundary>
  );
}
```

## Usage Examples

### Basic Retry with Backoff

```typescript
import { retry, DEFAULT_RETRY_CONFIG } from '@/lib/retry';

const data = await retry(
  async () => {
    const response = await fetch('/api/data');
    if (!response.ok) throw new Error('API error');
    return response.json();
  },
  DEFAULT_RETRY_CONFIG
);
```

### Error Recovery Strategies

```typescript
import { useErrorRecovery } from '@/hooks/useErrorRecovery';

function MyComponent() {
  const recovery = useErrorRecovery({
    maxRecoveryAttempts: 3,
    enableCache: true,
    enableCircuitBreaker: true,
  });

  const fetchData = async () => {
    // Try retry first
    let result = await recovery.strategies.retry(async () => {
      return fetch('/api/data').then(r => r.json());
    });

    // Fall back to cached data
    if (!result.success) {
      result = await recovery.strategies.cache('api-data', async () => {
        return { /* cached data */ };
      });
    }

    // Fall back to default data
    if (!result.success) {
      result = await recovery.strategies.fallback({ /* default */ });
    }

    return result;
  };

  return (
    <button onClick={fetchData}>
      {recovery.state.isRecovering ? 'Recovering...' : 'Load Data'}
    </button>
  );
}
```

### Graceful Degradation

```typescript
const result = await recovery.strategies.gracefulDegrade(
  // Full functionality
  async () => {
    return { full: true, features: ['search', 'filter', 'sort'] };
  },
  // Degraded functionality
  async () => {
    return { degraded: true, features: ['search'] };
  }
);
```

### Circuit Breaker

```typescript
import { CircuitBreaker } from '@/lib/retry';

const apiBreaker = new CircuitBreaker(5, 60000); // 5 failures, 60s reset

try {
  const result = await apiBreaker.execute(async () => {
    return fetch('/api/endpoint').then(r => r.json());
  });
} catch (error) {
  console.error('Circuit open or request failed');
}
```

### Error Tracking with Breadcrumbs

```typescript
import { getErrorHandler, logBreadcrumb } from '@/lib/errorHandler';

// Log user actions
logBreadcrumb('user-action', 'info', 'User clicked submit button', {
  formId: 'payment-form',
});

// If error occurs, Sentry will include these breadcrumbs
try {
  const result = await processPayment(data);
} catch (error) {
  const errorHandler = getErrorHandler();
  errorHandler.handleError(
    new CustomError(
      error.message,
      ErrorCode.TX_FAILED,
      ErrorSeverity.HIGH,
      { formId: 'payment-form' }
    ),
    { userId: 'user-123', module: 'checkout' }
  );
}
```

### Error Boundary in Components

```typescript
function ComponentWithError() {
  const [shouldError, setShouldError] = useState(false);

  if (shouldError) {
    throw new CustomError(
      'Rendering failed',
      ErrorCode.INTERNAL_ERROR,
      ErrorSeverity.HIGH
    );
  }

  return (
    <ErrorBoundary level="component">
      {/* Your component content */}
    </ErrorBoundary>
  );
}
```

## Error Recovery Strategies Comparison

| Strategy | Use Case | Fallback | Latency |
|----------|----------|----------|---------|
| **Retry** | Transient failures | None | Increases with attempts |
| **Fallback** | Known defaults | Default data | Low |
| **Cache** | Read operations | Cache hit | Very low |
| **Graceful Degrade** | Partial failure | Degraded functionality | Low |
| **User Action** | Auth/connection | User can fix | Variable |
| **Reload** | Last resort | Fresh state | High |

## Retry Configuration Presets

### AGGRESSIVE_RETRY_CONFIG
```typescript
{
  maxAttempts: 5,
  initialDelayMs: 50,
  maxDelayMs: 5000,
  backoffMultiplier: 1.5,
  jitterFactor: 0.2,
  shouldRetry: (error) => {
    // Retry on transient errors only
  }
}
```

### CONSERVATIVE_RETRY_CONFIG
```typescript
{
  maxAttempts: 2,
  initialDelayMs: 1000,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
  jitterFactor: 0.05,
  shouldRetry: (error) => {
    // Skip auth/validation errors
  }
}
```

## Circuit Breaker States

1. **CLOSED** (Normal)
   - Requests pass through
   - Failure count reset
   - Fast failures with no delay

2. **OPEN** (Failed)
   - Requests rejected immediately
   - No calls to failing service
   - After `resetTimeout`, goes to HALF_OPEN

3. **HALF_OPEN** (Testing)
   - One request allowed through
   - If succeeds → CLOSED
   - If fails → OPEN

## Monitoring & Metrics

```typescript
import { getErrorHandler } from '@/lib/errorHandler';

const handler = getErrorHandler();

// Get error metrics
const metrics = handler.getMetrics();
// {
//   'NETWORK_ERROR:high': {
//     count: 5,
//     affectedUsersCount: 2,
//     lastOccurrence: '2024-01-15T10:30:00.000Z'
//   }
// }

// Get error history
const history = handler.getHistory(10);

// Get breadcrumbs
const breadcrumbs = handler.getBreadcrumbs();
```

## Best Practices

### 1. Specific Error Types
```typescript
// ✅ Good
throw new CustomError(
  'Failed to fetch user data',
  ErrorCode.NETWORK_ERROR,
  ErrorSeverity.HIGH
);

// ❌ Avoid
throw new Error('Something went wrong');
```

### 2. Meaningful Context
```typescript
// ✅ Good
errorHandler.handleError(customError, {
  userId: 'user-123',
  module: 'checkout',
  action: 'process_payment',
});

// ❌ Avoid
errorHandler.handleError(customError);
```

### 3. Appropriate Retry Strategy
```typescript
// ✅ Good - transient error with aggressive retry
await retry(networkCall, AGGRESSIVE_RETRY_CONFIG);

// ✅ Good - critical operation with conservative retry
await retry(contractCall, CONSERVATIVE_RETRY_CONFIG);

// ❌ Avoid - retrying auth errors
await retry(unauthorizedCall, DEFAULT_RETRY_CONFIG);
```

### 4. Circuit Breaker for External Services
```typescript
// ✅ Good - protect against cascading failures
const breaker = new CircuitBreaker(5, 60000);
await breaker.execute(externalServiceCall);

// ❌ Avoid - no protection
await externalServiceCall();
```

### 5. Error Boundaries at Multiple Levels
```typescript
// ✅ Good - nested error boundaries
<ErrorBoundary level="page">
  <Header />
  <ErrorBoundary level="section">
    <MainContent />
  </ErrorBoundary>
  <Footer />
</ErrorBoundary>
```

## Troubleshooting

### Sentry Not Capturing Errors

1. Verify DSN is set in environment variables
2. Check Sentry initialization in console
3. Ensure error severity is HIGH or CRITICAL
4. Check Sentry project settings

### Circuit Breaker Always Open

1. Verify failure threshold isn't too low
2. Increase reset timeout if needed
3. Check if service is actually failing
4. Review logs for actual error cause

### Retry Not Happening

1. Verify `shouldRetry` callback returns `true`
2. Check if max attempts reached
3. Review retry configuration
4. Ensure error is retryable

## Examples

See [components/ErrorHandlingExamples.tsx](components/ErrorHandlingExamples.tsx) for 7 working examples:

1. Simple retry
2. Error recovery strategies
3. Circuit breaker
4. Error boundary
5. Aggressive retry
6. Conservative retry
7. Error tracking

## Next Steps

1. Add custom error handlers for specific domains (e.g., Web3 errors)
2. Implement error rate alerting
3. Add detailed error dashboards
4. Create error recovery playbooks
5. Add A/B testing for recovery strategies
