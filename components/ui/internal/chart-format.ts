/**
 * Chart formatting contract (CH-2). Internal — not public API; the public
 * surface is the `valueFormat` / `labelFormat` props and the series `format`.
 *
 * Deliberately small: a function escape hatch plus a few typed specs. Number
 * formatting defaults to the fixed `en-US` locale (overridable per spec) so
 * server and client render identical text; there is no i18n framework here.
 * Date labels are formatted in UTC from already-normalized ISO strings
 * (`YYYY`, `YYYY-MM`, `YYYY-MM-DD`) and never read the runtime time zone.
 */
type NumberSpec = { locale?: string; maximumFractionDigits?: number };

export type ChartValueFormat =
  | ((value: number) => string)
  | ({ kind: "number" } & NumberSpec)
  | ({ kind: "compact" } & NumberSpec)
  /** The value is a fraction: 0.25 formats as "25%". */
  | ({ kind: "percent" } & NumberSpec)
  | ({ kind: "currency"; currency: string } & NumberSpec);

export type ChartLabelFormat =
  | ((label: string) => string)
  | { kind: "date"; granularity: "day" | "month" | "year"; locale?: string };

const DEFAULT_LOCALE = "en-US";

export function createValueFormatter(format?: ChartValueFormat): (value: number) => string {
  if (!format) return (value) => String(value);
  if (typeof format === "function") return format;

  const locale = format.locale ?? DEFAULT_LOCALE;
  const digits = format.maximumFractionDigits;
  let formatter: Intl.NumberFormat;
  switch (format.kind) {
    case "number":
      formatter = new Intl.NumberFormat(locale, { maximumFractionDigits: digits });
      break;
    case "compact":
      formatter = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: digits ?? 1 });
      break;
    case "percent":
      formatter = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: digits ?? 0 });
      break;
    case "currency":
      formatter = new Intl.NumberFormat(locale, {
        style: "currency",
        currency: format.currency,
        maximumFractionDigits: digits,
      });
      break;
  }
  return (value) => formatter.format(value);
}

const DATE_OPTIONS: Record<"day" | "month" | "year", Intl.DateTimeFormatOptions> = {
  day: { month: "short", day: "numeric" },
  month: { month: "short", year: "numeric" },
  year: { year: "numeric" },
};

function parseIsoDate(label: string): Date | undefined {
  const match = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/.exec(label.trim());
  if (!match) return undefined;
  const year = Number(match[1]);
  const month = match[2] ? Number(match[2]) - 1 : 0;
  const day = match[3] ? Number(match[3]) : 1;
  const date = new Date(Date.UTC(year, month, day));
  const valid = date.getUTCFullYear() === year && date.getUTCMonth() === month && date.getUTCDate() === day;
  return valid ? date : undefined;
}

export function createLabelFormatter(format?: ChartLabelFormat): (label: string) => string {
  if (!format) return (label) => label;
  if (typeof format === "function") return format;

  const formatter = new Intl.DateTimeFormat(format.locale ?? DEFAULT_LOCALE, {
    ...DATE_OPTIONS[format.granularity],
    timeZone: "UTC",
  });
  return (label) => {
    const date = parseIsoDate(label);
    // Not a normalized date: show the original label rather than guessing.
    return date ? formatter.format(date) : label;
  };
}
