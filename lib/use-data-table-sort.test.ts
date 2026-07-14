import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useDataTableSort, type DataTableSortState } from "@/lib/use-data-table-sort";

describe("useDataTableSort", () => {
  describe("uncontrolled usage", () => {
    it("starts with no column sorted", () => {
      const { result } = renderHook(() => useDataTableSort<"name" | "age">());
      expect(result.current.sortState).toEqual({ column: null, direction: "ascending" });
      expect(result.current.getSortDirection("name")).toBe("none");
      expect(result.current.getSortDirection("age")).toBe("none");
    });

    it("cycles a single column none -> ascending -> descending -> none", () => {
      const { result } = renderHook(() => useDataTableSort<"name" | "age">());

      act(() => result.current.toggleSort("name"));
      expect(result.current.sortState).toEqual({ column: "name", direction: "ascending" });
      expect(result.current.getSortDirection("name")).toBe("ascending");

      act(() => result.current.toggleSort("name"));
      expect(result.current.sortState).toEqual({ column: "name", direction: "descending" });
      expect(result.current.getSortDirection("name")).toBe("descending");

      act(() => result.current.toggleSort("name"));
      expect(result.current.sortState).toEqual({ column: null, direction: "ascending" });
      expect(result.current.getSortDirection("name")).toBe("none");
    });

    it("resets a newly-activated column to ascending regardless of the previous column's direction", () => {
      const { result } = renderHook(() => useDataTableSort<"name" | "age">());

      act(() => result.current.toggleSort("name"));
      act(() => result.current.toggleSort("name"));
      expect(result.current.sortState).toEqual({ column: "name", direction: "descending" });

      act(() => result.current.toggleSort("age"));
      expect(result.current.sortState).toEqual({ column: "age", direction: "ascending" });
      expect(result.current.getSortDirection("name")).toBe("none");
      expect(result.current.getSortDirection("age")).toBe("ascending");
    });

    it("supports a non-default initial state via defaultSortState", () => {
      const { result } = renderHook(() =>
        useDataTableSort<"name" | "age">({
          defaultSortState: { column: "age", direction: "descending" },
        }),
      );
      expect(result.current.getSortDirection("age")).toBe("descending");
    });
  });

  describe("controlled usage", () => {
    it("does not change internal state on toggle — only calls onSortStateChange", () => {
      const onSortStateChange = vi.fn();
      const { result, rerender } = renderHook(
        ({ sortState }) => useDataTableSort<"name" | "age">({ sortState, onSortStateChange }),
        {
          initialProps: {
            sortState: { column: "name", direction: "ascending" } as DataTableSortState<
              "name" | "age"
            >,
          },
        },
      );

      act(() => result.current.toggleSort("name"));
      expect(onSortStateChange).toHaveBeenCalledWith({ column: "name", direction: "descending" });
      // Controlled: state does not move until the caller feeds the new value back in.
      expect(result.current.sortState).toEqual({ column: "name", direction: "ascending" });

      rerender({ sortState: { column: "name", direction: "descending" } });
      expect(result.current.getSortDirection("name")).toBe("descending");
    });

    it("reports the caller-supplied column/direction via getSortDirection", () => {
      const { result } = renderHook(() =>
        useDataTableSort<"name" | "age">({
          sortState: { column: "age", direction: "descending" },
          onSortStateChange: vi.fn(),
        }),
      );
      expect(result.current.getSortDirection("age")).toBe("descending");
      expect(result.current.getSortDirection("name")).toBe("none");
    });
  });
});
