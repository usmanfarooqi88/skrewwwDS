"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";
import {
  readStoredAnalyticsConsent,
  writeStoredAnalyticsConsent,
  type AnalyticsConsentValue,
} from "@/lib/consent";

/**
 * "loading" is the SSR value and the first client render, before the mount
 * effect has had a chance to read localStorage — it's identical on server
 * and client, so there's no hydration mismatch. It resolves to "undecided"
 * (no valid stored choice — show the banner) or the stored value on the
 * very next paint.
 */
type ConsentUIState = "loading" | "undecided" | AnalyticsConsentValue;

type AnalyticsConsentContextValue = {
  /** Whether a GA4 Measurement ID is configured at all — false means there's nothing to consent to. */
  hasGA: boolean;
  state: ConsentUIState;
  /** True while the banner (fresh visit, or a reopened preferences view) should render. */
  showBanner: boolean;
  allow: () => void;
  decline: () => void;
  /** Re-shows the banner so a returning visitor can change their choice. */
  reopen: () => void;
};

const defaultContextValue: AnalyticsConsentContextValue = {
  hasGA: false,
  state: "loading",
  showBanner: false,
  allow: () => {},
  decline: () => {},
  reopen: () => {},
};

const AnalyticsConsentContext = createContext<AnalyticsConsentContextValue>(defaultContextValue);

/**
 * Sends a Consent Mode v2 update. Only `analytics_storage` ever moves —
 * the three ad-related signals stay denied regardless of the visitor's
 * analytics choice, per Skrewww's Basic Consent Mode contract. A no-op
 * (not a throw) if the beforeInteractive bootstrap script in app/layout.tsx
 * hasn't defined window.gtag yet, which only happens if GA isn't
 * configured for this environment at all.
 */
function pushConsentUpdate(value: AnalyticsConsentValue): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("consent", "update", {
    analytics_storage: value === "granted" ? "granted" : "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
}

export function AnalyticsConsentProvider({
  gaMeasurementId,
  children,
}: {
  /** Undefined/empty when GA isn't configured for this environment — the whole feature is inert then. */
  gaMeasurementId?: string;
  children: ReactNode;
}) {
  const hasGA = Boolean(gaMeasurementId);
  const [state, setState] = useState<ConsentUIState>("loading");
  const [forceOpen, setForceOpen] = useState(false);

  // Runs once, after hydration — the only place allowed to read
  // localStorage, so the very first client render always matches the
  // server's ("loading", no banner, no GA). The setState-in-effect this
  // triggers is the deliberate, minimal way to read a browser-only store
  // without a hydration mismatch — there's no external-system subscription
  // to model here (readStoredAnalyticsConsent is a one-shot read, not a
  // stream), so useSyncExternalStore would be strictly more machinery for
  // the same one render-cycle delay.
  useEffect(() => {
    if (!hasGA) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot hydration-safe localStorage read, see comment above
    setState(readStoredAnalyticsConsent() ?? "undecided");
  }, [hasGA]);

  const allow = useCallback(() => {
    writeStoredAnalyticsConsent("granted");
    pushConsentUpdate("granted");
    setState("granted");
    setForceOpen(false);
  }, []);

  const decline = useCallback(() => {
    writeStoredAnalyticsConsent("denied");
    pushConsentUpdate("denied");
    setState("denied");
    setForceOpen(false);
  }, []);

  const reopen = useCallback(() => setForceOpen(true), []);

  const showBanner = hasGA && (state === "undecided" || forceOpen);

  return (
    <AnalyticsConsentContext.Provider value={{ hasGA, state, showBanner, allow, decline, reopen }}>
      {children}
      {/*
        Mounted only once the visitor has explicitly granted analytics
        consent — never on "loading"/"undecided"/"denied". This is the one
        thing that actually fetches gtag.js from Google; everything before
        it (the beforeInteractive consent-default script) only touches a
        local, in-page dataLayer array and makes no network request.
      */}
      {hasGA && state === "granted" ? <GoogleAnalytics gaId={gaMeasurementId!} /> : null}
    </AnalyticsConsentContext.Provider>
  );
}

export function useAnalyticsConsent(): AnalyticsConsentContextValue {
  return useContext(AnalyticsConsentContext);
}
