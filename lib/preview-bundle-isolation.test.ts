import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const previewsDir = join(root, "components", "previews");
const read = (rel: string) => readFileSync(join(root, rel), "utf8");

/** Module specifiers a source file imports or re-exports (formatting-agnostic). */
function importedModules(source: string): string[] {
  return Array.from(source.matchAll(/(?:import|export)\s[^;]*?from\s*["']([^"']+)["']|import\s*["']([^"']+)["']/g)).map(
    (m) => m[1] ?? m[2],
  );
}

// Previews that legitimately render chart components (and so may load Recharts).
const CHART_PREVIEWS = new Set([
  "AreaChartPreview.tsx",
  "BarChartPreview.tsx",
  "ChartCardPreview.tsx",
  "ChartMetricPreview.tsx",
  "LineChartPreview.tsx",
]);

const CHART_MODULE = /\/(AreaChart|BarChart|LineChart|ChartCard|ChartMetric|ChartFrame|cartesian-parts)$|recharts/;

const previewFiles = readdirSync(previewsDir).filter((f) => /Preview\.tsx$/.test(f));

describe("preview bundle isolation", () => {
  it("finds the preview files it is meant to guard", () => {
    expect(previewFiles.length).toBeGreaterThan(40);
    for (const name of ["DataTablePreview.tsx", "TreeViewPreview.tsx", "TimelinePreview.tsx"]) {
      expect(previewFiles).toContain(name);
    }
  });

  it("no preview imports the broad @/components/ui barrel (it re-exports the chart components)", () => {
    for (const file of previewFiles) {
      const modules = importedModules(readFileSync(join(previewsDir, file), "utf8"));
      expect(modules, file).not.toContain("@/components/ui");
      expect(modules, file).not.toContain("@/components/ui/index");
    }
  });

  it("non-chart previews import no chart modules or Recharts, so charts never load with them", () => {
    for (const file of previewFiles.filter((f) => !CHART_PREVIEWS.has(f))) {
      const modules = importedModules(readFileSync(join(previewsDir, file), "utf8"));
      expect(modules.filter((m) => CHART_MODULE.test(m)), file).toEqual([]);
    }
  });

  it("Data Table, Tree View and Timeline previews import their components directly", () => {
    const expected: Record<string, string[]> = {
      "DataTablePreview.tsx": [
        "@/components/ui/DataTableSortHeader",
        "@/components/ui/Pagination",
        "@/components/ui/Table",
      ],
      "TreeViewPreview.tsx": ["@/components/ui/TreeView"],
      "TimelinePreview.tsx": ["@/components/ui/Timeline"],
    };
    for (const [file, modules] of Object.entries(expected)) {
      expect(importedModules(readFileSync(join(previewsDir, file), "utf8")), file).toEqual(
        expect.arrayContaining(modules),
      );
    }
  });

  it("the lazy-loader architecture is unchanged: explicit per-slug import() behind React.lazy", () => {
    const source = read("components/docs/ComponentLiveSection.tsx");
    expect(source).toMatch(/import \{[^}]*\blazy\b[^}]*\} from "react"/);
    expect(source).toContain("<Suspense");
    for (const slug of ['"data-table"', '"tree-view"', "timeline", '"bar-chart"']) {
      expect(source).toContain(slug);
    }
    // Loaders are dynamic import() calls, never static preview imports.
    expect(importedModules(source).filter((m) => m.startsWith("@/components/previews/"))).toEqual([]);
    expect(source).toContain('import("@/components/previews/DataTablePreview")');
    expect(source).toContain('import("@/components/previews/BarChartPreview")');
  });
});
