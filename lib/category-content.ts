import { categories } from "@/lib/types";

export type CategoryName = (typeof categories)[number];

export type CategorySlug = (typeof categorySlugMap)[CategoryName];

export const categorySlugMap = {
  Actions: "actions",
  Forms: "forms",
  Navigation: "navigation",
  Feedback: "feedback",
  "Containers & Overlays": "containers-overlays",
  "Content & Data": "content-data",
} as const satisfies Record<CategoryName, string>;

const slugToCategory = Object.fromEntries(
  Object.entries(categorySlugMap).map(([category, slug]) => [slug, category]),
) as Record<CategorySlug, CategoryName>;

export function getCategorySlug(category: CategoryName): CategorySlug {
  return categorySlugMap[category];
}

export function getCategoryNameFromSlug(slug: string): CategoryName | undefined {
  return slugToCategory[slug as CategorySlug];
}

export function getCategoryPageHref(category: CategoryName): string {
  return `/components/category/${getCategorySlug(category)}`;
}

type CategoryPageContent = {
  title: CategoryName;
  summary: string;
  description: string;
  accessibilityNotes: string;
  statusNote: string;
  indexing: "index" | "noindex";
};

export const categoryPageContent: Record<CategoryName, CategoryPageContent> = {
  Actions: {
    title: "Actions",
    summary:
      "Action components trigger operations — submit data, navigate, confirm choices, or start processes.",
    description:
      "Use action components for intentional user-initiated operations. Prefer one primary action per view and keep destructive actions visually distinct.",
    accessibilityNotes:
      "Action targets must have accessible names, visible focus indicators, and disabled states that are both visual and semantic.",
    statusNote:
      "Implemented React components in this category are Beta while Figma parity gaps remain open.",
    indexing: "index",
  },
  Forms: {
    title: "Forms",
    summary:
      "Form components collect input using native controls composed with shared field chrome and validation relationships.",
    description:
      "Skrewww forms separate field wrappers from controls. FormField owns label, description, required indication, and validation placement. Individual controls own native input semantics. ValidationMessage renders typed inline feedback linked with aria-describedby.",
    accessibilityNotes:
      "Every control needs a programmatic label. Error state uses aria-invalid and aria-describedby. Native controls preserve platform keyboard, mobile picker, and screen-reader behavior.",
    statusNote:
      "All implemented form controls are Beta. Select is non-searchable. Combobox is searchable. Search Field is the canonical search-specific component at /components/search-field.",
    indexing: "index",
  },
  Navigation: {
    title: "Navigation",
    summary:
      "Navigation components help users move through the product, locate content, and understand where they are.",
    description:
      "Navigation patterns should expose current location, preserve keyboard access, and avoid duplicating page titles without context.",
    accessibilityNotes:
      "Use landmarks, visible focus, and meaningful link text. Do not rely on color alone for the current item.",
    statusNote:
      "Link, Breadcrumb, Tabs, Pagination, and Menu are implemented in Beta. Sidebar, Stepper, and Top Navigation items remain documentation-only.",
    indexing: "index",
  },
  Feedback: {
    title: "Feedback",
    summary:
      "Feedback components communicate status, progress, validation outcomes, and system responses.",
    description:
      "Feedback must pair icon or color with explanatory text. Field-level feedback belongs near the related control with ValidationMessage. Persistent page content uses Alert. Transient confirmations use Toast.",
    accessibilityNotes:
      "Associate inline validation with fields through aria-describedby. Use live regions intentionally — static Alerts do not announce by default.",
    statusNote:
      "All seven Feedback components with Figma documentation are implemented in Beta: Alert, Toast, Progress Bar, Spinner, Badge, Tooltip, and Skeleton.",
    indexing: "index",
  },
  "Containers & Overlays": {
    title: "Containers & Overlays",
    summary:
      "Container and overlay components group related content or present layered UI above the page.",
    description:
      "Containers establish visual boundaries. Overlays must manage focus, escape dismissal, and background interaction according to pattern requirements.",
    accessibilityNotes:
      "Dialogs and drawers require focus management and accessible names. Clickable cards need a single clear interactive target.",
    "statusNote":
      "Card, Dialog, Drawer, Popover, and Accordion are implemented in Beta.",
    indexing: "index",
  },
  "Content & Data": {
    title: "Content & Data",
    summary:
      "Content and data components present structured information such as lists, tags, avatars, and metadata.",
    description:
      "These components prioritize readable hierarchy, consistent spacing tokens, and semantic HTML where possible.",
    accessibilityNotes:
      "Preserve heading order, list semantics, and text alternatives for non-text content.",
    statusNote:
      "Calendar Day, Calendar Grid, Tag, Avatar, Divider, List Item, and Empty State are implemented in Beta.",
    indexing: "index",
  },
};
