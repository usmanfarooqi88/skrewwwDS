import { allComponents } from "@/lib/data";
import { getCategoryPageHref } from "@/lib/category-content";
import {
  CHART_COMPONENT_SLUGS,
  CHART_COMPOSITION_SLUGS,
  CHART_FAMILY_SLUGS,
} from "@/lib/global-nav";
import { industries, industrySlugMap } from "@/lib/industry-content";
import { REDIRECTED_COMPONENT_SLUGS } from "@/lib/routes";
import type { Section, SectionNavModel } from "@/lib/section-nav";
import { categories } from "@/lib/types";

/**
 * Server-side projection of the canonical component docs (`lib/data`) into
 * plain label/href navigation models. Only these models cross into the client
 * (via DocsChrome props) — never `allComponents`, which carries long-form prose.
 */
const chartSlugs = new Set<string>(CHART_COMPONENT_SLUGS);

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
