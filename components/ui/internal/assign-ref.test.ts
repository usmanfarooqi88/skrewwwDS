import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { assignRef, mergeRefs } from "@/components/ui/internal/assign-ref";

describe("assignRef", () => {
  it("writes into an object ref", () => {
    const ref = createRef<HTMLElement | null>();
    const node = document.createElement("button");
    assignRef(ref, node);
    expect(ref.current).toBe(node);
  });

  it("invokes a callback ref", () => {
    const callback = vi.fn();
    const node = document.createElement("button");
    assignRef(callback, node);
    expect(callback).toHaveBeenCalledWith(node);
  });

  it("mergeRefs updates every target", () => {
    const objectRef = createRef<HTMLElement | null>();
    const callback = vi.fn();
    const node = document.createElement("div");
    mergeRefs(objectRef, callback)(node);
    expect(objectRef.current).toBe(node);
    expect(callback).toHaveBeenCalledWith(node);
  });
});
