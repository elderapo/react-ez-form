import { useEffect, useRef } from "react";

export const usePrevious = <T extends any>(value: T): T | null => {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
};
