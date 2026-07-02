// src/hooks/useDebounce.ts
import { useRef, useEffect, useCallback } from 'react';

/**
 * Returns a debounced version of the supplied callback.
 * Calls the callback after the specified delay has elapsed since the last invocation.
 */
export function useDebounce<T extends (...args: any[]) => any>(callback: T, delay: number) {
  const timer = useRef<NodeJS.Timeout | null>(null);

  const debounced = useCallback((...args: Parameters<T>) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);

  // Cleanup on unmount
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return debounced;
}
