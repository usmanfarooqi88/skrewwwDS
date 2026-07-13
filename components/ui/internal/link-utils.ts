import { siteConfig } from "@/lib/site-config";

function normalizeHref(href: string): string {
  return href.trim();
}

export function isHashHref(href: string): boolean {
  return normalizeHref(href).startsWith("#");
}

export function isSpecialProtocolHref(href: string): boolean {
  const value = normalizeHref(href).toLowerCase();
  return value.startsWith("mailto:") || value.startsWith("tel:");
}

export function isExternalHref(href: string, origin: string = siteConfig.origin): boolean {
  const value = normalizeHref(href);

  if (!value || isHashHref(value) || value.startsWith("/") || value.startsWith("./") || value.startsWith("../")) {
    return false;
  }

  if (isSpecialProtocolHref(value)) {
    return true;
  }

  if (value.startsWith("//")) {
    return true;
  }

  if (/^https?:\/\//i.test(value)) {
    try {
      return new URL(value).origin !== origin;
    } catch {
      return true;
    }
  }

  return false;
}

export function shouldUseNativeAnchor(href: string, origin: string = siteConfig.origin): boolean {
  const value = normalizeHref(href);
  return isSpecialProtocolHref(value) || isExternalHref(value, origin);
}

export function getLinkRel(
  target?: string,
  rel?: string,
): string | undefined {
  if (rel) return rel;
  if (target === "_blank") return "noopener noreferrer";
  return undefined;
}
