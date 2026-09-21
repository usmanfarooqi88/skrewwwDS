import type { ComponentRegistryEntry } from "@/lib/component-registry";
import { getComponentDocumentationUrl } from "@/lib/site-config";
import {
  TABLE_FIGMA_COMPONENT_NODE_ID,
  TABLE_FIGMA_SOURCE_URL,
} from "@/lib/table-figma-metadata";
import {
  DATA_TABLE_COLUMN_HEADER_FIGMA_NODE_ID,
  DATA_TABLE_COLUMN_HEADER_FIGMA_SOURCE_URL,
} from "@/lib/data-table-figma-metadata";
import {
  TREE_VIEW_FIGMA_COMPONENT_SET_NODE_ID,
  TREE_VIEW_FIGMA_FILE_URL,
} from "@/lib/tree-view-figma-metadata";
import {
  BAR_CHART_FIGMA_EXAMPLE_NODE_ID,
  CHARTS_FIGMA_FILE_URL,
  LINE_CHART_FIGMA_EXAMPLE_NODE_ID,
} from "@/lib/charts-figma-metadata";
import { BANKING_FIGMA_COMPONENT_SET_NODE_ID } from "@/lib/banking-figma-metadata";
import {
  TIMELINE_FIGMA_COMPONENT_SET_NODE_ID,
  TIMELINE_FIGMA_FILE_URL,
} from "@/lib/timeline-figma-metadata";

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

const REACT_DATE = "2026-07-13";
const DOCS_DATE = "2026-06-01";
const TABLE_DOCS_DATE = "2026-08-14";

export const contentDataRegistryEntries: ComponentRegistryEntry[] = [
  {
    slug: "tag",
    name: "Tag",
    category: "Content & Data",
    summary:
      "Tag is a compact classification label for categories, filters, or user-applied values — distinct from read-only Badge status metadata.",
    status: "beta",
    version: "0.5.0-beta",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/content-data.ts",
    documentationLastUpdated: DOCS_DATE,
    reactLastUpdated: REACT_DATE,
    figmaReference: "Content & Data / Tag — Label + optional remove control",
    documentationUrl: getComponentDocumentationUrl("tag"),
    supportedVariants: ["default", "removable"],
    supportedSizes: [],
    tokensUsed: [
      "semantic/surface/elevated",
      "semantic/border/default",
      "semantic/text/primary",
      "semantic/icon/muted",
      "radius/full",
    ],
    dependencies: ["@phosphor-icons/react"],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: ["lib/cn.ts"],
    registryDependencies: ["@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/Tag.tsx", "components/ui/tag.module.css"],
    cssTokens: [
      "--component-surface-gradient-overlay",
      "--semantic-focus-ring",
      "--semantic-icon-muted",
      "--shape-radius-control",
      "--tag-border",
      "--tag-gap",
      "--tag-icon-size",
      "--tag-min-height",
      "--tag-padding-x",
      "--tag-radius",
      "--tag-remove-size",
      "--tag-surface",
      "--tag-text",
    ],
    relatedComponents: [
      { label: "Badge — read-only status metadata", href: "/components/badge" },
      { label: "Button — primary actions", href: "/components/button" },
    ],
    relatedTokens: [
      { label: "semantic/surface/elevated", href: "/foundations" },
      { label: "radius/full", href: "/foundations" },
    ],
    relatedConcepts: [sharedConcepts.shape],
    openQuestions: [
      "Selectable or filter-chip Tag behavior is not confirmed in Figma — only removable label is implemented.",
      "Chip is not a separate Figma component — Tag is the canonical name.",
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "Tag = label text + optional leading icon + optional remove button.",
    comparisons: [
      {
        title: "What is the difference between Tag and Badge?",
        body: "Badge communicates compact read-only status or counts. Tag represents an assigned category or filter value and may include a separate remove control.",
      },
      {
        title: "Is Tag interactive?",
        body: "Default Tag is a non-interactive span. Only the optional remove button is interactive — the label itself is not a button.",
      },
      {
        title: "How should a removable Tag be labelled?",
        body: "The remove button uses an accessible name such as “Remove Design Systems”. Decorative icons use aria-hidden.",
      },
    ],
    apiProps: [
      { name: "children", type: "ReactNode", description: "Tag label text." },
      { name: "removable", type: "boolean", default: "false", description: "Shows a separate remove button." },
      { name: "onRemove", type: "() => void", description: "Called when remove is activated." },
      { name: "removeLabel", type: "string", description: "Override remove button accessible name." },
      { name: "leadingIcon", type: "ReactNode", description: "Optional leading icon (decorative)." },
    ],
    reactExample: `import { Tag } from "@/components/ui/Tag";

export function Example() {
  return (
    <Tag removable onRemove={() => undefined}>
      Design Systems
    </Tag>
  );
}`,
  },
  {
    slug: "avatar",
    name: "Avatar",
    category: "Content & Data",
    summary:
      "Avatar is a circular visual identity for a user or entity with image, initials, or icon fallback.",
    status: "stable",
    version: "1.0.0",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/content-data.ts",
    documentationLastUpdated: DOCS_DATE,
    reactLastUpdated: REACT_DATE,
    figmaReference: "Content & Data / Avatar — Size (Small/Medium/Large), initials fallback",
    documentationUrl: getComponentDocumentationUrl("avatar"),
    supportedVariants: ["image", "initials", "icon"],
    supportedSizes: ["sm", "md", "lg"],
    tokensUsed: [
      "component/button/primary/background",
      "component/surface/content",
      "component/surface/blur",
      "radius/full",
    ],
    dependencies: ["@phosphor-icons/react"],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: ["lib/cn.ts"],
    registryDependencies: ["@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/Avatar.tsx", "components/ui/avatar.module.css"],
    cssTokens: [
      "--avatar-background",
      "--avatar-image-fit",
      "--avatar-radius",
      "--avatar-size-lg",
      "--avatar-size-md",
      "--avatar-size-sm",
      "--avatar-text",
      "--component-brand-fill-glass",
      "--component-button-primary-fill",
      "--component-surface-gradient-overlay",
      "--glass-backdrop-filter-lg",
    ],
    relatedComponents: [
      { label: "List Item — row composition with Avatar", href: "/components/list-item" },
      { label: "Badge — status metadata, not identity", href: "/components/badge" },
    ],
    relatedTokens: [
      { label: "component/button/primary/background", href: "/foundations" },
      { label: "component/surface/content", href: "/foundations" },
      { label: "component/surface/blur", href: "/foundations" },
      { label: "radius/full", href: "/foundations" },
    ],
    // Genuine Surface participant, confirmed via Figma master-component
    // inspection 2026-08-11 (node 2044:26027) — the initials-fallback
    // background and content color both respond to Surface mode
    // (component/button/primary/background family + component/surface/
    // content). Previously omitted here; that was a real metadata gap,
    // not an intentional Flat-only exclusion.
    relatedConcepts: [sharedConcepts.shape, sharedConcepts.surface],
    openQuestions: [
      "Avatar Group overflow behavior is not confirmed — deferred.",
      "Status indicator ring on Avatar is not confirmed in Figma.",
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "Avatar = circular frame + image OR initials OR icon fallback.",
    comparisons: [
      {
        title: "When should Avatar use empty alt text?",
        body: "When the person’s name is visible adjacent to the Avatar and the image is decorative. Use meaningful alt or label when Avatar is the sole identification.",
      },
      {
        title: "How should initials be announced?",
        body: "Initials alone are not sufficient when a full legal name is required. Provide label for informative contexts; hide decorative avatars from assistive technology.",
      },
      {
        title: "What happens when the Avatar image fails?",
        body: "The component falls back to initials when provided, otherwise to the icon fallback — no broken-image UI.",
      },
    ],
    apiProps: [
      { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Confirmed Figma sizes." },
      { name: "src", type: "string", description: "Image source URL." },
      { name: "alt", type: "string", description: "Image alternative text when informative." },
      { name: "initials", type: "string", description: "Fallback initials when image unavailable." },
      { name: "label", type: "string", description: "Accessible name for initials/icon fallback." },
      { name: "decorative", type: "boolean", default: "false", description: "Hides identity from assistive technology." },
    ],
    reactExample: `import { Avatar } from "@/components/ui/Avatar";

export function Example() {
  return (
    <div className="flex items-center gap-2">
      <Avatar src="/avatar.jpg" alt="" decorative />
      <span>Usman Farooqi</span>
    </div>
  );
}`,
  },
  {
    slug: "divider",
    name: "Divider",
    category: "Content & Data",
    summary:
      "Divider is a thin separator line between content sections — horizontal or vertical, semantic or decorative.",
    status: "stable",
    version: "1.0.0",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/content-data.ts",
    documentationLastUpdated: DOCS_DATE,
    reactLastUpdated: REACT_DATE,
    figmaReference:
      "Content & Data / Divider — Orientation (Horizontal/Vertical), component set 2044:26035. Both variants confirmed token-bound to semantic/border/default. In-context usage shown in demo frame \"Divider (example — in context)\", node 2116:2.",
    documentationUrl: getComponentDocumentationUrl("divider"),
    supportedVariants: ["thematic", "decorative", "structural"],
    supportedSizes: [],
    tokensUsed: ["semantic/border/default"],
    dependencies: [],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: ["lib/cn.ts"],
    registryDependencies: ["@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/Divider.tsx", "components/ui/divider.module.css"],
    cssTokens: [
      "--divider-color",
      "--divider-spacing-x",
      "--divider-spacing-y",
      "--divider-thickness",
      "--divider-vertical-min-height",
    ],
    relatedComponents: [
      { label: "Card — grouped content with optional footer border", href: "/components/card" },
    ],
    relatedTokens: [{ label: "semantic/border/default", href: "/foundations" }],
    relatedConcepts: [sharedConcepts.shape],
    openQuestions: [
      "Separator is a synonym — Divider is the established Figma name.",
      "Inset divider variants are not confirmed.",
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy: "Divider = 1px line using token thickness and color.",
    comparisons: [
      {
        title: "When should Divider use an hr element?",
        body: "Use variant=\"thematic\" (default) when the line represents a meaningful content break. Use decorative for purely visual separation.",
      },
      {
        title: "Is a decorative Divider announced?",
        body: "No — decorative dividers use aria-hidden and role=\"presentation\".",
      },
      {
        title: "What is the difference between Divider and spacing?",
        body: "Whitespace groups related content. Divider signals a stronger break between distinct sections — do not replace layout spacing with dividers everywhere.",
      },
      {
        title: "Why doesn't Figma have a variant for thematic/decorative/structural?",
        body: "By design, not a gap — all three variant values render the identical CSS class (only the underlying element, role, and aria attributes differ), so there is nothing visually distinct for Figma to represent. Confirmed via direct Figma inspection 2026-07-15: the component set (2044:26035) intentionally has only the Orientation property.",
      },
    ],
    apiProps: [
      {
        name: "orientation",
        type: '"horizontal" | "vertical"',
        default: '"horizontal"',
        description: "Confirmed Figma orientations.",
      },
      {
        name: "variant",
        type: '"thematic" | "decorative" | "structural"',
        default: '"thematic"',
        description: "Semantic mode: hr, hidden decorative, or role=separator.",
      },
    ],
    reactExample: `import { Divider } from "@/components/ui/Divider";

export function Example() {
  return (
    <>
      <p>Section one</p>
      <Divider />
      <p>Section two</p>
    </>
  );
}`,
  },
  {
    slug: "list-item",
    name: "List Item",
    category: "Content & Data",
    summary:
      "List Item is a single row inside a collection — avatar, title, description, metadata, and optional trailing content.",
    status: "beta",
    version: "0.5.0-beta",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/content-data.ts",
    documentationLastUpdated: DOCS_DATE,
    reactLastUpdated: REACT_DATE,
    figmaReference: "Content & Data / List Item — Default/Hover; Title, Subtitle, Meta",
    figmaNodeId: "2044:26095",
    documentationUrl: getComponentDocumentationUrl("list-item"),
    supportedVariants: ["static", "navigational", "action"],
    supportedSizes: [],
    tokensUsed: [
      "component/menu/item-hover",
      "component/surface/blur",
      "component/list-item/supporting-text",
      "semantic/text/primary",
      "component/radius/control",
      "semantic/focus-ring",
    ],
    dependencies: [],
    hostRequirements: ["react", "react-dom", "next"],
    internalDependencies: ["lib/cn.ts", "components/ui/internal/link-utils.ts"],
    registryDependencies: ["@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/ListItem.tsx", "components/ui/list-item.module.css"],
    cssTokens: [
      "--component-surface-backdrop-filter",
      "--component-surface-content-muted",
      "--list-item-description-text",
      "--list-item-gap",
      "--list-item-hover-surface",
      "--list-item-leading-size",
      "--list-item-metadata-text",
      "--list-item-min-height",
      "--list-item-padding-x",
      "--list-item-padding-y",
      "--list-item-radius",
      "--list-item-title-text",
      "--opacity-disabled",
      "--semantic-focus-ring",
    ],
    relatedComponents: [
      { label: "Avatar — leading identity", href: "/components/avatar" },
      { label: "Badge — trailing status metadata", href: "/components/badge" },
      { label: "Menu Item — command/menu semantics", href: "/components/menu-item" },
      { label: "Card — grouped static content", href: "/components/card" },
    ],
    relatedTokens: [
      { label: "component/menu/item-hover", href: "/foundations" },
      { label: "component/list-item/supporting-text", href: "/foundations" },
      { label: "component/radius/control", href: "/foundations" },
    ],
    relatedConcepts: [sharedConcepts.shape, sharedConcepts.surface],
    openQuestions: [
      "Selected and density variants are not confirmed in Figma — not implemented.",
      "Compose List Item inside native ul/ol — no separate List component.",
      "Nested Avatar initials cannot be driven from List Item Figma properties.",
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy:
      "List Item composes optional Avatar, Badge, Tag, Button, or icon leading/trailing slots: li + row + leading + title + description + metadata + trailing.",
    keyboardBehavior:
      "Navigational rows use native link activation. Action rows use native button activation. Static rows are not tab stops unless they contain separate controls.",
    comparisons: [
      {
        title: "When should a List Item be interactive?",
        body: "Only when navigation or a row action is intentional. Default rows are static content inside ul/ol.",
      },
      {
        title: "What is the difference between List Item and Menu Item?",
        body: "List Item is generic collection content without menu or listbox roles. Menu Item belongs inside menu semantics.",
      },
      {
        title: "Can a List Item contain another action?",
        body: "Yes on static rows — trailing actions must be separate controls. Do not combine row-level href/onClick with trailing buttons.",
      },
      {
        title: "Which semantics should List Item use?",
        body: "Native li for all modes. Navigational uses anchor/NextLink. Action uses button type=\"button\". No menuitem, option, or listbox roles.",
      },
      {
        title: "Why do Description and Metadata use their own token instead of the shared muted-content token?",
        body: "component/list-item/supporting-text is List Item's own Surface-aware contract — semantic/text/secondary in Flat/Gradient, semantic/text/primary in Glass. It is intentionally distinct from component/surface/content-muted (used by File Upload, Table, and List Item's own leading icon) to guarantee WCAG AA contrast (4.5:1) for this row's supporting text.",
      },
    ],
    apiProps: [
      { name: "title", type: "ReactNode", description: "Primary row label." },
      { name: "description", type: "ReactNode", description: "Secondary text (Figma Subtitle)." },
      { name: "metadata", type: "ReactNode", description: "Trailing metadata such as time or Badge." },
      { name: "leading", type: "ReactNode", description: "Avatar, icon, or other leading content." },
      { name: "trailing", type: "ReactNode", description: "Static trailing content or separate action on static rows." },
      { name: "href", type: "string", description: "Navigational mode — real anchor." },
      { name: "onClick", type: "() => void", description: "Action mode — native button." },
      { name: "disabled", type: "boolean", default: "false", description: "Disables action rows." },
    ],
    reactExample: `import { Avatar } from "@/components/ui/Avatar";
import { ListItem } from "@/components/ui/ListItem";

export function Example() {
  return (
    <ul>
      <ListItem
        leading={<Avatar size="sm" initials="UF" decorative alt="" />}
        title="Usman Farooqi"
        description="Updated documentation"
        metadata="2h ago"
      />
      <ListItem href="/components/button" title="Button" description="Actions" />
    </ul>
  );
}`,
  },
  {
    slug: "table",
    name: "Table",
    category: "Content & Data",
    summary:
      "Table is a native HTML table foundation with captions, headers, body rows, footers, cell alignment, responsive overflow, RTL support, print-friendly scrolling, and composition patterns for empty/loading/error — not the interactive Data Table pattern (no sorting, selection, or pagination).",
    status: "beta",
    version: "0.1.1-beta",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/content-data.ts",
    documentationLastUpdated: "2026-08-31",
    reactLastUpdated: TABLE_DOCS_DATE,
    figmaReference:
      "Canonical reusable basic Table architecture: Content/Table shell 2321:1964; Content/Table Header Row 2321:1903; Content/Table Body Row 2321:1920; Content/Table Cell 2321:1872. Native Slot composition: Rows#2791:12, Header Cells#2791:0, Body Cells#2791:6. Stable-v1 is Flat-only with no Surface property and Rounded-only at radius/lg 12px with cornerSmoothing=0 and no Shape property. Historical example 2044:26192 is reference evidence, not canonical.",
    figmaSourceUrl: TABLE_FIGMA_SOURCE_URL,
    figmaNodeId: TABLE_FIGMA_COMPONENT_NODE_ID,
    documentationUrl: getComponentDocumentationUrl("table"),
    supportedVariants: ["layout-auto", "layout-fixed"],
    supportedSizes: [],
    tokensUsed: [
      "semantic/surface/default",
      "semantic/surface/elevated",
      "semantic/border/default",
      "semantic/text/primary",
      "component/card/surface",
      "component/card/border",
      "component/surface/content-muted",
      "radius/lg",
      "semantic/focus-ring",
      "table-surface",
      "table-cell-padding-inline",
      "table-scroll-shadow",
    ],
    dependencies: [],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: ["lib/cn.ts"],
    registryDependencies: ["@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/Table.tsx", "components/ui/table.module.css"],
    cssTokens: [
      "--component-card-border",
      "--component-card-surface",
      "--component-surface-backdrop-filter",
      "--semantic-border-default",
      "--semantic-focus-ring",
      "--semantic-icon-muted",
      "--semantic-surface-default",
      "--semantic-text-secondary",
      "--table-body-surface",
      "--table-border",
      "--table-caption-gap",
      "--table-caption-text",
      "--table-cell-padding-block",
      "--table-cell-padding-inline",
      "--table-footer-surface",
      "--table-header-border",
      "--table-header-surface",
      "--table-header-text",
      "--table-radius",
      "--table-row-border",
      "--table-scroll-fade-size",
      "--table-scroll-shadow",
      "--table-surface",
      "--table-text",
    ],
    relatedComponents: [
      { label: "List Item — single-column rows, not multi-column tables", href: "/components/list-item" },
      { label: "Badge — status metadata inside cells", href: "/components/badge" },
      { label: "Link — navigational cell content", href: "/components/link" },
      { label: "Menu — row actions inside cells", href: "/components/menu" },
      { label: "Checkbox — selection controls inside cells (composition only)", href: "/components/checkbox" },
      { label: "Empty State — compose manually when a table has no rows", href: "/components/empty-state" },
      { label: "Skeleton — loading placeholder rows", href: "/components/skeleton" },
      { label: "Alert — error messaging above or beside tables", href: "/components/alert" },
      { label: "Pagination — external composition for paged data", href: "/components/pagination" },
    ],
    relatedTokens: [
      { label: "semantic/border/default", href: "/foundations" },
      { label: "semantic/surface/elevated", href: "/foundations" },
      { label: "semantic/focus-ring", href: "/foundations" },
    ],
    relatedConcepts: [sharedConcepts.shape, sharedConcepts.surface],
    openQuestions: [
      "Canonical Caption and Footer visual treatments are still pending in Figma; React preserves its semantic caption/footer API without claiming visual parity for those parts.",
      "Stable-v1 Table is intentionally Rounded-only at radius/lg (12px), with Figma cornerSmoothing=0 and no Shape property. Controlled Table Shape mapping is deferred; global Sharp/Pill/Squircle contexts do not alter the shell.",
      "The responsive TableScrollArea edge-fade treatment remains React-only; Figma documents horizontal overflow as composition rather than native Table anatomy.",
      "Table presentation QA remains separate: budget/date wrapping, column presentation, Pagination number visibility, Table/Pagination spacing, and interactive-cell alignment are still open.",
      "Data Table (implemented 2026-07-15) composes Table for the narrow MVP scope approved 2026-07-13 — sorting only, external Pagination; selection, sticky headers, and density remain excluded from v1.",
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy:
      "TableScrollArea (optional) + Table + TableCaption + TableHeader/Body/Footer + TableRow + TableHead/TableCell. Multi-level headers via native colSpan/rowSpan/headers. Empty/loading/error via composition, not Table props.",
    keyboardBehavior:
      "No composite keyboard model. Tab moves to interactive descendants only. Arrow keys are not captured. TableScrollArea tabIndex is consumer-controlled — recommend tabIndex={0} for known horizontal overflow. Spreadsheet-style cell navigation is out of scope — Data Table does not use role=\"grid\".",
    focusBehavior:
      "Static cells are not focusable. Interactive cell content (links, buttons, checkboxes, menu triggers) owns focus. Focus-visible ring applies when a scroll area is intentionally focusable.",
    announcementBehavior:
      "Caption provides the accessible table name. Screen-reader captions remain in the accessibility tree. Scroll regions should use a distinct accessibleLabel — do not duplicate the caption verbatim.",
    comparisons: [
      {
        title: "What is the difference between Table and Data Table?",
        body: "Table is a semantic presentational foundation. Data Table is the higher-level interaction pattern that composes Table — its narrow MVP scope (sorting only, external Pagination) was approved 2026-07-13 and implemented 2026-07-15.",
      },
      {
        title: "Why does Table use native HTML?",
        body: "Native table elements provide captions, header associations, and screen-reader navigation without redundant ARIA roles.",
      },
      {
        title: "Does Table use role=\"grid\"?",
        body: "No. Ordinary tabular UI uses native HTML table elements. role=\"grid\" is reserved for spreadsheet-like cell navigation and is not part of this foundation.",
      },
      {
        title: "When should a table include a caption?",
        body: "Always provide a meaningful caption that describes the table’s purpose. Use visibility=\"screen-reader\" when a visible caption is visually redundant. Do not replace caption with aria-label by default.",
      },
      {
        title: "How should row headers be marked?",
        body: "Use TableHead with scope=\"row\" for the identifying column. Table does not infer scope automatically.",
      },
      {
        title: "Can cells contain buttons and links?",
        body: "Yes. Compose real Link, Button, Menu, Checkbox, and Badge elements. Keep the row non-interactive.",
      },
      {
        title: "How does Table work on mobile?",
        body: "TableScrollArea owns horizontal overflow with Temporary edge fades. Rows do not transform into cards. Native table structure remains intact.",
      },
      {
        title: "Does Table support sorting?",
        body: "No — sorting is unsupported on Table itself. Sorting is the MVP interactive pillar Data Table (which composes Table) implemented for its approved scope.",
      },
      {
        title: "Does Table support row selection?",
        body: "No selection API. Consumers may place Checkbox controls inside cells as composition only.",
      },
      {
        title: "When should a true ARIA Grid be used?",
        body: "Only for spreadsheet-like cell navigation with managed focus. Conventional data tables should stay native HTML and compose Table.",
      },
    ],
    apiProps: [
      { name: "layout", type: '"auto" | "fixed"', default: '"auto"', description: "Table layout algorithm." },
      { name: "TableCaption.visibility", type: '"visible" | "screen-reader"', default: '"visible"', description: "Caption visibility while remaining accessible." },
      { name: "TableHead.align / TableCell.align", type: '"start" | "center" | "end"', default: '"start"', description: "Logical text alignment via CSS — not HTML align." },
      { name: "TableScrollArea.accessibleLabel", type: "string", description: "Names the overflow region when horizontal scrolling needs a landmark. Keep distinct from the caption." },
      { name: "TableScrollArea.tabIndex", type: "number", description: "Consumer-controlled. Recommend 0 for known horizontally scrollable tables; omit when the table fits." },
      { name: "data-table-wrap", type: '"nowrap"', description: "Optional attribute on TableHead/TableCell to prevent wrapping (action columns)." },
    ],
    reactExample: `import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableScrollArea,
} from "@/components/ui/Table";

export function Example() {
  return (
    <TableScrollArea accessibleLabel="Scrollable projects table" tabIndex={0}>
      <Table>
        <TableCaption>Active projects</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Project</TableHead>
            <TableHead scope="col" align="end">
              Budget
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableHead scope="row">Atlas</TableHead>
            <TableCell align="end">$24,000</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableScrollArea>
  );
}`,
  },
  {
    slug: "data-table",
    name: "Data Table",
    category: "Content & Data",
    summary:
      "Data Table is an interactive data-table pattern composing Table with header sorting and external Pagination — no columns-config prop; the consumer writes their own Table/TableHead/TableBody markup and drops in DataTableSortHeader for sortable columns.",
    status: "beta",
    version: "0.1.0-beta",
    reactAvailability: "available",
    figmaAvailability: "partial",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/content-data.ts",
    documentationLastUpdated: "2026-08-31",
    reactLastUpdated: "2026-07-15",
    figmaReference:
      "DataTableSortHeader maps to Content/Data Table Column Header 2805:859 (Sort Unsorted/Ascending/Descending, Align Start/End, Disabled False/True, Label). No Content/Data Table master exists — customer examples are composition-only on presentation frame 2491:932.",
    figmaSourceUrl: DATA_TABLE_COLUMN_HEADER_FIGMA_SOURCE_URL,
    figmaNodeId: DATA_TABLE_COLUMN_HEADER_FIGMA_NODE_ID,
    documentationUrl: getComponentDocumentationUrl("data-table"),
    supportedVariants: ["sortable-header"],
    supportedSizes: [],
    tokensUsed: [
      "semantic/surface/default",
      "semantic/surface/elevated",
      "semantic/border/default",
      "semantic/text/primary",
      "semantic/icon/muted",
      "semantic/focus-ring",
      "table-header-text",
    ],
    // DataTableSortHeader.tsx directly imports TableHead from Table.tsx
    // (a real value import) — @skrewww/table is therefore a genuine
    // registryDependency, not re-transported files. Pagination/Menu/
    // Checkbox (below) are documented composition EXAMPLES only —
    // DataTableSortHeader.tsx never imports any of them — so they are
    // deliberately NOT declared as registryDependencies here.
    dependencies: ["@phosphor-icons/react"],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: ["lib/cn.ts", "lib/use-controllable.ts", "lib/use-data-table-sort.ts"],
    registryDependencies: ["@skrewww/table", "@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/DataTableSortHeader.tsx", "components/ui/data-table-sort-header.module.css"],
    cssTokens: ["--semantic-focus-ring", "--semantic-icon-muted", "--table-header-text"],
    relatedComponents: [
      { label: "Table — presentational foundation Data Table composes", href: "/components/table" },
      { label: "Pagination — external composition for paged data", href: "/components/pagination" },
      { label: "Menu — row actions inside cells", href: "/components/menu" },
      { label: "Checkbox — selection controls inside cells (composition only, not a Data Table API)", href: "/components/checkbox" },
    ],
    relatedTokens: [
      { label: "semantic/focus-ring", href: "/foundations" },
      { label: "semantic/icon/muted", href: "/foundations" },
    ],
    relatedConcepts: [sharedConcepts.shape, sharedConcepts.surface],
    openQuestions: [
      "No Content/Data Table master exists — Figma ships a Column Header primitive plus composition examples, not a shell component.",
      "Selection, row actions, loading, and empty are Figma composition examples only — not Data Table React APIs. A Data Table Row primitive is not required unless selected/hover chrome or denser action rows become a product requirement.",
      "Free currently has no Basic Table family; Column Header and Data Table presentation stay deferred until a coherent Table-family port. Technical sequencing, not Pro-exclusive gating.",
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy:
      "Data Table is a pattern, not a wrapper component: compose Table/TableScrollArea/TableCaption/TableHeader/TableBody as usual, and use DataTableSortHeader in place of TableHead for sortable columns. useDataTableSort manages which column is sorted and in which direction. Pagination composes alongside, outside Table, with no embedded page API.",
    keyboardBehavior:
      "DataTableSortHeader renders a real button — Tab reaches it as a normal focusable control, Enter and Space activate it like any button. No composite/grid keyboard model; arrow keys are not captured. Table's own keyboard rules (no role=\"grid\", tabIndex on TableScrollArea consumer-controlled) are unchanged.",
    focusBehavior:
      "Clicking or activating a sort header does not move focus elsewhere — focus stays on the button that was activated, so repeated Enter/Space presses can cycle through sort states without hunting for focus.",
    announcementBehavior:
      "aria-sort on the th communicates the current sort state to assistive technology per column (\"ascending\"/\"descending\"/\"none\"). Data Table does not add a live region announcing sort changes — the aria-sort update itself is the accessible signal.",
    comparisons: [
      {
        title: "What is the difference between Table and Data Table?",
        body: "Table is the presentational foundation — captions, headers, rows, cells, overflow. Data Table is the interaction pattern: it composes Table and adds a sortable header building block (DataTableSortHeader) plus a sort-state hook (useDataTableSort). Data Table does not fork Table's markup or add its own role.",
      },
      {
        title: "Why doesn't Data Table take a columns prop?",
        body: "Data Table deliberately has no columns-config API. The consumer still writes real Table/TableHead/TableBody markup — Data Table only supplies the sortable header building block and the sort-state hook on top of markup the consumer already owns, keeping Table's audited semantics (native scope, RTL, TableScrollArea) as the single source of truth.",
      },
      {
        title: "Is Data Table's sort state controlled or uncontrolled?",
        body: "Both — useDataTableSort uses the same useControllableState hook as Accordion, Dialog, Drawer, and CalendarGrid's range mode. Pass sortState + onSortStateChange for controlled usage, or defaultSortState for uncontrolled usage; omit both for a fully internal default.",
      },
      {
        title: "What is the sort cycle?",
        body: "Per column: none -> ascending -> descending -> none. Activating a different column always resets it to ascending and clears the previous column's sort — only one column sorts at a time in this MVP.",
      },
      {
        title: "Does Data Table support row selection?",
        body: "Not in v1 — explicitly deferred. Consumers may still compose Checkbox inside a TableCell manually, the same way they can with plain Table, but Data Table has no selection API of its own. Figma shows optional selection as composition only.",
      },
      {
        title: "Does a Data Table Figma master exist?",
        body: "No. DataTableSortHeader maps to Content/Data Table Column Header 2805:859. Customer-facing examples live on the Content/Presentation/Data Table frame 2491:932. There is no Content/Data Table component master.",
      },
      {
        title: "How does pagination work with Data Table?",
        body: "External composition only — render the existing Pagination component alongside your Table, driving it from your own current-page state. Data Table has no embedded or compound pagination API.",
      },
    ],
    apiProps: [
      {
        name: "DataTableSortHeader.sortDirection",
        type: '"ascending" | "descending" | "none"',
        description: "This column's current sort state — typically from useDataTableSort's getSortDirection(column).",
      },
      {
        name: "DataTableSortHeader.onSort",
        type: "() => void",
        description: "Called when the header is activated. Typically calls useDataTableSort's toggleSort(column).",
      },
      {
        name: "DataTableSortHeader.disabled",
        type: "boolean",
        default: "false",
        description: "Disables the sort button for this column.",
      },
      {
        name: "useDataTableSort(options)",
        type: "{ sortState?, defaultSortState?, onSortStateChange? }",
        description: "Dual controlled/uncontrolled sort-state hook. Returns { sortState, getSortDirection, toggleSort }.",
      },
    ],
    reactExample: `import { useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHeader,
  TableRow,
  TableScrollArea,
  DataTableSortHeader,
} from "@/components/ui";
import { useDataTableSort } from "@/lib/use-data-table-sort";
import { Pagination, buildPaginationItems } from "@/components/ui";

const projects = [
  { id: "atlas", name: "Atlas", budget: 24000 },
  { id: "north-star", name: "North Star", budget: 18500 },
  { id: "harbor", name: "Harbor Analytics", budget: 9250 },
];

export function Example() {
  const { sortState, getSortDirection, toggleSort } = useDataTableSort<"name" | "budget">();
  const [page, setPage] = useState(1);

  const sorted = [...projects].sort((a, b) => {
    if (!sortState.column) return 0;
    const factor = sortState.direction === "ascending" ? 1 : -1;
    return a[sortState.column] > b[sortState.column] ? factor : -factor;
  });

  return (
    <>
      <TableScrollArea accessibleLabel="Scrollable projects table">
        <Table>
          <TableCaption>Projects</TableCaption>
          <TableHeader>
            <TableRow>
              <DataTableSortHeader
                scope="col"
                sortDirection={getSortDirection("name")}
                onSort={() => toggleSort("name")}
              >
                Project
              </DataTableSortHeader>
              <DataTableSortHeader
                scope="col"
                align="end"
                sortDirection={getSortDirection("budget")}
                onSort={() => toggleSort("budget")}
              >
                Budget
              </DataTableSortHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((project) => (
              <TableRow key={project.id}>
                <TableCell>{project.name}</TableCell>
                <TableCell align="end">\${project.budget.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableScrollArea>
      <Pagination
        items={buildPaginationItems({ currentPage: page, totalPages: 3 })}
        onPageChange={setPage}
      />
    </>
  );
}`,
  },
  {
    slug: "tree-view",
    name: "Tree View",
    category: "Content & Data",
    summary:
      "Tree View is a hierarchical, keyboard-navigable tree — file explorers, nested category browsers, org charts. Composes Content/Tree Item rows with roving-tabindex keyboard navigation and depth-based indentation.",
    status: "beta",
    version: "0.1.0-beta",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/content-data.ts",
    documentationLastUpdated: "2026-07-18",
    reactLastUpdated: "2026-07-18",
    figmaReference:
      "Content & Data / Content/Tree Item component set (node 2058:1988; Label, Show chevron, State: Default/Hover/Selected — variant nodes 2058:1985/1986/1987) + the \"Tree View (example)\" composed demo (node 2058:1998), confirming 20px-per-depth indentation. Parent section \"Content/Tree View\", node 2058:2071. Node IDs confirmed via direct Figma inspection 2026-07-18.",
    figmaSourceUrl: TREE_VIEW_FIGMA_FILE_URL,
    figmaNodeId: TREE_VIEW_FIGMA_COMPONENT_SET_NODE_ID,
    documentationUrl: getComponentDocumentationUrl("tree-view"),
    supportedVariants: ["default", "hover", "selected"],
    supportedSizes: [],
    tokensUsed: [
      "component/menu/item-hover",
      "semantic/action/primary",
      "semantic/icon/muted",
      "semantic/text/primary",
      "component/radius/control",
      "semantic/focus-ring",
    ],
    dependencies: ["@phosphor-icons/react"],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: [
      "lib/cn.ts",
      "lib/use-controllable.ts",
      "components/ui/internal/TreeItem.tsx",
      "components/ui/internal/tree-item.module.css",
      "components/ui/internal/tree-flatten.ts",
    ],
    registryDependencies: ["@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/TreeView.tsx", "components/ui/tree-view.module.css"],
    relatedComponents: [
      { label: "List Item — flat, non-nested row alternative", href: "/components/list-item" },
      {
        label: "Tree Item — Figma hierarchical row pattern (docs only)",
        href: "/components/tree-item",
      },
      { label: "Menu — the item-hover token Tree Item reuses", href: "/components/menu" },
    ],
    relatedTokens: [
      { label: "component/radius/control", href: "/foundations" },
      { label: "semantic/focus-ring", href: "/foundations" },
    ],
    relatedConcepts: [sharedConcepts.shape, sharedConcepts.surface],
    openQuestions: [
      "Multi-select is a deferred v2 — not shown in the Figma reference and not built here.",
      "Drag-and-drop reordering, virtualization, and async/lazy-loaded children are all out of scope — none are shown in the Figma reference.",
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy:
      "Tree View renders a flat, depth-first list of visible Tree Item rows (role=\"treeitem\") inside a role=\"tree\" container — not nested DOM groups. Each row is Chevron (hidden on leaf nodes) + an optional consumer-supplied icon (16x16 ReactNode slot, matching Figma's deliberate lack of a formal icon-swap property) + Label. Indentation is depth * 20px computed as padding-left per row, matching the 20px-per-depth unit confirmed in Figma's composed example — never a fixed set of per-depth variants.",
    keyboardBehavior:
      "Roving tabindex — exactly one row is in the Tab sequence at a time. ArrowDown/ArrowUp move focus between visible rows. ArrowRight expands a collapsed node and moves focus onto its newly-visible first child (or moves directly to the first child if already expanded); a no-op on leaf nodes. ArrowLeft collapses an expanded node in place, or moves focus to its parent if already collapsed or a leaf. Enter and Space select the focused row. Clicking the chevron toggles expand/collapse only; clicking the row body selects only — the two are deliberately independent actions.",
    focusBehavior:
      "Focus recovers onto the first visible row if the previously-focused node stops being visible (e.g. a controlled `expanded` update collapses its parent). Expanding a node via ArrowRight defers the actual DOM focus() call to after the new child row commits, since it doesn't exist in the DOM at keydown time.",
    announcementBehavior:
      "aria-expanded is present only on rows with children (omitted entirely on leaf rows). aria-level, aria-setsize, and aria-posinset are set explicitly on every row from the flattened depth-first position, since Tree View does not nest DOM groups the way the WAI-ARIA authoring practice's canonical example does.",
    comparisons: [
      {
        title: "When should I use Tree View instead of List Item?",
        body: "Tree View is for content with genuine hierarchical depth where indentation communicates real structure (file trees, nested categories, org charts). List Item is for flat, non-nested rows — don't reach for Tree View just to get List Item's visual density.",
      },
      {
        title: "Is Tree View's expanded/selected state controlled or uncontrolled?",
        body: "Both, independently — expanded (string[] of node ids) and selected (a single string | null) each use the same useControllableState hook as Accordion, Dialog, Drawer, CalendarGrid's range mode, and Data Table's sort state. Pass expanded + onExpandedChange or selected + onSelectedChange for controlled usage, or defaultExpanded / defaultSelected for uncontrolled.",
      },
      {
        title: "Does Tree View support selecting multiple nodes?",
        body: "No — single-select only in this Beta. Multi-select is a deferred v2 with no clear signal it's needed yet, and isn't shown anywhere in the Figma reference.",
      },
      {
        title: "Why is indentation computed instead of a Figma variant?",
        body: "Figma's own component description calls this out as the #1 common mistake: building indentation as a fixed per-component property. The real anatomy demonstrates it as a genuine per-instance depth spacer (verified at exactly 20px x depth in the composed example), so the React implementation computes the same depth * 20px value as padding-left rather than hardcoding per-level classes or variants.",
      },
      {
        title: "Why doesn't the Icon have its own swap property?",
        body: "Figma deliberately leaves icon selection as a consumer-supplied slot — different rows in the Figma demo use different icons purely through manual instance swaps, with no property backing it. Tree Item's `icon` field is a plain optional ReactNode for the same reason, not a fixed folder/file enum.",
      },
    ],
    apiProps: [
      {
        name: "data",
        type: "TreeNode[]",
        description: "Recursive node data: { id, label, icon?, children? }. The only shape Tree View accepts.",
      },
      {
        name: "expanded / defaultExpanded",
        type: "string[]",
        description: "Controlled or uncontrolled list of expanded node ids.",
      },
      {
        name: "onExpandedChange",
        type: "(expanded: string[]) => void",
        description: "Called whenever the expanded set changes, from click or keyboard.",
      },
      {
        name: "selected / defaultSelected",
        type: "string | null",
        description: "Controlled or uncontrolled single selected node id.",
      },
      {
        name: "onSelectedChange",
        type: "(id: string | null) => void",
        description: "Called when a row is selected via click, Enter, or Space.",
      },
    ],
    reactExample: `import { useState } from "react";
import { TreeView } from "@/components/ui";

const data = [
  {
    id: "src",
    label: "src",
    children: [
      { id: "components", label: "components", children: [
        { id: "button", label: "Button.tsx" },
      ] },
      { id: "index", label: "index.tsx" },
    ],
  },
  { id: "readme", label: "README.md" },
];

export function Example() {
  const [expanded, setExpanded] = useState<string[]>(["src"]);
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <TreeView
      data={data}
      expanded={expanded}
      onExpandedChange={setExpanded}
      selected={selected}
      onSelectedChange={setSelected}
      aria-label="Project files"
    />
  );
}`,
  },
  {
    slug: "bar-chart",
    name: "Bar Chart",
    category: "Content & Data",
    summary:
      "Bar Chart is a single-series, static bar chart built on recharts — real proportional bar heights, month labels below, no Y-axis/gridlines/legend/tooltip.",
    status: "beta",
    version: "0.1.0-beta",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/content-data.ts",
    documentationLastUpdated: "2026-09-22",
    reactLastUpdated: "2026-09-22",
    figmaReference:
      "Content & Data / \"Bar Chart (example)\" (Content/Charts section, node 2058:2568), frame node 2058:2532 — 6 bars (Jan-Jun), single semantic/action/primary fill, real proportional heights (58/95/76/128/108/140 out of a 160px plot area), semantic/text/secondary month labels. No Y-axis, gridlines, legend, or tooltip in the Figma reference. Node IDs confirmed via direct Figma inspection 2026-07-18.",
    figmaSourceUrl: CHARTS_FIGMA_FILE_URL,
    figmaNodeId: BAR_CHART_FIGMA_EXAMPLE_NODE_ID,
    documentationUrl: getComponentDocumentationUrl("bar-chart"),
    supportedVariants: ["default"],
    supportedSizes: [],
    tokensUsed: ["semantic/action/primary", "semantic/text/secondary"],
    relatedComponents: [
      { label: "Line Chart — trend data over the same single-series shape", href: "/components/line-chart" },
    ],
    relatedTokens: [
      { label: "semantic/action/primary", href: "/foundations" },
      { label: "semantic/text/secondary", href: "/foundations" },
    ],
    relatedConcepts: [],
    openQuestions: [
      "Multi-series support is deferred — not shown in the Figma reference and not built here; v1 is single-series only.",
      "Interactivity (hover tooltips, legend interactivity) is deferred — v1 is deliberately static, per the approved v1 scope.",
      "A Y-axis and gridlines beyond the existing X-axis month labels are deferred — not shown in the Figma reference.",
      "Bar corner radius/spacing beyond fill color and the X-axis label treatment is this implementation's own decision, not something Figma specified.",
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy:
      "A recharts BarChart inside ResponsiveContainer (fluid width, fixed height — genuinely fills its parent, not a fixed pixel box), one Bar per datum filled with semantic/action/primary, and an XAxis rendering only text labels (axisLine and tickLine both disabled) in semantic/text/secondary. A visually-hidden (`sr-only`) data table with the same label/value pairs is rendered alongside, and the chart's own SVG is aria-hidden with role=\"img\" + aria-label + aria-describedby pointing at the table — so the underlying data is genuinely available to assistive tech, not just implied by bar heights.",
    announcementBehavior:
      "The chart container exposes role=\"img\" with an accessible name (the required `label` prop) and aria-describedby pointing at a visually-hidden table containing the exact label/value pairs. The chart's own SVG is aria-hidden so assistive tech doesn't attempt to read partial axis text out of context. The chart is a static visualization with no keyboard tab stop; the visually-hidden table is the assistive-technology fallback.",
    comparisons: [
      {
        title: "Why ResponsiveContainer instead of fixed pixel dimensions?",
        body: "A real consumer embeds this in a variable-width dashboard/card, so the chart should genuinely fill its parent — fixed dimensions were an earlier draft, justified partly by a jsdom/ResizeObserver test limitation that has a standard fix (a ResizeObserver polyfill in vitest.setup.ts) rather than a reason to constrain real-world sizing. Height stays a fixed prop (default 240) since chart height is typically design-determined, not fluid.",
      },
      {
        title: "Why is there no Y-axis?",
        body: "Figma's own \"Bar Chart (example)\" frame has no Y-axis, gridlines, legend, or tooltip — only bars and X-axis month labels. This component matches that reference exactly rather than inferring additional chrome Figma didn't show.",
      },
      {
        title: "How is the underlying data exposed to screen readers?",
        body: "A visually-hidden (sr-only) table with the same label/value pairs, linked to the chart via aria-describedby. Bar heights alone convey nothing to assistive tech, so this is a real accessibility mechanism, not optional polish.",
      },
    ],
    apiProps: [
      { name: "data", type: "{ label: string; value: number }[]", description: "Single-series data. Multi-series is deferred." },
      { name: "label", type: "string", description: "Accessible name for the chart — also used as the hidden data table's caption." },
      { name: "height", type: "number", default: "240", description: "Fixed pixel height. Width is fluid (ResponsiveContainer), filling the parent." },
    ],
    reactExample: `import { BarChart } from "@/components/ui";

const monthlySignups = [
  { label: "Jan", value: 58 },
  { label: "Feb", value: 95 },
  { label: "Mar", value: 76 },
  { label: "Apr", value: 128 },
  { label: "May", value: 108 },
  { label: "Jun", value: 140 },
];

export function Example() {
  return <BarChart data={monthlySignups} label="Monthly signups" />;
}`,
    dependencies: ["recharts"],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: ["lib/cn.ts", "components/ui/internal/ChartFrame.tsx", "components/ui/internal/chart-data.ts"],
    registryDependencies: ["@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/BarChart.tsx", "components/ui/bar-chart.module.css"],
    cssTokens: [
      "--semantic-action-primary",
      "--semantic-text-secondary",
    ],
  },
  {
    slug: "line-chart",
    name: "Line Chart",
    category: "Content & Data",
    summary:
      "Line Chart is a single-series, static line chart built on recharts — a single stroked path with hollow-ring point markers, no axes/gridlines/legend/tooltip.",
    status: "beta",
    version: "0.1.0-beta",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/content-data.ts",
    documentationLastUpdated: "2026-09-22",
    reactLastUpdated: "2026-09-22",
    figmaReference:
      "Content & Data / \"Line Chart (example)\" (Content/Charts section, node 2058:2568), frame node 2058:2559 — single 2px semantic/action/primary stroke, 7 data points as 6px hollow-ring markers (fill: semantic/surface/default, stroke: semantic/action/primary, 2px). No axis labels, gridlines, or legend in the Figma reference. Node IDs confirmed via direct Figma inspection 2026-07-18.",
    figmaSourceUrl: CHARTS_FIGMA_FILE_URL,
    figmaNodeId: LINE_CHART_FIGMA_EXAMPLE_NODE_ID,
    documentationUrl: getComponentDocumentationUrl("line-chart"),
    supportedVariants: ["default"],
    supportedSizes: [],
    tokensUsed: ["semantic/action/primary", "semantic/surface/default"],
    relatedComponents: [
      { label: "Bar Chart — categorical data over the same single-series shape", href: "/components/bar-chart" },
    ],
    relatedTokens: [{ label: "semantic/action/primary", href: "/foundations" }],
    relatedConcepts: [],
    openQuestions: [
      "Multi-series support is deferred — not shown in the Figma reference and not built here; v1 is single-series only.",
      "Interactivity (hover tooltips, legend interactivity) is deferred — v1 is deliberately static, per the approved v1 scope.",
      "Axis labels and gridlines are deferred — the Figma reference has none at all for Line Chart.",
      "Fixed chart height (width is fluid) is this implementation's own decision, not something Figma specified.",
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy:
      "A recharts LineChart inside ResponsiveContainer (fluid width, fixed height — genuinely fills its parent, not a fixed pixel box), a single Line stroked in semantic/action/primary at 2px, with a 3px-radius hollow-ring dot per point (semantic/surface/default fill, semantic/action/primary stroke). Curve type is \"linear\" (straight segments between points) — confirmed by reading the actual vector path data for node 2058:2560 via the Figma Plugin API: every segment is a straight \"L\" (lineto) command, with no curve commands at all. No XAxis or YAxis rendered at all, matching the Figma reference exactly. A visually-hidden (`sr-only`) data table with the same label/value pairs is rendered alongside, and the chart's own SVG is aria-hidden with role=\"img\" + aria-label + aria-describedby pointing at the table. An optional `sparkline` mode (used by Banking Account Card) suppresses the point markers and thins the stroke to 1.5px for inline/card use.",
    announcementBehavior:
      "The chart container exposes role=\"img\" with an accessible name (the required `label` prop) and aria-describedby pointing at a visually-hidden table containing the exact label/value pairs. The chart's own SVG is aria-hidden. The chart is a static visualization with no keyboard tab stop; the visually-hidden table is the assistive-technology fallback.",
    comparisons: [
      {
        title: "Why is there no axis at all, not even X-axis labels?",
        body: "Figma's own \"Line Chart (example)\" frame has no axis labels at all — unlike Bar Chart, which does show month labels. This component matches that reference exactly rather than adding chrome Figma didn't show.",
      },
      {
        title: "Why \"linear\" curve type, not a smoothed curve?",
        body: "Verified, not guessed: the actual vector path data for the Figma \"Line\" node (2058:2560), read directly via the Figma Plugin API, is \"M 0 140 L 43.3 93.3 L 86.7 110.8 L 130 43.75 ...\" — every segment is a straight lineto (\"L\") command. An earlier draft used \"monotone\" (a smoothed curve) as an unverified default; that was corrected to \"linear\" once the real path data was checked.",
      },
      {
        title: "Why ResponsiveContainer instead of fixed pixel dimensions?",
        body: "A real consumer embeds this in a variable-width dashboard/card, so the chart should genuinely fill its parent — fixed dimensions were an earlier draft, justified partly by a jsdom/ResizeObserver test limitation that has a standard fix (a ResizeObserver polyfill in vitest.setup.ts) rather than a reason to constrain real-world sizing.",
      },
      {
        title: "How is the underlying data exposed to screen readers?",
        body: "A visually-hidden (sr-only) table with the same label/value pairs, linked to the chart via aria-describedby — the same mechanism Bar Chart uses.",
      },
    ],
    apiProps: [
      { name: "data", type: "{ label: string; value: number }[]", description: "Single-series data. Multi-series is deferred." },
      { name: "label", type: "string", description: "Accessible name for the chart — also used as the hidden data table's caption." },
      { name: "height", type: "number", default: "240", description: "Fixed pixel height. Width is fluid (ResponsiveContainer), filling the parent." },
      { name: "sparkline", type: "boolean", default: "false", description: "Compact inline rendering: hides the point markers and uses a 1.5px stroke instead of 2px. Data and accessibility (role=\"img\" + hidden data table) are unchanged." },
    ],
    reactExample: `import { LineChart } from "@/components/ui";

const monthlySignups = [
  { label: "Jan", value: 58 },
  { label: "Feb", value: 95 },
  { label: "Mar", value: 76 },
  { label: "Apr", value: 128 },
  { label: "May", value: 108 },
  { label: "Jun", value: 140 },
];

export function Example() {
  return <LineChart data={monthlySignups} label="Monthly signups" />;
}`,
    dependencies: ["recharts"],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: ["lib/cn.ts", "components/ui/internal/ChartFrame.tsx", "components/ui/internal/chart-data.ts"],
    registryDependencies: ["@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/LineChart.tsx", "components/ui/line-chart.module.css"],
    cssTokens: [
      "--semantic-action-primary",
      "--semantic-surface-default",
    ],
  },
  {
    slug: "timeline",
    name: "Timeline",
    category: "Content & Data",
    summary:
      "Timeline is a vertical, chronological event list built on Content/Timeline Item rows — Default outlined-ring or Highlighted solid-dot markers, connector suppression purely positional.",
    status: "beta",
    version: "0.1.0-beta",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/content-data.ts",
    documentationLastUpdated: "2026-07-19",
    reactLastUpdated: "2026-07-19",
    figmaReference:
      "Content & Data / \"Content/Timeline Item\" component set (node 2058:2092; Title/Timestamp/Description text properties + State: Default/Highlighted variant) + the \"Timeline (example)\" composed demo (node 2058:2102). Parent section \"Content/Timeline\", node 2058:2130. Node IDs confirmed via direct Figma Plugin API inspection 2026-07-24. Confirmed anatomy: Default is a 10x10 stroke-only dot (1.5px, semantic/action/primary) + a 2x48px Connector Line (semantic/border/default); Highlighted is a 12x12 solid-fill dot (semantic/action/primary), no stroke. Title is always semantic/text/primary; Timestamp/Description are always semantic/text/secondary in both states. Connector-line suppression is purely positional and structural — the last item's Marker Column has no Connector Line child at all, independent of state; there is no formal \"Show connector\" boolean property on the component.",
    figmaSourceUrl: TIMELINE_FIGMA_FILE_URL,
    figmaNodeId: TIMELINE_FIGMA_COMPONENT_SET_NODE_ID,
    documentationUrl: getComponentDocumentationUrl("timeline"),
    supportedVariants: ["default", "highlighted"],
    supportedSizes: [],
    tokensUsed: ["semantic/action/primary", "semantic/border/default", "semantic/text/primary"],
    dependencies: [],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: [
      "lib/cn.ts",
      "components/ui/internal/TimelineItemRow.tsx",
      "components/ui/internal/timeline-item-row.module.css",
    ],
    registryDependencies: ["@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/Timeline.tsx", "components/ui/timeline.module.css"],
    relatedComponents: [
      { label: "Tree View — hierarchical rather than chronological structure", href: "/components/tree-view" },
      { label: "List Item — flat, non-chronological row alternative", href: "/components/list-item" },
    ],
    relatedTokens: [
      { label: "semantic/action/primary", href: "/foundations" },
      { label: "semantic/border/default", href: "/foundations" },
    ],
    relatedConcepts: [],
    openQuestions: [
      "Exact marker/connector pixel sizing, using one shared marker color across both states, and the Timestamp/Description secondary-text token choice are this implementation's own decisions where the given facts didn't specify them.",
      "No truncation is applied anywhere (Title, Timestamp, or Description) — Alert and Card don't truncate their titles either, and Figma's own reference shows the Description wrapping, not truncating, at 220px. List Item does truncate, but its single-line row density isn't comparable to Timeline's larger content blocks.",
      "An empty data array renders nothing (null) — no other collection component in this codebase (Table, Tree View, Bar Chart, Line Chart) has an established empty-state convention to follow instead.",
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy:
      "An <ol> of Timeline Item rows. Each row is a CSS grid of two columns: a marker column (a circular marker — outlined ring for Default, larger solid dot for Highlighted — plus a connector line beneath it) and a content column (Title + Timestamp on one line, Description wrapping below). The connector's length is computed via CSS (flex: 1 inside a grid row stretched to the taller of its two columns), not a fixed pixel value, so it reaches the next item's marker regardless of how tall the current row's description makes it. Connector visibility is purely positional — only the last row omits it — entirely independent of each row's own state.",
    keyboardBehavior:
      "Purely presentational — Timeline has no interactive elements and captures no keyboard input of its own.",
    announcementBehavior:
      "Renders as a real ordered list; each Timestamp is visible text read in document order, not implied by marker position or state alone.",
    comparisons: [
      {
        title: "Why is connector visibility based on position, not state?",
        body: "They're independent concerns. A Default (outlined-ring) item can be the last event in the list and must suppress its connector for that reason alone — not because it's unhighlighted. A Highlighted item can sit in the middle of the list and must keep its connector. Coupling the two would produce a visibly broken timeline the moment a Default item happens to be last, or a Highlighted item happens to not be.",
      },
      {
        title: "How does the connector reach the next item's marker when a description is long?",
        body: "The connector is a flex: 1 element inside a flex column (the marker column) that's stretched by CSS Grid to match the height of the row's taller column — usually the content column, which grows with description length. This is computed by the browser's layout engine, not a fixed pixel height copied from one Figma example.",
      },
      {
        title: "Why no truncation on Title, Timestamp, or Description?",
        body: "Checked precedent first: List Item does truncate its title/description to a single line, but Alert and Card — the more structurally comparable \"content block with a title\" components — don't truncate at all. Figma's own Timeline reference also shows the Description wrapping to 2 lines rather than truncating. Given that mixed signal, this implementation defaults to natural wrapping everywhere, matching the majority precedent and the literal Figma behavior, rather than inventing truncation Timeline alone would need to justify.",
      },
      {
        title: "What happens with an empty data array?",
        body: "Renders nothing. No other collection component in this codebase (Table, Tree View, Bar Chart, Line Chart) auto-composes an empty-state pattern for zero items — EmptyState is always a separate, consumer-composed choice. Inventing a Timeline-specific empty-state behavior would be inconsistent with every sibling component.",
      },
    ],
    apiProps: [
      {
        name: "data",
        type: '{ title: string; timestamp: string; description: string; state?: "default" | "highlighted" }[]',
        description: "Chronological list of events, in display order. state defaults to \"default\".",
      },
    ],
    reactExample: `import { Timeline } from "@/components/ui";

const events = [
  { title: "Order placed", timestamp: "Jan 3, 9:14 AM", description: "Order #48213 received." },
  {
    title: "Payment confirmed",
    timestamp: "Jan 3, 9:16 AM",
    description: "Charge captured successfully.",
    state: "highlighted",
  },
  { title: "Delivered", timestamp: "Jan 6, 2:41 PM", description: "Left at front door." },
];

export function Example() {
  return <Timeline data={events} />;
}`,
  },
  {
    slug: "empty-state",
    name: "Empty State",
    category: "Content & Data",
    summary:
      "Empty State is a zero-content placeholder with title, description, and optional recovery actions for collections, search, or first-use flows.",
    status: "beta",
    version: "0.5.0-beta",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/content-data.ts",
    documentationLastUpdated: DOCS_DATE,
    reactLastUpdated: REACT_DATE,
    figmaReference: "Content & Data / Empty State — Title, Description, Button CTA",
    documentationUrl: getComponentDocumentationUrl("empty-state"),
    supportedVariants: ["first-use", "no-results", "informational"],
    supportedSizes: [],
    tokensUsed: [
      "component/card/surface",
      "component/surface/blur",
      "component/surface/content-muted",
      "semantic/text/primary",
      "semantic/text/secondary",
    ],
    dependencies: [],
    hostRequirements: ["react", "react-dom"],
    internalDependencies: ["lib/cn.ts"],
    registryDependencies: ["@skrewww/button", "@skrewww/link", "@skrewww/foundation"],
    coreDependencies: ["tokens"],
    files: ["components/ui/EmptyState.tsx", "components/ui/empty-state.module.css"],
    cssTokens: [
      "--component-card-surface",
      "--component-surface-backdrop-filter",
      "--component-surface-content-muted",
      "--component-surface-gradient-overlay",
      "--empty-state-action-gap",
      "--empty-state-content-gap",
      "--empty-state-description-text",
      "--empty-state-icon-size",
      "--empty-state-illustration-size",
      "--empty-state-max-width",
      "--empty-state-padding-x",
      "--empty-state-padding-y",
      "--semantic-text-primary",
    ],
    relatedComponents: [
      { label: "Alert — persistent inline feedback, not empty collections", href: "/components/alert" },
      { label: "Skeleton — loading placeholder", href: "/components/skeleton" },
      { label: "Button — primary recovery actions", href: "/components/button" },
      { label: "Link — secondary navigation actions", href: "/components/link" },
    ],
    relatedTokens: [
      { label: "component/card/surface", href: "/foundations" },
      { label: "component/surface/content-muted", href: "/foundations" },
    ],
    relatedConcepts: [sharedConcepts.surface],
    openQuestions: [
      "No Results, Placeholder State, and Result Empty State are synonyms — Empty State is canonical.",
      "Permission-restricted empty states are not confirmed as a separate variant.",
      "Error states remain separate from Empty State.",
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy:
      "Empty State composes optional decorative icon, title, description, and Button or Link actions inside a section.",
    announcementBehavior:
      "No automatic live region on the component. Parent results regions may announce dynamic no-results updates.",
    comparisons: [
      {
        title: "When should an Empty State be shown?",
        body: "After loading completes and a collection, search, or workflow genuinely has zero items — not while data is still loading.",
      },
      {
        title: "What is the difference between Empty State and Alert?",
        body: "Empty State explains absent content with recovery guidance. Alert communicates persistent status or errors inline.",
      },
      {
        title: "How should “No results” be announced?",
        body: "Announce from the surrounding results region when content changes dynamically — not from every child element.",
      },
      {
        title: "Should an Empty State always include an action?",
        body: "No — informational empty states may omit actions when no recovery step exists.",
      },
      {
        title: "When should an illustration be hidden from screen readers?",
        body: "When the icon or illustration is decorative and the title or description already conveys the message.",
      },
    ],
    apiProps: [
      { name: "title", type: "string", description: "Visible heading and accessible section label." },
      { name: "description", type: "ReactNode", description: "Supporting guidance or recovery copy." },
      { name: "icon", type: "ReactNode", description: "Decorative Phosphor icon." },
      { name: "illustration", type: "ReactNode", description: "Optional illustration slot." },
      { name: "primaryAction", type: "{ label, href?, onClick? }", description: "Primary recovery action." },
      { name: "secondaryAction", type: "{ label, href?, onClick? }", description: "Secondary action or link." },
    ],
    reactExample: `import { EmptyState } from "@/components/ui/EmptyState";

export function Example() {
  return (
    <EmptyState
      title="No components match your search"
      description="Try a different term or clear active filters."
      primaryAction={{ label: "Clear filters", onClick: () => undefined }}
      secondaryAction={{ label: "Browse components", href: "/components" }}
    />
  );
}`,
  },
  {
    slug: "banking-transaction-row",
    name: "Banking Transaction Row",
    category: "Content & Data",
    industry: "Banking",
    summary:
      "Banking Transaction Row is a single financial transaction entry — merchant, date, amount, and status — with a Popover for full transaction detail.",
    status: "beta",
    version: "0.1.0-beta",
    reactAvailability: "available",
    figmaAvailability: "unavailable",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/content-data.ts",
    documentationLastUpdated: "2026-07-25",
    reactLastUpdated: "2026-07-25",
    figmaReference:
      "Layer 4 Industry Systems (Banking pilot) — no Figma reference exists. Confirmed via a full Figma file search (every page checked) on 2026-07-25: no Industry Systems page and no Banking-related frame or component exists anywhere in the design file. This is a confirmed absence, not a pending MCP check (see lib/banking-figma-metadata.ts, BANKING_FIGMA_AUDIT_STATUS = \"confirmed-no-reference-2026-07-25\").",
    figmaNodeId: BANKING_FIGMA_COMPONENT_SET_NODE_ID ?? undefined,
    documentationUrl: getComponentDocumentationUrl("banking-transaction-row"),
    supportedVariants: ["success", "warning", "error"],
    supportedSizes: [],
    tokensUsed: [
      "semantic/feedback/success",
      "semantic/feedback/warning",
      "semantic/text/danger",
      "semantic/text/primary",
      "semantic/text/secondary",
    ],
    relatedComponents: [
      { label: "List Item — the row shell this composes", href: "/components/list-item" },
      { label: "Avatar — merchant/counterparty logo or initials", href: "/components/avatar" },
      { label: "Badge — the status indicator this composes", href: "/components/badge" },
      { label: "Popover — the detail-view trigger this composes", href: "/components/popover" },
      { label: "Banking Account Card — sibling Layer 4 Banking pilot component", href: "/components/banking-account-card" },
    ],
    relatedTokens: [
      { label: "semantic/feedback/success", href: "/foundations" },
      { label: "semantic/feedback/warning", href: "/foundations" },
      { label: "semantic/text/danger", href: "/foundations" },
    ],
    relatedConcepts: [],
    openQuestions: [
      "No Figma reference exists for this component or for Industry Systems generally — confirmed absent via full file search on 2026-07-25, not an oversight.",
      "List Item gained aria-expanded/aria-haspopup/aria-controls passthrough for this component's disclosure trigger — a genuine Layer 2 extension, not a Banking-specific workaround (see components/ui/ListItem.tsx).",
      "Currency/amount formatting is the consumer's responsibility — amount is a pre-formatted display string, not a number with a built-in formatter, consistent with how Account Card and Balance Summary also take pre-formatted figures.",
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy:
      "Composes: List Item (row shell) + Avatar (merchant logo/initials) + Badge (status) + Popover (detail trigger, anchored via PopoverAnchor since List Item does not forward a ref).",
    keyboardBehavior:
      "The row is a single native button (List Item's action mode) — Enter/Space toggles the anchored Popover open/closed, matching native button semantics. No composite keyboard model beyond that.",
    comparisons: [
      {
        title: "Why Popover instead of Drawer for the detail view?",
        body: "Popover's own documented purpose (\"non-modal floating panel for supplementary or lightly interactive content anchored to a trigger\") precisely matches viewing a handful of read-only detail fields for one row without leaving the transaction list. Drawer's placement is currently left-edge-only, an unconventional position for a per-row detail panel, and Drawer's own description (\"supplementary settings, filters, or secondary forms\") targets a heavier, more form-like use case than this.",
      },
      {
        title: "Why PopoverAnchor instead of PopoverTrigger?",
        body: "PopoverTrigger clones its child and injects a ref for position tracking — List Item does not forward a ref to its underlying interactive element, so that ref would silently fail to attach. PopoverAnchor wrapping a plain div is the same pattern Combobox already uses for its own non-button trigger (its text input).",
      },
    ],
    apiProps: [
      { name: "merchant", type: "string", description: "Merchant or counterparty name — also the row's title and the Avatar's accessible label." },
      { name: "merchantLogoSrc", type: "string", description: "Optional merchant logo image URL." },
      { name: "merchantInitials", type: "string", description: "Fallback initials shown when merchantLogoSrc is absent or fails to load." },
      { name: "date", type: "string", description: "Display date/time string — formatting is the consumer's responsibility." },
      { name: "amount", type: "string", description: "Pre-formatted amount string (e.g. \"-$42.50\") — currency formatting is the consumer's responsibility." },
      { name: "status", type: '"success" | "warning" | "error"', description: "Drives Badge variant and amount color via existing semantic status tokens." },
      { name: "statusLabel", type: "string", description: "Visible status text (e.g. \"Completed\", \"Pending\", \"Declined\")." },
      { name: "detail", type: "ReactNode", description: "Content shown in the anchored Popover — typically BankingTransactionDetailRow items." },
    ],
    reactExample: `import {
  BankingTransactionRow,
  BankingTransactionDetailRow,
} from "@/components/ui/BankingTransactionRow";

export function Example() {
  return (
    <ul>
      <BankingTransactionRow
        merchant="Coffee Collective"
        merchantInitials="CC"
        date="Jan 12"
        amount="-$4.75"
        status="success"
        statusLabel="Completed"
        detail={
          <>
            <BankingTransactionDetailRow label="Category" value="Dining" />
            <BankingTransactionDetailRow label="Transaction ID" value="TX-48213" />
          </>
        }
      />
    </ul>
  );
}`,
  },
  {
    slug: "banking-account-card",
    name: "Banking Account Card",
    category: "Content & Data",
    industry: "Banking",
    summary:
      "Banking Account Card is a summary card for one financial account — account type, current balance, a compact balance-history sparkline, and an action button.",
    status: "beta",
    version: "0.1.0-beta",
    reactAvailability: "available",
    figmaAvailability: "unavailable",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/content-data.ts",
    documentationLastUpdated: "2026-07-25",
    reactLastUpdated: "2026-07-25",
    figmaReference:
      "Layer 4 Industry Systems (Banking pilot) — no Figma reference exists. Confirmed via a full Figma file search (every page checked) on 2026-07-25 (see lib/banking-figma-metadata.ts, BANKING_FIGMA_AUDIT_STATUS = \"confirmed-no-reference-2026-07-25\").",
    figmaNodeId: BANKING_FIGMA_COMPONENT_SET_NODE_ID ?? undefined,
    documentationUrl: getComponentDocumentationUrl("banking-account-card"),
    supportedVariants: [],
    supportedSizes: [],
    tokensUsed: ["semantic/text/primary", "semantic/text/secondary"],
    relatedComponents: [
      { label: "Card — the surface shell this composes", href: "/components/card" },
      { label: "Tag — the account-type indicator this composes", href: "/components/tag" },
      { label: "Button — the action trigger this composes", href: "/components/button" },
      { label: "Line Chart — the balance-history sparkline this composes", href: "/components/line-chart" },
      { label: "Banking Transaction Row — sibling Layer 4 Banking pilot component", href: "/components/banking-transaction-row" },
    ],
    relatedTokens: [
      { label: "semantic/text/primary", href: "/foundations" },
      { label: "semantic/text/secondary", href: "/foundations" },
    ],
    relatedConcepts: [sharedConcepts.shape, sharedConcepts.surface],
    openQuestions: [
      "No Figma reference exists for this component or for Industry Systems generally — confirmed absent via full file search on 2026-07-25, not an oversight.",
      "Line Chart gained an additive `sparkline` prop for this component's balance-history treatment — a genuine Layer 2 extension (suppresses point-marker dots, uses a thinner stroke), not a Banking-specific style override (see components/ui/LineChart.tsx).",
      "Glass Surface + Pill Shape inheritance was verified live (not assumed) — this component sets no background-color or border-radius of its own anywhere in its stylesheet; every surface property comes from Card's own custom properties.",
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy:
      "Composes: Card (surface shell, title + footer slots) + Tag (account type) + Button (action trigger, in Card's footer slot) + Line Chart in sparkline mode (balance history).",
    comparisons: [
      {
        title: "Does Account Card need its own Surface/Shape handling?",
        body: "No — it inherits Card's `--surface-fill-default` and `--shape-radius-container` custom properties entirely through the CSS cascade. Verified live in Glass Surface + Pill Shape mode rather than assumed from Card's own behavior.",
      },
      {
        title: "Why does Line Chart need a sparkline prop instead of just a small height?",
        body: "Line Chart's base design already has no axes, gridlines, or legend, so a small height alone gets most of the way there — but its hollow-ring point-marker dots are unconditional in the base design and dominate the visual at sparkline scale. The additive `sparkline` prop suppresses them and uses a thinner stroke.",
      },
    ],
    apiProps: [
      { name: "accountName", type: "string", description: "Shown as the Card's title heading." },
      { name: "accountType", type: "string", description: "e.g. \"Checking\", \"Savings\", \"Credit\" — shown as a Tag." },
      { name: "balance", type: "string", description: "Pre-formatted balance string (e.g. \"$4,231.09\") — currency formatting is the consumer's responsibility." },
      { name: "balanceHistory", type: "LineChartDatum[]", description: "Recent balance history for the sparkline — same shape as Line Chart's own data prop." },
      { name: "balanceHistoryLabel", type: "string", description: "Accessible name for the sparkline chart." },
      { name: "actionLabel", type: "string", description: "Label for the footer action button." },
      { name: "onAction", type: "() => void", description: "Called when the action button is activated." },
    ],
    reactExample: `import { BankingAccountCard } from "@/components/ui/BankingAccountCard";

export function Example() {
  return (
    <BankingAccountCard
      accountName="Everyday Checking"
      accountType="Checking"
      balance="$4,231.09"
      balanceHistory={[
        { label: "Week 1", value: 4100 },
        { label: "Week 2", value: 4180 },
        { label: "Week 3", value: 4050 },
        { label: "Week 4", value: 4231 },
      ]}
      balanceHistoryLabel="30-day balance history for Everyday Checking"
      actionLabel="View transactions"
      onAction={() => undefined}
    />
  );
}`,
  },
  {
    slug: "banking-balance-summary",
    name: "Banking Balance Summary",
    category: "Content & Data",
    industry: "Banking",
    summary:
      "Banking Balance Summary is a spending/income overview card with a time-range-filtered Bar Chart and a loading state.",
    status: "beta",
    version: "0.1.0-beta",
    reactAvailability: "available",
    figmaAvailability: "unavailable",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/content-data.ts",
    documentationLastUpdated: "2026-07-25",
    reactLastUpdated: "2026-07-25",
    figmaReference:
      "Layer 4 Industry Systems (Banking pilot) — no Figma reference exists. Confirmed via a full Figma file search (every page checked) on 2026-07-25 (see lib/banking-figma-metadata.ts, BANKING_FIGMA_AUDIT_STATUS = \"confirmed-no-reference-2026-07-25\").",
    figmaNodeId: BANKING_FIGMA_COMPONENT_SET_NODE_ID ?? undefined,
    documentationUrl: getComponentDocumentationUrl("banking-balance-summary"),
    supportedVariants: [],
    supportedSizes: [],
    tokensUsed: ["semantic/text/primary", "semantic/text/secondary"],
    relatedComponents: [
      { label: "Card — the layout wrapper this composes", href: "/components/card" },
      { label: "Bar Chart — the spending/income visualization this composes", href: "/components/bar-chart" },
      { label: "Tabs — the time-range filter this composes", href: "/components/tabs" },
      { label: "Skeleton — the loading state this composes", href: "/components/skeleton" },
      { label: "Banking Transaction Row — sibling Layer 4 Banking pilot component", href: "/components/banking-transaction-row" },
    ],
    relatedTokens: [
      { label: "semantic/text/primary", href: "/foundations" },
      { label: "semantic/text/secondary", href: "/foundations" },
    ],
    relatedConcepts: [],
    openQuestions: [
      "No Figma reference exists for this component or for Industry Systems generally — confirmed absent via full file search on 2026-07-25, not an oversight.",
      "Each time range renders its own Bar Chart instance inside its own Tabs panel — real per-range data is expected from the consumer, not one dataset re-scaled across ranges.",
    ],
    hasImplementation: true,
    hasPreview: true,
    indexing: "index",
    anatomy:
      "Composes: Card (layout wrapper, title slot) + Tabs (time-range filter, one TabsPanel per range) + Bar Chart (one instance per range, inside its panel) + Skeleton / SkeletonLoading (loading state, replaces the total figure and Tabs entirely while loading).",
    apiProps: [
      { name: "title", type: "string", description: "Card title, e.g. \"Spending overview\"." },
      { name: "totalLabel", type: "string", description: "Label shown next to the total figure, e.g. \"Total spent\"." },
      { name: "total", type: "string", description: "Pre-formatted total figure (e.g. \"$1,284.32\") — currency formatting is the consumer's responsibility." },
      { name: "ranges", type: "{ value, label, data: BarChartDatum[] }[]", description: "One entry per selectable time range, each with its own real data." },
      { name: "defaultRange", type: "string", description: "Defaults to the first range's value when omitted." },
      { name: "loading", type: "boolean", default: "false", description: "Shows Skeleton placeholders instead of the total figure and Tabs." },
      { name: "loadingLabel", type: "string", default: '"Loading spending summary"', description: "Accessible label announced while loading." },
    ],
    reactExample: `import { BankingBalanceSummary } from "@/components/ui/BankingBalanceSummary";

export function Example() {
  return (
    <BankingBalanceSummary
      title="Spending overview"
      totalLabel="Total spent"
      total="$1,284.32"
      ranges={[
        {
          value: "7d",
          label: "7D",
          data: [
            { label: "Mon", value: 42 },
            { label: "Tue", value: 88 },
          ],
        },
        {
          value: "30d",
          label: "30D",
          data: [
            { label: "Week 1", value: 320 },
            { label: "Week 2", value: 410 },
          ],
        },
      ]}
    />
  );
}`,
  },
];
