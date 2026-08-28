import { afterEach, describe, expect, it, vi } from "vitest";
import { trackGAEvent } from "@/lib/ga";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("trackGAEvent", () => {
  it("forwards a named event to window.gtag with cta_location, destination, and page_path", () => {
    const gtag = vi.fn();
    vi.stubGlobal("window", { ...window, gtag, location: { ...window.location, pathname: "/" } });

    trackGAEvent("free_figma_click", {
      cta_location: "home_hero",
      destination: "https://www.figma.com/community/file/1666920112751907121/skrewww-design-system-free",
    });

    expect(gtag).toHaveBeenCalledExactlyOnceWith("event", "free_figma_click", {
      cta_location: "home_hero",
      destination: "https://www.figma.com/community/file/1666920112751907121/skrewww-design-system-free",
      page_path: "/",
    });
  });

  it("strips a query string and fragment from destination", () => {
    const gtag = vi.fn();
    vi.stubGlobal("window", { ...window, gtag, location: { ...window.location, pathname: "/" } });

    trackGAEvent("pro_gumroad_click", {
      cta_location: "home_hero",
      destination: "https://usmanfarooqi.gumroad.com/l/skrewww-pro?ref=email#pricing",
    });

    expect(gtag).toHaveBeenCalledExactlyOnceWith("event", "pro_gumroad_click", {
      cta_location: "home_hero",
      destination: "https://usmanfarooqi.gumroad.com/l/skrewww-pro",
      page_path: "/",
    });
  });

  it("reads page_path from the current location at call time", () => {
    const gtag = vi.fn();
    vi.stubGlobal("window", { ...window, gtag, location: { ...window.location, pathname: "/components/button" } });

    trackGAEvent("free_figma_click", {
      cta_location: "home_hero",
      destination: "https://www.figma.com/community/file/1666920112751907121/skrewww-design-system-free",
    });

    expect(gtag).toHaveBeenCalledExactlyOnceWith(
      "event",
      "free_figma_click",
      expect.objectContaining({ page_path: "/components/button" }),
    );
  });

  it("is a no-op during SSR, where window is undefined", () => {
    vi.stubGlobal("window", undefined);
    expect(() =>
      trackGAEvent("free_figma_click", {
        cta_location: "home_hero",
        destination: "https://www.figma.com/community/file/1666920112751907121/skrewww-design-system-free",
      }),
    ).not.toThrow();
  });

  it("is a no-op when GA hasn't loaded (window.gtag is undefined)", () => {
    vi.stubGlobal("window", { ...window, gtag: undefined });
    expect(() =>
      trackGAEvent("pro_gumroad_click", {
        cta_location: "home_hero",
        destination: "https://usmanfarooqi.gumroad.com/l/skrewww-pro",
      }),
    ).not.toThrow();
  });

  it("swallows a throwing gtag() call instead of letting it break the UI", () => {
    const gtag = vi.fn(() => {
      throw new Error("blocked");
    });
    vi.stubGlobal("window", { ...window, gtag, location: { ...window.location, pathname: "/" } });

    expect(() =>
      trackGAEvent("free_figma_click", {
        cta_location: "home_hero",
        destination: "https://www.figma.com/community/file/1666920112751907121/skrewww-design-system-free",
      }),
    ).not.toThrow();
  });
});
