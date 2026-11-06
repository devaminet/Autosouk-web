import { useEffect, useState } from "react";

// The value once it has stopped changing for the delay, such as text being typed.
export const useDebouncedValue = <T extends string | number | boolean>(value: T, delay: number): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
};
