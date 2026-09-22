"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type HeaderNavLinkProps = {
  href: string;
  isActive: boolean;
  children: ReactNode;
  onNavigate?: () => void;
  className?: string;
};

/**
 * A single global-header nav link (Docs/Components/Charts/Agent Kit).
 *
 * Visually follows the canonical Tabs language (components/ui/Tabs.tsx +
 * tabs.module.css), reusing its exact tokens rather than duplicating
 * hard-coded values: `--tab-text`/`--tab-active-text` for text color,
 * `--tab-active-indicator`/`--tab-indicator-thickness` for the active
 * underline, `--tab-padding-x` for the indicator's inset (matching
 * Tabs' `.triggerActive::after`), `--tab-font-size`/`--tab-transition-duration`.
 * The link stretches to the header row's full height (parent uses
 * `items-stretch`) so its own bottom edge — where the indicator sits —
 * lands exactly on the header's shared bottom divider, with no separate
 * floating underline. No `role="tab"`/`aria-selected` — this is page
 * navigation, not a tab panel; semantics stay `aria-current="page"`.
 */
export function HeaderNavLink({ href, isActive, children, onNavigate, className }: HeaderNavLinkProps) {
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      onClick={() => onNavigate?.()}
      className={cn(
        "relative flex h-full items-center whitespace-nowrap px-[var(--tab-padding-x)] text-[length:var(--tab-font-size)] font-medium transition-colors duration-[var(--tab-transition-duration)] ease-out",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--semantic-focus-ring)]",
        isActive
          ? "text-[var(--tab-active-text)] after:absolute after:inset-x-[var(--tab-padding-x)] after:bottom-0 after:h-[var(--tab-indicator-thickness)] after:rounded-full after:bg-[var(--tab-active-indicator)] after:content-['']"
          : "text-[var(--tab-text)] hover:text-[var(--tab-active-text)]",
        className,
      )}
    >
      {children}
    </Link>
  );
}
