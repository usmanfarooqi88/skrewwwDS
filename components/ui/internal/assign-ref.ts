import type { Ref } from "react";

/** Write a value into a React ref prop (callback or object) without touching render. */
export function assignRef<T>(ref: Ref<T> | undefined | null, value: T) {
  if (!ref) return;
  if (typeof ref === "function") {
    ref(value);
    return;
  }
  ref.current = value;
}

export function mergeRefs<T>(
  ...refs: Array<Ref<T> | undefined | null>
): (value: T) => void {
  return (value) => {
    for (const ref of refs) {
      assignRef(ref, value);
    }
  };
}
