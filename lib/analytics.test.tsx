import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { sanitizeHref, trackEvent, useTrackComponentViewed } from "@/lib/analytics";

const { track } = vi.hoisted(() => ({ track: vi.fn() }));

vi.mock("@vercel/analytics", () => ({ track }));

afterEach(() => {
  track.mockClear();
  vi.unstubAllGlobals();
});

describe("trackEvent", () => {
  it("forwards a typed event and its properties to the underlying track() call", () => {
    trackEvent("component_code_copied", { slug: "button" });
    expect(track).toHaveBeenCalledExactlyOnceWith("component_code_copied", { slug: "button" });
  });

  it("sanitizes navigation_cta_clicked's href, stripping query string and fragment", () => {
    trackEvent("navigation_cta_clicked", {
      label: "Browse components",
      href: "/components?ref=email&token=secret#section",
    });
    expect(track).toHaveBeenCalledExactlyOnceWith("navigation_cta_clicked", {
      label: "Browse components",
      href: "/components",
    });
  });

  it("leaves events without a registered sanitizer untouched", () => {
    trackEvent("component_viewed", { slug: "button", name: "Button", category: "Actions" });
    expect(track).toHaveBeenCalledExactlyOnceWith("component_viewed", {
      slug: "button",
      name: "Button",
      category: "Actions",
    });
  });

  it("is a no-op during SSR, where window is undefined", () => {
    vi.stubGlobal("window", undefined);
    expect(() =>
      trackEvent("component_code_copied", { slug: "button" }),
    ).not.toThrow();
    expect(track).not.toHaveBeenCalled();
  });

  it("swallows a throwing track() call instead of letting it break the UI", () => {
    track.mockImplementationOnce(() => {
      throw new Error("network blocked");
    });
    expect(() =>
      trackEvent("component_code_copied", { slug: "button" }),
    ).not.toThrow();
  });
});

describe("sanitizeHref", () => {
  it("returns a plain path unchanged", () => {
    expect(sanitizeHref("/components")).toBe("/components");
  });

  it("strips a query string", () => {
    expect(sanitizeHref("/components?ref=email")).toBe("/components");
  });

  it("strips a fragment", () => {
    expect(sanitizeHref("/components#section")).toBe("/components");
  });

  it("strips both a query string and a fragment", () => {
    expect(sanitizeHref("/components?ref=email#section")).toBe("/components");
  });
});

function ViewTrackerHost({ slug, name, category }: { slug: string; name: string; category: string }) {
  useTrackComponentViewed(slug, name, category);
  return null;
}

describe("useTrackComponentViewed", () => {
  it("fires component_viewed exactly once per mount, even under Strict Mode's dev double-invoke", () => {
    render(
      <StrictMode>
        <ViewTrackerHost slug="button" name="Button" category="Actions" />
      </StrictMode>,
    );
    expect(track).toHaveBeenCalledExactlyOnceWith("component_viewed", {
      slug: "button",
      name: "Button",
      category: "Actions",
    });
  });

  it("does not refire when re-rendered with the same slug", () => {
    const { rerender } = render(
      <ViewTrackerHost slug="button" name="Button" category="Actions" />,
    );
    track.mockClear();
    rerender(<ViewTrackerHost slug="button" name="Button" category="Actions" />);
    expect(track).not.toHaveBeenCalled();
  });

  it("fires again when the slug changes to a different component", () => {
    const { rerender } = render(
      <ViewTrackerHost slug="button" name="Button" category="Actions" />,
    );
    track.mockClear();
    rerender(<ViewTrackerHost slug="link" name="Link" category="Actions" />);
    expect(track).toHaveBeenCalledExactlyOnceWith("component_viewed", {
      slug: "link",
      name: "Link",
      category: "Actions",
    });
  });
});
