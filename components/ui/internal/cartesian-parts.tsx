import type { ReactElement } from "react";
import { CartesianGrid, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import { ChartTooltip } from "@/components/ui/internal/ChartTooltip";
import { createValueFormatter, createLabelFormatter, type ChartLabelFormat, type ChartValueFormat } from "@/components/ui/internal/chart-format";
import type { ResolvedChartSeries } from "@/components/ui/internal/chart-data";

/** Reserved width for a value axis on the left (vertical charts). */
export const VALUE_AXIS_WIDTH = 48;
/**
 * Reserved width for the category axis when bars run horizontally. Long labels
 * are NOT truncated or wrapped: a label-length policy is an open design decision,
 * so they may clip at this width.
 */
export const CATEGORY_AXIS_WIDTH = 88;

const AXIS_TICK = { fill: "var(--chart-axis-text)", fontSize: 12 };

export type CartesianPartsOptions = {
  /** Recharts layout: "horizontal" = category on X (columns, lines, areas); "vertical" = category on Y (horizontal bars). */
  layout: "horizontal" | "vertical";
  series: readonly ResolvedChartSeries[];
  showCategoryAxis: boolean;
  showValueAxis: boolean;
  showGrid: boolean;
  tooltip: boolean;
  /** Draw a baseline at zero (only meaningful when a value is negative). */
  baseline: boolean;
  /** 100% stacking: the value axis is a share (0–1) and ticks render as percentages. */
  percent: boolean;
  valueFormat?: ChartValueFormat;
  labelFormat?: ChartLabelFormat;
  /** Tooltip cursor treatment: a guide line (line/area) or a band (bars). */
  cursor: "line" | "band";
};

/**
 * Shared axis / grid / baseline / tooltip elements for the Cartesian families
 * (CH-2). Returned as keyed elements so a family drops them straight into its
 * Recharts chart element. Axes are always mounted and simply `hide`den when off,
 * because Recharts derives layout from them. Only a narrow, typed option set is
 * exposed — never raw Recharts axis objects.
 */
export function cartesianParts(options: CartesianPartsOptions): ReactElement[] {
  const { layout, series, showCategoryAxis, showValueAxis, showGrid, tooltip, baseline, percent, valueFormat, labelFormat, cursor } = options;
  const formatLabel = createLabelFormatter(labelFormat);
  const formatTick = createValueFormatter(percent ? { kind: "percent" } : valueFormat);
  const vertical = layout === "vertical";

  const categoryAxisProps = {
    dataKey: "label",
    type: "category" as const,
    interval: 0 as const,
    axisLine: false,
    tickLine: false,
    tick: AXIS_TICK,
    tickFormatter: (value: string) => formatLabel(String(value)),
    hide: !showCategoryAxis,
  };
  const valueAxisProps = {
    type: "number" as const,
    axisLine: false,
    tickLine: false,
    tick: AXIS_TICK,
    tickFormatter: (value: number) => formatTick(value),
    domain: percent ? ([0, 1] as [number, number]) : undefined,
    hide: !showValueAxis,
  };

  const parts: ReactElement[] = [];
  if (showGrid) {
    parts.push(
      <CartesianGrid
        key="grid"
        stroke="var(--chart-grid)"
        horizontal={!vertical}
        vertical={vertical}
      />,
    );
  }
  parts.push(
    vertical ? (
      <YAxis key="category-axis" {...categoryAxisProps} width={CATEGORY_AXIS_WIDTH} />
    ) : (
      <XAxis key="category-axis" {...categoryAxisProps} />
    ),
  );
  parts.push(
    vertical ? (
      <XAxis key="value-axis" {...valueAxisProps} />
    ) : (
      <YAxis key="value-axis" {...valueAxisProps} width={VALUE_AXIS_WIDTH} />
    ),
  );
  if (baseline) {
    parts.push(
      vertical ? (
        <ReferenceLine key="baseline" x={0} stroke="var(--chart-baseline)" />
      ) : (
        <ReferenceLine key="baseline" y={0} stroke="var(--chart-baseline)" />
      ),
    );
  }
  if (tooltip) {
    parts.push(
      <Tooltip
        key="tooltip"
        isAnimationActive={false}
        cursor={cursor === "band" ? { fill: "var(--chart-cursor)" } : { stroke: "var(--chart-baseline)" }}
        content={(props) => (
          <ChartTooltip
            series={series}
            valueFormat={valueFormat}
            labelFormat={labelFormat}
            active={props.active}
            label={props.label}
            payload={props.payload}
          />
        )}
      />,
    );
  }
  return parts;
}
