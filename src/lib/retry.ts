/**
 * Retry utilities with exponential backoff
 * 
 * Provides robust retry logic for handling transient failures in network requests,
 * API calls, and other operations that may temporarily fail.
 */

/** Configuration options for retry behavior */
export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxAttempts: number;
  /** Initial delay in milliseconds before first retry */
  delay: number;
  /** Backoff multiplier (e.g., 2 for exponential backoff) */
  backoff: number;
  /** Optional timeout in milliseconds for each attempt */
  timeout?: number;
  /** Optional callback for retry attempts */
  onRetry?: (attempt: number, error: Error) => void;
  /** Optional function to determine if error is retryable */
  shouldRetry?: (error: Error) => boolean;
}

/** Default retry configuration */
const DEFAULT_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  delay: 1000,
  backoff: 2,
};

/**
 * Retry a function with exponential backoff
 * 
 * @param fn - Async function to retry
 * @param options - Retry configuration options
 * @returns Promise that resolves with function result or rejects after all attempts fail
 * @throws {Error} The last error encountered if all retries fail
 * 
 * @example
 * ```ts
 * const data = await retry(
 *   () => fetch('/api/data').then(r => r.json()),
 *   { maxAttempts: 5, delay: 1000, backoff: 2 }
 * );
 * ```
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;
  let delayMs = opts.delay;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      // Apply timeout if specified
      if (opts.timeout) {
        return await timeout(fn(), opts.timeout);
      }
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if error is retryable
      if (opts.shouldRetry && !opts.shouldRetry(lastError)) {
        throw lastError;
      }
      
      // Call onRetry callback if provided
      if (opts.onRetry && attempt < opts.maxAttempts) {
        opts.onRetry(attempt, lastError);
      }
      
      // Wait before next attempt (except on final attempt)
      if (attempt < opts.maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
        delayMs *= opts.backoff;
      }
    }
  }

  throw lastError || new Error('All retry attempts failed without capturing an error');
}

/**
 * Wrap a promise with a timeout
 * 
 * @param promise - Promise to wrap
 * @param ms - Timeout in milliseconds
 * @returns Promise that rejects if timeout is exceeded
 * @throws {Error} Timeout error if promise doesn't resolve in time
 * 
 * @example
 * ```ts
 * const result = await timeout(fetch('/api/slow'), 5000);
 * ```
 */
export async function timeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms)
    ),
  ]);
}

/**
 * Retry with jittered backoff to avoid thundering herd
 * 
 * @param fn - Async function to retry
 * @param options - Retry configuration options
 * @returns Promise that resolves with function result
 */
export async function retryWithJitter<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;
  let delayMs = opts.delay;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      if (opts.timeout) {
        return await timeout(fn(), opts.timeout);
      }
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (opts.shouldRetry && !opts.shouldRetry(lastError)) {
        throw lastError;
      }
      
      if (opts.onRetry && attempt < opts.maxAttempts) {
        opts.onRetry(attempt, lastError);
      }
      
      if (attempt < opts.maxAttempts) {
        // Add jitter: random value between 0 and delayMs
        const jitteredDelay = Math.random() * delayMs;
        await new Promise(resolve => setTimeout(resolve, jitteredDelay));
        delayMs *= opts.backoff;
      }
    }
  }

  throw lastError || new Error('All retry attempts failed');
}
