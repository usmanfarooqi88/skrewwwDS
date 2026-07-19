"use client";

import { useId } from "react";
import { Line, LineChart as RechartsLineChart, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/cn";
import styles from "@/components/ui/line-chart.module.css";

export type LineChartDatum = {
  label: string;
  value: number;
};

export type LineChartProps = {
  /** Single-series data — v1 does not support multiple series. */
  data: LineChartDatum[];
  /** Accessible name for the chart — also used as the hidden data table's caption. */
  label: string;
  /** Fixed pixel height — width is fluid, filling the parent container. */
  height?: number;
  className?: string;
};

/**
 * Built against Figma's "Line Chart (example)" (Content/Charts): a single
 * 2px semantic/action/primary stroke with 6px hollow-ring point markers.
 * No axis labels, gridlines, legend, or tooltip in the Figma reference — so
 * none are rendered here either.
 *
 * Curve type is "linear", confirmed by reading the actual vector path data
 * (node 2058:2560) via the Figma Plugin API: every segment is a straight
 * "L" (lineto) command — "M 0 140 L 43.3 93.3 L 86.7 110.8 L 130 43.75 ..."
 * — with no curve commands at all. This is a genuine straight-line
 * polyline, not a smoothed spline, so "linear" is a verified fact, not a
 * default guess.
 *
 * Uses recharts's ResponsiveContainer so the chart genuinely fills its
 * parent's width, matching how a real consumer embeds it in a
 * variable-width dashboard/card. The jsdom test environment has no
 * ResizeObserver by default and never computes real layout — see the
 * ResizeObserver polyfill in vitest.setup.ts, which is the correct fix for
 * that limitation, not a reason to constrain real-world sizing.
 */
export function LineChart({ data, label, height = 240, className }: LineChartProps) {
  const tableId = useId();

  return (
    <div className={cn(styles.root, className)}>
      <div role="img" aria-label={label} aria-describedby={tableId}>
        <div aria-hidden="true">
          <ResponsiveContainer width="100%" height={height}>
            <RechartsLineChart data={data}>
              <Line
                type="linear"
                dataKey="value"
                stroke="var(--line-chart-stroke)"
                strokeWidth={2}
                dot={{
                  r: 3,
                  fill: "var(--line-chart-dot-fill)",
                  stroke: "var(--line-chart-dot-stroke)",
                  strokeWidth: 2,
                }}
                activeDot={false}
                isAnimationActive={false}
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <table id={tableId} className="sr-only">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th scope="col">Label</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {data.map((datum) => (
            <tr key={datum.label}>
              <th scope="row">{datum.label}</th>
              <td>{datum.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
