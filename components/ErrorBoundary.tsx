'use client';

import React, { ReactNode, useState, useEffect } from 'react';
import { CustomError, ErrorSeverity } from '@/lib/errors';
import { getErrorHandler } from '@/lib/errorHandler';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: CustomError, reset: () => void) => ReactNode;
  onError?: (error: CustomError) => void;
  level?: 'page' | 'section' | 'component';
}

interface ErrorBoundaryState {
  error: CustomError | null;
  hasError: boolean;
  errorCount: number;
}

/**
 * Error Boundary component for catching React errors
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private errorHandler = getErrorHandler();

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      error: null,
      hasError: false,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let customError = error as CustomError;
    if (!(error instanceof CustomError)) {
      customError = new CustomError(
        error.message || 'Unknown error',
        undefined,
        ErrorSeverity.HIGH,
        { originalError: error }
      );
    }

    return {
      error: customError,
      hasError: true,
      errorCount: 0,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    let customError = error as CustomError;
    if (!(error instanceof CustomError)) {
      customError = new CustomError(
        error.message || 'Unknown error',
        undefined,
        ErrorSeverity.HIGH,
        {
          originalError: error,
          componentStack: errorInfo.componentStack,
        }
      );
    }

    this.errorHandler.handleError(customError);

    if (this.props.onError) {
      this.props.onError(customError);
    }

    console.error('Error caught by boundary:', error, errorInfo);
  }

  reset = () => {
    this.setState({
      error: null,
      hasError: false,
      errorCount: this.state.errorCount + 1,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }

      return (
        <DefaultErrorFallback
          error={this.state.error}
          reset={this.reset}
          level={this.props.level || 'component'}
        />
      );
    }

    return this.props.children;
  }
}

interface DefaultErrorFallbackProps {
  error: CustomError;
  reset: () => void;
  level: 'page' | 'section' | 'component';
}

const DefaultErrorFallback: React.FC<DefaultErrorFallbackProps> = ({
  error,
  reset,
  level,
}) => {
  const isPage = level === 'page';
  const padding = isPage ? 'p-6' : 'p-4';
  const bgColor = isPage ? 'bg-red-50' : 'bg-yellow-50';

  return (
    <div className={`${padding} ${bgColor} rounded-lg border border-red-200`}>
      <div className="flex items-start gap-3">
        <div className="text-2xl">⚠️</div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-red-900 mb-2">
            {error.userMessage || 'Something went wrong'}
          </h2>
          <p className="text-sm text-red-700 mb-4">
            {error.message}
          </p>
          {process.env.NODE_ENV === 'development' && (
            <details className="mb-4">
              <summary className="text-xs text-red-600 cursor-pointer mb-2">
                Technical Details
              </summary>
              <pre className="text-xs bg-red-100 p-2 rounded overflow-auto max-h-40 text-red-900">
                {JSON.stringify(error.toJSON(), null, 2)}
              </pre>
            </details>
          )}
          <button
            onClick={reset}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
};

export const useErrorBoundary = () => {
  const [error, setError] = useState<CustomError | null>(null);
  const errorHandler = getErrorHandler();

  const reset = () => {
    setError(null);
  };

  const handleError = (err: Error | CustomError) => {
    let customError = err instanceof CustomError
      ? err
      : new CustomError(
        err.message || 'Unknown error',
        undefined,
        ErrorSeverity.HIGH,
        { originalError: err }
      );

    setError(customError);
    errorHandler.handleError(customError);
  };

  return {
    error,
    reset,
    handleError,
  };
};

export const AsyncErrorBoundary: React.FC<{
  children: ReactNode;
  onError?: (error: Error) => void;
}> = ({ children, onError }) => {
  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      if (onError) {
        onError(event.reason);
      }
      event.preventDefault();
    };

    window.addEventListener('unhandledrejection', handleRejection);
    return () => window.removeEventListener('unhandledrejection', handleRejection);
  }, [onError]);

  return <>{children}</>;
};
