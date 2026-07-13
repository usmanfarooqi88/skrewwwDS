import {
  addDays,
  calendarDateFromParts,
  daysInMonth,
  formatCalendarDate,
  type CalendarDateString,
  type CalendarMonthParts,
} from "@/components/ui/internal/calendar-date";

/** Column count for the 12-cell month and year drill-up grids. */
export const PERIOD_GRID_COLUMNS = 4;

/** Number of years shown per page in the year drill-up grid. */
export const YEAR_GRID_PAGE_SIZE = 12;

export type CalendarMonthCell = {
  date: CalendarDateString;
  outsideMonth: boolean;
};

export function getWeekdayIndex(date: CalendarDateString): number {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).getDay();
}

export function startOfWeekDate(
  date: CalendarDateString,
  weekStartsOn: 0 | 1,
): CalendarDateString {
  const weekday = getWeekdayIndex(date);
  const diff = (weekday - weekStartsOn + 7) % 7;
  return addDays(date, -diff);
}

export function endOfWeekDate(date: CalendarDateString, weekStartsOn: 0 | 1): CalendarDateString {
  const start = startOfWeekDate(date, weekStartsOn);
  return addDays(start, 6);
}

export function generateMonthGrid(
  month: CalendarMonthParts,
  options?: {
    weekStartsOn?: 0 | 1;
    weeks?: number;
  },
): CalendarMonthCell[] {
  const weekStartsOn = options?.weekStartsOn ?? 1;
  const weeks = options?.weeks ?? 6;
  const firstOfMonth = calendarDateFromParts({ ...month, day: 1 });
  const gridStart = startOfWeekDate(firstOfMonth, weekStartsOn);
  const cells: CalendarMonthCell[] = [];

  for (let index = 0; index < weeks * 7; index += 1) {
    const date = addDays(gridStart, index);
    const [year, monthNumber] = date.split("-").map(Number);
    cells.push({
      date,
      outsideMonth: year !== month.year || monthNumber !== month.month,
    });
  }

  return cells;
}

export function monthFromDate(date: CalendarDateString): CalendarMonthParts {
  const [year, month] = date.split("-").map(Number);
  return { year, month };
}

export function firstDateInMonth(month: CalendarMonthParts): CalendarDateString {
  return formatCalendarDate({ year: month.year, month: month.month, day: 1 });
}

export function findNextEnabledDate(
  start: CalendarDateString,
  direction: 1 | -1,
  isDisabled: (date: CalendarDateString) => boolean,
  maxSteps = 366,
): CalendarDateString | null {
  let current = start;
  for (let step = 0; step < maxSteps; step += 1) {
    if (!isDisabled(current)) return current;
    current = addDays(current, direction);
  }
  return null;
}

/** A month is disabled for drill-up purposes only when every day inside it is disabled. */
export function isMonthFullyDisabled(
  year: number,
  month: number,
  isDateDisabled: (date: CalendarDateString) => boolean,
): boolean {
  const total = daysInMonth(year, month);
  for (let day = 1; day <= total; day += 1) {
    if (!isDateDisabled(formatCalendarDate({ year, month, day }))) return false;
  }
  return true;
}

/** A year is disabled for drill-up purposes only when every month inside it is fully disabled. */
export function isYearFullyDisabled(
  year: number,
  isDateDisabled: (date: CalendarDateString) => boolean,
): boolean {
  for (let month = 1; month <= 12; month += 1) {
    if (!isMonthFullyDisabled(year, month, isDateDisabled)) return false;
  }
  return true;
}

/** Deterministic page anchor: the year page containing `year`. */
export function getYearPageStart(year: number, pageSize: number = YEAR_GRID_PAGE_SIZE): number {
  return Math.floor(year / pageSize) * pageSize;
}

/** Whether at least one year in the page starting at `pageStart` can be selected. */
export function pageHasSelectableYear(
  pageStart: number,
  pageSize: number,
  isYearDisabled: (year: number) => boolean,
): boolean {
  for (let index = 0; index < pageSize; index += 1) {
    if (!isYearDisabled(pageStart + index)) return true;
  }
  return false;
}

/**
 * Resolve the nearest enabled cell index for a flat 12-cell month/year grid,
 * scanning forward from `preferredIndex` and wrapping once within [0, itemCount).
 * Mirrors the forward-scan fallback CalendarGrid uses for initial day focus.
 */
export function resolveNearestEnabledIndex(
  preferredIndex: number,
  itemCount: number,
  isDisabled: (index: number) => boolean,
): number {
  if (!isDisabled(preferredIndex)) return preferredIndex;
  for (let index = preferredIndex + 1; index < itemCount; index += 1) {
    if (!isDisabled(index)) return index;
  }
  for (let index = 0; index < preferredIndex; index += 1) {
    if (!isDisabled(index)) return index;
  }
  return preferredIndex;
}
