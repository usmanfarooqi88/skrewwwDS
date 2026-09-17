import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  compileAllContracts,
  getPublicAgentContractCount,
} from "@/lib/agent-kit/contract-compiler";
import {
  componentRegistry,
  getImplementedMaturityCounts,
  getImplementedRegistryEntries,
  getMaxRegistryContentDate,
  getRegistryEntry,
  getRegistryEntryContentDate,
} from "@/lib/component-registry";
import { changelogEntries, getSortedChangelogEntries } from "@/content/changelog";
import { buildSitemapEntries, getSitemapUrls } from "@/lib/sitemap-data";
import { absoluteUrl, siteConfig } from "@/lib/site-config";

const root = process.cwd();

const MACHINE_ENDPOINTS = [
  "/llms.txt",
  "/llms-full.txt",
  "/registry.json",
  "/agent/index.json",
] as const;

const HUMAN_LANDING_PAGES = [
  "/",
  "/components",
  "/components/button",
  "/foundations",
  "/agent-kit",
  "/guard",
  "/changelog",
  "/components/industries",
  "/components/industries/banking",
] as const;

describe("Technical SEO Batch 2 — homepage maturity counts", () => {
  it("derives Stable/Beta/implemented from the canonical registry (no hardcoded tallies)", () => {
    const counts = getImplementedMaturityCounts();
    const entries = getImplementedRegistryEntries();
    const stable = entries.filter((entry) => entry.status === "stable").length;
    const beta = entries.filter((entry) => entry.status === "beta").length;

    expect(counts.implemented).toBe(entries.length);
    expect(counts.stable).toBe(stable);
    expect(counts.beta).toBe(beta);

    const pageSource = readFileSync(join(root, "app", "page.tsx"), "utf8");
    expect(pageSource).toContain("getImplementedMaturityCounts");
    expect(pageSource).not.toMatch(/\(27 Stable · 20 Beta\)/);
  });
});

describe("Technical SEO Batch 2 — Agent Kit contract count", () => {
  it("matches compileAllContracts inventory without hardcoding", () => {
    const { index } = compileAllContracts({
      sourceGitSha: "seo-batch2-count",
      sourceGitCommitTimestamp: "1970-01-01T00:00:00.000Z",
    });
    expect(getPublicAgentContractCount()).toBe(index.totalComponents);
    expect(getPublicAgentContractCount()).toBe(index.components.length);

    const pageSource = readFileSync(join(root, "app", "agent-kit", "page.tsx"), "utf8");
    expect(pageSource).toContain("getPublicAgentContractCount");
    expect(pageSource).not.toMatch(/47 component contracts/);
  });
});

describe("Technical SEO Batch 2 — sitemap membership", () => {
  it("excludes machine-only endpoints while keeping human landing pages", () => {
    const urls = getSitemapUrls();

    for (const path of MACHINE_ENDPOINTS) {
      expect(urls).not.toContain(absoluteUrl(path));
    }
    for (const path of HUMAN_LANDING_PAGES) {
      expect(urls).toContain(absoluteUrl(path));
    }
  });

  it("uses HTTPS apex URLs only — no www, http, or query parameters", () => {
    expect(siteConfig.origin).toMatch(/^https:\/\//);
    expect(siteConfig.origin).not.toMatch(/\/\/www\./);

    for (const url of getSitemapUrls()) {
      expect(url.startsWith(siteConfig.origin)).toBe(true);
      expect(url).not.toMatch(/^http:/);
      expect(url).not.toMatch(/\/\/www\./);
      expect(url).not.toContain("?");
    }
  });
});

describe("Technical SEO Batch 2 — sitemap lastModified strategy", () => {
  it("uses route-level content dates and omits foundations rather than a blanket site date", () => {
    const entries = buildSitemapEntries();
    const byPath = new Map(
      entries.map((entry) => {
        const path = entry.url.replace(siteConfig.origin, "") || "/";
        return [path, entry] as const;
      }),
    );

    const expectedCatalog = getMaxRegistryContentDate(componentRegistry);
    const agentKitDate = changelogEntries.find((e) => e.id === "2026-09-agent-kit-beta")?.date;
    const guardDate = changelogEntries.find((e) => e.id === "2026-09-guard-beta")?.date;
    const changelogDate = getSortedChangelogEntries()[0]?.date;
    const buttonEntry = getRegistryEntry("button");

    expect(byPath.get("/")?.lastModified).toBe(expectedCatalog);
    expect(byPath.get("/components")?.lastModified).toBe(expectedCatalog);
    expect(byPath.get("/foundations")?.lastModified).toBeUndefined();
    expect(byPath.get("/agent-kit")?.lastModified).toBe(agentKitDate);
    expect(byPath.get("/guard")?.lastModified).toBe(guardDate);
    expect(byPath.get("/changelog")?.lastModified).toBe(changelogDate);
    expect(buttonEntry).toBeDefined();
    expect(byPath.get("/components/button")?.lastModified).toBe(
      getRegistryEntryContentDate(buttonEntry!),
    );

    for (const entry of entries) {
      if (entry.lastModified) {
        // No build/request-time ISO timestamps.
        expect(String(entry.lastModified)).not.toMatch(/T\d{2}:\d{2}/);
      }
    }

    // Former blanket siteConfig.lastUpdated must not drive unrelated hubs.
    expect(String(byPath.get("/")?.lastModified ?? "")).not.toBe(siteConfig.lastUpdated);
    expect(String(byPath.get("/components")?.lastModified ?? "")).not.toBe(
      siteConfig.lastUpdated,
    );
    expect(String(byPath.get("/agent-kit")?.lastModified ?? "")).not.toBe(
      siteConfig.lastUpdated,
    );
    expect(String(byPath.get("/guard")?.lastModified ?? "")).not.toBe(siteConfig.lastUpdated);
  });
});
