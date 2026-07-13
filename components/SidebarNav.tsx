"use client";

import Link from "next/link";
import { SidebarNavLink } from "@/components/SidebarNavLink";
import { allComponents } from "@/lib/data";
import { REDIRECTED_COMPONENT_SLUGS } from "@/lib/routes";
import { categories } from "@/lib/types";

type SidebarNavProps = {
  onNavigate?: () => void;
};

export function SidebarNav({ onNavigate }: SidebarNavProps) {
  const visibleComponents = allComponents.filter(
    (component) =>
      !REDIRECTED_COMPONENT_SLUGS.includes(
        component.slug as (typeof REDIRECTED_COMPONENT_SLUGS)[number],
      ),
  );

  return (
    <nav className="px-3 py-4" aria-label="Documentation">
      <SidebarNavLink href="/foundations" match="foundations" onNavigate={onNavigate}>
        Foundations
      </SidebarNavLink>

      <div className="mt-4 space-y-4">
        {categories.map((category) => {
          const items = visibleComponents.filter((component) => component.category === category);
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
    </nav>
  );
}
