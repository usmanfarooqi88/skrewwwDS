import { useLayoutEffect, useRef, useState } from "react";
import { registerOverlay } from "@/components/ui/internal/overlay-stack";

/**
 * Base z-index for stacked overlay content (Popover/Dialog/Drawer/Tooltip). Each
 * overlay's actual z-index is this base plus its registration order in the shared
 * overlay stack, so an overlay opened later — e.g. a Popover opened from inside an
 * already-open Dialog — always renders above the ones already on screen, regardless
 * of which component type it is. Without this, a Popover's static z-index token could
 * be lower than a Dialog's/Drawer's, rendering it behind them even though it opened
 * on top of the stack (see docs/architecture nested-overlay notes).
 */
const OVERLAY_STACK_BASE_Z_INDEX = 60;

export function useOverlayEscape(
  active: boolean,
  onEscape: () => void,
  options?: { modal?: boolean },
): number | undefined {
  const onEscapeRef = useRef(onEscape);
  onEscapeRef.current = onEscape;
  const [zIndex, setZIndex] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    // Skip when inactive: every consumer of this hook (Popover/Dialog/Drawer/Tooltip content)
    // renders null while its own `open`/`active` state is false, so a stale zIndex from a prior
    // open never reaches the DOM — it gets overwritten with a fresh order-derived value the next
    // time this effect registers.
    if (!active) return;
    const { order, unregister } = registerOverlay(() => onEscapeRef.current(), {
      modal: options?.modal,
    });
    setZIndex(OVERLAY_STACK_BASE_Z_INDEX + order);
    return unregister;
  }, [active, options?.modal]);

  return zIndex;
}
