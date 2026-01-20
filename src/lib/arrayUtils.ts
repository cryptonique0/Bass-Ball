// Data structure utilities
export const groupBy = <T, K extends string | number>(items: T[], key: (item: T) => K): Record<K, T[]> => {
  return items.reduce((acc, item) => {
    const k = key(item);
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {} as Record<K, T[]>);
};

export const sortBy = <T>(items: T[], key: (item: T) => number | string, desc = false): T[] => {
  return items.sort((a, b) => {
    const aVal = key(a);
    const bVal = key(b);
    if (aVal < bVal) return desc ? 1 : -1;
    if (aVal > bVal) return desc ? -1 : 1;
    return 0;
  });
};

export const unique = <T>(items: T[], key?: (item: T) => any): T[] => {
  if (!key) return [...new Set(items)];
  return items.filter((item, idx, arr) => 
    idx === arr.findIndex(x => key(x) === key(item))
  );
};

export const chunk = <T>(items: T[], size: number): T[][] => {
  const result = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
};

export const flatten = <T>(items: T[][]): T[] => items.flat();

export const zipWith = <A, B, R>(a: A[], b: B[], fn: (x: A, y: B) => R): R[] => {
  return a.map((x, i) => fn(x, b[i]));
};
