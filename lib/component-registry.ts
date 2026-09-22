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
import {
  SPLIT_BUTTON_FIGMA_COMPONENT_SET_NODE_ID,
  SPLIT_BUTTON_FIGMA_FILE_URL,
} from "@/lib/split-button-figma-metadata";
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
    // lib/cn.ts (class-name join helper), the `LoadingSpinner` export from
    // components/ui/icons.tsx, and button-group-context.ts (Button reads
    // useButtonGroupItem() to apply joined-item geometry inside a Button
    // Group / Split Button) — copied alongside Button, never public
    // Skrewww registry components in their own right. The
    // button-group-context.ts entry was added in CE-3H after a real
    // consumer smoke test (empty-state, which composes Button) surfaced
    // a "Module not found" build failure — Button.tsx has imported this
    // context since CE-1B, but it was never declared here.
    internalDependencies: ["lib/cn.ts", "components/ui/icons.tsx", "components/ui/button-group-context.ts"],
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
    dependencies: [],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: ["lib/cn.ts", "components/ui/button-group-context.ts"],
    registryDependencies: ["@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/ButtonGroup.tsx", "components/ui/button-group.module.css"],
    cssTokens: [
      "--button-group-divider",
      "--component-button-radius-control",
      "--primitive-color-brand-700",
      "--primitive-color-danger-700",
      "--semantic-border-default",
      "--shape-radius-control",
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
      "Figma description recommends role=radiogroup for mutually exclusive selection; Beta React ships independent Buttons with role=group (CE-1B product decision). Use Toggle Group for exclusive selection.",
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
        body: "Button Group arranges multiple independent actions with joined chrome. Split Button pairs one primary default action with a related secondary/menu control — not Button Group.",
      },
      {
        title: "Is Button Group a segmented control?",
        body: "No. Figma labels can look like List/Grid or Day/Week/Month, but Button Group does not implement selection state. Use Toggle Group for exclusive segmented selection (Segmented Control is that presentation, not a separate component).",
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
    slug: "toggle-group",
    name: "Toggle Group",
    category: "Actions",
    summary:
      "Toggle Group is exclusive segmented selection (radiogroup) with joined chrome — Segmented Control is this presentation, not a separate component.",
    status: "beta",
    version: "0.1.0-beta",
    reactAvailability: "available",
    figmaAvailability: "unavailable",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/actions.ts",
    documentationLastUpdated: "2026-09-14",
    reactLastUpdated: "2026-09-14",
    figmaReference: "None yet — React-first CE-2C; Figma master pending",
    documentationUrl: getComponentDocumentationUrl("toggle-group"),
    supportedVariants: ["single"],
    supportedSizes: ["sm", "md", "lg"],
    tokensUsed: [
      "component/radius/control",
      "semantic/border/default",
      "semantic/border/strong",
      "semantic/focus-ring",
      "semantic/surface/subtle",
      "semantic/text/primary",
    ],
    dependencies: [],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: [
      "lib/cn.ts",
      "lib/use-controllable.ts",
      "components/ui/internal/toggle-group-keyboard.ts",
    ],
    registryDependencies: ["@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/ToggleGroup.tsx", "components/ui/toggle-group.module.css"],
    cssTokens: [
      "--component-button-radius-control",
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
      "--semantic-border-default",
      "--semantic-border-strong",
      "--semantic-focus-ring",
      "--semantic-surface-default",
      "--semantic-surface-elevated",
      "--semantic-surface-subtle",
      "--semantic-text-primary",
      "--shape-radius-container",
      "--shape-radius-control",
      "--surface-fill-control",
    ],
    relatedComponents: [
      { label: "Button Group — joined peer actions (no selection)", href: "/components/button-group" },
      { label: "Radio Group — form-field exclusive radios", href: "/components/radio-group" },
      { label: "Tabs — switches content panels", href: "/components/tabs" },
      { label: "Switch — single binary toggle", href: "/components/switch" },
    ],
    relatedTokens: [
      { label: "semantic/border/default", href: "/foundations" },
      { label: "semantic/focus-ring", href: "/foundations" },
    ],
    relatedConcepts: [sharedConcepts.shape, sharedConcepts.surface],
    openQuestions: [
      "Figma master not created yet — intentional React-first CE-2 sequence.",
      "Multiple selection intentionally deferred; 0.1.0-beta is single-only.",
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy:
      "ToggleGroup = role=radiogroup (joined outer chrome) + ToggleGroupItem children (role=radio).",
    keyboardBehavior:
      "Tab lands on the selected item (or first item if none). Arrow keys move focus and select. Home/End jump ends. Space/Enter select the focused item. Re-clicking the selected item does not clear selection.",
    focusBehavior:
      "Roving tabindex among radios. Focus-visible ring on the focused segment.",
    comparisons: [
      {
        title: "Toggle Group vs Segmented Control?",
        body: "Same capability. Skrewww ships Toggle Group as the semantic component; segmented/joined appearance is the default presentation. There is no separate Segmented Control export.",
      },
      {
        title: "Toggle Group vs Button Group?",
        body: "Button Group joins independent peer actions with no selection state. Toggle Group selects exactly one value among segments.",
      },
      {
        title: "Toggle Group vs Radio Group?",
        body: "Radio Group is a form-field control with radio indicators, legend, and validation. Toggle Group is compact segmented chrome for toolbar/settings selection.",
      },
      {
        title: "Toggle Group vs Tabs?",
        body: "Tabs switch associated content panels (tablist/tabpanel). Toggle Group only selects a value — it does not own panels.",
      },
    ],
    apiProps: [
      {
        name: "value",
        type: "string",
        description: "Controlled selected value. Empty string means none selected yet.",
      },
      {
        name: "defaultValue",
        type: "string",
        description: "Uncontrolled initial selected value.",
      },
      {
        name: "onValueChange",
        type: "(value: string) => void",
        description: "Fires when the selected value changes.",
      },
      {
        name: "disabled",
        type: "boolean",
        default: "false",
        description: "Disables the entire group.",
      },
      {
        name: "orientation",
        type: '"horizontal" | "vertical"',
        default: '"horizontal"',
        description: "Layout and arrow-key orientation.",
      },
      {
        name: "size",
        type: '"sm" | "md" | "lg"',
        default: '"md"',
        description: "Segment size matching control height tokens.",
      },
      {
        name: "aria-label",
        type: "string",
        description: "Accessible name for the radiogroup when no visible label exists.",
      },
      {
        name: "children",
        type: "ReactNode",
        description: "ToggleGroupItem children.",
      },
    ],
    reactExample: `import { useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/ToggleGroup";

export function Example() {
  const [value, setValue] = useState("list");
  return (
    <ToggleGroup
      aria-label="View mode"
      value={value}
      onValueChange={setValue}
    >
      <ToggleGroupItem value="list">List</ToggleGroupItem>
      <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
    </ToggleGroup>
  );
}`,
  },
  {
    slug: "split-button",
    name: "Split Button",
    category: "Actions",
    summary:
      "Split Button joins one primary Button action with a related Menu trigger using shared outer chrome — composition only; Button and Menu keep their own APIs.",
    status: "beta",
    version: "0.1.0-beta",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/actions.ts",
    documentationLastUpdated: "2026-09-14",
    reactLastUpdated: "2026-09-14",
    figmaReference: "Actions / Split Button — Style × Size (9 variants)",
    figmaSourceUrl: SPLIT_BUTTON_FIGMA_FILE_URL,
    figmaNodeId: SPLIT_BUTTON_FIGMA_COMPONENT_SET_NODE_ID,
    documentationUrl: getComponentDocumentationUrl("split-button"),
    supportedVariants: ["neutral", "primary", "danger"],
    supportedSizes: [],
    tokensUsed: [
      "component/radius/control",
      "semantic/border/default",
      "color/brand/700",
      "color/danger/700",
    ],
    // SplitButton.tsx documents Menu as a composed peer (prose only — see
    // its own JSDoc) but does not import Menu.tsx or any Menu type at all;
    // CE-3J's own real-import verification found no @skrewww/menu edge, so
    // it is intentionally not declared as a registryDependency here — a
    // corrected departure from the CE-3G plan's aspirational "menu becomes
    // one for split-button" note, matching real source evidence instead.
    dependencies: [],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: [
      "lib/cn.ts",
      "components/ui/button-group-context.ts",
      "components/ui/button-group.module.css",
    ],
    registryDependencies: ["@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/SplitButton.tsx"],
    relatedComponents: [
      { label: "Button — primary action and menu trigger chrome", href: "/components/button" },
      { label: "Menu — secondary popup and items", href: "/components/menu" },
      { label: "Button Group — peer joined actions without a menu", href: "/components/button-group" },
    ],
    relatedTokens: [
      { label: "component/radius/control", href: "/foundations" },
      { label: "semantic/border/default", href: "/foundations" },
    ],
    relatedConcepts: [sharedConcepts.shape, sharedConcepts.surface],
    openQuestions: [
      "Figma set has no State / Shape / Surface / menu-open variants — those remain Button + Menu responsibilities.",
      "Chevron trigger padding follows Button control padding (Figma chevron segment is slightly tighter horizontally).",
      "Disabled/loading combinations are independent per segment; no group-level loading API.",
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy:
      "SplitButton = role=group wrapper (shared border + divider gap + outer radius) + primary Button + Menu (MenuTrigger Button + MenuContent). Divider tone is chrome only.",
    keyboardBehavior:
      "Tab between primary Button and MenuTrigger Button. Enter/Space activate the focused control. Menu owns ArrowDown/ArrowUp open, item navigation, and Escape close.",
    focusBehavior:
      "Two independent focusable buttons. Focus-visible rings are not clipped (no overflow:hidden). Opening the menu restores focus per Menu/Popover.",
    comparisons: [
      {
        title: "How is Split Button different from Button Group?",
        body: "Button Group joins peer independent actions. Split Button pairs one primary default action with a related secondary menu trigger — not interchangeable APIs.",
      },
      {
        title: "Does Split Button own menu items?",
        body: "No. Compose Menu, MenuTrigger, MenuContent, and MenuItem. Split Button only provides joined chrome between the primary Button and the trigger Button.",
      },
    ],
    apiProps: [
      {
        name: "children",
        type: "ReactNode",
        description:
          "Primary Skrewww Button plus a Menu whose MenuTrigger wraps a secondary Button (typically CaretDown with aria-label). Do not put Button/Menu props on SplitButton.",
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
        description: "Accessible name for the primary+menu pair when no visible group label exists.",
      },
      {
        name: "aria-labelledby",
        type: "string",
        description: "ID of a visible label element for the pair.",
      },
    ],
    reactExample: `import { CaretDown } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
} from "@/components/ui/Menu";
import { SplitButton } from "@/components/ui/SplitButton";

export function Example() {
  return (
    <SplitButton aria-label="Save options" divider="primary">
      <Button type="button" variant="primary" onClick={() => {}}>
        Save
      </Button>
      <Menu>
        <MenuTrigger>
          <Button type="button" variant="primary" aria-label="More save options">
            <CaretDown size={16} weight="bold" />
          </Button>
        </MenuTrigger>
        <MenuContent aria-label="More save options">
          <MenuItem onSelect={() => {}}>Save as draft</MenuItem>
          <MenuItem onSelect={() => {}}>Save and publish</MenuItem>
        </MenuContent>
      </Menu>
    </SplitButton>
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
    slug: "chart-card",
    name: "Chart Card",
    category: "Containers & Overlays",
    summary:
      "Chart Card is a Card composed for a chart: an optional title/description/actions header, and a body that owns loading/empty/error presentation around a chart the consumer supplies as children.",
    status: "beta",
    version: "0.1.0-beta",
    reactAvailability: "available",
    figmaAvailability: "unavailable",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/containers.ts",
    documentationLastUpdated: "2026-09-22",
    reactLastUpdated: "2026-09-22",
    documentationUrl: getComponentDocumentationUrl("chart-card"),
    supportedVariants: ["default"],
    supportedSizes: [],
    tokensUsed: [
      "semantic/text/primary",
      "semantic/text/secondary",
      "semantic/surface/default",
      "semantic/border/default",
      "component/radius/container",
    ],
    relatedComponents: [
      { label: "Card — the underlying container; Chart Card owns no surface of its own", href: "/components/card" },
      { label: "Chart Metric — a labeled value with an optional delta, for the header or body", href: "/components/chart-metric" },
      { label: "Bar Chart — a chart family to place in the body", href: "/components/bar-chart" },
      { label: "Line Chart — a chart family to place in the body", href: "/components/line-chart" },
      { label: "Area Chart — a chart family to place in the body", href: "/components/area-chart" },
    ],
    relatedTokens: [
      { label: "semantic/text/primary", href: "/foundations" },
      { label: "semantic/text/secondary", href: "/foundations" },
    ],
    relatedConcepts: [sharedConcepts.shape, sharedConcepts.surface],
    openQuestions: [
      "No Figma reference exists for Chart Card or its states — this implementation uses Card's own established visual language (spacing, type scale) conservatively; no Figma parity is claimed.",
      "A canonical, generic time-range control (e.g. a shared TimeRangeTabs component) was evaluated and rejected for v1: Banking Balance Summary already proves the composition (Tabs in the `actions` slot, one TabsPanel per range, each holding its own chart instance) without a new abstraction. Compose with Tabs/ToggleGroup/Select/ButtonGroup directly; promote to a shared control only if a second, materially different real use case emerges.",
      "Interactive legend (per-series toggling) remains out of scope, unchanged from CH-2 — Chart Card does not add one.",
      "`errorAction`/`emptyDescription` accept arbitrary ReactNode but Chart Card fetches nothing itself — retry/action behavior is entirely the consumer's.",
      "Chart Card was not retrofitted onto Banking Account Card or Banking Balance Summary — both predate it and remain unchanged; their duplicated metric-value styling (documented on Chart Metric) is left as recorded evidence, not migrated, since neither is trivial/zero-risk to change without its own review.",
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy:
      "A Card (no title passed to Card itself) whose body renders: an optional header row (title as a heading at the given `headingLevel`, an optional description, and an optional `actions` slot on the right, wrapping via flexbox — no media query), then a content region holding exactly one of: the `children` you supply (state=\"ready\", the default), a Skeleton the size of `contentHeight` (state=\"loading\"), an EmptyState with no icon or illustration (state=\"empty\"), or an Alert (type=\"error\", announced politely) (state=\"error\"). Card's own `footer` passes straight through. No background, border, radius, or Shape/Surface property exists anywhere in Chart Card's own stylesheet — every surface property is Card's.",
    announcementBehavior:
      "The error state renders Alert with announce=\"polite\" (role=\"status\", aria-live=\"polite\"), since it represents a change the user was not otherwise told about. Loading and empty states are not announced as alerts — loading exposes a visually-hidden label via aria-busy instead, and empty is an ordinary heading/description region.",
    comparisons: [
      {
        title: "Why doesn't Chart Card have its own Shape/Surface props?",
        body: "It renders inside Card's own body and adds no background, border, or radius anywhere in its stylesheet, so it inherits Card's Shape/Surface behavior automatically through the CSS cascade — the same mechanism Banking Account Card's own \"Surface/Shape inheritance\" note documents. Adding independent props here would just be a second way to set the same thing.",
      },
      {
        title: "Why is there no `metric` prop?",
        body: "Metric placement (before the chart, after it, beside it) is layout, not identity — it belongs in `children` alongside the chart, typically as a Chart Metric element, rather than as a dedicated slot with its own positioning rules to maintain.",
      },
      {
        title: "Why does loading/empty/error hide `children` instead of layering on top?",
        body: "A chart rendered underneath a loading skeleton or an error message would still mount with whatever `data` the consumer passed — usually stale or placeholder data — and \"static chart, static children\" is a much easier contract to reason about and test than a hidden-but-mounted chart.",
      },
      {
        title: "Why is `contentHeight` a `minHeight`, not a fixed height?",
        body: "A fixed height would either clip taller ready content or leave dead space under shorter content. A minimum keeps every state (including the Skeleton and EmptyState, which are told to fill it) from collapsing the card below a stable size, while still letting real content grow.",
      },
    ],
    apiProps: [
      { name: "title", type: "string", description: "Optional header title." },
      { name: "description", type: "ReactNode", description: "Optional header description, shown under the title." },
      { name: "headingLevel", type: '"h2" | "h3" | "h4"', default: '"h3"', description: "Heading level for the optional title." },
      { name: "actions", type: "ReactNode", description: "Header-right slot — e.g. a time-range Tabs group, a filter Button, or a Menu of chart actions." },
      { name: "elevation", type: '"flat" | "raised"', description: "Passed through to the underlying Card." },
      { name: "state", type: '"ready" | "loading" | "empty" | "error"', default: '"ready"', description: "Which region renders in the body." },
      { name: "contentHeight", type: "number", default: "240", description: "Minimum body height in pixels, matching a chart's own default height — keeps the card's size stable across every state." },
      { name: "loadingLabel", type: "string", default: '"Loading chart"', description: "Visually-hidden label announced while state is \"loading\"." },
      { name: "emptyTitle", type: "string", default: '"No data"', description: "EmptyState title while state is \"empty\"." },
      { name: "emptyDescription", type: "ReactNode", description: "EmptyState description while state is \"empty\"." },
      { name: "errorTitle", type: "string", default: '"Couldn\'t load chart"', description: "Alert title while state is \"error\"." },
      { name: "errorDescription", type: "ReactNode", description: "Alert description while state is \"error\"." },
      { name: "errorAction", type: "ReactNode", description: "e.g. a \"Retry\" Button, rendered alongside the error message." },
      { name: "children", type: "ReactNode", description: "Rendered only when state is \"ready\" — typically a Chart Metric and a chart." },
      { name: "footer", type: "ReactNode", description: "Passed through to the underlying Card's footer." },
    ],
    reactExample: `import { ChartCard, ChartMetric, LineChart } from "@/components/ui";

const trend = [
  { label: "Jan", value: 58 },
  { label: "Feb", value: 95 },
  { label: "Mar", value: 76 },
  { label: "Apr", value: 128 },
];

export function Example() {
  return (
    <ChartCard title="Monthly signups" description="Last 4 months">
      <ChartMetric label="Total" value="357" delta={{ direction: "up", value: "+12%", label: "vs prior period" }} />
      <LineChart data={trend} label="Monthly signups" showCategoryAxis tooltip />
    </ChartCard>
  );
}

export function LoadingExample() {
  return <ChartCard title="Monthly signups" state="loading" />;
}

export function EmptyExample() {
  return (
    <ChartCard title="Monthly signups" state="empty" emptyDescription="No signups recorded for this period." />
  );
}

export function ErrorExample() {
  return (
    <ChartCard title="Monthly signups" state="error" errorDescription="Something went wrong loading this chart." />
  );
}`,
    dependencies: [],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: ["lib/cn.ts"],
    registryDependencies: ["@skrewww/card", "@skrewww/empty-state", "@skrewww/alert", "@skrewww/skeleton", "@skrewww/foundation"],
    coreDependencies: ["tokens", "shape", "surface"],
    files: ["components/ui/ChartCard.tsx", "components/ui/chart-card.module.css"],
    cssTokens: ["--semantic-text-primary", "--semantic-text-secondary"],
  },
  {
    slug: "chart-metric",
    name: "Chart Metric",
    category: "Content & Data",
    summary:
      "Chart Metric is a labeled value with an optional directional delta, for use above a chart or standalone — the delta's direction drives only its icon, never a color.",
    status: "beta",
    version: "0.1.0-beta",
    reactAvailability: "available",
    figmaAvailability: "unavailable",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/content-data.ts",
    documentationLastUpdated: "2026-09-22",
    reactLastUpdated: "2026-09-22",
    documentationUrl: getComponentDocumentationUrl("chart-metric"),
    supportedVariants: ["default"],
    supportedSizes: [],
    tokensUsed: ["semantic/text/primary", "semantic/text/secondary"],
    relatedComponents: [
      { label: "Chart Card — a common place to put a Chart Metric, above a chart", href: "/components/chart-card" },
      { label: "Bar Chart, Line Chart, Area Chart — the charts a Chart Metric typically summarizes", href: "/components/bar-chart" },
    ],
    relatedTokens: [
      { label: "semantic/text/primary", href: "/foundations" },
      { label: "semantic/text/secondary", href: "/foundations" },
    ],
    relatedConcepts: [],
    openQuestions: [
      "No Figma reference exists for Chart Metric — its typography was extracted from three independent, ad hoc implementations that already existed: Banking Account Card's `.balance`, Banking Balance Summary's `.totalValue` (byte-identical CSS to `.balance`), and the Reference App overview page's raw Tailwind `text-3xl font-semibold tabular-nums`. No Figma parity is claimed.",
      "Positive/negative semantic coloring (e.g. tying `direction` to a feedback/status color) is an explicit non-goal for v1: an increase is not always a good outcome (spend, churn, error rate), so no green-is-good/red-is-bad rule exists. If a future, evidence-based semantic model is designed, it is a deliberate addition, not a bug fix.",
      "Chart Metric was not retrofitted onto Banking Account Card, Banking Balance Summary, or the Reference App overview page — all three predate it and remain unchanged; the duplication is recorded as evidence, not migrated.",
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy:
      "A label (`p`, semantic/text/secondary) above a value (`p`, semantic/text/primary, tabular-nums), with an optional delta rendered inline after the value: a directional icon (ArrowUp, ArrowDown, or Minus from Phosphor, aria-hidden), a visually-hidden word (\"Increased\"/\"Decreased\"/\"Unchanged\") naming the direction for assistive tech, the pre-formatted delta value, and an optional comparison label. The delta's color is the same semantic/text/secondary as the label — never a feedback/status token — regardless of direction.",
    announcementBehavior:
      "The delta's direction is announced in words via visually-hidden text before the value, so it is never conveyed by the icon or color alone. The component has no live region of its own — it is a static value display, not a notification.",
    comparisons: [
      {
        title: "Why doesn't an upward delta render green (or a downward delta red)?",
        body: "Direction is not sentiment. An increase can be a bad outcome (costs, churn, error rate) as easily as a good one, so Chart Metric makes no claim either way — it shows an arrow and lets the label/context (\"Revenue\" vs. \"Errors\") carry the meaning.",
      },
      {
        title: "Why isn't this a `size` variant?",
        body: "All three real implementations Chart Metric replaces used the same 1.5rem/700-weight value styling — there was no evidence for a second size, so v1 ships exactly one.",
      },
    ],
    apiProps: [
      { name: "label", type: "string", description: "The metric's label." },
      { name: "value", type: "string", description: "Pre-formatted value (e.g. \"$4,231.09\") — formatting is the consumer's responsibility." },
      {
        name: "delta",
        type: "{ direction: \"up\" | \"down\" | \"flat\"; value: string; label?: string }",
        description: "Optional directional delta. `direction` selects only the icon; `value` is pre-formatted (e.g. \"+4.2%\"); `label` is optional comparison context (e.g. \"vs last 30 days\").",
      },
    ],
    reactExample: `import { ChartMetric } from "@/components/ui";

export function Example() {
  return <ChartMetric label="Total balance" value="$4,231.09" />;
}

export function WithDeltaExample() {
  return (
    <ChartMetric
      label="Revenue"
      value="$12,000"
      delta={{ direction: "up", value: "+4.2%", label: "vs last 30 days" }}
    />
  );
}`,
    dependencies: ["@phosphor-icons/react"],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: ["lib/cn.ts"],
    registryDependencies: ["@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/ChartMetric.tsx", "components/ui/chart-metric.module.css"],
    cssTokens: ["--semantic-text-primary", "--semantic-text-secondary"],
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

/** Maturity tallies for implemented React components — derived from the registry. */
export function getImplementedMaturityCounts(): {
  implemented: number;
  stable: number;
  beta: number;
} {
  const entries = getImplementedRegistryEntries();
  let stable = 0;
  let beta = 0;
  for (const entry of entries) {
    if (entry.status === "stable") stable += 1;
    else if (entry.status === "beta") beta += 1;
  }
  return { implemented: entries.length, stable, beta };
}

/** Newest trustworthy content date for a registry entry (ISO YYYY-MM-DD). */
export function getRegistryEntryContentDate(entry: ComponentRegistryEntry): string {
  return entry.reactLastUpdated >= entry.documentationLastUpdated
    ? entry.reactLastUpdated
    : entry.documentationLastUpdated;
}

/** Max content date across entries; undefined when the list is empty. */
export function getMaxRegistryContentDate(
  entries: readonly ComponentRegistryEntry[],
): string | undefined {
  if (entries.length === 0) return undefined;
  return entries
    .map(getRegistryEntryContentDate)
    .reduce((latest, date) => (date > latest ? date : latest));
}
