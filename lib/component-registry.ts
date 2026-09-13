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
import {
  BUTTON_GROUP_FIGMA_COMPONENT_SET_NODE_ID,
  BUTTON_GROUP_FIGMA_FILE_URL,
} from "@/lib/button-group-figma-metadata";
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
    status: "stable",
    version: "1.0.0",
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
      "component/button/primary/background",
      "component/button/danger/background",
      "component/button/primary/border",
      "component/button/primary/border-mid",
      "component/button/primary/border-end",
      "component/button/danger/border",
      "component/button/danger/border-mid",
      "component/button/danger/border-end",
      "component/surface/content",
      "component/surface/blur",
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
      "--component-brand-fill-glass",
      "--component-button-primary-fill",
      "--component-button-primary-fill-hover",
      "--component-button-primary-fill-hover-glass",
      "--component-button-primary-fill-pressed",
      "--component-button-primary-fill-pressed-glass",
      "--component-button-radius-control",
      "--component-button-secondary-fill-elevated-glass",
      "--component-button-secondary-fill-glass",
      "--component-card-border-highlight-1",
      "--component-card-border-highlight-2",
      "--component-card-border-highlight-3",
      "--component-button-danger-border-end",
      "--component-button-danger-border-mid",
      "--component-button-danger-border-start",
      "--component-button-primary-border-end",
      "--component-button-primary-border-mid",
      "--component-button-primary-border-start",
      "--component-danger-fill",
      "--component-danger-fill-glass",
      "--component-danger-fill-hover",
      "--component-danger-fill-hover-glass",
      "--component-danger-fill-pressed",
      "--component-danger-fill-pressed-glass",
      "--component-surface-content",
      "--component-surface-gradient-overlay",
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
      "--glass-backdrop-filter-lg",
      "--glass-backdrop-filter-sm",
      "--opacity-disabled",
      "--semantic-action-danger",
      "--semantic-action-danger-hover",
      "--semantic-action-danger-pressed",
      "--semantic-action-primary",
      "--semantic-action-primary-hover",
      "--semantic-action-primary-pressed",
      "--semantic-border-disabled",
      "--semantic-focus-ring",
      "--semantic-surface-disabled",
      "--semantic-surface-default",
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
      { label: "Button Group — joined related actions", href: "/components/button-group" },
      { label: "Link — inline navigational text", href: "/components/link" },
      { label: "Split Button — default action plus menu", href: "/components/split-button" },
    ],
    relatedTokens: [
      { label: "semantic/action/primary", href: "/foundations" },
      { label: "component/radius/control", href: "/foundations" },
      { label: "semantic/focus-ring", href: "/foundations" },
      { label: "component/surface/content", href: "/foundations" },
    ],
    relatedConcepts: [sharedConcepts.shape, sharedConcepts.surface],
    openQuestions: [
      "Confirm exact control height and horizontal padding per size from Figma.",
      "Trailing icon is not defined as a separate Figma property on Button — supported in code for composition; confirm with design.",
      "UNRESOLVED DESIGN REVIEW: Primary Glass Hover dark content can appear visually muddy over high-frequency/complex backgrounds. Current #17181B content and 24% hover fill match live Figma; any readability adjustment must be approved in Figma first.",
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy:
      "Button = native button or link + visual surface + content row (optional leading/trailing icon + label). Icons are consumer-supplied nodes; Button does not wrap them in SVG or change their paths.",
    comparisons: [
      {
        title: "How do Button icons get their color?",
        body: "Button sets CSS color only. Primary and Danger use surface-content semantics: inverse/light on Flat and Gradient, dark on Glass. Secondary uses primary text color on every surface. Compatible icons inherit that color through SVG currentColor — Phosphor defaults fill to currentColor; stroke icons should use stroke=currentColor. Button does not set fill, stroke, or icon-specific paint, and it does not rewrite icon artwork. Any compatible icon inherits the same foreground automatically. Icon-only actions use this same Button with an aria-label; there is no separate Icon Button implementation.",
      },
    ],
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
    slug: "button-group",
    name: "Button Group",
    category: "Actions",
    summary:
      "Button Group joins related independent Buttons with shared outer chrome and a 2px divider gap — layout only; each Button keeps its own behavior.",
    status: "beta",
    version: "0.1.0-beta",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/actions.ts",
    documentationLastUpdated: "2026-09-13",
    reactLastUpdated: "2026-09-13",
    figmaReference: "Actions / Button Group — Style × Count (9 variants)",
    figmaSourceUrl: BUTTON_GROUP_FIGMA_FILE_URL,
    figmaNodeId: BUTTON_GROUP_FIGMA_COMPONENT_SET_NODE_ID,
    documentationUrl: getComponentDocumentationUrl("button-group"),
    supportedVariants: ["neutral", "primary", "danger"],
    supportedSizes: [],
    tokensUsed: [
      "component/radius/control",
      "semantic/border/default",
      "color/brand/700",
      "color/danger/700",
    ],
    relatedComponents: [
      { label: "Button — each action in the group", href: "/components/button" },
      { label: "Split Button — primary action plus related menu", href: "/components/split-button" },
      { label: "Tabs — mutually exclusive view panels", href: "/components/tabs" },
    ],
    relatedTokens: [
      { label: "component/radius/control", href: "/foundations" },
      { label: "semantic/border/default", href: "/foundations" },
    ],
    relatedConcepts: [sharedConcepts.shape, sharedConcepts.surface],
    openQuestions: [
      "Figma description recommends role=radiogroup for mutually exclusive selection; Beta React ships independent Buttons with role=group (CE-1B product decision). A future Toggle Group / Segmented Control may cover selection.",
      "Vertical orientation, equal-width, and wrapping are not in the verified Figma set.",
      "Squircle Shape on joined children disables per-button squircle clip so shared outer chrome stays coherent.",
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy:
      "ButtonGroup = role=group wrapper (shared border + divider gap + outer radius) + Button children. Divider tone is group chrome only.",
    keyboardBehavior:
      "Standard Tab order across child Buttons. Enter/Space activate the focused Button. No arrow-key roving focus — this is not a toolbar or radiogroup.",
    focusBehavior:
      "Child focus-visible rings are not clipped (group does not use overflow:hidden). Focused child stacks above neighbors (z-index).",
    comparisons: [
      {
        title: "How is Button Group different from Split Button?",
        body: "Button Group arranges multiple independent actions with joined chrome. Split Button pairs one primary default action with a related secondary/menu control — CE-1C, not Button Group.",
      },
      {
        title: "Is Button Group a segmented control?",
        body: "No. Figma labels can look like List/Grid or Day/Week/Month, but Beta React does not implement selection state. Use Tabs or a future Toggle Group for exclusive selection.",
      },
    ],
    apiProps: [
      {
        name: "children",
        type: "ReactNode",
        description: "Independent Skrewww Button (or Button-as-link) children.",
      },
      {
        name: "divider",
        type: '"neutral" | "primary" | "danger"',
        default: '"neutral"',
        description:
          "Chrome color in the 2px gap — matches Figma Style gap fill (neutral=Secondary, primary, danger). Not a Button variant.",
      },
      {
        name: "aria-label",
        type: "string",
        description: "Accessible name for the group when no visible group label exists.",
      },
      {
        name: "aria-labelledby",
        type: "string",
        description: "ID of a visible label element for the group.",
      },
    ],
    reactExample: `import { Button } from "@/components/ui/Button";
import { ButtonGroup } from "@/components/ui/ButtonGroup";

export function Example() {
  return (
    <ButtonGroup aria-label="View mode" divider="primary">
      <Button variant="primary">List</Button>
      <Button variant="primary">Grid</Button>
    </ButtonGroup>
  );
}`,
  },
  {
    slug: "card",
    name: "Card",
    category: "Containers & Overlays",
    summary:
      "Card is a general-purpose content container grouping related information with a clear visual boundary.",
    status: "stable",
    version: "1.0.0",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/containers.ts",
    documentationLastUpdated: "2026-06-01",
    reactLastUpdated: "2026-07-11",
    figmaReference: "Containers / Card — Elevation (Flat/Raised); node 2044:25756. Title/Body are Figma TEXT; Footer is a hardcoded Button frame. React children + footer ReactNode are ahead of that contract.",
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
      "--component-surface-gradient-overlay",
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
      "REACT AHEAD OF FIGMA — Figma Card 2044:25756 still uses Title/Body TEXT and a hardcoded Footer. A follow-up should audit native Content/Actions Slots without blocking React.",
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
        name: "children",
        type: "React.ReactNode",
        description:
          "Arbitrary body content. Optional. Does not render Figma instructional placeholders. React is ahead of Figma Card Body TEXT.",
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
        description:
          "Optional footer composition — typically Button instances. React is ahead of Figma’s hardcoded Footer frame.",
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
    status: "stable",
    version: "1.0.0",
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
    // Real dependency contract, verified against actual source (2026-08-09):
    // TextInput.tsx composes FormField internally (a real, documented
    // architectural dependency — see docs/architecture/form-field.md, not
    // a conceptual pairing) and imports the private, unexported
    // TextInputControl for its native input visuals. No third-party npm
    // package of its own; "react"/"react-dom" are host assumptions, no
    // next import exists anywhere in TextInput.tsx/TextInputControl.tsx.
    dependencies: [],
    hostRequirements: ["react", "react-dom"],
    // TextInputControl.tsx (private control primitive, never independently
    // installable — see docs/architecture/form-field.md) and lib/cn.ts.
    internalDependencies: ["components/ui/TextInputControl.tsx", "lib/cn.ts"],
    // FormField is a real code dependency (TextInput.tsx imports and
    // renders it), not merely conceptually related — it is independently
    // public and independently registry-slugged, so it is declared here
    // rather than folded into internalDependencies. Foundation is declared
    // directly too, matching the existing Button/Card convention of
    // declaring it wherever a component's own CSS consumes its tokens.
    registryDependencies: ["@skrewww/form-field", "@skrewww/foundation"],
    coreDependencies: ["tokens", "shape", "surface"],
    files: ["components/ui/TextInput.tsx", "components/ui/text-input.module.css"],
    cssTokens: [
      "--component-surface-gradient-overlay",
      "--control-font-size-lg",
      "--control-font-size-md",
      "--control-font-size-sm",
      "--control-height-lg",
      "--control-height-md",
      "--control-height-sm",
      "--control-padding-x-lg",
      "--control-padding-x-md",
      "--control-padding-x-sm",
      "--glass-backdrop-filter-sm",
      "--opacity-disabled",
      "--semantic-action-danger",
      "--semantic-border-default",
      "--semantic-border-disabled",
      "--semantic-border-strong",
      "--semantic-focus-ring",
      "--semantic-icon-muted",
      "--semantic-surface-disabled",
      "--semantic-surface-subtle",
      "--semantic-text-disabled",
      "--semantic-text-primary",
      "--shape-radius-control",
      "--squircle-clip-path-control",
      "--surface-fill-control",
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
