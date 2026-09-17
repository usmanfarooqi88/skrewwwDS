import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildLlmsTxt, buildLlmsFullTxt } from "@/lib/llms-content";
import { changelogEntries } from "@/content/changelog";
import { buildSitemapEntries } from "@/lib/sitemap-data";
import { absoluteUrl } from "@/lib/site-config";
import { GUARD_RELEASE_STAGE, GUARD_TOOL_VERSION } from "@/lib/guard/version";
import { primaryNavLinks } from "@/lib/sidebar-nav";

const root = process.cwd();

describe("Guard Beta — discoverable in public docs surfaces", () => {
  it("the docs page route exists", () => {
    expect(existsSync(join(root, "app", "guard", "page.tsx"))).toBe(true);
  });

  it("is linked from the sitemap", () => {
    const urls = buildSitemapEntries().map((entry) => entry.url);
    expect(urls).toContain(absoluteUrl("/guard"));
  });

  it("is discoverable from llms.txt", () => {
    const llms = buildLlmsTxt();
    expect(llms).toContain(absoluteUrl("/guard"));
    expect(llms).toMatch(/@skrewww\/guard@beta/);
    expect(llms).toContain("component/nonexistent-slug");
  });

  it("llms-full.txt also carries the Guard section", () => {
    expect(buildLlmsFullTxt()).toContain(absoluteUrl("/guard"));
  });

  it("has a changelog entry without internal jargon or commit SHAs", () => {
    const entry = changelogEntries.find((candidate) => candidate.id === "2026-09-guard-beta");
    expect(entry).toBeDefined();
    expect(entry!.title).toMatch(/Guard/i);
    expect(entry!.items.length).toBeGreaterThan(0);
    for (const item of entry!.items) {
      expect(item.text).not.toMatch(/\b[0-9a-f]{7,40}\b/);
      expect(item.text).not.toMatch(/\bG-\d\b/);
    }
  });

  it("is in primary nav with a temporary NEW badge", () => {
    expect(primaryNavLinks).toContainEqual({
      label: "Guard",
      href: "/guard",
      badge: "new",
    });
  });
});

describe("Guard Beta — version on public docs page", () => {
  it("product version is a Beta semver string", () => {
    expect(GUARD_TOOL_VERSION).toMatch(/^\d+\.\d+\.\d+-beta\.\d+$/);
    expect(GUARD_RELEASE_STAGE).toBe("beta");
  });

  it("is referenced on the public docs page", () => {
    const pageSource = readFileSync(join(root, "app", "guard", "page.tsx"), "utf8");
    expect(pageSource).toContain("GUARD_TOOL_VERSION");
    expect(pageSource).toContain("@skrewww/guard@beta");
    expect(pageSource).toContain("component/nonexistent-slug");
  });

  it("GitHub references on the Guard page point at the real public repository", () => {
    const pageSource = readFileSync(join(root, "app", "guard", "page.tsx"), "utf8");
    const matches = pageSource.match(/github\.com\/[\w-]+\/skrewwwDS(\/[\w./-]*)?/gi) ?? [];
    expect(matches.length).toBeGreaterThan(0);
    for (const match of matches) {
      expect(match).toMatch(
        /^github\.com\/usmanfarooqi88\/skrewwwDS\/(releases\/tag\/guard-v0\.1\.0-beta\.1|issues)$/i,
      );
    }
  });
});
