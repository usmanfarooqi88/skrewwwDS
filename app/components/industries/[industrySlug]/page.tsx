import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/docs/JsonLd";
import { getImplementedRegistryEntries } from "@/lib/component-registry";
import {
  industryPageContent,
  industrySlugMap,
  getIndustryNameFromSlug,
  getIndustryPageHref,
  INDUSTRIES_INDEX_HREF,
} from "@/lib/industry-content";
import { getComponentHref } from "@/lib/routes";
import { getIndustryIndexing, getMetadataRobots } from "@/lib/indexing-policy";
import { industryPageJsonLd } from "@/lib/structured-data";
import { absoluteUrl } from "@/lib/site-config";
import { brandedDocumentTitle } from "@/lib/registry-seo";

export function generateStaticParams() {
  return Object.values(industrySlugMap).map((industrySlug) => ({ industrySlug }));
}

export async function generateMetadata(
  props: {
    params: Promise<{ industrySlug: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const industry = getIndustryNameFromSlug(params.industrySlug);
  if (!industry) {
    return { title: { absolute: brandedDocumentTitle("Industry not found") } };
  }

  const content = industryPageContent[industry];
  const pageTitle = `${content.title} components`;
  const title = brandedDocumentTitle(pageTitle);
  const url = absoluteUrl(getIndustryPageHref(industry));

  return {
    title: pageTitle,
    description: content.summary,
    alternates: { canonical: url },
    robots: getMetadataRobots(getIndustryIndexing(industry)),
    openGraph: { title, description: content.summary, url, type: "website" },
  };
}

export default async function IndustryPage(
  props: {
    params: Promise<{ industrySlug: string }>;
  }
) {
  const params = await props.params;
  const industry = getIndustryNameFromSlug(params.industrySlug);
  if (!industry) notFound();

  const content = industryPageContent[industry];
  const implemented = getImplementedRegistryEntries().filter(
    (entry) => entry.industry === industry,
  );

  return (
    <article className="mx-auto max-w-4xl px-8 py-16">
      <JsonLd data={industryPageJsonLd(industry)} />

      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex flex-wrap items-center gap-1.5 font-mono text-xs text-ink-400">
          <li>
            <Link href="/" className="hover:text-ink-700">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={INDUSTRIES_INDEX_HREF} className="hover:text-ink-700">
              Industries
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-ink-600" aria-current="page">
            {industry}
          </li>
        </ol>
      </nav>

      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-wide text-brand-500">
          Layer 4 · Industry Systems
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink-900">
          {content.title}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-ink-600">{content.summary}</p>
      </header>

      <div className="space-y-8">
        <section>
          <h2 className="text-sm font-semibold text-ink-900">What this industry contains</h2>
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
              No React implementation is available in this industry yet.
            </p>
          )}
        </section>
      </div>
    </article>
  );
}
