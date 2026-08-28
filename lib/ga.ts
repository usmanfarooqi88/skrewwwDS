import { sanitizeHref } from "@/lib/analytics";

/**
 * Named GA4 business events, fired via `gtag()` (loaded through
 * `@next/third-parties/google`'s <GoogleAnalytics> in app/layout.tsx).
 * Separate from lib/analytics.ts's Vercel Web Analytics event map — the two
 * providers are independent and this module never touches @vercel/analytics.
 *
 * Only add an entry here once the CTA it tracks is actually shipped. As of
 * this writing, `free_figma_click` and `pro_gumroad_click` are wired to the
 * two outbound links in components/HomeHeroCtas.tsx — the only outbound
 * Figma/Gumroad CTAs in the site. There is currently no GitHub CTA anywhere
 * in the shipped UI (confirmed by repo-wide search), so a `github_click`
 * entry is intentionally not defined yet — add it here, the same way, once
 * a real GitHub link ships.
 */
export type GAEventName = "free_figma_click" | "pro_gumroad_click";

export type GAEventProperties = {
  /** Stable, descriptive location of the CTA, e.g. "home_hero". */
  cta_location: string;
  /** The outbound URL the click leads to (query string/fragment stripped). */
  destination: string;
};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Fire a named GA4 event. Browser-only (a no-op during SSR/static
 * generation, and whenever GA hasn't loaded — e.g. NEXT_PUBLIC_GA_MEASUREMENT_ID
 * is unset, or the request was blocked) and never throws — analytics must
 * never break the UI. `page_path` is filled in from the current location
 * rather than passed by callers, so it can't go stale.
 */
export function trackGAEvent(name: GAEventName, properties: GAEventProperties): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  try {
    window.gtag("event", name, {
      cta_location: properties.cta_location,
      destination: sanitizeHref(properties.destination),
      page_path: window.location.pathname,
    });
  } catch {
    // Analytics failures must never surface to the user or the console.
  }
}
