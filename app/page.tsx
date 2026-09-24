import Link from "next/link";
import type { Metadata } from "next";
import { allComponents, getCategoryCounts } from "@/lib/data";
import { getImplementedMaturityCounts } from "@/lib/component-registry";
import { getCategoryPageHref } from "@/lib/category-content";
import type { CategoryName } from "@/lib/category-content";
import { siteConfig } from "@/lib/site-config";
import { Card } from "@/components/ui/Card";
import { TokenPillRow } from "@/components/TokenPill";
import { HomeHeroCtas } from "@/components/HomeHeroCtas";
import { cn } from "@/lib/cn";
import { JsonLd } from "@/components/docs/JsonLd";
import { siteStructuredData } from "@/lib/structured-data";

export const metadata: Metadata = {
  // Homepage owns the default document title and its self-canonical.
  // Root layout no longer sets a sitewide canonical (that forced hubs to
  // inherit https://skrewww.com incorrectly).
  alternates: { canonical: siteConfig.origin },
};

const layers = [
  {
    n: "01",
    name: "Foundation",
    desc: "Tokens, color, type, spacing, radius, elevation, motion, icons, accessibility.",
    status: "Complete",
    tone: "success",
  },
  {
    n: "02",
    name: "Component Library",
    desc: "Actions, Forms, Navigation, Feedback, Containers & Overlays, Content & Data.",
    status: "Complete",
    tone: "success",
  },
  {
    n: "03",
    name: "Style Systems",
    desc: "Shape (Sharp/Rounded/Pill/Squircle/Brand) and Surface (Flat/Gradient/Glass) — the same components, restyled through tokens.",
    status: "Validated on 3 components",
    tone: "warning",
  },
  {
    n: "04",
    name: "Industry Systems",
    desc: "Banking, Healthcare, Enterprise SaaS, and more — inheriting from the core, never forking it.",
    status: "Banking pilot (3 components)",
    tone: "warning",
  },
];

const toneClasses: Record<string, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  neutral: "bg-ink-100 text-ink-500",
};

const eyebrowClass =
  "font-mono text-[13px] font-semibold uppercase tracking-wide text-ink-500 sm:text-xs sm:font-medium sm:text-ink-400";

export default function HomePage() {
  const counts = getCategoryCounts();
  const totalComponents = allComponents.length;
  const { implemented, stable, beta } = getImplementedMaturityCounts();

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-16">
      {/* Site-level entities live on the homepage only — the root layout also wraps noindex routes. */}
      <JsonLd data={siteStructuredData()} />
      <div className="mb-10 sm:mb-16">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-ink-200 px-3 py-1 font-mono text-xs text-ink-500">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
          {siteConfig.designSystemVersion} — {implemented} React components
          ({stable} Stable · {beta} Beta)
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">
          One foundation.
          <br />
          Every surface.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-600 sm:mt-5 sm:text-lg sm:text-ink-500">
          Skrewww is an AI-first design system platform. The same {totalComponents} components
          adapt through tokens — never forks — across shape, surface, brand, and eventually
          industry. Built to be read by designers, developers, and coding agents alike.
        </p>
        <HomeHeroCtas totalComponents={totalComponents} />
      </div>

      <div className="mb-10 sm:mb-16">
        <h2 className={eyebrowClass}>Architecture</h2>
        <p className="mt-1.5 mb-5 text-[15px] leading-relaxed text-ink-600 sm:mt-1 sm:mb-6 sm:text-sm sm:text-ink-500">
          Every decision in this system is scoped to one of four layers. Status shown here is
          real, not aspirational.
        </p>
        <Card elevation="flat" bodyClassName="divide-y divide-ink-200 p-0">
          {layers.map((layer) => (
            <div key={layer.n} className="p-4 sm:flex sm:items-start sm:gap-4">
              <span className="block font-mono text-[11px] text-ink-400 sm:mt-0.5 sm:shrink-0 sm:text-xs sm:text-ink-300">
                {layer.n}
              </span>
              <div className="mt-1 sm:mt-0 sm:min-w-0 sm:flex-1">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                  <h3 className="text-base font-semibold text-ink-900 sm:text-sm">{layer.name}</h3>
                  <span
                    className={cn(
                      "shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium",
                      toneClasses[layer.tone],
                    )}
                  >
                    {layer.status}
                  </span>
                </div>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-600 sm:mt-1 sm:text-sm sm:text-ink-500">
                  {layer.desc}
                </p>
              </div>
            </div>
          ))}
        </Card>
      </div>

      <Card elevation="flat" className="mb-10 bg-ink-50 sm:mb-16">
        <h2 className={eyebrowClass}>Tokens, not hex codes</h2>
        <p className="mt-1.5 mb-4 text-[15px] leading-relaxed text-ink-600 sm:mt-1 sm:mb-3 sm:text-sm sm:text-ink-500">
          Every color, radius, and shadow referenced in these docs is a real, resolvable token —
          not prose describing one. This is what a Button actually points to:
        </p>
        <TokenPillRow
          tokens={["semantic/action/primary", "component/radius/control", "semantic/focus-ring"]}
        />
      </Card>

      <div>
        <h2 className={cn(eyebrowClass, "mb-3.5 sm:mb-4")}>Components by category</h2>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
          {counts.map(({ category, count }) => (
            <Link
              key={category}
              href={getCategoryPageHref(category as CategoryName)}
              className="rounded-lg border border-ink-200 p-3.5 hover:border-brand-500 hover:bg-brand-50/40 sm:p-4"
            >
              <div className="text-[28px] font-bold leading-none text-ink-900 sm:text-2xl sm:font-semibold">
                {count}
              </div>
              <div className="mt-1.5 text-sm font-medium text-ink-600 sm:mt-0.5 sm:font-normal sm:text-ink-500">
                {category}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
