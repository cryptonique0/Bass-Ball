/**
 * Deep object manipulation utilities
 * 
 * Provides type-safe deep cloning, merging, and comparison operations
 * for complex nested objects.
 */

/**
 * Deep clone an object, array, or primitive value
 * 
 * Creates a complete deep copy of the input, handling:
 * - Primitives (numbers, strings, booleans, null, undefined)
 * - Arrays (recursively)
 * - Plain objects (recursively)
 * - Date objects
 * 
 * Note: Does not handle Functions, Maps, Sets, or other complex types
 * 
 * @param obj - Value to clone
 * @returns Deep cloned copy
 * 
 * @example
 * ```ts
 * const original = { a: 1, b: { c: 2 } };
 * const copy = deepClone(original);
 * copy.b.c = 3; // original.b.c is still 2
 * ```
 */
export function deepClone<T>(obj: T): T {
  // Handle primitives and null
  if (obj === null || typeof obj !== 'object') return obj;
  
  // Handle Date objects
  if (obj instanceof Date) return new Date(obj.getTime()) as T;
  
  // Handle Arrays
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as T;
  }
  
  // Handle plain objects
  if (obj instanceof Object) {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  
  return obj;
}

/**
 * Deep merge two objects
 * 
 * Recursively merges source into target, creating a new object.
 * Arrays are replaced, not merged.
 * 
 * @param target - Target object (base)
 * @param source - Source object (overrides)
 * @returns New merged object
 * 
 * @example
 * ```ts
 * const base = { a: 1, b: { c: 2 } };
 * const override = { b: { d: 3 } };
 * const result = deepMerge(base, override);
 * // result = { a: 1, b: { c: 2, d: 3 } }
 * ```
 */
export function deepMerge<T extends Record<string, any>>(
  target: T,
  source: Partial<T>
): T {
  const result = { ...target };

  for (const key in source) {
    if (source.hasOwnProperty(key) && source[key] !== undefined) {
      const sourceValue = source[key];
      const targetValue = result[key];
      
      // Deep merge nested objects
      if (
        targetValue &&
        sourceValue &&
        typeof targetValue === 'object' &&
        typeof sourceValue === 'object' &&
        !Array.isArray(targetValue) &&
        !Array.isArray(sourceValue) &&
        !(targetValue as any instanceof Date) &&
        !(sourceValue as any instanceof Date)
      ) {
        result[key] = deepMerge(targetValue, sourceValue);
      } else {
        // Replace value (including arrays)
        result[key] = sourceValue as T[Extract<keyof T, string>];
      }
    }
  }

  return result;
}

/**
 * Deep equality comparison
 * 
 * Recursively compares two values for deep structural equality.
 * 
 * @param a - First value
 * @param b - Second value
 * @returns True if values are deeply equal
 * 
 * @example
 * ```ts
 * deepEqual({ a: 1, b: { c: 2 } }, { a: 1, b: { c: 2 } }); // true
 * deepEqual({ a: 1 }, { a: 2 }); // false
 * ```
 */
export function deepEqual<T>(a: T, b: T): boolean {
  // Handle same reference or primitives
  if (a === b) return true;
  
  // Handle type mismatch
  if (typeof a !== typeof b) return false;
  
  // Handle null
  if (a === null || b === null) return a === b;
  
  // Handle non-objects
  if (typeof a !== 'object') return false;

  // Handle Arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }
  
  // Handle one array, one non-array
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  // Handle Date objects
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  // Handle plain objects
  const keysA = Object.keys(a as any);
  const keysB = Object.keys(b as any);

  if (keysA.length !== keysB.length) return false;

  return keysA.every(key => {
    if (!keysB.includes(key)) return false;
    return deepEqual((a as any)[key], (b as any)[key]);
  });
}

/**
 * Check if a value is a plain object (not an array, Date, etc.)
 */
export function isPlainObject(value: unknown): value is Record<string, any> {
  if (typeof value !== 'object' || value === null) return false;
  if (Array.isArray(value)) return false;
  if (value instanceof Date) return false;
  if (value instanceof RegExp) return false;
  return Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null;
}
