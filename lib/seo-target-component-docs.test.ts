import { describe, expect, it } from "vitest";
import { getComponentBySlug } from "@/lib/data";
import { getRegistryEntry } from "@/lib/component-registry";

describe("Targeted component documentation accuracy", () => {
  it("aligns Button guidance with action and link semantics while preserving the icon comparison", () => {
    const doc = getComponentBySlug("button")!;
    const entry = getRegistryEntry("button")!;

    expect(doc.whenToUse).toContain("Use Primary for the single most important action, Secondary for alternative/less prominent actions, Danger for destructive actions requiring confirmation.");
    expect(doc.whenToUse).toContain("A prominent navigational CTA may use Button with href, which renders with link semantics.");
    expect(doc.whenNotToUse).toContain("For inline or lower-emphasis page-to-page navigation (use Link).");
    expect(doc.accessibility).toContain("The action variant renders a native <button>; the href variant renders a semantic link.");
    expect(doc.accessibility).toContain("Tab to focus, Enter/Space to activate buttons, Enter to activate links.");
    expect(doc.accessibility).toContain("Focus uses semantic/focus-ring");
    expect(entry.comparisons).toHaveLength(3);
    expect(entry.comparisons?.[0].title).toBe("How do Button icons get their color?");
    expect(entry.comparisons?.slice(1)).toEqual([
      {
        title: "What is the difference between Button and Link?",
        body: "Use Button for actions such as submitting, confirming, or starting a process. A prominent navigational CTA may use Button with href, which renders with link semantics. Use Link for inline or lower-emphasis navigation where the control should read as part of the surrounding content.",
      },
      {
        title: "Which Button variant should I use?",
        body: "Use Primary for the single most important action in a view, Secondary for alternative or less-prominent actions, and Danger for destructive actions that require clear confirmation.",
      },
    ]);
  });

  it("distinguishes Text Input from Textarea and Search Field with exactly two comparisons", () => {
    expect(getRegistryEntry("text-input")!.comparisons).toEqual([
      {
        title: "When should I use Text Input instead of Textarea?",
        body: "Use Text Input for short, single-line values such as names, email addresses, codes, or general form fields. Use Textarea when users need to enter content that can span multiple lines, such as descriptions, comments, or messages.",
      },
      {
        title: "When should I use Text Input instead of Search Field?",
        body: "Use Text Input for general form data. Use Search Field when the input's primary purpose is searching or filtering content and the search-specific leading icon and optional clear action are appropriate.",
      },
    ]);
  });

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
