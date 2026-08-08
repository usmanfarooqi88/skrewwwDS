import type { IndexingPolicy } from "@/lib/indexing-policy";
import type { IndustryName } from "@/lib/industry-content";

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
  /**
   * Layer 4 (Industry Systems) grouping — orthogonal to `category`, which
   * stays unchanged. When set, this component belongs to an
   * "Industries > {industry}" nav group (sidebar, breadcrumbs, JSON-LD,
   * sitemap) instead of its `category` group — see lib/industry-content.ts.
   */
  industry?: IndustryName;
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
  /**
   * CLI-resolution fields for the planned "npx skrewww" copy-owned
   * distribution model (see skrewww-claude-project-instructions.md's
   * Distribution Model section) — the CLI does not exist yet. All fields
   * below are optional and intentionally left undefined on most entries:
   * only populate with real values derived from a component's actual
   * source (imports, files, CSS custom properties), never guessed. See
   * docs/project-status.md for which entries currently have real data.
   *
   * These five categories answer five genuinely different questions about
   * what "installing" this component requires, and are kept distinct on
   * purpose rather than flattened into one file list — a generated
   * transport manifest (e.g. a shadcn-shaped registry item) MAY flatten
   * `files` + `internalDependencies` into its own single `files[]` array,
   * because that flattening is a transport-format concern; the canonical
   * model here must not do that flattening itself:
   *
   * - `files` — this component's OWN source. Its identity as a registry
   *   item.
   * - `internalDependencies` — private/internal files this component's
   *   own source imports (a shared helper, an icon primitive) that must
   *   travel alongside it but are never a public, independently
   *   installable Skrewww component in their own right — they have no
   *   registry slug and never will.
   * - `registryDependencies` — slugs/identifiers of OTHER installable
   *   Skrewww registry items this component requires (including the
   *   shared Foundation resource). Each one has its own independent
   *   existence, versioning, and could be installed on its own — unlike
   *   `internalDependencies`.
   * - `dependencies` — real, third-party npm packages that must be
   *   installed because this component's own source uniquely needs them.
   *   Deliberately excludes the host framework itself — see
   *   `hostRequirements` for that.
   * - `hostRequirements` — host/framework packages this component
   *   assumes are already present in the consumer's project (e.g.
   *   `react`, `react-dom`, and currently `next` for its internal-link
   *   navigation). Never something a CLI should install on the
   *   component's behalf — attempting to would be redundant at best and
   *   a version-conflict risk at worst.
   */
  /** This component's own source files, relative to the repo root — the registry item's own identity. */
  files?: string[];
  /** Private/internal files copied alongside this component; never a public, independently installable Skrewww registry item on their own. */
  internalDependencies?: string[];
  /** Slugs of other Skrewww registry items this component requires (e.g. the shared Foundation resource) — each independently installable and versioned. */
  registryDependencies?: string[];
  /** Real third-party npm packages this component's own source uniquely needs — excludes host/framework packages (see `hostRequirements`). */
  dependencies?: string[];
  /** Host/framework packages this component assumes are already present in the consumer's project — never installed on the component's behalf. */
  hostRequirements?: string[];
  /** Which @skrewww/core-covered layers this component's CSS relies on ("tokens", "shape", "surface") — the future @skrewww/core npm-package consumption path, distinct from `registryDependencies`' copy-owned CLI path. */
  coreDependencies?: string[];
  /** CSS custom property names (with -- prefix) actually referenced in this component's stylesheet(s). */
  cssTokens?: string[];
  /** Minimum @skrewww/core version required, once that package exists and is versioned. */
  coreVersion?: string;
};

/**
 * Canonical registry SCHEMA version — versions the shape of
 * `ComponentRegistryEntry` itself (its fields), not any individual
 * component's own `version`, and not the derived public registry's
 * `PublicRegistryMetadata.schemaVersion` in lib/registry-public.ts. All
 * three are independent and must be bumped separately:
 *
 * - A component's `version` field changes when THAT component's own
 *   implementation changes.
 * - `CANONICAL_REGISTRY_SCHEMA_VERSION` changes when the shape of this
 *   TypeScript type changes (a field is added, removed, or its meaning
 *   changes) — e.g. this was never bumped when `dependencies`/`files`/
 *   `cssTokens`/`coreVersion` were first added, which is exactly the gap
 *   this constant closes going forward.
 * - `PublicRegistryMetadata.schemaVersion` versions the DERIVED, public
 *   `/registry.json` output shape (`PublicRegistryEntry`), which may
 *   expose only a subset of canonical fields and evolve on its own
 *   schedule — a canonical schema change does not require a public
 *   schema bump, and vice versa.
 */
export const CANONICAL_REGISTRY_SCHEMA_VERSION = "1.0.0";

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
    // Proof-of-concept for the planned CLI-resolution schema — derived directly
    // from components/ui/Button.tsx and button.module.css, not guessed.
    // Real dependency contract, verified against actual source (2026-08-08):
    // Button's own source imports no third-party npm package of its own —
    // "react"/"react-dom"/"next" are host/framework assumptions, not
    // packages the registry should install (see `hostRequirements`).
    dependencies: [],
    hostRequirements: ["react", "react-dom", "next"],
    // lib/cn.ts (class-name join helper) and the `LoadingSpinner` export
    // from components/ui/icons.tsx — copied alongside Button, never public
    // Skrewww registry components in their own right.
    internalDependencies: ["lib/cn.ts", "components/ui/icons.tsx"],
    // The shared Foundation resource (universal Primitive/Semantic/Brand/
    // Shape/Surface/control-sizing tier + the shared accessibility utility
    // in styles/foundation.css) — does not have its own registry entry
    // yet; declared here because it is Button's real, verified dependency
    // regardless of whether a transport manifest exists yet.
    registryDependencies: ["@skrewww/foundation"],
    coreDependencies: ["tokens", "shape", "surface"],
    files: ["components/ui/Button.tsx", "components/ui/button.module.css"],
    cssTokens: [
      "--control-font-size-lg",
      "--control-font-size-md",
      "--control-font-size-sm",
      "--control-gap",
      "--control-height-lg",
      "--control-height-md",
      "--control-height-sm",
      "--control-padding-x-lg",
      "--control-padding-x-md",
      "--control-padding-x-sm",
      "--glass-backdrop-filter-sm",
      "--opacity-disabled",
      "--semantic-action-danger",
      "--semantic-action-danger-hover",
      "--semantic-action-danger-pressed",
      "--semantic-action-primary",
      "--semantic-action-primary-hover",
      "--semantic-action-primary-pressed",
      "--semantic-border-default",
      "--semantic-border-disabled",
      "--semantic-border-strong",
      "--semantic-focus-ring",
      "--semantic-surface-disabled",
      "--semantic-surface-elevated",
      "--semantic-surface-subtle",
      "--semantic-text-disabled",
      "--semantic-text-inverse",
      "--semantic-text-primary",
      "--shape-radius-control",
      "--squircle-clip-path-control",
      "--surface-fill-control",
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
    // Proof-of-concept for the planned CLI-resolution schema — derived directly
    // from components/ui/Card.tsx and card.module.css, not guessed.
    // Real dependency contract, verified against actual source (2026-08-09):
    // Card's own source imports no third-party npm package of its own —
    // "react"/"react-dom" are host/framework assumptions, not packages the
    // registry should install (see `hostRequirements`). Unlike Button, Card
    // has no next/link import, so "next" is correctly excluded here.
    dependencies: [],
    hostRequirements: ["react", "react-dom"],
    // lib/cn.ts (class-name join helper) — copied alongside Card, never a
    // public Skrewww registry component in its own right.
    internalDependencies: ["lib/cn.ts"],
    // The shared Foundation resource — does not have its own registry entry
    // yet; declared here because it is Card's real, verified dependency
    // regardless of whether a transport manifest exists yet.
    registryDependencies: ["@skrewww/foundation"],
    coreDependencies: ["tokens", "shape", "surface"],
    files: ["components/ui/Card.tsx", "components/ui/card.module.css"],
    cssTokens: [
      "--glass-backdrop-filter-md",
      "--semantic-text-primary",
      "--semantic-text-secondary",
      "--shape-radius-container",
      "--squircle-clip-path-container",
      "--surface-border-default",
      "--surface-fill-default",
      "--surface-shadow-raised",
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
