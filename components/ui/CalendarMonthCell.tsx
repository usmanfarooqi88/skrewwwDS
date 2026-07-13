"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import styles from "@/components/ui/calendar-period-cell.module.css";

export type CalendarMonthCellProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "onClick" | "type"
> & {
  /** 1-12 */
  month: number;
  label: string;
  selected?: boolean;
  today?: boolean;
  onMonthSelect?: (month: number) => void;
  onFocusMonth?: (month: number) => void;
};

export const CalendarMonthCell = forwardRef<HTMLButtonElement, CalendarMonthCellProps>(
  function CalendarMonthCell(
    {
      month,
      label,
      selected = false,
      today = false,
      disabled = false,
      onMonthSelect,
      onFocusMonth,
      className,
      tabIndex = -1,
      ...props
    },
    ref,
  ) {
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
        data-month={month}
        onClick={() => {
          if (!disabled) onMonthSelect?.(month);
        }}
        onFocus={() => onFocusMonth?.(month)}
      >
        <span className={styles.label} aria-hidden="true">
          {label}
        </span>
        {today ? <span className={styles.todayIndicator} aria-hidden="true" /> : null}
      </button>
    );
  },
);
