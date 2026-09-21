import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildBarChartManifest,
  buildFoundationManifest,
  buildLineChartManifest,
  type ShadcnRegistryItem,
} from "@/lib/shadcn-registry-generator";

/**
 * Consumer-facing proof for chart token delivery (CH-1).
 *
 * CH-0 found that BarChart/LineChart referenced `--bar-chart-*` / `--line-chart-*`
 * custom properties that lived only in styles/tokens.css's component tier — which
 * the shadcn Foundation transport does not include — so a consumer received chart
 * code pointing at undefined variables (black bars, an invisible line). These tests
 * inspect the *transported* payload (the same bytes a consumer installs) rather than
 * repo source, so they fail if a chart variable is referenced but never delivered.
 *
 * They read the pure generator output, not public/r, so they hold on a clean checkout.
 */

const CHART_TOKENS = {
  "bar-chart": ["--bar-chart-fill", "--bar-chart-axis-text"],
  "line-chart": ["--line-chart-stroke", "--line-chart-dot-fill", "--line-chart-dot-stroke"],
} as const;

const manifests: Record<keyof typeof CHART_TOKENS, ShadcnRegistryItem> = {
  "bar-chart": buildBarChartManifest(),
  "line-chart": buildLineChartManifest(),
};

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

describe.each(Object.keys(CHART_TOKENS) as (keyof typeof CHART_TOKENS)[])("%s token delivery", (slug) => {
  const manifest = manifests[slug];
  const { componentCss, table } = delivered(manifest);

  it("declares every chart-owned variable in component-owned CSS that ships with the component", () => {
    const owned = declarations(componentCss);
    for (const token of CHART_TOKENS[slug]) {
      expect(owned.has(token), `${token} must be declared in ${slug}'s own CSS module`).toBe(true);
    }
  });

  it("leaves no fallback-less var() in the transported payload undefined in component CSS or the Foundation", () => {
    const referenced = manifest.files.flatMap((file) => fallbackLessReferences(file.content));
    const undefinedRefs = Array.from(new Set(referenced)).filter((name) => !table.has(name));
    expect(undefinedRefs).toEqual([]);
  });

  it("resolves every chart color variable to a concrete color through the delivered CSS", () => {
    for (const token of CHART_TOKENS[slug]) {
      const value = resolve(token, table);
      expect(value, `${token} did not resolve to a literal value`).toBeDefined();
      expect(value).toMatch(/^(#[0-9a-fA-F]{3,8}|rgba?\(.+\))$/);
    }
  });
});

describe("chart color mapping", () => {
  it("keeps the approved appearance: bar fill, line stroke and dot stroke are the brand action color; axis text is secondary text", () => {
    const bar = delivered(manifests["bar-chart"]).table;
    const line = delivered(manifests["line-chart"]).table;
    const action = resolve("--semantic-action-primary", bar);
    expect(action).toBeDefined();
    expect(resolve("--bar-chart-fill", bar)).toBe(action);
    expect(resolve("--line-chart-stroke", line)).toBe(action);
    expect(resolve("--line-chart-dot-stroke", line)).toBe(action);
    expect(resolve("--bar-chart-axis-text", bar)).toBe(resolve("--semantic-text-secondary", bar));
    expect(resolve("--line-chart-dot-fill", line)).toBe(resolve("--semantic-surface-default", line));
  });

  it("does not duplicate token truth: styles/tokens.css no longer declares the chart color aliases", () => {
    const tokensCss = readFileSync(join(process.cwd(), "styles/tokens.css"), "utf8");
    const canonical = declarations(tokensCss);
    for (const token of [...CHART_TOKENS["bar-chart"], ...CHART_TOKENS["line-chart"]]) {
      expect(canonical.has(token), `${token} must live only in the chart's CSS module`).toBe(false);
    }
  });
});
