import { useCallback, useState } from 'react';

export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export interface RetryState {
  attempts: number;
  maxAttempts: number;
  lastError: string | null;
  nextRetryIn: number;
  isRetrying: boolean;
}

export const useTransactionRetry = (config?: Partial<RetryConfig>) => {
  const defaults: RetryConfig = {
    maxAttempts: 5,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    ...config,
  };

  const [state, setState] = useState<RetryState>({
    attempts: 0,
    maxAttempts: defaults.maxAttempts,
    lastError: null,
    nextRetryIn: 0,
    isRetrying: false,
  });

  const calcDelay = useCallback((attempt: number): number => {
    const exp = defaults.initialDelay *
      Math.pow(defaults.backoffMultiplier, attempt - 1);
    const jitter = Math.random() * 1000;
    const total = exp + jitter;
    return Math.min(total, defaults.maxDelay);
  }, [defaults]);

  const canRetry = useCallback((): boolean => {
    return state.attempts < defaults.maxAttempts;
  }, [state.attempts, defaults.maxAttempts]);

  const scheduleRetry = useCallback((error?: string) => {
    if (!canRetry()) {
      setState(prev => ({
        ...prev,
        isRetrying: false,
        lastError: error || 'Max retries exceeded',
      }));
      return false;
    }

    const next = state.attempts + 1;
    const delay = calcDelay(next);

    setState(prev => ({
      ...prev,
      attempts: next,
      nextRetryIn: delay,
      isRetrying: true,
      lastError: error || null,
    }));

    return true;
  }, [canRetry, state.attempts, calcDelay]);

  const reset = useCallback(() => {
    setState({
      attempts: 0,
      maxAttempts: defaults.maxAttempts,
      lastError: null,
      nextRetryIn: 0,
      isRetrying: false,
    });
  }, [defaults.maxAttempts]);

  return {
    state,
    canRetry,
    scheduleRetry,
    reset,
    getDelay: () => calcDelay(state.attempts),
  };
};
