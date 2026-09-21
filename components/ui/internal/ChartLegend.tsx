import { cn } from "@/lib/cn";
import styles from "@/components/ui/internal/chart.module.css";

export type ChartLegendItem = {
  label: string;
  /** CSS `var()` reference for the marker color. */
  colorVar: string;
  /** "square" for area/bar fills, "line" for line series. */
  marker: "square" | "line";
};

/**
 * Non-interactive chart legend (CH-2): a marker plus the series name, wrapping
 * onto new lines. It is part of the aria-hidden visual — series identity for
 * assistive technology lives in the hidden data table's column headers — and it
 * deliberately renders no buttons or focusable controls. Series toggling needs a
 * hidden-series state and keyboard/announcement contract and is deferred.
 */
export function ChartLegend({ items }: { items: readonly ChartLegendItem[] }) {
  return (
    <ul className={styles.legend}>
      {items.map((item, index) => (
        <li key={index} className={styles.legendItem}>
          <span
            aria-hidden="true"
            className={cn(styles.marker, item.marker === "line" ? styles.markerLine : styles.markerSquare)}
            style={{ backgroundColor: item.colorVar }}
          />
          <span>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}
