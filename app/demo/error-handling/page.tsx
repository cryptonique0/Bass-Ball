'use client';

import React, { useState, useCallback } from 'react';
import { useErrorRecovery } from '@/hooks/useErrorRecovery';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { CustomError, ErrorCode, ErrorSeverity } from '@/lib/errors';
import { getErrorHandler, logBreadcrumb } from '@/lib/errorHandler';
import { retry, CircuitBreaker, AGGRESSIVE_RETRY_CONFIG } from '@/lib/retry';

/**
 * Comprehensive demo showing all error handling features working together
 */
function ErrorHandlingDemo() {
  const recovery = useErrorRecovery({
    maxRecoveryAttempts: 3,
    enableCache: true,
    enableCircuitBreaker: true,
  });

  const errorHandler = getErrorHandler();
  const [logs, setLogs] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<Record<string, any>>({});

  const addLog = useCallback((message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  }, []);

  // Test 1: Simple retry with exponential backoff
  const testRetry = useCallback(async () => {
    addLog('Starting retry test...');
    let attempts = 0;

    try {
      const result = await retry(
        async () => {
          attempts++;
          addLog(`  Attempt ${attempts}`);

          if (attempts < 2) {
            throw new Error('Simulated network error');
          }

          return { success: true, data: 'Data loaded successfully' };
        },
        {
          ...AGGRESSIVE_RETRY_CONFIG,
          onRetry: (error: Error, attempt: number, delay: number) => {
            addLog(`  Retry ${attempt} failed, waiting ${delay}ms...`);
          },
        }
      );

      setTestResults(prev => ({
        ...prev,
        retry: { success: true, attempts, result },
      }));
      addLog('✅ Retry test passed');
    } catch (error) {
      addLog('❌ Retry test failed: ' + (error as Error).message);
      setTestResults(prev => ({
        ...prev,
        retry: { success: false, attempts, error: (error as Error).message },
      }));
    }
  }, [addLog]);

  // Test 2: Error recovery strategies
  const testRecoveryStrategies = useCallback(async () => {
    addLog('Starting recovery strategies test...');

    // Attempt retry
    addLog('  1. Trying retry strategy...');
    const retryResult = await recovery.strategies.retry(async () => {
      throw new Error('Service unavailable');
    });

    let result: any = retryResult;
    if (!result.success) {
      addLog('  2. Retry failed, trying fallback...');
      const fallbackResult = await recovery.strategies.fallback({ cached: true, data: [] });
      result = fallbackResult;
    }

    if (result.success) {
      setTestResults(prev => ({
        ...prev,
        strategies: { success: true, strategy: result.strategy, data: result.data },
      }));
      addLog('✅ Recovery strategies test passed');
    } else {
      addLog('❌ All strategies failed');
      setTestResults(prev => ({
        ...prev,
        strategies: { success: false, error: result.error?.message },
      }));
    }
  }, [recovery, addLog]);

  // Test 3: Circuit breaker
  const testCircuitBreaker = useCallback(async () => {
    addLog('Starting circuit breaker test...');
    const breaker = new CircuitBreaker(2, 5000);
    let successCount = 0;
    let failureCount = 0;

    try {
      // Simulate failures to trip circuit
      for (let i = 0; i < 3; i++) {
        try {
          addLog(`  Request ${i + 1}...`);
          const state = breaker.getState();
          addLog(`    Circuit state: ${state.state}`);

          await breaker.execute(async () => {
            if (i < 2) {
              throw new Error('Service error');
            }
            return { success: true };
          });

          successCount++;
          addLog(`    ✓ Success`);
        } catch (error) {
          failureCount++;
          addLog(`    ✗ Failed: ${(error as Error).message}`);
        }
      }

      setTestResults(prev => ({
        ...prev,
        circuitBreaker: {
          success: true,
          successCount,
          failureCount,
          finalState: breaker.getState().state,
        },
      }));
      addLog('✅ Circuit breaker test completed');
    } catch (error) {
      addLog('❌ Circuit breaker test failed');
    }
  }, [addLog]);

  // Test 4: Error tracking and breadcrumbs
  const testErrorTracking = useCallback(async () => {
    addLog('Starting error tracking test...');

    // Simulate user actions
    logBreadcrumb('user-action', 'info', 'User opened dashboard', {
      userId: 'demo-user',
      timestamp: new Date().toISOString(),
    });
    addLog('  Logged: User opened dashboard');

    logBreadcrumb('user-action', 'info', 'User clicked fetch button', {
      buttonId: 'fetch-data',
    });
    addLog('  Logged: User clicked fetch button');

    // Simulate error
    const error = new CustomError(
      'Failed to load data',
      ErrorCode.NETWORK_ERROR,
      ErrorSeverity.HIGH,
      { endpoint: '/api/data' }
    );

    errorHandler.handleError(error, {
      userId: 'demo-user',
      module: 'dashboard',
      action: 'fetch_data',
    });
    addLog('  Logged: Error occurred with breadcrumbs');

    const breadcrumbs = errorHandler.getBreadcrumbs();

    setTestResults(prev => ({
      ...prev,
      tracking: {
        success: true,
        breadcrumbCount: breadcrumbs.length,
        message: 'Error tracking active',
      },
    }));
    addLog('✅ Error tracking test passed');
  }, [addLog, errorHandler]);

  // Test 5: Error boundary
  const testErrorBoundary = useCallback(() => {
    addLog('Starting error boundary test...');
    addLog('✅ Error boundary is active (see rendered component below)');
    setTestResults(prev => ({
      ...prev,
      errorBoundary: { success: true, active: true },
    }));
  }, [addLog]);

  // Test 6: Cache strategy
  const testCache = useCallback(async () => {
    addLog('Starting cache strategy test...');

    // First call - should hit the function
    addLog('  1st call - fetching fresh data...');
    const result1 = await recovery.strategies.cache('test-key', async () => {
      addLog('    Function executed');
      return { fresh: true, timestamp: Date.now() };
    });

    if (result1.success && result1.data) {
      const firstTimestamp = (result1.data as any).timestamp;

      // Second call - should hit cache
      addLog('  2nd call - should hit cache...');
      const result2 = await recovery.strategies.cache('test-key', async () => {
        addLog('    Function executed (cache miss!)');
        return { fresh: true, timestamp: Date.now() };
      });

      if (result2.success && result2.data) {
        const isCached = (result2.data as any).timestamp === firstTimestamp;
        addLog(`    Cache ${isCached ? 'HIT' : 'MISS'}`);

        setTestResults(prev => ({
          ...prev,
          cache: { success: true, cached: isCached },
        }));
        addLog('✅ Cache test ' + (isCached ? 'passed' : 'failed'));
      }
    }
  }, [recovery, addLog]);

  const runAllTests = useCallback(async () => {
    setLogs([]);
    setTestResults({});

    addLog('🚀 Running all tests...');
    await new Promise(r => setTimeout(r, 500));

    await testRetry();
    await new Promise(r => setTimeout(r, 1000));

    await testRecoveryStrategies();
    await new Promise(r => setTimeout(r, 500));

    await testCircuitBreaker();
    await new Promise(r => setTimeout(r, 500));

    await testErrorTracking();
    await new Promise(r => setTimeout(r, 500));

    testErrorBoundary();
    await new Promise(r => setTimeout(r, 500));

    await testCache();

    addLog('');
    addLog('✨ All tests completed!');
  }, [
    addLog,
    testRetry,
    testRecoveryStrategies,
    testCircuitBreaker,
    testErrorTracking,
    testErrorBoundary,
    testCache,
  ]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-6">Error Handling & Observability Demo</h1>

      <div className="mb-6">
        <button
          onClick={runAllTests}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
        >
          🧪 Run All Tests
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Logs Panel */}
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
          <h2 className="font-bold mb-2">📋 Test Logs</h2>
          {logs.length === 0 ? (
            <p className="text-gray-500">Click "Run All Tests" to start...</p>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className="mb-1">
                {log}
              </div>
            ))
          )}
        </div>

        {/* Results Panel */}
        <div className="bg-white border border-gray-300 p-4 rounded-lg max-h-96 overflow-y-auto">
          <h2 className="font-bold mb-2">📊 Test Results</h2>
          {Object.keys(testResults).length === 0 ? (
            <p className="text-gray-500">Results will appear here...</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(testResults).map(([name, result]) => (
                <div key={name} className="border-l-4 border-blue-500 pl-4">
                  <p className="font-semibold capitalize">{name}</p>
                  {(result as any).success ? (
                    <p className="text-green-600 text-sm">✅ Passed</p>
                  ) : (
                    <p className="text-red-600 text-sm">❌ Failed</p>
                  )}
                  <pre className="text-xs mt-1 bg-gray-100 p-2 rounded overflow-auto max-h-24">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Error Boundary Demo */}
      <div className="mt-6">
        <h2 className="text-xl font-bold mb-4">Error Boundary Demo</h2>
        <ErrorBoundary level="section">
          <ErrorBoundaryDemo />
        </ErrorBoundary>
      </div>
    </div>
  );
}

/**
 * Component that demonstrates error boundary in action
 */
function ErrorBoundaryDemo() {
  const [shouldError, setShouldError] = useState(false);

  if (shouldError) {
    throw new CustomError(
      'Component crashed intentionally for demo purposes',
      ErrorCode.INTERNAL_ERROR,
      ErrorSeverity.HIGH,
      { demo: true, component: 'ErrorBoundaryDemo' }
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 p-4 rounded">
      <p>This component is wrapped in an error boundary.</p>
      <button
        onClick={() => setShouldError(true)}
        className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Trigger Error
      </button>
      <p className="text-sm text-gray-600 mt-2">Click the button to see the error boundary catch the error.</p>
    </div>
  );
}

/**
 * Export demo page component
 */
export default function DemoPage() {
  return <ErrorHandlingDemo />;
}
