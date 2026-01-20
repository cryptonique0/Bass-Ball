// Query utilities for data fetching
export interface QueryOptions {
  cacheTime?: number;
  staleTime?: number;
  retry?: number;
  enabled?: boolean;
}

export interface QueryState<T> {
  data: T | null;
  status: 'idle' | 'loading' | 'success' | 'error';
  error: Error | null;
}

export class QueryManager<T> {
  private cache: Map<string, { data: T; timestamp: number }> = new Map();
  private options: QueryOptions;

  constructor(options: QueryOptions = {}) {
    this.options = {
      cacheTime: 5 * 60 * 1000,
      staleTime: 1 * 60 * 1000,
      retry: 3,
      enabled: true,
      ...options,
    };
  }

  async fetch(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.options.cacheTime!) {
      return cached.data;
    }

    const data = await fetcher();
    this.cache.set(key, { data, timestamp: Date.now() });
    return data;
  }

  invalidate(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}
