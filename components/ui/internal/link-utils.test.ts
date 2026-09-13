import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  isExternalHref,
  isHashHref,
  isSpecialProtocolHref,
  shouldUseNativeAnchor,
} from "@/components/ui/internal/link-utils";

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

  it("treats same-origin absolute URLs as internal when origin is provided", () => {
    const origin = "https://docs.example";
    expect(isExternalHref(`${origin}/components/link`, origin)).toBe(false);
    expect(shouldUseNativeAnchor(`${origin}/components/link`, origin)).toBe(false);
  });

  it("treats absolute http(s) URLs as external when no origin is available", () => {
    expect(isExternalHref("https://docs.example/components/link", undefined)).toBe(true);
  });

  it("treats cross-origin URLs as external", () => {
    expect(isExternalHref("https://example.com/docs", "https://docs.example")).toBe(true);
    expect(shouldUseNativeAnchor("https://example.com/docs", "https://docs.example")).toBe(true);
  });

  it("treats relative paths as internal", () => {
    expect(isExternalHref("/components/button")).toBe(false);
    expect(isExternalHref("./local")).toBe(false);
  });

  it("does not import docs-site configuration", () => {
    const source = readFileSync(join(process.cwd(), "components/ui/internal/link-utils.ts"), "utf8");
    expect(source).not.toMatch(/site-config/);
  });
});
