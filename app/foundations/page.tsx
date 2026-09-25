import Link from "next/link";
import type { Metadata } from "next";
import { TokenPill } from "@/components/TokenPill";
import { absoluteUrl, siteConfig } from "@/lib/site-config";
import { pageSocialMetadata } from "@/lib/social-metadata";

const title = `Foundations — ${siteConfig.name}`;
const description =
  "Skrewww design-system foundations: the Primitive, Semantic, Component, Brand, Shape, and Surface token collections that every component builds on.";
const url = absoluteUrl("/foundations");

export const metadata: Metadata = {
  // absolute avoids root template `%s — Skrewww` doubling the site name
  // (changelog/category still use a plain string; keep foundations clean).
  title: { absolute: title },
  description,
  alternates: { canonical: url },
  ...pageSocialMetadata({ title, description, url }),
};

const collections = [
  {
    name: "Primitive",
    modes: ["Value"],
    count: 132,
    desc: "Raw values — color scales, spacing, radius, shadow, duration, easing, breakpoints. Never referenced directly by components.",
  },
  {
    name: "Semantic",
    modes: ["Light", "Dark"],
    count: 25,
    desc: "Purpose-based tokens aliased to Primitive — background, surface, text, border, action, feedback, icon.",
  },
  {
    name: "Component",
    modes: ["Mode 1"],
    count: 1,
    desc: "Controlled exceptions for specific components. Mostly still a placeholder.",
  },
  {
    name: "Brand",
    modes: ["Mode 1"],
    count: 1,
    desc: "Brand-level overrides on top of Semantic. Electric Violet (#6C4CF2) is the confirmed brand color.",
  },
  {
    name: "Shape",
    modes: ["Sharp", "Rounded", "Pill", "Squircle", "Brand Shape"],
    count: 2,
    desc: "Mode-per-personality radius tokens — component/radius/control and component/radius/container — proving real shape-switching across the library.",
  },
  {
    name: "Surface",
    modes: ["Flat", "Gradient", "Glass"],
    count: 6,
    desc: "Mode-per-personality fill/border/blur/content tokens plus the Stable-v1 fixed 90deg Gradient overlay — semantic base fills remain unchanged.",
  },
];

export default function FoundationsPage() {
  return (
    <div className="mx-auto max-w-3xl px-8 py-10 sm:py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Foundations</h1>
      <p className="mt-2 text-sm text-ink-500">
        Six variable collections — Primitive, Semantic, Component, Brand, Shape, and Surface.
        Everything else in this system is built on top of these — the{" "}
        <Link href="/components" className="underline">
          components
        </Link>{" "}
        never hardcode a raw value.
      </p>

      <div className="mt-10 space-y-4">
        {collections.map((c) => (
          <div key={c.name} id={c.name.toLowerCase()} className="rounded-lg border border-ink-200 p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-mono text-sm font-semibold text-ink-900">{c.name}</h2>
              <span className="font-mono text-xs text-ink-400">{c.count} variables</span>
            </div>
            <p className="mt-1.5 text-sm text-ink-500">{c.desc}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {c.modes.map((m) => (
                <span
                  key={m}
                  className="rounded-full bg-ink-100 px-2 py-0.5 font-mono text-[11px] text-ink-600"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-lg border border-ink-200 bg-ink-50 p-4">
        <h2 className="mb-2 font-mono text-xs font-medium uppercase tracking-wide text-ink-400">
          Example resolution chain
        </h2>
        <p className="mb-3 text-sm text-ink-500">
          A component never points at a hex code. It points at a Semantic token, which points at
          a Primitive:
        </p>
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-ink-600">
          <TokenPill token="semantic/action/primary" />
          <span className="text-ink-300">→</span>
          <TokenPill token="color/brand/600" />
          <span className="text-ink-300">→</span>
          <span className="text-ink-400">#6C4CF2</span>
        </div>
      </div>
    </div>
  );
}
