import type { ComponentRegistryEntry } from "@/lib/component-registry";
import { getComponentDocumentationUrl } from "@/lib/site-config";
import {
  STEPPER_FIGMA_COMPONENT_SET_NODE_ID,
  STEPPER_FIGMA_FILE_URL,
} from "@/lib/stepper-figma-metadata";

const sharedConcepts = {
  shape: {
    label: "Shape modes (Sharp, Rounded, Pill, Squircle)",
    href: "/foundations#shape",
  },
  surface: {
    label: "Surface modes (Flat, Gradient, Glass)",
    href: "/foundations#surface",
  },
};

const REACT_DATE = "2026-07-11";
const DOCS_DATE = "2026-06-01";

export const navigationRegistryEntries: ComponentRegistryEntry[] = [
  {
    slug: "link",
    name: "Link",
    category: "Actions",
    summary:
      "Link is semantic navigational text styled as inline or standalone links — not for primary actions.",
    status: "stable",
    version: "1.0.0",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/actions.ts",
    documentationLastUpdated: DOCS_DATE,
    reactLastUpdated: REACT_DATE,
    figmaReference: "Actions / Link — Style × Size × State (45 variants)",
    documentationUrl: getComponentDocumentationUrl("link"),
    supportedVariants: ["default", "subtle", "danger"],
    supportedSizes: ["sm", "md", "lg"],
    tokensUsed: [
      "semantic/text/secondary",
      "semantic/text/primary",
      "semantic/action/primary",
      "semantic/text/danger",
      "semantic/icon/danger",
      "color/brand/700",
      "semantic/focus-ring",
    ],
    dependencies: [],
    hostRequirements: ["react", "react-dom", "next"],
    internalDependencies: ["lib/cn.ts", "components/ui/internal/link-utils.ts"],
    registryDependencies: ["@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/Link.tsx", "components/ui/link.module.css"],
    cssTokens: [
      "--link-font-size-lg",
      "--link-font-size-md",
      "--link-font-size-sm",
      "--link-icon-gap",
      "--link-text-default",
      "--link-text-hover",
      "--link-underline-offset",
      "--link-underline-thickness",
      "--primitive-color-brand-700",
      "--primitive-color-danger-700",
      "--semantic-action-primary",
      "--semantic-action-primary-hover",
      "--semantic-focus-ring",
      "--semantic-icon-danger",
      "--semantic-text-danger",
      "--semantic-text-primary",
      "--semantic-text-secondary",
    ],
    relatedComponents: [
      { label: "Button — primary actions", href: "/components/button" },
      { label: "Breadcrumb — hierarchical location trail", href: "/components/breadcrumb" },
    ],
    relatedTokens: [
      { label: "semantic/action/primary", href: "/foundations" },
      { label: "semantic/text/secondary", href: "/foundations" },
      { label: "semantic/text/primary", href: "/foundations" },
      { label: "semantic/focus-ring", href: "/foundations" },
    ],
    relatedConcepts: [sharedConcepts.surface],
    openQuestions: [
      "Visited link styling is not confirmed in Figma — omitted in Beta.",
      "Disabled link styling is not confirmed — use non-navigating text instead.",
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "Link = semantic anchor + underlined label + optional leading/trailing icon.",
    keyboardBehavior: "Native link focus and activation. Visible focus ring via semantic/focus-ring.",
    comparisons: [
      {
        title: "When should a Link be used instead of a Button?",
        body: "Use Link for navigation that changes location. Use Button for actions that submit, confirm, or mutate state.",
      },
      {
        title: "How should external links be identified?",
        body: "Adjacent text should communicate destination when possible. External targets use safe rel defaults with target=\"_blank\".",
      },
      {
        title: "Why does Subtle Default differ from Figma Secondary?",
        body: "React Subtle Default keeps semantic/text/secondary (#5B5F68) for WCAG AA normal-text contrast. Figma Secondary Default uses content-muted (#A0A3AC), which fails AA on white. Subtle Hover and Pressed use semantic/text/primary (#17181B).",
      },
    ],
    apiProps: [
      { name: "href", type: "string", description: "Destination URL." },
      { name: "variant", type: '"default" | "subtle" | "danger"', default: '"default"', description: "Visual style." },
      { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Text size." },
      { name: "leadingIcon", type: "ReactNode", description: "Decorative leading icon (React extension; Figma exposes trailing only)." },
      { name: "trailingIcon", type: "ReactNode", description: "Decorative trailing icon." },
    ],
    reactExample: `import { Link } from "@/components/ui/Link";

export function Example() {
  return (
    <p>
      Read the <Link href="/components/button">Button documentation</Link> for action patterns.
    </p>
  );
}`,
  },
  {
    slug: "breadcrumb",
    name: "Breadcrumb",
    category: "Navigation",
    summary:
      "Breadcrumb is an ordered hierarchical trail showing location with navigable ancestors and a current-page indicator.",
    status: "stable",
    version: "1.0.0",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/navigation.ts",
    documentationLastUpdated: DOCS_DATE,
    reactLastUpdated: REACT_DATE,
    figmaReference: "Navigation / Breadcrumb — composed from Breadcrumb Item (Default/Hover/Current)",
    documentationUrl: getComponentDocumentationUrl("breadcrumb"),
    supportedVariants: ["default"],
    supportedSizes: [],
    tokensUsed: [
      "semantic/text/secondary",
      "semantic/text/primary",
      "semantic/action/primary",
    ],
    dependencies: ["@phosphor-icons/react"],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: ["lib/cn.ts"],
    registryDependencies: ["@skrewww/link", "@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/Breadcrumb.tsx", "components/ui/breadcrumb.module.css"],
    cssTokens: [
      "--breadcrumb-current-text",
      "--breadcrumb-font-size",
      "--breadcrumb-gap",
      "--breadcrumb-icon-size",
      "--breadcrumb-max-item-width",
      "--breadcrumb-separator",
      "--component-surface-content-muted",
    ],
    relatedComponents: [
      { label: "Link — inline navigational text", href: "/components/link" },
      { label: "Tabs — related in-context views", href: "/components/tabs" },
    ],
    relatedTokens: [
      { label: "semantic/text/primary", href: "/foundations" },
    ],
    relatedConcepts: [sharedConcepts.shape],
    openQuestions: [
      "Collapsed breadcrumb ellipsis is not confirmed in Figma — deferred.",
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "Breadcrumb = nav landmark + ordered list + ancestor links + current page text.",
    keyboardBehavior: "Ancestor links are focusable anchors. Current page is plain text with aria-current=\"page\".",
    comparisons: [
      {
        title: "How does Breadcrumb communicate the current page?",
        body: "The final item renders as text with aria-current=\"page\" and is not a link.",
      },
      {
        title: "What is the difference between Breadcrumb and Stepper?",
        body: "Breadcrumb shows location in a hierarchy. Stepper shows progress through a linear process.",
      },
    ],
    apiProps: [
      { name: "items", type: "BreadcrumbItem[]", description: "Trail items with label and optional href." },
      { name: "homeLabel", type: "string", default: '"Home"', description: "Accessible name for icon-only Home." },
    ],
    reactExample: `import { Breadcrumb } from "@/components/ui/Breadcrumb";

export function Example() {
  return (
    <Breadcrumb
      items={[
        { label: "Home", href: "/", home: true },
        { label: "Components", href: "/components" },
        { label: "Breadcrumb" },
      ]}
    />
  );
}`,
  },
  {
    slug: "tabs",
    name: "Tabs",
    category: "Navigation",
    summary:
      "Tabs is a navigation pattern that switches between related in-context views using tablist/tab/tabpanel semantics and roving focus.",
    status: "stable",
    version: "1.0.0",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/navigation.ts",
    documentationLastUpdated: DOCS_DATE,
    reactLastUpdated: REACT_DATE,
    figmaReference: "Navigation / Tabs — State × Size (15 variants)",
    documentationUrl: getComponentDocumentationUrl("tabs"),
    supportedVariants: ["automatic", "manual"],
    supportedSizes: ["sm", "md", "lg"],
    tokensUsed: [
      "semantic/text/secondary",
      "semantic/action/primary",
      "semantic/focus-ring",
    ],
    dependencies: [],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: ["lib/cn.ts", "lib/use-controllable.ts", "components/ui/internal/tab-keyboard.ts"],
    registryDependencies: ["@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/Tabs.tsx", "components/ui/tabs.module.css"],
    cssTokens: [
      "--semantic-focus-ring",
      "--semantic-text-disabled",
      "--tab-active-indicator",
      "--tab-active-text",
      "--tab-border",
      "--tab-font-size",
      "--tab-gap",
      "--tab-height",
      "--tab-indicator-thickness",
      "--tab-padding-x",
      "--tab-text",
      "--tab-transition-duration",
    ],
    relatedComponents: [
      { label: "Breadcrumb — hierarchical location", href: "/components/breadcrumb" },
      { label: "Top Nav Item — primary app navigation", href: "/components/top-nav-item" },
    ],
    relatedTokens: [
      { label: "semantic/focus-ring", href: "/foundations" },
    ],
    relatedConcepts: [sharedConcepts.shape, sharedConcepts.surface],
    openQuestions: [
      "Vertical Tabs orientation is documented in APG but not confirmed as a Figma variant — horizontal default only.",
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "Tabs = tablist + tab triggers + tabpanels with aria-controls/aria-labelledby.",
    keyboardBehavior: "Arrow keys move focus between tabs. Home/End jump to first/last tab. Automatic activation on focus by default.",
    comparisons: [
      {
        title: "Should Tabs activate automatically or manually?",
        body: "Automatic activation suits immediate lightweight panels. Manual activation suits expensive panel loads.",
      },
      {
        title: "What is the difference between Tabs and navigation links?",
        body: "Tabs switch related content in the same context. Links navigate to distinct URLs or destinations.",
      },
    ],
    apiProps: [
      { name: "value", type: "string", description: "Controlled active tab value." },
      { name: "defaultValue", type: "string", description: "Initial tab value." },
      { name: "activationMode", type: '"automatic" | "manual"', default: '"automatic"', description: "Focus activation behavior." },
    ],
    reactExample: `"use client";

import { Tabs, TabsList, TabsPanel, TabsTrigger } from "@/components/ui/Tabs";

export function Example() {
  return (
    <Tabs defaultValue="overview">
      <TabsList aria-label="Example tabs">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="details">Details</TabsTrigger>
      </TabsList>
      <TabsPanel value="overview">Overview content</TabsPanel>
      <TabsPanel value="details">Details content</TabsPanel>
    </Tabs>
  );
}`,
  },
  {
    slug: "pagination",
    name: "Pagination",
    category: "Navigation",
    summary:
      "Pagination is a paged navigation control with Previous/Next boundaries, numbered pages, and optional ellipsis.",
    status: "stable",
    version: "1.0.0",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/navigation.ts",
    documentationLastUpdated: DOCS_DATE,
    reactLastUpdated: REACT_DATE,
    figmaReference:
      "Navigation / Page Item — canonical Default/Hover/Current/Disabled masters; Pagination Trail is composition-only evidence",
    documentationUrl: getComponentDocumentationUrl("pagination"),
    supportedVariants: ["link", "button"],
    supportedSizes: [],
    tokensUsed: [
      "component/button/primary/background",
      "component/surface/content",
      "component/surface/blur",
      "component/menu/item-hover",
      "component/surface/content-muted",
      "semantic/text/primary",
      "semantic/text/disabled",
      "opacity/disabled",
      "component/radius/control",
    ],
    dependencies: [],
    hostRequirements: ["react", "react-dom", "next"],
    internalDependencies: ["lib/cn.ts", "components/ui/internal/link-utils.ts"],
    registryDependencies: ["@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/Pagination.tsx", "components/ui/pagination.module.css"],
    cssTokens: [
      "--component-brand-fill-glass",
      "--component-surface-gradient-overlay",
      "--glass-backdrop-filter-lg",
      "--glass-backdrop-filter-sm",
      "--glass-mix-sm",
      "--glass-mix-sm-fallback",
      "--opacity-disabled",
      "--pagination-border",
      "--pagination-control-size",
      "--pagination-current-surface",
      "--pagination-current-text",
      "--pagination-disabled-text",
      "--pagination-ellipsis-content",
      "--pagination-ellipsis-width",
      "--pagination-font-size",
      "--pagination-gap",
      "--pagination-page-content",
      "--pagination-page-hover-content",
      "--pagination-page-hover-surface",
      "--pagination-page-radius",
      "--pagination-text",
      "--semantic-action-primary",
      "--semantic-border-disabled",
      "--semantic-focus-ring",
      "--semantic-surface-default",
      "--shape-radius-control",
      "--squircle-clip-path-control",
    ],
    relatedComponents: [
      { label: "Link — URL-addressable navigation", href: "/components/link" },
      { label: "Spinner — loading changed results", href: "/components/spinner" },
    ],
    relatedTokens: [
      { label: "component/button/primary/background (Current)", href: "/foundations" },
      { label: "component/menu/item-hover (Hover)", href: "/foundations" },
      { label: "component/surface/content", href: "/foundations" },
      { label: "component/surface/content-muted (ellipsis evidence)", href: "/foundations" },
      { label: "component/surface/blur", href: "/foundations" },
      { label: "component/radius/control", href: "/foundations" },
    ],
    relatedConcepts: [sharedConcepts.shape, sharedConcepts.surface],
    openQuestions: [
      "Responsive collapsed pagination is not confirmed in Figma — sibling/boundary range only.",
      "Previous/Next appear only in the composition example as Secondary Small Icon Button instances; aligning React's textual boundary controls requires a separate public presentation decision.",
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "Pagination = nav landmark + previous + numbered pages + ellipsis + next.",
    keyboardBehavior: "Focusable page links/buttons and boundary controls. Current page is non-interactive text.",
    comparisons: [
      {
        title: "Should Pagination use links or buttons?",
        body: "Use links when pages have real URLs. Use buttons for client-managed collections without addressable pages.",
      },
      {
        title: "What is the difference between Pagination and infinite scroll?",
        body: "Pagination exposes discrete pages with explicit current location. Infinite scroll appends content without page landmarks.",
      },
    ],
    apiProps: [
      { name: "items", type: "PaginationItem[]", description: "Explicit pagination controls." },
      { name: "onPageChange", type: "(page: number) => void", description: "Button-based page changes." },
    ],
    reactExample: `import { Pagination, buildPaginationItems } from "@/components/ui/Pagination";

export function Example() {
  const items = buildPaginationItems({
    currentPage: 3,
    totalPages: 12,
    hrefBuilder: (page) => \`/results?page=\${page}\`,
  });

  return <Pagination items={items} />;
}`,
  },
  {
    slug: "menu",
    name: "Menu",
    category: "Navigation",
    summary:
      "Menu is a compact command surface for contextual actions — distinct from Select (form values) and Popover (supplementary content).",
    status: "beta",
    version: "0.4.0-beta",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/navigation.ts",
    documentationLastUpdated: DOCS_DATE,
    reactLastUpdated: "2026-08-31",
    figmaReference:
      "Navigation / Menu Item + Dropdown Trigger — composed Menu pattern (Dropdown Menu is a usage alias, not a separate component)",
    documentationUrl: getComponentDocumentationUrl("menu"),
    supportedVariants: ["default", "destructive"],
    supportedSizes: [],
    tokensUsed: [
      "menu/surface",
      "menu/border",
      "menu/elevation",
      "menu/backdrop-filter",
      "menu/item-text",
      "menu/item-hover-surface",
      "menu/item-destructive-text",
      "semantic/text/danger",
      "semantic/focus-ring",
      "component/surface/blur",
    ],
    relatedComponents: [
      { label: "Popover — supplementary non-command content", href: "/components/popover" },
      { label: "Select — form field value selection", href: "/components/select" },
      { label: "Button — primary actions", href: "/components/button" },
      { label: "Menu Item — Figma building block (compound subcomponent)", href: "/components/menu-item" },
    ],
    relatedTokens: [
      { label: "menu/surface (panel-surface)", href: "/foundations" },
      { label: "menu/border (panel-border)", href: "/foundations" },
      { label: "menu/item-destructive-text", href: "/foundations" },
      { label: "semantic/text/danger", href: "/foundations" },
      { label: "semantic/focus-ring", href: "/foundations" },
    ],
    relatedConcepts: [sharedConcepts.shape, sharedConcepts.surface],
    openQuestions: [
      "Checkbox and radio menu items are not confirmed in Figma — deferred.",
      "Submenus and Context Menu are separate future components.",
      "Dropdown Menu is documented as a usage pattern, not a duplicate public component.",
      "Destructive MenuItem styling is a React-only product contract — Figma Menu Item has no verified destructive variant.",
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy:
      "Menu = trigger button + floating menu surface + menuitem rows with optional icons, shortcuts, groups, labels, and separators.",
    keyboardBehavior:
      "Arrow Up/Down move between enabled items. Home/End jump to boundaries. Enter and Space activate. Printable keys typeahead-match item labels. Escape closes and restores trigger focus. Tab and Shift+Tab close without trapping focus.",
    focusBehavior:
      "Roving DOM focus on enabled menuitem elements. Arrow Down/Up from a closed trigger opens and focuses the first/last enabled item.",
    dismissalBehavior:
      "Closes on item selection (configurable), Escape, outside pointer, and Tab. Background remains interactive — no modal trap or inert.",
    comparisons: [
      {
        title: "What is the difference between Menu and Popover?",
        body: "Menu contains commands with menuitem semantics and a managed keyboard model. Popover holds supplementary or interactive content without command-list semantics.",
      },
      {
        title: "What is the difference between Menu and Select?",
        body: "Select chooses one form field value with combobox/listbox semantics. Menu executes commands and does not submit a single canonical field value.",
      },
      {
        title: "Should ordinary navigation links use Menu semantics?",
        body: "No. Persistent navigation belongs in nav landmarks, breadcrumbs, or tabs. Menu is for transient command lists.",
      },
      {
        title: "Does Tab move through Menu items?",
        body: "No. Tab closes the Menu and continues normal document focus order.",
      },
    ],
    apiProps: [
      { name: "open", type: "boolean", description: "Controlled open state." },
      { name: "defaultOpen", type: "boolean", description: "Initial open state." },
      { name: "onOpenChange", type: "(open: boolean) => void", description: "Open state callback." },
      { name: "placement", type: "PopoverPlacement", default: '"bottom"', description: "Preferred placement." },
      { name: "align", type: "PopoverAlign", default: '"start"', description: "Alignment relative to trigger." },
      { name: "loop", type: "boolean", default: "false", description: "Whether arrow navigation wraps." },
      { name: "closeOnSelect", type: "boolean", default: "true", description: "Close after item activation." },
      {
        name: "MenuItem.onSelect",
        type: "(event: Event) => void",
        description: "MenuItem activation callback (not a Menu root prop).",
      },
    ],
    reactExample: `"use client";

import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/Menu";
import { Button } from "@/components/ui/Button";

export function Example() {
  return (
    <Menu>
      <MenuTrigger>
        <Button type="button">Project actions</Button>
      </MenuTrigger>
      <MenuContent>
        <MenuItem onSelect={() => {}}>Edit profile</MenuItem>
        <MenuItem onSelect={() => {}}>Duplicate</MenuItem>
        <MenuSeparator />
        <MenuItem destructive onSelect={() => {}}>
          Delete project
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}`,
  },
  {
    slug: "stepper",
    name: "Stepper",
    category: "Navigation",
    summary:
      "Stepper shows progress through a fixed, known-length, ordered sequence of named steps — a compound Stepper + Step API built against the verified live Navigation/Step Item component set.",
    status: "beta",
    version: "0.1.0-beta",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/navigation.ts",
    documentationLastUpdated: "2026-09-14",
    reactLastUpdated: "2026-09-14",
    figmaReference:
      "Navigation / Step Item — State Completed/Current/Upcoming (3); composed \"Stepper Trail (example)\" frame for multi-step layout/connector reference. No separate Figma \"Stepper\" component exists.",
    figmaSourceUrl: STEPPER_FIGMA_FILE_URL,
    figmaNodeId: STEPPER_FIGMA_COMPONENT_SET_NODE_ID,
    documentationUrl: getComponentDocumentationUrl("stepper"),
    supportedVariants: ["completed", "current", "upcoming"],
    supportedSizes: [],
    tokensUsed: [
      "semantic/action/primary",
      "semantic/surface/default",
      "semantic/border/default",
      "semantic/text/primary",
      "semantic/text/inverse",
      "component/surface/content-muted",
      "radius/full",
      "semantic/focus-ring",
    ],
    dependencies: ["@phosphor-icons/react"],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: ["lib/cn.ts"],
    registryDependencies: ["@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/Stepper.tsx", "components/ui/stepper.module.css"],
    cssTokens: [
      "--component-surface-content-muted",
      "--radius-full",
      "--semantic-action-primary",
      "--semantic-border-default",
      "--semantic-focus-ring",
      "--semantic-surface-default",
      "--semantic-text-inverse",
      "--semantic-text-primary",
    ],
    relatedComponents: [
      { label: "Progress Bar — quantitative percentage, not named steps", href: "/components/progress-bar" },
      { label: "Tabs — peer content views, not sequential progress", href: "/components/tabs" },
      { label: "Breadcrumb — hierarchy/location, not a fixed sequence", href: "/components/breadcrumb" },
      { label: "Pagination — page navigation, no completion state", href: "/components/pagination" },
      { label: "Timeline — open-ended chronological history, not a fixed known-length process", href: "/components/timeline" },
    ],
    relatedTokens: [
      { label: "semantic/action/primary", href: "/foundations" },
      { label: "semantic/border/default", href: "/foundations" },
      { label: "semantic/focus-ring", href: "/foundations" },
    ],
    relatedConcepts: [],
    openQuestions: [
      "Narrow-viewport and long (5+ step) sequence behavior is not defined by the verified Figma contract — Figma's own composed example is a fixed-width demo. Deferred pending real evidence (Reference App).",
      "Vertical orientation is not part of the verified contract — no orientation axis exists in Figma at all.",
      "Whether onStepClick should be provided by default (fully interactive) versus omitted (read-only) is an app-level product decision Figma does not resolve.",
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy:
      "Stepper = ordered list (ol) of Step items, each a 24×24px circle indicator (Check icon when Completed, step number when Current/Upcoming) + label, joined by 32×1.5px connector rectangles between consecutive steps.",
    keyboardBehavior:
      "Read-only by default (no onStepClick): steps are not focusable controls. With onStepClick: Completed and Current steps become real buttons in natural Tab order, activated by Enter/Space; Upcoming steps are never focusable or clickable, regardless of onStepClick.",
    focusBehavior:
      "Natural DOM tab order across interactive (Completed/Current) steps only — no roving tabindex or arrow-key navigation; Stepper does not use a radiogroup/listbox model. focus-visible ring on interactive steps, offset to avoid clipping.",
    comparisons: [
      {
        title: "What is the difference between Stepper and Progress Bar?",
        body: "Progress Bar shows a raw percentage with no per-step identity. Stepper shows named, discrete steps with Completed/Current/Upcoming state.",
      },
      {
        title: "What is the difference between Stepper and Breadcrumb?",
        body: "Breadcrumb shows location in a hierarchy. Stepper shows progress through a linear process — see also Breadcrumb's own documented distinction.",
      },
      {
        title: "What is the difference between Stepper and Timeline?",
        body: "Timeline is an open-ended chronological log of events. Stepper is a fixed, known-length process with a clear \"you are here\" progress state — semantically different despite visual similarity.",
      },
      {
        title: "Does Stepper own routing or wizard state?",
        body: "No. Stepper only derives Completed/Current/Upcoming from currentStep and relays onStepClick(index). The app owns navigation, routing, and advancing currentStep.",
      },
      {
        title: "Can Upcoming steps be clicked?",
        body: "Never. Even when onStepClick is provided, only Completed and Current steps become interactive — Upcoming steps cannot be used to skip ahead.",
      },
    ],
    apiProps: [
      {
        name: "currentStep",
        type: "number",
        description: "Zero-based index of the current step. Stepper reads this to derive each Step's status — it never mutates it.",
      },
      {
        name: "onStepClick",
        type: "(index: number) => void",
        description: "Fires when a Completed or Current step is activated. Omit for a fully read-only Stepper. Upcoming steps never fire this.",
      },
      {
        name: "aria-label",
        type: "string",
        description: "Accessible name for the stepper when no visible label exists.",
      },
      {
        name: "aria-labelledby",
        type: "string",
        description: "Accessible name reference when a visible label element exists.",
      },
      {
        name: "children",
        type: "ReactNode",
        description: "Step children, in order.",
      },
      {
        name: "Step.children",
        type: "ReactNode",
        description: "The step's label — the only content Step accepts (no description/state/orientation prop).",
      },
    ],
    reactExample: `import { useState } from "react";
import { Stepper, Step } from "@/components/ui/Stepper";

export function Example() {
  const [currentStep, setCurrentStep] = useState(1);

  return (
    <Stepper
      currentStep={currentStep}
      onStepClick={setCurrentStep}
      aria-label="Checkout progress"
    >
      <Step>Account</Step>
      <Step>Shipping</Step>
      <Step>Payment</Step>
      <Step>Complete</Step>
    </Stepper>
  );
}`,
  },
];
