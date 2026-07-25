import type { IndexingPolicy } from "@/lib/indexing-policy";

export type MaturityStatus = "beta" | "stable" | "documented" | "planned";

export type AvailabilityStatus = "available" | "partial" | "unavailable";

export type ApiProp = {
  name: string;
  type: string;
  default?: string;
  description: string;
};

export type RelatedLink = {
  label: string;
  href: string;
};

export type ComparisonNote = {
  title: string;
  body: string;
};

export type ComponentRegistryEntry = {
  slug: string;
  name: string;
  category: string;
  summary: string;
  status: MaturityStatus;
  version: string;
  reactAvailability: AvailabilityStatus;
  figmaAvailability: AvailabilityStatus;
  documentationCompleteness: AvailabilityStatus;
  accessibilityLevel: "WCAG 2.2 AA (target)" | "WCAG 2.2 AA (verified)" | "partial";
  documentationSource: string;
  documentationLastUpdated: string;
  reactLastUpdated: string;
  figmaReference?: string;
  documentationUrl: string;
  supportedVariants: string[];
  supportedSizes: string[];
  tokensUsed: string[];
  relatedComponents: RelatedLink[];
  relatedTokens: RelatedLink[];
  relatedConcepts: RelatedLink[];
  openQuestions: string[];
  hasImplementation: boolean;
  hasPreview: boolean;
  anatomy?: string;
  keyboardBehavior?: string;
  focusBehavior?: string;
  dismissalBehavior?: string;
  motionBehavior?: string;
  comparisons?: ComparisonNote[];
  apiProps: ApiProp[];
  reactExample: string;
  indexing: IndexingPolicy;
  announcementBehavior?: string;
  figmaSourceUrl?: string;
  figmaNodeId?: string;
};

import { calendarRegistryEntries } from "@/lib/component-registry-calendar";
import { containersRegistryEntries } from "@/lib/component-registry-containers";
import { contentDataRegistryEntries } from "@/lib/component-registry-content-data";
import { feedbackRegistryEntries } from "@/lib/component-registry-feedback";
import { formsRegistryEntries } from "@/lib/component-registry-forms";
import { navigationRegistryEntries } from "@/lib/component-registry-navigation";
import { getComponentDocumentationUrl } from "@/lib/site-config";

const sharedConcepts = {
  foundations: { label: "Foundations — token collections", href: "/foundations" },
  shape: {
    label: "Shape modes (Sharp, Rounded, Pill, Squircle)",
    href: "/foundations#shape",
  },
  surface: {
    label: "Surface modes (Flat, Gradient, Glass)",
    href: "/foundations#surface",
  },
};

export const componentRegistry: ComponentRegistryEntry[] = [
  {
    slug: "button",
    name: "Button",
    category: "Actions",
    summary:
      "Button is a primary interactive trigger for user actions — submit, confirm, navigate, or initiate a process.",
    status: "beta",
    version: "0.1.0-beta",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/actions.ts",
    documentationLastUpdated: "2026-06-01",
    reactLastUpdated: "2026-07-11",
    figmaReference: "Actions / Button — Style × Size × State (45 variants)",
    documentationUrl: getComponentDocumentationUrl("button"),
    supportedVariants: ["primary", "secondary", "danger"],
    supportedSizes: ["sm", "md", "lg"],
    tokensUsed: [
      "component/radius/control",
      "semantic/action/primary",
      "semantic/action/danger",
      "semantic/surface/default",
      "semantic/text/inverse",
      "semantic/text/primary",
      "semantic/focus-ring",
      "opacity/disabled",
    ],
    relatedComponents: [
      { label: "Icon Button — compact icon-only actions", href: "/components/icon-button" },
      { label: "Link — inline navigational text", href: "/components/link" },
      { label: "Split Button — default action plus menu", href: "/components/split-button" },
    ],
    relatedTokens: [
      { label: "semantic/action/primary", href: "/foundations" },
      { label: "component/radius/control", href: "/foundations" },
      { label: "semantic/focus-ring", href: "/foundations" },
    ],
    relatedConcepts: [sharedConcepts.shape, sharedConcepts.surface],
    openQuestions: [
      "Confirm exact control height and horizontal padding per size from Figma.",
      "Trailing icon is not defined as a separate Figma property on Button — supported in code for composition; confirm with design.",
      "Gradient and Glass surface personalities for Button need Surface collection token values.",
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    apiProps: [
      {
        name: "variant",
        type: '"primary" | "secondary" | "danger"',
        default: '"primary"',
        description: "Visual style mapped to semantic action tokens.",
      },
      {
        name: "size",
        type: '"sm" | "md" | "lg"',
        default: '"md"',
        description: "Control height and typography scale.",
      },
      {
        name: "loading",
        type: "boolean",
        default: "false",
        description: "Disables interaction, sets aria-busy, and shows a spinner with screen-reader text.",
      },
      {
        name: "fullWidth",
        type: "boolean",
        default: "false",
        description: "Stretches the control to the width of its container.",
      },
      {
        name: "leadingIcon",
        type: "ReactNode",
        description: "Optional icon before the label (Figma: Has Icon + Icon).",
      },
      {
        name: "trailingIcon",
        type: "ReactNode",
        description: "Optional icon after the label. Not confirmed as a Figma Button property.",
      },
      {
        name: "href",
        type: "string",
        description: "When set, renders as a semantic link (Next.js Link or native anchor for external URLs).",
      },
      {
        name: "target",
        type: "string",
        description: "Link target. `_blank` automatically adds `rel=\"noopener noreferrer\"` when rel is omitted.",
      },
      {
        name: "disabled",
        type: "boolean",
        default: "false",
        description: "Native disabled for buttons; aria-disabled non-navigating link for href variant.",
      },
      {
        name: "aria-label",
        type: "string",
        description: "Required accessible name for icon-only buttons.",
      },
    ],
    reactExample: `import { Plus } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";

export function Example() {
  return (
    <Button variant="primary" leadingIcon={<Plus size={16} />} type="button">
      Create project
    </Button>
  );
}`,
  },
  {
    slug: "card",
    name: "Card",
    category: "Containers & Overlays",
    summary:
      "Card is a general-purpose content container grouping related information with a clear visual boundary.",
    status: "beta",
    version: "0.1.0-beta",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/containers.ts",
    documentationLastUpdated: "2026-06-01",
    reactLastUpdated: "2026-07-11",
    figmaReference: "Containers / Card — Elevation (Flat/Raised)",
    documentationUrl: getComponentDocumentationUrl("card"),
    supportedVariants: ["flat", "raised"],
    supportedSizes: [],
    tokensUsed: [
      "semantic/surface/default",
      "semantic/border/default",
      "component/radius/container",
      "shadow-blur/3",
      "shadow-color/3",
    ],
    relatedComponents: [
      { label: "Dialog — modal attention pattern", href: "/components/dialog" },
      { label: "Accordion — collapsible sections", href: "/components/accordion" },
    ],
    relatedTokens: [
      { label: "component/radius/container", href: "/foundations" },
      { label: "shadow-blur/3", href: "/foundations" },
    ],
    relatedConcepts: [sharedConcepts.shape, sharedConcepts.surface],
    openQuestions: [
      "Confirm raised elevation shadow offset/spread values from Figma shadow tokens.",
      "Clickable-card pattern (single interactive target) not implemented — TODO before using Card as a link surface.",
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    apiProps: [
      {
        name: "as",
        type: '"div" | "article" | "section" | "li"',
        default: '"div"',
        description: "Semantic wrapper. Use article only for independently meaningful content.",
      },
      {
        name: "elevation",
        type: '"flat" | "raised"',
        default: '"flat"',
        description: "Flat uses border; Raised uses shadow-blur/3 and shadow-color/3.",
      },
      {
        name: "title",
        type: "string",
        description: "Optional card header title.",
      },
      {
        name: "headingLevel",
        type: '"h2" | "h3" | "h4"',
        default: '"h3"',
        description: "Heading level for the optional title.",
      },
      {
        name: "footer",
        type: "ReactNode",
        description: "Optional footer row — typically composed Button instances.",
      },
    ],
    reactExample: `import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function Example() {
  return (
    <Card
      as="article"
      title="Billing"
      elevation="raised"
      footer={<Button size="sm">Manage plan</Button>}
    >
      Your next invoice is due on April 1.
    </Card>
  );
}`,
  },
  {
    slug: "text-input",
    name: "Text Input",
    category: "Forms",
    summary: "Text Input is a single-line text entry for short, free-form data such as names, emails, or search terms.",
    status: "beta",
    version: "0.1.0-beta",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/forms.ts",
    documentationLastUpdated: "2026-06-01",
    reactLastUpdated: "2026-07-11",
    figmaReference: "Forms / Text Input — State × Size (15 variants)",
    documentationUrl: getComponentDocumentationUrl("text-input"),
    supportedVariants: ["default", "error", "disabled"],
    supportedSizes: ["sm", "md", "lg"],
    tokensUsed: [
      "component/radius/control",
      "semantic/border/default",
      "semantic/border/strong",
      "semantic/focus-ring",
      "semantic/action/danger",
      "semantic/surface/default",
    ],
    relatedComponents: [
      { label: "Form Field — shared label and helper pattern", href: "/components/form-field" },
      { label: "Validation Message — typed inline feedback", href: "/components/validation-message" },
      { label: "Textarea — multi-line entry", href: "/components/textarea" },
      { label: "Search Field — search-specific input", href: "/components/search-field" },
    ],
    relatedTokens: [
      { label: "component/radius/control", href: "/foundations" },
      { label: "semantic/focus-ring", href: "/foundations" },
    ],
    relatedConcepts: [sharedConcepts.shape, sharedConcepts.surface],
    openQuestions: [
      "FormField composes label/helper/error internally — confirm parity with Figma Form Field Wrapper split.",
      "Hover state token mapping not explicitly documented — uses semantic/border/strong on hover.",
      "Trailing action slot is a documentation convenience; confirm Figma trailing icon property semantics.",
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    apiProps: [
      {
        name: "label",
        type: "string",
        description: "Visible or visually hidden label associated via FormField.",
      },
      {
        name: "size",
        type: '"sm" | "md" | "lg"',
        default: '"md"',
        description: "Control height and typography scale.",
      },
      {
        name: "supportingText",
        type: "string",
        description: "Helper text linked with aria-describedby when no error is present.",
      },
      {
        name: "error",
        type: "string",
        description: "Error message; sets aria-invalid and aria-describedby via ValidationMessage.",
      },
      {
        name: "required",
        type: "boolean",
        default: "false",
        description: "Shows required indicator and sets aria-required.",
      },
      {
        name: "readOnly",
        type: "boolean",
        default: "false",
        description: "Read-only state — distinct from disabled; remains focusable.",
      },
      {
        name: "leadingIcon",
        type: "ReactNode",
        description: "Optional leading icon (Figma: Show leading icon + Leading Icon).",
      },
      {
        name: "trailingIcon",
        type: "ReactNode",
        description: "Optional trailing icon (Figma: Show trailing icon + Trailing Icon).",
      },
      {
        name: "trailingAction",
        type: "ReactNode",
        description: "Interactive trailing control such as an apply button.",
      },
      {
        name: "disabled",
        type: "boolean",
        default: "false",
        description: "Native disabled input with non-opacity-only visual treatment.",
      },
    ],
    reactExample: `import { TextInput } from "@/components/ui/TextInput";

export function Example() {
  return (
    <TextInput
      label="Email address"
      type="email"
      placeholder="you@example.com"
      supportingText="Used for account notifications only."
      required
    />
  );
}`,
  },
  ...formsRegistryEntries,
  ...feedbackRegistryEntries,
  ...navigationRegistryEntries,
  ...containersRegistryEntries,
  ...contentDataRegistryEntries,
  ...calendarRegistryEntries,
];

export function getRegistryEntry(slug: string): ComponentRegistryEntry | undefined {
  return componentRegistry.find((entry) => entry.slug === slug);
}

export function hasLiveImplementation(slug: string): boolean {
  const entry = getRegistryEntry(slug);
  return Boolean(entry?.hasImplementation && entry?.hasPreview);
}

export function getImplementedRegistryEntries(): ComponentRegistryEntry[] {
  return componentRegistry.filter((entry) => entry.hasImplementation);
}

export function getImplementedComponentCount(): number {
  return getImplementedRegistryEntries().length;
}
