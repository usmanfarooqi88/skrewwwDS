import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeAll, describe, expect, it } from "vitest";
import { categories } from "@/lib/types";
import { getCategoryPageHref } from "@/lib/category-content";
import { allComponents } from "@/lib/data";
import { CHART_COMPONENT_SLUGS, CHARTS_HUB_HREF } from "@/lib/global-nav";
import { getComponentIndexing } from "@/lib/indexing-policy";
import { industries, getIndustryPageHref } from "@/lib/industry-content";
import { getSitemapUrls } from "@/lib/sitemap-data";
import {
  chartsHubBreadcrumbJsonLd,
  changelogBreadcrumbJsonLd,
  docsOnlyComponentJsonLd,
  industriesIndexBreadcrumbJsonLd,
} from "@/lib/structured-data";
import { absoluteUrl, siteConfig } from "@/lib/site-config";

const root = process.cwd();
const origin = siteConfig.origin;

type Rendered = { html: string; hrefs: string[] };
const pages = new Map<string, Rendered>();

function record(path: string, node: ReactElement) {
  const html = renderToStaticMarkup(node);
  const hrefs = Array.from(html.matchAll(/<a [^>]*href="([^"]+)"/g))
    .map((m) => m[1].replace(/&amp;/g, "&").split("#")[0].replace(origin, ""))
    .filter((h) => h.startsWith("/"))
    .map((h) => (h.length > 1 ? h.replace(/\/$/, "") : h));
  pages.set(path, { html, hrefs });
}

const sitemapPaths = () =>
  getSitemapUrls().map((u) => {
    const p = u.replace(origin, "");
    return p === "" ? "/" : p;
  });

beforeAll(async () => {
  const load = async <T,>(f: () => Promise<T>) => f();
  record("/", (await load(() => import("@/app/page"))).default());
  record("/docs", (await load(() => import("@/app/docs/page"))).default());
  record("/guard", (await load(() => import("@/app/guard/page"))).default());
  record("/agent-kit", (await load(() => import("@/app/agent-kit/page"))).default());
  record("/changelog", (await load(() => import("@/app/changelog/page"))).default());
  record("/foundations", (await load(() => import("@/app/foundations/page"))).default());
  record("/components", await (await import("@/app/components/page")).default());
  record(CHARTS_HUB_HREF, (await import("@/app/components/charts/page")).default());
  record("/components/industries", (await import("@/app/components/industries/page")).default());

  const categoryPage = (await import("@/app/components/category/[categorySlug]/page")).default;
  for (const category of categories) {
    const href = getCategoryPageHref(category);
    record(href, await categoryPage({ params: Promise.resolve({ categorySlug: href.split("/").pop()! }) }));
  }
  const industryPage = (await import("@/app/components/industries/[industrySlug]/page")).default;
  for (const industry of industries) {
    const href = getIndustryPageHref(industry);
    record(href, await industryPage({ params: Promise.resolve({ industrySlug: href.split("/").pop()! }) }));
  }
}, 60_000);

describe("SEO-3 — crawlable internal link graph", () => {
  it("every indexable URL is reachable from the homepage through body links, not the sitemap alone", () => {
    const reachable = new Set<string>(["/"]);
    const queue = ["/"];
    while (queue.length) {
      const current = queue.shift()!;
      for (const href of pages.get(current)?.hrefs ?? []) {
        if (!reachable.has(href)) {
          reachable.add(href);
          queue.push(href);
        }
      }
    }
    expect(reachable.size).toBeGreaterThanOrEqual(sitemapPaths().length);
    const orphans = sitemapPaths().filter((p) => !reachable.has(p));
    expect(orphans).toEqual([]);
  });

  it("Guard, Agent Kit, Changelog and Docs each have a body link from the homepage", () => {
    const home = pages.get("/")!.hrefs;
    for (const target of ["/guard", "/agent-kit", "/changelog", "/docs", "/foundations", "/components"]) {
      expect(home, target).toContain(target);
    }
  });

  it("product pages link to each other where the relationship is real", () => {
    expect(pages.get("/agent-kit")!.hrefs).toEqual(expect.arrayContaining(["/guard", "/components"]));
    expect(pages.get("/guard")!.hrefs).toEqual(expect.arrayContaining(["/agent-kit", "/changelog"]));
    expect(pages.get("/changelog")!.hrefs).toEqual(expect.arrayContaining(["/guard", "/agent-kit"]));
    expect(pages.get("/foundations")!.hrefs).toContain("/components");
  });

  it("agent-kit no longer hard-codes the site origin into internal anchors", () => {
    const html = pages.get("/agent-kit")!.html;
    expect(html).not.toMatch(/<a [^>]*href="https?:\/\/[^"]*\/(guard|components)"/);
  });

  it("chart hub links every chart component and each chart page links back to the hub", () => {
    const hub = pages.get(CHARTS_HUB_HREF)!.hrefs;
    for (const slug of CHART_COMPONENT_SLUGS) expect(hub, slug).toContain(`/components/${slug}`);
    const source = readFileSync(join(root, "app", "components", "[slug]", "page.tsx"), "utf8");
    expect(source).toContain("isChartsPath(`/components/${canonicalSlug}`)");
    expect(source).toContain("href={CHARTS_HUB_HREF}");
  });

  it("noindex sub-component docs stay linked from the component directory", () => {
    const directory = pages.get("/components")!.hrefs;
    const noindexDocs = allComponents.filter((c) => getComponentIndexing(c.slug) === "noindex" && c.indexing === "noindex");
    expect(noindexDocs.length).toBeGreaterThan(0);
    for (const doc of noindexDocs) expect(directory, doc.slug).toContain(`/components/${doc.slug}`);
  });

  it("every internal link on the audited pages resolves to a real route", () => {
    const valid = new Set<string>([
      ...sitemapPaths(),
      ...allComponents.map((c) => `/components/${c.slug}`),
      "/registry.json",
      "/reference",
    ]);
    for (const [path, { hrefs }] of Array.from(pages)) {
      for (const href of hrefs) {
        const clean = href.split("?")[0];
        if (/^\/(llms|agent|r)\b/.test(clean) || clean.endsWith(".json") || clean.endsWith(".txt")) continue;
        expect(valid.has(clean), `${path} → ${href}`).toBe(true);
      }
    }
  });
});

describe("SEO-3 — breadcrumb policy", () => {
  const namesOf = (data: Record<string, unknown>) =>
    (data.itemListElement as Array<{ name: string }>).map((i) => i.name);
  const visibleTrail = (path: string) => {
    const nav = pages.get(path)!.html.match(/<nav[^>]*aria-label="Breadcrumb"[^>]*>([\s\S]*?)<\/nav>/);
    return nav ? nav[1].replace(/<[^>]+>/g, "|").split("|").map((t) => t.trim()).filter((t) => t && t !== "/") : [];
  };

  it("structured trails mirror the visible trails on charts, industries and changelog", () => {
    expect(namesOf(chartsHubBreadcrumbJsonLd())).toEqual(visibleTrail(CHARTS_HUB_HREF));
    expect(namesOf(industriesIndexBreadcrumbJsonLd())).toEqual(visibleTrail("/components/industries"));
    expect(namesOf(changelogBreadcrumbJsonLd())).toEqual(visibleTrail("/changelog"));
  });

  it("breadcrumb URLs are absolute and unique per trail", () => {
    for (const data of [chartsHubBreadcrumbJsonLd(), industriesIndexBreadcrumbJsonLd(), changelogBreadcrumbJsonLd()]) {
      const urls = (data.itemListElement as Array<{ item: string }>).map((i) => i.item);
      expect(urls.every((u) => u.startsWith("http"))).toBe(true);
      expect(new Set(urls).size).toBe(urls.length);
    }
  });

  it("BreadcrumbList appears only where a real hierarchy exists", () => {
    const has = (path: string) => pages.get(path)!.html.includes("BreadcrumbList");
    for (const path of ["/", "/docs", "/guard", "/agent-kit", "/foundations", "/components"]) {
      expect(has(path), path).toBe(false);
    }
    for (const path of [CHARTS_HUB_HREF, "/components/industries", "/changelog", "/components/category/actions", "/components/industries/banking"]) {
      expect(has(path), path).toBe(true);
    }
  });

  it("docs-only component breadcrumbs are emitted for indexable pages only", () => {
    expect(docsOnlyComponentJsonLd("icon-button")).toHaveLength(1);
    expect(docsOnlyComponentJsonLd("tree-item")).toEqual([]);
    expect(docsOnlyComponentJsonLd("button")).toEqual([]);
    const trail = docsOnlyComponentJsonLd("icon-button")[0].itemListElement as Array<{ item: string }>;
    expect(trail.at(-1)!.item).toBe(absoluteUrl("/components/icon-button"));
  });
});
