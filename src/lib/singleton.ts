/**
 * Singleton and lazy initialization patterns
 * 
 * Provides utilities for creating singleton instances and lazy-loaded values.
 */

/**
 * Create a singleton factory function
 * 
 * Ensures only one instance of a class or object is created,
 * even when the factory is called multiple times.
 * 
 * @param factory - Function that creates the singleton instance
 * @returns Function that returns the singleton instance
 * 
 * @example
 * ```ts
 * const getDatabase = createSingleton(() => new Database());
 * const db1 = getDatabase(); // Creates instance
 * const db2 = getDatabase(); // Returns same instance
 * console.log(db1 === db2); // true
 * ```
 */
export function createSingleton<T>(factory: () => T): () => T {
  let instance: T | null = null;

  return () => {
    if (!instance) {
      instance = factory();
    }
    return instance;
  };
}

/**
 * Lazy initialization utility class
 * 
 * Defers expensive object creation until first access.
 * Useful for performance optimization and dependency management.
 * 
 * @example
 * ```ts
 * const lazyConfig = new Lazy(() => loadExpensiveConfig());
 * 
 * // Config not loaded yet
 * if (needsConfig) {
 *   const config = lazyConfig.getValue(); // Loads config on first access
 * }
 * ```
 */
export class Lazy<T> {
  private value: T | null = null;
  private factory: () => T;
  private isValueInitialized: boolean = false;

  constructor(factory: () => T) {
    this.factory = factory;
  }

  /**
   * Get the value, initializing it on first access
   */
  getValue(): T {
    if (!this.isValueInitialized) {
      this.value = this.factory();
      this.isValueInitialized = true;
    }
    return this.value as T;
  }

  /**
   * Check if value has been initialized
   */
  isInitialized(): boolean {
    return this.isValueInitialized;
  }

  /**
   * Reset the lazy value, forcing re-initialization on next access
   */
  reset(): void {
    this.value = null;
    this.isValueInitialized = false;
  }
  
  /**
   * Map the lazy value to a new lazy value
   */
  map<U>(mapper: (value: T) => U): Lazy<U> {
    return new Lazy(() => mapper(this.getValue()));
  }
}
