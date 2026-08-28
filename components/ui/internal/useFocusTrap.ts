import { useEffect, useLayoutEffect } from "react";
import { useLatestRef } from "@/components/ui/internal/useLatestRef";
import {
  getFocusableElementsForScope,
  resolveInitialFocusTarget,
} from "@/components/ui/internal/focus-utils";

type FocusTrapOptions = {
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  overlayScopeId?: string;
};

export function useFocusTrap(
  active: boolean,
  container: HTMLElement | null,
  options?: FocusTrapOptions,
) {
  const optionsRef = useLatestRef(options);

  useLayoutEffect(() => {
    if (!active || !container) return;

    const focusInitial = () => {
      const target = resolveInitialFocusTarget(
        container,
        optionsRef.current?.initialFocusRef,
        optionsRef.current?.overlayScopeId,
      );
      target.focus();
    };

    focusInitial();
    const timer = window.setTimeout(focusInitial, 0);
    return () => window.clearTimeout(timer);
  }, [active, container, optionsRef]);

  useEffect(() => {
    if (!active || !container) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Tab" || !container) return;
      const nodes = getFocusableElementsForScope(
        container,
        optionsRef.current?.overlayScopeId,
      );
      if (nodes.length === 0) {
        event.preventDefault();
        return;
      }

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [active, container, optionsRef]);
}
