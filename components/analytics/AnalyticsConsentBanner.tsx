"use client";

import { useAnalyticsConsent } from "@/components/analytics/AnalyticsConsentProvider";
import { Button } from "@/components/ui/Button";

/**
 * Non-modal analytics consent banner — fixed to the viewport bottom, no
 * backdrop, no focus trap, no motion. It only ever renders when
 * AnalyticsConsentProvider's showBanner is true (fresh visit with no valid
 * stored choice, or a returning visitor reopened it from the sidebar), so
 * a route with no GA configured never pays for this component at all.
 */
export function AnalyticsConsentBanner() {
  const { showBanner, allow, decline } = useAnalyticsConsent();

  if (!showBanner) return null;

  return (
    <div
      role="region"
      aria-label="Analytics preferences"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-200 bg-white/95 backdrop-blur-sm md:ml-64"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-8">
        <div>
          <p className="text-sm font-semibold text-ink-900">Analytics preferences</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-600">
            We use Google Analytics to understand how Skrewww is used and improve the experience.
            You can allow or decline analytics; essential site functionality works either way.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="secondary" size="sm" onClick={decline}>
            Decline
          </Button>
          <Button variant="primary" size="sm" onClick={allow}>
            Allow analytics
          </Button>
        </div>
      </div>
    </div>
  );
}
