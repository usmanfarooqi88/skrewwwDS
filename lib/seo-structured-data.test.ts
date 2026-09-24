import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import { getImplementedRegistryEntries } from "@/lib/component-registry";
import { getSitemapUrls } from "@/lib/sitemap-data";
import { componentPageJsonLd, siteStructuredData } from "@/lib/structured-data";
import { absoluteUrl, siteConfig } from "@/lib/site-config";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf8");

function sourceFiles(dir: string): string[] {
  return readdirSync(join(root, dir)).flatMap((name) => {
    const rel = `${dir}/${name}`;
    return statSync(join(root, rel)).isDirectory()
      ? sourceFiles(rel)
      : /\.(ts|tsx)$/.test(name) && !/\.test\./.test(name)
        ? [rel]
        : [];
  });
}

describe("SEO-1B — structured data scope", () => {
  it("site-level entities are rendered by the homepage, not the root layout", () => {
    expect(read("app/layout.tsx")).not.toMatch(/JsonLd|siteStructuredData/);
    const home = read("app/page.tsx");
    expect(home).toContain("<JsonLd data={siteStructuredData()} />");
  });

  it("no /reference route can emit JSON-LD", () => {
    for (const file of sourceFiles("app/reference")) {
      expect(read(file), file).not.toMatch(/JsonLd|application\/ld\+json|structured-data/);
    }
    expect(read("app/reference/layout.tsx")).toContain("index: false");
    expect(read("app/reference/layout.tsx")).toContain("follow: false");
  });

  it("only indexable page families render JSON-LD", () => {
    const renderers = sourceFiles("app").filter((f) => /<JsonLd/.test(read(f)));
    expect(renderers.sort()).toEqual(
      [
        "app/components/[slug]/page.tsx",
        "app/components/category/[categorySlug]/page.tsx",
        "app/components/industries/[industrySlug]/page.tsx",
        "app/page.tsx",
      ].sort(),
    );
  });

  it("site-level JSON-LD is deterministic, serialisable and truthful", () => {
    const first = JSON.stringify(siteStructuredData());
    expect(JSON.stringify(siteStructuredData())).toBe(first);
    const parsed = JSON.parse(first) as Array<Record<string, unknown>>;
    expect(parsed.map((e) => e["@type"])).toEqual(["Organization", "WebSite", "SoftwareApplication"]);
    for (const entry of parsed) {
      expect(entry["@context"]).toBe("https://schema.org");
      expect(String(entry.url)).toMatch(/^https?:\/\//);
    }
    // Free and paid surfaces coexist (registry vs Figma Pro): no truthful single Offer.
    expect(first).not.toMatch(/"offers"|"price"|aggregateRating/);
  });

  it("changelog is a listing page and does not claim to be a TechArticle", () => {
    expect(read("app/changelog/page.tsx")).not.toMatch(/TechArticle|JsonLd/);
  });

  it("component TechArticle dates are consistent for every implemented component", () => {
    for (const entry of getImplementedRegistryEntries()) {
      const [breadcrumbs, article] = componentPageJsonLd(entry.slug);
      expect(breadcrumbs["@type"], entry.slug).toBe("BreadcrumbList");
      expect(article["@type"], entry.slug).toBe("TechArticle");
      expect(String(article.dateModified) >= String(article.datePublished), entry.slug).toBe(true);
      expect(String(article.url)).toBe(absoluteUrl(`/components/${entry.slug}`));
    }
  });
});

describe("SEO-1B — robots and sitemap hygiene", () => {
  it("every Disallow path targets something that exists in the app or public folder", () => {
    const rules = robots().rules;
    const list = Array.isArray(rules) ? rules : [rules];
    for (const rule of list) {
      const paths = Array.isArray(rule.disallow) ? rule.disallow : rule.disallow ? [rule.disallow] : [];
      for (const path of paths) {
        if (path === "/") continue; // full-site block for a named crawler (GPTBot)
        const segment = path.replace(/^\/|\/$/g, "");
        expect(existsSync(join(root, "app", segment)) || existsSync(join(root, "public", segment)), path).toBe(true);
      }
    }
  });

  it("sitemap keeps noindex and machine routes out and public docs in", () => {
    const urls = getSitemapUrls();
    expect(urls.some((u) => /\/(reference|r|agent|api|preview)(\/|$)/.test(new URL(u).pathname))).toBe(false);
    expect(urls.some((u) => /\.json$|llms/.test(u))).toBe(false);
    for (const path of ["/", "/components", "/foundations", "/guard", "/agent-kit", "/changelog", "/docs"]) {
      expect(urls).toContain(absoluteUrl(path));
    }
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls.every((u) => u.startsWith(siteConfig.origin))).toBe(true);
  });
});
