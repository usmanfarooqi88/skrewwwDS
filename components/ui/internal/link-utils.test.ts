import { describe, expect, it } from "vitest";
import {
  isExternalHref,
  isHashHref,
  isSpecialProtocolHref,
  shouldUseNativeAnchor,
} from "@/components/ui/internal/link-utils";
import { siteConfig } from "@/lib/site-config";

describe("link-utils", () => {
  it("treats hash links as internal", () => {
    expect(isHashHref("#section")).toBe(true);
    expect(isExternalHref("#section")).toBe(false);
    expect(shouldUseNativeAnchor("#section")).toBe(false);
  });

  it("treats mailto and tel as special external anchors", () => {
    expect(isSpecialProtocolHref("mailto:hello@example.com")).toBe(true);
    expect(isSpecialProtocolHref("tel:+15551234567")).toBe(true);
    expect(shouldUseNativeAnchor("mailto:hello@example.com")).toBe(true);
  });

  it("treats same-origin absolute URLs as internal", () => {
    expect(isExternalHref(`${siteConfig.origin}/components/link`)).toBe(false);
    expect(shouldUseNativeAnchor(`${siteConfig.origin}/components/link`)).toBe(false);
  });

  it("treats cross-origin URLs as external", () => {
    expect(isExternalHref("https://example.com/docs")).toBe(true);
    expect(shouldUseNativeAnchor("https://example.com/docs")).toBe(true);
  });

  it("treats relative paths as internal", () => {
    expect(isExternalHref("/components/button")).toBe(false);
    expect(isExternalHref("./local")).toBe(false);
  });
});
