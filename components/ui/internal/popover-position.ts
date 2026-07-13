export type PopoverPlacement = "top" | "right" | "bottom" | "left";
export type PopoverAlign = "start" | "center" | "end";

export type PopoverPosition = {
  top: number;
  left: number;
  placement: PopoverPlacement;
  align: PopoverAlign;
};

export function getOppositePlacement(placement: PopoverPlacement): PopoverPlacement {
  if (placement === "top") return "bottom";
  if (placement === "bottom") return "top";
  if (placement === "left") return "right";
  return "left";
}

function computeAlignedCoordinate(
  triggerStart: number,
  triggerSize: number,
  floatingSize: number,
  align: PopoverAlign,
): number {
  if (align === "start") return triggerStart;
  if (align === "end") return triggerStart + triggerSize - floatingSize;
  return triggerStart + triggerSize / 2 - floatingSize / 2;
}

export function computePopoverPosition(
  triggerRect: DOMRect,
  popoverRect: DOMRect,
  preferredPlacement: PopoverPlacement,
  preferredAlign: PopoverAlign,
  offset: number,
  viewportPadding: number,
): PopoverPosition {
  const placements: PopoverPlacement[] = [
    preferredPlacement,
    "bottom",
    "top",
    "right",
    "left",
  ];
  const aligns: PopoverAlign[] = [preferredAlign, "center", "start", "end"];

  for (const placement of placements) {
    for (const align of aligns) {
      let top = 0;
      let left = 0;

      if (placement === "top") {
        top = triggerRect.top - popoverRect.height - offset;
        left = computeAlignedCoordinate(
          triggerRect.left,
          triggerRect.width,
          popoverRect.width,
          align,
        );
      } else if (placement === "bottom") {
        top = triggerRect.bottom + offset;
        left = computeAlignedCoordinate(
          triggerRect.left,
          triggerRect.width,
          popoverRect.width,
          align,
        );
      } else if (placement === "left") {
        left = triggerRect.left - popoverRect.width - offset;
        top = computeAlignedCoordinate(
          triggerRect.top,
          triggerRect.height,
          popoverRect.height,
          align,
        );
      } else {
        left = triggerRect.right + offset;
        top = computeAlignedCoordinate(
          triggerRect.top,
          triggerRect.height,
          popoverRect.height,
          align,
        );
      }

      const fits =
        top >= viewportPadding &&
        left >= viewportPadding &&
        top + popoverRect.height <= window.innerHeight - viewportPadding &&
        left + popoverRect.width <= window.innerWidth - viewportPadding;

      if (fits) {
        const clampedLeft = Math.min(
          Math.max(viewportPadding, left),
          window.innerWidth - viewportPadding - popoverRect.width,
        );
        const clampedTop = Math.min(
          Math.max(viewportPadding, top),
          window.innerHeight - viewportPadding - popoverRect.height,
        );

        return {
          top: clampedTop,
          left: clampedLeft,
          placement,
          align,
        };
      }
    }
  }

  return {
    top: Math.max(
      viewportPadding,
      Math.min(
        triggerRect.bottom + offset,
        window.innerHeight - viewportPadding - popoverRect.height,
      ),
    ),
    left: Math.min(
      Math.max(
        viewportPadding,
        computeAlignedCoordinate(
          triggerRect.left,
          triggerRect.width,
          popoverRect.width,
          preferredAlign,
        ),
      ),
      window.innerWidth - viewportPadding - popoverRect.width,
    ),
    placement: preferredPlacement,
    align: preferredAlign,
  };
}
