import type { Metadata } from "next";
import { getRegistryEntry, getImplementedRegistryEntries } from "@/lib/component-registry";
import { getComponentBySlug } from "@/lib/data";
import { getComponentIndexing, getMetadataRobots } from "@/lib/indexing-policy";
import { getCanonicalComponentSlug } from "@/lib/routes";
import { absoluteUrl, siteConfig } from "@/lib/site-config";
import { pageSocialMetadata } from "@/lib/social-metadata";

/** Full document title after the root `%s — ${siteConfig.name}` template. */
export function brandedDocumentTitle(pageTitle: string): string {
  return `${pageTitle} — ${siteConfig.name}`;
}

export function getComponentPageMetadata(slug: string): Metadata {
  const canonicalSlug = getCanonicalComponentSlug(slug);
  const doc = getComponentBySlug(slug) ?? getComponentBySlug(canonicalSlug);
  const registry = getRegistryEntry(canonicalSlug);
  const indexing = getComponentIndexing(canonicalSlug);

  if (!doc) {
    return { title: { absolute: brandedDocumentTitle("Component not found") } };
  }

  // Short title — root layout template appends ` — Skrewww Design System` once.
  const pageTitle = doc.name;
  const title = brandedDocumentTitle(pageTitle);
  const description = registry?.summary ?? doc.purpose;
  const url = absoluteUrl(`/components/${canonicalSlug}`);

  return {
    title: pageTitle,
    description,
    alternates: { canonical: url },
    robots: getMetadataRobots(indexing),
    ...pageSocialMetadata({ title, description, url, type: "article" }),
  };
}

export function getComponentCanonicalUrl(slug: string): string {
  const canonicalSlug = getCanonicalComponentSlug(slug);
  return absoluteUrl(`/components/${canonicalSlug}`);
}

export function getImplementedComponentTitles(): Array<{ slug: string; title: string }> {
  return getImplementedRegistryEntries().map((entry) => ({
    slug: entry.slug,
    title: brandedDocumentTitle(entry.name),
  }));
}
