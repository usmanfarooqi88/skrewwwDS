import { useCallback, type KeyboardEvent as ReactKeyboardEvent } from "react";
import {
  addDays,
  addMonths,
  clampDateToMonth,
  getCalendarDateParts,
  type CalendarDateString,
  type CalendarMonthParts,
} from "@/components/ui/internal/calendar-date";
import {
  endOfWeekDate,
  startOfWeekDate,
} from "@/components/ui/internal/calendar-math";

type UseCalendarKeyboardOptions = {
  focusedDate: CalendarDateString;
  visibleMonth: CalendarMonthParts;
  weekStartsOn: 0 | 1;
  isDisabled?: (date: CalendarDateString) => boolean;
  onFocusedDateChange: (date: CalendarDateString) => void;
  onVisibleMonthChange: (month: CalendarMonthParts) => void;
  onSelectDate: (date: CalendarDateString) => void;
};

function moveIfEnabled(
  candidate: CalendarDateString,
  isDisabled: (date: CalendarDateString) => boolean,
  direction: 1 | -1,
): CalendarDateString {
  let current = candidate;
  for (let step = 0; step < 42; step += 1) {
    if (!isDisabled(current)) return current;
    current = addDays(current, direction);
  }
  return candidate;
}

export function useCalendarKeyboard({
  focusedDate,
  visibleMonth,
  weekStartsOn,
  isDisabled = () => false,
  onFocusedDateChange,
  onVisibleMonthChange,
  onSelectDate,
}: UseCalendarKeyboardOptions) {
  const syncVisibleMonth = useCallback(
    (date: CalendarDateString) => {
      const parts = getCalendarDateParts(date);
      if (parts.year !== visibleMonth.year || parts.month !== visibleMonth.month) {
        onVisibleMonthChange({ year: parts.year, month: parts.month });
      }
    },
    [onVisibleMonthChange, visibleMonth.month, visibleMonth.year],
  );

  const moveFocus = useCallback(
    (next: CalendarDateString) => {
      const resolved = moveIfEnabled(next, isDisabled, next >= focusedDate ? 1 : -1);
      // moveIfEnabled falls back to returning its candidate unchanged if no
      // enabled date exists within range — that candidate is itself disabled
      // in that case. Don't move focus onto a disabled date: a disabled
      // button can't actually receive DOM focus, so doing so would desync
      // React state from real keyboard focus at a hard min/max boundary.
      if (isDisabled(resolved)) return;
      onFocusedDateChange(resolved);
      syncVisibleMonth(resolved);
    },
    [focusedDate, isDisabled, onFocusedDateChange, syncVisibleMonth],
  );

  return useCallback(
    (event: ReactKeyboardEvent<HTMLElement>) => {
      let handled = false;
      let nextDate = focusedDate;

      switch (event.key) {
        case "ArrowRight":
          nextDate = addDays(focusedDate, 1);
          handled = true;
          break;
        case "ArrowLeft":
          nextDate = addDays(focusedDate, -1);
          handled = true;
          break;
        case "ArrowDown":
          nextDate = addDays(focusedDate, 7);
          handled = true;
          break;
        case "ArrowUp":
          nextDate = addDays(focusedDate, -7);
          handled = true;
          break;
        case "Home":
          nextDate = startOfWeekDate(focusedDate, weekStartsOn);
          handled = true;
          break;
        case "End":
          nextDate = endOfWeekDate(focusedDate, weekStartsOn);
          handled = true;
          break;
        case "PageDown": {
          const nextMonth = addMonths(visibleMonth, 1);
          onVisibleMonthChange(nextMonth);
          nextDate = clampDateToMonth(focusedDate, nextMonth);
          handled = true;
          break;
        }
        case "PageUp": {
          const previousMonth = addMonths(visibleMonth, -1);
          onVisibleMonthChange(previousMonth);
          nextDate = clampDateToMonth(focusedDate, previousMonth);
          handled = true;
          break;
        }
        case "Enter":
        case " ":
          if (!isDisabled(focusedDate)) {
            event.preventDefault();
            onSelectDate(focusedDate);
          }
          return;
        default:
          return;
      }

      if (!handled) return;
      event.preventDefault();
      moveFocus(nextDate);
    },
    [
      focusedDate,
      isDisabled,
      moveFocus,
      onSelectDate,
      onVisibleMonthChange,
      visibleMonth,
      weekStartsOn,
    ],
  );
}
