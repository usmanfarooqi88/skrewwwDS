"use client";

import { ToastProvider } from "@/components/ui/ToastProvider";
import { AnalyticsConsentProvider } from "@/components/analytics/AnalyticsConsentProvider";
import { AnalyticsConsentBanner } from "@/components/analytics/AnalyticsConsentBanner";
import { NextRouterIntegration } from "@/components/providers/NextRouterIntegration";

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
        <NextRouterIntegration>{children}</NextRouterIntegration>
        <AnalyticsConsentBanner />
      </ToastProvider>
    </AnalyticsConsentProvider>
  );
}
