"use client";

import { CaretDown, CaretUp, CaretUpDown } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { TableHead, type TableHeadProps } from "@/components/ui/Table";
import type { DataTableSortColumnState } from "@/lib/use-data-table-sort";
import styles from "@/components/ui/data-table-sort-header.module.css";

export type DataTableSortHeaderProps = Omit<TableHeadProps, "children"> & {
  /** This column's current sort state — "none" when a different column (or nothing) is sorted. */
  sortDirection: DataTableSortColumnState;
  /** Called when the header is activated via click, Enter, or Space. */
  onSort: () => void;
  /** Column label. */
  children: ReactNode;
  disabled?: boolean;
};

const directionIcon = {
  none: CaretUpDown,
  ascending: CaretUp,
  descending: CaretDown,
} as const;

/**
 * Sortable column header for the Data Table pattern — composes TableHead
 * with a real <button>, aria-sort, and a direction indicator. Data Table has
 * no columns-config prop: the consumer still writes their own Table markup
 * and drops this in place of a plain TableHead for sortable columns.
 */
export function DataTableSortHeader({
  sortDirection,
  onSort,
  children,
  disabled = false,
  className,
  ...tableHeadProps
}: DataTableSortHeaderProps) {
  const Icon = directionIcon[sortDirection];

  return (
    <TableHead aria-sort={sortDirection} className={className} {...tableHeadProps}>
      <button
        type="button"
        className={styles.sortButton}
        onClick={onSort}
        disabled={disabled}
      >
        <span>{children}</span>
        <Icon
          size={14}
          weight="bold"
          aria-hidden="true"
          className={cn(styles.icon, sortDirection !== "none" && styles.iconActive)}
        />
      </button>
    </TableHead>
  );
}
