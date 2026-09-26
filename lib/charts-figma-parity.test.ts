import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { compileAllContracts } from "@/lib/agent-kit/contract-compiler";
import {
  AREA_CHART_FIGMA_REFERENCE_NODE_ID,
  AREA_CHART_FIGMA_REFERENCE_NODE_IDS,
  BAR_CHART_FIGMA_EXAMPLE_NODE_ID,
  CHART_CARD_CONTENT_FIGMA_INTERNAL_HELPER_NODE_ID,
  CHART_CARD_FIGMA_COMPONENT_NODE_ID,
  CHART_METRIC_FIGMA_COMPONENT_SET_NODE_ID,
  CHARTS_FIGMA_AUDIT_STATUS,
  LINE_CHART_FIGMA_EXAMPLE_MARKER_COUNT,
  LINE_CHART_FIGMA_EXAMPLE_NODE_ID,
} from "@/lib/charts-figma-metadata";
import { componentRegistry, getRegistryEntry } from "@/lib/component-registry";

const OBSOLETE_CHART_CARD_NODE_ID = "3237:6424";
const root = process.cwd();

describe("Figma chart parity — canonical registry", () => {
  it("Bar, Line and Area are partial: static visual references, not reusable Figma components", () => {
    for (const slug of ["bar-chart", "line-chart", "area-chart"]) {
      const entry = getRegistryEntry(slug)!;
      expect(entry.figmaAvailability, slug).toBe("partial");
      expect(entry.figmaReference, slug).toMatch(/STATIC VISUAL REFERENCE/);
      expect(entry.figmaReference, slug).toMatch(/not (a )?reusable Figma component/i);
      expect(entry.reactAvailability, slug).toBe("available");
    }
  });

  it("maps each chart entry to its verified Figma node", () => {
    expect(getRegistryEntry("bar-chart")!.figmaNodeId).toBe("2058:2532");
    expect(getRegistryEntry("line-chart")!.figmaNodeId).toBe("2058:2559");
    expect(getRegistryEntry("area-chart")!.figmaNodeId).toBe("3237:6726");
    expect(getRegistryEntry("chart-metric")!.figmaNodeId).toBe("3236:6141");
    expect(getRegistryEntry("chart-card")!.figmaNodeId).toBe("3239:8017");
    expect(BAR_CHART_FIGMA_EXAMPLE_NODE_ID).toBe("2058:2532");
    expect(LINE_CHART_FIGMA_EXAMPLE_NODE_ID).toBe("2058:2559");
    expect(AREA_CHART_FIGMA_REFERENCE_NODE_ID).toBe("3237:6726");
    expect(CHART_METRIC_FIGMA_COMPONENT_SET_NODE_ID).toBe("3236:6141");
    expect(CHART_CARD_FIGMA_COMPONENT_NODE_ID).toBe("3239:8017");
  });

  it("Chart Metric and Chart Card are available reusable Figma components", () => {
    for (const slug of ["chart-metric", "chart-card"]) {
      const entry = getRegistryEntry(slug)!;
      expect(entry.figmaAvailability, slug).toBe("available");
      expect(entry.figmaReference, slug).toMatch(/reusable Figma component/);
      expect(entry.status, slug).toBe("beta");
    }
  });

  it("records the intentional typography non-parity instead of claiming parity", () => {
    const metric = getRegistryEntry("chart-metric")!.openQuestions.join(" ");
    expect(metric).toMatch(/12px Caption/);
    expect(metric).toMatch(/13px/);
    expect(metric).toMatch(/tabular numerals/);
    expect(metric).not.toMatch(/No Figma reference exists/);
    const card = getRegistryEntry("chart-card")!.openQuestions.join(" ");
    expect(card).toMatch(/Heading\/S/);
    expect(card).toMatch(/Chart Card Content is Figma-internal|Figma-internal only/);
    expect(card).not.toMatch(/No Figma reference exists/);
  });

  it("the obsolete Chart Card node is absent from canonical metadata", () => {
    expect(JSON.stringify(componentRegistry)).not.toContain(OBSOLETE_CHART_CARD_NODE_ID);
    // Only the intentional "no longer exists" note may mention it in the metadata file.
    const metadata = readFileSync(join(root, "lib", "charts-figma-metadata.ts"), "utf8");
    const constants = metadata.match(/export const \w+\s*=\s*"[^"]*"/g)?.join("\n") ?? "";
    expect(constants).not.toContain(OBSOLETE_CHART_CARD_NODE_ID);
  });

  it("the Figma-internal Chart Card Content helper is not a public registry component", () => {
    expect(CHART_CARD_CONTENT_FIGMA_INTERNAL_HELPER_NODE_ID).toBe("3239:7976");
    expect(CHART_CARD_CONTENT_FIGMA_INTERNAL_HELPER_NODE_ID).not.toBe(CHART_CARD_FIGMA_COMPONENT_NODE_ID);
    expect(componentRegistry.some((e) => e.figmaNodeId === CHART_CARD_CONTENT_FIGMA_INTERNAL_HELPER_NODE_ID)).toBe(false);
    expect(componentRegistry.some((e) => /chart-card-content/.test(e.slug))).toBe(false);
    expect(JSON.stringify(componentRegistry)).not.toContain(CHART_CARD_CONTENT_FIGMA_INTERNAL_HELPER_NODE_ID);
  });

  it("Line Chart records six markers, not seven", () => {
    expect(LINE_CHART_FIGMA_EXAMPLE_MARKER_COUNT).toBe(6);
    const reference = getRegistryEntry("line-chart")!.figmaReference!;
    expect(reference).not.toMatch(/7 data points/);
    expect(reference).toMatch(/SIX 6px hollow-ring markers/);
  });

  it("records all four Area reference frames as static references", () => {
    expect(AREA_CHART_FIGMA_REFERENCE_NODE_IDS).toEqual({
      singleSeries: "3237:6726",
      multiSeriesOverlap: "3237:6743",
      stacked: "3237:6769",
      percentStacked: "3237:6795",
    });
    expect(AREA_CHART_FIGMA_REFERENCE_NODE_ID).toBe(AREA_CHART_FIGMA_REFERENCE_NODE_IDS.singleSeries);
    const reference = getRegistryEntry("area-chart")!.figmaReference!;
    for (const id of Object.values(AREA_CHART_FIGMA_REFERENCE_NODE_IDS)) expect(reference).toContain(id);
    expect(reference).toMatch(/Runtime and data behavior are React-only/);
    expect(reference).toMatch(/four categorical series slots/);
    expect(reference).toMatch(/no success\/warning\/status meaning/);
    expect(getRegistryEntry("area-chart")!.openQuestions.join(" ")).not.toMatch(/There is no Figma reference/);
  });

  it("records the audit date used for this evidence", () => {
    expect(CHARTS_FIGMA_AUDIT_STATUS).toBe("verified-2026-09-26");
  });
});

describe("Figma chart parity — generated Agent contracts", () => {
  const { contracts } = compileAllContracts({
    sourceGitSha: "0000000000000000000000000000000000000dead",
    sourceGitCommitTimestamp: "2026-09-26T00:00:00Z",
  });
  const bySlug = (slug: string) => contracts.find((c) => c.slug === slug)!;

  it("figma.verified only means a real node id is recorded, for all five chart entries", () => {
    const expected: Record<string, string> = {
      "bar-chart": "2058:2532",
      "line-chart": "2058:2559",
      "area-chart": "3237:6726",
      "chart-metric": "3236:6141",
      "chart-card": "3239:8017",
    };
    for (const [slug, nodeId] of Object.entries(expected)) {
      expect(bySlug(slug).figma.verified, slug).toBe(true);
      expect(bySlug(slug).figma.nodeId, slug).toBe(nodeId);
    }
  });

  it("contracts keep availability distinct from verification: partial vs available", () => {
    expect(bySlug("bar-chart").availability.figma).toBe("partial");
    expect(bySlug("line-chart").availability.figma).toBe("partial");
    expect(bySlug("area-chart").availability.figma).toBe("partial");
    expect(bySlug("chart-metric").availability.figma).toBe("available");
    expect(bySlug("chart-card").availability.figma).toBe("available");
  });

  it("never emits a contract for the Figma-internal helper", () => {
    expect(contracts.some((c) => /chart-card-content/.test(c.slug))).toBe(false);
  });
});
