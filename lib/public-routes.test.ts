import { describe, expect, it } from "vitest";
import { GET as getRegistry } from "@/app/registry.json/route";
import { GET as getLlmsTxt } from "@/app/llms-txt/route";
import { GET as getLlmsFullTxt } from "@/app/llms-full-txt/route";
import robots from "@/app/robots";
import { alt, contentType, size } from "@/app/opengraph-image";
import { buildLlmsFullTxt } from "@/lib/llms-content";
import { getImplementedRegistryEntries, getImplementedComponentCount } from "@/lib/component-registry";
import { getSitemapUrls } from "@/lib/sitemap-data";
import { REDIRECTED_COMPONENT_SLUGS } from "@/lib/routes";
import { absoluteUrl, siteConfig } from "@/lib/site-config";

describe("Public machine-readable routes", () => {
  it("serves registry.json with JSON content type and no localhost", async () => {
    const response = getRegistry();
    const body = await response.text();

    expect(response.headers.get("Content-Type")).toContain("application/json");
    expect(body).not.toContain("localhost");
    expect(body).not.toContain("TextInputControl");
    expect(body).not.toContain("tab-keyboard");
    expect(JSON.parse(body).metadata.implementedComponentCount).toBe(getImplementedComponentCount());
  });

  it("serves llms.txt and llms-full.txt as plain text", async () => {
    const llms = await getLlmsTxt().text();
    const llmsFull = await getLlmsFullTxt().text();

    expect(getLlmsTxt().headers.get("Content-Type")).toContain("text/plain");
    expect(getLlmsFullTxt().headers.get("Content-Type")).toContain("text/plain");
    expect(llms).toContain(absoluteUrl("/registry.json"));
    expect(llmsFull).toContain("/components/badge");
    expect(llmsFull).toContain("/components/tooltip");
    expect(llmsFull).toContain("/components/skeleton");
    expect(llmsFull).toContain("/components/pagination");
    expect(llmsFull).not.toContain("tab-keyboard");
    expect(llmsFull).not.toContain("localhost");
  });

  it("builds robots.txt metadata with canonical sitemap host", () => {
    const config = robots();
    expect(config.sitemap).toBe(absoluteUrl("/sitemap.xml"));
    expect(config.host).toBe(siteConfig.origin);
    expect(JSON.stringify(config)).not.toContain("localhost");
  });

  it("includes canonical feedback routes in sitemap and excludes redirect aliases", () => {
    const urls = getSitemapUrls();
    for (const slug of ["link", "breadcrumb", "tabs", "pagination", "dialog"]) {
      expect(urls).toContain(absoluteUrl(`/components/${slug}`));
    }

    for (const slug of REDIRECTED_COMPONENT_SLUGS) {
      expect(urls).not.toContain(absoluteUrl(`/components/${slug}`));
    }
  });

  it("exposes opengraph-image metadata with correct dimensions", () => {
    expect(size).toEqual({ width: 1200, height: 630 });
    expect(contentType).toBe("image/png");
    expect(alt).toBeTruthy();
    expect(siteConfig.defaultSocialImagePath).toBe("/opengraph-image");
  });

  it("keeps llms-full aligned with implemented registry entries", () => {
    const llmsFull = buildLlmsFullTxt();
    const implemented = getImplementedRegistryEntries();

    expect(implemented).toHaveLength(getImplementedComponentCount());
    expect(llmsFull).toContain("/components/date-picker");
    expect(llmsFull).toContain("/components/calendar-grid");
    for (const entry of implemented) {
      expect(llmsFull).toContain(entry.documentationUrl);
    }
  });
});
