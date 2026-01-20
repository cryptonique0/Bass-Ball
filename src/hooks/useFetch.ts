// Fetch hook
'use client';
import { useEffect, useState } from 'react';

export interface UseFetchState<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
}

export function useFetch<T>(url: string | null, options?: RequestInit) {
  const [state, setState] = useState<UseFetchState<T>>({
    data: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    if (!url) return;

    const abortController = new AbortController();

    (async () => {
      try {
        const response = await fetch(url, {
          ...options,
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setState({ data, error: null, loading: false });
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          setState({ data: null, error, loading: false });
        }
      }
    })();

    return () => abortController.abort();
  }, [url, options]);

  return state;
}
