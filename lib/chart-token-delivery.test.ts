import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CHART_SERIES_COLORS } from "@/components/ui/internal/chart-data";
import { componentRegistry } from "@/lib/component-registry";
import {
  buildAreaChartManifest,
  buildBarChartManifest,
  buildFoundationManifest,
  buildLineChartManifest,
  type ShadcnRegistryItem,
} from "@/lib/shadcn-registry-generator";

/**
 * Consumer-facing proof for chart token delivery (CH-1, extended in CH-2).
 *
 * CH-0 found that the charts referenced custom properties that lived only in
 * styles/tokens.css's component tier — which the shadcn Foundation transport does
 * not include — so a consumer received chart code pointing at undefined variables
 * (black bars, an invisible line). All three Cartesian charts now share one
 * component-owned stylesheet (components/ui/internal/chart.module.css) that ships
 * with each of them. These tests inspect the *transported* payload (the bytes a
 * consumer installs) rather than repo source, so they fail if a chart variable is
 * referenced but never delivered.
 *
 * They read the pure generator output, not public/r, so they hold on a clean checkout.
 */

const CHARTS = ["bar-chart", "line-chart", "area-chart"] as const;
const manifests: Record<(typeof CHARTS)[number], ShadcnRegistryItem> = {
  "bar-chart": buildBarChartManifest(),
  "line-chart": buildLineChartManifest(),
  "area-chart": buildAreaChartManifest(),
};

const SERIES_TOKENS = CHART_SERIES_COLORS.map((color) => `--chart-${color}`);
const COLOR_TOKENS = [
  ...SERIES_TOKENS,
  "--chart-axis-text",
  "--chart-grid",
  "--chart-baseline",
  "--chart-marker-fill",
  "--chart-cursor",
  "--chart-tooltip-surface",
  "--chart-tooltip-border",
  "--chart-tooltip-text",
  "--chart-tooltip-text-muted",
];
const OTHER_TOKENS = ["--chart-tooltip-shadow", "--chart-tooltip-radius"];

function declarations(css: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const match of Array.from(css.matchAll(/(--[a-zA-Z0-9-]+)\s*:\s*([^;]+);/g))) {
    // First declaration wins: the base (:root / component root) value, not a later mode override.
    if (!map.has(match[1])) map.set(match[1], match[2].trim());
  }
  return map;
}

function fallbackLessReferences(text: string): string[] {
  return Array.from(new Set(Array.from(text.matchAll(/var\(\s*(--[a-zA-Z0-9-]+)\s*\)/g), (m) => m[1])));
}

function allReferences(text: string): string[] {
  return Array.from(new Set(Array.from(text.matchAll(/var\(\s*(--[a-zA-Z0-9-]+)/g), (m) => m[1])));
}

function resolve(name: string, table: Map<string, string>, seen = new Set<string>()): string | undefined {
  if (seen.has(name)) return undefined;
  const value = table.get(name);
  if (value === undefined) return undefined;
  const ref = value.match(/^var\(\s*(--[a-zA-Z0-9-]+)\s*\)$/);
  if (!ref) return value;
  return resolve(ref[1], table, new Set(seen).add(name));
}

function delivered(manifest: ShadcnRegistryItem) {
  const componentCss = manifest.files
    .filter((file) => file.path.endsWith(".css"))
    .map((file) => file.content)
    .join("\n");
  const foundationCss = buildFoundationManifest()
    .files.map((file) => file.content)
    .join("\n");
  return { componentCss, table: declarations(`${foundationCss}\n${componentCss}`) };
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((index) => {
    const value = parseInt(hex.slice(index, index + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe.each(CHARTS)("%s token delivery", (slug) => {
  const manifest = manifests[slug];
  const { componentCss, table } = delivered(manifest);

  it("ships the shared chart stylesheet and declares every chart-owned variable in it", () => {
    expect(manifest.files.map((file) => file.path)).toContain("components/ui/internal/chart.module.css");
    const owned = declarations(componentCss);
    for (const token of [...COLOR_TOKENS, ...OTHER_TOKENS]) {
      expect(owned.has(token), `${token} must be declared in the chart's own CSS module`).toBe(true);
    }
  });

  it("leaves no fallback-less var() in the transported payload undefined in component CSS or the Foundation", () => {
    const referenced = manifest.files.flatMap((file) => fallbackLessReferences(file.content));
    const undefinedRefs = Array.from(new Set(referenced)).filter((name) => !table.has(name));
    expect(undefinedRefs).toEqual([]);
  });

  it("resolves every chart color variable to a concrete color through the delivered CSS", () => {
    for (const token of COLOR_TOKENS) {
      const value = resolve(token, table);
      expect(value, `${token} did not resolve to a literal value`).toBeDefined();
      expect(value).toMatch(/^(#[0-9a-fA-F]{3,8}|rgba?\(.+\))$/);
    }
    for (const token of OTHER_TOKENS) {
      expect(resolve(token, table), `${token} did not resolve`).toBeDefined();
    }
  });

  it("declares the series palette slots the code can request (dynamic var(--chart-series-N) references)", () => {
    for (const color of CHART_SERIES_COLORS) {
      expect(resolve(`--chart-${color}`, table)).toBeDefined();
    }
  });
});

describe("chart color model", () => {
  const { table } = delivered(manifests["bar-chart"]);
  const surface = resolve("--semantic-surface-default", table)!;

  it("keeps the approved appearance: series 1 and the marker ring are the brand action color, axis text is secondary text", () => {
    expect(resolve("--chart-series-1", table)).toBe(resolve("--semantic-action-primary", table));
    expect(resolve("--chart-axis-text", table)).toBe(resolve("--semantic-text-secondary", table));
    expect(resolve("--chart-marker-fill", table)).toBe(surface);
  });

  it("gives every series slot a distinct color that is at least 3:1 against the default surface (WCAG 1.4.11 non-text contrast)", () => {
    const colors = SERIES_TOKENS.map((token) => resolve(token, table)!.toLowerCase());
    expect(new Set(colors).size).toBe(colors.length);
    for (const color of colors) {
      expect(color).toMatch(/^#[0-9a-f]{6}$/);
      expect(contrast(color, surface), `${color} on ${surface}`).toBeGreaterThanOrEqual(3);
    }
  });

  it("does not duplicate token truth: styles/tokens.css declares none of the chart-owned variables", () => {
    const canonical = declarations(readFileSync(join(process.cwd(), "styles/tokens.css"), "utf8"));
    for (const token of [...COLOR_TOKENS, ...OTHER_TOKENS, "--bar-chart-fill", "--bar-chart-axis-text", "--line-chart-stroke", "--line-chart-dot-fill", "--line-chart-dot-stroke"]) {
      expect(canonical.has(token), `${token} must live only in the chart's CSS module`).toBe(false);
    }
  });
});

describe("chart registry cssTokens", () => {
  it("equals the custom properties the shipped chart stylesheet references (the registry scanner cannot see internal CSS)", () => {
    const shipped = delivered(manifests["bar-chart"]).componentCss;
    const expected = allReferences(shipped).sort();
    for (const slug of CHARTS) {
      const entry = componentRegistry.find((candidate) => candidate.slug === slug)!;
      expect([...(entry.cssTokens ?? [])].sort(), `${slug} cssTokens`).toEqual(expected);
    }
  });

  it("ships identical shared stylesheet bytes in all three charts", () => {
    const css = CHARTS.map((slug) => delivered(manifests[slug]).componentCss);
    expect(new Set(css).size).toBe(1);
  });
});
