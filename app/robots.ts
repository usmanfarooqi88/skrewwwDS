import type { MetadataRoute } from "next";
import { absoluteUrl, siteConfig } from "@/lib/site-config";

/**
 * Robots policy for public Skrewww documentation.
 *
 * OAI-SearchBot: allowed — OpenAI's search indexing bot should reach public docs.
 * GPTBot: disallowed — training/indexing for model ingestion is a separate policy decision.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // No blanket /_next/ disallow — Google needs /_next/static/* (CSS,
        // JS, fonts) for rendering. The former /api/ and /preview/ rules
        // targeted routes that no longer exist and were removed. Keep
        // noindex pages (e.g. /reference) controlled by their robots meta.
      },
      {
        userAgent: "GPTBot",
        disallow: "/",
      },
      {
        userAgent: "OAI-SearchBot",
        allow: "/",
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteConfig.origin,
  };
}
