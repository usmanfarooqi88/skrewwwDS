/** Slugs that redirect to a canonical component documentation URL. */
export const REDIRECTED_COMPONENT_SLUGS = [
  "form-field-wrapper",
  "accordion-item",
] as const;

export const COMPONENT_REDIRECTS: Record<string, string> = {
  "form-field-wrapper": "/components/form-field",
  "accordion-item": "/components/accordion",
};

export function getComponentHref(slug: string): string {
  return COMPONENT_REDIRECTS[slug] ?? `/components/${slug}`;
}

export function getCanonicalComponentSlug(slug: string): string {
  if (slug === "form-field-wrapper") return "form-field";
  if (slug === "accordion-item") return "accordion";
  return slug;
}

export { absoluteUrl as getAbsoluteUrl, siteConfig } from "@/lib/site-config";
