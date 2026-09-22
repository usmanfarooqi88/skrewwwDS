import { ArrowDown, ArrowUp, Minus } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/cn";
import styles from "@/components/ui/chart-metric.module.css";

export type ChartMetricDeltaDirection = "up" | "down" | "flat";

export type ChartMetricDelta = {
  /** Which way the value moved — drives only the icon, never a color. */
  direction: ChartMetricDeltaDirection;
  /** Pre-formatted delta text (e.g. "+4.2%") — formatting is the consumer's responsibility. */
  value: string;
  /** Optional comparison context, e.g. "vs last 30 days". */
  label?: string;
};

export type ChartMetricProps = {
  label: string;
  /** Pre-formatted value (e.g. "$4,231.09") — formatting is the consumer's responsibility. */
  value: string;
  delta?: ChartMetricDelta;
  className?: string;
};

const DIRECTION_ICON: Record<ChartMetricDeltaDirection, typeof ArrowUp> = {
  up: ArrowUp,
  down: ArrowDown,
  flat: Minus,
};

const DIRECTION_WORD: Record<ChartMetricDeltaDirection, string> = {
  up: "Increased",
  down: "Decreased",
  flat: "Unchanged",
};

/**
 * A labeled value with an optional directional delta, for use above a chart
 * (in `ChartCard` or standalone). Extracted from three independent, ad hoc
 * reimplementations of the same value typography that existed before CH-3:
 * `BankingAccountCard`'s `.balance`, `BankingBalanceSummary`'s `.totalValue`
 * (byte-identical CSS to `.balance`), and the Reference App overview page's
 * raw Tailwind `text-3xl font-semibold tabular-nums`.
 *
 * `delta.direction` is a real design decision, not a placeholder: it drives
 * only the icon (an arrow or a dash), never a color. There is no green-is-
 * good/red-is-bad rule here — an "increase" is not always a good outcome
 * (spend, churn, error rate), so this component makes no sentiment claim.
 * The direction is also announced in words ("Increased"/"Decreased"/
 * "Unchanged") via visually-hidden text, so it is never conveyed by the icon
 * or color alone.
 */
export function ChartMetric({ label, value, delta, className }: ChartMetricProps) {
  const DeltaIcon = delta ? DIRECTION_ICON[delta.direction] : null;

  return (
    <div className={cn(styles.root, className)}>
      <p className={styles.label}>{label}</p>
      <p className={styles.value}>
        {value}
        {delta && DeltaIcon ? (
          <span className={styles.delta}>
            <DeltaIcon aria-hidden="true" className={styles.deltaIcon} />
            <span className="sr-only">{DIRECTION_WORD[delta.direction]} </span>
            {delta.value}
            {delta.label ? <span className={styles.deltaLabel}> {delta.label}</span> : null}
          </span>
        ) : null}
      </p>
    </div>
  );
}
