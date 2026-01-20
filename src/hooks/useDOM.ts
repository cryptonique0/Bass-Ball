'use client';
import { useCallback, useRef } from 'react';

interface Size {
  width: number;
  height: number;
}

export function useWindowSize(): Size {
  const [size, setSize] = React.useState<Size>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  React.useEffect(() => {
    const handler = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return size;
}

export function useScrollPosition(): number {
  const [position, setPosition] = React.useState(0);

  React.useEffect(() => {
    const handler = () => setPosition(window.scrollY);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return position;
}

export function useClickOutside(ref: React.RefObject<HTMLElement>, callback: () => void) {
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        callback();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [ref, callback]);
}

import React;
