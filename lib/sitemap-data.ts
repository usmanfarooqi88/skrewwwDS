import type { MetadataRoute } from "next";
import { getRegistryEntry } from "@/lib/component-registry";
import {
  categoryPageContent,
  getCategoryPageHref,
} from "@/lib/category-content";
import type { CategoryName } from "@/lib/category-content";
import { getComponentIndexing, getCategoryIndexing, getIndexableComponentSlugs } from "@/lib/indexing-policy";
import { getComponentHref } from "@/lib/routes";
import { absoluteUrl, siteConfig } from "@/lib/site-config";

export function buildSitemapEntries(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: siteConfig.lastUpdated,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/components"),
      lastModified: siteConfig.lastUpdated,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/foundations"),
      lastModified: siteConfig.documentationPublished,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/registry.json"),
      lastModified: siteConfig.lastUpdated,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: absoluteUrl("/llms.txt"),
      lastModified: siteConfig.lastUpdated,
      changeFrequency: "weekly",
      priority: 0.4,
    },
    {
      url: absoluteUrl("/llms-full.txt"),
      lastModified: siteConfig.lastUpdated,
      changeFrequency: "weekly",
      priority: 0.35,
    },
  ];

  const categoryPages: MetadataRoute.Sitemap = (
    Object.keys(categoryPageContent) as CategoryName[]
  )
    .filter((category) => getCategoryIndexing(category) === "index")
    .map((category) => ({
      url: absoluteUrl(getCategoryPageHref(category)),
      lastModified: siteConfig.lastUpdated,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    }));

  const componentPages: MetadataRoute.Sitemap = getIndexableComponentSlugs().map(
    (slug) => {
      const registry = getRegistryEntry(slug);
      return {
        url: absoluteUrl(getComponentHref(slug)),
        lastModified:
          registry?.reactLastUpdated ??
          registry?.documentationLastUpdated ??
          siteConfig.documentationPublished,
        changeFrequency: "weekly" as const,
        priority: registry?.hasImplementation ? 0.85 : 0.7,
      };
    },
  );

  return [...staticPages, ...categoryPages, ...componentPages];
}

export function getSitemapUrls(): string[] {
  return buildSitemapEntries().map((entry) => entry.url);
}
