"use client";

import { Line, LineChart as RechartsLineChart } from "recharts";
import { ChartFrame } from "@/components/ui/internal/ChartFrame";
import { cartesianParts } from "@/components/ui/internal/cartesian-parts";
import {
  buildChartTable,
  hasNegativeValue,
  resolveChartSeries,
  toPlotData,
  type ChartDatum,
  type ChartRow,
  type ChartSeries,
} from "@/components/ui/internal/chart-data";
import type { ChartLabelFormat, ChartValueFormat } from "@/components/ui/internal/chart-format";

export type { ChartRow, ChartSeries, ChartSeriesColor } from "@/components/ui/internal/chart-data";
export type { ChartLabelFormat, ChartValueFormat } from "@/components/ui/internal/chart-format";

export type LineChartDatum = ChartDatum;

export type LineChartProps = {
  /**
   * One row per category: `{ label, value }` for a single series, or `{ label, [series.key]: number | null }`
   * with `series` for several. `null` means "no data" and leaves a gap in the line.
   */
  data: ChartRow[];
  /** Accessible name for the chart — also used as the hidden data table's caption. */
  label: string;
  /** Fixed pixel height — width is fluid, filling the parent container. */
  height?: number;
  /** Series definitions. Omit for a single series read from each row's `value`. */
  series?: ChartSeries[];
  /**
   * Compact rendering for inline/dashboard use (e.g. a balance-history
   * sparkline inside a card): suppresses the point markers, uses a thinner 1.5px
   * stroke instead of the base 2px, and hides every axis, grid line, legend and
   * tooltip. Data and accessibility (role="img" + hidden data table) are
   * unchanged. Added for the Layer 4 Banking pilot's Account Card.
   */
  sparkline?: boolean;
  /** Draw a hollow-ring marker on each point. Defaults to true (always false in sparkline mode). */
  markers?: boolean;
  /** Show a legend. Defaults to true when there is more than one series (never in sparkline mode). */
  legend?: boolean;
  /** Show a hover/touch tooltip. Defaults to false. */
  tooltip?: boolean;
  /** Show the category axis labels. Defaults to false (the Figma reference has no axis). */
  showCategoryAxis?: boolean;
  /** Show the value axis ticks. Defaults to false. */
  showValueAxis?: boolean;
  /** Show grid lines. Defaults to false. */
  showGrid?: boolean;
  /** Format for value-axis ticks, the tooltip and the hidden table. Default: the raw number. */
  valueFormat?: ChartValueFormat;
  /** Format for category labels (axis, tooltip, hidden table). Default: the label as given. */
  labelFormat?: ChartLabelFormat;
  className?: string;
};

/**
 * Built against Figma's "Line Chart (example)" (Content/Charts): a single
 * 2px semantic/action/primary stroke with 6px hollow-ring point markers. With no
 * extra props the output is that static single-series chart — no axes, grid,
 * legend or tooltip. Multiple series, the axes, grid, legend and tooltip are CH-2
 * additions with no Figma reference (see registry openQuestions).
 *
 * Curve type is "linear", confirmed by reading the actual vector path data
 * (node 2058:2560) via the Figma Plugin API: every segment is a straight
 * "L" (lineto) command — "M 0 140 L 43.3 93.3 L 86.7 110.8 L 130 43.75 ..." —
 * with no curve commands at all. It is a genuine polyline, not a smoothed spline.
 *
 * The accessible wrapper, hidden data table, legend and ResponsiveContainer live
 * in the shared `ChartFrame`; axes, grid and tooltip come from `cartesianParts`.
 * Colors are the frame-owned `--chart-series-*` / `--chart-marker-fill` properties.
 */
export function LineChart({
  data,
  label,
  height = 240,
  series,
  sparkline = false,
  markers = true,
  legend,
  tooltip = false,
  showCategoryAxis = false,
  showValueAxis = false,
  showGrid = false,
  valueFormat,
  labelFormat,
  className,
}: LineChartProps) {
  const resolved = resolveChartSeries(series);
  const plotData = toPlotData(data, resolved);
  const compact = sparkline;
  const showLegend = !compact && (legend ?? resolved.length > 1);

  return (
    <ChartFrame
      label={label}
      height={height}
      table={buildChartTable(plotData, resolved, { valueFormat, labelFormat })}
      legend={showLegend ? resolved.map((entry) => ({ label: entry.label, colorVar: entry.colorVar, marker: "line" as const })) : undefined}
      className={className}
    >
      <RechartsLineChart data={plotData}>
        {cartesianParts({
          layout: "horizontal",
          series: resolved,
          showCategoryAxis: !compact && showCategoryAxis,
          showValueAxis: !compact && showValueAxis,
          showGrid: !compact && showGrid,
          tooltip: !compact && tooltip,
          baseline: !compact && hasNegativeValue(plotData, resolved),
          percent: false,
          valueFormat,
          labelFormat,
          cursor: "line",
        })}
        {resolved.map((entry) => (
          <Line
            key={entry.key}
            type="linear"
            dataKey={entry.key}
            stroke={entry.colorVar}
            strokeWidth={compact ? 1.5 : 2}
            dot={
              compact || !markers
                ? false
                : { r: 3, fill: "var(--chart-marker-fill)", stroke: entry.colorVar, strokeWidth: 2 }
            }
            activeDot={false}
            isAnimationActive={false}
          />
        ))}
      </RechartsLineChart>
    </ChartFrame>
  );
}
