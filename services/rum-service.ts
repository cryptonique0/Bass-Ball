/**
 * RUM Service - Real User Monitoring for web performance
 * Captures core web vitals and key timings, supports SPA navigation tracking,
 * custom events, performance budgets, and exporting reports.
 */

export type MetricName = 'FCP' | 'LCP' | 'CLS' | 'TTFB' | 'INP' | 'FID' | 'LongTaskCount' | 'LongTaskTotal';

export interface RUMBudgets {
  FCP?: number; // ms
  LCP?: number; // ms
  CLS?: number; // unitless
  TTFB?: number; // ms
  INP?: number; // ms
  FID?: number; // ms
  LongTaskTotal?: number; // ms
}

export interface RUMConfig {
  enabled?: boolean;
  samplingRate?: number; // 0..1
  endpoint?: string; // optional endpoint to POST reports
  appVersion?: string;
  environment?: string;
}

export interface RUMEvent {
  type: string;
  timestamp: number;
  data?: Record<string, unknown>;
}

export interface RUMReport {
  sessionId: string;
  metrics: Partial<Record<MetricName, number>>;
  events: RUMEvent[];
  budgets?: RUMBudgets;
  violations?: Array<{ metric: MetricName; value: number; budget: number }>;
  appVersion?: string;
  environment?: string;
}

class RUMService {
  private config: RUMConfig;
  private sessionId: string;
  private observers: PerformanceObserver[] = [];
  private metrics: Partial<Record<MetricName, number>> = {};
  private events: RUMEvent[] = [];
  private budgets: RUMBudgets = {};
  private violations: Array<{ metric: MetricName; value: number; budget: number }> = [];
  private initialized = false;

  constructor(config: Partial<RUMConfig> = {}) {
    this.config = {
      enabled: true,
      samplingRate: 1.0,
      ...config,
    };
    this.sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (!this.config.enabled) return;
    if (!this.shouldSample()) return;

    this.initialized = true;
    this.observeFCP();
    this.observeLCP();
    this.observeCLS();
    this.observeFIDandINP();
    this.observeLongTasks();

    // Navigation timing (TTFB)
    this.recordTTFB();

    // SPA navigation helper
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', () => this.recordNavigation(document.location.pathname));
    }
  }

  setBudgets(budgets: RUMBudgets): void {
    this.budgets = budgets;
  }

  recordNavigation(path: string): void {
    this.addEvent('navigation', { path });
    // On navigation, attempt to observe new LCP values (reset previous if needed)
    this.observeLCP(true);
  }

  addEvent(type: string, data?: Record<string, unknown>): void {
    this.events.push({ type, timestamp: Date.now(), data });
  }

  getReport(): RUMReport {
    return {
      sessionId: this.sessionId,
      metrics: this.metrics,
      events: this.events.slice(),
      budgets: this.budgets,
      violations: this.violations.slice(),
      appVersion: this.config.appVersion,
      environment: this.config.environment,
    };
  }

  clear(): void {
    this.metrics = {};
    this.events = [];
    this.violations = [];
  }

  async sendReport(): Promise<boolean> {
    if (!this.config.endpoint) return false;
    try {
      const report = this.getReport();
      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
      });
      return true;
    } catch (e) {
      console.warn('RUM: failed to send report', e);
      return false;
    }
  }

  // ---- Observers ----
  private observeFCP(): void {
    if (typeof PerformanceObserver === 'undefined') return;
    try {
      const po = new PerformanceObserver((list) => {
        for (const entry of list.getEntriesByName('first-contentful-paint')) {
          const fcp = (entry.startTime || entry.duration);
          this.setMetric('FCP', fcp);
        }
      });
      po.observe({ type: 'paint', buffered: true });
      this.observers.push(po);
    } catch {}
  }

  private observeLCP(reset = false): void {
    if (typeof PerformanceObserver === 'undefined') return;
    if (reset) delete this.metrics['LCP'];
    try {
      const po = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        if (last) {
          const lcp = last.startTime || last.renderTime || last.loadTime || last.duration;
          this.setMetric('LCP', lcp);
        }
      });
      po.observe({ type: 'largest-contentful-paint', buffered: true });
      this.observers.push(po);
    } catch {}
  }

  private observeCLS(): void {
    if (typeof PerformanceObserver === 'undefined') return;
    let clsValue = 0;
    try {
      const po = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any) {
          const e = entry as LayoutShift & { hadRecentInput?: boolean };
          if (!e.hadRecentInput) {
            clsValue += e.value || 0;
            this.setMetric('CLS', clsValue);
          }
        }
      });
      po.observe({ type: 'layout-shift', buffered: true });
      this.observers.push(po);
    } catch {}
  }

  private observeFIDandINP(): void {
    if (typeof PerformanceObserver === 'undefined') return;
    try {
      // FID (legacy)
      const fidPO = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any) {
          const e = entry as PerformanceEventTiming;
          const fid = e.processingStart - e.startTime;
          this.setMetric('FID', fid);
        }
      });
      fidPO.observe({ type: 'first-input', buffered: true });
      this.observers.push(fidPO);
    } catch {}

    try {
      // INP (approximate): use longest EventTiming duration
      let maxInp = this.metrics['INP'] || 0;
      const inpPO = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any) {
          const e = entry as PerformanceEventTiming;
          const inp = e.duration || (e.processingEnd - e.startTime);
          if (inp > maxInp) {
            maxInp = inp;
            this.setMetric('INP', maxInp);
          }
        }
      });
      inpPO.observe({ type: 'event', buffered: true });
      this.observers.push(inpPO);
    } catch {}
  }

  private observeLongTasks(): void {
    if (typeof PerformanceObserver === 'undefined') return;
    try {
      let count = 0;
      let total = 0;
      const po = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          count += 1;
          total += entry.duration;
        }
        this.setMetric('LongTaskCount', count);
        this.setMetric('LongTaskTotal', total);
      });
      // Some browsers expose 'longtask'
      po.observe({ type: 'longtask', buffered: true } as any);
      this.observers.push(po);
    } catch {}
  }

  private recordTTFB(): void {
    try {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      if (nav) {
        const ttfb = nav.responseStart - nav.startTime;
        this.setMetric('TTFB', ttfb);
      }
    } catch {}
  }

  private setMetric(name: MetricName, value: number): void {
    this.metrics[name] = value;
    this.checkBudgets(name, value);
    this.addEvent('metric', { name, value });
  }

  private checkBudgets(name: MetricName, value: number): void {
    const budget = (this.budgets as any)[name];
    if (typeof budget === 'number') {
      if (name === 'CLS') {
        if (value > budget) this.violations.push({ metric: name, value, budget });
      } else {
        if (value >= budget) this.violations.push({ metric: name, value, budget });
      }
    }
  }

  private shouldSample(): boolean {
    const r = Math.random();
    return r < (this.config.samplingRate || 1.0);
  }
}

export const rumService = new RUMService();
export default rumService;
