import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { compileAllContracts } from "@/lib/agent-kit/contract-compiler";
import { componentRegistry } from "@/lib/component-registry";

/**
 * Drift guard between the chart-family and chart-composition components'
 * declared TypeScript props, the canonical registry `apiProps`, and the
 * compiled Agent contract.
 *
 * CH-0 found `LineChart.sparkline` in source, tests and Banking Account Card, but
 * absent from `apiProps` and therefore from the generated contract — so a
 * contract-following agent would treat a real prop as invalid. This compares
 * canonical sources directly (source ↔ registry ↔ compiler output) and needs no
 * generated files on disk. CH-3 extends the same guard to Chart Card and Chart
 * Metric — the same drift risk applies to any component with real TypeScript props.
 *
 * `className` is a declared prop in source but deliberately not listed in
 * `apiProps` (established convention across the registry), so it is excluded from
 * the comparison rather than added.
 */

const CHARTS = [
  { slug: "bar-chart", file: "components/ui/BarChart.tsx", propsType: "BarChartProps" },
  { slug: "line-chart", file: "components/ui/LineChart.tsx", propsType: "LineChartProps" },
  { slug: "area-chart", file: "components/ui/AreaChart.tsx", propsType: "AreaChartProps" },
  { slug: "chart-card", file: "components/ui/ChartCard.tsx", propsType: "ChartCardProps" },
  { slug: "chart-metric", file: "components/ui/ChartMetric.tsx", propsType: "ChartMetricProps" },
] as const;

function declaredProps(file: string, propsType: string): string[] {
  const source = readFileSync(join(process.cwd(), file), "utf8");
  const start = source.indexOf(`export type ${propsType} = {`);
  expect(start, `${propsType} not found in ${file}`).toBeGreaterThanOrEqual(0);
  const end = source.indexOf("\n};", start);
  const body = source.slice(start, end);
  // Only top-level members (two-space indent) — ignores nested types and JSDoc lines.
  return Array.from(body.matchAll(/^ {2}([a-zA-Z][a-zA-Z0-9]*)\??:/gm), (m) => m[1]).filter((name) => name !== "className");
}

describe.each(CHARTS)("$slug API alignment", ({ slug, file, propsType }) => {
  const entry = componentRegistry.find((candidate) => candidate.slug === slug)!;

  it("lists every declared source prop (except className) in registry apiProps, and nothing else", () => {
    const source = declaredProps(file, propsType).sort();
    const registry = entry.apiProps.map((prop) => prop.name).sort();
    expect(registry).toEqual(source);
  });

  it("compiles the same prop names into the Agent contract", () => {
    const { contracts } = compileAllContracts({
      sourceGitSha: "0000000000000000000000000000000000000dead",
      sourceGitCommitTimestamp: "2026-09-13T00:00:00Z",
    });
    const contract = contracts.find((candidate) => candidate.slug === slug)!;
    expect(contract.api.properties.map((prop) => prop.name).sort()).toEqual(
      declaredProps(file, propsType).sort(),
    );
  });
});

describe("line-chart sparkline", () => {
  it("is a declared boolean prop defaulting to false in the registry and contract", () => {
    const entry = componentRegistry.find((candidate) => candidate.slug === "line-chart")!;
    const sparkline = entry.apiProps.find((prop) => prop.name === "sparkline");
    expect(sparkline).toMatchObject({ type: "boolean", default: "false" });
  });
});
