"use client";

import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type RefObject,
  type MutableRefObject,
} from "react";
import { CalendarDay } from "@/components/ui/CalendarDay";
import { CalendarMonthCell } from "@/components/ui/CalendarMonthCell";
import { CalendarYearCell } from "@/components/ui/CalendarYearCell";
import { cn } from "@/lib/cn";
import {
  CALENDAR_DEFAULT_LOCALE,
  CALENDAR_DEFAULT_WEEK_STARTS_ON,
  addDays,
  addMonths,
  compareCalendarDates,
  formatAccessibleDateLabel,
  formatMonthLabel,
  formatMonthNameLabel,
  formatWeekdayLabel,
  getCalendarDateParts,
  getMonthFromDate,
  getTodayCalendarDate,
  isDateWithinRange,
  isSameCalendarMonth,
  parseCalendarDate,
  warnIfFormatterPairIncomplete,
  type CalendarDateRange,
  type CalendarDateString,
  type CalendarFormatterOverrides,
  type CalendarMonthParts,
} from "@/components/ui/internal/calendar-date";
import {
  PERIOD_GRID_COLUMNS,
  YEAR_GRID_PAGE_SIZE,
  generateMonthGrid,
  getYearPageStart,
  isMonthFullyDisabled,
  isYearFullyDisabled,
  pageHasSelectableYear,
  resolveNearestEnabledIndex,
} from "@/components/ui/internal/calendar-math";
import { useCalendarKeyboard } from "@/components/ui/internal/useCalendarKeyboard";
import { useCalendarCellGridKeyboard } from "@/components/ui/internal/useCalendarCellGridKeyboard";
import { useControllableState } from "@/lib/use-controllable";
import styles from "@/components/ui/calendar-grid.module.css";

export type CalendarGridProps = {
  /** "single" (default) selects one date via value/defaultValue/onValueChange, untouched by range mode.
   *  "range" selects a start/end pair via rangeValue/defaultRangeValue/onRangeValueChange instead. */
  mode?: "single" | "range";
  value?: CalendarDateString;
  defaultValue?: CalendarDateString;
  onValueChange?: (value: CalendarDateString) => void;
  /** Range mode only. Ignored when mode is "single". */
  rangeValue?: CalendarDateRange;
  /** Range mode only. Ignored when mode is "single". */
  defaultRangeValue?: CalendarDateRange;
  /** Range mode only. Ignored when mode is "single". */
  onRangeValueChange?: (range: CalendarDateRange) => void;
  visibleMonth?: CalendarMonthParts;
  defaultVisibleMonth?: CalendarMonthParts;
  onVisibleMonthChange?: (month: CalendarMonthParts) => void;
  weekStartsOn?: 0 | 1;
  locale?: string;
  initialFocusDate?: CalendarDateString;
  /** Earliest selectable date, inclusive. Dates before this are disabled. */
  minDate?: CalendarDateString;
  /** Latest selectable date, inclusive. Dates after this are disabled. */
  maxDate?: CalendarDateString;
  /** Arbitrary additional disabled-date predicate, combined with minDate/maxDate. */
  isDateDisabled?: (date: CalendarDateString) => boolean;
  dayButtonRef?: RefObject<HTMLButtonElement | null>;
  className?: string;
  "aria-label"?: string;
} & CalendarFormatterOverrides;

/** Which drill level of the calendar is currently showing. Internal UI state only. */
type CalendarSubview = "day" | "month" | "year";

function monthKey(month: CalendarMonthParts): string {
  return `${month.year}-${month.month}`;
}

function chunkIntoRows<T>(items: T[], columns: number): T[][] {
  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += columns) {
    rows.push(items.slice(index, index + columns));
  }
  return rows;
}

function resolveInitialFocusDate(
  value: CalendarDateString | undefined,
  visibleMonth: CalendarMonthParts,
  initialFocusDate: CalendarDateString | undefined,
  isDisabled: (date: CalendarDateString) => boolean,
): CalendarDateString {
  const candidates: CalendarDateString[] = [];
  if (
    initialFocusDate &&
    parseCalendarDate(initialFocusDate) &&
    isSameCalendarMonth(initialFocusDate, visibleMonth)
  ) {
    candidates.push(initialFocusDate);
  }
  // Only treat the selected value as a focus candidate when it actually falls
  // within the month we're now showing — otherwise a selection made in a
  // different month would steal focus away from the month just navigated to.
  if (value && parseCalendarDate(value) && isSameCalendarMonth(value, visibleMonth)) {
    candidates.push(value);
  }
  const today = getTodayCalendarDate();
  if (today.startsWith(`${visibleMonth.year}-${String(visibleMonth.month).padStart(2, "0")}`)) {
    candidates.push(today);
  }
  candidates.push(`${visibleMonth.year}-${String(visibleMonth.month).padStart(2, "0")}-01`);

  const firstEnabled = candidates.find((c) => !isDisabled(c));
  if (firstEnabled) return firstEnabled;

  // Every preferred candidate is disabled — search forward from the 1st of the
  // visible month for the nearest enabled day, so focus never silently lands
  // on a date the user can't actually select.
  let probe = `${visibleMonth.year}-${String(visibleMonth.month).padStart(2, "0")}-01`;
  for (let step = 0; step < 42; step += 1) {
    if (!isDisabled(probe)) return probe;
    probe = addDays(probe, 1);
  }
  return candidates[0] ?? probe;
}

export function CalendarGrid(props: CalendarGridProps) {
  const valueProvided = "value" in props;
  const rangeValueProvided = "rangeValue" in props;
  const {
    mode = "single",
    value,
    defaultValue,
    onValueChange,
    rangeValue: rangeValueProp,
    defaultRangeValue,
    onRangeValueChange,
    visibleMonth,
    defaultVisibleMonth,
    onVisibleMonthChange,
    weekStartsOn = CALENDAR_DEFAULT_WEEK_STARTS_ON,
    locale = CALENDAR_DEFAULT_LOCALE,
    initialFocusDate,
    minDate,
    maxDate,
    isDateDisabled,
    dayButtonRef,
    className,
    formatMonth,
    formatWeekday,
    formatDate,
    parseDate,
    "aria-label": ariaLabel,
  } = props;
  useEffect(() => {
    warnIfFormatterPairIncomplete({ formatMonth, formatWeekday, formatDate, parseDate });
  }, [formatDate, formatMonth, formatWeekday, parseDate]);

  const labelId = useId();
  const gridRef = useRef<HTMLDivElement | null>(null);
  const dayRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const monthRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const yearRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  const [selectedValue, setSelectedValue] = useControllableState<CalendarDateString | undefined>({
    value,
    defaultValue,
    onChange: (next) => {
      if (next) onValueChange?.(next);
    },
    valueProvided,
  });

  const initialSelectedValue = value ?? defaultValue;
  const [currentMonth, setCurrentMonth] = useControllableState<CalendarMonthParts>({
    value: visibleMonth,
    defaultValue:
      defaultVisibleMonth ??
      (initialSelectedValue
        ? getMonthFromDate(initialSelectedValue)
        : getMonthFromDate(getTodayCalendarDate())),
    onChange: onVisibleMonthChange,
  });

  const isDisabled = useCallback(
    (date: CalendarDateString) =>
      !isDateWithinRange(date, minDate, maxDate) || (isDateDisabled?.(date) ?? false),
    [minDate, maxDate, isDateDisabled],
  );

  const [rangeValue, setRangeValue] = useControllableState<CalendarDateRange>({
    value: rangeValueProp,
    defaultValue: defaultRangeValue ?? { start: undefined, end: undefined },
    onChange: onRangeValueChange,
    valueProvided: rangeValueProvided,
  });

  // Mouse-hover tracking for the live range preview (range mode only). Cleared
  // whenever real DOM focus moves, so keyboard arrow-key navigation always
  // takes over as the preview anchor instead of a stale hover position.
  const [hoveredDate, setHoveredDate] = useState<CalendarDateString | undefined>(undefined);

  const [subview, setSubview] = useState<CalendarSubview>("day");
  const previousSubviewRef = useRef<CalendarSubview>(subview);

  // What a fresh drill navigation (initial mount, or landing back on the day
  // grid after picking a month) should treat as "the value" for initial focus
  // purposes — the range's end (or start, if no end yet) in range mode, or
  // the single selected date otherwise. Keeps resolveInitialFocusDate's logic
  // shared across both modes without changing single mode's actual values.
  const focusCandidateValue = mode === "range" ? (rangeValue.end ?? rangeValue.start) : selectedValue;

  const [focusedDate, setFocusedDate] = useState<CalendarDateString>(() =>
    resolveInitialFocusDate(
      focusCandidateValue ?? defaultValue,
      currentMonth,
      initialFocusDate,
      isDisabled,
    ),
  );
  const [focusedMonthIndex, setFocusedMonthIndex] = useState(() => currentMonth.month - 1);
  const [focusedYearIndex, setFocusedYearIndex] = useState(0);
  const [yearPageStart, setYearPageStart] = useState(() => getYearPageStart(currentMonth.year));

  const cells = useMemo(
    () => generateMonthGrid(currentMonth, { weekStartsOn }),
    [currentMonth, weekStartsOn],
  );

  const weeks = useMemo(() => {
    const rows: typeof cells[] = [];
    for (let index = 0; index < cells.length; index += 7) {
      rows.push(cells.slice(index, index + 7));
    }
    return rows;
  }, [cells]);

  const weekdayLabels = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) =>
        formatWeekday?.(index) ?? formatWeekdayLabel(index, locale, weekStartsOn),
      ),
    [formatWeekday, locale, weekStartsOn],
  );

  const monthLabel = useMemo(
    () => formatMonth?.(currentMonth) ?? formatMonthLabel(currentMonth, locale),
    [currentMonth, formatMonth, locale],
  );

  const today = getTodayCalendarDate();
  const todayParts = getCalendarDateParts(today);
  const selectedParts =
    selectedValue && parseCalendarDate(selectedValue) ? getCalendarDateParts(selectedValue) : null;

  const handleSelect = useCallback(
    (date: CalendarDateString) => {
      if (isDisabled(date)) return;
      setSelectedValue(date);
      setFocusedDate(date);
    },
    [isDisabled, setSelectedValue],
  );

  const handleRangeSelect = useCallback(
    (date: CalendarDateString) => {
      if (isDisabled(date)) return;
      setFocusedDate(date);
      setHoveredDate(undefined);

      if (rangeValue.start === undefined || rangeValue.end !== undefined) {
        // No range in progress, or a complete range already exists — every
        // click/Enter in that state starts a fresh range from here rather
        // than extending or replacing just one end of the old one.
        setRangeValue({ start: date, end: undefined });
        return;
      }

      // A start is set and end is not — this commits the end.
      // Decision: if the chosen date is before the current start, SWAP the
      // two so the range stays chronological, rather than discarding the
      // first click and restarting from this one. Both dates the user
      // actually clicked remain part of the final range this way, matching
      // the convention most mature range pickers use (Airbnb, Google
      // Flights) — restarting instead would make a backwards second click
      // feel like it did nothing.
      if (compareCalendarDates(date, rangeValue.start) < 0) {
        setRangeValue({ start: date, end: rangeValue.start });
      } else {
        setRangeValue({ start: rangeValue.start, end: date });
      }
    },
    [isDisabled, rangeValue, setRangeValue],
  );

  const handleFocusDate = useCallback(
    (date: CalendarDateString) => {
      setFocusedDate(date);
      // A real focus change (keyboard nav or a click) always supersedes any
      // stale mouse-hover preview state left over from elsewhere in the grid.
      if (mode === "range") setHoveredDate(undefined);
    },
    [mode],
  );

  const handleKeyDown = useCalendarKeyboard({
    focusedDate,
    visibleMonth: currentMonth,
    weekStartsOn,
    isDisabled,
    onFocusedDateChange: handleFocusDate,
    onVisibleMonthChange: setCurrentMonth,
    onSelectDate: mode === "range" ? handleRangeSelect : handleSelect,
  });

  const isMonthCellDisabled = useCallback(
    (index: number) => isMonthFullyDisabled(currentMonth.year, index + 1, isDisabled),
    [currentMonth.year, isDisabled],
  );

  const handleSelectMonth = useCallback(
    (month: number) => {
      if (isMonthFullyDisabled(currentMonth.year, month, isDisabled)) return;
      const nextMonth: CalendarMonthParts = { year: currentMonth.year, month };
      setCurrentMonth(nextMonth);
      setFocusedDate(resolveInitialFocusDate(focusCandidateValue, nextMonth, undefined, isDisabled));
      setSubview("day");
    },
    [currentMonth.year, focusCandidateValue, isDisabled, setCurrentMonth],
  );

  const handleMonthKeyDown = useCalendarCellGridKeyboard({
    focusedIndex: focusedMonthIndex,
    itemCount: 12,
    columns: PERIOD_GRID_COLUMNS,
    isDisabled: isMonthCellDisabled,
    onFocusedIndexChange: setFocusedMonthIndex,
    onSelect: (index) => handleSelectMonth(index + 1),
  });

  const isYearCellDisabled = useCallback(
    (index: number) => isYearFullyDisabled(yearPageStart + index, isDisabled),
    [yearPageStart, isDisabled],
  );

  const handleSelectYear = useCallback(
    (year: number) => {
      if (isYearFullyDisabled(year, isDisabled)) return;
      const nextMonth: CalendarMonthParts = { year, month: currentMonth.month };
      setCurrentMonth(nextMonth);
      const nextFocusedIndex = resolveNearestEnabledIndex(currentMonth.month - 1, 12, (index) =>
        isMonthFullyDisabled(year, index + 1, isDisabled),
      );
      setFocusedMonthIndex(nextFocusedIndex);
      setSubview("month");
    },
    [currentMonth.month, isDisabled, setCurrentMonth],
  );

  const handleYearKeyDown = useCalendarCellGridKeyboard({
    focusedIndex: focusedYearIndex,
    itemCount: YEAR_GRID_PAGE_SIZE,
    columns: PERIOD_GRID_COLUMNS,
    isDisabled: isYearCellDisabled,
    onFocusedIndexChange: setFocusedYearIndex,
    onSelect: (index) => handleSelectYear(yearPageStart + index),
  });

  const handleDrillUpToMonth = useCallback(() => {
    const nextFocusedIndex = resolveNearestEnabledIndex(currentMonth.month - 1, 12, (index) =>
      isMonthFullyDisabled(currentMonth.year, index + 1, isDisabled),
    );
    setFocusedMonthIndex(nextFocusedIndex);
    setSubview("month");
  }, [currentMonth.month, currentMonth.year, isDisabled]);

  const handleDrillUpToYear = useCallback(() => {
    const pageStart = getYearPageStart(currentMonth.year);
    setYearPageStart(pageStart);
    const nextFocusedIndex = resolveNearestEnabledIndex(
      currentMonth.year - pageStart,
      YEAR_GRID_PAGE_SIZE,
      (index) => isYearFullyDisabled(pageStart + index, isDisabled),
    );
    setFocusedYearIndex(nextFocusedIndex);
    setSubview("year");
  }, [currentMonth.year, isDisabled]);

  function goToYearPage(delta: number) {
    const nextPageStart = yearPageStart + delta * YEAR_GRID_PAGE_SIZE;
    setYearPageStart(nextPageStart);
    const nextFocusedIndex = resolveNearestEnabledIndex(focusedYearIndex, YEAR_GRID_PAGE_SIZE, (index) =>
      isYearFullyDisabled(nextPageStart + index, isDisabled),
    );
    setFocusedYearIndex(nextFocusedIndex);
  }

  const canGoPrevYearPage = useMemo(
    () =>
      pageHasSelectableYear(yearPageStart - YEAR_GRID_PAGE_SIZE, YEAR_GRID_PAGE_SIZE, (year) =>
        isYearFullyDisabled(year, isDisabled),
      ),
    [yearPageStart, isDisabled],
  );
  const canGoNextYearPage = useMemo(
    () =>
      pageHasSelectableYear(yearPageStart + YEAR_GRID_PAGE_SIZE, YEAR_GRID_PAGE_SIZE, (year) =>
        isYearFullyDisabled(year, isDisabled),
      ),
    [yearPageStart, isDisabled],
  );

  useEffect(() => {
    const node = dayRefs.current.get(focusedDate) ?? null;
    if (dayButtonRef) {
      (dayButtonRef as MutableRefObject<HTMLButtonElement | null>).current = node;
    }
  }, [dayButtonRef, focusedDate]);

  // Keyboard-driven focus movement within the day grid (unchanged from before subviews existed).
  useEffect(() => {
    const node = dayRefs.current.get(focusedDate);
    if (node && gridRef.current?.contains(document.activeElement)) {
      node.focus();
    }
  }, [focusedDate, currentMonth]);

  // Keyboard-driven focus movement within the month grid.
  useEffect(() => {
    if (subview !== "month") return;
    const node = monthRefs.current.get(focusedMonthIndex + 1);
    if (node && gridRef.current?.contains(document.activeElement)) {
      node.focus();
    }
  }, [subview, focusedMonthIndex]);

  // Keyboard-driven focus movement within the year grid.
  useEffect(() => {
    if (subview !== "year") return;
    const node = yearRefs.current.get(yearPageStart + focusedYearIndex);
    if (node && gridRef.current?.contains(document.activeElement)) {
      node.focus();
    }
  }, [subview, focusedYearIndex, yearPageStart]);

  // Move DOM focus onto the newly-revealed grid whenever we drill up or down —
  // the cell that triggered the transition unmounts, so focus can't simply follow it.
  useEffect(() => {
    const previous = previousSubviewRef.current;
    previousSubviewRef.current = subview;
    if (previous === subview) return;

    if (subview === "day") {
      dayRefs.current.get(focusedDate)?.focus();
    } else if (subview === "month") {
      monthRefs.current.get(focusedMonthIndex + 1)?.focus();
    } else {
      yearRefs.current.get(yearPageStart + focusedYearIndex)?.focus();
    }
    // Only the subview transition itself should trigger this — the other
    // focus-restoration effects above already handle in-subview movement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subview]);

  function goToMonth(delta: number) {
    setCurrentMonth(addMonths(currentMonth, delta));
  }

  const monthGridCells = useMemo(
    () => chunkIntoRows(Array.from({ length: 12 }, (_, index) => index + 1), PERIOD_GRID_COLUMNS),
    [],
  );

  const yearGridCells = useMemo(
    () =>
      chunkIntoRows(
        Array.from({ length: YEAR_GRID_PAGE_SIZE }, (_, index) => yearPageStart + index),
        PERIOD_GRID_COLUMNS,
      ),
    [yearPageStart],
  );

  const isRangeComplete =
    mode === "range" && rangeValue.start !== undefined && rangeValue.end !== undefined;

  // The provisional (uncommitted) span shown while a range's start is set but
  // its end isn't yet — driven by mouse hover, falling back to the keyboard's
  // focused cell so arrow-key navigation gets the same live preview. Mirrors
  // the swap-for-chronological-order decision in handleRangeSelect: hovering
  // an earlier date previews the range as it would actually be committed.
  const rangePreviewSpan = useMemo(() => {
    if (mode !== "range" || rangeValue.start === undefined || rangeValue.end !== undefined) {
      return null;
    }
    const anchor = hoveredDate ?? focusedDate;
    if (!anchor || anchor === rangeValue.start) return null;
    const backwards = compareCalendarDates(rangeValue.start, anchor) > 0;
    return {
      start: backwards ? anchor : rangeValue.start,
      end: backwards ? rangeValue.start : anchor,
      anchor,
    };
  }, [mode, rangeValue.start, rangeValue.end, hoveredDate, focusedDate]);

  const rangeAnnouncement = useMemo(() => {
    if (mode !== "range") return "";
    if (rangeValue.start && rangeValue.end) {
      return `Date range selected: ${formatAccessibleDateLabel(rangeValue.start, locale)} to ${formatAccessibleDateLabel(rangeValue.end, locale)}.`;
    }
    if (rangeValue.start) {
      return `Start date selected, ${formatAccessibleDateLabel(rangeValue.start, locale)}. Choose an end date.`;
    }
    return "";
  }, [mode, rangeValue.start, rangeValue.end, locale]);

  return (
    <div className={cn(styles.root, className)}>
      {mode === "range" ? (
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {rangeAnnouncement}
        </div>
      ) : null}

      {subview === "day" ? (
        <div className={styles.header}>
          <button
            type="button"
            className={styles.navButton}
            aria-label="Previous month"
            onClick={() => goToMonth(-1)}
          >
            <CaretLeft size={16} aria-hidden="true" />
          </button>
          <h2 id={labelId} className={styles.monthLabel}>
            <button type="button" className={styles.headerButton} onClick={handleDrillUpToMonth}>
              {monthLabel}
            </button>
          </h2>
          <button
            type="button"
            className={styles.navButton}
            aria-label="Next month"
            onClick={() => goToMonth(1)}
          >
            <CaretRight size={16} aria-hidden="true" />
          </button>
        </div>
      ) : null}

      {subview === "month" ? (
        <div className={cn(styles.header, styles.headerCentered)}>
          <h2 id={labelId} className={styles.monthLabel}>
            <button type="button" className={styles.headerButton} onClick={handleDrillUpToYear}>
              {currentMonth.year}
            </button>
          </h2>
        </div>
      ) : null}

      {subview === "year" ? (
        <div className={styles.header}>
          <button
            type="button"
            className={styles.navButton}
            aria-label="Previous 12 years"
            disabled={!canGoPrevYearPage}
            onClick={() => goToYearPage(-1)}
          >
            <CaretLeft size={16} aria-hidden="true" />
          </button>
          <h2 id={labelId} className={styles.monthLabel}>
            {yearPageStart}–{yearPageStart + YEAR_GRID_PAGE_SIZE - 1}
          </h2>
          <button
            type="button"
            className={styles.navButton}
            aria-label="Next 12 years"
            disabled={!canGoNextYearPage}
            onClick={() => goToYearPage(1)}
          >
            <CaretRight size={16} aria-hidden="true" />
          </button>
        </div>
      ) : null}

      {subview === "day" ? (
        <div
          ref={gridRef}
          role="grid"
          aria-labelledby={ariaLabel ? undefined : labelId}
          aria-label={ariaLabel}
          className={styles.grid}
          onKeyDown={handleKeyDown}
        >
          <div role="row" className={styles.weekdayRow}>
            {weekdayLabels.map((label) => (
              <div key={label} role="columnheader" className={styles.weekday}>
                {label}
              </div>
            ))}
          </div>

          {weeks.map((week) => (
            <div role="row" key={`${monthKey(currentMonth)}-${week[0]?.date}`} className={styles.weekRow}>
              {week.map((cell) => {
                const rangeStartHere = mode === "range" && rangeValue.start === cell.date;
                const rangeEndHere = isRangeComplete && rangeValue.end === cell.date;
                const rangeMiddleHere =
                  isRangeComplete &&
                  !rangeStartHere &&
                  !rangeEndHere &&
                  isDateWithinRange(cell.date, rangeValue.start, rangeValue.end);
                const previewEndHere =
                  rangePreviewSpan !== null && cell.date === rangePreviewSpan.anchor;
                const previewMiddleHere =
                  rangePreviewSpan !== null &&
                  cell.date !== rangeValue.start &&
                  !previewEndHere &&
                  isDateWithinRange(cell.date, rangePreviewSpan.start, rangePreviewSpan.end);
                const isRangeSelectedHere = rangeStartHere || rangeEndHere || rangeMiddleHere;

                return (
                  <div
                    role="gridcell"
                    key={cell.date}
                    className={styles.cell}
                    aria-selected={
                      (mode === "range" ? isRangeSelectedHere : selectedValue === cell.date) ||
                      undefined
                    }
                  >
                    <CalendarDay
                      ref={(node) => {
                        if (node) dayRefs.current.set(cell.date, node);
                        else dayRefs.current.delete(cell.date);
                      }}
                      className={styles.dayInGrid}
                      date={cell.date}
                      locale={locale}
                      selected={mode === "single" && selectedValue === cell.date}
                      today={today === cell.date}
                      outsideMonth={cell.outsideMonth}
                      disabled={isDisabled(cell.date)}
                      rangeStart={rangeStartHere}
                      rangeEnd={rangeEndHere}
                      rangeMiddle={rangeMiddleHere}
                      rangePreviewEnd={previewEndHere}
                      rangePreviewMiddle={previewMiddleHere}
                      tabIndex={focusedDate === cell.date ? 0 : -1}
                      onFocusDate={handleFocusDate}
                      onHoverDate={mode === "range" ? setHoveredDate : undefined}
                      onDateSelect={mode === "range" ? handleRangeSelect : handleSelect}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ) : null}

      {subview === "month" ? (
        <div
          ref={gridRef}
          role="grid"
          aria-label={`Choose month, ${currentMonth.year}`}
          className={styles.periodGrid}
          onKeyDown={handleMonthKeyDown}
        >
          {monthGridCells.map((row) => (
            <div role="row" key={`month-row-${row[0]}`} className={styles.periodRow}>
              {row.map((month) => {
                const index = month - 1;
                const disabled = isMonthFullyDisabled(currentMonth.year, month, isDisabled);
                const selected =
                  selectedParts !== null &&
                  selectedParts.year === currentMonth.year &&
                  selectedParts.month === month;
                const isCurrentMonth =
                  todayParts.year === currentMonth.year && todayParts.month === month;

                return (
                  <div
                    role="gridcell"
                    key={month}
                    className={styles.periodCell}
                    aria-selected={selected || undefined}
                  >
                    <CalendarMonthCell
                      ref={(node) => {
                        if (node) monthRefs.current.set(month, node);
                        else monthRefs.current.delete(month);
                      }}
                      month={month}
                      label={formatMonthNameLabel(month, locale)}
                      selected={selected}
                      today={isCurrentMonth}
                      disabled={disabled}
                      tabIndex={focusedMonthIndex === index ? 0 : -1}
                      onMonthSelect={handleSelectMonth}
                      onFocusMonth={(m) => setFocusedMonthIndex(m - 1)}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ) : null}

      {subview === "year" ? (
        <div
          ref={gridRef}
          role="grid"
          aria-label="Choose year"
          className={styles.periodGrid}
          onKeyDown={handleYearKeyDown}
        >
          {yearGridCells.map((row) => (
            <div role="row" key={`year-row-${row[0]}`} className={styles.periodRow}>
              {row.map((year) => {
                const index = year - yearPageStart;
                const disabled = isYearFullyDisabled(year, isDisabled);
                const selected = selectedParts !== null && selectedParts.year === year;
                const isCurrentYear = todayParts.year === year;

                return (
                  <div
                    role="gridcell"
                    key={year}
                    className={styles.periodCell}
                    aria-selected={selected || undefined}
                  >
                    <CalendarYearCell
                      ref={(node) => {
                        if (node) yearRefs.current.set(year, node);
                        else yearRefs.current.delete(year);
                      }}
                      year={year}
                      selected={selected}
                      today={isCurrentYear}
                      disabled={disabled}
                      tabIndex={focusedYearIndex === index ? 0 : -1}
                      onYearSelect={handleSelectYear}
                      onFocusYear={(y) => setFocusedYearIndex(y - yearPageStart)}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
