import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Sidebar } from "@/components/Sidebar";
import { MobileDocsNav } from "@/components/MobileDocsNav";
import { AppProviders } from "@/components/providers/AppProviders";
import { JsonLd } from "@/components/docs/JsonLd";
import { siteStructuredData } from "@/lib/structured-data";
import { getDefaultSocialImageUrl, siteConfig } from "@/lib/site-config";

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-skrewww-shape="rounded" data-skrewww-surface="flat">
      <body className="bg-white font-sans text-ink-900 antialiased">
        <JsonLd data={siteStructuredData()} />
        <AppProviders>
          <Sidebar />
          <MobileDocsNav />
          <main className="min-h-screen md:ml-64">{children}</main>
        </AppProviders>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
