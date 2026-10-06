import { expect, test } from "./fixtures";
import { getComponentBySlug } from "../lib/data";
import { getRegistryEntry } from "../lib/component-registry";
import { getComponentIndexing } from "../lib/indexing-policy";
import { resolveSection } from "../lib/section-nav";
import { sectionNavModels } from "../lib/section-nav-models";
import { getSitemapUrls } from "../lib/sitemap-data";
import { siteConfig } from "../lib/site-config";

const cases = [
  { path: "/", title: "Skrewww Design System", h1: "One foundation.Every surface.", types: ["Organization", "WebSite", "SoftwareApplication"] },
  { path: "/components", title: "Components — Skrewww Design System", h1: "Components", types: [] },
  ...["combobox", "progress-bar", "banking-account-card", "bar-chart", "file-upload", "menu-item"].map((slug) => {
    const doc = getComponentBySlug(slug)!;
    return {
      path: `/components/${slug}`,
      title: `${doc.name} — Skrewww Design System`,
      h1: doc.name,
      types: getComponentIndexing(slug) === "index" ? ["BreadcrumbList", "TechArticle"] : [],
    };
  }),
];

function objects(value: unknown): Array<Record<string, unknown>> {
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap(objects);
  return [value as Record<string, unknown>, ...Object.values(value).flatMap(objects)];
}

test.describe("server-rendered SEO and contextual navigation", () => {
  for (const route of cases) {
    test(`${route.path} preserves metadata, schema, index policy, and navigation before hydration`, async ({ page, request }) => {
      const response = await request.get(route.path);
      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toContain("text/html");
      expect(response.headers()["x-robots-tag"] ?? "").not.toMatch(/noindex/i);

      // Parse the actual HTTP body in an inert document. No page scripts or
      // hydration can manufacture links, metadata, or article text here.
      const raw = await page.evaluate((html) => {
        const doc = new DOMParser().parseFromString(html, "text/html");
        const values = (selector: string, attribute?: string) =>
          Array.from(doc.querySelectorAll(selector), (el) =>
            attribute ? el.getAttribute(attribute) : el.textContent?.trim(),
          );
        const schemas = values('script[type="application/ld+json"]').map((value) => JSON.parse(value!));
        // Serialized props in scripts are not server-rendered documentation.
        doc.querySelectorAll("script, style, template").forEach((el) => el.remove());
        return {
          titles: values("title"),
          descriptions: values('meta[name="description"]', "content"),
          canonicals: values('link[rel="canonical"]', "href"),
          robots: values('meta[name="robots"]', "content"),
          h1: values("h1"),
          main: doc.querySelector("main")?.textContent ?? "",
          schemas,
          sidebars: values("aside", "aria-label"),
          sidebarLinks: values("aside a[href]", "href"),
          globalLinks: values('nav[aria-label="Global"] a[href]', "href"),
          mainLinks: values("main a[href]", "href"),
        };
      }, await response.text());

      const canonical = new URL(route.path, "https://skrewww.com").href;
      expect(raw.titles).toEqual([route.title]);
      expect(raw.titles[0]!.split("Skrewww Design System")).toHaveLength(2);
      expect(raw.descriptions).toHaveLength(1);
      expect(raw.descriptions[0]!.trim()).not.toBe("");
      expect(raw.canonicals.map((url) => new URL(url!).href)).toEqual([canonical]);
      expect(raw.h1).toEqual([route.h1]);
      expect(raw.main.trim().length).toBeGreaterThan(100);

      const slug = route.path.split("/")[2];
      const indexed = !slug || getComponentIndexing(slug) === "index";
      expect(raw.robots.join(",").includes("noindex")).toBe(!indexed);
      if (slug) {
        expect(raw.robots).toEqual([indexed ? "index, follow" : "noindex, follow"]);
        const doc = getComponentBySlug(slug)!;
        expect(raw.main).toContain(doc.purpose);
        expect(raw.descriptions).toEqual([getRegistryEntry(slug)?.summary ?? doc.purpose]);
        const entry = getRegistryEntry(slug);
        for (const link of entry?.relatedComponents ?? []) expect(raw.mainLinks).toContain(link.href);
        if (entry) expect(raw.main).toContain(entry.reactExample);
      } else if (route.path === "/") {
        expect(raw.descriptions).toEqual([siteConfig.description]);
      }

      expect(raw.schemas.map((schema) => schema["@type"])).toEqual(route.types);
      const nodes = objects(raw.schemas);
      const organizations = nodes.filter((node) => node["@type"] === "Organization");
      expect(organizations).toHaveLength(route.types.length ? 1 : 0);
      for (const organization of organizations) {
        expect(organization).toMatchObject({
          "@id": "https://skrewww.com/#organization",
          logo: "https://skrewww.com/logo.svg",
          name: "Skrewww",
        });
      }
      for (const type of ["WebSite", "WebPage", "TechArticle"]) {
        expect(nodes.filter((node) => node["@type"] === type).length).toBeLessThanOrEqual(1);
      }
      for (const node of nodes.filter((node) => node["@type"] === "TechArticle")) {
        expect(node.url).toBe(canonical);
        expect(node.mainEntityOfPage).toBe(canonical);
      }

      const section = resolveSection(route.path);
      const model = section ? sectionNavModels[section] : null;
      expect(raw.sidebars).toEqual(model ? [`${model.label} section sidebar`] : []);
      expect(raw.sidebarLinks).toEqual(model ? model.groups.flatMap((group) => group.items.map((item) => item.href)) : []);
      expect(raw.globalLinks).toEqual(expect.arrayContaining(["/docs", "/components", "/components/charts", "/agent-kit"]));

      // Hydration must preserve the canonical links and indexing metadata.
      await page.goto(route.path);
      await expect(page).toHaveTitle(route.title);
      expect(await page.locator("aside a[href]").evaluateAll((links) => links.map((link) => link.getAttribute("href")))).toEqual(raw.sidebarLinks);
      expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toBe(raw.canonicals[0]);
      expect(await page.locator('meta[name="robots"]').evaluateAll((tags) => tags.map((tag) => tag.getAttribute("content")))).toEqual(raw.robots);
    });
  }

  test("sitemap membership and robots policy match the canonical registry", async ({ request }) => {
    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.status()).toBe(200);
    const urls = Array.from((await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g), (match) => match[1]);
    expect(urls).toEqual(getSitemapUrls());
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls).not.toContain("https://skrewww.com/components/menu-item");
    for (const route of cases.filter((route) => route.path !== "/components/menu-item")) {
      expect(urls.map((url) => new URL(url).href)).toContain(new URL(route.path, "https://skrewww.com").href);
    }

    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);
    const robots = await response.text();
    const general = robots.split(/User-Agent:\s*\*/i)[1]?.split(/User-Agent:/i)[0];
    expect(general).toContain("Allow: /");
    expect(general).not.toMatch(/Disallow:/i);
    expect(robots).not.toContain("Disallow: /_next/");
    expect(robots).toContain("Sitemap: https://skrewww.com/sitemap.xml");
    expect(robots).toMatch(/User-Agent: GPTBot\s+Disallow: \//);
  });
});
