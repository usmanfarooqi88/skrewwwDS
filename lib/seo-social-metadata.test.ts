import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getCategoryPageHref } from "@/lib/category-content";
import { getIndustryPageHref } from "@/lib/industry-content";
import { getSitemapUrls } from "@/lib/sitemap-data";
import { pageSocialMetadata } from "@/lib/social-metadata";
import { getComponentPageMetadata } from "@/lib/registry-seo";
import { absoluteUrl, getDefaultSocialImageUrl, siteConfig } from "@/lib/site-config";

const root = process.cwd();
const socialImage = getDefaultSocialImageUrl();

type SocialMetadata = {
  title?: unknown;
  description?: unknown;
  openGraph?: { images?: unknown; url?: unknown; title?: unknown; description?: unknown } | null;
  twitter?: { card?: unknown; images?: unknown; title?: unknown } | null;
  alternates?: { canonical?: unknown } | null;
  robots?: unknown;
};

function ogImageUrls(meta: SocialMetadata): string[] {
  const images = meta.openGraph?.images;
  const list = Array.isArray(images) ? images : images ? [images] : [];
  return list.map((image) => (typeof image === "string" ? image : (image as { url: string }).url));
}

async function indexableFamilies(): Promise<Array<[string, SocialMetadata]>> {
  const categoryModule = await import("@/app/components/category/[categorySlug]/page");
  const industryModule = await import("@/app/components/industries/[industrySlug]/page");

  return [
    ["/docs", (await import("@/app/docs/page")).metadata],
    ["/components", (await import("@/app/components/page")).metadata],
    ["/components/charts", (await import("@/app/components/charts/page")).metadata],
    ["/components/industries", (await import("@/app/components/industries/page")).metadata],
    ["/foundations", (await import("@/app/foundations/page")).metadata],
    ["/guard", (await import("@/app/guard/page")).metadata],
    ["/agent-kit", (await import("@/app/agent-kit/page")).metadata],
    ["/changelog", (await import("@/app/changelog/page")).metadata],
    [
      getCategoryPageHref("Actions"),
      await categoryModule.generateMetadata({ params: Promise.resolve({ categorySlug: "actions" }) }),
    ],
    [
      getIndustryPageHref("Banking"),
      await industryModule.generateMetadata({ params: Promise.resolve({ industrySlug: "banking" }) }),
    ],
    ["/components/button", getComponentPageMetadata("button")],
  ];
}

describe("SEO-1A — social metadata parity on indexable pages", () => {
  it("every indexable page family exposes an OG image and a Twitter large card", async () => {
    for (const [route, meta] of await indexableFamilies()) {
      expect(ogImageUrls(meta), `${route} og:image`).toContain(socialImage);
      expect(meta.twitter?.card, `${route} twitter:card`).toBe("summary_large_image");
      expect(meta.twitter?.images, `${route} twitter:image`).toEqual([socialImage]);
    }
  }, 30_000);

  it("keeps page-specific title, description and self-canonical alongside shared defaults", async () => {
    for (const [route, meta] of await indexableFamilies()) {
      const url = absoluteUrl(route);
      expect(meta.alternates?.canonical, `${route} canonical`).toBe(url);
      expect(meta.openGraph?.url, `${route} og:url`).toBe(url);
      expect(meta.openGraph?.description, `${route} og:description`).toBe(meta.description);
      expect(meta.twitter?.title, `${route} twitter:title`).toBe(meta.openGraph?.title);
      expect(meta.description).not.toBe(siteConfig.description);
    }
  }, 30_000);

  it("helper builds page-specific values on the single default image", () => {
    const meta = pageSocialMetadata({ title: "T", description: "D", url: "https://x.test/p", type: "article" });
    expect(meta.openGraph).toMatchObject({ title: "T", description: "D", url: "https://x.test/p", type: "article" });
    expect(ogImageUrls(meta)).toEqual([socialImage]);
    expect(meta.twitter).toMatchObject({ card: "summary_large_image", title: "T", description: "D" });
  });

  it("homepage inherits the root OG image and uses the current product description", async () => {
    // app/layout imports next/font, which cannot load under Vitest — assert on source.
    const layout = readFileSync(join(root, "app", "layout.tsx"), "utf8");
    expect(layout).toContain("images: [{ url: getDefaultSocialImageUrl() }]");
    expect(layout).toContain("description: siteConfig.description");
    expect(siteConfig.description).toBe(
      "React and TypeScript design system with accessible, token-driven components, a shadcn-compatible registry, a paired Figma library, and machine-readable contracts for AI coding agents.",
    );
    const home = (await import("@/app/page")).metadata;
    expect(home.openGraph).toBeUndefined();
    expect(home.alternates?.canonical).toBe(siteConfig.origin);
  });

  it("foundations metadata carries no hand-maintained variable count", async () => {
    const { metadata } = await import("@/app/foundations/page");
    expect(String(metadata.description)).not.toMatch(/\d+\+?\s+variables/i);
    const source = readFileSync(join(root, "app", "foundations", "page.tsx"), "utf8");
    const descriptionBlock = source.slice(source.indexOf("const description"), source.indexOf("const url"));
    expect(descriptionBlock).not.toMatch(/\d/);
  });

  it("does not change indexing: reference stays noindex and out of the sitemap", async () => {
    const reference = await import("@/app/reference/layout");
    expect(JSON.stringify(reference.metadata.robots)).toContain("false");
    const urls = getSitemapUrls();
    expect(urls.some((u) => u.includes("/reference"))).toBe(false);
    expect(urls.some((u) => u.includes("/r/") || u.includes("/agent/"))).toBe(false);
    for (const route of ["/", "/components", "/foundations", "/guard", "/agent-kit", "/changelog"]) {
      expect(urls).toContain(absoluteUrl(route));
    }
  });
});
