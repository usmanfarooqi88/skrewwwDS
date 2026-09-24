import type { Metadata } from "next";
import { getDefaultSocialImageUrl, siteConfig } from "@/lib/site-config";

/**
 * Next.js replaces (does not deep-merge) `openGraph` when a page defines its
 * own, so a page-level `openGraph` silently drops the root layout's image.
 * Spread this into page metadata so the default social image and a matching
 * Twitter card always survive; `title`/`description`/`url` stay page-specific.
 */
export function pageSocialMetadata(input: {
  title: string;
  description: string;
  url: string;
  type?: "website" | "article";
}): Pick<Metadata, "openGraph" | "twitter"> {
  const image = { url: getDefaultSocialImageUrl(), width: 1200, height: 630 };

  return {
    openGraph: {
      title: input.title,
      description: input.description,
      url: input.url,
      type: input.type ?? "website",
      siteName: siteConfig.name,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [image.url],
    },
  };
}
