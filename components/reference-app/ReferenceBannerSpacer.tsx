"use client";

import { useEffect, useState } from "react";
import { useAnalyticsConsent } from "@/components/analytics/AnalyticsConsentProvider";

/**
 * Reserves scroll space equal to the fixed AnalyticsConsentBanner's real
 * rendered height so Reference App content never ends up underneath it.
 * The banner is fixed/bottom-pinned and rendered outside the Reference
 * App's own tree (in AppProviders), so ordinary document flow has no
 * reason to account for it on its own — without this, a bottom-of-page
 * trigger (e.g. the overlay collision-audit Menu) can render fully
 * occluded by the banner for a first-time visitor with undecided consent.
 *
 * Height is measured live via ResizeObserver, not a guessed constant,
 * since the banner's text wraps to a different height per viewport width.
 */
export function ReferenceBannerSpacer() {
  const { showBanner } = useAnalyticsConsent();
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (!showBanner) return;

    const banner = document.querySelector<HTMLElement>(
      '[role="region"][aria-label="Analytics preferences"]',
    );
    if (!banner) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setHeight(entry.contentRect.height);
    });
    observer.observe(banner);

    return () => observer.disconnect();
  }, [showBanner]);

  if (!showBanner || height === 0) return null;
  return <div aria-hidden="true" style={{ height }} />;
}
