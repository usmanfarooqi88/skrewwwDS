"use client";

import { forwardRef, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { CaretRight } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import styles from "@/components/ui/internal/tree-item.module.css";

/** Depth-proportional left spacer, confirmed 20px per depth in Figma's composed example. */
export const TREE_ITEM_INDENT_PX = 20;

export type TreeItemProps = {
  label: string;
  icon?: ReactNode;
  depth: number;
  hasChildren: boolean;
  expanded: boolean;
  selected: boolean;
  posInSet: number;
  setSize: number;
  tabIndex: 0 | -1;
  onSelect: () => void;
  onToggleExpand: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  className?: string;
};

/**
 * A single Tree View row. Internal to components/ui/TreeView.tsx — the
 * public API is TreeView + a TreeNode data prop, not this row in isolation
 * (matches the Figma anatomy: Chevron + Icon slot + Label, with indentation
 * as a real depth * 20px spacer rather than a fixed per-depth variant).
 */
export const TreeItem = forwardRef<HTMLDivElement, TreeItemProps>(function TreeItem(
  {
    label,
    icon,
    depth,
    hasChildren,
    expanded,
    selected,
    posInSet,
    setSize,
    tabIndex,
    onSelect,
    onToggleExpand,
    onKeyDown,
    className,
  },
  ref,
) {
  function handleChevronClick(event: MouseEvent<HTMLSpanElement>) {
    event.stopPropagation();
    onToggleExpand();
  }

  return (
    <div
      ref={ref}
      role="treeitem"
      tabIndex={tabIndex}
      aria-expanded={hasChildren ? expanded : undefined}
      aria-selected={selected}
      aria-level={depth + 1}
      aria-setsize={setSize}
      aria-posinset={posInSet}
      className={cn(styles.row, selected && styles.selected, className)}
      style={{
        paddingLeft: `calc(var(--tree-item-padding-x) + ${depth * TREE_ITEM_INDENT_PX}px)`,
      }}
      onClick={onSelect}
      onKeyDown={onKeyDown}
    >
      {hasChildren ? (
        <span
          role="presentation"
          className={cn(styles.chevron, expanded && styles.chevronExpanded)}
          onClick={handleChevronClick}
        >
          <CaretRight size={16} weight="bold" aria-hidden="true" />
        </span>
      ) : (
        <span className={styles.chevronSpacer} aria-hidden="true" />
      )}
      {icon ? (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span className={styles.label}>{label}</span>
    </div>
  );
});
