import { allComponents } from "@/lib/data";
import { getCategoryPageHref } from "@/lib/category-content";
import {
  CHART_COMPONENT_SLUGS,
  CHART_COMPOSITION_SLUGS,
  CHART_FAMILY_SLUGS,
} from "@/lib/global-nav";
import { industries, industrySlugMap } from "@/lib/industry-content";
import { REDIRECTED_COMPONENT_SLUGS } from "@/lib/routes";
import { categories } from "@/lib/types";

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

const chartSlugs = new Set<string>(CHART_COMPONENT_SLUGS);

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

const docsNav: SectionNavModel = {
  section: "docs",
  label: "Docs",
  groups: [
    {
      items: [
        { label: "Overview", href: "/docs" },
        { label: "Foundations", href: "/foundations" },
      ],
    },
  ],
};

const visibleOrdinaryComponents = allComponents.filter(
  (component) =>
    !component.industry &&
    !chartSlugs.has(component.slug) &&
    !REDIRECTED_COMPONENT_SLUGS.includes(
      component.slug as (typeof REDIRECTED_COMPONENT_SLUGS)[number],
    ),
);

const componentsNav: SectionNavModel = {
  section: "components",
  label: "Components",
  groups: [
    { items: [{ label: "Overview", href: "/components" }] },
    ...categories.map((category) => ({
      label: category,
      items: [
        { label: `${category} overview`, href: getCategoryPageHref(category) },
        ...visibleOrdinaryComponents
          .filter((component) => component.category === category)
          .map((component) => ({ label: component.name, href: `/components/${component.slug}` })),
      ],
    })),
    {
      label: "Industries",
      items: [
        { label: "Industries overview", href: "/components/industries" },
        ...industries.map((industry) => ({
          label: industry,
          href: `/components/industries/${industrySlugMap[industry]}`,
        })),
        ...allComponents
          .filter((component) => component.industry)
          .map((component) => ({ label: component.name, href: `/components/${component.slug}` })),
      ],
    },
  ],
};

const chartName = (slug: string) =>
  allComponents.find((component) => component.slug === slug)?.name ?? slug;

const chartsNav: SectionNavModel = {
  section: "charts",
  label: "Charts",
  groups: [
    { items: [{ label: "Overview", href: "/components/charts" }] },
    {
      label: "Families",
      items: CHART_FAMILY_SLUGS.map((slug) => ({
        label: chartName(slug),
        href: `/components/${slug}`,
      })),
    },
    {
      label: "Compositions",
      items: CHART_COMPOSITION_SLUGS.map((slug) => ({
        label: chartName(slug),
        href: `/components/${slug}`,
      })),
    },
  ],
};

export const sectionNavModels: Record<Section, SectionNavModel> = {
  docs: docsNav,
  components: componentsNav,
  charts: chartsNav,
};

export function isSectionNavItemActive(pathname: string, href: string): boolean {
  return pathname === href;
}
