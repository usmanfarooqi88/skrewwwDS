/** Canonical site configuration — single source for metadata, SEO, registry, and sitemap. */

// skrewww.com is the confirmed live production domain (verified via
// NEXT_PUBLIC_SITE_URL on the real deployment — see docs/project-status.md).
// This fallback only matters when that env var is unset (e.g. an
// unconfigured preview build); it must track the real canonical domain,
// not an earlier placeholder.
const PRODUCTION_FALLBACK_ORIGIN = "https://skrewww.com";

function resolveSiteOrigin(): string {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    process.env.NEXT_PUBLIC_SITE_ORIGIN?.replace(/\/$/, "");

  if (configured) return configured;

  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  return PRODUCTION_FALLBACK_ORIGIN;
}

export const siteConfig = {
  name: "Skrewww Design System",
  shortName: "Skrewww",
  organizationName: "Skrewww",
  description:
    "AI-first design system platform with token-driven components, native-first form semantics with accessible custom controls where native HTML cannot represent the confirmed interaction model, and documentation for designers, developers, and coding agents.",
  origin: resolveSiteOrigin(),
  designSystemVersion: "1.0.0",
  documentationVersion: "1.0.0",
  /** Fixed source date — do not regenerate on every build. */
  lastUpdated: "2026-07-13",
  documentationPublished: "2026-06-01",
  /** Next.js serves /opengraph-image automatically — keep absolute URL helper aligned. */
  defaultSocialImagePath: "/opengraph-image",
  repositoryUrl: undefined as string | undefined,
  figmaUrl: undefined as string | undefined,
  accessibilityBaseline: "WCAG 2.2 AA (target)",
} as const;

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${siteConfig.origin}${normalized}`;
}

export function getComponentDocumentationUrl(slug: string): string {
  return absoluteUrl(`/components/${slug}`);
}

export function getDefaultSocialImageUrl(): string {
  return absoluteUrl(siteConfig.defaultSocialImagePath);
}
