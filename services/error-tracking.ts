/**
 * Error Tracking Service - Sentry integration with graceful fallback
 * Provides crash analytics via global handlers, error/message capture,
 * user/tags/context, and an offline queue with optional custom endpoint.
 */

export interface ErrorTrackingConfig {
  enabled?: boolean;
  dsn?: string;
  environment?: string;
  release?: string;
  sampleRate?: number;
  endpoint?: string; // fallback endpoint if Sentry not available
}

type ErrorEventRecord = {
  type: 'exception' | 'message';
  payload: any;
  timestamp: number;
};

class ErrorTrackingService {
  private config: ErrorTrackingConfig;
  private initialized = false;
  private useSentry = false;
  private sentry: any = null;
  private queue: ErrorEventRecord[] = [];

  constructor(config: Partial<ErrorTrackingConfig> = {}) {
    this.config = {
      enabled: true,
      sampleRate: 1.0,
      ...config,
    };
  }

  async init(config?: Partial<ErrorTrackingConfig>): Promise<void> {
    if (config) this.config = { ...this.config, ...config };
    if (this.initialized) return;
    if (!this.config.enabled) return;

    // Try global Sentry
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      this.sentry = (window as any).Sentry;
      this.useSentry = true;
    } else {
      // Try dynamic import if package exists
      try {
        // @ts-ignore - optional dependency
        const mod = await import(/* webpackIgnore: true */ '@sentry/browser');
        this.sentry = mod;
        this.useSentry = true;
      } catch {
        this.useSentry = false;
      }
    }

    if (this.useSentry && this.sentry && this.config.dsn) {
      try {
        this.sentry.init({
          dsn: this.config.dsn,
          environment: this.config.environment,
          release: this.config.release,
          sampleRate: this.config.sampleRate,
          integrations: (integrations: any[]) => integrations,
        });
      } catch (e) {
        console.warn('Sentry init failed, falling back', e);
        this.useSentry = false;
      }
    }

    this.initialized = true;
    this.registerGlobalHandlers();

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.flush());
    }
  }

  enableGlobalHandlers(): void {
    this.registerGlobalHandlers();
  }

  private registerGlobalHandlers(): void {
    if (typeof window === 'undefined') return;
    // Avoid double-binding
    window.removeEventListener('error', this.onError as any);
    window.removeEventListener('unhandledrejection', this.onUnhandledRejection as any);
    window.addEventListener('error', this.onError);
    window.addEventListener('unhandledrejection', this.onUnhandledRejection);
  }

  private onError = (event: ErrorEvent) => {
    const err = event.error || new Error(event.message || 'Unknown error');
    this.captureException(err, { source: 'window.onerror', filename: event.filename, lineno: event.lineno, colno: event.colno });
  };

  private onUnhandledRejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    this.captureException(reason, { source: 'unhandledrejection' });
  };

  setUser(user: { id?: string; email?: string; username?: string }): void {
    if (this.useSentry && this.sentry) {
      try { this.sentry.setUser(user); } catch {}
    }
  }

  setTag(key: string, value: string): void {
    if (this.useSentry && this.sentry) {
      try { this.sentry.setTag(key, value); } catch {}
    }
  }

  setContext(name: string, context: Record<string, unknown>): void {
    if (this.useSentry && this.sentry) {
      try { this.sentry.setContext(name, context); } catch {}
    }
  }

  captureException(error: Error, extra?: Record<string, unknown>): void {
    if (this.useSentry && this.sentry) {
      try { this.sentry.captureException(error, { extra }); } catch {}
    } else {
      this.enqueue({ type: 'exception', payload: { message: error.message, stack: error.stack, extra }, timestamp: Date.now() });
      console.error('[ErrorTracking]', error, extra);
      this.flush();
    }
  }

  captureMessage(message: string, level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'error', extra?: Record<string, unknown>): void {
    if (this.useSentry && this.sentry) {
      try { this.sentry.captureMessage(message, { level, extra }); } catch {}
    } else {
      this.enqueue({ type: 'message', payload: { message, level, extra }, timestamp: Date.now() });
      console.warn('[ErrorTracking]', level.toUpperCase(), message, extra);
      this.flush();
    }
  }

  private enqueue(rec: ErrorEventRecord): void {
    this.queue.push(rec);
  }

  async flush(): Promise<void> {
    if (!navigator.onLine) return;
    if (!this.queue.length) return;
    if (this.useSentry) { this.queue = []; return; }
    if (!this.config.endpoint) { this.queue = []; return; }
    try {
      const payload = { events: this.queue.slice(), env: this.config.environment, release: this.config.release };
      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      this.queue = [];
    } catch (e) {
      // Keep queue; will retry on next flush
    }
  }
}

export const errorTracking = new ErrorTrackingService();
export default errorTracking;
