import { describe, expect, it } from "vitest";
import { getImplementedRegistryEntries, getImplementedComponentCount } from "@/lib/component-registry";
import { buildLlmsFullTxt, buildLlmsTxt } from "@/lib/llms-content";
import {
  getComponentPageMetadata,
  getComponentCanonicalUrl,
  getImplementedComponentTitles,
} from "@/lib/registry-seo";
import { getPublicRegistry, serializePublicRegistry } from "@/lib/registry-public";
import { getSitemapUrls } from "@/lib/sitemap-data";
import {
  COMPONENT_REDIRECTS,
  getCanonicalComponentSlug,
  REDIRECTED_COMPONENT_SLUGS,
} from "@/lib/routes";
import { breadcrumbJsonLd, componentPageJsonLd, siteStructuredData } from "@/lib/structured-data";
import { absoluteUrl, siteConfig } from "@/lib/site-config";

describe("SEO infrastructure", () => {
  it("resolves canonical component slugs", () => {
    expect(getCanonicalComponentSlug("form-field-wrapper")).toBe("form-field");
    expect(getCanonicalComponentSlug("button")).toBe("button");
  });

  it("maps form-field-wrapper redirect alias", () => {
    expect(COMPONENT_REDIRECTS["form-field-wrapper"]).toBe("/components/form-field");
    expect(REDIRECTED_COMPONENT_SLUGS).toContain("form-field-wrapper");
  });

  it("maps accordion-item redirect alias", () => {
    expect(COMPONENT_REDIRECTS["accordion-item"]).toBe("/components/accordion");
    expect(REDIRECTED_COMPONENT_SLUGS).toContain("accordion-item");
  });

  it("excludes accordion-item from public registry and llms-full", () => {
    const serialized = serializePublicRegistry();
    expect(serialized).not.toContain("/components/accordion-item");
    expect(buildLlmsFullTxt()).not.toContain("/components/accordion-item");
    expect(getPublicRegistry().components.some((entry) => entry.slug === "accordion-item")).toBe(
      false,
    );
  });

  it("includes list-item and empty-state in llms-full", () => {
    const llmsFull = buildLlmsFullTxt();
    expect(llmsFull).toContain("/components/list-item");
    expect(llmsFull).toContain("/components/empty-state");
  });

  it("serializes registry JSON without localhost or internal controls", () => {
    const registry = getPublicRegistry();
    const serialized = serializePublicRegistry();

    expect(registry.metadata.schemaVersion).toBe("1.3.0");
    expect(registry.metadata.canonicalBaseUrl).toBe(siteConfig.origin);
    expect(registry.metadata.implementedComponentCount).toBe(getImplementedComponentCount());
    expect(serialized).not.toContain("localhost");
    expect(serialized).not.toContain("TextInputControl");
    expect(serialized).not.toContain("TextareaControl");
    expect(serialized).not.toContain("SelectControl");
    expect(JSON.parse(serialized).metadata.designSystemVersion).toBeTruthy();
  });

  it("includes every implemented component in the sitemap with canonical URLs", () => {
    const urls = getSitemapUrls();
    const implemented = getImplementedRegistryEntries();

    for (const entry of implemented) {
      expect(urls).toContain(entry.documentationUrl);
    }

    expect(new Set(urls).size).toBe(urls.length);
    expect(urls).not.toContain(absoluteUrl("/components/form-field-wrapper"));
    expect(urls).not.toContain(absoluteUrl("/components/accordion-item"));
  });

  it("matches sitemap component URLs to registry documentation URLs", () => {
    const urls = getSitemapUrls();
    const implemented = getImplementedRegistryEntries();

    for (const entry of implemented) {
      expect(urls.find((url) => url === entry.documentationUrl)).toBe(entry.documentationUrl);
    }
  });

  it("generates unique metadata titles and non-empty summaries for implemented components", () => {
    const titles = getImplementedComponentTitles();
    const implemented = getImplementedRegistryEntries();

    expect(titles).toHaveLength(implemented.length);
    expect(new Set(titles.map((entry) => entry.title)).size).toBe(titles.length);

    for (const entry of implemented) {
      expect(entry.summary.trim().length).toBeGreaterThan(0);
      const metadata = getComponentPageMetadata(entry.slug);
      expect(metadata.title).toContain(entry.name);
      expect(metadata.alternates?.canonical).toBe(getComponentCanonicalUrl(entry.slug));
    }
  });

  it("outputs component JSON-LD with breadcrumbs and article fields", () => {
    const data = componentPageJsonLd("button");
    expect(data).toHaveLength(2);
    expect(data[0]["@type"]).toBe("BreadcrumbList");
    expect(data[1]["@type"]).toBe("TechArticle");
    expect(data[1].headline).toBe("Button");
    expect(data[1].version).toBeTruthy();
  });

  it("builds breadcrumb JSON-LD with absolute URLs", () => {
    const breadcrumbs = breadcrumbJsonLd([
      { name: "Home", url: siteConfig.origin },
      { name: "Components", url: absoluteUrl("/components") },
    ]);
    expect(breadcrumbs.itemListElement).toHaveLength(2);
  });

  it("includes site-level structured data without ratings or pricing", () => {
    const data = siteStructuredData();
    const serialized = JSON.stringify(data);
    expect(data.some((entry) => entry["@type"] === "Organization")).toBe(true);
    expect(data.some((entry) => entry["@type"] === "WebSite")).toBe(true);
    expect(data.some((entry) => entry["@type"] === "SoftwareApplication")).toBe(true);
    expect(serialized).not.toContain("aggregateRating");
    expect(serialized).not.toContain('"price"');
  });

  it("includes required llms.txt sections and canonical URLs", () => {
    const llms = buildLlmsTxt();
    expect(llms).toContain("What Skrewww is");
    expect(llms).toContain("Four-layer architecture");
    expect(llms).toContain(absoluteUrl("/registry.json"));
    expect(llms).toContain(absoluteUrl("/components/search-field"));
    expect(llms).toContain("Search Field");
    expect(llms).not.toContain("TextInputControl");
  });

  it("marks feedback component pages as indexable", () => {
    for (const slug of [
      "alert",
      "toast",
      "progress-bar",
      "spinner",
      "badge",
      "tooltip",
      "skeleton",
    ]) {
      const metadata = getComponentPageMetadata(slug);
      expect(metadata.robots).toEqual({ index: true, follow: true });
    }
  });

  it("marks navigation component pages as indexable", () => {
    for (const slug of ["link", "breadcrumb", "tabs", "pagination"]) {
      const metadata = getComponentPageMetadata(slug);
      expect(metadata.robots).toEqual({ index: true, follow: true });
    }
  });

  it("marks dialog page as indexable", () => {
    const metadata = getComponentPageMetadata("dialog");
    expect(metadata.robots).toEqual({ index: true, follow: true });
  });

  it("uses generated Open Graph image URL", () => {
    expect(siteConfig.defaultSocialImagePath).toBe("/opengraph-image");
    expect(JSON.stringify(getComponentPageMetadata("alert").openGraph?.images)).toContain(
      "/opengraph-image",
    );
  });
});
