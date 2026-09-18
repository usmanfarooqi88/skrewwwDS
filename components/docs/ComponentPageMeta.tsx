import { Badge } from "@/components/ui/Badge";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Link } from "@/components/ui/Link";
import { getRegistryEntry } from "@/lib/component-registry";
import { getComponentBySlug } from "@/lib/data";
import { getCategoryPageHref } from "@/lib/category-content";
import type { CategoryName } from "@/lib/category-content";
import { getIndustryPageHref, INDUSTRIES_INDEX_HREF } from "@/lib/industry-content";

export function ComponentBreadcrumbs({
  slug,
  name,
  category,
}: {
  slug: string;
  name: string;
  category: string;
}) {
  // Industry-classified (Layer 4) components get their own top-level
  // trail — Home > Industries > {industry} > {name} — instead of
  // Home > Components > {category} > {name}. The registry's `industry`
  // field is the authoritative signal, looked up here via `slug` rather
  // than requiring every caller to thread it through.
  const industry = getRegistryEntry(slug)?.industry;

  return (
    <Breadcrumb
      className="mb-4"
      items={
        industry
          ? [
              { label: "Home", href: "/", home: true },
              { label: "Industries", href: INDUSTRIES_INDEX_HREF },
              { label: industry, href: getIndustryPageHref(industry) },
              { label: name },
            ]
          : [
              { label: "Home", href: "/", home: true },
              { label: "Components", href: "/components" },
              { label: category, href: getCategoryPageHref(category as CategoryName) },
              { label: name },
            ]
      }
    />
  );
}

const badgeVariantMap = {
  beta: "warning",
  stable: "success",
  documented: "neutral",
  planned: "neutral",
} as const;

const availabilityBadgeVariant = {
  available: "success",
  partial: "warning",
  unavailable: "neutral",
} as const;
const availabilityLabel = {
  available: "Available",
  partial: "Partial",
  unavailable: "Unavailable",
} as const;

export function ComponentStatusPanel({ slug }: { slug: string }) {
  const entry = getRegistryEntry(slug);
  if (!entry?.hasImplementation) return null;

  return (
    <section
      aria-label="Component maturity and availability"
      className="mb-8 rounded-lg border border-ink-200 bg-ink-50 p-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge size="sm" variant={badgeVariantMap[entry.status]}>
          {entry.status}
        </Badge>
        <Badge size="sm" variant={availabilityBadgeVariant[entry.reactAvailability]}>
          React {availabilityLabel[entry.reactAvailability]}
        </Badge>
        <Badge size="sm" variant={availabilityBadgeVariant[entry.figmaAvailability]}>
          Figma {availabilityLabel[entry.figmaAvailability]}
        </Badge>
        <Badge size="sm" variant={availabilityBadgeVariant[entry.documentationCompleteness]}>
          Docs {availabilityLabel[entry.documentationCompleteness]}
        </Badge>
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-mono text-[11px] uppercase tracking-wide text-ink-400">
            React last updated
          </dt>
          <dd className="text-ink-700">{entry.reactLastUpdated}</dd>
        </div>
        <div>
          <dt className="font-mono text-[11px] uppercase tracking-wide text-ink-400">
            Documentation last updated
          </dt>
          <dd className="text-ink-700">{entry.documentationLastUpdated}</dd>
        </div>
        <div>
          <dt className="font-mono text-[11px] uppercase tracking-wide text-ink-400">
            Accessibility target
          </dt>
          <dd className="text-ink-700">{entry.accessibilityLevel}</dd>
        </div>
        <div>
          <dt className="font-mono text-[11px] uppercase tracking-wide text-ink-400">
            Version
          </dt>
          <dd className="font-mono text-ink-700">{entry.version}</dd>
        </div>
      </dl>

      {entry.openQuestions.length > 0 ? (
        <div className="mt-4">
          <h2 className="font-mono text-[11px] font-medium uppercase tracking-wide text-ink-400">
            Known open questions
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-600">
            {entry.openQuestions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

export function DocumentationOnlyStatusPanel({ slug }: { slug: string }) {
  const doc = getComponentBySlug(slug);
  const registry = getRegistryEntry(slug);

  if (!doc) return null;

  return (
    <section
      aria-label="Documentation availability"
      className="mb-8 rounded-lg border border-ink-200 bg-ink-50 p-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-ink-100 px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide text-ink-600">
          Figma documented
        </span>
        <span className="rounded-full bg-ink-100 px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide text-ink-600">
          React not implemented
        </span>
        <span className="rounded-full bg-ink-100 px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide text-ink-600">
          Documentation only
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-ink-600">
        This page documents the Figma component and usage rules. It is not a production-ready React
        implementation and does not include a live preview.
      </p>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-mono text-[11px] uppercase tracking-wide text-ink-400">
            Figma availability
          </dt>
          <dd className="text-ink-700">{registry?.figmaAvailability ?? "available"}</dd>
        </div>
        <div>
          <dt className="font-mono text-[11px] uppercase tracking-wide text-ink-400">
            React availability
          </dt>
          <dd className="text-ink-700">unavailable</dd>
        </div>
        <div>
          <dt className="font-mono text-[11px] uppercase tracking-wide text-ink-400">
            Documentation completeness
          </dt>
          <dd className="text-ink-700">{registry?.documentationCompleteness ?? "partial"}</dd>
        </div>
        <div>
          <dt className="font-mono text-[11px] uppercase tracking-wide text-ink-400">
            Maturity
          </dt>
          <dd className="text-ink-700">{registry?.status ?? "documented"}</dd>
        </div>
      </dl>

      {doc.knownLimitation ? (
        <p className="mt-4 text-sm text-ink-600">
          <span className="font-medium text-ink-700">Known limitation:</span>{" "}
          {doc.knownLimitation}
        </p>
      ) : null}

      {registry?.openQuestions?.length ? (
        <div className="mt-4">
          <h2 className="font-mono text-[11px] font-medium uppercase tracking-wide text-ink-400">
            Open questions
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-600">
            {registry.openQuestions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

export function ComponentRelatedLinks({ slug }: { slug: string }) {
  const entry = getRegistryEntry(slug);
  const doc = getComponentBySlug(slug);

  // Implemented components use registry related* groups. Docs-only pages
  // (no live React preview) may declare relatedLinks on the ComponentDoc.
  if (entry?.hasImplementation) {
    const groups = [
      { title: "Related components", links: entry.relatedComponents },
      { title: "Related tokens", links: entry.relatedTokens },
      { title: "Related concepts", links: entry.relatedConcepts },
    ].filter((group) => group.links.length > 0);

    if (groups.length === 0) return null;

    return (
      <section aria-label="Related documentation" className="space-y-4">
        {groups.map((group) => (
          <div key={group.title} className="rounded-lg border border-ink-200 p-4">
            <h2 className="font-mono text-[11px] font-medium uppercase tracking-wide text-ink-400">
              {group.title}
            </h2>
            <ul className="mt-2 space-y-1.5 text-sm">
              {group.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} variant="default" size="sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    );
  }

  const docsOnlyLinks = doc?.relatedLinks ?? [];
  if (docsOnlyLinks.length === 0) return null;

  return (
    <section aria-label="Related documentation" className="space-y-4">
      <div className="rounded-lg border border-ink-200 p-4">
        <h2 className="font-mono text-[11px] font-medium uppercase tracking-wide text-ink-400">
          Related components
        </h2>
        <ul className="mt-2 space-y-1.5 text-sm">
          {docsOnlyLinks.map((link) => (
            <li key={link.label}>
              <Link href={link.href} variant="default" size="sm">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
