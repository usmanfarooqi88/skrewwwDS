import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { allComponents, getComponentBySlug } from "@/lib/data";
import { getRegistryEntry, hasLiveImplementation } from "@/lib/component-registry";
import { getComponentPageMetadata } from "@/lib/registry-seo";
import { getCanonicalComponentSlug, REDIRECTED_COMPONENT_SLUGS } from "@/lib/routes";
import { DocSection } from "@/components/DocSection";
import { JsonLd } from "@/components/docs/JsonLd";
import { getCategoryPageHref } from "@/lib/category-content";
import type { CategoryName } from "@/lib/category-content";
import { componentPageJsonLd } from "@/lib/structured-data";
import { TokenPillRow } from "@/components/TokenPill";
import { ComponentApiSection } from "@/components/docs/ComponentApiSection";
import { ComponentLiveSection } from "@/components/docs/ComponentLiveSection";
import {
  ComponentBreadcrumbs,
  ComponentRelatedLinks,
  ComponentStatusPanel,
  DocumentationOnlyStatusPanel,
} from "@/components/docs/ComponentPageMeta";

export function generateStaticParams() {
  return allComponents
    .filter(
      (component) =>
        !REDIRECTED_COMPONENT_SLUGS.includes(
          component.slug as (typeof REDIRECTED_COMPONENT_SLUGS)[number],
        ),
    )
    .map((component) => ({ slug: component.slug }));
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  return getComponentPageMetadata(params.slug);
}

export default async function ComponentDetailPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const canonicalSlug = getCanonicalComponentSlug(params.slug);
  const component = getComponentBySlug(params.slug);
  const registry = getRegistryEntry(canonicalSlug);
  if (!component) notFound();

  const showLive = hasLiveImplementation(canonicalSlug);
  const intro = registry?.summary ?? component.purpose;

  return (
    <article className="mx-auto max-w-3xl px-8 py-16">
      <JsonLd data={componentPageJsonLd(canonicalSlug)} />
      <ComponentBreadcrumbs
        slug={params.slug}
        name={component.name}
        category={component.category}
      />

      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-wide text-brand-500">
          {component.category}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink-900">
          {component.name}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-ink-600">{intro}</p>
        {canonicalSlug === "form-field" ? (
          <p className="mt-2 text-sm text-ink-500">
            Figma naming reference: <span className="font-medium">Form Field Wrapper</span>.
            React implementation: <span className="font-medium">FormField</span>.
          </p>
        ) : null}
        {component.variants ? (
          <p className="mt-2 font-mono text-sm text-ink-400">{component.variants}</p>
        ) : null}
      </header>

      {showLive ? <ComponentStatusPanel slug={canonicalSlug} /> : null}
      {!showLive ? <DocumentationOnlyStatusPanel slug={canonicalSlug} /> : null}

      {showLive ? (
        <section aria-label="Interactive component preview" className="mb-8">
          <ComponentLiveSection slug={canonicalSlug} />
        </section>
      ) : null}

      <div className="space-y-4">
        <DocSection label="Purpose">{component.purpose}</DocSection>

        {registry?.anatomy ? (
          <DocSection label="Anatomy">{registry.anatomy}</DocSection>
        ) : null}

        {registry?.supportedVariants.length ? (
          <DocSection label="Variants and states">
            {registry.supportedVariants.join(" · ")}
          </DocSection>
        ) : null}

        <DocSection label="When to use">{component.whenToUse}</DocSection>
        <DocSection label="When not to use">{component.whenNotToUse}</DocSection>
        <DocSection label="Accessibility">{component.accessibility}</DocSection>

        {registry?.keyboardBehavior ? (
          <DocSection label="Keyboard behavior">{registry.keyboardBehavior}</DocSection>
        ) : null}

        <DocSection label="Common mistakes" tone="danger">
          {component.commonMistakes}
        </DocSection>

        {component.properties ? (
          <DocSection label="Properties">{component.properties}</DocSection>
        ) : null}

        {registry?.comparisons?.map((item) => (
          <DocSection key={item.title} label={item.title}>
            {item.body}
          </DocSection>
        ))}

        <DocSection label="Tokens used">
          <TokenPillRow tokens={component.tokensUsed} />
        </DocSection>

        {component.knownLimitation ? (
          <DocSection label="Known limitation" tone="info">
            {component.knownLimitation}
          </DocSection>
        ) : null}

        <ComponentApiSection slug={canonicalSlug} />

        {showLive ? (
          <div className="pt-2">
            <ComponentRelatedLinks slug={canonicalSlug} />
          </div>
        ) : null}
      </div>

      <footer className="mt-10 border-t border-ink-200 pt-4">
        <Link
          href={getCategoryPageHref(component.category as CategoryName)}
          className="text-sm text-ink-400 hover:text-ink-700"
        >
          Back to {component.category} components
        </Link>
      </footer>
    </article>
  );
}
