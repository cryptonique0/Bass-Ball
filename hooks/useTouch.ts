import { useEffect, useRef } from 'react';
import { TouchGestures, GestureOptions, GestureCallbacks } from '@/lib/touchGestures';

export function useTouch<T extends HTMLElement = HTMLElement>(
  ref: React.RefObject<T>,
  options: GestureOptions = {},
  callbacks: GestureCallbacks = {}
) {
  const managerRef = useRef<TouchGestures | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const mgr = new TouchGestures(options, callbacks);
    mgr.attach(ref.current);
    managerRef.current = mgr;

    return () => {
      managerRef.current?.detach();
      managerRef.current = null;
    };
    // We intentionally exclude callbacks/options identity changes to avoid re-attaching mid-gesture
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref.current]);

  return managerRef.current;
}

export default useTouch;
