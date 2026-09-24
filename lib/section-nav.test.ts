import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolveSection } from "@/lib/section-nav";
import { sectionNavModels } from "@/lib/section-nav-models";

describe("resolveSection", () => {
  it.each([
    ["/docs", "docs"],
    ["/foundations", "docs"],
    ["/components", "components"],
    ["/components/button", "components"],
    ["/components/category/forms", "components"],
    ["/components/industries", "components"],
    ["/components/industries/banking", "components"],
    ["/components/charts", "charts"],
    ["/components/bar-chart", "charts"],
    ["/components/line-chart", "charts"],
    ["/components/area-chart", "charts"],
    ["/components/chart-card", "charts"],
    ["/components/chart-metric", "charts"],
    ["/", null],
    ["/agent-kit", null],
    ["/guard", null],
    ["/changelog", null],
    ["/reference", null],
  ])("resolves %s to %s", (pathname, expected) => {
    expect(resolveSection(pathname)).toBe(expected);
  });

  it("gives every chart route Charts precedence over Components", () => {
    for (const item of sectionNavModels.charts.groups.flatMap((group) => group.items)) {
      expect(resolveSection(item.href), item.href).toBe("charts");
    }
  });
});

describe("section navigation models", () => {
  it("keeps Docs intentionally limited to real section destinations", () => {
    expect(sectionNavModels.docs.groups.flatMap((group) => group.items)).toEqual([
      { label: "Overview", href: "/docs" },
      { label: "Foundations", href: "/foundations" },
    ]);
  });

  it("keeps Charts limited to shipped families and compositions", () => {
    expect(sectionNavModels.charts.groups.map((group) => group.label)).toEqual([
      undefined,
      "Families",
      "Compositions",
    ]);
    expect(sectionNavModels.charts.groups.flatMap((group) => group.items).map((item) => item.label)).toEqual([
      "Overview",
      "Bar Chart",
      "Line Chart",
      "Area Chart",
      "Chart Card",
      "Chart Metric",
    ]);
  });

  it("does not duplicate global product areas in Components", () => {
    const labels = sectionNavModels.components.groups.flatMap((group) => group.items).map((item) => item.label);
    for (const forbidden of ["Docs", "Charts", "Agent Kit", "Guard", "Changelog"]) {
      expect(labels).not.toContain(forbidden);
    }
    expect(labels).toContain("Button");
    expect(labels).toContain("Banking");
  });

  it("does not import chart implementations, Recharts, or Reference App modules", () => {
    const source = readFileSync(`${process.cwd()}/lib/section-nav.ts`, "utf8");
    expect(source).not.toMatch(/components\/ui|components\/reference-app|recharts/i);
  });
});
