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

/**
 * True only for root-relative internal paths ("/components/button"). These are
 * the only hrefs a host router can be asked to navigate to: hash-only links,
 * relative paths, protocol-relative URLs, mailto:/tel: and absolute URLs are
 * left to the browser so native behavior (scrolling, resolution against the
 * current URL, other origins) is never reimplemented.
 */
export function isRouterNavigableHref(href: string): boolean {
  const value = normalizeHref(href);
  return value.startsWith("/") && !value.startsWith("//");
}

export type NavigationInterceptionInput = {
  href: string;
  target?: string;
  download?: unknown;
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  defaultPrevented: boolean;
};

/**
 * Whether a click on an anchor should be handed to the host router instead of
 * the browser. Only a plain, primary-button, same-window activation of an
 * internal path qualifies; every case where the browser should win returns
 * false.
 */
export function shouldInterceptNavigation(input: NavigationInterceptionInput): boolean {
  if (input.defaultPrevented) return false;
  if (input.button !== 0) return false;
  if (input.metaKey || input.ctrlKey || input.shiftKey || input.altKey) return false;
  if (input.target && input.target !== "_self") return false;
  if (input.download !== undefined && input.download !== false) return false;
  return isRouterNavigableHref(input.href);
}
