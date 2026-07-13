/** Date-only value in ISO YYYY-MM-DD form — never includes time or time zone. */
export type CalendarDateString = string;

export type CalendarDateParts = {
  year: number;
  month: number;
  day: number;
};

export type CalendarMonthParts = {
  year: number;
  month: number;
};

/** Range mode's value shape. Either end may be unset while a selection is in progress. */
export type CalendarDateRange = {
  start: CalendarDateString | undefined;
  end: CalendarDateString | undefined;
};

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Default display/accessibility locale for the first Calendar batch. */
export const CALENDAR_DEFAULT_LOCALE = "en-GB";

/** Initial week-start policy: Monday (ISO). */
export const CALENDAR_DEFAULT_WEEK_STARTS_ON = 1 as const;

export type CalendarFormatterOverrides = {
  formatMonth?: (month: CalendarMonthParts) => string;
  formatWeekday?: (dayIndex: number) => string;
  formatDate?: (date: CalendarDateString) => string;
  parseDate?: (text: string) => CalendarDateString | null;
};

const warnedInvalidLocales = new Set<string>();

/** Resolve a requested locale, falling back to en-GB when Intl rejects it. */
export function resolveCalendarLocale(locale?: string): string {
  const requested = locale ?? CALENDAR_DEFAULT_LOCALE;
  if (requested === CALENDAR_DEFAULT_LOCALE) return CALENDAR_DEFAULT_LOCALE;

  try {
    if (typeof Intl.DateTimeFormat.supportedLocalesOf === "function") {
      const supported = Intl.DateTimeFormat.supportedLocalesOf([requested]);
      if (supported.length === 0) throw new RangeError(`Unsupported locale: ${requested}`);
      return supported[0] ?? CALENDAR_DEFAULT_LOCALE;
    }
    new Intl.DateTimeFormat(requested).format(new Date());
    return requested;
  } catch {
    if (process.env.NODE_ENV !== "production" && !warnedInvalidLocales.has(requested)) {
      warnedInvalidLocales.add(requested);
      console.warn(
        `[calendar] Invalid locale "${requested}", falling back to "${CALENDAR_DEFAULT_LOCALE}".`,
      );
    }
    return CALENDAR_DEFAULT_LOCALE;
  }
}

/** Dev-only guard when only one of formatDate / parseDate is supplied. */
export function warnIfFormatterPairIncomplete(overrides: CalendarFormatterOverrides): void {
  if (process.env.NODE_ENV === "production") return;
  const hasFormat = Boolean(overrides.formatDate);
  const hasParse = Boolean(overrides.parseDate);
  if (hasFormat !== hasParse) {
    console.warn(
      "[calendar] formatDate and parseDate must both be provided when overriding date text formatting.",
    );
  }
}

function createDateTimeFormat(
  locale: string,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  const resolved = resolveCalendarLocale(locale);
  return new Intl.DateTimeFormat(resolved, options);
}

export function isValidCalendarDateParts(parts: CalendarDateParts): boolean {
  if (!Number.isInteger(parts.year) || parts.year < 1) return false;
  if (parts.month < 1 || parts.month > 12) return false;
  if (parts.day < 1) return false;
  return parts.day <= daysInMonth(parts.year, parts.month);
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function parseCalendarDate(value: string): CalendarDateParts | null {
  const match = ISO_DATE_RE.exec(value);
  if (!match) return null;
  const parts = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
  return isValidCalendarDateParts(parts) ? parts : null;
}

export function formatCalendarDate(parts: CalendarDateParts): CalendarDateString {
  return `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

export function compareCalendarDates(a: CalendarDateString, b: CalendarDateString): number {
  return a.localeCompare(b);
}

export function calendarDateFromParts(parts: CalendarDateParts): CalendarDateString {
  return formatCalendarDate(parts);
}

export function getCalendarDateParts(date: CalendarDateString): CalendarDateParts {
  const parsed = parseCalendarDate(date);
  if (!parsed) {
    throw new Error(`Invalid calendar date: ${date}`);
  }
  return parsed;
}

/** Local calendar arithmetic — avoids UTC conversion when adding days. */
export function addDays(date: CalendarDateString, delta: number): CalendarDateString {
  const parts = getCalendarDateParts(date);
  const local = new Date(parts.year, parts.month - 1, parts.day);
  local.setDate(local.getDate() + delta);
  return formatCalendarDate({
    year: local.getFullYear(),
    month: local.getMonth() + 1,
    day: local.getDate(),
  });
}

export function addMonths(month: CalendarMonthParts, delta: number): CalendarMonthParts {
  const index = month.year * 12 + (month.month - 1) + delta;
  return {
    year: Math.floor(index / 12),
    month: (index % 12) + 1,
  };
}

export function getTodayCalendarDate(now = new Date()): CalendarDateString {
  return formatCalendarDate({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  });
}

export function getMonthFromDate(date: CalendarDateString): CalendarMonthParts {
  const parts = getCalendarDateParts(date);
  return { year: parts.year, month: parts.month };
}

export function formatMonthLabel(
  month: CalendarMonthParts,
  locale: string = CALENDAR_DEFAULT_LOCALE,
): string {
  return createDateTimeFormat(locale, { month: "long", year: "numeric" }).format(
    new Date(month.year, month.month - 1, 1),
  );
}

/** Month name only (no year) — used to label cells in the month drill-up grid. */
export function formatMonthNameLabel(
  month: number,
  locale: string = CALENDAR_DEFAULT_LOCALE,
): string {
  return createDateTimeFormat(locale, { month: "long" }).format(new Date(2021, month - 1, 1));
}

export function formatDisplayDate(
  date: CalendarDateString,
  locale: string = CALENDAR_DEFAULT_LOCALE,
): string {
  const parts = getCalendarDateParts(date);
  return createDateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(parts.year, parts.month - 1, parts.day));
}

/** Short month abbreviations keyed lowercase — built from the same Intl locale as formatDisplayDate. */
function buildDisplayMonthAbbrevMap(locale: string): Map<string, number> {
  const resolved = resolveCalendarLocale(locale);
  const map = new Map<string, number>();

  function registerAbbrev(raw: string, month: number) {
    const lower = raw.toLowerCase();
    map.set(lower, month);
    map.set(lower.replace(/\.$/, ""), month);
  }

  for (let month = 1; month <= 12; month += 1) {
    registerAbbrev(
      new Intl.DateTimeFormat(resolved, { month: "short" }).format(new Date(2021, month - 1, 1)),
      month,
    );

    // Month token inside a full date string can differ from standalone month: "short"
    // (e.g. de-DE uses "Juli" in dates but "Jul" standalone).
    const inContext = createDateTimeFormat(resolved, {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(2021, month - 1, 15));
    const yearMatch = /(\d{4})\s*$/.exec(inContext);
    if (yearMatch) {
      const prefix = inContext.slice(0, yearMatch.index).trim();
      const dayMatch = /^(\d{1,2})/.exec(prefix);
      if (dayMatch) {
        const rest = prefix.slice(dayMatch[0].length);
        const contextMonth = rest.match(/[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ.]*/)?.[0];
        if (contextMonth) registerAbbrev(contextMonth, month);
      }
    }
  }
  return map;
}

const displayMonthAbbrevCache = new Map<string, Map<string, number>>();

function getDisplayMonthAbbrevMap(locale: string): Map<string, number> {
  const resolved = resolveCalendarLocale(locale);
  const cached = displayMonthAbbrevCache.get(resolved);
  if (cached) return cached;
  const built = buildDisplayMonthAbbrevMap(resolved);
  displayMonthAbbrevCache.set(resolved, built);
  return built;
}

function normalizeMonthToken(token: string): string {
  return token.toLowerCase().replace(/\.$/, "").trim();
}

function lookupDisplayMonth(monthMap: Map<string, number>, token: string): number | undefined {
  return monthMap.get(token.toLowerCase()) ?? monthMap.get(normalizeMonthToken(token));
}

/**
 * Parse a display-formatted date string back to ISO YYYY-MM-DD.
 * Accepts the D MMM YYYY pattern produced by formatDisplayDate for the given locale.
 * Does not accept numeric-only regional formats (DD/MM, MM/DD, etc.).
 */
export function parseDisplayDate(
  text: string,
  locale: string = CALENDAR_DEFAULT_LOCALE,
): CalendarDateString | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const resolvedLocale = resolveCalendarLocale(locale);
  const yearMatch = /(\d{4})\s*$/.exec(trimmed);
  if (!yearMatch) return null;

  const year = Number(yearMatch[1]);
  const prefix = trimmed.slice(0, yearMatch.index).trim();
  const dayMatch = /^(\d{1,2})/.exec(prefix);
  if (!dayMatch) return null;

  const day = Number(dayMatch[1]);
  const rest = prefix.slice(dayMatch[0].length);
  const monthMatch = rest.match(/[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ.]*/);
  const monthRaw = monthMatch?.[0]?.trim();
  if (!monthRaw) return null;

  const month = lookupDisplayMonth(getDisplayMonthAbbrevMap(resolvedLocale), monthRaw);
  if (!month) return null;

  const parts = { year, month, day };
  return isValidCalendarDateParts(parts) ? formatCalendarDate(parts) : null;
}

export function formatAccessibleDateLabel(
  date: CalendarDateString,
  locale: string = CALENDAR_DEFAULT_LOCALE,
): string {
  const parts = getCalendarDateParts(date);
  return createDateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(parts.year, parts.month - 1, parts.day));
}

export function formatWeekdayLabel(
  weekdayIndex: number,
  locale: string = CALENDAR_DEFAULT_LOCALE,
  weekStartsOn: 0 | 1 = CALENDAR_DEFAULT_WEEK_STARTS_ON,
): string {
  // Jan 3 2021 is a Sunday — anchor for weekday 0..6.
  const weekday = (weekStartsOn + weekdayIndex) % 7;
  const date = new Date(2021, 0, 3 + weekday);
  return createDateTimeFormat(locale, { weekday: "short" }).format(date);
}

export function getDayNumber(date: CalendarDateString): number {
  return getCalendarDateParts(date).day;
}

export function isSameCalendarMonth(
  date: CalendarDateString,
  month: CalendarMonthParts,
): boolean {
  const parts = getCalendarDateParts(date);
  return parts.year === month.year && parts.month === month.month;
}

export function clampDateToMonth(
  date: CalendarDateString,
  month: CalendarMonthParts,
): CalendarDateString {
  const parts = getCalendarDateParts(date);
  const day = Math.min(parts.day, daysInMonth(month.year, month.month));
  return formatCalendarDate({ year: month.year, month: month.month, day });
}

/** Whether `date` falls within [min, max], inclusive. Either bound is optional. */
export function isDateWithinRange(
  date: CalendarDateString,
  min?: CalendarDateString,
  max?: CalendarDateString,
): boolean {
  if (min && compareCalendarDates(date, min) < 0) return false;
  if (max && compareCalendarDates(date, max) > 0) return false;
  return true;
}
