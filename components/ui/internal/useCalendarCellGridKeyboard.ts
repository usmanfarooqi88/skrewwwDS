import { useCallback, type KeyboardEvent as ReactKeyboardEvent } from "react";

/**
 * Shared roving-tabindex/arrow-key behavior for the flat 12-cell month and
 * year drill-up grids. Both grids are plain index-based NxM layouts (unlike
 * the day grid, which needs calendar-date arithmetic), so they share this one
 * hook instead of duplicating the same handler twice.
 */
type UseCalendarCellGridKeyboardOptions = {
  focusedIndex: number;
  itemCount: number;
  columns: number;
  isDisabled?: (index: number) => boolean;
  onFocusedIndexChange: (index: number) => void;
  onSelect: (index: number) => void;
};

function moveIndexIfEnabled(
  candidate: number,
  itemCount: number,
  isDisabled: (index: number) => boolean,
  direction: 1 | -1,
): number | null {
  let current = candidate;
  while (current >= 0 && current < itemCount) {
    if (!isDisabled(current)) return current;
    current += direction;
  }
  return null;
}

export function useCalendarCellGridKeyboard({
  focusedIndex,
  itemCount,
  columns,
  isDisabled = () => false,
  onFocusedIndexChange,
  onSelect,
}: UseCalendarCellGridKeyboardOptions) {
  const moveFocus = useCallback(
    (rawNext: number) => {
      if (rawNext < 0 || rawNext >= itemCount) return;
      const direction = rawNext >= focusedIndex ? 1 : -1;
      const resolved = moveIndexIfEnabled(rawNext, itemCount, isDisabled, direction);
      // No enabled cell found scanning in that direction — a disabled button
      // can't actually receive DOM focus, so leave focus where it is rather
      // than desyncing React state from real keyboard focus at a boundary.
      if (resolved === null || isDisabled(resolved)) return;
      onFocusedIndexChange(resolved);
    },
    [focusedIndex, isDisabled, itemCount, onFocusedIndexChange],
  );

  return useCallback(
    (event: ReactKeyboardEvent<HTMLElement>) => {
      const row = Math.floor(focusedIndex / columns);
      let next = focusedIndex;
      let handled = false;

      switch (event.key) {
        case "ArrowRight":
          next = focusedIndex + 1;
          handled = true;
          break;
        case "ArrowLeft":
          next = focusedIndex - 1;
          handled = true;
          break;
        case "ArrowDown":
          next = focusedIndex + columns;
          handled = true;
          break;
        case "ArrowUp":
          next = focusedIndex - columns;
          handled = true;
          break;
        case "Home":
          next = row * columns;
          handled = true;
          break;
        case "End":
          next = Math.min(row * columns + columns - 1, itemCount - 1);
          handled = true;
          break;
        case "Enter":
        case " ":
          if (!isDisabled(focusedIndex)) {
            event.preventDefault();
            onSelect(focusedIndex);
          }
          return;
        default:
          return;
      }

      if (!handled) return;
      event.preventDefault();
      moveFocus(next);
    },
    [columns, focusedIndex, isDisabled, itemCount, moveFocus, onSelect],
  );
}
