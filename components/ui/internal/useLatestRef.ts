import { useLayoutEffect, useRef } from "react";

/**
 * Keep a ref pointed at the latest value without retriggering an effect that
 * only needs to read it later (event handlers, observers, overlay callbacks).
 * The write happens after commit so it does not read/write refs during render.
 */
export function useLatestRef<T>(value: T) {
  const ref = useRef(value);
  useLayoutEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}
