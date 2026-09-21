"use client";

import { Bar, BarChart as RechartsBarChart, XAxis } from "recharts";
import { cn } from "@/lib/cn";
import { ChartFrame } from "@/components/ui/internal/ChartFrame";
import { singleSeriesChartTable, type ChartDatum } from "@/components/ui/internal/chart-data";
import styles from "@/components/ui/bar-chart.module.css";

export type BarChartDatum = ChartDatum;

export type BarChartProps = {
  /** Single-series data — v1 does not support multiple series. */
  data: BarChartDatum[];
  /** Accessible name for the chart — also used as the hidden data table's caption. */
  label: string;
  /** Fixed pixel height — width is fluid, filling the parent container. */
  height?: number;
  className?: string;
};

/**
 * Built against Figma's "Bar Chart (example)" (Content/Charts): single
 * semantic/action/primary fill, real proportional bar heights, month
 * labels below in semantic/text/secondary. No Y-axis, gridlines, legend,
 * or tooltip — static and single-series for v1 (see registry openQuestions
 * for what's deliberately deferred, not missing by oversight).
 *
 * The accessible wrapper, hidden data table, and ResponsiveContainer live in
 * the shared `ChartFrame` (internal). Chart colors are the component-owned
 * `--bar-chart-*` custom properties declared in bar-chart.module.css, so they
 * ship with the component instead of relying on the docs-site token sheet.
 *
 * The jsdom test environment has no ResizeObserver by default and never
 * computes real layout — see the ResizeObserver polyfill in vitest.setup.ts,
 * which is the correct fix for that limitation, not a reason to constrain
 * real-world sizing.
 */
export function BarChart({ data, label, height = 240, className }: BarChartProps) {
  return (
    <ChartFrame
      label={label}
      height={height}
      table={singleSeriesChartTable(data)}
      className={cn(styles.root, className)}
    >
      <RechartsBarChart data={data}>
        <XAxis
          dataKey="label"
          interval={0}
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--bar-chart-axis-text)", fontSize: 12 }}
        />
        <Bar dataKey="value" fill="var(--bar-chart-fill)" isAnimationActive={false} />
      </RechartsBarChart>
    </ChartFrame>
  );
}
