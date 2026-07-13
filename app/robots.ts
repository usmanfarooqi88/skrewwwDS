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
        disallow: ["/api/", "/_next/", "/preview/"],
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
