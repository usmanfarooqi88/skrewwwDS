"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  /** Accessible name for the scrollable region. */
  label: string;
  children: ReactNode;
};

/**
 * Keyboard-focusable horizontal scroll container with a right-edge fade and a
 * short hint, shown only while content actually overflows. No dependencies.
 * Without JavaScript the region still scrolls; only the hint and fade are absent.
 */
export function ScrollRegion({ label, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState({ overflow: false, atEnd: true });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const overflow = el.scrollWidth > el.clientWidth + 1;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
      setState((prev) =>
        prev.overflow === overflow && prev.atEnd === atEnd ? prev : { overflow, atEnd },
      );
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    observer?.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      observer?.disconnect();
    };
  }, []);

  return (
    <div>
      <div className="relative">
        <div
          ref={ref}
          role="region"
          aria-label={label}
          tabIndex={0}
          // `relative` makes this the containing block for the absolutely positioned sr-only text inside the
          // table, so it is clipped here instead of widening the page.
          className="relative overflow-x-auto rounded-xl border border-ink-200 bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        >
          {children}
        </div>
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-y-px right-px w-10 rounded-r-xl bg-gradient-to-l from-white to-transparent transition-opacity",
            state.overflow && !state.atEnd ? "opacity-100" : "opacity-0",
          )}
        />
      </div>
      {state.overflow ? (
        <p className="mt-2 font-mono text-xs text-ink-500" data-testid="compare-scroll-hint">
          {state.atEnd ? "End of table." : "Scroll sideways to see more systems →"}
        </p>
      ) : null}
    </div>
  );
}
