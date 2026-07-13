import { describe, expect, it, vi } from "vitest";
import {
  addDays,
  addMonths,
  formatCalendarDate,
  formatDisplayDate,
  getTodayCalendarDate,
  isDateWithinRange,
  parseCalendarDate,
  parseDisplayDate,
  resolveCalendarLocale,
} from "@/components/ui/internal/calendar-date";
import { generateMonthGrid, startOfWeekDate } from "@/components/ui/internal/calendar-math";

describe("calendar-date utilities", () => {
  it("parses valid YYYY-MM-DD values", () => {
    expect(parseCalendarDate("2026-07-11")).toEqual({ year: 2026, month: 7, day: 11 });
  });

  it("rejects invalid dates", () => {
    expect(parseCalendarDate("2026-02-30")).toBeNull();
    expect(parseCalendarDate("2026-13-01")).toBeNull();
    expect(parseCalendarDate("not-a-date")).toBeNull();
  });

  it("handles leap years", () => {
    expect(parseCalendarDate("2024-02-29")).toEqual({ year: 2024, month: 2, day: 29 });
    expect(parseCalendarDate("2023-02-29")).toBeNull();
  });

  it("adds days without UTC shifting", () => {
    expect(addDays("2026-07-11", 1)).toBe("2026-07-12");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("adds months predictably", () => {
    expect(addMonths({ year: 2026, month: 1 }, 1)).toEqual({ year: 2026, month: 2 });
    expect(addMonths({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 });
  });

  it("formats display dates using local calendar parts", () => {
    expect(formatDisplayDate("2026-07-11")).toContain("2026");
  });

  it("round-trips display dates through parseDisplayDate", () => {
    expect(parseDisplayDate(formatDisplayDate("2026-07-11"))).toBe("2026-07-11");
    expect(parseDisplayDate(formatDisplayDate("2026-09-15"))).toBe("2026-09-15");
  });

  it("parses valid D MMM YYYY display text", () => {
    expect(parseDisplayDate("11 Jul 2026")).toBe("2026-07-11");
    expect(parseDisplayDate("15 Sept 2026")).toBe("2026-09-15");
  });

  it("rejects malformed display text", () => {
    expect(parseDisplayDate("11/07/2026")).toBeNull();
    expect(parseDisplayDate("07-11-2026")).toBeNull();
    expect(parseDisplayDate("not a date")).toBeNull();
    expect(parseDisplayDate("32 Jul 2026")).toBeNull();
    expect(parseDisplayDate("11 Foo 2026")).toBeNull();
  });

  it("rejects leap-year invalid display dates", () => {
    expect(parseDisplayDate("29 Feb 2023")).toBeNull();
    expect(parseDisplayDate("29 Feb 2024")).toBe("2024-02-29");
  });

  it("round-trips display dates for a non-default locale", () => {
    const formatted = formatDisplayDate("2026-07-11", "de-DE");
    expect(parseDisplayDate(formatted, "de-DE")).toBe("2026-07-11");
    expect(formatDisplayDate("2026-07-11", "de-DE")).toBe(formatted);
  });

  it("round-trips display dates for fr-FR month abbreviations with trailing dots", () => {
    const formatted = formatDisplayDate("2026-07-11", "fr-FR");
    expect(parseDisplayDate(formatted, "fr-FR")).toBe("2026-07-11");
  });

  it("falls back to en-GB for invalid locale strings", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(resolveCalendarLocale("not-a-real-locale-xxx")).toBe("en-GB");
    expect(formatDisplayDate("2026-07-11", "not-a-real-locale-xxx")).toBe(
      formatDisplayDate("2026-07-11"),
    );
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("uses local today without ISO UTC conversion", () => {
    const today = getTodayCalendarDate();
    expect(parseCalendarDate(today)).not.toBeNull();
  });

  it("generates a six-week grid with outside-month cells", () => {
    const cells = generateMonthGrid({ year: 2026, month: 7 }, { weekStartsOn: 1 });
    expect(cells).toHaveLength(42);
    expect(cells.some((cell) => cell.outsideMonth)).toBe(true);
  });

  it("calculates week start on Monday policy", () => {
    expect(startOfWeekDate("2026-07-11", 1)).toBe("2026-07-06");
  });

  it("round-trips formatted calendar dates", () => {
    const formatted = formatCalendarDate({ year: 2026, month: 7, day: 11 });
    expect(formatted).toBe("2026-07-11");
  });

  it("checks date range membership with both bounds", () => {
    expect(isDateWithinRange("2026-07-15", "2026-07-01", "2026-07-31")).toBe(true);
    expect(isDateWithinRange("2026-06-30", "2026-07-01", "2026-07-31")).toBe(false);
    expect(isDateWithinRange("2026-08-01", "2026-07-01", "2026-07-31")).toBe(false);
  });

  it("checks date range membership with only one bound set", () => {
    expect(isDateWithinRange("2026-07-01", "2026-06-01")).toBe(true);
    expect(isDateWithinRange("2026-05-01", "2026-06-01")).toBe(false);
    expect(isDateWithinRange("2099-01-01", undefined, "2026-12-31")).toBe(false);
  });

  it("treats an unbounded range as always within range", () => {
    expect(isDateWithinRange("1900-01-01")).toBe(true);
    expect(isDateWithinRange("2200-01-01")).toBe(true);
  });

  it("includes the bounds themselves (inclusive range)", () => {
    expect(isDateWithinRange("2026-07-01", "2026-07-01", "2026-07-31")).toBe(true);
    expect(isDateWithinRange("2026-07-31", "2026-07-01", "2026-07-31")).toBe(true);
  });
});

describe("DST boundaries", () => {
  it("adds days across a DST transition using local dates", () => {
    const original = Intl.DateTimeFormat().resolvedOptions().timeZone;
    try {
      // US spring-forward week — local date math should remain stable.
      process.env.TZ = "America/New_York";
      expect(addDays("2026-03-07", 1)).toBe("2026-03-08");
      expect(addDays("2026-03-08", 1)).toBe("2026-03-09");
    } finally {
      process.env.TZ = original;
    }
  });
});
