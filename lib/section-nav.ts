import { CHART_COMPONENT_SLUGS } from "@/lib/global-nav";

/**
 * Client-safe section navigation: types and route resolution only. The nav
 * *content* (component names, categories) is built on the server in
 * `lib/section-nav-models.ts` so documentation prose never enters the client
 * bundle.
 */
export type Section = "docs" | "components" | "charts";

export type SectionNavItem = {
  label: string;
  href: string;
};

export type SectionNavGroup = {
  label?: string;
  items: SectionNavItem[];
};

export type SectionNavModel = {
  section: Section;
  label: string;
  groups: SectionNavGroup[];
};

function isExactOrNested(pathname: string, base: string): boolean {
  return pathname === base || pathname.startsWith(`${base}/`);
}

/** Resolves exactly one contextual section. Chart precedence is intentional. */
export function resolveSection(pathname: string): Section | null {
  if (
    pathname === "/components/charts" ||
    CHART_COMPONENT_SLUGS.some((slug) => pathname === `/components/${slug}`)
  ) {
    return "charts";
  }
  if (isExactOrNested(pathname, "/components")) return "components";
  if (isExactOrNested(pathname, "/docs") || isExactOrNested(pathname, "/foundations")) {
    return "docs";
  }
  return null;
}

export function isSectionNavItemActive(pathname: string, href: string): boolean {
  return pathname === href;
}
