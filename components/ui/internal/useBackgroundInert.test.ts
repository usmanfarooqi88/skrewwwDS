import { renderHook } from "@testing-library/react";
import { describe, expect, it, afterEach } from "vitest";
import {
  resetBackgroundInertForTests,
  supportsInert,
  useBackgroundInert,
} from "@/components/ui/internal/useBackgroundInert";

describe("useBackgroundInert", () => {
  afterEach(() => {
    resetBackgroundInertForTests();
    document.body.innerHTML = "";
  });

  it("marks background siblings inert while active", () => {
    if (!supportsInert()) {
      expect(supportsInert()).toBe(false);
      return;
    }

    const background = document.createElement("main");
    const portal = document.createElement("div");
    document.body.append(background, portal);

    const { unmount } = renderHook(() => useBackgroundInert(true, portal));

    expect(background.inert).toBe(true);
    expect(portal.inert).toBe(false);

    unmount();
    expect(background.inert).toBe(false);
  });

  it("preserves pre-existing inert state", () => {
    if (!supportsInert()) return;

    const background = document.createElement("main");
    background.inert = true;
    const portal = document.createElement("div");
    document.body.append(background, portal);

    const { unmount } = renderHook(() => useBackgroundInert(true, portal));
    unmount();

    expect(background.inert).toBe(true);
  });

  it("restores background only after the last modal closes", () => {
    if (!supportsInert()) return;

    const background = document.createElement("main");
    const portal = document.createElement("div");
    document.body.append(background, portal);

    const first = renderHook(() => useBackgroundInert(true, portal));
    const second = renderHook(() => useBackgroundInert(true, portal));

    first.unmount();
    expect(background.inert).toBe(true);

    second.unmount();
    expect(background.inert).toBe(false);
  });

  it("waits for the excluded overlay node before applying inert", () => {
    if (!supportsInert()) return;

    const background = document.createElement("main");
    const portal = document.createElement("div");
    document.body.append(background, portal);

    const { rerender } = renderHook(
      ({ exclude }: { exclude: HTMLElement | null }) => useBackgroundInert(true, exclude),
      { initialProps: { exclude: null as HTMLElement | null } },
    );

    expect(background.inert).toBe(false);
    expect(portal.inert).toBe(false);

    rerender({ exclude: portal });
    expect(background.inert).toBe(true);
    expect(portal.inert).toBe(false);
  });
});
