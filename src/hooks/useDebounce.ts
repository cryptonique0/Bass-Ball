// Debounced value hook
'use client';
import { useState, useEffect } from 'react';

export function useDebouncedValue<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// State with callback hook
export function useStateCallback<T>(
  initialState: T
): [T, (state: T, callback?: () => void) => void] {
  const [state, setState] = useState<T>(initialState);
  const [callback, setCallback] = useState<(() => void) | null>(null);

  useEffect(() => {
    if (callback) {
      callback();
      setCallback(null);
    }
  }, [state, callback]);

  return [
    state,
    (newState: T, cb?: () => void) => {
      setCallback(() => cb);
      setState(newState);
    },
  ];
}
