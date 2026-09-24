export type ComponentDocRelatedLink = {
  label: string;
  href: string;
};

export type ComponentDoc = {
  slug: string;
  name: string;
  category: string;
  /**
   * Layer 4 (Industry Systems) grouping — orthogonal to `category`, which
   * stays unchanged (still describes the underlying component kind).
   * When set, this component belongs to an "Industries > {industry}" nav
   * group instead of its `category` group — see lib/industry-content.ts.
   */
  industry?: string;
  variants?: string;
  /**
   * Explicit indexing for docs-only entries that have no registry entry.
   * Use "noindex" for sub-component/anatomy pages whose meaning depends on a
   * parent page (the parent stays the search landing page). Omit to fall
   * back to the substantive-documentation check.
   */
  indexing?: "index" | "noindex";
  purpose: string;
  whenToUse: string;
  whenNotToUse: string;
  accessibility: string;
  commonMistakes: string;
  tokensUsed: string[];
  properties?: string;
  knownLimitation?: string;
  /**
   * Docs-only / Figma-facing related links when there is no implemented
   * registry entry (or when Related components should still render without
   * a live preview). Implemented components continue to use registry
   * `relatedComponents` instead.
   */
  relatedLinks?: ComponentDocRelatedLink[];
};

export const categories = [
  "Actions",
  "Forms",
  "Navigation",
  "Feedback",
  "Containers & Overlays",
  "Content & Data",
] as const;
