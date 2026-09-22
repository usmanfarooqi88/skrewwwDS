"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { isSectionNavItemActive, type SectionNavModel } from "@/lib/section-nav";
import styles from "@/components/sidebar-nav-link.module.css";

export function SectionNav({ model, onNavigate }: { model: SectionNavModel; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="px-3 py-4" aria-label={`${model.label} section`} data-section-nav={model.section}>
      <div className="px-3 pb-3 font-mono text-xs font-semibold uppercase tracking-wide text-ink-900">
        {model.label}
      </div>
      <div className="space-y-4">
        {model.groups.map((group, index) => (
          <div key={group.label ?? index}>
            {group.label ? (
              <div className="px-3 pb-1 font-mono text-[11px] font-medium uppercase tracking-wide text-ink-400">
                {group.label}
              </div>
            ) : null}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isSectionNavItemActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={onNavigate}
                    className={cn(
                      styles.root,
                      "block border-l-2 px-3 py-1.5 text-sm transition-colors",
                      active
                        ? cn(styles.active, "border-brand-500 font-medium text-ink-900")
                        : cn(styles.inactive, "border-transparent text-ink-600 hover:text-ink-900"),
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
}
