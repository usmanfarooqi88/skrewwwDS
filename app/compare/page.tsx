import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ComparisonTable } from "@/components/compare/ComparisonTable";
import {
  VERIFIED_AT,
  comparisonGroups,
  comparisonSources,
  comparisonSystems,
  formatVerifiedDate,
  getBuildNotes,
  getComparisonCategories,
} from "@/lib/comparison";
import { cn } from "@/lib/cn";
import { absoluteUrl } from "@/lib/site-config";
import { pageSocialMetadata } from "@/lib/social-metadata";

const title = "Compare design systems — Skrewww Design System";
const description =
  "See how Skrewww compares across implementation, styling, distribution, agent readiness, accessibility, and ecosystem maturity.";
const url = absoluteUrl("/compare");

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: url },
  // Held out of search until the page has had its final review.
  robots: { index: false, follow: true },
  ...pageSocialMetadata({ title, description, url }),
};

const eyebrowClass = "font-mono text-xs font-semibold uppercase tracking-wide text-ink-500";
const textLinkClass =
  "inline-flex items-center py-1 text-sm font-medium text-brand-600 underline decoration-brand-300 underline-offset-4 hover:text-brand-700 hover:decoration-brand-600";

export default function ComparePage() {
  const categories = getComparisonCategories();
  const buildNotes = getBuildNotes();

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:px-8 sm:py-16">
      <header className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
          Compare design systems
        </h1>
        <p className="mt-3 text-base text-ink-600 sm:text-lg">
          See how Skrewww compares across implementation, styling, distribution, agent readiness,
          accessibility, and ecosystem maturity.
        </p>
      </header>

      <section aria-labelledby="systems-heading" className="mt-8">
        <h2 id="systems-heading" className={eyebrowClass}>
          Systems compared
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {comparisonSystems.map((system) => (
            <li
              key={system.id}
              className={cn(
                "rounded-full border px-3 py-1 text-sm font-medium",
                system.isSubject
                  ? "border-brand-200 bg-brand-50 text-brand-700"
                  : "border-ink-200 bg-white text-ink-700",
              )}
            >
              {system.name}
            </li>
          ))}
        </ul>
        <p className="mt-4 max-w-3xl rounded-lg border border-ink-200 bg-ink-50 px-4 py-3 text-sm text-ink-600">
          Different design systems optimize for different ecosystems and workflows. Each value comes
          from that system&rsquo;s own public documentation, packages or repositories, last checked{" "}
          <time dateTime={VERIFIED_AT}>{formatVerifiedDate(VERIFIED_AT)}</time>. Open{" "}
          <strong className="font-semibold text-ink-800">Source</strong> in a cell for the note, link
          and date.
        </p>
      </section>

      <section aria-labelledby="table-heading" className="mt-8">
        <h2 id="table-heading" className="sr-only">
          Comparison table
        </h2>
        <ComparisonTable
          systems={comparisonSystems}
          groups={comparisonGroups}
          categories={categories}
          sources={comparisonSources}
        />
      </section>

      <section aria-labelledby="built-heading" className="mt-16">
        <h2 id="built-heading" className="text-xl font-semibold tracking-tight text-ink-900">
          How Skrewww is built
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-ink-600">
          These describe Skrewww&rsquo;s own architecture. They are not claims about other systems.
        </p>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {buildNotes.map((item) => (
            <li key={item.title} className="flex">
              <Card as="div" title={item.title} headingLevel="h3" className="w-full">
                <p className="text-sm leading-relaxed text-ink-600">{item.body}</p>
                <a href={item.href} className={cn(textLinkClass, "mt-3")}>
                  {item.cta}
                  <span className="sr-only"> — {item.title}</span>
                </a>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="method-heading" className="mt-16 max-w-3xl">
        <h2 id="method-heading" className="text-xl font-semibold tracking-tight text-ink-900">
          Methodology and fairness
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink-600">
          <li>
            The comparison is based on publicly verifiable capabilities, each with a public source
            and a verification date.
          </li>
          <li>
            <strong className="font-semibold text-ink-800">Partial</strong> means a capability
            exists but is incomplete or not equivalent. A note says how.
          </li>
          <li>
            <strong className="font-semibold text-ink-800">Not yet verified</strong> means no
            verified value is recorded. It is not a negative result.
          </li>
          <li>
            Systems do not always package a capability the same way. Where scope differs, such as a
            registry that covers one library within a system, the cell says so.
          </li>
          <li>
            Ecosystem maturity and feature breadth are not treated as the same thing. The maturity
            row describes release stage, not capability.
          </li>
          <li>There is no overall score and no winner.</li>
        </ul>
      </section>

      <section aria-labelledby="next-heading" className="mt-16 border-t border-ink-200 pt-8">
        <h2 id="next-heading" className="text-xl font-semibold tracking-tight text-ink-900">
          Go deeper
        </h2>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button href="/components">Explore components</Button>
          <Button href="/agent-kit" variant="secondary">
            Read Agent Kit docs
          </Button>
          <a href="/r/registry.json" className={textLinkClass}>
            View registry
          </a>
        </div>
      </section>
    </div>
  );
}
