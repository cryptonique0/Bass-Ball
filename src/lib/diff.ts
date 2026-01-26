/**
 * Diff and patch utilities for object comparison and state management
 * 
 * Provides tools for detecting changes between objects and applying patches.
 */

/** Diff operation types */
export type DiffType = 'add' | 'remove' | 'update';

/**
 * Represents a single change between two objects
 */
export interface Diff<T = any> {
  /** Type of change */
  type: DiffType;
  /** Property key that changed */
  key: string;
  /** Previous value (for remove and update) */
  oldValue?: T;
  /** New value (for add and update) */
  newValue?: T;
}

/**
 * Calculate differences between two objects
 * 
 * Performs shallow comparison of object properties.
 * 
 * @param before - Original object
 * @param after - Modified object
 * @returns Array of differences
 * 
 * @example
 * ```ts
 * const before = { a: 1, b: 2 };
 * const after = { a: 1, b: 3, c: 4 };
 * const diffs = diff(before, after);
 * // [
 * //   { type: 'update', key: 'b', oldValue: 2, newValue: 3 },
 * //   { type: 'add', key: 'c', newValue: 4 }
 * // ]
 * ```
 */
export function diff<T extends Record<string, any>>(
  before: T,
  after: T
): Diff<any>[] {
  const diffs: Diff<any>[] = [];
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);

  keys.forEach(key => {
    if (!(key in before)) {
      diffs.push({ type: 'add', key, newValue: after[key] });
    } else if (!(key in after)) {
      diffs.push({ type: 'remove', key, oldValue: before[key] });
    } else if (before[key] !== after[key]) {
      diffs.push({
        type: 'update',
        key,
        oldValue: before[key],
        newValue: after[key],
      });
    }
  });

  return diffs;
}

/**
 * Apply a set of diffs to an object
 * 
 * Creates a new object with the patches applied.
 * 
 * @param original - Original object
 * @param diffs - Array of diffs to apply
 * @returns New patched object
 * 
 * @example
 * ```ts
 * const original = { a: 1, b: 2 };
 * const diffs = [{ type: 'update', key: 'b', newValue: 3 }];
 * const patched = patch(original, diffs);
 * // { a: 1, b: 3 }
 * ```
 */
export function patch<T extends Record<string, any>>(
  original: T,
  diffs: Diff<any>[]
): T {
  const result = { ...original };

  diffs.forEach(d => {
    if (d.type === 'add' || d.type === 'update') {
      result[d.key] = d.newValue;
    } else if (d.type === 'remove') {
      delete result[d.key];
    }
  });

  return result;
}

/**
 * Reverse a diff operation
 */
export function reverseDiff<T>(diff: Diff<T>): Diff<T> {
  if (diff.type === 'add') {
    return { type: 'remove', key: diff.key, oldValue: diff.newValue };
  } else if (diff.type === 'remove') {
    return { type: 'add', key: diff.key, newValue: diff.oldValue };
  } else {
    return {
      type: 'update',
      key: diff.key,
      oldValue: diff.newValue,
      newValue: diff.oldValue,
    };
  }
}

/**
 * Apply reverse patches to undo changes
 */
export function unpatch<T extends Record<string, any>>(
  current: T,
  diffs: Diff<any>[]
): T {
  const reversedDiffs = diffs.map(reverseDiff);
  return patch(current, reversedDiffs);
}
