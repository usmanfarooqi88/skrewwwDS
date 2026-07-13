import { useEffect, useRef } from "react";

type OutsidePointerOptions = {
  active: boolean;
  onOutsidePointer: () => void;
  getInsideElements: () => Array<HTMLElement | null>;
};

export function useOutsidePointer({
  active,
  onOutsidePointer,
  getInsideElements,
}: OutsidePointerOptions) {
  const onOutsidePointerRef = useRef(onOutsidePointer);
  const getInsideElementsRef = useRef(getInsideElements);
  onOutsidePointerRef.current = onOutsidePointer;
  getInsideElementsRef.current = getInsideElements;

  useEffect(() => {
    if (!active) return;

    function handlePointerDown(event: PointerEvent) {
      if (event.button !== 0) return;
      const target = event.target;
      if (!(target instanceof Node)) return;

      const isInside = getInsideElementsRef
        .current()
        .some((element) => element && (element === target || element.contains(target)));

      if (!isInside) {
        onOutsidePointerRef.current();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => document.removeEventListener("pointerdown", handlePointerDown, true);
  }, [active]);
}
