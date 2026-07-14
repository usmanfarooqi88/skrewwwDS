import type { ComponentRegistryEntry } from "@/lib/component-registry";
import { getComponentDocumentationUrl } from "@/lib/site-config";
import {
  TABLE_FIGMA_COMPONENT_SET_NODE_ID,
  TABLE_FIGMA_SOURCE_URL,
} from "@/lib/table-figma-metadata";
import {
  DATA_TABLE_FIGMA_COMPONENT_SET_NODE_ID,
  DATA_TABLE_FIGMA_FILE_URL,
} from "@/lib/data-table-figma-metadata";

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
const TABLE_DOCS_DATE = "2026-07-13";

export const contentDataRegistryEntries: ComponentRegistryEntry[] = [
  {
    slug: "tag",
    name: "Tag",
    category: "Content & Data",
    summary:
      "Compact classification label for categories, filters, or user-applied values — distinct from read-only Badge status metadata.",
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
      "Circular visual identity for a user or entity with image, initials, or icon fallback.",
    status: "beta",
    version: "0.5.0-beta",
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
      "semantic/action/primary",
      "semantic/text/inverse",
      "semantic/border/default",
      "radius/full",
    ],
    relatedComponents: [
      { label: "List Item — row composition with Avatar", href: "/components/list-item" },
      { label: "Badge — status metadata, not identity", href: "/components/badge" },
    ],
    relatedTokens: [
      { label: "semantic/action/primary", href: "/foundations" },
      { label: "radius/full", href: "/foundations" },
    ],
    relatedConcepts: [sharedConcepts.shape],
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
      "Thin separator line between content sections — horizontal or vertical, semantic or decorative.",
    status: "beta",
    version: "0.5.0-beta",
    reactAvailability: "available",
    figmaAvailability: "available",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/content-data.ts",
    documentationLastUpdated: DOCS_DATE,
    reactLastUpdated: REACT_DATE,
    figmaReference: "Content & Data / Divider — Orientation (Horizontal/Vertical)",
    documentationUrl: getComponentDocumentationUrl("divider"),
    supportedVariants: ["thematic", "decorative", "structural"],
    supportedSizes: [],
    tokensUsed: ["semantic/border/default"],
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
      "Single row inside a collection — avatar, title, description, metadata, and optional trailing content.",
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
    documentationUrl: getComponentDocumentationUrl("list-item"),
    supportedVariants: ["static", "navigational", "action"],
    supportedSizes: [],
    tokensUsed: [
      "semantic/surface/elevated",
      "semantic/text/primary",
      "semantic/text/secondary",
      "component/radius/control",
      "semantic/focus-ring",
    ],
    relatedComponents: [
      { label: "Avatar — leading identity", href: "/components/avatar" },
      { label: "Badge — trailing status metadata", href: "/components/badge" },
      { label: "Menu Item — command/menu semantics", href: "/components/menu-item" },
      { label: "Card — grouped static content", href: "/components/card" },
    ],
    relatedTokens: [
      { label: "semantic/surface/elevated", href: "/foundations" },
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
      "Native HTML table foundation with captions, headers, body rows, footers, cell alignment, responsive overflow, RTL support, print-friendly scrolling, and composition patterns for empty/loading/error — not the interactive Data Table pattern (no sorting, selection, or pagination).",
    status: "beta",
    version: "0.1.1-beta",
    reactAvailability: "available",
    figmaAvailability: "unavailable",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/content-data.ts",
    documentationLastUpdated: TABLE_DOCS_DATE,
    reactLastUpdated: TABLE_DOCS_DATE,
    figmaReference: "React-first Table foundation — Figma component set unverified; MCP audit pending",
    figmaSourceUrl: TABLE_FIGMA_SOURCE_URL,
    figmaNodeId: TABLE_FIGMA_COMPONENT_SET_NODE_ID ?? undefined,
    documentationUrl: getComponentDocumentationUrl("table"),
    supportedVariants: ["layout-auto", "layout-fixed"],
    supportedSizes: [],
    tokensUsed: [
      "semantic/surface/default",
      "semantic/surface/elevated",
      "semantic/border/default",
      "semantic/text/primary",
      "semantic/text/secondary",
      "semantic/focus-ring",
      "table-surface",
      "table-cell-padding-inline",
      "table-scroll-shadow",
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
      "Figma component-set node ID unresolved — live MCP verification pending.",
      "Temporary table geometry and scroll-shadow tokens await Figma confirmation.",
      "Data Table's narrow MVP scope (sorting only, external Pagination) was approved 2026-07-13 — not yet implemented; selection, sticky headers, and density remain excluded from v1.",
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
        body: "Table is a semantic presentational foundation. Data Table is the higher-level interaction pattern that composes Table — its narrow MVP scope (sorting only, external Pagination) was approved 2026-07-13, but it has not been implemented yet.",
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
        body: "No — sorting is unsupported on Table itself. Sorting is the approved MVP interactive pillar for Data Table, which composes Table but has not been implemented yet.",
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
      "Interactive data-table pattern composing Table with header sorting and external Pagination — no columns-config prop; the consumer writes their own Table/TableHead/TableBody markup and drops in DataTableSortHeader for sortable columns.",
    status: "beta",
    version: "0.1.0-beta",
    reactAvailability: "available",
    figmaAvailability: "unavailable",
    documentationCompleteness: "partial",
    accessibilityLevel: "WCAG 2.2 AA (target)",
    documentationSource: "content/content-data.ts",
    documentationLastUpdated: "2026-07-15",
    reactLastUpdated: "2026-07-15",
    figmaReference: "React-first Data Table MVP — no Figma component set exists yet; MCP audit pending",
    figmaSourceUrl: DATA_TABLE_FIGMA_FILE_URL,
    figmaNodeId: DATA_TABLE_FIGMA_COMPONENT_SET_NODE_ID ?? undefined,
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
      "No Figma component set exists for Data Table yet — sort-header anatomy and token bindings are React-first, same precedent as Table.",
      "Row selection (Checkbox column), sticky headers, density variants, and virtualization remain deferred to a later pass — not in this MVP.",
      "Row-actions conventions beyond composing Menu in a cell are still open.",
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
        body: "Not in v1 — explicitly deferred. Consumers may still compose Checkbox inside a TableCell manually, the same way they can with plain Table, but Data Table has no selection API of its own.",
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
    slug: "empty-state",
    name: "Empty State",
    category: "Content & Data",
    summary:
      "Zero-content placeholder with title, description, and optional recovery actions for collections, search, or first-use flows.",
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
      "semantic/icon/muted",
      "semantic/text/primary",
      "semantic/text/secondary",
    ],
    relatedComponents: [
      { label: "Alert — persistent inline feedback, not empty collections", href: "/components/alert" },
      { label: "Skeleton — loading placeholder", href: "/components/skeleton" },
      { label: "Button — primary recovery actions", href: "/components/button" },
      { label: "Link — secondary navigation actions", href: "/components/link" },
    ],
    relatedTokens: [
      { label: "semantic/icon/muted", href: "/foundations" },
      { label: "semantic/text/secondary", href: "/foundations" },
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
];
