"use client";

import { Area, AreaChart as RechartsAreaChart } from "recharts";
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

export type AreaChartDatum = ChartDatum;

export type AreaChartProps = {
  /**
   * One row per category: `{ label, value }` for a single series, or `{ label, [series.key]: number | null }`
   * with `series` for several. `null` means "no data" and leaves a gap in the area.
   */
  data: ChartRow[];
  /** Accessible name for the chart — also used as the hidden data table's caption. */
  label: string;
  /** Fixed pixel height — width is fluid, filling the parent container. */
  height?: number;
  /** Series definitions. Omit for a single series read from each row's `value`. */
  series?: ChartSeries[];
  /** "none" overlaps series (default); "stacked" stacks them; "percent" stacks to 100% of each category. */
  stacking?: "none" | "stacked" | "percent";
  /** Show a legend. Defaults to true when there is more than one series. */
  legend?: boolean;
  /** Show a hover/touch tooltip. Defaults to false. */
  tooltip?: boolean;
  /** Show the category axis labels. Defaults to true. */
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

/** Fill opacity under each series line. A CH-2 implementation choice with no Figma reference. */
const AREA_FILL_OPACITY = 0.2;

/**
 * Area chart (CH-2): each series is a 2px linear stroke over a translucent fill in
 * its series color. There is no Figma reference for this family — everything here
 * uses current Skrewww tokens conservatively and is flagged in the registry
 * openQuestions. Built on the same shared `ChartFrame` and `cartesianParts` as the
 * other Cartesian charts, so accessibility (role="img" + hidden data table, no tab
 * stop) is identical.
 */
export function AreaChart({
  data,
  label,
  height = 240,
  series,
  stacking = "none",
  legend,
  tooltip = false,
  showCategoryAxis = true,
  showValueAxis = false,
  showGrid = false,
  valueFormat,
  labelFormat,
  className,
}: AreaChartProps) {
  const resolved = resolveChartSeries(series);
  const plotData = toPlotData(data, resolved);
  const showLegend = legend ?? resolved.length > 1;

  return (
    <ChartFrame
      label={label}
      height={height}
      table={buildChartTable(plotData, resolved, { valueFormat, labelFormat })}
      legend={showLegend ? resolved.map((entry) => ({ label: entry.label, colorVar: entry.colorVar, marker: "square" as const })) : undefined}
      className={className}
    >
      <RechartsAreaChart data={plotData} stackOffset={stacking === "percent" ? "expand" : "none"}>
        {cartesianParts({
          layout: "horizontal",
          series: resolved,
          showCategoryAxis,
          showValueAxis,
          showGrid,
          tooltip,
          baseline: hasNegativeValue(plotData, resolved),
          percent: stacking === "percent",
          valueFormat,
          labelFormat,
          cursor: "line",
        })}
        {resolved.map((entry) => (
          <Area
            key={entry.key}
            type="linear"
            dataKey={entry.key}
            stroke={entry.colorVar}
            strokeWidth={2}
            fill={entry.colorVar}
            fillOpacity={AREA_FILL_OPACITY}
            stackId={stacking === "none" ? undefined : "stack"}
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
        ))}
      </RechartsAreaChart>
    </ChartFrame>
  );
}
