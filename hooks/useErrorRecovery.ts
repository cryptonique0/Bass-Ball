'use client';

import { useCallback, useReducer, useRef } from 'react';
import { CustomError, ErrorSeverity, ErrorType } from '@/lib/errors';
import { getErrorHandler } from '@/lib/errorHandler';
import { retry, RetryConfig, DEFAULT_RETRY_CONFIG, CircuitBreaker } from '@/lib/retry';

/**
 * Recovery strategy type
 */
export type RecoveryStrategy =
  | 'retry'
  | 'fallback'
  | 'cache'
  | 'graceful-degrade'
  | 'user-action'
  | 'reload';

/**
 * Error recovery state
 */
export interface RecoveryState {
  isRecovering: boolean;
  strategy: RecoveryStrategy | null;
  lastError: CustomError | null;
  recoveryAttempts: number;
  lastRecoveryTime: number | null;
  canRecover: boolean;
}

/**
 * Recovery action
 */
export type RecoveryAction =
  | { type: 'START_RECOVERY'; strategy: RecoveryStrategy; error: CustomError }
  | { type: 'SUCCESS_RECOVERY' }
  | { type: 'FAILED_RECOVERY'; error: CustomError }
  | { type: 'RESET' };

/**
 * Recovery result
 */
export interface RecoveryResult<T = any> {
  success: boolean;
  strategy: RecoveryStrategy;
  data?: T;
  error?: CustomError;
  attempts: number;
}

/**
 * Error recovery configuration
 */
export interface ErrorRecoveryConfig {
  maxRecoveryAttempts: number;
  retryConfig: RetryConfig;
  enableCache: boolean;
  enableCircuitBreaker: boolean;
  circuitBreakerThreshold: number;
  fallbackData?: any;
  onRecovery?: (result: RecoveryResult) => void;
}

const DEFAULT_CONFIG: ErrorRecoveryConfig = {
  maxRecoveryAttempts: 3,
  retryConfig: DEFAULT_RETRY_CONFIG,
  enableCache: true,
  enableCircuitBreaker: true,
  circuitBreakerThreshold: 5,
};

/**
 * Hook for error recovery and resilience
 */
export function useErrorRecovery(config?: Partial<ErrorRecoveryConfig>) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const errorHandler = getErrorHandler();
  const circuitBreakerRef = useRef<Map<string, CircuitBreaker>>(new Map());
  const cacheRef = useRef<Map<string, { data: any; timestamp: number }>>(new Map());

  const [state, dispatch] = useReducer(
    (state: RecoveryState, action: RecoveryAction): RecoveryState => {
      switch (action.type) {
        case 'START_RECOVERY':
          return {
            ...state,
            isRecovering: true,
            strategy: action.strategy,
            lastError: action.error,
          };

        case 'SUCCESS_RECOVERY':
          return {
            ...state,
            isRecovering: false,
            recoveryAttempts: state.recoveryAttempts + 1,
            lastRecoveryTime: Date.now(),
            canRecover: true,
          };

        case 'FAILED_RECOVERY':
          return {
    if (!cached) return null;

    // Cache valid for 5 minutes
    if (Date.now() - cached.timestamp > 5 * 60 * 1000) {
      cacheRef.current.delete(key);
      return null;
    }

    return cached.data;
  }, [finalConfig.enableCache]);

  /**
   * Set cache
   */
  const setCached = useCallback((key: string, data: any): void => {
    if (!finalConfig.enableCache) return;
    cacheRef.current.set(key, { data, timestamp: Date.now() });
  }, [finalConfig.enableCache]);

  /**
   * Retry strategy
   */
  const retryStrategy = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<RecoveryResult<T>> => {
      try {
        dispatch({ type: 'START_RECOVERY', strategy: 'retry', error: state.lastError! });

        const result = await retry(fn, finalConfig.retryConfig);

        dispatch({ type: 'SUCCESS_RECOVERY' });
        errorHandler.addBreadcrumb('Recovery: retry successful', {}, 'info');

        return {
          success: true,
          strategy: 'retry',
          data: result,
          attempts: state.recoveryAttempts,
        };
      } catch (error) {
        const customError = error instanceof CustomError
          ? error
          : new CustomError(
            error instanceof Error ? error.message : 'Retry failed',
            ErrorType.RECOVERY_ERROR,
            ErrorSeverity.HIGH
          );

        dispatch({ type: 'FAILED_RECOVERY', error: customError });
        errorHandler.addBreadcrumb('Recovery: retry failed', { error: customError.message }, 'warning');

        return {
          success: false,
          strategy: 'retry',
          error: customError,
          attempts: state.recoveryAttempts,
        };
      }
    },
    [state.recoveryAttempts, state.lastError, finalConfig.retryConfig, errorHandler]
  );

  /**
   * Fallback strategy
   */
  const fallbackStrategy = useCallback(
    async <T,>(data?: T): Promise<RecoveryResult<T>> => {
      dispatch({ type: 'START_RECOVERY', strategy: 'fallback', error: state.lastError! });

      const fallbackData = data ?? finalConfig.fallbackData;

      if (fallbackData !== undefined) {
        dispatch({ type: 'SUCCESS_RECOVERY' });
        errorHandler.addBreadcrumb('Recovery: using fallback data', {}, 'info');

        return {
          success: true,
          strategy: 'fallback',
          data: fallbackData,
          attempts: state.recoveryAttempts,
        };
      }

      const error = new CustomError(
        'No fallback data available',
        ErrorType.RECOVERY_ERROR,
        ErrorSeverity.MEDIUM
      );

      dispatch({ type: 'FAILED_RECOVERY', error });
      return {
        success: false,
        strategy: 'fallback',
        error,
        attempts: state.recoveryAttempts,
      };
    },
    [state.recoveryAttempts, state.lastError, finalConfig.fallbackData, errorHandler]
  );

  /**
   * Cache strategy
   */
  const cacheStrategy = useCallback(
    async <T,>(key: string, fn: () => Promise<T>): Promise<RecoveryResult<T>> => {
      dispatch({ type: 'START_RECOVERY', strategy: 'cache', error: state.lastError! });

      const cached = getCached(key);
      if (cached) {
        dispatch({ type: 'SUCCESS_RECOVERY' });
        errorHandler.addBreadcrumb('Recovery: cache hit', { key }, 'info');

        return {
          success: true,
          strategy: 'cache',
          data: cached,
          attempts: state.recoveryAttempts,
        };
      }

      try {
        const result = await fn();
        setCached(key, result);
        dispatch({ type: 'SUCCESS_RECOVERY' });

        return {
          success: true,
          strategy: 'cache',
          data: result,
          attempts: state.recoveryAttempts,
        };
      } catch (error) {
        const customError = error instanceof CustomError
          ? error
          : new CustomError(
            error instanceof Error ? error.message : 'Cache strategy failed',
            ErrorType.RECOVERY_ERROR,
            ErrorSeverity.MEDIUM
          );

        dispatch({ type: 'FAILED_RECOVERY', error: customError });
        return {
          success: false,
          strategy: 'cache',
          error: customError,
          attempts: state.recoveryAttempts,
        };
      }
    },
    [state.recoveryAttempts, state.lastError, getCached, setCached, errorHandler]
  );

  /**
   * Graceful degradation strategy
   */
  const gracefulDegradeStrategy = useCallback(
    async <T,>(
      fullFn: () => Promise<T>,
      degradedFn: () => Promise<Partial<T>>
    ): Promise<RecoveryResult<T | Partial<T>>> => {
      try {
        return await retryStrategy(fullFn);
      } catch (error) {
        dispatch({ type: 'START_RECOVERY', strategy: 'graceful-degrade', error: state.lastError! });

        try {
          const degradedResult = await degradedFn();
          dispatch({ type: 'SUCCESS_RECOVERY' });
          errorHandler.addBreadcrumb('Recovery: graceful degradation', {}, 'info');

          return {
            success: true,
            strategy: 'graceful-degrade',
            data: degradedResult as any,
            attempts: state.recoveryAttempts,
          };
        } catch (degradedError) {
          const customError = degradedError instanceof CustomError
            ? degradedError
            : new CustomError(
              degradedError instanceof Error ? degradedError.message : 'Degradation failed',
              ErrorType.RECOVERY_ERROR,
              ErrorSeverity.HIGH
            );

          dispatch({ type: 'FAILED_RECOVERY', error: customError });
          return {
            success: false,
            strategy: 'graceful-degrade',
            error: customError,
            attempts: state.recoveryAttempts,
          };
        }
      }
    },
    [retryStrategy, state.recoveryAttempts, state.lastError, errorHandler]
  );

  /**
   * User action strategy (e.g., reconnect wallet)
   */
  const userActionStrategy = useCallback(
    async <T,>(onUserAction: () => Promise<T>): Promise<RecoveryResult<T>> => {
      dispatch({ type: 'START_RECOVERY', strategy: 'user-action', error: state.lastError! });

      try {
        const result = await onUserAction();
        dispatch({ type: 'SUCCESS_RECOVERY' });
        errorHandler.addBreadcrumb('Recovery: user action completed', {}, 'info');

        return {
          success: true,
          strategy: 'user-action',
          data: result,
          attempts: state.recoveryAttempts,
        };
      } catch (error) {
        const customError = error instanceof CustomError
          ? error
          : new CustomError(
            error instanceof Error ? error.message : 'User action failed',
            ErrorType.RECOVERY_ERROR,
            ErrorSeverity.MEDIUM
          );

        dispatch({ type: 'FAILED_RECOVERY', error: customError });
        return {
          success: false,
          strategy: 'user-action',
          error: customError,
          attempts: state.recoveryAttempts,
        };
      }
    },
    [state.recoveryAttempts, state.lastError, errorHandler]
  );

  /**
   * Page reload strategy
   */
  const reloadStrategy = useCallback(async (): Promise<RecoveryResult> => {
    dispatch({ type: 'START_RECOVERY', strategy: 'reload', error: state.lastError! });
    errorHandler.addBreadcrumb('Recovery: initiating page reload', {}, 'info');

    if (typeof window !== 'undefined') {
      window.location.reload();
    }

    return {
      success: true,
      strategy: 'reload',
      attempts: state.recoveryAttempts,
    };
  }, [state.recoveryAttempts, state.lastError, errorHandler]);

  /**
   * Circuit breaker execution
   */
  const executeWithCircuitBreaker = useCallback(
    async <T,>(
      id: string,
      fn: () => Promise<T>
    ): Promise<RecoveryResult<T>> => {
      if (!finalConfig.enableCircuitBreaker) {
        return retryStrategy(fn);
      }

      try {
        const breaker = getCircuitBreaker(id);
        const result = await breaker.execute(fn);

        return {
          success: true,
          strategy: 'retry',
          data: result,
          attempts: state.recoveryAttempts,
        };
      } catch (error) {
        const customError = error instanceof CustomError
          ? error
          : new CustomError(
            error instanceof Error ? error.message : 'Circuit breaker failed',
            ErrorType.RECOVERY_ERROR,
            ErrorSeverity.HIGH
          );

        return {
          success: false,
          strategy: 'retry',
          error: customError,
          attempts: state.recoveryAttempts,
        };
      }
    },
    [finalConfig.enableCircuitBreaker, getCircuitBreaker, retryStrategy, state.recoveryAttempts]
  );

  /**
   * Reset recovery state
   */
  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
    errorHandler.addBreadcrumb('Recovery state reset', {}, 'info');
  }, [errorHandler]);

  /**
   * Clear caches
   */
  const clearCaches = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  return {
    state,
    strategies: {
      retry: retryStrategy,
      fallback: fallbackStrategy,
      cache: cacheStrategy,
      gracefulDegrade: gracefulDegradeStrategy,
      userAction: userActionStrategy,
      reload: reloadStrategy,
    },
    executeWithCircuitBreaker,
    reset,
    clearCaches,
  };
}
        attemptRecovery(customError);
      }
    },
    [errorHandler]
  );

  const attemptRecovery = useCallback(async (err: CustomError) => {
    if (isRecovering) return;

    setIsRecovering(true);
    setRecoveryAttempts(prev => prev + 1);

    try {
      // Wait before attempting recovery (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, recoveryAttempts), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));

      // Recovery strategy based on error code
      switch (err.code) {
        case ErrorCode.NETWORK_ERROR:
        case ErrorCode.RPC_ERROR:
        case ErrorCode.PROVIDER_UNAVAILABLE:
          // Network errors: wait and let user retry
          errorHandler.logAction('Recovered from network error', { attempts: recoveryAttempts });
          setError(null);
          break;

        case ErrorCode.TX_TIMEOUT:
        case ErrorCode.TX_PENDING:
          // Transaction pending: continue monitoring
          errorHandler.logAction('Transaction still pending', { txHash: err.context?.txHash });
          break;

        default:
          // Other errors: require user intervention
          break;
      }

      setLastRecoveryTime(Date.now());
    } catch (recoveryErr) {
      console.error('Recovery failed:', recoveryErr);
    } finally {
      setIsRecovering(false);
    }
  }, [recoveryAttempts, isRecovering, errorHandler]);

  const retry = useCallback(async (fn: () => Promise<any>) => {
    try {
      setIsRecovering(true);
      clearError();
      const result = await fn();
      setIsRecovering(false);
      return result;
    } catch (err) {
      const customError = err instanceof CustomError
        ? err
        : new CustomError((err as Error).message);
      handleError(customError, false);
      setIsRecovering(false);
      throw customError;
    }
  }, [handleError, clearError]);

  return {
    error,
    isRecovering,
    recoveryAttempts,
    lastRecoveryTime,
    clearError,
    handleError,
    retry,
  };
};

/**
 * Hook for fallback strategies
 */
export const useFallbackStrategy = () => {
  const [fallbackActive, setFallbackActive] = useState(false);
  const errorHandler = getErrorHandler();

  const activateFallback = useCallback((reason: string) => {
    errorHandler.logAction('Activating fallback strategy', { reason });
    setFallbackActive(true);
  }, [errorHandler]);

  const deactivateFallback = useCallback(() => {
    errorHandler.logAction('Deactivating fallback strategy');
    setFallbackActive(false);
  }, [errorHandler]);

  const withFallback = useCallback(
    async <T,>(
      primaryFn: () => Promise<T>,
      fallbackFn: () => Promise<T>,
      errorThreshold = 3
    ): Promise<T> => {
      let attempts = 0;

      while (attempts < errorThreshold) {
        try {
          const result = await primaryFn();
          if (fallbackActive) {
            deactivateFallback();
          }
          return result;
        } catch (err) {
          attempts++;
          errorHandler.logAction('Primary function failed', {
            attempt: attempts,
            error: (err as Error).message,
          });

          if (attempts >= errorThreshold) {
            activateFallback('Primary function threshold exceeded');
            break;
          }

          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      }

      // Try fallback
      try {
        errorHandler.logAction('Attempting fallback function');
        const result = await fallbackFn();
        return result;
      } catch (fallbackErr) {
        errorHandler.logAction('Fallback function also failed', {
          error: (fallbackErr as Error).message,
        });
        throw fallbackErr;
      }
    },
    [errorHandler, fallbackActive, activateFallback, deactivateFallback]
  );

  return {
    fallbackActive,
    activateFallback,
    deactivateFallback,
    withFallback,
  };
};

/**
 * Hook for transaction retry with gas adjustment
 */
export const useTransactionRecovery = () => {
  const { retry } = useErrorRecovery();

  const retryWithGasIncrease = useCallback(
    async (
      sendTx: (gasMultiplier: number) => Promise<string>,
      maxAttempts = 3
    ): Promise<string> => {
      let lastError: Error | null = null;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          const gasMultiplier = 1 + (attempt * 0.2); // 1x, 1.2x, 1.4x
          const result = await retry(() => sendTx(gasMultiplier));
          return result;
        } catch (err) {
          lastError = err as Error;

          if (attempt < maxAttempts - 1) {
            // Wait before next attempt
            await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
          }
        }
      }

      throw lastError || new Error('Transaction failed after retries');
    },
    [retry]
  );

  return {
    retryWithGasIncrease,
  };
};

/**
 * Hook for circuit breaker pattern
 */
export const useCircuitBreaker = (threshold = 5, resetTimeout = 60000) => {
  const [failureCount, setFailureCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [lastFailureTime, setLastFailureTime] = useState<number | null>(null);

  const recordFailure = useCallback(() => {
    setFailureCount(prev => prev + 1);
    setLastFailureTime(Date.now());

    if (failureCount + 1 >= threshold) {
      setIsOpen(true);
    }
  }, [failureCount, threshold]);

  const recordSuccess = useCallback(() => {
    if (isOpen) {
      setIsOpen(false);
      setFailureCount(0);
    }
  }, [isOpen]);

  const reset = useCallback(() => {
    setFailureCount(0);
    setIsOpen(false);
    setLastFailureTime(null);
  }, []);

  // Auto-reset after timeout
  useEffect(() => {
    if (!isOpen || !lastFailureTime) return;

    const timer = setTimeout(() => {
      setIsOpen(false);
      setFailureCount(Math.max(0, failureCount - 1));
    }, resetTimeout);

    return () => clearTimeout(timer);
  }, [isOpen, lastFailureTime, resetTimeout, failureCount]);

  const execute = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      if (isOpen) {
        throw new Error('Circuit breaker is open');
      }

      try {
        const result = await fn();
        recordSuccess();
        return result;
      } catch (err) {
        recordFailure();
        throw err;
      }
    },
    [isOpen, recordFailure, recordSuccess]
  );

  return {
    isOpen,
    failureCount,
    lastFailureTime,
    recordFailure,
    recordSuccess,
    reset,
    execute,
  };
};

/**
 * Hook for timeout protection
 */
export const useTimeoutProtection = (defaultTimeout = 30000) => {
  const [timeout, setTimeout] = useState(defaultTimeout);

  const withTimeout = useCallback(
    async <T,>(
      fn: () => Promise<T>,
      customTimeout?: number
    ): Promise<T> => {
      const timeoutValue = customTimeout || timeout;

      return Promise.race([
        fn(),
        new Promise<T>((_, reject) =>
          setTimeout(() => {
            reject(new Error(`Operation timeout after ${timeoutValue}ms`));
          }, timeoutValue)
        ),
      ]);
    },
    [timeout]
  );

  return {
    timeout,
    setTimeout,
    withTimeout,
  };
};
