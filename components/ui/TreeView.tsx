"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useControllableState } from "@/lib/use-controllable";
import { TreeItem } from "@/components/ui/internal/TreeItem";
import {
  flattenVisibleTree,
  resolveTreeKeyAction,
  type TreeNode,
} from "@/components/ui/internal/tree-flatten";
import { cn } from "@/lib/cn";
import styles from "@/components/ui/tree-view.module.css";

export type { TreeNode };

export type TreeViewProps = {
  /** Recursive node data — the only shape Tree View accepts. */
  data: TreeNode[];
  /** Controlled expanded-node ids. Pass alongside onExpandedChange. */
  expanded?: string[];
  /** Initial expanded-node ids for uncontrolled usage. */
  defaultExpanded?: string[];
  onExpandedChange?: (expanded: string[]) => void;
  /** Controlled selected node id (single-select). Pass alongside onSelectedChange. */
  selected?: string | null;
  /** Initial selected node id for uncontrolled usage. */
  defaultSelected?: string | null;
  onSelectedChange?: (id: string | null) => void;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  className?: string;
};

/**
 * Hierarchical tree, built against Figma's Content/Tree Item component set +
 * the "Tree View (example)" composed demo. Single-select only — multi-select
 * is a deferred v2, not part of this scope. No drag-and-drop reordering,
 * virtualization, or async/lazy-loaded children.
 */
export function TreeView(props: TreeViewProps) {
  const expandedProvided = "expanded" in props;
  const selectedProvided = "selected" in props;
  const {
    data,
    expanded: expandedProp,
    defaultExpanded = [],
    onExpandedChange,
    selected: selectedProp,
    defaultSelected = null,
    onSelectedChange,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    className,
  } = props;

  const [expandedList, setExpandedList] = useControllableState<string[]>({
    value: expandedProp,
    defaultValue: defaultExpanded,
    onChange: onExpandedChange,
    valueProvided: expandedProvided,
  });

  const [selected, setSelected] = useControllableState<string | null>({
    value: selectedProp,
    defaultValue: defaultSelected,
    onChange: onSelectedChange,
    valueProvided: selectedProvided,
  });

  const expandedSet = useMemo(() => new Set(expandedList), [expandedList]);
  const rows = useMemo(() => flattenVisibleTree(data, expandedSet), [data, expandedSet]);

  const rowRefs = useRef(new Map<string, HTMLDivElement>());
  const pendingFocusChildRef = useRef<string | null>(null);

  const [focusedId, setFocusedId] = useState<string | null>(() => rows[0]?.node.id ?? null);

  // Recover focus onto the first visible row whenever the previously
  // focused node stops being visible (data changed, or its parent collapsed
  // via a controlled `expanded` update) — adjusted during render rather
  // than in an effect, per React's guidance for state derived from props,
  // guarded by comparing against the previous `rows` reference so it only
  // runs when the visible set actually changes.
  const [lastRows, setLastRows] = useState(rows);
  if (rows !== lastRows) {
    setLastRows(rows);
    const stillVisible = focusedId !== null && rows.some((row) => row.node.id === focusedId);
    if (!stillVisible) {
      setFocusedId(rows[0]?.node.id ?? null);
    }
  }

  // ArrowRight on a collapsed node expands it, then moves focus onto its
  // first child — but that child doesn't exist in the DOM until the
  // expand commits, so the actual .focus() call is deferred here.
  useEffect(() => {
    const pending = pendingFocusChildRef.current;
    if (!pending) return;
    if (!rows.some((row) => row.node.id === pending)) return;
    const node = rowRefs.current.get(pending);
    node?.focus({ preventScroll: true });
    pendingFocusChildRef.current = null;
  }, [rows]);

  function focusRow(id: string) {
    setFocusedId(id);
    const node = rowRefs.current.get(id);
    if (node) {
      node.focus({ preventScroll: true });
      node.scrollIntoView?.({ block: "nearest" });
    }
  }

  function handleSelectRow(id: string) {
    focusRow(id);
    setSelected(id);
  }

  function handleToggleExpand(id: string) {
    focusRow(id);
    setExpandedList(
      expandedSet.has(id)
        ? expandedList.filter((existing) => existing !== id)
        : [...expandedList, id],
    );
  }

  function handleRowKeyDown(event: KeyboardEvent<HTMLDivElement>, rowId: string) {
    const action = resolveTreeKeyAction(event.key, rows, rowId, expandedSet);
    if (action.type === "none") return;
    event.preventDefault();

    switch (action.type) {
      case "move":
        focusRow(action.id);
        break;
      case "expand":
        setExpandedList([...expandedList, action.id]);
        break;
      case "expand-and-focus-child":
        pendingFocusChildRef.current = action.childId;
        setFocusedId(action.childId);
        setExpandedList([...expandedList, action.id]);
        break;
      case "collapse":
        setExpandedList(expandedList.filter((existing) => existing !== action.id));
        break;
      case "select":
        setSelected(action.id);
        break;
    }
  }

  return (
    <div
      role="tree"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className={cn(styles.tree, className)}
    >
      {rows.map((row) => (
        <TreeItem
          key={row.node.id}
          ref={(node) => {
            if (node) rowRefs.current.set(row.node.id, node);
            else rowRefs.current.delete(row.node.id);
          }}
          label={row.node.label}
          icon={row.node.icon}
          depth={row.depth}
          hasChildren={row.hasChildren}
          expanded={expandedSet.has(row.node.id)}
          selected={selected === row.node.id}
          posInSet={row.posInSet}
          setSize={row.setSize}
          tabIndex={row.node.id === focusedId ? 0 : -1}
          onSelect={() => handleSelectRow(row.node.id)}
          onToggleExpand={() => handleToggleExpand(row.node.id)}
          onKeyDown={(event) => handleRowKeyDown(event, row.node.id)}
        />
      ))}
    </div>
  );
}
