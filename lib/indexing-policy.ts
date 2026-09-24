import { allComponents, getComponentBySlug } from "@/lib/data";
import { getRegistryEntry } from "@/lib/component-registry";
import type { CategoryName } from "@/lib/category-content";
import { categoryPageContent } from "@/lib/category-content";
import type { IndustryName } from "@/lib/industry-content";
import { industryPageContent } from "@/lib/industry-content";
import { REDIRECTED_COMPONENT_SLUGS } from "@/lib/routes";
import type { ComponentDoc } from "@/lib/types";

export type IndexingPolicy = "index" | "noindex";

export function isSubstantiveDocumentation(doc: ComponentDoc): boolean {
  return Boolean(
    doc.purpose.trim() &&
      doc.whenToUse.trim() &&
      doc.whenNotToUse.trim() &&
      doc.accessibility.trim() &&
      doc.commonMistakes.trim() &&
      doc.tokensUsed.length > 0,
  );
}

/** Single source for component indexing — registry field wins when present. */
export function getComponentIndexing(slug: string): IndexingPolicy {
  if (
    REDIRECTED_COMPONENT_SLUGS.includes(
      slug as (typeof REDIRECTED_COMPONENT_SLUGS)[number],
    )
  ) {
    return "noindex";
  }

  const registry = getRegistryEntry(slug);
  if (registry?.indexing) {
    return registry.indexing;
  }

  const doc = getComponentBySlug(slug);
  if (!doc) {
    return "noindex";
  }

  if (doc.indexing) {
    return doc.indexing;
  }

  return isSubstantiveDocumentation(doc) ? "index" : "noindex";
}

export function getCategoryIndexing(category: CategoryName): IndexingPolicy {
  return categoryPageContent[category].indexing;
}

export function getIndustryIndexing(industry: IndustryName): IndexingPolicy {
  return industryPageContent[industry].indexing;
}

export function getIndexableComponentSlugs(): string[] {
  return allComponents
    .map((component) => component.slug)
    .filter((slug) => getComponentIndexing(slug) === "index");
}

export function getMetadataRobots(indexing: IndexingPolicy) {
  return indexing === "index"
    ? { index: true as const, follow: true as const }
    : { index: false as const, follow: true as const };
}
