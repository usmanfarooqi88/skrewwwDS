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
  purpose: string;
  whenToUse: string;
  whenNotToUse: string;
  accessibility: string;
  commonMistakes: string;
  tokensUsed: string[];
  properties?: string;
  knownLimitation?: string;
};

export const categories = [
  "Actions",
  "Forms",
  "Navigation",
  "Feedback",
  "Containers & Overlays",
  "Content & Data",
] as const;
