import { useCallback, useEffect, useRef, useState } from "react";

export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
  controlled: controlledProp,
  valueProvided,
}: {
  value?: T;
  defaultValue?: T;
  onChange?: (next: T) => void;
  /** Explicit controlled override — prefer `valueProvided` from the component root. */
  controlled?: boolean;
  /** True when the parent passed a `value` prop, including `undefined`. */
  valueProvided?: boolean;
}) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue as T);
  const isControlled = controlledProp ?? valueProvided ?? value !== undefined;
  const current = isControlled ? (value as T) : uncontrolled;
  const wasControlledRef = useRef(isControlled);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    if (wasControlledRef.current !== isControlled) {
      console.warn(
        "[Skrewww] A component changed between controlled and uncontrolled modes. Keep `value` or `defaultValue` usage consistent across renders.",
      );
    }
    wasControlledRef.current = isControlled;
  }, [isControlled]);

  const setValue = useCallback(
    (next: T) => {
      if (!isControlled) setUncontrolled(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  return [current, setValue] as const;
}
