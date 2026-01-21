/**
 * Advanced caching with LRU and TTL strategies
 */

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl?: number;
  accessCount: number;
  lastAccessedAt: number;
}

export class AdvancedCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private maxSize: number;
  private defaultTTL: number;

  constructor(maxSize: number = 100, defaultTTL: number = 60000) {
    this.maxSize = Math.max(1, maxSize);
    this.defaultTTL = Math.max(1000, defaultTTL);
  }

  /**
   * Set cache entry
   */
  set(key: string, value: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      accessCount: 0,
      lastAccessedAt: Date.now(),
    };

    this.cache.set(key, entry);

    // Evict LRU if cache is full
    if (this.cache.size > this.maxSize) {
      this.evictLRU();
    }
  }

  /**
   * Get cache entry
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if TTL expired
    if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update access stats
    entry.accessCount++;
    entry.lastAccessedAt = Date.now();

    return entry.value;
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete entry
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let lruKey: string | null = null;
    let lruTime = Date.now();

    this.cache.forEach((entry, key) => {
      if (entry.lastAccessedAt < lruTime) {
        lruTime = entry.lastAccessedAt;
        lruKey = key;
      }
    });

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): number {
    let removed = 0;
    const now = Date.now();

    this.cache.forEach((entry, key) => {
      if (entry.ttl && now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        removed++;
      }
    });

    return removed;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    let totalAccesses = 0;
    let oldestEntry = Date.now();

    this.cache.forEach((entry) => {
      totalAccesses += entry.accessCount;
      if (entry.timestamp < oldestEntry) {
        oldestEntry = entry.timestamp;
      }
    });

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      totalAccesses,
      averageAccessCount: this.cache.size > 0 ? totalAccesses / this.cache.size : 0,
      utilization: (this.cache.size / this.maxSize) * 100,
    };
  }
}
