// Decorator pattern utilities
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map();

  return ((...args: any[]) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

// Timing decorator
export function time<T extends (...args: any[]) => any>(fn: T): T {
  return ((...args: any[]) => {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();
    console.log(`${fn.name} took ${end - start}ms`);
    return result;
  }) as T;
}

// Validation decorator
export function validate<T extends (...args: any[]) => any>(
  predicate: (args: any[]) => boolean,
  errorMessage: string
): (fn: T) => T {
  return (fn: T) => {
    return ((...args: any[]) => {
      if (!predicate(args)) {
        throw new Error(errorMessage);
      }
      return fn(...args);
    }) as T;
  };
}
