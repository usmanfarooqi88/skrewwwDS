import type { ReactNode } from "react";
import { Alert } from "@/components/ui/Alert";
import { Card, type CardElevation } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import styles from "@/components/ui/chart-card.module.css";

export type ChartCardState = "ready" | "loading" | "empty" | "error";

export type ChartCardProps = {
  title?: string;
  description?: ReactNode;
  /** Heading level for the optional title. Defaults to `h3`. */
  headingLevel?: "h2" | "h3" | "h4";
  /** Header-right slot — e.g. a time-range Tabs group, a filter Button, or a Menu of chart actions. */
  actions?: ReactNode;
  elevation?: CardElevation;
  /** Which region renders in the body. Defaults to `"ready"`. */
  state?: ChartCardState;
  /**
   * Minimum height reserved for the body, in pixels — keeps the card's size
   * stable across every state (ready/loading/empty/error), matching a
   * chart's own `height` prop. Real content taller than this still grows
   * the card; it is a floor, not a fixed box.
   */
  contentHeight?: number;
  loadingLabel?: string;
  emptyTitle?: string;
  emptyDescription?: ReactNode;
  errorTitle?: string;
  errorDescription?: ReactNode;
  /** e.g. a "Retry" Button, rendered alongside the error message. */
  errorAction?: ReactNode;
  /** Rendered only when `state` is `"ready"` — typically a `ChartMetric` and a chart. */
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
};

/**
 * A Card composed for a chart: an optional title/description/actions header,
 * a body that owns loading/empty/error presentation around consumer-supplied
 * `children`, and Card's own footer. It is a thin composition, not a new
 * visual system — the surface, border, radius, and Shape/Surface behavior
 * are 100% Card's (see Card.tsx); ChartCard adds no background, border, or
 * radius of its own anywhere in its stylesheet.
 *
 * Ownership, stated explicitly (see docs/architecture and the registry
 * openQuestions for the reasoning): a chart family (BarChart/LineChart/
 * AreaChart) never owns network state — it only renders whatever `data` it
 * is given, including an empty array. Fetching, loading, "no results", and
 * error presentation belong to the composition around the chart. ChartCard
 * is that composition; it does not fetch anything itself.
 *
 * `children` render only when `state` is `"ready"` — put the chart (and an
 * optional `ChartMetric`) there. The `error` region is announced politely
 * (`Alert announce="polite"`) since it represents a state the user was not
 * otherwise told about; loading and empty are not (no error occurred).
 */
export function ChartCard({
  title,
  description,
  headingLevel: Heading = "h3",
  actions,
  elevation,
  state = "ready",
  contentHeight = 240,
  loadingLabel = "Loading chart",
  emptyTitle = "No data",
  emptyDescription,
  errorTitle = "Couldn't load chart",
  errorDescription,
  errorAction,
  children,
  footer,
  className,
}: ChartCardProps) {
  const hasHeader = Boolean(title || description || actions);

  return (
    <Card elevation={elevation} footer={footer} className={className}>
      {hasHeader ? (
        <div className={styles.header}>
          {title || description ? (
            <div className={styles.heading}>
              {title ? <Heading className={styles.title}>{title}</Heading> : null}
              {description ? <p className={styles.description}>{description}</p> : null}
            </div>
          ) : null}
          {actions ? <div className={styles.actions}>{actions}</div> : null}
        </div>
      ) : null}
      <div className={styles.content} style={{ minHeight: contentHeight }}>
        {state === "ready" ? children : null}
        {state === "loading" ? (
          <div className={cn(styles.stateBox)} aria-busy="true">
            <span className="sr-only">{loadingLabel}</span>
            <Skeleton shape="rectangle" width="100%" height={contentHeight} />
          </div>
        ) : null}
        {state === "empty" ? (
          <div className={styles.stateBox}>
            <EmptyState title={emptyTitle} description={emptyDescription} className={styles.emptyState} />
          </div>
        ) : null}
        {state === "error" ? (
          <div className={styles.stateBox}>
            <Alert type="error" title={errorTitle} description={errorDescription} action={errorAction} announce="polite" />
          </div>
        ) : null}
      </div>
    </Card>
  );
}
