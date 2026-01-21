'use client';

import { useCallback, useReducer, useRef } from 'react';
import { CustomError, ErrorCode, ErrorSeverity } from '@/lib/errors';
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

const INITIAL_STATE: RecoveryState = {
  isRecovering: false,
  strategy: null,
  lastError: null,
  recoveryAttempts: 0,
  lastRecoveryTime: null,
  canRecover: true,
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
    (current: RecoveryState, action: RecoveryAction): RecoveryState => {
      switch (action.type) {
        case 'START_RECOVERY':
          return {
            ...current,
            isRecovering: true,
            strategy: action.strategy,
            lastError: action.error,
          };

        case 'SUCCESS_RECOVERY':
          return {
            ...current,
            isRecovering: false,
            recoveryAttempts: current.recoveryAttempts + 1,
            lastRecoveryTime: Date.now(),
            canRecover: true,
          };

        case 'FAILED_RECOVERY':
          return {
            ...current,
            isRecovering: false,
            recoveryAttempts: current.recoveryAttempts + 1,
            lastRecoveryTime: Date.now(),
            canRecover: false,
            lastError: action.error,
          };

        case 'RESET':
          return INITIAL_STATE;

        default:
          return current;
      }
    },
    INITIAL_STATE
  );

  /**
   * Retrieve or create a circuit breaker for an identifier
   */
  const getCircuitBreaker = useCallback(
    (id: string): CircuitBreaker => {
      const existing = circuitBreakerRef.current.get(id);
      if (existing) return existing;

      const breaker = new CircuitBreaker(finalConfig.circuitBreakerThreshold);
      circuitBreakerRef.current.set(id, breaker);
      return breaker;
    },
    [finalConfig.circuitBreakerThreshold]
  );

  /**
   * Get cached value if valid
   */
  const getCached = useCallback(
    (key: string): any | null => {
      if (!finalConfig.enableCache) return null;

      const cached = cacheRef.current.get(key);
      if (!cached) return null;

      // Cache valid for 5 minutes
      if (Date.now() - cached.timestamp > 5 * 60 * 1000) {
        cacheRef.current.delete(key);
        return null;
      }

      return cached.data;
    },
    [finalConfig.enableCache]
  );

  /**
   * Set cache
   */
  const setCached = useCallback(
    (key: string, data: any): void => {
      if (!finalConfig.enableCache) return;
      cacheRef.current.set(key, { data, timestamp: Date.now() });
    },
    [finalConfig.enableCache]
  );

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
            ErrorCode.INTERNAL_ERROR,
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
        ErrorCode.INTERNAL_ERROR,
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
            ErrorCode.INTERNAL_ERROR,
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
              ErrorCode.INTERNAL_ERROR,
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
            ErrorCode.INTERNAL_ERROR,
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
            ErrorCode.INTERNAL_ERROR,
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
