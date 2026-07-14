import { useCallback } from "react";
import { useControllableState } from "@/lib/use-controllable";

export type DataTableSortDirection = "ascending" | "descending";

/** Per-column sort direction as exposed to a header cell — includes "none" for unsorted columns. */
export type DataTableSortColumnState = "ascending" | "descending" | "none";

export type DataTableSortState<TColumn extends string = string> = {
  column: TColumn | null;
  direction: DataTableSortDirection;
};

function defaultSortState<TColumn extends string>(): DataTableSortState<TColumn> {
  return { column: null, direction: "ascending" };
}

export type UseDataTableSortOptions<TColumn extends string> = {
  /** Controlled sort state. Pass alongside onSortStateChange; omit for uncontrolled usage. */
  sortState?: DataTableSortState<TColumn>;
  /** Initial sort state for uncontrolled usage. Ignored when `sortState` is provided. */
  defaultSortState?: DataTableSortState<TColumn>;
  onSortStateChange?: (next: DataTableSortState<TColumn>) => void;
};

/**
 * Single-column sort state for Data Table, dual controlled/uncontrolled via
 * useControllableState (same pattern as Accordion/Dialog/Drawer/CalendarGrid
 * range mode). Cycle per column: none -> ascending -> descending -> none.
 * Activating a different column always resets it to ascending.
 */
export function useDataTableSort<TColumn extends string>(
  options: UseDataTableSortOptions<TColumn> = {},
) {
  const { sortState, defaultSortState: defaultValue = defaultSortState<TColumn>(), onSortStateChange } =
    options;
  const valueProvided = "sortState" in options;

  const [state, setState] = useControllableState<DataTableSortState<TColumn>>({
    value: sortState,
    defaultValue,
    onChange: onSortStateChange,
    valueProvided,
  });

  const getSortDirection = useCallback(
    (column: TColumn): DataTableSortColumnState => {
      if (state.column !== column) return "none";
      return state.direction;
    },
    [state.column, state.direction],
  );

  const toggleSort = useCallback(
    (column: TColumn) => {
      if (state.column !== column) {
        setState({ column, direction: "ascending" });
        return;
      }
      if (state.direction === "ascending") {
        setState({ column, direction: "descending" });
        return;
      }
      setState({ column: null, direction: "ascending" });
    },
    [state.column, state.direction, setState],
  );

  return { sortState: state, getSortDirection, toggleSort } as const;
}
