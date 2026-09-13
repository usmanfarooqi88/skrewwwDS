import { getCanonicalComponentSlug } from "@/lib/routes";

type SidebarNavMatch = "exact" | "foundations" | "component";

type SidebarNavLinkTarget = {
  href: string;
  match?: SidebarNavMatch;
  slug?: string;
};

// Sidebar release-status badges. This is release metadata about a nav
// destination (e.g. "recently added"), not a product's own maturity
// indicator — Agent Kit's separate Beta label on its own page describes
// Agent Kit's maturity and is unaffected by this.
//
// Governance:
// - "new": temporary. Remove after ~30-45 days or 1-2 meaningful releases,
//   whichever comes first — it marks recency, not a permanent trait.
// - "updated": for a significant, recent change to an existing destination.
// - "beta": product maturity (rarely needed here; most maturity signals
//   belong on the destination's own page, as Agent Kit's does).
// - "pro": only for a destination that is genuinely paid/pro-only.
// Keep at most ~1-2 visible sidebar badges at a time so they stay
// meaningful; don't add one speculatively.
export type NavBadgeStatus = "new" | "updated" | "beta" | "pro";

export type PrimaryNavLink = {
  label: string;
  href: string;
  match?: SidebarNavMatch;
  badge?: NavBadgeStatus;
};

export const primaryNavLinks: PrimaryNavLink[] = [
  { label: "Foundations", href: "/foundations", match: "foundations" },
  { label: "Agent Kit", href: "/agent-kit", badge: "new" },
  { label: "Changelog", href: "/changelog" },
];

export function getActiveComponentSlug(pathname: string): string | null {
  const match = pathname.match(/^\/components\/([^/]+)$/);
  if (!match) return null;
  return getCanonicalComponentSlug(match[1]);
}

export function isSidebarNavLinkActive(
  pathname: string,
  { href, match = "exact", slug }: SidebarNavLinkTarget,
): boolean {
  if (match === "foundations") {
    return pathname === "/foundations" || pathname.startsWith("/foundations/");
  }

  if (match === "component") {
    if (!slug) return false;
    const activeSlug = getActiveComponentSlug(pathname);
    if (!activeSlug) return false;
    return getCanonicalComponentSlug(slug) === activeSlug;
  }

  return pathname === href;
}
