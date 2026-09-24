import Link from "next/link";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/Badge";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Card } from "@/components/ui/Card";
import { getRegistryEntry } from "@/lib/component-registry";
import { CHART_COMPOSITION_SLUGS, CHART_FAMILY_SLUGS } from "@/lib/global-nav";
import { absoluteUrl } from "@/lib/site-config";
import { brandedDocumentTitle } from "@/lib/registry-seo";
import { pageSocialMetadata } from "@/lib/social-metadata";
import { JsonLd } from "@/components/docs/JsonLd";
import { chartsHubBreadcrumbJsonLd } from "@/lib/structured-data";

const pageTitle = "Charts";
const title = brandedDocumentTitle(pageTitle);
const description =
  "Skrewww's Cartesian chart families and the dashboard-composition components built on top of them.";
const url = absoluteUrl("/components/charts");

export const metadata: Metadata = {
  title: pageTitle,
  description,
  alternates: { canonical: url },
  ...pageSocialMetadata({ title, description, url }),
};

/**
 * NAV-1: existing chart URLs (/components/bar-chart, /line-chart,
 * /area-chart, /chart-card, /chart-metric) are unchanged — this hub only
 * links to them. Slugs come from lib/global-nav.ts, the single source of
 * truth also used for header active-state matching, so this list can't
 * silently drift from what's actually shipped (no Scatter/Pie/Donut/etc,
 * even as "coming soon" — only shipped capabilities appear here).
 */
function chartEntries(slugs: readonly string[]) {
  return slugs.map((slug) => {
    const entry = getRegistryEntry(slug);
    if (!entry) throw new Error(`Missing registry entry for chart slug "${slug}"`);
    return { slug, name: entry.name, summary: entry.summary, status: entry.status };
  });
}

const familyEntries = chartEntries(CHART_FAMILY_SLUGS);
const compositionEntries = chartEntries(CHART_COMPOSITION_SLUGS);

const badgeVariantMap = {
  beta: "warning",
  stable: "success",
  documented: "neutral",
  planned: "neutral",
} as const;

function ChartEntryCard({
  slug,
  name,
  summary,
  status,
}: {
  slug: string;
  name: string;
  summary: string;
  status: keyof typeof badgeVariantMap;
}) {
  return (
    <Link href={`/components/${slug}`} className="block">
      <Card elevation="flat" className="h-full transition-colors hover:border-brand-500">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-ink-900">{name}</h3>
          <Badge size="sm" variant={badgeVariantMap[status]}>
            {status}
          </Badge>
        </div>
        <p className="mt-2 text-sm text-ink-600">{summary}</p>
      </Card>
    </Link>
  );
}

export default function ChartsHubPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-16">
      <JsonLd data={chartsHubBreadcrumbJsonLd()} />
      <Breadcrumb
        className="mb-4"
        items={[
          { label: "Home", href: "/", home: true },
          { label: "Components", href: "/components" },
          { label: "Charts" },
        ]}
      />

      <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Charts</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-500">{description}</p>

      <section className="mt-8" aria-labelledby="chart-families-heading">
        <h2 id="chart-families-heading" className="font-mono text-[11px] font-medium uppercase tracking-wide text-ink-400">
          Chart families
        </h2>
        <p className="mt-1 text-sm text-ink-500">
          Cartesian charts for plotting series directly — single or multi-series, with stacking where it applies.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {familyEntries.map((entry) => (
            <ChartEntryCard key={entry.slug} {...entry} />
          ))}
        </div>
      </section>

      <section className="mt-10" aria-labelledby="chart-compositions-heading">
        <h2
          id="chart-compositions-heading"
          className="font-mono text-[11px] font-medium uppercase tracking-wide text-ink-400"
        >
          Compositions
        </h2>
        <p className="mt-1 text-sm text-ink-500">
          Dashboard-ready building blocks composed around a chart family, for cards, metrics, and loading/empty/error
          states.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {compositionEntries.map((entry) => (
            <ChartEntryCard key={entry.slug} {...entry} />
          ))}
        </div>
      </section>
    </div>
  );
}
