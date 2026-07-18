"use client";

import { useId } from "react";
import { Line, LineChart as RechartsLineChart } from "recharts";
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
  /** Fixed pixel dimensions, not a fluid/responsive container — a deliberate v1 simplification, not a Figma-specified constraint. */
  width?: number;
  height?: number;
  className?: string;
};

/**
 * Built against Figma's "Line Chart (example)" (Content/Charts): a single
 * 2px semantic/action/primary stroke with 6px hollow-ring point markers.
 * No axis labels, gridlines, legend, or tooltip in the Figma reference — so
 * none are rendered here either. Curve type ("monotone") and fixed pixel
 * sizing are this component's own implementation decisions, not things
 * Figma specified (see registry openQuestions for deferred scope).
 */
export function LineChart({ data, label, width = 480, height = 240, className }: LineChartProps) {
  const tableId = useId();

  return (
    <div className={cn(styles.root, className)}>
      <div role="img" aria-label={label} aria-describedby={tableId}>
        <div aria-hidden="true">
          <RechartsLineChart width={width} height={height} data={data}>
            <Line
              type="monotone"
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
