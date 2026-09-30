"use client";

import { useAnalyticsConsent } from "@/components/analytics/AnalyticsConsentProvider";

/**
 * The one control that lets a returning visitor reopen the analytics
 * preferences banner and change an earlier choice. It only calls the
 * provider's own `reopen()` — no consent state, storage or gating lives here.
 *
 * Renders nothing when Google Analytics isn't configured for this
 * environment (there is nothing to consent to). Mounted by the docs shell
 * (DocsChromeClient) and the Reference App shell (ReferenceShell), so the
 * control is reachable on every route without depending on any sidebar.
 */
export function AnalyticsPreferencesTrigger() {
  const { hasGA, reopen } = useAnalyticsConsent();

  if (!hasGA) return null;

  return (
    <button
      type="button"
      onClick={reopen}
      className="rounded-sm px-1 py-1.5 text-xs text-ink-500 underline-offset-2 transition-colors hover:text-ink-900 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
    >
      Analytics preferences
    </button>
  );
}
