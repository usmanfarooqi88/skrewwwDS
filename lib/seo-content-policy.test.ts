import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { categoryPageContent } from "@/lib/category-content";
import { getImplementedRegistryEntries } from "@/lib/component-registry";
import { allComponents } from "@/lib/data";
import { getComponentIndexing, getIndexableComponentSlugs } from "@/lib/indexing-policy";
import { getComponentPageMetadata } from "@/lib/registry-seo";
import { getSitemapUrls } from "@/lib/sitemap-data";
import { categoryPageJsonLd, industryPageJsonLd } from "@/lib/structured-data";
import { absoluteUrl } from "@/lib/site-config";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf8");

/** Docs-only sub-component pages: meaning depends on a parent page, which stays the landing page. */
const SUB_COMPONENT_DOCS = [
  "breadcrumb-item",
  "page-item",
  "step-item",
  "menu-item",
  "dropdown-trigger",
  "sidebar-nav-item",
  "top-nav-item",
  "tree-item",
  "timeline-item",
] as const;

describe("SEO-2 — thin-page indexing policy", () => {
  it("sub-component docs pages resolve noindex,follow and are absent from the sitemap", () => {
    const urls = getSitemapUrls();
    for (const slug of SUB_COMPONENT_DOCS) {
      expect(getComponentIndexing(slug), slug).toBe("noindex");
      expect(getComponentPageMetadata(slug).robots, slug).toEqual({ index: false, follow: true });
      expect(urls, slug).not.toContain(absoluteUrl(`/components/${slug}`));
      expect(getIndexableComponentSlugs(), slug).not.toContain(slug);
    }
  });

  it("noindex is declared on the canonical doc entry, not a duplicated list in the sitemap", () => {
    for (const slug of SUB_COMPONENT_DOCS) {
      expect(allComponents.find((c) => c.slug === slug)?.indexing, slug).toBe("noindex");
    }
  });

  it("pages stay reachable: still documented, self-canonical and not robots.txt-blocked", () => {
    for (const slug of SUB_COMPONENT_DOCS) {
      expect(allComponents.some((c) => c.slug === slug), slug).toBe(true);
      expect(getComponentPageMetadata(slug).alternates?.canonical).toBe(absoluteUrl(`/components/${slug}`));
    }
  });

  it("Icon Button and every implemented component remain indexable and in the sitemap", () => {
    const urls = getSitemapUrls();
    for (const slug of ["icon-button", ...getImplementedRegistryEntries().map((e) => e.slug)]) {
      expect(getComponentIndexing(slug), slug).toBe("index");
      expect(urls, slug).toContain(absoluteUrl(`/components/${slug}`));
    }
  });

  it("sitemap has no duplicates and every indexable component is present exactly once", () => {
    const urls = getSitemapUrls();
    expect(new Set(urls).size).toBe(urls.length);
    for (const slug of getIndexableComponentSlugs()) {
      expect(urls.filter((u) => u === absoluteUrl(`/components/${slug}`))).toHaveLength(1);
    }
  });
});

describe("SEO-2 — content accuracy", () => {
  it("Foundations visible copy carries no hand-maintained variable total", () => {
    const source = read("app/foundations/page.tsx");
    expect(source).not.toMatch(/160\+/);
    expect(source).not.toMatch(/\d+\+?\s+variables across/);
  });

  it("category and industry structured data make no hard-coded maturity claim", () => {
    const serialized = JSON.stringify([
      ...Object.keys(categoryPageContent).flatMap((c) => categoryPageJsonLd(c as keyof typeof categoryPageContent)),
      ...industryPageJsonLd("Banking"),
    ]);
    expect(serialized).not.toMatch(/Beta component/);
  });

  it("category content no longer carries stale hand-written maturity notes", () => {
    for (const content of Object.values(categoryPageContent)) {
      expect(content).not.toHaveProperty("statusNote");
    }
  });

  it("category and industry pages derive their maturity line from the registry", () => {
    expect(read("app/components/category/[categorySlug]/page.tsx")).toMatch(/stableCount[\s\S]*betaCount/);
    const industryPage = read("app/components/industries/[industrySlug]/page.tsx");
    expect(industryPage).toMatch(/entry\.status === "stable"/);
    expect(industryPage).toMatch(/entry\.status === "beta"/);
  });

  it("homepage derives the Banking count and does not state the stale AI-first/69-component copy", () => {
    const home = read("app/page.tsx");
    expect(home).toContain("bankingCount");
    expect(home).not.toContain("Banking pilot (3 components)");
    expect(home).not.toContain("AI-first design system platform");
    expect(home).toMatch(/Figma library/);
  });
});
