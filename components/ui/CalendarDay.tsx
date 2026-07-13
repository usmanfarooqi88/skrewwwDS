"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import {
  CALENDAR_DEFAULT_LOCALE,
  formatAccessibleDateLabel,
  getDayNumber,
  type CalendarDateString,
} from "@/components/ui/internal/calendar-date";
import styles from "@/components/ui/calendar-day.module.css";

export type CalendarDayProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "onClick" | "type"
> & {
  date: CalendarDateString;
  selected?: boolean;
  today?: boolean;
  outsideMonth?: boolean;
  accessibleLabel?: string;
  locale?: string;
  /** Committed range start (range mode only). Can be true together with `rangeEnd` for a single-day range. */
  rangeStart?: boolean;
  /** Committed range end (range mode only). Can be true together with `rangeStart` for a single-day range. */
  rangeEnd?: boolean;
  /** Strictly between a committed range's start and end, exclusive (range mode only). */
  rangeMiddle?: boolean;
  /** The provisional far end of an uncommitted hover/keyboard range preview (range mode only). */
  rangePreviewEnd?: boolean;
  /** Strictly between the committed start and the provisional preview end, exclusive (range mode only). */
  rangePreviewMiddle?: boolean;
  onDateSelect?: (date: CalendarDateString) => void;
  onFocusDate?: (date: CalendarDateString) => void;
  /** Range mode only: reports mouse hover start/end (`undefined` on leave) for the live range preview. */
  onHoverDate?: (date: CalendarDateString | undefined) => void;
};

function resolveRangeAccessibleLabel(
  baseLabel: string,
  { rangeStart, rangeEnd, rangeMiddle, rangePreviewEnd, rangePreviewMiddle }: {
    rangeStart: boolean;
    rangeEnd: boolean;
    rangeMiddle: boolean;
    rangePreviewEnd: boolean;
    rangePreviewMiddle: boolean;
  },
): string {
  if (rangeStart && rangeEnd) return `Start and end of range, ${baseLabel}`;
  if (rangeStart) return `Start of range, ${baseLabel}`;
  if (rangeEnd) return `End of range, ${baseLabel}`;
  if (rangeMiddle) return `${baseLabel}, in range`;
  if (rangePreviewEnd) return `${baseLabel}, provisional end of range. Press Enter to confirm.`;
  if (rangePreviewMiddle) return `${baseLabel}, previewing range`;
  return baseLabel;
}

export const CalendarDay = forwardRef<HTMLButtonElement, CalendarDayProps>(function CalendarDay(
  {
    date,
    selected = false,
    today = false,
    outsideMonth = false,
    disabled = false,
    accessibleLabel,
    locale = CALENDAR_DEFAULT_LOCALE,
    rangeStart = false,
    rangeEnd = false,
    rangeMiddle = false,
    rangePreviewEnd = false,
    rangePreviewMiddle = false,
    onDateSelect,
    onFocusDate,
    onHoverDate,
    className,
    tabIndex = -1,
    ...props
  },
  ref,
) {
  const baseLabel = formatAccessibleDateLabel(date, locale);
  const label =
    accessibleLabel ??
    resolveRangeAccessibleLabel(baseLabel, {
      rangeStart,
      rangeEnd,
      rangeMiddle,
      rangePreviewEnd,
      rangePreviewMiddle,
    });
  const dayNumber = getDayNumber(date);

  return (
    <button
      {...props}
      ref={ref}
      type="button"
      className={cn(
        styles.day,
        today && styles.today,
        selected && styles.selected,
        outsideMonth && styles.outside,
        disabled && styles.disabled,
        rangeStart && styles.rangeStart,
        rangeEnd && styles.rangeEnd,
        rangeMiddle && styles.rangeMiddle,
        rangePreviewEnd && styles.rangePreviewEnd,
        rangePreviewMiddle && styles.rangePreviewMiddle,
        className,
      )}
      aria-label={label}
      aria-current={today ? "date" : undefined}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      tabIndex={disabled ? -1 : tabIndex}
      data-date={date}
      data-outside-month={outsideMonth ? "true" : undefined}
      onClick={() => {
        if (!disabled) onDateSelect?.(date);
      }}
      onFocus={() => onFocusDate?.(date)}
      onMouseEnter={() => onHoverDate?.(date)}
      onMouseLeave={() => onHoverDate?.(undefined)}
    >
      <span className={styles.dayNumber} aria-hidden="true">
        {dayNumber}
      </span>
      {today ? <span className={styles.todayIndicator} aria-hidden="true" /> : null}
    </button>
  );
});
