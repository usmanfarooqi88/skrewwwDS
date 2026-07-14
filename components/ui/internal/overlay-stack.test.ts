import { describe, expect, it, vi } from "vitest";
import {
  clearOverlayStackForTests,
  getTopOverlay,
  registerOverlay,
} from "@/components/ui/internal/overlay-stack";

describe("overlay-stack", () => {
  it("dispatches escape to the topmost overlay only", () => {
    clearOverlayStackForTests();
    const first = vi.fn();
    const second = vi.fn();

    const firstHandle = registerOverlay(first);
    registerOverlay(second);

    getTopOverlay()?.onEscape();
    expect(second).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();

    firstHandle.unregister();
    clearOverlayStackForTests();
  });

  it("assigns a strictly increasing order per registration, reflecting nesting depth", () => {
    clearOverlayStackForTests();
    const first = registerOverlay(vi.fn());
    const second = registerOverlay(vi.fn());
    const third = registerOverlay(vi.fn());

    expect(second.order).toBeGreaterThan(first.order);
    expect(third.order).toBeGreaterThan(second.order);

    second.unregister();
    first.unregister();
    third.unregister();
    clearOverlayStackForTests();
  });
});
