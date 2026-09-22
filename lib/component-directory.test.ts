import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { getImplementedRegistryEntries } from "@/lib/component-registry";
import { CHART_COMPONENT_SLUGS } from "@/lib/global-nav";
import { categories } from "@/lib/types";
import {
  getCategoryDirectoryEntries,
  getComponentDirectoryGroups,
  getComponentDirectoryStats,
} from "@/lib/component-directory";

describe("component directory model", () => {
  it("preserves the canonical categories and derives non-empty groups", () => {
    const groups = getComponentDirectoryGroups();
    expect(groups.map((group) => group.category)).toEqual(categories);
    expect(groups.every((group) => group.entries.length > 0)).toBe(true);
    expect(groups.map((group) => group.href)).toEqual([
      "/components/category/actions",
      "/components/category/forms",
      "/components/category/navigation",
      "/components/category/feedback",
      "/components/category/containers-overlays",
      "/components/category/content-data",
    ]);
  });

  it("sorts every category alphabetically without mutating canonical registry order", () => {
    for (const group of getComponentDirectoryGroups()) {
      expect(group.entries.map((entry) => entry.name)).toEqual(
        group.entries.map((entry) => entry.name).toSorted((a, b) => a.localeCompare(b, "en")),
      );
    }
  });

  it("uses canonical maturity and supports no invented status", () => {
    const stats = getComponentDirectoryStats();
    const implemented = getImplementedRegistryEntries();
    expect(stats).toMatchObject({
      implemented: implemented.length,
      stable: implemented.filter((entry) => entry.status === "stable").length,
      beta: implemented.filter((entry) => entry.status === "beta").length,
    });
    const statuses = new Set(
      getComponentDirectoryGroups({ includeCharts: true }).flatMap((group) =>
        group.entries.map((entry) => entry.status),
      ),
    );
    expect(statuses).toEqual(new Set(["stable", "beta", "docs-only"]));
  });

  it("keeps documentation-only patterns visible but explicitly non-implemented", () => {
    const docsOnly = getComponentDirectoryGroups({ includeCharts: true })
      .flatMap((group) => group.entries)
      .filter((entry) => entry.status === "docs-only");
    expect(docsOnly).toHaveLength(10);
    expect(docsOnly.every((entry) => !entry.implemented)).toBe(true);
    expect(docsOnly.map((entry) => entry.slug)).toContain("sidebar-nav-item");
    expect(docsOnly.map((entry) => entry.slug)).not.toContain("accordion-item");
  });

  it("moves chart discovery to its dedicated hub on the main directory only", () => {
    const mainSlugs = getComponentDirectoryGroups().flatMap((group) =>
      group.entries.map((entry) => entry.slug),
    );
    for (const slug of CHART_COMPONENT_SLUGS) expect(mainSlugs).not.toContain(slug);

    const categoryPageSlugs = categories.flatMap((category) =>
      getCategoryDirectoryEntries(category).map((entry) => entry.slug),
    );
    for (const slug of CHART_COMPONENT_SLUGS) expect(categoryPageSlugs).toContain(slug);
  });

  it("keeps industry components out of every generic category", () => {
    const slugs = getComponentDirectoryGroups({ includeCharts: true }).flatMap((group) =>
      group.entries.map((entry) => entry.slug),
    );
    expect(slugs).not.toContain("banking-account-card");
    expect(getComponentDirectoryStats().industries).toBe(3);
  });

  it("keeps directory presentation free of implementations, previews, Recharts, and Reference App code", () => {
    const sources = [
      "app/components/page.tsx",
      "components/docs/ComponentDirectoryList.tsx",
      "lib/component-directory.ts",
    ].map((path) => readFileSync(`${process.cwd()}/${path}`, "utf8")).join("\n");
    expect(sources).not.toMatch(/components\/ui|components\/previews|components\/reference-app|recharts/i);
  });
});
