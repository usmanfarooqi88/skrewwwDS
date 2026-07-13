import { useEffect, useRef } from "react";

function getScrollableAncestors(node: HTMLElement): HTMLElement[] {
  const ancestors: HTMLElement[] = [];
  let current: HTMLElement | null = node.parentElement;

  while (current) {
    const style = getComputedStyle(current);
    if (/(auto|scroll|overlay)/.test(`${style.overflow}${style.overflowY}${style.overflowX}`)) {
      ancestors.push(current);
    }
    current = current.parentElement;
  }

  return ancestors;
}

type UseFloatingPositionOptions = {
  enabled: boolean;
  triggerElement: HTMLElement | null;
  floatingElement: HTMLElement | null;
  onUpdate: () => void;
};

export function useFloatingPosition({
  enabled,
  triggerElement,
  floatingElement,
  onUpdate,
}: UseFloatingPositionOptions) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!enabled || !triggerElement) return;

    let frame = 0;
    const scheduleUpdate = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => onUpdateRef.current());
    };

    scheduleUpdate();

    const scrollAncestors = getScrollableAncestors(triggerElement);
    for (const ancestor of scrollAncestors) {
      ancestor.addEventListener("scroll", scheduleUpdate, { passive: true });
    }

    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("scroll", scheduleUpdate, true);

    let triggerObserver: ResizeObserver | undefined;
    let floatingObserver: ResizeObserver | undefined;

    if (typeof ResizeObserver !== "undefined") {
      triggerObserver = new ResizeObserver(scheduleUpdate);
      triggerObserver.observe(triggerElement);

      if (floatingElement) {
        floatingObserver = new ResizeObserver(scheduleUpdate);
        floatingObserver.observe(floatingElement);
      }
    }

    return () => {
      cancelAnimationFrame(frame);
      for (const ancestor of scrollAncestors) {
        ancestor.removeEventListener("scroll", scheduleUpdate);
      }
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("scroll", scheduleUpdate, true);
      triggerObserver?.disconnect();
      floatingObserver?.disconnect();
    };
  }, [enabled, floatingElement, triggerElement]);
}
