import Link from "next/link";
import { allComponents, getCategoryCounts } from "@/lib/data";
import { getImplementedComponentCount } from "@/lib/component-registry";
import { getCategoryPageHref } from "@/lib/category-content";
import type { CategoryName } from "@/lib/category-content";
import { siteConfig } from "@/lib/site-config";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TokenPill } from "@/components/TokenPill";

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

export default function HomePage() {
  const counts = getCategoryCounts();
  const totalComponents = allComponents.length;
  const implementedCount = getImplementedComponentCount();

  return (
    <div className="mx-auto max-w-4xl px-8 py-16">
      <div className="mb-16">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-ink-200 px-3 py-1 font-mono text-xs text-ink-500">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
          {siteConfig.designSystemVersion} — {implementedCount} Beta React components
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">
          One foundation.
          <br />
          Every surface.
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-500">
          Skrewww is an AI-first design system platform. The same {totalComponents} components
          adapt through tokens — never forks — across shape, surface, brand, and eventually
          industry. Built to be read by designers, developers, and coding agents alike.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Button href="/components">Browse components</Button>
          <Button href="/foundations" variant="secondary">
            View foundations
          </Button>
        </div>
      </div>

      <div className="mb-16">
        <h2 className="mb-1 font-mono text-xs font-medium uppercase tracking-wide text-ink-400">
          Architecture
        </h2>
        <p className="mb-6 text-sm text-ink-500">
          Every decision in this system is scoped to one of four layers. Status shown here is
          real, not aspirational.
        </p>
        <Card elevation="flat" bodyClassName="divide-y divide-ink-200 p-0">
          {layers.map((layer) => (
            <div key={layer.n} className="flex items-start gap-4 p-4">
              <span className="mt-0.5 font-mono text-xs text-ink-300">{layer.n}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-ink-900">{layer.name}</h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${toneClasses[layer.tone]}`}
                  >
                    {layer.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-ink-500">{layer.desc}</p>
              </div>
            </div>
          ))}
        </Card>
      </div>

      <Card elevation="flat" className="mb-16 bg-ink-50">
        <h2 className="mb-1 font-mono text-xs font-medium uppercase tracking-wide text-ink-400">
          Tokens, not hex codes
        </h2>
        <p className="mb-3 text-sm text-ink-500">
          Every color, radius, and shadow referenced in these docs is a real, resolvable token —
          not prose describing one. This is what a Button actually points to:
        </p>
        <TokenPill token="semantic/action/primary" />{" "}
        <TokenPill token="component/radius/control" />{" "}
        <TokenPill token="semantic/focus-ring" />
      </Card>

      <div>
        <h2 className="mb-4 font-mono text-xs font-medium uppercase tracking-wide text-ink-400">
          Components by category
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {counts.map(({ category, count }) => (
            <Link
              key={category}
              href={getCategoryPageHref(category as CategoryName)}
              className="rounded-lg border border-ink-200 p-4 hover:border-brand-500 hover:bg-brand-50/40"
            >
              <div className="text-2xl font-semibold text-ink-900">{count}</div>
              <div className="mt-0.5 text-sm text-ink-500">{category}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
