import { useEffect, useRef } from "react";
import { track } from "@vercel/analytics";

/**
 * Typed custom-event map for Vercel Web Analytics. Adding an event here is
 * the only way to send it — trackEvent() rejects any name/property shape
 * that isn't listed, so a typo or an ad-hoc property can't silently ship.
 *
 * Every event is scoped to UI that is actually shipped today. Do not add an
 * entry for a nav item, search box, or CTA that doesn't exist yet — wire it
 * up when the UI lands instead.
 */
export type AnalyticsEventMap = {
  component_viewed: {
    slug: string;
    name: string;
    category: string;
  };
  component_code_copied: {
    slug: string;
  };
  navigation_cta_clicked: {
    label: string;
    href: string;
  };
};

export type AnalyticsEventName = keyof AnalyticsEventMap;

/**
 * Strips the query string and fragment from a path before it's sent as an
 * analytics property. URL params can carry sensitive data (tokens, emails,
 * redirect targets) that must never leave the browser as event metadata.
 */
export function sanitizeHref(href: string): string {
  const [path] = href.split(/[?#]/);
  return path;
}

type Sanitizer<E extends AnalyticsEventName> = (
  properties: AnalyticsEventMap[E],
) => AnalyticsEventMap[E];

const sanitizers: { [E in AnalyticsEventName]?: Sanitizer<E> } = {
  navigation_cta_clicked: (properties) => ({
    ...properties,
    href: sanitizeHref(properties.href),
  }),
};

/**
 * Fire a typed custom analytics event. Browser-only (a no-op during SSR/
 * static generation, where `window` doesn't exist) and never throws —
 * analytics must never break the UI, so any failure is swallowed silently
 * rather than surfaced as a console error.
 */
export function trackEvent<E extends AnalyticsEventName>(
  event: E,
  properties: AnalyticsEventMap[E],
): void {
  if (typeof window === "undefined") return;
  try {
    const sanitize = sanitizers[event] as Sanitizer<E> | undefined;
    track(event, sanitize ? sanitize(properties) : properties);
  } catch {
    // Analytics failures must never surface to the user or the console.
  }
}

/**
 * Fires `component_viewed` once per distinct slug. A ref (not just the
 * effect's dependency array) guards the send because React 18 Strict
 * Mode's development-only double-invoke of effects — mount, synthetic
 * cleanup, remount — would otherwise fire it twice on first render; refs
 * survive that synthetic cycle while re-running the effect body would not
 * be prevented by dependencies alone.
 */
export function useTrackComponentViewed(slug: string, name: string, category: string): void {
  const lastTrackedSlug = useRef<string | null>(null);

  useEffect(() => {
    if (lastTrackedSlug.current === slug) return;
    lastTrackedSlug.current = slug;
    trackEvent("component_viewed", { slug, name, category });
  }, [slug, name, category]);
}
