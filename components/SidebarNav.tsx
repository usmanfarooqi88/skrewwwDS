"use client";

import Link from "next/link";
import { SidebarNavLink } from "@/components/SidebarNavLink";
import { allComponents } from "@/lib/data";
import { REDIRECTED_COMPONENT_SLUGS } from "@/lib/routes";
import { categories } from "@/lib/types";
import { industries } from "@/lib/industry-content";
import { useAnalyticsConsent } from "@/components/analytics/AnalyticsConsentProvider";

type SidebarNavProps = {
  onNavigate?: () => void;
};

export function SidebarNav({ onNavigate }: SidebarNavProps) {
  const { hasGA, reopen } = useAnalyticsConsent();
  const visibleComponents = allComponents.filter(
    (component) =>
      !REDIRECTED_COMPONENT_SLUGS.includes(
        component.slug as (typeof REDIRECTED_COMPONENT_SLUGS)[number],
      ),
  );

  // Industry-classified (Layer 4) components get their own "Industries"
  // group below — excluded here so they don't also appear flatly under
  // their Layer 2 `category`.
  const layer2Components = visibleComponents.filter((component) => !component.industry);

  return (
    <nav className="px-3 py-4" aria-label="Documentation">
      <SidebarNavLink href="/foundations" match="foundations" onNavigate={onNavigate}>
        Foundations
      </SidebarNavLink>
      <SidebarNavLink href="/changelog" onNavigate={onNavigate}>
        Changelog
      </SidebarNavLink>

      <div className="mt-4 space-y-4">
        {categories.map((category) => {
          const items = layer2Components.filter((component) => component.category === category);
          return (
            <div key={category}>
              <div className="px-3 pb-1 font-mono text-[11px] font-medium uppercase tracking-wide text-ink-400">
                {category}
              </div>
              <div className="space-y-0.5">
                {items.map((item) => (
                  <SidebarNavLink
                    key={item.slug}
                    href={`/components/${item.slug}`}
                    match="component"
                    slug={item.slug}
                    onNavigate={onNavigate}
                  >
                    {item.name}
                  </SidebarNavLink>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 border-t border-ink-200 pt-4">
        <div className="px-3 pb-2 font-mono text-[11px] font-semibold uppercase tracking-wide text-brand-500">
          Industries
        </div>
        <div className="space-y-3">
          {industries.map((industry) => {
            const items = visibleComponents.filter((component) => component.industry === industry);
            return (
              <div key={industry}>
                <div className="px-3 pb-1 pl-5 font-mono text-[11px] font-medium uppercase tracking-wide text-ink-400">
                  {industry}
                </div>
                <div className="space-y-0.5 pl-2">
                  {items.map((item) => (
                    <SidebarNavLink
                      key={item.slug}
                      href={`/components/${item.slug}`}
                      match="component"
                      slug={item.slug}
                      onNavigate={onNavigate}
                    >
                      {item.name}
                    </SidebarNavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {hasGA ? (
        <div className="mt-6 border-t border-ink-200 pt-3">
          <button
            type="button"
            onClick={() => {
              reopen();
              onNavigate?.();
            }}
            className="px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide text-ink-400 transition-colors hover:text-ink-700"
          >
            Analytics preferences
          </button>
        </div>
      ) : null}
    </nav>
  );
}
