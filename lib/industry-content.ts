/**
 * Layer 4 (Industry Systems) navigation content — a small, additive
 * sibling to lib/category-content.ts, not a redesign of it. Layer 2
 * category grouping (Actions, Forms, ...) is unrelated to and unaffected
 * by this file; a component belongs to at most one industry, tracked via
 * the separate optional `industry` field on its registry/content entry.
 *
 * "Industries" is a distinct top-level nav concept from "Components" —
 * it groups by industry, one level deeper than category grouping ever
 * needed to (Industries > Banking > [component]), so that adding
 * Healthcare later is a clean sibling addition to `industries`/
 * `industrySlugMap`/`industryPageContent`, not a rework of this file or
 * any of its consumers (sidebar, breadcrumbs, JSON-LD, sitemap, llms.txt).
 */

export const industries = ["Banking"] as const;

export type IndustryName = (typeof industries)[number];

export type IndustrySlug = (typeof industrySlugMap)[IndustryName];

export const industrySlugMap = {
  Banking: "banking",
} as const satisfies Record<IndustryName, string>;

const slugToIndustry = Object.fromEntries(
  Object.entries(industrySlugMap).map(([industry, slug]) => [slug, industry]),
) as Record<IndustrySlug, IndustryName>;

export function getIndustrySlug(industry: IndustryName): IndustrySlug {
  return industrySlugMap[industry];
}

export function getIndustryNameFromSlug(slug: string): IndustryName | undefined {
  return slugToIndustry[slug as IndustrySlug];
}

export function getIndustryPageHref(industry: IndustryName): string {
  return `/components/industries/${getIndustrySlug(industry)}`;
}

/** Top-level "Industries" index — the sibling peer of "/components" for Layer 4. */
export const INDUSTRIES_INDEX_HREF = "/components/industries";

type IndustryPageContent = {
  title: IndustryName;
  summary: string;
  description: string;
  accessibilityNotes: string;
  statusNote: string;
  indexing: "index" | "noindex";
};

export const industryPageContent: Record<IndustryName, IndustryPageContent> = {
  Banking: {
    title: "Banking",
    summary:
      "Banking components compose Layer 2 primitives into financial-domain surfaces — transaction lists, account summaries, and spending overviews.",
    description:
      "The first Layer 4 Industry Systems pilot (2026-07-25). Every Banking component is a composition of existing Layer 2 components (List Item, Avatar, Badge, Popover, Card, Tag, Button, Line Chart, Bar Chart, Tabs, Skeleton) — never a fork or duplicate. No industry-specific tokens exist; all styling aliases existing Foundation/Semantic tokens.",
    accessibilityNotes:
      "Banking components inherit their accessibility model entirely from the Layer 2 primitives they compose — no separate accessibility surface of their own.",
    statusNote:
      "Banking Transaction Row, Banking Account Card, and Banking Balance Summary are implemented in Beta. Figma parity is pending for all three — confirmed via a full Figma file search that no Industry Systems reference exists yet, not an oversight.",
    indexing: "index",
  },
};
