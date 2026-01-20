'use client';
import { useState, useCallback } from 'react';

export function useToggle(initial: boolean = false): [boolean, () => void, (value: boolean) => void] {
  const [state, setState] = useState(initial);

  const toggle = useCallback(() => setState(s => !s), []);
  const setValue = useCallback((value: boolean) => setState(value), []);

  return [state, toggle, setValue];
}

export function useLocalStorage<T>(key: string, initial: T): [T, (value: T) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initial;
    } catch {
      return initial;
    }
  });

  const setValue = useCallback(
    (value: T) => {
      setState(value);
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.error('Failed to save to localStorage:', e);
      }
    },
    [key]
  );

  return [state, setValue];
}

export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate: boolean = true
) {
  const [state, setState] = useState<{
    status: 'idle' | 'pending' | 'success' | 'error';
    data: T | null;
    error: Error | null;
  }>({ status: 'idle', data: null, error: null });

  const execute = useCallback(async () => {
    setState({ status: 'pending', data: null, error: null });
    try {
      const result = await asyncFunction();
      setState({ status: 'success', data: result, error: null });
    } catch (error) {
      setState({ status: 'error', data: null, error: error as Error });
    }
  }, [asyncFunction]);

  React.useEffect(() => {
    if (immediate) execute();
  }, [execute, immediate]);

  return { ...state, execute };
}
