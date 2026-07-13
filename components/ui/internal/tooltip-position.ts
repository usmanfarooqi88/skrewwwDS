export type TooltipPlacement = "top" | "right" | "bottom" | "left";

export type TooltipPosition = {
  top: number;
  left: number;
  placement: TooltipPlacement;
};

export function getOppositePlacement(placement: TooltipPlacement): TooltipPlacement {
  if (placement === "top") return "bottom";
  if (placement === "bottom") return "top";
  if (placement === "left") return "right";
  return "left";
}

export function computeTooltipPosition(
  triggerRect: DOMRect,
  tooltipRect: DOMRect,
  preferred: TooltipPlacement,
  offset: number,
): TooltipPosition {
  const placements: TooltipPlacement[] = [preferred, "top", "bottom", "right", "left"];
  const viewportPadding = 8;

  for (const placement of placements) {
    let top = 0;
    let left = 0;

    if (placement === "top") {
      top = triggerRect.top - tooltipRect.height - offset;
      left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
    } else if (placement === "bottom") {
      top = triggerRect.bottom + offset;
      left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
    } else if (placement === "left") {
      top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
      left = triggerRect.left - tooltipRect.width - offset;
    } else {
      top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
      left = triggerRect.right + offset;
    }

    const fits =
      top >= viewportPadding &&
      left >= viewportPadding &&
      top + tooltipRect.height <= window.innerHeight - viewportPadding &&
      left + tooltipRect.width <= window.innerWidth - viewportPadding;

    if (fits) {
      return {
        top: Math.max(viewportPadding, top),
        left: Math.max(viewportPadding, left),
        placement,
      };
    }
  }

  return {
    top: Math.max(viewportPadding, triggerRect.bottom + offset),
    left: Math.max(
      viewportPadding,
      triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2,
    ),
    placement: preferred,
  };
}
