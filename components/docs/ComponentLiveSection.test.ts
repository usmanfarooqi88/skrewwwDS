import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  hasLivePreviewLoader,
  previewLoaders,
  previewSlugs,
} from "@/components/docs/ComponentLiveSection";
import {
  getImplementedRegistryEntries,
  getRegistryEntry,
  hasLiveImplementation,
} from "@/lib/component-registry";
import { getComponentBySlug } from "@/lib/data";

const root = process.cwd();
const liveSectionPath = join(root, "components", "docs", "ComponentLiveSection.tsx");
const liveSectionSource = readFileSync(liveSectionPath, "utf8");

/** Slug keys declared on previewLoaders (source parse for architecture guards). */
function parsePreviewSlugs(source: string): string[] {
  const block = source.match(/export const previewLoaders = \{([\s\S]*?)\n\} as const/);
  expect(block, "previewLoaders object").toBeTruthy();
  const slugs: string[] = [];
  const re = /^\s*(?:([A-Za-z][A-Za-z0-9_-]*)|"([^"]+)")\s*:\s*\(\)\s*=>/gm;
  let match: RegExpExecArray | null;
  while ((match = re.exec(block![1]))) {
    slugs.push(match[1] ?? match[2]);
  }
  return slugs;
}

describe("Performance Batch 1 — ComponentLiveSection per-slug isolation", () => {
  const parsedSlugs = parsePreviewSlugs(liveSectionSource);

  it("does not statically import preview modules (only dynamic import() loaders)", () => {
    expect(liveSectionSource).toMatch(/\blazy\b/);
    expect(liveSectionSource).toContain('from "react"');
    expect(liveSectionSource).toMatch(/import\("/);
    expect(liveSectionSource).not.toContain('import dynamic from "next/dynamic"');
    expect(liveSectionSource).not.toMatch(
      /^import\s+\{[^}]+\}\s+from\s+"@\/components\/previews\//m,
    );
    // Guard against overly-broad variable import contexts.
    expect(liveSectionSource).not.toMatch(/import\(`@\/components\/previews\/\$\{/);
  });

  it("registers an explicit dynamic import() for every preview slug, including heavy ones", () => {
    expect(parsedSlugs.length).toBeGreaterThan(40);
    expect(parsedSlugs).toEqual(expect.arrayContaining(["button", "checkbox", "radio", "radio-group", "textarea"]));

    for (const heavy of [
      "DataTablePreview",
      "TablePreview",
      "CalendarGridPreview",
      "BarChartPreview",
      "LineChartPreview",
      "ComboboxPreview",
      "TreeViewPreview",
      "BankingBalanceSummaryPreview",
    ]) {
      expect(liveSectionSource).toContain(`import("@/components/previews/${heavy}")`);
    }
  });

  it("covers every implemented registry entry with hasPreview", () => {
    for (const entry of getImplementedRegistryEntries()) {
      if (!entry.hasPreview) continue;
      expect(previewSlugs).toContain(entry.slug);
      expect(hasLivePreviewLoader(entry.slug)).toBe(true);
    }
  });

  it("points each loader at an existing preview module file", () => {
    const previewFiles = new Set(
      readdirSync(join(root, "components", "previews")).filter((name) =>
        name.endsWith("Preview.tsx"),
      ),
    );

    for (const slug of previewSlugs) {
      const escaped = slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const sourceMatch = liveSectionSource.match(
        new RegExp(
          `(?:${escaped}|"${escaped}")\\s*:\\s*\\(\\)\\s*=>\\s*(?:\\n\\s*)?import\\("@/components/previews/([^"]+)"\\)`,
        ),
      );
      expect(sourceMatch?.[1], `loader path for ${slug}`).toBeTruthy();
      expect(previewFiles.has(`${sourceMatch![1]}.tsx`)).toBe(true);
      expect(typeof previewLoaders[slug]).toBe("function");
    }
  });

  it("resolves live slugs and safely skips docs-only / unknown slugs", () => {
    expect(hasLivePreviewLoader("button")).toBe(true);
    expect(hasLivePreviewLoader("checkbox")).toBe(true);
    expect(hasLivePreviewLoader("data-table")).toBe(true);
    expect(hasLiveImplementation("button")).toBe(true);

    // Docs-only Figma-facing entry — no live preview loader.
    expect(getComponentBySlug("tree-item")).toBeDefined();
    expect(getRegistryEntry("tree-item")).toBeUndefined();
    expect(hasLivePreviewLoader("tree-item")).toBe(false);
    expect(hasLiveImplementation("tree-item")).toBe(false);

    expect(hasLivePreviewLoader("not-a-real-component")).toBe(false);
  });

  it("reserves preview space while loading (no null Suspense fallback)", () => {
    expect(liveSectionSource).toContain("PreviewLoadingFallback");
    expect(liveSectionSource).toContain("min-h-[14rem]");
    expect(liveSectionSource).not.toMatch(/fallback=\{null\}/);
  });
});
