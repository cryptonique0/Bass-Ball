// Diff and patch utilities
export interface Diff<T> {
  type: 'add' | 'remove' | 'update';
  key: string;
  oldValue?: T;
  newValue?: T;
}

export function diff<T extends Record<string, any>>(before: T, after: T): Diff<any>[] {
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

export function patch<T extends Record<string, any>>(original: T, diffs: Diff<any>[]): T {
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
