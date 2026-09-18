import { describe, expect, it } from "vitest";
import { getComponentBySlug } from "@/lib/data";
import { getRegistryEntry } from "@/lib/component-registry";
import { getComponentPageMetadata, brandedDocumentTitle } from "@/lib/registry-seo";
import { absoluteUrl } from "@/lib/site-config";

describe("SEO Growth Batch 1 — Search Field", () => {
  it("keeps title/meta architecture and adds Combobox related + comparison + native search semantics", () => {
    const entry = getRegistryEntry("search-field");
    const doc = getComponentBySlug("search-field");
    const meta = getComponentPageMetadata("search-field");

    expect(entry).toBeDefined();
    expect(doc).toBeDefined();
    expect(meta.title).toBe("Search Field");
    expect(meta.openGraph?.title).toBe(brandedDocumentTitle("Search Field"));
    expect(meta.alternates?.canonical).toBe(absoluteUrl("/components/search-field"));
    expect(meta.description).toBe(entry!.summary);

    expect(entry!.relatedComponents.some((link) => link.href === "/components/combobox")).toBe(
      true,
    );
    expect(entry!.relatedComponents.some((link) => link.href === "/components/text-input")).toBe(
      true,
    );
    expect(entry!.relatedComponents.some((link) => link.href === "/components/form-field")).toBe(
      true,
    );

    const comboboxComparison = entry!.comparisons?.find(
      (item) => item.title === "Search Field vs Combobox",
    );
    expect(comboboxComparison).toBeDefined();
    expect(comboboxComparison!.body.toLowerCase()).toContain("free-form");
    expect(comboboxComparison!.body.toLowerCase()).not.toMatch(/autocomplete suggestions/);

    expect(entry!.anatomy).toMatch(/type=["']search["']/);
    expect(entry!.anatomy).toContain("Clear search");
    expect(doc!.accessibility).toMatch(/type=["']search["']/);
    expect(doc!.accessibility).toContain("Clear search");
    expect(doc!.accessibility.toLowerCase()).toContain("escape");
    expect(entry!.openQuestions.some((q) => /autocomplete/i.test(q))).toBe(true);
  });
});

describe("SEO Growth Batch 1 — Credit Card Field", () => {
  it("keeps title/meta and adds payment-form intent + no-Luhn validation clarification", () => {
    const entry = getRegistryEntry("credit-card-field");
    const doc = getComponentBySlug("credit-card-field");
    const meta = getComponentPageMetadata("credit-card-field");

    expect(meta.title).toBe("Credit Card Field");
    expect(meta.openGraph?.title).toBe(brandedDocumentTitle("Credit Card Field"));
    expect(meta.alternates?.canonical).toBe(absoluteUrl("/components/credit-card-field"));
    expect(meta.description).toBe(entry!.summary);
    expect(String(meta.description).toLowerCase()).not.toContain("database schema");

    expect(doc!.purpose.toLowerCase()).toMatch(/credit card input field pattern|payment form/);
    expect(doc!.whenToUse.toLowerCase()).toMatch(/payment form|card-details/);

    const validation = entry!.comparisons?.find(
      (item) => item.title === "What validation does Credit Card Field perform?",
    );
    expect(validation).toBeDefined();
    expect(validation!.body).toMatch(/Luhn/i);
    expect(validation!.body.toLowerCase()).toContain("does not run luhn");
    expect(validation!.body.toLowerCase()).toContain("error");
    expect(validation!.body.toLowerCase()).not.toMatch(/tokeniz/);
    expect(validation!.body.toLowerCase()).not.toMatch(/\bpci compliant\b/);

    // Existing honesty preserved — no new processor/PCI claims beyond existing truth.
    expect(entry!.comparisons?.some((c) => c.title === "Is this a payment integration?")).toBe(
      true,
    );
  });
});

describe("SEO Growth Batch 1 — Tree Item", () => {
  it("keeps title, links Tree View + List Item, and does not claim a public TreeItem React API", () => {
    const doc = getComponentBySlug("tree-item");
    const registry = getRegistryEntry("tree-item");
    const meta = getComponentPageMetadata("tree-item");

    expect(registry).toBeUndefined();
    expect(meta.title).toBe("Tree Item");
    expect(meta.openGraph?.title).toBe(brandedDocumentTitle("Tree Item"));
    expect(meta.alternates?.canonical).toBe(absoluteUrl("/components/tree-item"));

    expect(doc!.relatedLinks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ href: "/components/tree-view" }),
        expect.objectContaining({ href: "/components/list-item" }),
      ]),
    );

    expect(doc!.purpose.toLowerCase()).toContain("tree view");
    expect(doc!.purpose.toLowerCase()).toMatch(/figma|row pattern/);
    expect(doc!.whenToUse.toLowerCase()).toContain("tree view");
    expect(doc!.whenToUse.toLowerCase()).toMatch(/expanded|selected/);
    expect(doc!.whenNotToUse.toLowerCase()).toContain("list item");
    expect(doc!.knownLimitation).toBeDefined();
    expect(doc!.knownLimitation!.toLowerCase()).toMatch(/no public standalone react treeitem/);
    expect(doc!.knownLimitation!.toLowerCase()).not.toMatch(/public react treeitem api/i);
    expect(doc!.commonMistakes.toLowerCase()).toContain("standalone");
  });

  it("Tree View related list points at Tree Item as docs-only without implying React availability", () => {
    const treeView = getRegistryEntry("tree-view");
    const link = treeView!.relatedComponents.find((item) => item.href === "/components/tree-item");
    expect(link).toBeDefined();
    expect(link!.label.toLowerCase()).toMatch(/docs only|figma/);
    expect(treeView!.hasImplementation).toBe(true);
  });
});
