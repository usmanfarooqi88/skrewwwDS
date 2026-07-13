import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useControllableState } from "@/lib/use-controllable";

describe("useControllableState", () => {
  it("treats value as controlled when defined", () => {
    const onChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ value }) =>
        useControllableState({
          value,
          onChange,
        }),
      { initialProps: { value: "a" as string | undefined } },
    );

    expect(result.current[0]).toBe("a");

    act(() => {
      result.current[1]("b");
    });

    expect(onChange).toHaveBeenCalledWith("b");
    expect(result.current[0]).toBe("a");

    rerender({ value: "b" });
    expect(result.current[0]).toBe("b");
  });

  it("supports controlled empty undefined when value prop is provided", () => {
    const onChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ value }) =>
        useControllableState<string | undefined>({
          value,
          valueProvided: true,
          onChange,
        }),
      { initialProps: { value: "2026-07-11" as string | undefined } },
    );

    expect(result.current[0]).toBe("2026-07-11");

    rerender({ value: undefined });
    expect(result.current[0]).toBeUndefined();

    act(() => {
      result.current[1]("2026-07-12");
    });

    expect(onChange).toHaveBeenCalledWith("2026-07-12");
    expect(result.current[0]).toBeUndefined();
  });

  it("updates uncontrolled state without requiring onChange", () => {
    const { result } = renderHook(() =>
      useControllableState({
        defaultValue: "start",
      }),
    );

    act(() => {
      result.current[1]("next");
    });

    expect(result.current[0]).toBe("next");
  });

  it("fires onChange exactly once per setValue call", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useControllableState({
        defaultValue: "",
        onChange,
      }),
    );

    act(() => {
      result.current[1]("query");
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("query");
  });
});
