import { cn } from "@/lib/cn";
import { TimelineItemRow, type TimelineEntry } from "@/components/ui/internal/TimelineItemRow";
import styles from "@/components/ui/timeline.module.css";

export type { TimelineEntry };

export type TimelineProps = {
  data: TimelineEntry[];
  className?: string;
};

/**
 * Built against Figma's "Content/Timeline Item" component set (State:
 * Default/Highlighted), node 2058:2092 — confirmed via direct Figma
 * inspection; see lib/timeline-figma-metadata.ts. Connector suppression is
 * purely positional (only the last
 * item omits it) — independent of `state`, not derived from it. No
 * established empty-array convention exists anywhere in this codebase
 * (checked Table, Tree View, Bar Chart, Line Chart, and any internal
 * EmptyState composition — none found), so an empty `data` array renders
 * nothing rather than inventing a new empty-state pattern here.
 */
export function Timeline({ data, className }: TimelineProps) {
  if (data.length === 0) return null;

  return (
    <ol className={cn(styles.list, className)}>
      {data.map((entry, index) => (
        <TimelineItemRow key={index} entry={entry} isLast={index === data.length - 1} />
      ))}
    </ol>
  );
}
