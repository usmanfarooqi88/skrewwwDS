import { describe, expect, it } from "vitest";
import {
  buildChartTable,
  hasNegativeValue,
  resolveChartSeries,
  toPlotData,
  type ChartRow,
} from "@/components/ui/internal/chart-data";

describe("resolveChartSeries", () => {
  it("defaults to a single `value` series in the first color slot", () => {
    const [only, ...rest] = resolveChartSeries();
    expect(rest).toEqual([]);
    expect(only).toMatchObject({ key: "value", label: "Value", color: "series-1", colorVar: "var(--chart-series-1)" });
    expect(resolveChartSeries([])).toHaveLength(1);
  });

  it("assigns color slots by position, honors an explicit slot, and wraps deterministically after four", () => {
    const resolved = resolveChartSeries([
      { key: "a", label: "A" },
      { key: "b", label: "B", color: "series-4" },
      { key: "c", label: "C" },
      { key: "d", label: "D" },
      { key: "e", label: "E" },
    ]);
    expect(resolved.map((entry) => entry.color)).toEqual(["series-1", "series-4", "series-3", "series-4", "series-1"]);
    expect(resolved[1].colorVar).toBe("var(--chart-series-4)");
  });

  it('rejects the reserved key "label" and duplicate keys instead of silently mis-plotting', () => {
    expect(() => resolveChartSeries([{ key: "label", label: "Bad" }])).toThrow(/reserved/);
    expect(() =>
      resolveChartSeries([
        { key: "a", label: "A" },
        { key: "a", label: "Again" },
      ]),
    ).toThrow(/unique/);
  });
});

describe("toPlotData / hasNegativeValue", () => {
  const series = resolveChartSeries([
    { key: "revenue", label: "Revenue" },
    { key: "orders", label: "Orders" },
  ]);

  it("keeps only series keys and turns missing, non-numeric and non-finite values into null", () => {
    const rows: ChartRow[] = [
      { label: "Jan", revenue: 10, orders: 3, ignored: "x" },
      { label: "Feb", revenue: null, orders: Number.NaN },
      { label: "Mar", revenue: "12" as unknown as number, orders: Number.POSITIVE_INFINITY },
      { label: "Apr" },
    ];
    expect(toPlotData(rows, series)).toEqual([
      { label: "Jan", revenue: 10, orders: 3 },
      { label: "Feb", revenue: null, orders: null },
      { label: "Mar", revenue: null, orders: null },
      { label: "Apr", revenue: null, orders: null },
    ]);
  });

  it("detects negative values only among plotted series", () => {
    expect(hasNegativeValue(toPlotData([{ label: "a", revenue: 1, orders: 2 }], series), series)).toBe(false);
    expect(hasNegativeValue(toPlotData([{ label: "a", revenue: 1, orders: -2 }], series), series)).toBe(true);
    expect(hasNegativeValue(toPlotData([{ label: "a", revenue: 1, orders: 2, other: -9 }], series), series)).toBe(false);
  });
});

describe("buildChartTable", () => {
  const series = resolveChartSeries([
    { key: "revenue", label: "Revenue", format: { kind: "currency", currency: "USD", maximumFractionDigits: 0 } },
    { key: "orders", label: "Orders" },
  ]);

  it("emits deterministic headers and rows in input order, with per-series formatting", () => {
    const table = buildChartTable(
      toPlotData(
        [
          { label: "Jan", revenue: 1200, orders: 30 },
          { label: "Feb", revenue: 900, orders: 25 },
        ],
        series,
      ),
      series,
    );
    expect(table.categoryHeader).toBe("Label");
    expect(table.valueHeaders).toEqual(["Revenue", "Orders"]);
    expect(table.rows).toEqual([
      { category: "Jan", values: ["$1,200", "30"] },
      { category: "Feb", values: ["$900", "25"] },
    ]);
  });

  it("represents missing values as null, is safe for empty data, and keeps duplicate labels as separate rows", () => {
    const withGaps = buildChartTable(
      toPlotData(
        [
          { label: "Q1", revenue: 1, orders: null },
          { label: "Q1", revenue: null, orders: 2 },
        ],
        series,
      ),
      series,
    );
    expect(withGaps.rows).toEqual([
      { category: "Q1", values: ["$1", null] },
      { category: "Q1", values: [null, "2"] },
    ]);
    expect(buildChartTable([], series).rows).toEqual([]);
  });

  it("applies the chart-level value and label formats when a series has none", () => {
    const plain = resolveChartSeries();
    const table = buildChartTable(toPlotData([{ label: "2026-03", value: 0.5 }], plain), plain, {
      valueFormat: { kind: "percent" },
      labelFormat: { kind: "date", granularity: "month" },
    });
    expect(table.rows).toEqual([{ category: "Mar 2026", values: ["50%"] }]);
  });
});
