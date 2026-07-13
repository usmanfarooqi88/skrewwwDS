"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import styles from "@/components/ui/calendar-period-cell.module.css";

export type CalendarYearCellProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "onClick" | "type"
> & {
  year: number;
  selected?: boolean;
  today?: boolean;
  onYearSelect?: (year: number) => void;
  onFocusYear?: (year: number) => void;
};

export const CalendarYearCell = forwardRef<HTMLButtonElement, CalendarYearCellProps>(
  function CalendarYearCell(
    {
      year,
      selected = false,
      today = false,
      disabled = false,
      onYearSelect,
      onFocusYear,
      className,
      tabIndex = -1,
      ...props
    },
    ref,
  ) {
    const label = String(year);

    return (
      <button
        {...props}
        ref={ref}
        type="button"
        className={cn(
          styles.cell,
          today && styles.today,
          selected && styles.selected,
          disabled && styles.disabled,
          className,
        )}
        aria-label={label}
        aria-current={today ? "date" : undefined}
        aria-disabled={disabled || undefined}
        disabled={disabled}
        tabIndex={disabled ? -1 : tabIndex}
        data-year={year}
        onClick={() => {
          if (!disabled) onYearSelect?.(year);
        }}
        onFocus={() => onFocusYear?.(year)}
      >
        <span className={styles.label} aria-hidden="true">
          {label}
        </span>
        {today ? <span className={styles.todayIndicator} aria-hidden="true" /> : null}
      </button>
    );
  },
);
