import type { MetadataRoute } from "next";
import {
  componentRegistry,
  getMaxRegistryContentDate,
  getRegistryEntry,
  getRegistryEntryContentDate,
} from "@/lib/component-registry";
import {
  categoryPageContent,
  getCategoryPageHref,
} from "@/lib/category-content";
import type { CategoryName } from "@/lib/category-content";
import {
  industries,
  getIndustryPageHref,
  INDUSTRIES_INDEX_HREF,
  type IndustryName,
} from "@/lib/industry-content";
import {
  getCategoryIndexing,
  getIndustryIndexing,
  getIndexableComponentSlugs,
} from "@/lib/indexing-policy";
import { getComponentHref } from "@/lib/routes";
import { absoluteUrl } from "@/lib/site-config";
import { CHART_COMPONENT_SLUGS } from "@/lib/global-nav";
import {
  changelogEntries,
  getSortedChangelogEntries,
} from "@/content/changelog";

/**
 * Sitemap lastModified strategy (Technical SEO Batch 2):
 *
 * Prefer a trustworthy route-level content date. Never emit build time,
 * request time, or a blanket siteConfig.lastUpdated on unrelated pages.
 * When no trustworthy date exists for a route family, omit lastModified.
 *
 * | Route family              | Source                                      |
 * |---------------------------|---------------------------------------------|
 * | Homepage                  | max react/docs date across registry         |
 * | Components hub            | max react/docs date across registry         |
 * | Component detail          | entry reactLastUpdated / documentationLastUpdated |
 * | Category hubs             | max content date of components in category  |
 * | Industries hub            | max content date of industry components     |
 * | Industry detail           | max content date of that industry's comps   |
 * | Foundations               | omitted (no route-level update date)        |
 * | Changelog                 | newest changelog entry date                 |
 * | Agent Kit                 | changelog entry `2026-09-agent-kit-beta`    |
 * | Guard                     | changelog entry `2026-09-guard-beta`        |
 */

function changelogEntryDate(id: string): string | undefined {
  return changelogEntries.find((entry) => entry.id === id)?.date;
}

function sitemapEntry(
  path: string,
  options: {
    lastModified?: string;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
  },
): MetadataRoute.Sitemap[number] {
  const entry: MetadataRoute.Sitemap[number] = {
    url: absoluteUrl(path),
    changeFrequency: options.changeFrequency,
    priority: options.priority,
  };
  if (options.lastModified) {
    entry.lastModified = options.lastModified;
  }
  return entry;
}

function componentsInCategory(category: CategoryName) {
  return componentRegistry.filter((entry) => entry.category === category);
}

function componentsInIndustry(industry: IndustryName) {
  return componentRegistry.filter((entry) => entry.industry === industry);
}

export function buildSitemapEntries(): MetadataRoute.Sitemap {
  const catalogDate = getMaxRegistryContentDate(componentRegistry);
  const newestChangelog = getSortedChangelogEntries()[0]?.date;
  const agentKitDate = changelogEntryDate("2026-09-agent-kit-beta");
  const guardDate = changelogEntryDate("2026-09-guard-beta");
  const industryCatalogDate = getMaxRegistryContentDate(
    componentRegistry.filter((entry) => entry.industry != null),
  );
  const chartComponents = (CHART_COMPONENT_SLUGS as readonly string[])
    .map((slug) => getRegistryEntry(slug))
    .filter((entry): entry is NonNullable<typeof entry> => entry != null);
  const chartsCatalogDate = getMaxRegistryContentDate(chartComponents);

  const staticPages: MetadataRoute.Sitemap = [
    sitemapEntry("/", {
      lastModified: catalogDate,
      changeFrequency: "weekly",
      priority: 1,
    }),
    sitemapEntry("/components", {
      lastModified: catalogDate,
      changeFrequency: "weekly",
      priority: 0.9,
    }),
    sitemapEntry(INDUSTRIES_INDEX_HREF, {
      lastModified: industryCatalogDate,
      changeFrequency: "weekly",
      priority: 0.85,
    }),
    // Foundations: no trustworthy route-level update date — omit lastModified.
    sitemapEntry("/foundations", {
      changeFrequency: "monthly",
      priority: 0.8,
    }),
    // Docs hub (NAV-1): orientation page, no trustworthy route-level date.
    sitemapEntry("/docs", {
      changeFrequency: "monthly",
      priority: 0.8,
    }),
    // Charts hub (NAV-1): dated by the newest of the five chart components
    // it links to, matching category-page priority since it's structurally
    // a themed sub-index of /components.
    sitemapEntry("/components/charts", {
      lastModified: chartsCatalogDate,
      changeFrequency: "weekly",
      priority: 0.75,
    }),
    sitemapEntry("/agent-kit", {
      lastModified: agentKitDate,
      changeFrequency: "monthly",
      priority: 0.75,
    }),
    sitemapEntry("/guard", {
      lastModified: guardDate,
      changeFrequency: "monthly",
      priority: 0.75,
    }),
    sitemapEntry("/changelog", {
      lastModified: newestChangelog,
      changeFrequency: "monthly",
      priority: 0.7,
    }),
  ];

  const categoryPages: MetadataRoute.Sitemap = (
    Object.keys(categoryPageContent) as CategoryName[]
  )
    .filter((category) => getCategoryIndexing(category) === "index")
    .map((category) =>
      sitemapEntry(getCategoryPageHref(category), {
        lastModified: getMaxRegistryContentDate(componentsInCategory(category)),
        changeFrequency: "weekly",
        priority: 0.75,
      }),
    );

  const industryPages: MetadataRoute.Sitemap = industries
    .filter((industry) => getIndustryIndexing(industry) === "index")
    .map((industry) =>
      sitemapEntry(getIndustryPageHref(industry), {
        lastModified: getMaxRegistryContentDate(componentsInIndustry(industry)),
        changeFrequency: "weekly",
        priority: 0.75,
      }),
    );

  const componentPages: MetadataRoute.Sitemap = getIndexableComponentSlugs().map(
    (slug) => {
      const registry = getRegistryEntry(slug);
      return sitemapEntry(getComponentHref(slug), {
        lastModified: registry ? getRegistryEntryContentDate(registry) : undefined,
        changeFrequency: "weekly",
        priority: registry?.hasImplementation ? 0.85 : 0.7,
      });
    },
  );

  return [...staticPages, ...categoryPages, ...industryPages, ...componentPages];
}

export function getSitemapUrls(): string[] {
  return buildSitemapEntries().map((entry) => entry.url);
}
