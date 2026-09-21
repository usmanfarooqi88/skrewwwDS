import {
  createLabelFormatter,
  createValueFormatter,
  type ChartLabelFormat,
  type ChartValueFormat,
} from "@/components/ui/internal/chart-format";
import type { ResolvedChartSeries } from "@/components/ui/internal/chart-data";
import styles from "@/components/ui/internal/chart.module.css";

type TooltipPayloadEntry = { dataKey?: unknown; value?: unknown };

export type ChartTooltipProps = {
  series: readonly ResolvedChartSeries[];
  valueFormat?: ChartValueFormat;
  labelFormat?: ChartLabelFormat;
  /** Supplied by Recharts. */
  active?: boolean;
  label?: unknown;
  payload?: readonly TooltipPayloadEntry[];
};

/**
 * Shared Cartesian chart tooltip (CH-2): the category label, then one row per
 * series in declared order with its name and formatted value. Series are named
 * in text, never identified by color alone, and missing values read "No data".
 *
 * The tooltip is pointer/touch-only supplementary information inside the
 * aria-hidden visual. Everything it shows is also present in the hidden data
 * table, so it is never the only way to reach a value, and it renders no
 * focusable content (the static-chart accessibility model is unchanged).
 * Not to be confused with the generic overlay `Tooltip` component.
 */
export function ChartTooltip({ series, valueFormat, labelFormat, active, label, payload }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const formatLabel = createLabelFormatter(labelFormat);

  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipTitle}>{formatLabel(String(label ?? ""))}</p>
      <ul className={styles.tooltipList}>
        {series.map((entry) => {
          const point = payload.find((candidate) => candidate.dataKey === entry.key);
          const value = point && typeof point.value === "number" && Number.isFinite(point.value) ? point.value : null;
          const format = createValueFormatter(entry.format ?? valueFormat);
          return (
            <li key={entry.key} className={styles.tooltipRow}>
              <span
                aria-hidden="true"
                className={`${styles.marker} ${styles.markerSquare}`}
                style={{ backgroundColor: entry.colorVar }}
              />
              <span className={styles.tooltipName}>{entry.label}</span>
              <span className={styles.tooltipValue}>{value === null ? "No data" : format(value)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
