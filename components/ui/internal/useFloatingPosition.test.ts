import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi, afterEach } from "vitest";
import { useFloatingPosition } from "@/components/ui/internal/useFloatingPosition";

describe("useFloatingPosition", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("cleans up scroll and resize listeners", () => {
    const trigger = document.createElement("button");
    const floating = document.createElement("div");
    document.body.append(trigger, floating);

    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const onUpdate = vi.fn();

    const { unmount } = renderHook(() =>
      useFloatingPosition({
        enabled: true,
        triggerElement: trigger,
        floatingElement: floating,
        onUpdate,
      }),
    );

    expect(addSpy).toHaveBeenCalled();
    unmount();
    expect(removeSpy).toHaveBeenCalled();
  });

  it("disconnects ResizeObserver on cleanup when supported", () => {
    if (typeof ResizeObserver === "undefined") return;

    const trigger = document.createElement("button");
    document.body.append(trigger);
    const disconnect = vi.fn();
    vi.spyOn(window, "ResizeObserver").mockImplementation(
      () =>
        ({
          observe: vi.fn(),
          disconnect,
          unobserve: vi.fn(),
        }) as unknown as ResizeObserver,
    );

    const { unmount } = renderHook(() =>
      useFloatingPosition({
        enabled: true,
        triggerElement: trigger,
        floatingElement: null,
        onUpdate: vi.fn(),
      }),
    );

    unmount();
    expect(disconnect).toHaveBeenCalled();
  });
});
