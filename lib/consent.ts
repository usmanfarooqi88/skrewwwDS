/**
 * Single canonical analytics-consent state, persisted client-side. This is
 * the one source of truth both the consent UI (AnalyticsConsentProvider)
 * and the tracking guard (lib/ga.ts's trackGAEvent) read from — no other
 * module should read/write this key directly.
 *
 * Storage-only, no framework dependency: read/write never throw, so a
 * private-mode browser or a blocked localStorage degrades to "no stored
 * preference" rather than breaking the page.
 */

export const ANALYTICS_CONSENT_STORAGE_KEY = "skrewww.analyticsConsent.v1";

export type AnalyticsConsentValue = "granted" | "denied";

function isAnalyticsConsentValue(value: unknown): value is AnalyticsConsentValue {
  return value === "granted" || value === "denied";
}

/**
 * Returns the stored choice, or `null` for every case that isn't a clean
 * "granted"/"denied" read: first visit (nothing stored), a malformed/legacy
 * value, or storage being unavailable entirely (private mode, blocked,
 * SSR). Callers treat `null` as "undecided" — never as "denied" — so a
 * corrupted value re-prompts instead of silently locking analytics off.
 */
export function readStoredAnalyticsConsent(): AnalyticsConsentValue | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY);
    return isAnalyticsConsentValue(raw) ? raw : null;
  } catch {
    return null;
  }
}

/** Persists the choice. A no-op (not a throw) when storage is unavailable. */
export function writeStoredAnalyticsConsent(value: AnalyticsConsentValue): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, value);
  } catch {
    // Storage unavailable — the in-memory UI state still reflects the
    // choice for this page view; it just won't survive a reload.
  }
}
