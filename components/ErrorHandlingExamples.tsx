'use client';

import React, { useState, useCallback } from 'react';
import { useErrorRecovery } from '@/hooks/useErrorRecovery';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { CustomError, ErrorCode, ErrorSeverity } from '@/lib/errors';
import { getErrorHandler, logBreadcrumb } from '@/lib/errorHandler';
import { retry, CircuitBreaker, AGGRESSIVE_RETRY_CONFIG, CONSERVATIVE_RETRY_CONFIG } from '@/lib/retry';

/**
 * Example 1: Simple retry with exponential backoff
 */
export function SimpleRetryExample() {
  const [status, setStatus] = useState<string>('');
  const [attempts, setAttempts] = useState(0);

  const handleRetry = async () => {
    setStatus('Loading...');
    setAttempts(0);

    try {
      const result = await retry(
        async () => {
          setAttempts(prev => prev + 1);

          // Simulate API call that sometimes fails
          if (Math.random() > 0.6) {
            throw new Error('Network timeout');
          }

          return { success: true, data: 'User data loaded' };
        },
        {
          maxAttempts: 3,
          initialDelayMs: 100,
          maxDelayMs: 5000,
          backoffMultiplier: 2,
          jitterFactor: 0.1,
          onRetry: (error: Error, attempt: number, nextDelay: number) => {
            setStatus(`Attempt ${attempt} failed, retrying in ${nextDelay}ms...`);
          },
        } as any
      );

      setStatus(`Success after ${attempts} attempts: ${result.data}`);
    } catch (error) {
      setStatus(`Failed after ${attempts} attempts: ${(error as Error).message}`);
    }
  };

  return (
    <div className="p-4 border rounded">
      <h3>Simple Retry Example</h3>
      <button onClick={handleRetry} className="px-4 py-2 bg-blue-500 text-white rounded">
        Test Retry
      </button>
      <p className="mt-2">{status}</p>
      <p className="text-sm text-gray-600">Attempts: {attempts}</p>
    </div>
  );
}

/**
 * Example 2: Error recovery strategies
 */
export function ErrorRecoveryStrategiesExample() {
  const recovery = useErrorRecovery({
    maxRecoveryAttempts: 3,
    enableCache: true,
    enableCircuitBreaker: true,
  });

  const [data, setData] = useState<any>(null);
  const [strategy, setStrategy] = useState<string>('');

  const fetchData = async (strategyName: string) => {
    setStrategy(strategyName);
    logBreadcrumb('user-action', 'info', `User selected ${strategyName} strategy`);

    if (strategyName === 'retry') {
      const result = await recovery.strategies.retry(async () => {
        const response = await fetch('https://api.example.com/data');
        if (!response.ok) throw new Error('API error');
        return response.json();
      });

      if (result.success) {
        setData(result.data);
      } else {
        setData({ error: result.error?.message });
      }
    } else if (strategyName === 'cache') {
      const result = await recovery.strategies.cache('api-data', async () => {
        return { cached: true, timestamp: new Date().toISOString() };
      });

      if (result.success) {
        setData(result.data);
      }
    } else if (strategyName === 'fallback') {
      const result = await recovery.strategies.fallback({
        default: true,
        message: 'Using fallback data',
      });

      if (result.success) {
        setData(result.data);
      }
    } else if (strategyName === 'degrade') {
      const result = await recovery.strategies.gracefulDegrade(
        async () => {
          // Full functionality
          return { full: true, features: ['a', 'b', 'c'] };
        },
        async () => {
          // Degraded functionality
          return { degraded: true, features: ['a'] };
        }
      );

      if (result.success) {
        setData(result.data);
      }
    }
  };

  return (
    <div className="p-4 border rounded">
      <h3>Error Recovery Strategies</h3>

      <div className="space-y-2">
        <button
          onClick={() => fetchData('retry')}
          className="px-4 py-2 bg-green-500 text-white rounded"
          disabled={recovery.state.isRecovering}
        >
          Retry Strategy
        </button>

        <button
          onClick={() => fetchData('cache')}
          className="px-4 py-2 bg-blue-500 text-white rounded"
          disabled={recovery.state.isRecovering}
        >
          Cache Strategy
        </button>

        <button
          onClick={() => fetchData('fallback')}
          className="px-4 py-2 bg-yellow-500 text-white rounded"
          disabled={recovery.state.isRecovering}
        >
          Fallback Strategy
        </button>

        <button
          onClick={() => fetchData('degrade')}
          className="px-4 py-2 bg-purple-500 text-white rounded"
          disabled={recovery.state.isRecovering}
        >
          Graceful Degrade
        </button>
      </div>

      {recovery.state.isRecovering && (
        <p className="mt-2 text-blue-600">
          Recovering using {recovery.state.strategy}...
        </p>
      )}

      {recovery.state.lastError && (
        <p className="mt-2 text-red-600">
          Error: {recovery.state.lastError.message}
        </p>
      )}

      {data && (
        <pre className="mt-4 p-2 bg-gray-100 rounded overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}

      <p className="mt-2 text-sm text-gray-600">
        Recovery attempts: {recovery.state.recoveryAttempts}
      </p>
    </div>
  );
}

/**
 * Example 3: Circuit breaker pattern
 */
export function CircuitBreakerExample() {
  const [breaker] = useState(() => new CircuitBreaker(3, 10000));
  const [status, setStatus] = useState<string>('Circuit: CLOSED');
  const [failures, setFailures] = useState(0);

  const handleRequest = async (shouldFail: boolean) => {
    try {
      logBreadcrumb('circuit-breaker', 'info', `Request ${shouldFail ? 'will fail' : 'should succeed'}`);

      const result = await breaker.execute(async () => {
        if (shouldFail) {
          throw new Error('Service error');
        }
        return { success: true };
      });

      setStatus('Circuit: CLOSED - Request succeeded');
      setFailures(0);
    } catch (error) {
      const state = breaker.getState();
      const circuitStatus = state.state === 'open'
        ? 'OPEN'
        : state.state === 'half_open'
          ? 'HALF_OPEN'
          : 'CLOSED';

      setStatus(`Circuit: ${circuitStatus} - ${(error as Error).message}`);
      setFailures(state.failureCount);
    }
  };

  return (
    <div className="p-4 border rounded">
      <h3>Circuit Breaker Example</h3>

      <div className="mb-4 p-3 bg-blue-100 rounded">
        <p className="font-semibold">{status}</p>
        <p className="text-sm">Failures: {failures}</p>
      </div>

      <div className="space-y-2">
        <button
          onClick={() => handleRequest(false)}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Success Request
        </button>

        <button
          onClick={() => handleRequest(true)}
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          Failing Request
        </button>
      </div>

      <p className="mt-4 text-sm text-gray-600">
        Circuit breaker opens after 3 failures and resets after 10 seconds
      </p>
    </div>
  );
}

/**
 * Example 4: Error boundary with recovery
 */
function ErrorProneComponent() {
  const [shouldError, setShouldError] = useState(false);

  if (shouldError) {
    throw new CustomError(
      'Component rendering failed',
      ErrorCode.INTERNAL_ERROR,
      ErrorSeverity.HIGH,
      { component: 'ErrorProneComponent' }
    );
  }

  return (
    <div>
      <p>This component is working</p>
      <button
        onClick={() => setShouldError(true)}
        className="px-4 py-2 bg-red-500 text-white rounded"
      >
        Trigger Error
      </button>
    </div>
  );
}

export function ErrorBoundaryExample() {
  return (
    <ErrorBoundary level="section">
      <div className="p-4 border rounded">
        <h3>Error Boundary Example</h3>
        <ErrorProneComponent />
      </div>
    </ErrorBoundary>
  );
}

/**
 * Example 5: Retry with aggressive configuration
 */
export function AggressiveRetryExample() {
  const [status, setStatus] = useState<string>('');
  const [result, setResult] = useState<any>(null);

  const testAggressiveRetry = async () => {
    setStatus('Starting aggressive retry...');
    let attemptCount = 0;

    try {
      const data = await retry(
        async () => {
          attemptCount++;
          setStatus(`Attempt ${attemptCount}...`);

          // Simulate transient network error
          if (attemptCount <= 2) {
            throw new Error('Temporarily unavailable');
          }

          return { data: 'Success!' };
        },
        {
          ...AGGRESSIVE_RETRY_CONFIG,
          onRetry: (error, attempt, delay) => {
            setStatus(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
          },
        }
      );

      setStatus(`Success after ${attemptCount} attempts`);
      setResult(data);
    } catch (error) {
      setStatus(`Failed after ${attemptCount} attempts`);
      setResult({ error: (error as Error).message });
    }
  };

  return (
    <div className="p-4 border rounded">
      <h3>Aggressive Retry Configuration</h3>
      <p className="text-sm mb-2">Max 5 attempts, shorter delays, higher jitter</p>

      <button
        onClick={testAggressiveRetry}
        className="px-4 py-2 bg-purple-500 text-white rounded"
      >
        Test Aggressive Retry
      </button>

      <p className="mt-2">{status}</p>
      {result && (
        <pre className="mt-2 p-2 bg-gray-100 rounded">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}

/**
 * Example 6: Retry with conservative configuration
 */
export function ConservativeRetryExample() {
  const [status, setStatus] = useState<string>('');
  const [result, setResult] = useState<any>(null);

  const testConservativeRetry = async () => {
    setStatus('Starting conservative retry...');
    let attemptCount = 0;

    try {
      const data = await retry(
        async () => {
          attemptCount++;
          setStatus(`Attempt ${attemptCount}...`);

          // Simulate error
          if (attemptCount === 1) {
            throw new Error('Database connection timeout');
          }

          return { data: 'Success!' };
        },
        {
          ...CONSERVATIVE_RETRY_CONFIG,
          onRetry: (error, attempt, delay) => {
            setStatus(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
          },
        }
      );

      setStatus(`Success after ${attemptCount} attempts`);
      setResult(data);
    } catch (error) {
      setStatus(`Failed after ${attemptCount} attempts`);
      setResult({ error: (error as Error).message });
    }
  };

  return (
    <div className="p-4 border rounded">
      <h3>Conservative Retry Configuration</h3>
      <p className="text-sm mb-2">Max 2 attempts, longer delays, lower jitter</p>

      <button
        onClick={testConservativeRetry}
        className="px-4 py-2 bg-orange-500 text-white rounded"
      >
        Test Conservative Retry
      </button>

      <p className="mt-2">{status}</p>
      {result && (
        <pre className="mt-2 p-2 bg-gray-100 rounded">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}

/**
 * Example 7: Error tracking with Sentry breadcrumbs
 */
export function ErrorTrackingExample() {
  const errorHandler = getErrorHandler();
  const [breadcrumbs, setBreadcrumbs] = useState<any[]>([]);

  const handleUserAction = (action: string) => {
    logBreadcrumb('user-action', 'info', `User performed: ${action}`, {
      timestamp: new Date().toISOString(),
      action,
    });

    setBreadcrumbs(errorHandler.getBreadcrumbs());
  };

  const simulateError = () => {
    const error = new CustomError(
      'Database query failed',
      ErrorCode.INTERNAL_ERROR,
      ErrorSeverity.HIGH,
      { query: 'SELECT * FROM users' }
    );

    errorHandler.handleError(error, {
      userId: 'user-123',
      module: 'dashboard',
      action: 'fetch_users',
    });

    setBreadcrumbs(errorHandler.getBreadcrumbs());
  };

  return (
    <div className="p-4 border rounded">
      <h3>Error Tracking with Breadcrumbs</h3>

      <div className="space-y-2 mb-4">
        <button
          onClick={() => handleUserAction('button_click')}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Click Button
        </button>

        <button
          onClick={() => handleUserAction('form_submit')}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Submit Form
        </button>

        <button
          onClick={simulateError}
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          Simulate Error
        </button>
      </div>

      <div className="mt-4">
        <h4 className="font-semibold mb-2">Breadcrumbs:</h4>
        <div className="max-h-40 overflow-y-auto bg-gray-100 p-2 rounded">
          {breadcrumbs.length === 0 ? (
            <p className="text-gray-500">No breadcrumbs yet</p>
          ) : (
            breadcrumbs.map((crumb, idx) => (
              <div key={idx} className="text-sm mb-2 pb-2 border-b">
                <p className="font-semibold">{crumb.category || crumb.message}</p>
                <p className="text-xs text-gray-600">
                  {new Date(crumb.timestamp).toLocaleTimeString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Main examples component
 */
export function ErrorHandlingExamples() {
  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <h1 className="text-3xl font-bold mb-6">Error Handling & Observability Examples</h1>

      <SimpleRetryExample />
      <ErrorRecoveryStrategiesExample />
      <CircuitBreakerExample />
      <ErrorBoundaryExample />
      <AggressiveRetryExample />
      <ConservativeRetryExample />
      <ErrorTrackingExample />
    </div>
  );
}
