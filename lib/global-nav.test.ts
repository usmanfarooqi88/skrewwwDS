import { describe, expect, it } from "vitest";
import {
  CHART_COMPONENT_SLUGS,
  getActiveGlobalNavArea,
  globalNavItems,
  isAgentKitPath,
  isChartsPath,
  isComponentsPath,
  isDocsPath,
  isResourcesPath,
  resourceLinks,
} from "@/lib/global-nav";

describe("global nav — locked NAV-1 items", () => {
  it("has exactly Docs, Components, Charts, Agent Kit, in that order — no Guard/Changelog/Foundations as top-level items", () => {
    expect(globalNavItems.map((item) => item.area)).toEqual(["docs", "components", "charts", "agent-kit"]);
    expect(globalNavItems.map((item) => item.label)).toEqual(["Docs", "Components", "Charts", "Agent Kit"]);
    expect(globalNavItems.map((item) => item.href)).toEqual([
      "/docs",
      "/components",
      "/components/charts",
      "/agent-kit",
    ]);
  });

  it("locks the five real chart component slugs and no unimplemented family", () => {
    expect(CHART_COMPONENT_SLUGS).toEqual(["bar-chart", "line-chart", "area-chart", "chart-card", "chart-metric"]);
    for (const forbidden of ["scatter-chart", "pie-chart", "donut-chart", "gauge-chart", "heatmap-chart"]) {
      expect(CHART_COMPONENT_SLUGS as readonly string[]).not.toContain(forbidden);
    }
  });
});

describe("isChartsPath", () => {
  it("is true for the hub and every real chart component page", () => {
    expect(isChartsPath("/components/charts")).toBe(true);
    for (const slug of CHART_COMPONENT_SLUGS) {
      expect(isChartsPath(`/components/${slug}`)).toBe(true);
    }
  });

  it("is false for an ordinary component, category, or industries page", () => {
    expect(isChartsPath("/components/button")).toBe(false);
    expect(isChartsPath("/components/category/forms")).toBe(false);
    expect(isChartsPath("/components/industries")).toBe(false);
    expect(isChartsPath("/components/industries/banking")).toBe(false);
  });
});

describe("isComponentsPath", () => {
  it("is true for the directory, a component page, a category page, and industries", () => {
    expect(isComponentsPath("/components")).toBe(true);
    expect(isComponentsPath("/components/button")).toBe(true);
    expect(isComponentsPath("/components/category/forms")).toBe(true);
    expect(isComponentsPath("/components/industries")).toBe(true);
    expect(isComponentsPath("/components/industries/banking")).toBe(true);
  });

  it("is false for every chart page — never double-active with Charts", () => {
    expect(isComponentsPath("/components/charts")).toBe(false);
    for (const slug of CHART_COMPONENT_SLUGS) {
      expect(isComponentsPath(`/components/${slug}`)).toBe(false);
    }
  });

  it("is false for unrelated routes", () => {
    expect(isComponentsPath("/docs")).toBe(false);
    expect(isComponentsPath("/agent-kit")).toBe(false);
    expect(isComponentsPath("/")).toBe(false);
  });
});

describe("isDocsPath", () => {
  it("is true for /docs and /foundations (and their nested routes)", () => {
    expect(isDocsPath("/docs")).toBe(true);
    expect(isDocsPath("/docs/getting-started")).toBe(true);
    expect(isDocsPath("/foundations")).toBe(true);
    expect(isDocsPath("/foundations/tokens")).toBe(true);
  });

  it("is false for unrelated routes, including Components and Charts", () => {
    expect(isDocsPath("/")).toBe(false);
    expect(isDocsPath("/components")).toBe(false);
    expect(isDocsPath("/components/charts")).toBe(false);
    expect(isDocsPath("/agent-kit")).toBe(false);
  });
});

describe("isAgentKitPath", () => {
  it("is true only for /agent-kit and nested routes", () => {
    expect(isAgentKitPath("/agent-kit")).toBe(true);
    expect(isAgentKitPath("/agent-kit/anything")).toBe(true);
    expect(isAgentKitPath("/guard")).toBe(false);
    expect(isAgentKitPath("/")).toBe(false);
  });
});

describe("getActiveGlobalNavArea", () => {
  it("resolves exactly one area for every audited route, with Charts taking precedence over Components", () => {
    const cases: [string, ReturnType<typeof getActiveGlobalNavArea>][] = [
      ["/", null],
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
      ["/agent-kit", "agent-kit"],
      ["/guard", null],
      ["/changelog", null],
      ["/reference", null],
    ];
    for (const [pathname, expected] of cases) {
      expect(getActiveGlobalNavArea(pathname), pathname).toBe(expected);
    }
  });
});

describe("isResourcesPath", () => {
  it("is true only for /guard and /changelog (and nested routes)", () => {
    expect(isResourcesPath("/guard")).toBe(true);
    expect(isResourcesPath("/changelog")).toBe(true);
    expect(isResourcesPath("/changelog/2026")).toBe(true);
    expect(isResourcesPath("/")).toBe(false);
    expect(isResourcesPath("/components")).toBe(false);
    expect(isResourcesPath("/agent-kit")).toBe(false);
  });
});

describe("resourceLinks — locked NAV-1 Resources contents", () => {
  it("has exactly Guard, Changelog, GitHub, Figma Free, Figma Pro, in that order", () => {
    expect(resourceLinks.map((link) => link.label)).toEqual([
      "Guard",
      "Changelog",
      "GitHub",
      "Figma Free",
      "Figma Pro",
    ]);
  });

  it("marks internal destinations as internal and external ones as external, with real hrefs", () => {
    const byLabel = new Map(resourceLinks.map((link) => [link.label, link]));
    expect(byLabel.get("Guard")).toMatchObject({ href: "/guard", external: false });
    expect(byLabel.get("Changelog")).toMatchObject({ href: "/changelog", external: false });
    expect(byLabel.get("GitHub")?.external).toBe(true);
    expect(byLabel.get("GitHub")?.href).toMatch(/^https:\/\/github\.com\//);
    expect(byLabel.get("Figma Free")?.external).toBe(true);
    expect(byLabel.get("Figma Free")?.href).toMatch(/^https:\/\/www\.figma\.com\//);
    expect(byLabel.get("Figma Pro")?.external).toBe(true);
    expect(byLabel.get("Figma Pro")?.href).toMatch(/^https:\/\/[a-z0-9.-]*gumroad\.com\//);
  });

  it("excludes Reference App, Registry, future Skills, and Industry — locked NAV-1 scope", () => {
    const labels = resourceLinks.map((link) => link.label.toLowerCase());
    for (const forbidden of ["reference", "registry", "skills", "industry", "industries"]) {
      expect(labels.some((label) => label.includes(forbidden))).toBe(false);
    }
  });
});
