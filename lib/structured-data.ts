import { getRegistryEntry, getImplementedRegistryEntries } from "@/lib/component-registry";
import { getComponentBySlug } from "@/lib/data";
import { getCategoryPageHref } from "@/lib/category-content";
import type { CategoryName } from "@/lib/category-content";
import { getIndustryPageHref, INDUSTRIES_INDEX_HREF } from "@/lib/industry-content";
import type { IndustryName } from "@/lib/industry-content";
import { getComponentCanonicalUrl } from "@/lib/registry-seo";
import { absoluteUrl, siteConfig } from "@/lib/site-config";

type JsonLd = Record<string, unknown>;

export function organizationJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.organizationName,
    url: siteConfig.origin,
    ...(siteConfig.repositoryUrl ? { sameAs: [siteConfig.repositoryUrl] } : {}),
  };
}

export function websiteJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.origin,
    description: siteConfig.description,
    publisher: {
      "@type": "Organization",
      name: siteConfig.organizationName,
    },
  };
}

export function softwareApplicationJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteConfig.name,
    applicationCategory: "DesignApplication",
    operatingSystem: "Web",
    softwareVersion: siteConfig.designSystemVersion,
    description: siteConfig.description,
    url: siteConfig.origin,
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; url: string }>): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function componentPageJsonLd(slug: string): JsonLd[] {
  const registry = getRegistryEntry(slug);
  const doc = getComponentBySlug(slug);
  if (!registry || !doc) return [];

  const pageUrl = getComponentCanonicalUrl(slug);

  // Industry-classified components (Layer 4) get their own top-level
  // breadcrumb trail — Home > Industries > {industry} > {name} — instead
  // of Home > Components > {category} > {name}. `industry` is the
  // authoritative signal (registry field), not `category`, which stays
  // unchanged on these entries for other purposes.
  const breadcrumbs = registry.industry
    ? breadcrumbJsonLd([
        { name: "Home", url: siteConfig.origin },
        { name: "Industries", url: absoluteUrl(INDUSTRIES_INDEX_HREF) },
        { name: registry.industry, url: absoluteUrl(getIndustryPageHref(registry.industry)) },
        { name: doc.name, url: pageUrl },
      ])
    : breadcrumbJsonLd([
        { name: "Home", url: siteConfig.origin },
        { name: "Components", url: absoluteUrl("/components") },
        { name: doc.category, url: absoluteUrl(getCategoryPageHref(doc.category as CategoryName)) },
        { name: doc.name, url: pageUrl },
      ]);

  const article: JsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: doc.name,
    name: doc.name,
    description: registry.summary,
    url: pageUrl,
    datePublished: registry.documentationLastUpdated,
    // Docs and React sources are dated independently; the page was last
    // modified when either changed, and never before it was published.
    dateModified:
      registry.reactLastUpdated > registry.documentationLastUpdated
        ? registry.reactLastUpdated
        : registry.documentationLastUpdated,
    version: registry.version,
    articleSection: registry.industry ?? doc.category,
    inLanguage: "en",
    isAccessibleForFree: true,
    keywords: [registry.industry ?? doc.category, ...registry.supportedVariants, registry.status].join(", "),
    author: {
      "@type": "Organization",
      name: siteConfig.organizationName,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.organizationName,
    },
    mainEntityOfPage: pageUrl,
  };

  if (registry.status === "beta") {
    article.additionalProperty = {
      "@type": "PropertyValue",
      name: "maturityStatus",
      value: "beta",
    };
  }

  return [breadcrumbs, article];
}

export function categoryPageJsonLd(category: CategoryName): JsonLd[] {
  const pageUrl = absoluteUrl(getCategoryPageHref(category));
  // Industry-classified (Layer 4) components are excluded — they belong
  // to their own Industries > {industry} grouping, not their `category`.
  const implemented = getImplementedRegistryEntries().filter(
    (entry) => entry.category === category && !entry.industry,
  );

  return [
    breadcrumbJsonLd([
      { name: "Home", url: siteConfig.origin },
      { name: "Components", url: absoluteUrl("/components") },
      { name: category, url: pageUrl },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: `${category} components — ${siteConfig.shortName}`,
      description: `${implemented.length} implemented Beta component(s) documented in the ${category} category.`,
      url: pageUrl,
      dateModified: siteConfig.lastUpdated,
      isPartOf: websiteJsonLd(),
    },
  ];
}

export function industryPageJsonLd(industry: IndustryName): JsonLd[] {
  const pageUrl = absoluteUrl(getIndustryPageHref(industry));
  const implemented = getImplementedRegistryEntries().filter((entry) => entry.industry === industry);

  return [
    breadcrumbJsonLd([
      { name: "Home", url: siteConfig.origin },
      { name: "Industries", url: absoluteUrl(INDUSTRIES_INDEX_HREF) },
      { name: industry, url: pageUrl },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: `${industry} components — ${siteConfig.shortName}`,
      description: `${implemented.length} implemented Beta component(s) documented in the ${industry} industry.`,
      url: pageUrl,
      dateModified: siteConfig.lastUpdated,
      isPartOf: websiteJsonLd(),
    },
  ];
}

export function siteStructuredData(): JsonLd[] {
  return [organizationJsonLd(), websiteJsonLd(), softwareApplicationJsonLd()];
}
