import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import { brandedDocumentTitle, getComponentPageMetadata } from "@/lib/registry-seo";
import { absoluteUrl, siteConfig } from "@/lib/site-config";

const root = process.cwd();

describe("Technical SEO Batch 1 — hub canonicals and titles", () => {
  it("homepage owns the apex self-canonical; root layout does not force it", async () => {
    const layoutSource = readFileSync(join(root, "app", "layout.tsx"), "utf8");
    expect(layoutSource).not.toMatch(/alternates:\s*\{[^}]*canonical:\s*siteConfig\.origin/);
    expect(layoutSource).toContain(`template: \`%s — \${siteConfig.name}\``);
    expect(layoutSource).not.toContain(`template: \`%s — \${siteConfig.shortName}\``);

    const { metadata: home } = await import("@/app/page");
    expect(home.alternates?.canonical).toBe(siteConfig.origin);
  });

  it("/components has a unique branded title and self-canonical", async () => {
    const { metadata } = await import("@/app/components/page");
    const expectedUrl = absoluteUrl("/components");

    expect(metadata.title).toBe("Components");
    expect(metadata.openGraph?.title).toBe(brandedDocumentTitle("Components"));
    expect(metadata.openGraph?.title).not.toMatch(/Skrewww Design System — Skrewww/);
    expect(metadata.description).toBeTruthy();
    expect(metadata.description).not.toBe(siteConfig.description);
    expect(metadata.alternates?.canonical).toBe(expectedUrl);
    expect(metadata.alternates?.canonical).not.toBe(siteConfig.origin);
  });

  it("/components/industries has a self-canonical (not homepage)", async () => {
    const { metadata } = await import("@/app/components/industries/page");
    const expectedUrl = absoluteUrl("/components/industries");

    expect(metadata.title).toBe("Industries");
    expect(metadata.openGraph?.title).toBe(brandedDocumentTitle("Industries"));
    expect(metadata.alternates?.canonical).toBe(expectedUrl);
    expect(metadata.alternates?.canonical).not.toBe(siteConfig.origin);
  });

  it("component metadata does not pre-bake a double brand suffix", () => {
    const metadata = getComponentPageMetadata("button");
    expect(metadata.title).toBe("Button");
    expect(String(metadata.title)).not.toContain("Skrewww Design System");
    expect(metadata.openGraph?.title).toBe("Button — Skrewww Design System");
    expect(String(metadata.openGraph?.title)).not.toMatch(/Skrewww Design System — Skrewww/);
    expect(metadata.alternates?.canonical).toBe(absoluteUrl("/components/button"));
  });

  it("category titles are short; OG carries a single brand suffix", async () => {
    const { generateMetadata } = await import("@/app/components/category/[categorySlug]/page");
    const metadata = await generateMetadata({
      params: Promise.resolve({ categorySlug: "navigation" }),
    });

    expect(metadata.title).toBe("Navigation components");
    expect(metadata.openGraph?.title).toBe("Navigation components — Skrewww Design System");
    expect(String(metadata.openGraph?.title)).not.toMatch(/Skrewww Design System — Skrewww/);
    expect(metadata.alternates?.canonical).toBe(absoluteUrl("/components/category/navigation"));
  });

  it("industry detail titles are short; OG carries a single brand suffix", async () => {
    const { generateMetadata } = await import("@/app/components/industries/[industrySlug]/page");
    const metadata = await generateMetadata({
      params: Promise.resolve({ industrySlug: "banking" }),
    });

    expect(metadata.title).toBe("Banking components");
    expect(metadata.openGraph?.title).toBe("Banking components — Skrewww Design System");
    expect(String(metadata.openGraph?.title)).not.toMatch(/Skrewww Design System — Skrewww/);
    expect(metadata.alternates?.canonical).toBe(absoluteUrl("/components/industries/banking"));
  });

  it("changelog title is short so the root template brands once", () => {
    const source = readFileSync(join(root, "app", "changelog", "page.tsx"), "utf8");
    expect(source).toContain('const pageTitle = "Changelog"');
    expect(source).toContain("title: pageTitle");
    expect(source).toContain("...pageSocialMetadata({ title, description, url })");
    expect(source).toContain('alternates: { canonical: url }');
    expect(source).toContain('absoluteUrl("/changelog")');
  });

  it("absolute-title pages remain single-branded", () => {
    for (const rel of ["app/foundations/page.tsx", "app/agent-kit/page.tsx", "app/guard/page.tsx"]) {
      const source = readFileSync(join(root, rel), "utf8");
      expect(source).toContain("title: { absolute: title }");
      expect(existsSync(join(root, rel))).toBe(true);
    }
  });
});

describe("Technical SEO Batch 1 — robots crawler access", () => {
  it("does not blanket-disallow /_next/ for generic crawlers", () => {
    const config = robots();
    const rules = Array.isArray(config.rules) ? config.rules : [config.rules];
    const generic = rules.find((rule) => {
      const ua = rule.userAgent;
      return ua === "*" || (Array.isArray(ua) && ua.includes("*"));
    });
    expect(generic).toBeDefined();
    const disallow = generic?.disallow;
    const list = Array.isArray(disallow) ? disallow : disallow ? [disallow] : [];
    expect(list).not.toContain("/_next/");
    expect(list).toContain("/api/");
    expect(list).toContain("/preview/");
  });

  it("preserves GPTBot block and OAI-SearchBot allow", () => {
    const config = robots();
    const rules = Array.isArray(config.rules) ? config.rules : [config.rules];
    const gpt = rules.find((rule) => {
      const ua = rule.userAgent;
      return ua === "GPTBot" || (Array.isArray(ua) && ua.includes("GPTBot"));
    });
    const oai = rules.find((rule) => {
      const ua = rule.userAgent;
      return ua === "OAI-SearchBot" || (Array.isArray(ua) && ua.includes("OAI-SearchBot"));
    });

    expect(gpt?.disallow).toEqual("/");
    expect(oai?.allow).toEqual("/");
    expect(config.sitemap).toBe(absoluteUrl("/sitemap.xml"));
  });
});
