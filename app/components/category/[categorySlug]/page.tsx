import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/docs/JsonLd";
import { getImplementedRegistryEntries } from "@/lib/component-registry";
import {
  categoryPageContent,
  categorySlugMap,
  getCategoryNameFromSlug,
  getCategoryPageHref,
} from "@/lib/category-content";
import type { CategoryName } from "@/lib/category-content";
import { getComponentHref } from "@/lib/routes";
import { getCategoryIndexing, getMetadataRobots } from "@/lib/indexing-policy";
import { categoryPageJsonLd } from "@/lib/structured-data";
import { absoluteUrl } from "@/lib/site-config";
import { brandedDocumentTitle } from "@/lib/registry-seo";

export function generateStaticParams() {
  return Object.values(categorySlugMap).map((categorySlug) => ({ categorySlug }));
}

export async function generateMetadata(
  props: {
    params: Promise<{ categorySlug: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const category = getCategoryNameFromSlug(params.categorySlug);
  if (!category) {
    return { title: { absolute: brandedDocumentTitle("Category not found") } };
  }

  const content = categoryPageContent[category];
  const pageTitle = `${content.title} components`;
  const title = brandedDocumentTitle(pageTitle);
  const url = absoluteUrl(getCategoryPageHref(category));

  return {
    title: pageTitle,
    description: content.summary,
    alternates: { canonical: url },
    robots: getMetadataRobots(getCategoryIndexing(category)),
    openGraph: { title, description: content.summary, url, type: "website" },
  };
}

export default async function ComponentCategoryPage(
  props: {
    params: Promise<{ categorySlug: string }>;
  }
) {
  const params = await props.params;
  const category = getCategoryNameFromSlug(params.categorySlug);
  if (!category) notFound();

  const content = categoryPageContent[category];
  // Industry-classified (Layer 4) components are excluded — they belong
  // to their own Industries > {industry} grouping (/components/industries),
  // not their `category`, matching categoryPageJsonLd's own exclusion.
  const implemented = getImplementedRegistryEntries().filter(
    (entry) => entry.category === category && !entry.industry,
  );

  return (
    <article className="mx-auto max-w-4xl px-8 py-16">
      <JsonLd data={categoryPageJsonLd(category)} />

      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex flex-wrap items-center gap-1.5 font-mono text-xs text-ink-400">
          <li>
            <Link href="/" className="hover:text-ink-700">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/components" className="hover:text-ink-700">
              Components
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-ink-600" aria-current="page">
            {category}
          </li>
        </ol>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-ink-900">
          {content.title}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-ink-600">{content.summary}</p>
      </header>

      <div className="space-y-8">
        <section>
          <h2 className="text-sm font-semibold text-ink-900">What this category contains</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-600">{content.description}</p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-ink-900">Status</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-600">{content.statusNote}</p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-ink-900">Accessibility considerations</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-600">
            {content.accessibilityNotes}
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-ink-900">
            Implemented components ({implemented.length})
          </h2>
          {implemented.length ? (
            <ul className="mt-3 space-y-2">
              {implemented.map((entry) => (
                <li key={entry.slug}>
                  <Link
                    href={getComponentHref(entry.slug)}
                    className="block rounded-lg border border-ink-200 p-3.5 hover:border-brand-500 hover:bg-brand-50/40"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-ink-900">{entry.name}</span>
                      <span className="rounded-full bg-warning/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-warning">
                        {entry.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-ink-500">{entry.summary}</p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-ink-500">
              No React implementation is available in this category yet. Documentation-only
              entries remain on the{" "}
              <Link href="/components" className="text-brand-600 hover:text-brand-700">
                components index
              </Link>
              .
            </p>
          )}
        </section>
      </div>
    </article>
  );
}
