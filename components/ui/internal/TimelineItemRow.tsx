import { cn } from "@/lib/cn";
import styles from "@/components/ui/internal/timeline-item-row.module.css";

export type TimelineEntry = {
  title: string;
  timestamp: string;
  description: string;
  /** Default is an outlined ring, Highlighted is a larger solid dot. */
  state?: "default" | "highlighted";
};

export type TimelineItemRowProps = {
  entry: TimelineEntry;
  /**
   * Connector suppression is purely positional — the last item never
   * renders a connector, regardless of its own `state`. This is a
   * deliberately separate concern from `state`, not derived from it.
   */
  isLast: boolean;
};

/**
 * Internal row for components/ui/Timeline.tsx — not publicly exported,
 * matching TreeItem's precedent (Tree View / Tree Item split).
 */
export function TimelineItemRow({ entry, isLast }: TimelineItemRowProps) {
  const { title, timestamp, description, state = "default" } = entry;

  return (
    <li className={styles.item}>
      <div className={styles.markerColumn}>
        <span
          className={cn(styles.marker, state === "highlighted" && styles.markerHighlighted)}
          aria-hidden="true"
        />
        {!isLast ? <span className={styles.connector} aria-hidden="true" /> : null}
      </div>
      <div className={styles.content}>
        <div className={styles.header}>
          <span className={styles.title}>{title}</span>
          <span className={styles.timestamp}>{timestamp}</span>
        </div>
        <p className={styles.description}>{description}</p>
      </div>
    </li>
  );
}
