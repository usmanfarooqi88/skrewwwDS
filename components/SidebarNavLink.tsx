"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { isSidebarNavLinkActive } from "@/lib/sidebar-nav";
import styles from "@/components/sidebar-nav-link.module.css";

type SidebarNavLinkProps = {
  href: string;
  children: ReactNode;
  match?: "exact" | "foundations" | "component";
  slug?: string;
  onNavigate?: () => void;
};

export function SidebarNavLink({
  href,
  children,
  match = "exact",
  slug,
  onNavigate,
}: SidebarNavLinkProps) {
  const pathname = usePathname();
  const isActive = isSidebarNavLinkActive(pathname, { href, match, slug });

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      onClick={() => onNavigate?.()}
      className={cn(
        styles.root,
        "block border-l-2 px-3 py-1.5 text-sm transition-colors",
        isActive
          ? cn(styles.active, "border-brand-500 font-medium text-ink-900")
          : cn(styles.inactive, "border-transparent text-ink-600 hover:text-ink-900"),
      )}
    >
      {children}
    </Link>
  );
}
