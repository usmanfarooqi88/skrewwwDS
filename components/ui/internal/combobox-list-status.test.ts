import { describe, expect, it } from "vitest";
import { useComboboxListStatus } from "@/components/ui/internal/combobox-list-status";
import { renderHook } from "@testing-library/react";

describe("useComboboxListStatus", () => {
  it("announces result count when the listbox opens", () => {
    const { result, rerender } = renderHook(
      (props) => useComboboxListStatus(props),
      { initialProps: { open: false, resultCount: 3 } },
    );
    expect(result.current).toBe("");
    rerender({ open: true, resultCount: 3 });
    expect(result.current).toBe("3 results available.");
  });

  it("announces no results when the listbox opens empty", () => {
    const { result, rerender } = renderHook(
      (props) => useComboboxListStatus(props),
      { initialProps: { open: false, resultCount: 0 } },
    );
    rerender({ open: true, resultCount: 0 });
    expect(result.current).toBe("No results found.");
  });

  it("announces when results become empty while open", () => {
    const { result, rerender } = renderHook(
      (props) => useComboboxListStatus(props),
      { initialProps: { open: true, resultCount: 2 } },
    );
    rerender({ open: true, resultCount: 0 });
    expect(result.current).toBe("No results found.");
  });

  it("announces when results return after being empty", () => {
    const { result, rerender } = renderHook(
      (props) => useComboboxListStatus(props),
      { initialProps: { open: true, resultCount: 0 } },
    );
    rerender({ open: true, resultCount: 2 });
    expect(result.current).toBe("2 results available.");
  });

  it("does not re-announce on intermediate count changes", () => {
    const { result, rerender } = renderHook(
      (props) => useComboboxListStatus(props),
      { initialProps: { open: true, resultCount: 3 } },
    );
    rerender({ open: true, resultCount: 2 });
    expect(result.current).toBe("3 results available.");
  });

  it("clears announcements when closed", () => {
    const { result, rerender } = renderHook(
      (props) => useComboboxListStatus(props),
      { initialProps: { open: true, resultCount: 2 } },
    );
    rerender({ open: false, resultCount: 2 });
    expect(result.current).toBe("");
  });

  it("stays silent when disabled", () => {
    const { result, rerender } = renderHook(
      (props) => useComboboxListStatus(props),
      { initialProps: { open: true, disabled: true, resultCount: 2 } },
    );
    rerender({ open: true, disabled: true, resultCount: 0 });
    expect(result.current).toBe("");
  });
});
