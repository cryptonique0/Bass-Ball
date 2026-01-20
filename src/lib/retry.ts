// Retry utilities with exponential backoff
export interface RetryOptions {
  maxAttempts: number;
  delay: number;
  backoff: number;
  timeout?: number;
}

export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = { maxAttempts: 3, delay: 1000, backoff: 2 }
): Promise<T> {
  let lastError: Error | null = null;
  let delayMs = options.delay;

  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < options.maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
        delayMs *= options.backoff;
      }
    }
  }

  throw lastError || new Error('All retry attempts failed');
}

export async function timeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    ),
  ]);
}
