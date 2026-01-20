// Performance monitoring utilities
export class PerformanceMonitor {
  private metrics: Map<string, { count: number; total: number; min: number; max: number }> = new Map();

  mark(name: string): void {
    performance.mark(name);
  }

  measure(name: string, startMark: string, endMark: string): void {
    try {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name)[0];
      
      if (!this.metrics.has(name)) {
        this.metrics.set(name, { count: 0, total: 0, min: Infinity, max: -Infinity });
      }

      const metric = this.metrics.get(name)!;
      metric.count++;
      metric.total += measure.duration;
      metric.min = Math.min(metric.min, measure.duration);
      metric.max = Math.max(metric.max, measure.duration);
    } catch (e) {
      console.error('Failed to measure performance:', e);
    }
  }

  getStats(name: string) {
    const metric = this.metrics.get(name);
    if (!metric) return null;

    return {
      count: metric.count,
      average: metric.total / metric.count,
      min: metric.min,
      max: metric.max,
      total: metric.total,
    };
  }

  clear(): void {
    this.metrics.clear();
  }
}

export const perfMonitor = new PerformanceMonitor();
