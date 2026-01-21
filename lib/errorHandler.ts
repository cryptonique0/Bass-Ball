import { CustomError, ErrorSeverity, ErrorCode, isCustomError } from './errors';

/**
 * Breadcrumb for tracking user actions
 */
export interface Breadcrumb {
  category: string;
  level: 'debug' | 'info' | 'warning' | 'error';
  message: string;
  timestamp: number;
  data?: Record<string, any>;
}

/**
 * Error handler with Sentry integration
 */
class ErrorHandler {
  private breadcrumbs: Breadcrumb[] = [];
  private maxBreadcrumbs = 50;
  private sentryInitialized = false;
  private listeners: Set<(error: CustomError) => void> = new Set();

  constructor() {
    this.initSentry();
  }

  /**
   * Initialize Sentry if available
   */
  private initSentry(): void {
    if (typeof window === 'undefined') return;

    try {
      const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
      if (!dsn) {
        console.debug('Sentry DSN not configured');
        return;
      }

      // Dynamic import to avoid build issues if Sentry is optional
      import('@sentry/nextjs').then(Sentry => {
        if (!Sentry) return;
        
        Sentry.init({
          dsn,
          environment: process.env.NODE_ENV || 'development',
          tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
          debug: process.env.NODE_ENV !== 'production',
        });

        this.sentryInitialized = true;
      }).catch(() => {
        console.debug('Sentry not available');
      });
    } catch (err) {
      console.debug('Failed to initialize Sentry:', err);
    }
  }

  /**
   * Add a breadcrumb
   */
  addBreadcrumb(
    category: string,
    level: 'debug' | 'info' | 'warning' | 'error',
    message: string,
    data?: Record<string, any>
  ): void {
    const breadcrumb: Breadcrumb = {
      category,
      level,
      message,
      timestamp: Date.now(),
      data,
    };

    this.breadcrumbs.push(breadcrumb);

    // Trim breadcrumbs if exceeds max
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.maxBreadcrumbs);
    }

    // Send to Sentry if available
    this.sendBreadcrumbToSentry(breadcrumb);
  }

  /**
   * Send breadcrumb to Sentry
   */
  private sendBreadcrumbToSentry(breadcrumb: Breadcrumb): void {
    if (!this.sentryInitialized) return;

    try {
      import('@sentry/nextjs').then(Sentry => {
        if (Sentry?.captureMessage) {
          Sentry.captureMessage(breadcrumb.message, breadcrumb.level as any);
        }
      }).catch(() => {
        // Sentry not available
      });
    } catch (err) {
      // Silent fail
    }
  }

  /**
   * Handle an error
   */
  handleError(error: Error | CustomError, context?: Record<string, any>): CustomError {
    let customError: CustomError;

    if (isCustomError(error)) {
      customError = error;
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          customError.addContext(key, value);
        });
      }
    } else {
      customError = new CustomError(
        error.message,
        ErrorCode.INTERNAL_ERROR,
        ErrorSeverity.HIGH,
        context,
        error
      );
    }

    // Add breadcrumb
    const level = this.mapSeverityToLevel(customError.severity);
    this.addBreadcrumb(
      'error',
      level,
      customError.message,
      customError.toJSON()
    );

    // Notify listeners
    this.notifyListeners(customError);

    // Send to Sentry if critical or high severity
    if (
      customError.severity === ErrorSeverity.CRITICAL ||
      customError.severity === ErrorSeverity.HIGH
    ) {
      this.captureException(customError);
    }

    return customError;
  }

  /**
   * Capture exception in Sentry
   */
  private captureException(error: CustomError): void {
    if (!this.sentryInitialized) return;

    try {
      import('@sentry/nextjs').then(Sentry => {
        if (!Sentry?.captureException) return;

        Sentry.captureException(error, {
          tags: {
            errorCode: error.code,
            severity: error.severity,
          },
          contexts: {
            error: {
              code: error.code,
              severity: error.severity,
              userMessage: error.userMessage,
              ...error.context,
            },
          },
          breadcrumbs: this.breadcrumbs.map(bc => ({
            message: bc.message,
            category: bc.category,
            level: bc.level as any,
            timestamp: bc.timestamp / 1000,
            data: bc.data,
          })),
        });
      }).catch(() => {
        // Sentry not available
      });
    } catch (err) {
      console.error('Failed to capture exception in Sentry:', err);
    }
  }

  /**
   * Map severity to Sentry level
   */
  private mapSeverityToLevel(
    severity: ErrorSeverity
  ): 'debug' | 'info' | 'warning' | 'error' {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 'debug';
      case ErrorSeverity.MEDIUM:
        return 'warning';
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.CRITICAL:
        return 'error';
      default:
        return 'info';
    }
  }

  /**
   * Log action
   */
  logAction(action: string, data?: Record<string, any>): void {
    this.addBreadcrumb('action', 'info', action, data);
  }

  /**
   * Log wallet event
   */
  logWalletEvent(event: string, address?: string): void {
    this.addBreadcrumb('wallet', 'info', `Wallet: ${event}`, { address });
  }

  /**
   * Log transaction event
   */
  logTransactionEvent(event: string, txHash?: string, data?: Record<string, any>): void {
    this.addBreadcrumb('transaction', 'info', `Tx: ${event}`, { txHash, ...data });
  }

  /**
   * Get all breadcrumbs
   */
  getBreadcrumbs(): Breadcrumb[] {
    return [...this.breadcrumbs];
  }

  /**
   * Clear breadcrumbs
   */
  clearBreadcrumbs(): void {
    this.breadcrumbs = [];
  }

  /**
   * Subscribe to errors
   */
  subscribe(callback: (error: CustomError) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify error listeners
   */
  private notifyListeners(error: CustomError): void {
    this.listeners.forEach(cb => {
      try {
        cb(error);
      } catch (err) {
        console.error('Error in error listener:', err);
      }
    });
  }

  /**
   * Set user context for Sentry
   */
  setUserContext(address: string, chainId?: number): void {
    this.addBreadcrumb('user', 'info', 'User context set', { address, chainId });

    try {
      import('@sentry/nextjs').then(Sentry => {
        if (Sentry?.setUser) {
          Sentry.setUser({
            id: address,
            username: `${address.slice(0, 6)}...${address.slice(-4)}`,
            other: {
              chainId,
            },
          });
        }
      }).catch(() => {
        // Sentry not available
      });
    } catch (err) {
      // Silent fail
    }
  }

  /**
   * Clear user context
   */
  clearUserContext(): void {
    try {
      import('@sentry/nextjs').then(Sentry => {
        if (Sentry?.setUser) {
          Sentry.setUser(null);
        }
      }).catch(() => {
        // Sentry not available
      });
    } catch (err) {
      // Silent fail
    }
  }
}

// Global error handler instance
let globalErrorHandler: ErrorHandler | null = null;

/**
 * Get or create global error handler
 */
export function getErrorHandler(): ErrorHandler {
  if (!globalErrorHandler) {
    globalErrorHandler = new ErrorHandler();
  }
  return globalErrorHandler;
}

/**
 * Handle error globally
 */
export function handleError(error: Error | CustomError, context?: Record<string, any>): CustomError {
  return getErrorHandler().handleError(error, context);
}

/**
 * Log breadcrumb
 */
export function logBreadcrumb(
  category: string,
  level: 'debug' | 'info' | 'warning' | 'error',
  message: string,
  data?: Record<string, any>
): void {
  getErrorHandler().addBreadcrumb(category, level, message, data);
}

/**
 * React hook for error handling
 */
import { useCallback } from 'react';

export const useErrorHandler = () => {
  const errorHandler = getErrorHandler();

  const handle = useCallback(
    (error: Error | CustomError, context?: Record<string, any>) => {
      return errorHandler.handleError(error, context);
    },
    []
  );

  const logAction = useCallback((action: string, data?: Record<string, any>) => {
    errorHandler.logAction(action, data);
  }, []);

  const logWalletEvent = useCallback((event: string, address?: string) => {
    errorHandler.logWalletEvent(event, address);
  }, []);

  const logTransactionEvent = useCallback(
    (event: string, txHash?: string, data?: Record<string, any>) => {
      errorHandler.logTransactionEvent(event, txHash, data);
    },
    []
  );

  const getBreadcrumbs = useCallback(() => {
    return errorHandler.getBreadcrumbs();
  }, []);

  return {
    handle,
    logAction,
    logWalletEvent,
    logTransactionEvent,
    getBreadcrumbs,
  };
};
