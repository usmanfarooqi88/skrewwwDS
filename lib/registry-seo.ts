import type { Metadata } from "next";
import { getRegistryEntry, getImplementedRegistryEntries } from "@/lib/component-registry";
import { getComponentBySlug } from "@/lib/data";
import { getComponentIndexing, getMetadataRobots } from "@/lib/indexing-policy";
import { getCanonicalComponentSlug } from "@/lib/routes";
import { absoluteUrl, getDefaultSocialImageUrl, siteConfig } from "@/lib/site-config";

export function getComponentPageMetadata(slug: string): Metadata {
  const canonicalSlug = getCanonicalComponentSlug(slug);
  const doc = getComponentBySlug(slug) ?? getComponentBySlug(canonicalSlug);
  const registry = getRegistryEntry(canonicalSlug);
  const indexing = getComponentIndexing(canonicalSlug);

  if (!doc) {
    return { title: "Component not found — Skrewww" };
  }

  const title = `${doc.name} — ${siteConfig.name}`;
  const description = registry?.summary ?? doc.purpose;
  const url = absoluteUrl(`/components/${canonicalSlug}`);

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: getMetadataRobots(indexing),
    openGraph: {
      title,
      description,
      url,
      type: "article",
      siteName: siteConfig.name,
      images: [{ url: getDefaultSocialImageUrl(), width: 1200, height: 630 }],
    },
  };
}

export function getComponentCanonicalUrl(slug: string): string {
  const canonicalSlug = getCanonicalComponentSlug(slug);
  return absoluteUrl(`/components/${canonicalSlug}`);
}

export function getImplementedComponentTitles(): Array<{ slug: string; title: string }> {
  return getImplementedRegistryEntries().map((entry) => ({
    slug: entry.slug,
    title: `${entry.name} — ${siteConfig.name}`,
  }));
}
