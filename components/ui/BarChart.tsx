"use client";

import { useId } from "react";
import { Bar, BarChart as RechartsBarChart, XAxis } from "recharts";
import { cn } from "@/lib/cn";
import styles from "@/components/ui/bar-chart.module.css";

export type BarChartDatum = {
  label: string;
  value: number;
};

export type BarChartProps = {
  /** Single-series data — v1 does not support multiple series. */
  data: BarChartDatum[];
  /** Accessible name for the chart — also used as the hidden data table's caption. */
  label: string;
  /** Fixed pixel dimensions, not a fluid/responsive container — a deliberate v1 simplification, not a Figma-specified constraint. */
  width?: number;
  height?: number;
  className?: string;
};

/**
 * Built against Figma's "Bar Chart (example)" (Content/Charts): single
 * semantic/action/primary fill, real proportional bar heights, month
 * labels below in semantic/text/secondary. No Y-axis, gridlines, legend,
 * or tooltip — static and single-series for v1 (see registry openQuestions
 * for what's deliberately deferred, not missing by oversight).
 */
export function BarChart({ data, label, width = 480, height = 240, className }: BarChartProps) {
  const tableId = useId();

  return (
    <div className={cn(styles.root, className)}>
      <div role="img" aria-label={label} aria-describedby={tableId}>
        <div aria-hidden="true">
          <RechartsBarChart width={width} height={height} data={data}>
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--bar-chart-axis-text)", fontSize: 12 }}
            />
            <Bar dataKey="value" fill="var(--bar-chart-fill)" isAnimationActive={false} />
          </RechartsBarChart>
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
