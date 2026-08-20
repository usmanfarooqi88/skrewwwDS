import type { ComponentRegistryEntry } from "@/lib/component-registry";
import { getComponentDocumentationUrl } from "@/lib/site-config";

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
    status: "beta",
    version: "0.4.0-beta",
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
      "semantic/action/primary",
      "semantic/text/danger",
      "semantic/action/danger",
      "semantic/focus-ring",
    ],
    relatedComponents: [
      { label: "Button — primary actions", href: "/components/button" },
      { label: "Breadcrumb — hierarchical location trail", href: "/components/breadcrumb" },
    ],
    relatedTokens: [
      { label: "semantic/action/primary", href: "/foundations" },
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
    ],
    apiProps: [
      { name: "href", type: "string", description: "Destination URL." },
      { name: "variant", type: '"default" | "subtle" | "danger"', default: '"default"', description: "Visual style." },
      { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Text size." },
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
    status: "beta",
    version: "0.4.0-beta",
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
    status: "beta",
    version: "0.4.0-beta",
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
    status: "beta",
    version: "0.4.0-beta",
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
    reactLastUpdated: "2026-07-12",
    figmaReference:
      "Navigation / Menu Item + Dropdown Trigger — composed Menu pattern (Dropdown Menu is a usage alias, not a separate component)",
    documentationUrl: getComponentDocumentationUrl("menu"),
    supportedVariants: ["default", "destructive"],
    supportedSizes: [],
    tokensUsed: [
      "menu/surface",
      "menu/border",
      "menu/item-text",
      "menu/item-hover-surface",
      "menu/item-destructive-text",
      "semantic/focus-ring",
    ],
    relatedComponents: [
      { label: "Popover — supplementary non-command content", href: "/components/popover" },
      { label: "Select — form field value selection", href: "/components/select" },
      { label: "Button — primary actions", href: "/components/button" },
      { label: "Menu Item — Figma building block (compound subcomponent)", href: "/components/menu-item" },
    ],
    relatedTokens: [
      { label: "popover/surface", href: "/foundations" },
      { label: "semantic/focus-ring", href: "/foundations" },
    ],
    relatedConcepts: [sharedConcepts.shape, sharedConcepts.surface],
    openQuestions: [
      "Checkbox and radio menu items are not confirmed in Figma — deferred.",
      "Submenus and Context Menu are separate future components.",
      "Dropdown Menu is documented as a usage pattern, not a duplicate public component.",
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
      { name: "onSelect", type: "(event: Event) => void", description: "MenuItem activation callback." },
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
];
