// Cache implementation
export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl?: number;
}

export class Cache<T = any> {
  private store: Map<string, CacheEntry<T>> = new Map();

  set(key: string, value: T, ttl?: number): void {
    this.store.set(key, { value, timestamp: Date.now(), ttl });
  }

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    
    if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
      this.store.delete(key);
      return null;
    }
    
    return entry.value;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }
}
