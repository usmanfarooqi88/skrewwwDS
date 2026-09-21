/**
 * Shared chart data foundation (CH-1). Internal — not public API; the public
 * surface stays `BarChartDatum` / `LineChartDatum`, which alias `ChartDatum`.
 *
 * Deliberately minimal: today's charts are single-series, so the public data
 * contract is still `{ label, value }`. `ChartTable` (the visually-hidden data
 * table's shape) already allows several value columns so a later phase can add
 * series without reworking the shared frame. No public `series` prop exists.
 */
export type ChartDatum = {
  label: string;
  value: number;
};

export type ChartTable = {
  categoryHeader: string;
  valueHeaders: readonly string[];
  rows: readonly { category: string; values: readonly number[] }[];
};

export function singleSeriesChartTable(data: readonly ChartDatum[]): ChartTable {
  return {
    categoryHeader: "Label",
    valueHeaders: ["Value"],
    rows: data.map((datum) => ({ category: datum.label, values: [datum.value] })),
  };
}
