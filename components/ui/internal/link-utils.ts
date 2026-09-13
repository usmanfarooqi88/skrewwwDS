/**
 * Framework-neutral link classification helpers.
 * No docs-site / repository configuration imports — origin is either passed
 * explicitly or read from the runtime location when available.
 */

function normalizeHref(href: string): string {
  return href.trim();
}

function resolveDefaultOrigin(): string | undefined {
  if (typeof globalThis === "undefined") return undefined;
  const locationLike = (globalThis as { location?: { origin?: string } }).location;
  return locationLike?.origin;
}

export function isHashHref(href: string): boolean {
  return normalizeHref(href).startsWith("#");
}

export function isSpecialProtocolHref(href: string): boolean {
  const value = normalizeHref(href).toLowerCase();
  return value.startsWith("mailto:") || value.startsWith("tel:");
}

export function isExternalHref(href: string, origin: string | undefined = resolveDefaultOrigin()): boolean {
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
    if (!origin) {
      // No origin context (SSR without an explicit origin) — treat absolute
      // http(s) as external so NextLink is not used for foreign hosts.
      return true;
    }
    try {
      return new URL(value).origin !== origin;
    } catch {
      return true;
    }
  }

  return false;
}

export function shouldUseNativeAnchor(
  href: string,
  origin: string | undefined = resolveDefaultOrigin(),
): boolean {
  const value = normalizeHref(href);
  return isSpecialProtocolHref(value) || isExternalHref(value, origin);
}

export function getLinkRel(target?: string, rel?: string): string | undefined {
  if (rel) return rel;
  if (target === "_blank") return "noopener noreferrer";
  return undefined;
}
