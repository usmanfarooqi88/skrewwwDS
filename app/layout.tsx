import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Sidebar } from "@/components/Sidebar";
import { MobileDocsNav } from "@/components/MobileDocsNav";
import { AppProviders } from "@/components/providers/AppProviders";
import { JsonLd } from "@/components/docs/JsonLd";
import { siteStructuredData } from "@/lib/structured-data";
import { getDefaultSocialImageUrl, siteConfig } from "@/lib/site-config";

// Self-hosted via next/font/google (was a render-blocking external
// fonts.googleapis.com @import in globals.css — measured ~400ms added to
// every route's first paint since it's on the critical rendering path).
// Same families/weights/display strategy as before; next/font also applies
// a size-adjusted fallback automatically, reducing font-swap layout shift.
//
// Keep the explicit `weight` arrays. These already resolve to the variable
// font (one file serves every listed weight), and naming the weights lets
// next/font subset the variable weight axis: JetBrains Mono ships 400-600
// at 31KB here versus 40KB for the full 100-800 range you get by omitting
// `weight`. Only the two latin files below are preloaded/requested; the
// other generated woff2 files are unrequested unicode-range subsets.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.origin),
  title: {
    default: siteConfig.name,
    template: `%s — ${siteConfig.shortName}`,
  },
  description: siteConfig.description,
  alternates: {
    canonical: siteConfig.origin,
  },
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.origin,
    siteName: siteConfig.name,
    type: "website",
    images: [{ url: getDefaultSocialImageUrl() }],
  },
};

// GA4 only — set in Vercel's production environment. Unset locally by
// default (see .env.example), so dev/preview traffic never reaches the real
// property. The tag itself (and its consent-default script below) render
// only when this is configured.
const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-skrewww-shape="rounded"
      data-skrewww-surface="flat"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-white font-sans text-ink-900 antialiased">
        <JsonLd data={siteStructuredData()} />
        {/*
          Analytics/SpeedInsights must render before AppProviders in this
          tree. React commits sibling effects in JSX order, and Analytics's
          own mount effect is what defines window.va — any custom trackEvent()
          call fired from a mount effect nested inside AppProviders (e.g.
          ComponentViewTracker) would otherwise race ahead of it and silently
          no-op on window.va being undefined.
        */}
        <Analytics />
        <SpeedInsights />
        {gaMeasurementId ? (
          <>
            {/*
              Consent Mode v2 defaults, set beforeInteractive so they land in
              <head> and run before GoogleAnalytics's own afterInteractive
              script below. Skrewww has no consent-collection UI yet (no
              cookie banner exists in this repo) and this deliberately does
              NOT claim compliance on its own — it only ships the technical
              default-deny groundwork: every visitor, EEA or not, starts
              denied for ad/analytics storage and gets cookieless/modeled GA4
              pings until something calls gtag('consent', 'update', ...). Wire
              that call up from a real consent banner before treating this as
              sufficient for EEA compliance.
            */}
            <Script id="ga-consent-default" strategy="beforeInteractive">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  wait_for_update: 500
});`}
            </Script>
            <GoogleAnalytics gaId={gaMeasurementId} />
          </>
        ) : null}
        <AppProviders>
          <Sidebar />
          <MobileDocsNav />
          <main className="min-h-screen md:ml-64">{children}</main>
        </AppProviders>
      </body>
    </html>
  );
}
