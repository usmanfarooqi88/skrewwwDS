import type { ReferenceNavItem } from "@/lib/reference-app/types";

/** Shared nav tree for desktop aside and mobile Drawer — one source of truth. */
export const REFERENCE_NAV_ITEMS: readonly ReferenceNavItem[] = [
  { href: "/reference", label: "Overview", match: "exact" },
  { href: "/reference/data", label: "Requests", match: "exact" },
  { href: "/reference/new", label: "New request", match: "exact" },
  { href: "/reference/settings", label: "Settings", match: "exact" },
] as const;

export function isReferenceNavItemActive(
  pathname: string,
  item: Pick<ReferenceNavItem, "href" | "match">,
): boolean {
  if (item.match === "exact") {
    return pathname === item.href;
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
