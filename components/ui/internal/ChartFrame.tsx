"use client";

import { cloneElement, useId, type ReactElement } from "react";
import { ResponsiveContainer } from "recharts";
import type { ChartTable } from "@/components/ui/internal/chart-data";

export type ChartFrameProps = {
  /** Accessible name for the chart — also the hidden data table's caption. */
  label: string;
  /** Fixed pixel height — width is fluid, filling the parent container. */
  height: number;
  /** Data exposed to assistive technology as a visually-hidden table. */
  table: ChartTable;
  className?: string;
  /** Exactly one Recharts chart element (e.g. `<BarChart>`). */
  children: ReactElement<{ accessibilityLayer?: boolean }>;
};

/**
 * Shared static-visualization shell for Skrewww charts (CH-1).
 *
 * Accessibility model (v0.1, static charts): the wrapper is `role="img"` with
 * the chart's accessible name, described by a visually-hidden data table that
 * stays exposed to assistive technology. The visual itself is `aria-hidden`
 * and must never contain a keyboard stop. Recharts 3 enables an
 * `accessibilityLayer` by default, which makes the `<svg>` `tabindex="0"` with
 * `role="application"` — a focusable element hidden from assistive tech. The
 * frame therefore forces `accessibilityLayer={false}` on the chart element it
 * renders, so a family chart cannot reintroduce the focus stop by omission.
 * Interactive/keyboard chart models are out of scope until a later phase.
 *
 * The table uses row index as its React key: labels are display text and are
 * not guaranteed unique, so they must not be identity.
 */
export function ChartFrame({ label, height, table, className, children }: ChartFrameProps) {
  const tableId = useId();

  return (
    <div className={className}>
      <div role="img" aria-label={label} aria-describedby={tableId}>
        <div aria-hidden="true">
          <ResponsiveContainer width="100%" height={height}>
            {cloneElement(children, { accessibilityLayer: false })}
          </ResponsiveContainer>
        </div>
      </div>
      <table id={tableId} className="sr-only">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th scope="col">{table.categoryHeader}</th>
            {table.valueHeaders.map((header, index) => (
              <th key={index} scope="col">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              <th scope="row">{row.category}</th>
              {row.values.map((value, valueIndex) => (
                <td key={valueIndex}>{value}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
