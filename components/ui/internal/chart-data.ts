import {
  createLabelFormatter,
  createValueFormatter,
  type ChartLabelFormat,
  type ChartValueFormat,
} from "@/components/ui/internal/chart-format";

/**
 * Shared Cartesian data + series foundation (CH-1/CH-2). Internal — not public
 * API; families re-export the public types (`ChartRow`, `ChartSeries`, ...).
 *
 * Data model: each row has a categorical `label` and one numeric (or null =
 * missing) value per series key. Single-series charts keep the original
 * `{ label, value }` shape — `value` is the default series key. Scatter (numeric
 * x/y points, no category) has different data semantics and is intentionally not
 * part of this contract.
 */
export type ChartDatum = {
  label: string;
  value: number;
};

/** One category row: `label` plus a number (or null for "no data") per series key. */
export type ChartRow = { label: string } & { readonly [seriesKey: string]: string | number | null };

/** Categorical series color slots (`--chart-series-N`); they carry no status meaning. */
export const CHART_SERIES_COLORS = ["series-1", "series-2", "series-3", "series-4"] as const;
export type ChartSeriesColor = (typeof CHART_SERIES_COLORS)[number];

export type ChartSeries = {
  /** Row property holding this series' value. Must be unique and must not be "label". */
  key: string;
  /** Display name used by the legend, tooltip and the hidden data table header. */
  label: string;
  /** Color slot; defaults to the series' position (wrapping after four). */
  color?: ChartSeriesColor;
  /** Value format for this series in the tooltip and data table (overrides the chart's `valueFormat`). */
  format?: ChartValueFormat;
};

export type ResolvedChartSeries = {
  key: string;
  label: string;
  color: ChartSeriesColor;
  /** CSS `var()` reference for SVG attributes and legend markers. */
  colorVar: string;
  format?: ChartValueFormat;
};

export type ChartTable = {
  categoryHeader: string;
  valueHeaders: readonly string[];
  /** A null cell means "no data" for that row/series. */
  rows: readonly { category: string; values: readonly (string | number | null)[] }[];
};

export type PlotRow = { label: string } & { [seriesKey: string]: string | number | null };

const DEFAULT_SERIES: readonly ChartSeries[] = [{ key: "value", label: "Value" }];

export function resolveChartSeries(series?: readonly ChartSeries[]): ResolvedChartSeries[] {
  const source = series && series.length > 0 ? series : DEFAULT_SERIES;
  const seen = new Set<string>();
  return source.map((entry, index) => {
    if (entry.key === "label") {
      throw new Error('Chart series key must not be "label": it is reserved for the category label.');
    }
    if (seen.has(entry.key)) {
      throw new Error(`Chart series keys must be unique; "${entry.key}" is repeated.`);
    }
    seen.add(entry.key);
    const color = entry.color ?? CHART_SERIES_COLORS[index % CHART_SERIES_COLORS.length];
    return { key: entry.key, label: entry.label, color, colorVar: `var(--chart-${color})`, format: entry.format };
  });
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** Normalizes rows to exactly the series keys, with non-finite or non-numeric values as null. */
export function toPlotData(rows: readonly ChartRow[], series: readonly ResolvedChartSeries[]): PlotRow[] {
  return rows.map((row) => {
    const plotRow: PlotRow = { label: String(row.label) };
    for (const entry of series) plotRow[entry.key] = numberOrNull(row[entry.key]);
    return plotRow;
  });
}

export function hasNegativeValue(rows: readonly PlotRow[], series: readonly ResolvedChartSeries[]): boolean {
  return rows.some((row) => series.some((entry) => (row[entry.key] as number | null) !== null && (row[entry.key] as number) < 0));
}

export function buildChartTable(
  rows: readonly PlotRow[],
  series: readonly ResolvedChartSeries[],
  options: { valueFormat?: ChartValueFormat; labelFormat?: ChartLabelFormat } = {},
): ChartTable {
  const formatLabel = createLabelFormatter(options.labelFormat);
  const formatters = series.map((entry) => createValueFormatter(entry.format ?? options.valueFormat));
  return {
    categoryHeader: "Label",
    valueHeaders: series.map((entry) => entry.label),
    rows: rows.map((row) => ({
      category: formatLabel(row.label),
      values: series.map((entry, index) => {
        const value = row[entry.key] as number | null;
        return value === null ? null : formatters[index](value);
      }),
    })),
  };
}

/** Single-series table used by tests and simple callers: header "Label" / "Value". */
export function singleSeriesChartTable(data: readonly ChartDatum[]): ChartTable {
  return {
    categoryHeader: "Label",
    valueHeaders: ["Value"],
    rows: data.map((datum) => ({ category: datum.label, values: [datum.value] })),
  };
}
