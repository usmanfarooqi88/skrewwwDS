import { describe, expect, it } from "vitest";
import { getComponentBySlug } from "@/lib/data";
import { getRegistryEntry } from "@/lib/component-registry";

describe("Targeted component documentation accuracy", () => {
  it("documents both Progress Bar modes without applying Figma's fixed fill to React", () => {
    const doc = getComponentBySlug("progress-bar")!;
    const entry = getRegistryEntry("progress-bar")!;

    expect(doc.whenToUse).toMatch(/indeterminate/);
    expect(doc.whenNotToUse).not.toMatch(/unknown-duration processes.*Spinner/);
    expect(doc.accessibility).toContain("native <progress>");
    expect(doc.accessibility).toContain("without a numeric value");
    expect(doc.knownLimitation).toContain("do not limit React");
    expect(entry.apiProps).toContainEqual(expect.objectContaining({
      name: "showValue",
      type: "boolean",
      default: "false",
    }));
    expect(entry.reactExample).toContain("value={completed}");
    expect(entry.reactExample).toContain("max={total}");
    expect(entry.reactExample).toContain("indeterminate={total === undefined}");
    expect(entry.relatedComponents).toContainEqual(expect.objectContaining({
      href: "/components/file-upload",
    }));
  });

  it("distinguishes Account Card from banking siblings and delegates its action to the consumer", () => {
    const doc = getComponentBySlug("banking-account-card")!;
    const entry = getRegistryEntry("banking-account-card")!;

    expect(doc.purpose).toContain("does not fetch balances");
    expect(doc.whenNotToUse).toContain("Banking Transaction Row");
    expect(doc.whenNotToUse).toContain("Banking Balance Summary");
    expect(entry.relatedComponents).toContainEqual(expect.objectContaining({
      href: "/components/banking-balance-summary",
    }));
    expect(entry.reactExample).toMatch(/^"use client";/);
    expect(entry.reactExample).toContain("onAction={onViewTransactions}");
    expect(entry.reactExample).not.toContain("onAction={() => undefined}");
    // Better documentation must not upgrade this React-first pilot's maturity or Figma claims.
    expect(entry.status).toBe("beta");
    expect(entry.figmaAvailability).toBe("unavailable");
  });
});
