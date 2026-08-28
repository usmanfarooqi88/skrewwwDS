import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useLatestRef } from "@/components/ui/internal/useLatestRef";

describe("useLatestRef", () => {
  it("exposes the latest value without changing the ref identity", () => {
    const { result, rerender } = renderHook(({ value }) => useLatestRef(value), {
      initialProps: { value: "one" },
    });
    const firstRef = result.current;
    expect(firstRef.current).toBe("one");

    rerender({ value: "two" });
    expect(result.current).toBe(firstRef);
    expect(result.current.current).toBe("two");
  });
});

describe("useLatestRef callback stability", () => {
  it("lets a listener keep a stable subscription while reading a new callback", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { result, rerender } = renderHook(({ fn }) => useLatestRef(fn), {
      initialProps: { fn: first },
    });
    const ref = result.current;
    rerender({ fn: second });
    ref.current();
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
