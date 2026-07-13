import { useEffect, useRef } from "react";
import { registerOverlay } from "@/components/ui/internal/overlay-stack";

export function useOverlayEscape(
  active: boolean,
  onEscape: () => void,
  options?: { modal?: boolean },
) {
  const onEscapeRef = useRef(onEscape);
  onEscapeRef.current = onEscape;

  useEffect(() => {
    if (!active) return;
    return registerOverlay(() => onEscapeRef.current(), { modal: options?.modal });
  }, [active, options?.modal]);
}
