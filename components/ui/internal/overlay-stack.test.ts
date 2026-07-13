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

    const unregisterFirst = registerOverlay(first);
    registerOverlay(second);

    getTopOverlay()?.onEscape();
    expect(second).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();

    unregisterFirst();
    clearOverlayStackForTests();
  });
});
