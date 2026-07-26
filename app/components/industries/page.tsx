import Link from "next/link";
import { industries, industryPageContent, getIndustryPageHref } from "@/lib/industry-content";
import { getImplementedRegistryEntries } from "@/lib/component-registry";

export const metadata = {
  title: "Industries — Skrewww Design System",
  description:
    "Layer 4 Industry Systems — components that compose Layer 2 primitives into industry-domain surfaces, grouped by industry.",
};

export default function IndustriesIndexPage() {
  const implemented = getImplementedRegistryEntries();

  return (
    <div className="mx-auto max-w-4xl px-8 py-16">
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex flex-wrap items-center gap-1.5 font-mono text-xs text-ink-400">
          <li>
            <Link href="/" className="hover:text-ink-700">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-ink-600" aria-current="page">
            Industries
          </li>
        </ol>
      </nav>

      <p className="font-mono text-xs uppercase tracking-wide text-brand-500">
        Layer 4 · Industry Systems
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink-900">Industries</h1>
      <p className="mt-2 text-sm text-ink-500">
        Components that compose Layer 2 primitives into industry-domain surfaces — distinct from
        the Layer 2 categories above, and nested one level deeper (Industries → industry →
        component) so each industry groups its own components cleanly.
      </p>

      <div className="mt-10 space-y-10">
        {industries.map((industry) => {
          const content = industryPageContent[industry];
          const items = implemented.filter((entry) => entry.industry === industry);
          return (
            <div key={industry}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-ink-900">
                  <Link href={getIndustryPageHref(industry)} className="hover:text-brand-600">
                    {industry}
                  </Link>
                </h2>
                <Link
                  href={getIndustryPageHref(industry)}
                  className="font-mono text-[11px] text-ink-400 hover:text-ink-700"
                >
                  Industry page
                </Link>
              </div>
              <p className="mb-3 text-sm text-ink-500">{content.summary}</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {items.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/components/${item.slug}`}
                    className="rounded-lg border border-ink-200 p-3.5 hover:border-brand-500 hover:bg-brand-50/40"
                  >
                    <div className="text-sm font-medium text-ink-900">{item.name}</div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
