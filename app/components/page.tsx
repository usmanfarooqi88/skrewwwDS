import Link from "next/link";
import type { Metadata } from "next";
import { ComponentDirectoryList } from "@/components/docs/ComponentDirectoryList";
import {
  getComponentDirectoryGroups,
  getComponentDirectoryStats,
} from "@/lib/component-directory";
import { CHARTS_HUB_HREF } from "@/lib/global-nav";
import { INDUSTRIES_INDEX_HREF } from "@/lib/industry-content";
import { absoluteUrl, getDefaultSocialImageUrl, siteConfig } from "@/lib/site-config";
import { brandedDocumentTitle } from "@/lib/registry-seo";

const pageTitle = "Components";
const title = brandedDocumentTitle(pageTitle);
const description =
  "Browse the Skrewww React component library — documented design-system primitives for actions, forms, navigation, feedback, overlays, and data display.";
const url = absoluteUrl("/components");

export const metadata: Metadata = {
  title: pageTitle,
  description,
  alternates: { canonical: url },
  openGraph: {
    title,
    description,
    url,
    type: "website",
    siteName: siteConfig.name,
    images: [{ url: getDefaultSocialImageUrl() }],
  },
};

export default function ComponentsIndexPage() {
  const groups = getComponentDirectoryGroups();
  const stats = getComponentDirectoryStats();

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Components</h1>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-500">
        Browse {stats.implemented} React components across six canonical categories: {stats.stable} Stable
        and {stats.beta} Beta. Documentation-only patterns are labelled separately and are not independent
        React components.
      </p>

      <nav aria-label="Component categories" className="mt-6 flex flex-wrap gap-2">
        {groups.map((group) => (
          <a
            key={group.category}
            href={`#${group.href.split("/").at(-1)}`}
            className="rounded-full border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-700 transition-colors hover:border-brand-500 hover:text-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          >
            {group.category} <span className="text-ink-400">{group.entries.length}</span>
          </a>
        ))}
      </nav>

      <section aria-labelledby="specialized-directories-heading" className="mt-10">
        <h2
          id="specialized-directories-heading"
          className="font-mono text-[11px] font-medium uppercase tracking-wide text-ink-400"
        >
          Specialized directories
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Link
            href={CHARTS_HUB_HREF}
            className="rounded-lg border border-ink-200 p-4 transition-colors hover:border-brand-500 hover:bg-ink-50"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-ink-900">Charts</h3>
              <span className="font-mono text-[11px] text-ink-400">{stats.charts} components</span>
            </div>
            <p className="mt-1 text-sm text-ink-500">
              Chart families and dashboard compositions, grouped in their dedicated hub.
            </p>
          </Link>
          <Link
            href={INDUSTRIES_INDEX_HREF}
            className="rounded-lg border border-ink-200 p-4 transition-colors hover:border-brand-500 hover:bg-ink-50"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-ink-900">Industries</h3>
              <span className="font-mono text-[11px] text-ink-400">{stats.industries} components</span>
            </div>
            <p className="mt-1 text-sm text-ink-500">
              Industry-specific compositions, kept distinct from generic primitives.
            </p>
          </Link>
        </div>
      </section>

      <div className="mt-12 space-y-12">
        {groups.map((group) => {
          const anchor = group.href.split("/").at(-1);
          return (
            <section
              key={group.category}
              id={anchor}
              aria-labelledby={`${anchor}-heading`}
              className="scroll-mt-20"
            >
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <div className="flex items-baseline gap-2">
                  <h2 id={`${anchor}-heading`} className="text-base font-semibold text-ink-900">
                    {group.category}
                  </h2>
                  <span className="font-mono text-[11px] text-ink-400">
                    {group.entries.length}
                  </span>
                </div>
                <Link href={group.href} className="text-xs font-medium text-brand-600 hover:text-brand-700">
                  View category
                </Link>
              </div>
              {group.category === "Content & Data" ? (
                <p className="mb-3 text-xs text-ink-500">
                  Chart components are grouped in the dedicated Charts directory above.
                </p>
              ) : null}
              <ComponentDirectoryList entries={group.entries} />
            </section>
          );
        })}
      </div>

      <p className="mt-12 border-t border-ink-200 pt-5 text-xs leading-relaxed text-ink-500">
        {stats.docsOnly} documentation-only patterns are included where they clarify a component
        family. Their “Docs only” label means they are not independently installable React components.
      </p>
    </div>
  );
}
