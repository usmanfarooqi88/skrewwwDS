import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/docs/JsonLd";
import { ComponentDirectoryList } from "@/components/docs/ComponentDirectoryList";
import { getCategoryDirectoryEntries } from "@/lib/component-directory";
import {
  categoryPageContent,
  categorySlugMap,
  getCategoryNameFromSlug,
  getCategoryPageHref,
} from "@/lib/category-content";
import type { CategoryName } from "@/lib/category-content";
import { getCategoryIndexing, getMetadataRobots } from "@/lib/indexing-policy";
import { categoryPageJsonLd } from "@/lib/structured-data";
import { absoluteUrl } from "@/lib/site-config";
import { brandedDocumentTitle } from "@/lib/registry-seo";
import { pageSocialMetadata } from "@/lib/social-metadata";

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
    ...pageSocialMetadata({ title, description: content.summary, url }),
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
  const entries = getCategoryDirectoryEntries(category);
  const stableCount = entries.filter((entry) => entry.status === "stable").length;
  const betaCount = entries.filter((entry) => entry.status === "beta").length;
  const docsOnlyCount = entries.filter((entry) => entry.status === "docs-only").length;

  return (
    <article className="mx-auto max-w-4xl px-8 py-10 sm:py-16">
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
          <p className="mt-2 text-sm leading-relaxed text-ink-600">
            {stableCount} Stable and {betaCount} Beta React components.
            {docsOnlyCount > 0
              ? ` ${docsOnlyCount} documentation-only ${docsOnlyCount === 1 ? "pattern is" : "patterns are"} labelled separately and are not independently installable.`
              : ""}
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-ink-900">Accessibility considerations</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-600">
            {content.accessibilityNotes}
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-ink-900">
            Components and documented patterns ({entries.length})
          </h2>
          {entries.length ? (
            <div className="mt-3">
              <ComponentDirectoryList entries={entries} />
            </div>
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
