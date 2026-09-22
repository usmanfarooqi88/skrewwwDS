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
 * Horizontal counterpart to `SidebarNavLink` — same ink/brand tokens, same
 * `aria-current="page"` convention, different (underline, not left-border)
 * active treatment because it sits in a horizontal row.
 */
export function HeaderNavLink({ href, isActive, children, onNavigate, className }: HeaderNavLinkProps) {
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      onClick={() => onNavigate?.()}
      className={cn(
        "border-b-2 py-1 text-sm font-medium transition-colors",
        isActive
          ? "border-brand-500 text-ink-900"
          : "border-transparent text-ink-600 hover:text-ink-900",
        className,
      )}
    >
      {children}
    </Link>
  );
}
