import { CustomError, ErrorCode, ErrorSeverity } from './errors';
import { getErrorHandler } from './errorHandler';

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitterFactor: number; // 0-1, adds randomness to prevent thundering herd
  shouldRetry?: (error: Error, attempt: number) => boolean;
  onRetry?: (error: Error, attempt: number, nextDelayMs: number) => void;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 100,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  jitterFactor: 0.1,
};

/**
 * Aggressive retry for transient errors
 */
export const AGGRESSIVE_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 5,
  initialDelayMs: 50,
  maxDelayMs: 5000,
  backoffMultiplier: 1.5,
  jitterFactor: 0.2,
  shouldRetry: (error: Error) => {
    const message = error.message.toLowerCase();
    return message.includes('timeout') ||
      message.includes('network') ||
      message.includes('temporarily unavailable');
  },
};

/**
 * Conservative retry for critical operations
 */
export const CONSERVATIVE_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 2,
  initialDelayMs: 1000,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
  jitterFactor: 0.05,
  shouldRetry: (error: Error) => {
    const message = error.message.toLowerCase();
    return !(message.includes('unauthorized') ||
      message.includes('forbidden') ||
      message.includes('invalid'));
  },
};

/**
 * Calculate backoff delay with exponential backoff and jitter
 */
function calculateBackoffDelay(
  config: RetryConfig,
  attempt: number
): number {
  // Exponential backoff: initialDelay * (multiplier ^ attempt)
  let delay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1);

  // Cap at max delay
  delay = Math.min(delay, config.maxDelayMs);

  // Add jitter to prevent thundering herd
  const jitter = delay * config.jitterFactor * Math.random();
  delay = delay + (Math.random() > 0.5 ? jitter : -jitter);

  // Ensure delay is non-negative
  return Math.max(0, Math.round(delay));
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  configOrAttempts: RetryConfig | number = DEFAULT_RETRY_CONFIG
): Promise<T> {
  const config = typeof configOrAttempts === 'number'
    ? { ...DEFAULT_RETRY_CONFIG, maxAttempts: configOrAttempts }
    : configOrAttempts;

  let lastError: Error | null = null;
  const errorHandler = getErrorHandler();

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      errorHandler.addBreadcrumb(
        'retry',
        'info',
        `Attempt ${attempt}/${config.maxAttempts}`
      );

      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      if (config.shouldRetry && !config.shouldRetry(lastError, attempt)) {
        throw lastError;
      }

      // If this is the last attempt, throw
      if (attempt === config.maxAttempts) {
        throw lastError;
      }

      // Calculate delay
      const delayMs = calculateBackoffDelay(config, attempt);

      // Call retry callback
      if (config.onRetry) {
        config.onRetry(lastError, attempt, delayMs);
      }

      // Log retry attempt
      errorHandler.addBreadcrumb(
        'retry',
        'warning',
        `Attempt ${attempt} failed, waiting ${delayMs}ms`,
        {
          error: lastError.message,
          attempt,
          nextDelayMs: delayMs,
        }
      );

      // Wait before retrying
      await sleep(delayMs);
    }
  }

  // This should never be reached, but satisfy TypeScript
  throw lastError || new Error('Retry failed');
}

/**
 * Retry with async generator (for streaming results)
 */
export async function* retryGenerator<T>(
  fn: () => AsyncGenerator<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): AsyncGenerator<T> {
  const errorHandler = getErrorHandler();
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      errorHandler.addBreadcrumb(
        'generator-retry',
        'info',
        `Generator attempt ${attempt}/${config.maxAttempts}`
      );

      yield* fn();
      return; // Success, exit
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (config.shouldRetry && !config.shouldRetry(lastError, attempt)) {
        throw lastError;
      }

      if (attempt === config.maxAttempts) {
        throw lastError;
      }

      const delayMs = calculateBackoffDelay(config, attempt);

      if (config.onRetry) {
        config.onRetry(lastError, attempt, delayMs);
      }

      errorHandler.addBreadcrumb(
        'generator-retry',
        'warning',
        `Generator retry ${attempt} failed, waiting ${delayMs}ms`,
        { error: lastError.message, attempt }
      );

      await sleep(delayMs);
    }
  }

  throw lastError || new Error('Generator retry failed');
}

/**
 * Retry with circuit breaker pattern
 */
export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime: number | null = null;
  private state: 'closed' | 'open' | 'half_open' = 'closed';

  constructor(
    private readonly failureThreshold: number = 5,
    private readonly resetTimeoutMs: number = 60000
  ) {}

  /**
   * Execute function with circuit breaker
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (this.shouldAttemptReset()) {
        this.state = 'half_open';
      } else {
        throw new CustomError(
          'Circuit breaker is open',
          ErrorCode.PROVIDER_UNAVAILABLE,
          ErrorSeverity.HIGH,
          { state: this.state }
        );
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  /**
   * Check if we should attempt to reset
   */
  private shouldAttemptReset(): boolean {
    return (
      this.lastFailureTime !== null &&
      Date.now() - this.lastFailureTime > this.resetTimeoutMs
    );
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'closed';
  }

  /**
   * Handle failed execution
   */
  private onFailure(error: Error | unknown): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'open';
    }
  }

  /**
   * Get current state
   */
  getState(): {
    state: string;
    failureCount: number;
    lastFailureTime: number | null;
  } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
    };
  }

  /**
   * Reset circuit breaker
   */
  reset(): void {
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'closed';
  }
}

/**
 * Retry with exponential backoff (legacy alias)
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  initialDelayMs: number = 100,
  backoffMultiplier: number = 2
): Promise<T> {
  return retry(fn, {
    maxAttempts,
    initialDelayMs,
    maxDelayMs: 10000,
    backoffMultiplier,
    jitterFactor: 0.1,
  });
}

/**
 * Promise.all with retry
 */
export async function retryAll<T>(
  promises: Array<() => Promise<T>>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T[]> {
  return Promise.all(
    promises.map(p => retry(p, config))
  );
}

/**
 * Promise.allSettled with retry
 */
export async function retryAllSettled<T>(
  promises: Array<() => Promise<T>>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<PromiseSettledResult<T>[]> {
  return Promise.allSettled(
    promises.map(p => retry(p, config))
  );
}

/**
 * Timeout wrapper for retries
 */
export async function retryWithTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  return Promise.race([
    retry(fn, retryConfig),
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new CustomError(
          `Operation timed out after ${timeoutMs}ms`,
          ErrorType.TIMEOUT_ERROR,
          ErrorSeverity.HIGH
        )),
        timeoutMs
      )
    ),
  ]);
}
