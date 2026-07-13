export type ComponentDoc = {
  slug: string;
  name: string;
  category: string;
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
