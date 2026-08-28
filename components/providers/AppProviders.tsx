"use client";

import { ToastProvider } from "@/components/ui/ToastProvider";
import { AnalyticsConsentProvider } from "@/components/analytics/AnalyticsConsentProvider";
import { AnalyticsConsentBanner } from "@/components/analytics/AnalyticsConsentBanner";

export function AppProviders({
  children,
  gaMeasurementId,
}: {
  children: React.ReactNode;
  /** Undefined when GA isn't configured for this environment — see app/layout.tsx. */
  gaMeasurementId?: string;
}) {
  return (
    <AnalyticsConsentProvider gaMeasurementId={gaMeasurementId}>
      <ToastProvider>
        {children}
        <AnalyticsConsentBanner />
      </ToastProvider>
    </AnalyticsConsentProvider>
  );
}
