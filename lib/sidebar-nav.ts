import { getCanonicalComponentSlug } from "@/lib/routes";

type SidebarNavMatch = "exact" | "foundations" | "component";

type SidebarNavLinkTarget = {
  href: string;
  match?: SidebarNavMatch;
  slug?: string;
};

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
