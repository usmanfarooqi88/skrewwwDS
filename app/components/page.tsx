import Link from "next/link";
import { allComponents } from "@/lib/data";
import { categories } from "@/lib/types";
import { getCategoryPageHref } from "@/lib/category-content";
import type { CategoryName } from "@/lib/category-content";
import { INDUSTRIES_INDEX_HREF } from "@/lib/industry-content";
import { getImplementedRegistryEntries } from "@/lib/component-registry";
import { REDIRECTED_COMPONENT_SLUGS, getComponentHref } from "@/lib/routes";

export default function ComponentsIndexPage() {
  const implementedCount = getImplementedRegistryEntries().length;

  return (
    <div className="mx-auto max-w-4xl px-8 py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Components</h1>
      <p className="mt-2 text-sm text-ink-500">
        {allComponents.length} documented components across {categories.length} categories.
        {implementedCount} have Beta React implementations with live previews.
      </p>
      <p className="mt-2 text-sm text-ink-500">
        Layer 4 Industry Systems components (Banking and future industries) are grouped
        separately — see{" "}
        <Link href={INDUSTRIES_INDEX_HREF} className="text-brand-600 hover:text-brand-700">
          Industries
        </Link>
        .
      </p>

      <div className="mt-10 space-y-10">
        {categories.map((category) => {
          const items = allComponents.filter(
            (component) =>
              component.category === category &&
              !component.industry &&
              !REDIRECTED_COMPONENT_SLUGS.includes(
                component.slug as (typeof REDIRECTED_COMPONENT_SLUGS)[number],
              ),
          );
          return (
            <div key={category}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-ink-900">
                  <Link
                    href={getCategoryPageHref(category as CategoryName)}
                    className="hover:text-brand-600"
                  >
                    {category}
                  </Link>
                </h2>
                <Link
                  href={getCategoryPageHref(category as CategoryName)}
                  className="font-mono text-[11px] text-ink-400 hover:text-ink-700"
                >
                  Category page
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {items.map((item) => (
                  <Link
                    key={item.slug}
                    href={getComponentHref(item.slug)}
                    className="rounded-lg border border-ink-200 p-3.5 hover:border-brand-500 hover:bg-brand-50/40"
                  >
                    <div className="text-sm font-medium text-ink-900">{item.name}</div>
                    {item.variants && (
                      <div className="mt-0.5 font-mono text-[11px] text-ink-400">
                        {item.variants}
                      </div>
                    )}
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
