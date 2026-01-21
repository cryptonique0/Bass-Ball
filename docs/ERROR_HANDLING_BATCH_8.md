/**
 * ERROR HANDLING & OBSERVABILITY - BATCH 8
 * 
 * Comprehensive error handling system with:
 * - Structured error classes with semantic types
 * - Retry logic with exponential backoff and jitter
 * - Sentry breadcrumbs for error tracking
 * - Error recovery strategies (retry, fallback, cache, graceful degrade)
 * - Circuit breaker pattern for failing services
 * - React error boundaries
 * - Complete observability and metrics
 */

// ============================================================================
// 1. STRUCTURED ERROR CLASSES (lib/errors.ts)
// ============================================================================

/**
 * Error Severity Levels
 */
enum ErrorSeverity {
  LOW = 'low',           // Info/logging only
  MEDIUM = 'medium',     // Warning, recoverable
  HIGH = 'high',         // Error, usually requires action
  CRITICAL = 'critical', // Fatal, system-wide impact
}

/**
 * Error Types
 */
enum ErrorType {
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  GATEWAY_ERROR = 'GATEWAY_ERROR',
  
  // Web3/blockchain errors
  WEB3_ERROR = 'WEB3_ERROR',
  WALLET_ERROR = 'WALLET_ERROR',
  CONTRACT_ERROR = 'CONTRACT_ERROR',
  TRANSACTION_ERROR = 'TRANSACTION_ERROR',
  RPC_ERROR = 'RPC_ERROR',
  
  // API errors
  API_ERROR = 'API_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  
  // Internal errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  RUNTIME_ERROR = 'RUNTIME_ERROR',
  RECOVERY_ERROR = 'RECOVERY_ERROR',
  
  // Service errors
  SERVICE_ERROR = 'SERVICE_ERROR',
  NOT_FOUND = 'NOT_FOUND',
}

/**
 * Structured error class
 */
class CustomError extends Error {
  constructor(
    message: string,
    public type: ErrorType = ErrorType.INTERNAL_ERROR,
    public severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    public meta?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'CustomError';
  }

  get userMessage(): string {
    // User-friendly error messages
    switch (this.type) {
      case ErrorType.NETWORK_ERROR:
        return 'Network connection failed. Please check your internet connection.';
      case ErrorType.TIMEOUT_ERROR:
        return 'The operation took too long. Please try again.';
      case ErrorType.WALLET_ERROR:
        return 'Wallet connection failed. Please reconnect.';
      default:
        return 'An error occurred. Please try again later.';
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      severity: this.severity,
      stack: this.stack,
      meta: this.meta,
    };
  }
}

// ============================================================================
// 2. ERROR HANDLER WITH SENTRY (lib/errorHandler.ts)
// ============================================================================

class ErrorHandler {
  private breadcrumbs: Breadcrumb[] = [];
  private errorMetrics: Map<string, ErrorMetric> = new Map();
  private errorHistory: CustomError[] = [];

  /**
   * Handle error with Sentry integration
   */
  handleError(error: CustomError, context?: ErrorContext) {
    // Add breadcrumb
    this.addBreadcrumb(error.type, this.getSentryLevel(error.severity), error.message, {
      ...error.meta,
      type: error.type,
    });

    // Update metrics
    this.updateMetrics(error, context);

    // Log to Sentry
    if (error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.HIGH) {
      Sentry.captureException(error, {
        tags: {
          errorType: error.type,
          severity: error.severity,
        },
      });
    }

    // Console logging in development
    console.group(`[${error.severity}] ${error.type}`);
    console.error('Message:', error.message);
    console.error('Context:', context);
    console.error('Metadata:', error.meta);
    console.error('Stack:', error.stack);
    console.groupEnd();
  }

  /**
   * Add breadcrumb for tracking user actions
   */
  addBreadcrumb(
    category: string,
    level: Sentry.SeverityLevel,
    message: string,
    data?: Record<string, any>
  ) {
    const breadcrumb: Breadcrumb = {
      category,
      level,
      message,
      timestamp: Date.now(),
      data,
    };

    this.breadcrumbs.push(breadcrumb);
    if (this.breadcrumbs.length > 50) this.breadcrumbs.shift();

    Sentry.addBreadcrumb({
      category,
      level,
      message,
      data,
    });
  }

  /**
   * Get error metrics for monitoring
   */
  getMetrics() {
    const metrics: Record<string, any> = {};
    for (const [key, metric] of this.errorMetrics) {
      metrics[key] = {
        count: metric.count,
        affectedUsersCount: metric.affectedUsers.size,
        lastOccurrence: new Date(metric.lastOccurrence).toISOString(),
      };
    }
    return metrics;
  }
}

// ============================================================================
// 3. RETRY LOGIC WITH EXPONENTIAL BACKOFF (lib/retry.ts)
// ============================================================================

/**
 * Retry configuration
 */
interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitterFactor: number; // Prevents thundering herd
  shouldRetry?: (error: Error, attempt: number) => boolean;
  onRetry?: (error: Error, attempt: number, nextDelayMs: number) => void;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 100,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  jitterFactor: 0.1, // 10% jitter
};

/**
 * Retry with exponential backoff
 */
async function retry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (config.shouldRetry && !config.shouldRetry(lastError, attempt)) {
        throw lastError;
      }

      if (attempt === config.maxAttempts) {
        throw lastError;
      }

      // Calculate backoff: baseDelay * (multiplier ^ (attempt-1)) + jitter
      const baseDelay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1);
      const cappedDelay = Math.min(baseDelay, config.maxDelayMs);
      const jitter = cappedDelay * config.jitterFactor * Math.random();
      const delayMs = cappedDelay + (Math.random() > 0.5 ? jitter : -jitter);

      if (config.onRetry) {
        config.onRetry(lastError, attempt, Math.round(delayMs));
      }

      await sleep(Math.max(0, Math.round(delayMs)));
    }
  }

  throw lastError;
}

/**
 * Predefined retry configurations
 */
const AGGRESSIVE_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 5,
  initialDelayMs: 50,
  maxDelayMs: 5000,
  backoffMultiplier: 1.5,
  jitterFactor: 0.2,
  shouldRetry: (error: Error) => {
    const message = error.message.toLowerCase();
    return message.includes('timeout') || message.includes('network');
  },
};

const CONSERVATIVE_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 2,
  initialDelayMs: 1000,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
  jitterFactor: 0.05,
  shouldRetry: (error: Error) => {
    const message = error.message.toLowerCase();
    // Don't retry auth errors
    return !(message.includes('unauthorized') || message.includes('forbidden'));
  },
};

// ============================================================================
// 4. CIRCUIT BREAKER PATTERN (lib/retry.ts)
// ============================================================================

/**
 * Circuit breaker for protecting failing services
 */
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime: number | null = null;
  private state: 'closed' | 'open' | 'half_open' = 'closed';

  constructor(
    private readonly failureThreshold: number = 5,
    private readonly resetTimeoutMs: number = 60000
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (this.shouldAttemptReset()) {
        this.state = 'half_open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private shouldAttemptReset(): boolean {
    return this.lastFailureTime !== null &&
      Date.now() - this.lastFailureTime > this.resetTimeoutMs;
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'open';
    }
  }
}

// ============================================================================
// 5. ERROR RECOVERY STRATEGIES (hooks/useErrorRecovery.ts)
// ============================================================================

/**
 * Recovery strategies for resilience
 */
enum RecoveryStrategy {
  RETRY = 'retry',
  FALLBACK = 'fallback',
  CACHE = 'cache',
  GRACEFUL_DEGRADE = 'graceful-degrade',
  USER_ACTION = 'user-action',
  RELOAD = 'reload',
}

/**
 * Hook for error recovery
 */
function useErrorRecovery(config?: Partial<ErrorRecoveryConfig>) {
  const [state, dispatch] = useReducer(recoveryReducer, initialState);
  const circuitBreakerRef = useRef<Map<string, CircuitBreaker>>(new Map());
  const cacheRef = useRef<Map<string, any>>(new Map());

  // Retry strategy with backoff
  const retryStrategy = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<RecoveryResult<T>> => {
      try {
        dispatch({ type: 'START_RECOVERY', strategy: 'retry' });
        const result = await retry(fn, config?.retryConfig);
        dispatch({ type: 'SUCCESS_RECOVERY' });
        return { success: true, strategy: 'retry', data: result };
      } catch (error) {
        dispatch({ type: 'FAILED_RECOVERY', error });
        return { success: false, strategy: 'retry', error };
      }
    },
    [config]
  );

  // Fallback strategy
  const fallbackStrategy = useCallback(
    async <T,>(fallbackData?: T): Promise<RecoveryResult<T>> => {
      if (fallbackData !== undefined) {
        dispatch({ type: 'SUCCESS_RECOVERY' });
        return { success: true, strategy: 'fallback', data: fallbackData };
      }
      return { success: false, strategy: 'fallback', error: new Error('No fallback data') };
    },
    []
  );

  // Cache strategy
  const cacheStrategy = useCallback(
    async <T,>(key: string, fn: () => Promise<T>): Promise<RecoveryResult<T>> => {
      const cached = cacheRef.current.get(key);
      if (cached) {
        dispatch({ type: 'SUCCESS_RECOVERY' });
        return { success: true, strategy: 'cache', data: cached };
      }

      try {
        const result = await fn();
        cacheRef.current.set(key, result);
        dispatch({ type: 'SUCCESS_RECOVERY' });
        return { success: true, strategy: 'cache', data: result };
      } catch (error) {
        dispatch({ type: 'FAILED_RECOVERY', error });
        return { success: false, strategy: 'cache', error };
      }
    },
    []
  );

  // Graceful degradation
  const gracefulDegrade = useCallback(
    async <T,>(
      fullFn: () => Promise<T>,
      degradedFn: () => Promise<Partial<T>>
    ): Promise<RecoveryResult<T | Partial<T>>> => {
      try {
        return await retryStrategy(fullFn);
      } catch {
        // Fall back to degraded functionality
        try {
          const result = await degradedFn();
          return { success: true, strategy: 'graceful-degrade', data: result };
        } catch (error) {
          return { success: false, strategy: 'graceful-degrade', error };
        }
      }
    },
    [retryStrategy]
  );

  return {
    state,
    strategies: {
      retry: retryStrategy,
      fallback: fallbackStrategy,
      cache: cacheStrategy,
      gracefulDegrade,
    },
  };
}

// ============================================================================
// 6. REACT ERROR BOUNDARY (components/ErrorBoundary.tsx)
// ============================================================================

/**
 * Error boundary component
 */
class ErrorBoundary extends React.Component<Props, State> {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const customError = new CustomError(
      error.message,
      ErrorType.RUNTIME_ERROR,
      ErrorSeverity.HIGH,
      { componentStack: errorInfo.componentStack }
    );

    getErrorHandler().handleError(customError);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>Reload Page</button>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// 7. USAGE EXAMPLES
// ============================================================================

/**
 * Example: Simple retry with exponential backoff
 */
async function fetchUserData() {
  return retry(
    async () => {
      const response = await fetch('/api/user');
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    },
    DEFAULT_RETRY_CONFIG
  );
}

/**
 * Example: Retry with custom configuration
 */
async function fetchWithCustomRetry() {
  return retry(
    async () => {
      const response = await fetch('/api/data');
      return response.json();
    },
    {
      maxAttempts: 5,
      initialDelayMs: 200,
      maxDelayMs: 5000,
      backoffMultiplier: 2,
      jitterFactor: 0.1,
      shouldRetry: (error) => {
        // Only retry network errors, not auth errors
        return !error.message.includes('401');
      },
      onRetry: (error, attempt, delay) => {
        console.log(`Retry attempt ${attempt} after ${delay}ms`);
      },
    }
  );
}

/**
 * Example: Using error recovery in a component
 */
function MyComponent() {
  const recovery = useErrorRecovery({
    maxRecoveryAttempts: 3,
    enableCache: true,
    enableCircuitBreaker: true,
  });

  const fetchData = async () => {
    // Try retry first
    let result = await recovery.strategies.retry(async () => {
      const response = await fetch('/api/data');
      return response.json();
    });

    if (!result.success) {
      // Fall back to cached data
      result = await recovery.strategies.cache('data', async () => {
        return { /* default data */ };
      });
    }

    if (!result.success) {
      // Use fallback data
      result = await recovery.strategies.fallback({ /* fallback */ });
    }

    return result;
  };

  return (
    <>
      <button onClick={fetchData}>Load Data</button>
      {recovery.state.isRecovering && <p>Recovering...</p>}
      {recovery.state.lastError && <p>Error: {recovery.state.lastError.message}</p>}
    </>
  );
}

/**
 * Example: Error boundary in a page
 */
export default function Page() {
  return (
    <ErrorBoundary level="page">
      <MyComponent />
    </ErrorBoundary>
  );
}

/**
 * Example: Circuit breaker usage
 */
const apiBreaker = new CircuitBreaker(5, 60000);

async function callAPI() {
  try {
    return await apiBreaker.execute(() => fetch('/api/endpoint'));
  } catch (error) {
    console.error('Circuit breaker open:', error);
  }
}

/**
 * Example: Sentry breadcrumb tracking
 */
function handleUserAction() {
  const errorHandler = getErrorHandler();

  errorHandler.addBreadcrumb('user-action', 'info', 'User clicked button', {
    buttonId: 'submit',
    formData: { /* sanitized */ },
  });

  // ... perform action ...

  if (error) {
    errorHandler.handleError(customError);
    // Sentry will have breadcrumb showing what user did before error
  }
}

// ============================================================================
// 8. MONITORING & METRICS
// ============================================================================

/**
 * Get error metrics for monitoring
 */
function getErrorMetrics() {
  const errorHandler = getErrorHandler();
  return {
    metrics: errorHandler.getMetrics(),
    history: errorHandler.getHistory(20),
    breadcrumbs: errorHandler.getBreadcrumbs(),
  };
}

/**
 * Dashboard component showing error metrics
 */
function ErrorDashboard() {
  const metrics = getErrorMetrics();

  return (
    <div>
      <h2>Error Metrics</h2>
      <table>
        <tbody>
          {Object.entries(metrics.metrics).map(([key, value]) => (
            <tr key={key}>
              <td>{key}</td>
              <td>{value.count}</td>
              <td>{value.affectedUsersCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ErrorDashboard;
