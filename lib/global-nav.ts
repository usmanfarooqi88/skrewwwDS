import { siteConfig } from "@/lib/site-config";

/**
 * Canonical model for the global header. Contextual section navigation is
 * resolved separately in `lib/section-nav.ts`; neither model owns the other.
 */

export type GlobalNavArea = "docs" | "components" | "charts" | "agent-kit";

export type GlobalNavItem = {
  area: GlobalNavArea;
  label: string;
  href: string;
};

export const globalNavItems: GlobalNavItem[] = [
  { area: "docs", label: "Docs", href: "/docs" },
  { area: "components", label: "Components", href: "/components" },
  { area: "charts", label: "Charts", href: "/components/charts" },
  { area: "agent-kit", label: "Agent Kit", href: "/agent-kit" },
];

/**
 * The five shipped chart-related public components (CH-1–CH-3). Single
 * source of truth for both the global-nav active-state exception (a chart
 * page marks "Charts" active, never "Components") and the `/components/charts`
 * hub's own links — extend this list, not the individual call sites, when a
 * new chart family or composition ships.
 */
export const CHART_FAMILY_SLUGS = ["bar-chart", "line-chart", "area-chart"] as const;
export const CHART_COMPOSITION_SLUGS = ["chart-card", "chart-metric"] as const;
export const CHART_COMPONENT_SLUGS = [...CHART_FAMILY_SLUGS, ...CHART_COMPOSITION_SLUGS] as const;

export const CHARTS_HUB_HREF = "/components/charts";
export const DOCS_HUB_HREF = "/docs";

function isExactOrNestedRoute(pathname: string, base: string): boolean {
  return pathname === base || pathname.startsWith(`${base}/`);
}

/** `/components/charts` itself, or one of the five real chart component pages. */
export function isChartsPath(pathname: string): boolean {
  if (pathname === CHARTS_HUB_HREF) return true;
  return (CHART_COMPONENT_SLUGS as readonly string[]).some(
    (slug) => pathname === `/components/${slug}`,
  );
}

/**
 * Every other `/components/*` route (component pages, category pages,
 * industries) — deliberately excludes chart pages so a chart page never
 * marks both "Components" and "Charts" active at once.
 */
export function isComponentsPath(pathname: string): boolean {
  if (isChartsPath(pathname)) return false;
  return isExactOrNestedRoute(pathname, "/components");
}

export function isDocsPath(pathname: string): boolean {
  return isExactOrNestedRoute(pathname, DOCS_HUB_HREF) || isExactOrNestedRoute(pathname, "/foundations");
}

export function isAgentKitPath(pathname: string): boolean {
  return isExactOrNestedRoute(pathname, "/agent-kit");
}

const AREA_MATCHERS: Record<GlobalNavArea, (pathname: string) => boolean> = {
  docs: isDocsPath,
  components: isComponentsPath,
  charts: isChartsPath,
  "agent-kit": isAgentKitPath,
};

/** The single active global-nav area for a pathname, or null (e.g. Home, Guard, Changelog — see isResourcesPath). */
export function getActiveGlobalNavArea(pathname: string): GlobalNavArea | null {
  for (const item of globalNavItems) {
    if (AREA_MATCHERS[item.area](pathname)) return item.area;
  }
  return null;
}

/**
 * Whether the Resources trigger should read as contextually active — Guard
 * and Changelog are Resources-menu destinations, not their own global-nav
 * items (locked NAV-1 IA), but a visitor on either page should still see
 * Resources reflect it.
 */
export function isResourcesPath(pathname: string): boolean {
  return isExactOrNestedRoute(pathname, "/guard") || isExactOrNestedRoute(pathname, "/changelog");
}

export type ResourceLink = {
  label: string;
  href: string;
  external: boolean;
};

/** Locked NAV-1 Resources contents, in the specified order. Registry/Reference App/Skills/Industry are deliberately excluded — see NAV-0/NAV-1. */
export const resourceLinks: ResourceLink[] = [
  { label: "Guard", href: "/guard", external: false },
  { label: "Changelog", href: "/changelog", external: false },
  { label: "GitHub", href: siteConfig.repositoryUrl, external: true },
  { label: "Figma Free", href: siteConfig.figmaFreeFileUrl, external: true },
  { label: "Figma Pro", href: siteConfig.gumroadProUrl, external: true },
];

export const socialLinks = [
  { label: "GitHub", href: siteConfig.repositoryUrl },
  { label: "Instagram", href: siteConfig.instagramUrl },
  { label: "LinkedIn", href: siteConfig.linkedinUrl },
] as const;
