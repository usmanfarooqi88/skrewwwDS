import { describe, expect, it } from "vitest";
import { computePopoverPosition } from "@/components/ui/internal/popover-position";

describe("computePopoverPosition", () => {
  it("prefers the requested placement when it fits", () => {
    const triggerRect = {
      top: 200,
      left: 200,
      right: 260,
      bottom: 240,
      width: 60,
      height: 40,
      x: 200,
      y: 200,
      toJSON: () => ({}),
    } as DOMRect;

    const popoverRect = {
      top: 0,
      left: 0,
      right: 160,
      bottom: 80,
      width: 160,
      height: 80,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect;

    Object.defineProperty(window, "innerWidth", { configurable: true, value: 800 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 600 });

    const position = computePopoverPosition(triggerRect, popoverRect, "bottom", "center", 8, 8);
    expect(position.placement).toBe("bottom");
    expect(position.top).toBeGreaterThanOrEqual(triggerRect.bottom + 8);
  });

  it("shifts inside the viewport when needed", () => {
    const triggerRect = {
      top: 10,
      left: 10,
      right: 40,
      bottom: 30,
      width: 30,
      height: 20,
      x: 10,
      y: 10,
      toJSON: () => ({}),
    } as DOMRect;

    const popoverRect = {
      top: 0,
      left: 0,
      right: 200,
      bottom: 100,
      width: 200,
      height: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect;

    Object.defineProperty(window, "innerWidth", { configurable: true, value: 320 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 480 });

    const position = computePopoverPosition(triggerRect, popoverRect, "top", "start", 8, 8);
    expect(position.left).toBeGreaterThanOrEqual(8);
    expect(position.top).toBeGreaterThanOrEqual(8);
  });
});
