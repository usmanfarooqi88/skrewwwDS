import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getImplementedRegistryEntries } from "@/lib/component-registry";

const root = process.cwd();
const liveSectionPath = join(root, "components", "docs", "ComponentLiveSection.tsx");
const liveSectionSource = readFileSync(liveSectionPath, "utf8");

/** Slug keys declared on previewLoaders (source parse; avoids loading next/dynamic). */
function parsePreviewSlugs(source: string): string[] {
  const block = source.match(/export const previewLoaders = \{([\s\S]*?)\n\} as const/);
  expect(block, "previewLoaders object").toBeTruthy();
  const slugs: string[] = [];
  // Only top-level loader keys: `slug: () =>` or `"slug": () =>`
  const re = /^\s*(?:([A-Za-z][A-Za-z0-9_-]*)|"([^"]+)")\s*:\s*\(\)\s*=>/gm;
  let match: RegExpExecArray | null;
  while ((match = re.exec(block![1]))) {
    slugs.push(match[1] ?? match[2]);
  }
  return slugs;
}

describe("Performance Batch 1 — ComponentLiveSection per-slug isolation", () => {
  const previewSlugs = parsePreviewSlugs(liveSectionSource);

  it("does not statically import preview modules (only dynamic import() loaders)", () => {
    expect(liveSectionSource).toMatch(/\blazy\b/);
    expect(liveSectionSource).toContain('from "react"');
    expect(liveSectionSource).toMatch(/import\("/);
    expect(liveSectionSource).not.toContain('import dynamic from "next/dynamic"');
    expect(liveSectionSource).not.toMatch(
      /^import\s+\{[^}]+\}\s+from\s+"@\/components\/previews\//m,
    );
  });

  it("registers an explicit dynamic import() for every preview slug, including heavy ones", () => {
    expect(previewSlugs.length).toBeGreaterThan(40);
    expect(previewSlugs).toContain("button");
    expect(previewSlugs).toContain("checkbox");
    expect(previewSlugs).toContain("radio");
    expect(previewSlugs).toContain("radio-group");
    expect(previewSlugs).toContain("textarea");

    for (const slug of previewSlugs) {
      expect(liveSectionSource).toMatch(
        new RegExp(
          `(?:${slug}|"${slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}")\\s*:\\s*\\(\\)\\s*=>`,
        ),
      );
    }

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
      expect(liveSectionSource).toContain(
        `import("@/components/previews/${heavy}")`,
      );
    }
  });

  it("covers every implemented registry entry with hasPreview", () => {
    for (const entry of getImplementedRegistryEntries()) {
      if (!entry.hasPreview) continue;
      expect(
        previewSlugs,
        `missing preview loader for implemented previewable slug: ${entry.slug}`,
      ).toContain(entry.slug);
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
    }
  });

  it("lazily constructs previews via React.lazy loaders (not static imports)", () => {
    expect(liveSectionSource).toContain("lazyPreviews");
    expect(liveSectionSource).toContain("<Suspense");
    expect(liveSectionSource).toMatch(/\blazy\(/);
    // Must not use next/dynamic module-level registration of every preview.
    expect(liveSectionSource).not.toContain('import dynamic from "next/dynamic"');
  });
});
