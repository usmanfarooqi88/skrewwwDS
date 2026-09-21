import { describe, expect, it } from "vitest";
import { createLabelFormatter, createValueFormatter } from "@/components/ui/internal/chart-format";

describe("createValueFormatter", () => {
  it("defaults to the raw number so existing charts render unchanged", () => {
    const format = createValueFormatter();
    expect(format(58)).toBe("58");
    expect(format(1234.5)).toBe("1234.5");
    expect(format(-3)).toBe("-3");
  });

  it("formats numbers, compact numbers, percentages and currency with a fixed en-US default locale", () => {
    expect(createValueFormatter({ kind: "number" })(1234567.891)).toBe("1,234,567.891");
    expect(createValueFormatter({ kind: "number", maximumFractionDigits: 1 })(1234.56)).toBe("1,234.6");
    expect(createValueFormatter({ kind: "compact" })(1_250_000)).toBe("1.3M");
    expect(createValueFormatter({ kind: "compact" })(950)).toBe("950");
    expect(createValueFormatter({ kind: "percent" })(0.256)).toBe("26%");
    expect(createValueFormatter({ kind: "percent", maximumFractionDigits: 1 })(0.256)).toBe("25.6%");
    expect(createValueFormatter({ kind: "currency", currency: "USD" })(1234.5)).toBe("$1,234.50");
    expect(createValueFormatter({ kind: "currency", currency: "USD", maximumFractionDigits: 0 })(1234.5)).toBe("$1,235");
  });

  it("does not depend on the runtime locale, but honors an explicit locale", () => {
    expect(createValueFormatter({ kind: "number" })(1234.5)).toBe("1,234.5");
    expect(createValueFormatter({ kind: "number", locale: "de-DE" })(1234.5)).toBe("1.234,5");
  });

  it("uses a caller-supplied function as an escape hatch", () => {
    expect(createValueFormatter((value) => `${value} pts`)(7)).toBe("7 pts");
  });
});

describe("createLabelFormatter", () => {
  it("returns labels unchanged by default", () => {
    expect(createLabelFormatter()("Jan")).toBe("Jan");
  });

  it("formats normalized ISO dates in UTC at day, month and year granularity", () => {
    expect(createLabelFormatter({ kind: "date", granularity: "day" })("2026-03-05")).toBe("Mar 5");
    expect(createLabelFormatter({ kind: "date", granularity: "month" })("2026-03")).toBe("Mar 2026");
    expect(createLabelFormatter({ kind: "date", granularity: "month" })("2026-03-31")).toBe("Mar 2026");
    expect(createLabelFormatter({ kind: "date", granularity: "year" })("2026")).toBe("2026");
  });

  it("leaves labels that are not normalized dates exactly as given rather than guessing", () => {
    const format = createLabelFormatter({ kind: "date", granularity: "day" });
    expect(format("Q1")).toBe("Q1");
    expect(format("2026-13-40")).toBe("2026-13-40");
    expect(format("March 5")).toBe("March 5");
  });

  it("uses a caller-supplied function as an escape hatch", () => {
    expect(createLabelFormatter((label) => label.toUpperCase())("jan")).toBe("JAN");
  });
});
