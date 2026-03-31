import { useState, useEffect } from 'react';

/**
 * Custom hook for debouncing a value.
 * Useful for delaying search queries as the user types.
 */
export function useDebounce<T>(value: T, delayMs: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set debouncedValue to value after the specified delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    // Cancel the timeout if value changes (also on delay change or unmount)
    return () => {
      clearTimeout(timer);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
