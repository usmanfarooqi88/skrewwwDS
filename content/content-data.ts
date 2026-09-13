import { ComponentDoc } from "@/lib/types";

export const contentDataComponents: ComponentDoc[] = [
  {
    slug: "avatar",
    name: "Avatar",
    category: "Content & Data",
    variants: "Size (Small/Medium/Large) — 3 variants",
    purpose: "A circular visual representation of a user or entity, showing initials as a fallback when no profile image is available.",
    whenToUse: "Anywhere a user/account needs visual identification.",
    whenNotToUse: "Representing non-user entities better served by a different icon or logo mark.",
    accessibility: "If purely decorative alongside a visible name, mark aria-hidden; if it's the only identification, needs an accessible name.",
    commonMistakes: "Using ambiguous or non-unique initials with no fallback plan.",
    tokensUsed: ["component/button/primary/background", "radius/full"],
    properties: "Size as variants. Initials (text).",
  },
  {
    slug: "divider",
    name: "Divider",
    category: "Content & Data",
    variants: "Orientation (Horizontal/Vertical) — 2 variants",
    purpose: "A thin line separating distinct sections or groups of content.",
    whenToUse: "Visually separating unrelated content blocks where spacing alone isn't a strong enough signal.",
    whenNotToUse: "Overusing dividers where consistent spacing already communicates separation.",
    accessibility: "Purely decorative — aria-hidden, or role=\"separator\" only if it carries real structural meaning.",
    commonMistakes: "Using a Divider as a substitute for proper spacing/grouping in layout.",
    tokensUsed: ["semantic/border/default"],
    properties: "Orientation as variants.",
  },
  {
    slug: "tag",
    name: "Tag",
    category: "Content & Data",
    variants: "Single component",
    purpose: "A removable, user-generated or user-applied label — distinct from Badge, which is a non-removable system status indicator.",
    whenToUse: "User-applied categorization the user can remove.",
    whenNotToUse: "A non-removable system status — use Badge.",
    accessibility: "Remove icon needs aria-label like \"Remove [tag name]\"; removing should move focus sensibly afterward.",
    commonMistakes: "Using Tag for a non-removable status indicator.",
    tokensUsed: ["semantic/surface/elevated", "semantic/icon/muted", "radius/full"],
    properties: "Label (text). Show remove (boolean).",
  },
  {
    slug: "list-item",
    name: "List Item",
    category: "Content & Data",
    variants: "State (Default/Hover) — 2 variants",
    purpose: "A single row in a list showing an avatar, title/subtitle, and trailing metadata — the standard pattern for activity feeds and contact lists.",
    whenToUse: "Any list of similarly-structured items with a person/entity, primary text, secondary text, and trailing info.",
    whenNotToUse: "Tabular data with multiple aligned columns — use Table (/components/table).",
    accessibility: "If the row is clickable, the whole row should be one real link/button, not just visually clickable.",
    commonMistakes: "Cramming too much information into the trailing metadata slot.",
    tokensUsed: ["component/menu/item-hover", "semantic/text/primary", "component/radius/control"],
    properties: "State as variants. Title (text), Subtitle (text), Meta (text).",
    knownLimitation: "The nested Avatar instance's Initials property cannot be exposed as a parent-level property through Figma's API — requires selecting the nested instance directly.",
  },
  {
    slug: "table",
    name: "Table",
    category: "Content & Data",
    variants: "Compound semantic foundation — no density/sort/selection variants in Beta",
    purpose:
      "A native HTML table foundation for presenting multi-column data with captions, headers, body rows, footers, cell alignment, responsive overflow, RTL-safe alignment, and print-friendly scrolling.",
    whenToUse:
      "Tabular data with aligned columns — statuses, budgets, inventories, comparison matrices — when List Item cannot express the structure.",
    whenNotToUse:
      "Single-column activity feeds or contact lists — use List Item. Table itself still does not orchestrate selection, pagination ownership, or spreadsheet navigation — sorting now ships as the Data Table pattern (DataTableSortHeader + useDataTableSort), which composes Table rather than replacing it.",
    accessibility:
      "Uses native <table>, <caption>, <thead>, <tbody>, <tfoot>, <tr>, <th>, and <td>. Do not add role=\"grid\". Consumer supplies scope on TableHead. Captions name the table; scroll regions use a distinct accessibleLabel when labelled. Interactive cell content must remain real links/buttons/checkboxes. tabIndex on TableScrollArea is consumer-controlled — recommend tabIndex={0} only for known horizontal overflow.",
    commonMistakes:
      "Treating Table as Data Table; making entire rows clickable; omitting captions; duplicating caption text as the scroll-region label; using role=\"grid\" for ordinary tabular UI; transforming rows into cards on mobile; forcing tabIndex={0} on every small table; truncating critical data behind Tooltip-only access.",
    tokensUsed: [
      "component/card/surface",
      "component/card/border",
      "component/surface/content-muted",
      "semantic/surface/default",
      "semantic/surface/elevated",
      "semantic/border/default",
      "semantic/text/primary",
      "radius/lg",
      "semantic/focus-ring",
    ],
    properties:
      "Compound API: Table, TableCaption, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableScrollArea. layout auto|fixed. Caption visibility visible|screen-reader. Cell/head align start|center|end. data-table-wrap=nowrap for action cells. Empty/loading/error via composition only.",
    knownLimitation:
      "Canonical reusable Figma anatomy is now verified (Table 2321:1964; Header Row 2321:1903; Body Row 2321:1920; Cell 2321:1872) with Native Slot Rows/Cells composition. Stable-v1 is Flat-only with no Surface property and Rounded-only at 12px with cornerSmoothing=0 and no Shape property. Caption/Footer visuals and controlled Table Shape mapping remain pending; sorting is provided separately by Data Table. See docs/architecture/table-foundation.md.",
  },
  {
    slug: "data-table",
    name: "Data Table",
    category: "Content & Data",
    variants: "Sortable header building block — no density/selection/sticky variants in Beta",
    purpose:
      "The interactive data-table pattern: composes Table with a sortable column-header building block (DataTableSortHeader) and a sort-state hook (useDataTableSort), plus external Pagination composition — sorting only, no columns-config prop.",
    whenToUse:
      "Tabular data that needs single-column sorting on top of Table's presentational foundation — the consumer still writes real Table/TableHead/TableBody markup and drops DataTableSortHeader in for sortable columns.",
    whenNotToUse:
      "Read-only tabular data with no sort interaction — use plain Table. Row selection, spreadsheet-style cell editing, or arrow-key cell navigation — all explicitly out of scope; Data Table deliberately avoids role=\"grid\".",
    accessibility:
      "DataTableSortHeader renders a real <button> inside <th> with aria-sort set to \"ascending\", \"descending\", or \"none\". Native button semantics give Enter/Space activation and normal Tab focus for free — no custom keyboard handling. Table's own accessibility rules (native semantics, no role=\"grid\", consumer-supplied scope) are unchanged.",
    commonMistakes:
      "Expecting a columns/rows prop that generates markup — Data Table has none, by design; building row selection, sticky headers, density variants, or virtualization into this MVP — all explicitly deferred; embedding pagination inside Data Table instead of composing the separate Pagination component; using a non-button element as the sort trigger.",
    tokensUsed: [
      "semantic/surface/default",
      "semantic/surface/elevated",
      "semantic/border/default",
      "semantic/text/primary",
      "semantic/icon/muted",
      "semantic/focus-ring",
    ],
    properties:
      "DataTableSortHeader: sortDirection (\"ascending\"|\"descending\"|\"none\"), onSort, disabled, plus all TableHead props (scope, align, etc.). useDataTableSort(options): sortState/defaultSortState/onSortStateChange (dual controlled/uncontrolled), returns { sortState, getSortDirection, toggleSort }. Sort cycle per column: none -> ascending -> descending -> none; a different column always resets to ascending.",
    knownLimitation:
      "DataTableSortHeader maps to Figma Content/Data Table Column Header 2805:859. There is no Content/Data Table master — customer examples are composition-only. Selection, sticky headers, density, and virtualization remain deferred as React APIs. See docs/architecture/data-table-discovery.md.",
  },
  {
    slug: "empty-state",
    name: "Empty State",
    category: "Content & Data",
    variants: "Single component",
    purpose: "Communicating that a list, table, or content area currently has no data, with a clear next action to remedy that.",
    whenToUse: "Any list/table/collection view when it has zero items.",
    whenNotToUse: "Loading states — use Skeleton. Empty State means confirmed zero results, not still loading.",
    accessibility: "Should be announced via an aria-live region when it replaces a previously loading/populated view.",
    commonMistakes: "Showing Empty State prematurely, before confirming data has finished loading.",
    tokensUsed: ["component/surface/content-muted", "semantic/text/primary", "semantic/text/secondary"],
    properties: "Title (text), Description (text). Includes a real Button instance for the call-to-action.",
  },
  {
    slug: "tree-item",
    name: "Tree Item",
    category: "Content & Data",
    variants: "State (Default/Hover/Selected) — 3 variants",
    purpose: "Tree Item is a single row in a hierarchical Tree View — file explorers, nested category browsers, org charts.",
    whenToUse: "Content with genuine hierarchical depth where indentation communicates structure.",
    whenNotToUse: "Flat, non-nested lists — use List Item.",
    accessibility: "role=\"treeitem\" within a parent role=\"tree\", with aria-expanded, aria-level, aria-setsize, aria-posinset. Full keyboard navigation required.",
    commonMistakes: "Building indentation as a fixed per-component property instead of a real per-instance spacer value.",
    tokensUsed: ["semantic/surface/elevated", "semantic/action/primary", "semantic/icon/muted", "component/radius/control"],
    properties: "State as variants. Label (text). Show chevron (boolean).",
    knownLimitation:
      "Implemented in React as an internal row composed by Tree View (components/ui/internal/TreeItem.tsx) — see /components/tree-view for the canonical, publicly documented, implemented pattern. This entry remains Figma-facing prose about the underlying Content/Tree Item component set.",
  },
  {
    slug: "tree-view",
    name: "Tree View",
    category: "Content & Data",
    variants: "Composed from Tree Item rows — no top-level variants of its own",
    purpose:
      "A hierarchical, keyboard-navigable tree for file explorers, nested category browsers, and org charts, composed from Content/Tree Item rows.",
    whenToUse:
      "Content with genuine hierarchical depth where indentation communicates real structure, and the user needs to expand/collapse and select individual nodes.",
    whenNotToUse:
      "Flat, non-nested lists — use List Item. Multi-select, drag-and-drop reordering, virtualization, and async/lazy-loaded children are all out of scope in this Beta.",
    accessibility:
      "role=\"tree\" containing a flat, depth-first list of role=\"treeitem\" rows (not nested DOM groups) — aria-level, aria-setsize, and aria-posinset are set explicitly on every row since DOM nesting doesn't convey depth here. aria-expanded is present only on rows with children. Roving tabindex keeps exactly one row in the Tab sequence; arrow keys move/expand/collapse, Enter/Space selects.",
    commonMistakes:
      "Building indentation as a fixed per-component property instead of computing depth * 20px per row (Figma's own description calls this out as the #1 mistake); inventing a fixed folder/file icon-swap enum when Figma deliberately leaves icon selection as a consumer-supplied slot; building multi-select, drag-and-drop, or virtualization that aren't part of this scope.",
    tokensUsed: [
      "component/menu/item-hover",
      "semantic/action/primary",
      "semantic/icon/muted",
      "semantic/text/primary",
      "component/radius/control",
    ],
    properties:
      "data (TreeNode[]: { id, label, icon?, children? }). expanded/defaultExpanded + onExpandedChange (controlled/uncontrolled). selected/defaultSelected + onSelectedChange (controlled/uncontrolled, single-select only).",
  },
  {
    slug: "bar-chart",
    name: "Bar Chart",
    category: "Content & Data",
    variants: "Single component — no variants",
    purpose: "A single-series, static bar chart for comparing categorical values (e.g. monthly totals).",
    whenToUse: "Comparing discrete categorical values at a glance where exact precision matters less than relative comparison.",
    whenNotToUse: "Multi-series comparisons, interactive drill-down, or trend-over-time data — use Line Chart for trends; multi-series is deferred for both.",
    accessibility: "role=\"img\" with an accessible name, plus a visually-hidden (sr-only) data table with the same label/value pairs linked via aria-describedby — bar heights alone convey nothing to assistive tech.",
    commonMistakes: "Treating \"static\" as \"no accessibility work needed\" — the hidden data table is required, not optional polish. Building multi-series or interactive (tooltip/legend) variants that are explicitly deferred for v1.",
    tokensUsed: ["semantic/action/primary", "semantic/text/secondary"],
    properties: "data ({ label, value }[]). label (accessible name / hidden table caption). height (fixed pixel height, default 240 — width is fluid, filling the parent).",
  },
  {
    slug: "line-chart",
    name: "Line Chart",
    category: "Content & Data",
    variants: "Single component — no variants",
    purpose: "A single-series, static line chart for visualizing a trend across ordered points.",
    whenToUse: "A single trend line across ordered categories (e.g. months) where the shape of change matters.",
    whenNotToUse: "Categorical comparisons without an inherent order — use Bar Chart. Multi-series trends are deferred.",
    accessibility: "role=\"img\" with an accessible name, plus a visually-hidden (sr-only) data table with the same label/value pairs linked via aria-describedby — the line path alone conveys nothing to assistive tech.",
    commonMistakes: "Treating \"static\" as \"no accessibility work needed\" — the hidden data table is required, not optional polish. Adding axis labels, gridlines, or a legend the Figma reference doesn't show.",
    tokensUsed: ["semantic/action/primary", "semantic/surface/default"],
    properties: "data ({ label, value }[]). label (accessible name / hidden table caption). height (fixed pixel height, default 240 — width is fluid, filling the parent).",
  },
  {
    slug: "timeline-item",
    name: "Timeline Item",
    category: "Content & Data",
    variants: "State (Default/Highlighted) — 2 variants",
    purpose: "Timeline Item is a single event in a chronological Timeline — activity feeds, order status history, audit logs.",
    whenToUse: "Sequential, time-stamped events where chronological order itself is meaningful.",
    whenNotToUse: "A fixed, known-length linear process with progress state — use Step Item.",
    accessibility: "Renders as an ordered list; timestamp available as real text, not just implied by position.",
    commonMistakes: "Leaving the connector line visible on the final (most recent) event — should be hidden.",
    tokensUsed: ["semantic/action/primary", "semantic/border/default", "semantic/text/primary"],
    properties: "State as variants — Default is an outlined ring, Highlighted is a larger solid dot. Title (text), Timestamp (text), Description (text).",
    knownLimitation:
      "Implemented in React as an internal row composed by Timeline (components/ui/internal/TimelineItemRow.tsx) — see /components/timeline for the canonical, publicly documented, implemented pattern. This entry remains Figma-facing prose about the underlying Content/Timeline Item component; no Figma node ID has been confirmed for it yet.",
  },
  {
    slug: "timeline",
    name: "Timeline",
    category: "Content & Data",
    variants: "Composed from Timeline Item rows — no top-level variants of its own",
    purpose:
      "A vertical, chronological list of events for activity feeds, order status history, or audit logs, composed from Content/Timeline Item rows.",
    whenToUse:
      "Sequential, time-stamped events where chronological order itself is meaningful and each event needs its own title, timestamp, and description.",
    whenNotToUse:
      "A fixed, known-length linear process with progress state — use Step Item. An empty list of events — Timeline renders nothing for zero items; there's no established empty-state convention for collection components in this codebase to fall back to.",
    accessibility:
      "Renders as a real ordered list (role=\"list\"/<ol>); each event's timestamp is real visible text, not just implied by position or by the marker's visual state.",
    commonMistakes:
      "Coupling connector-line visibility to state === \"highlighted\" instead of actual list position — the two are independent: a Default item can be last (and must suppress its connector), and a Highlighted item can be in the middle (and must keep its connector). Introducing truncation or an invented empty-state pattern that no comparable component in this codebase actually uses.",
    tokensUsed: ["semantic/action/primary", "semantic/border/default", "semantic/text/primary"],
    properties:
      "data ({ title, timestamp, description, state? }[] — state defaults to \"default\"; \"highlighted\" is a larger solid dot instead of an outlined ring).",
  },
  {
    slug: "calendar-grid",
    name: "Calendar Grid",
    category: "Content & Data",
    variants: "Single-date or range month view — composed from Calendar Day",
    purpose:
      "A month-view calendar grid for selecting one date or a date range, composed from Calendar Day cells with month navigation.",
    whenToUse:
      "Inline month or range selection, or as the calendar surface inside Date Picker.",
    whenNotToUse:
      "Multi-date (non-contiguous) selection or scheduling views with events — not confirmed in Figma.",
    accessibility:
      "role=\"grid\" with weekday column headers, roving tabindex on day buttons, and arrow-key navigation.",
    commonMistakes:
      "Using Calendar Day outside a grid without providing collection keyboard semantics.",
    tokensUsed: [
      "semantic/surface/default",
      "semantic/border/default",
      "semantic/text/primary",
      "component/radius/container",
    ],
    properties:
      "Composes Calendar Day building blocks in a 7×6 grid with month heading and previous/next controls.",
  },
  {
    slug: "calendar-day",
    name: "Calendar Day",
    category: "Content & Data",
    variants: "State (Default/Today/Selected/Disabled/Outside) — 5 variants",
    purpose: "A single day cell within a full Calendar month grid — the actual date-picker popover Date Picker's input field needed but didn't include.",
    whenToUse: "Composed together (7×6 grid) to build the calendar popover for Date Picker.",
    whenNotToUse: "Standalone outside a full Calendar composition.",
    accessibility: "role=\"grid\" with role=\"gridcell\", full arrow-key navigation. Disabled dates need aria-disabled.",
    commonMistakes: "Conflating \"Outside\" (adjacent month, often still clickable) with \"Disabled\" (blocked-out, never selectable) — they look similar but mean different things.",
    tokensUsed: ["semantic/action/primary", "semantic/text/primary", "semantic/text/disabled", "radius/full"],
    properties: "State as variants. Number (text).",
  },
  {
    slug: "banking-transaction-row",
    name: "Banking Transaction Row",
    category: "Content & Data",
    industry: "Banking",
    variants: "Status (success/warning/error) — drives Badge variant and amount color, no top-level variants of its own",
    purpose:
      "Banking Transaction Row is a single transaction entry in a financial activity list — merchant, date, amount, and status, with a Popover for full detail. The first Layer 4 Industry Systems pilot component; React-first, no Figma reference exists yet for Industry Systems.",
    whenToUse:
      "Listing individual financial transactions (purchases, transfers, deposits) where each row needs its own status and an optional detail view without leaving the list.",
    whenNotToUse:
      "A generic, non-financial row — use List Item directly. A transaction that doesn't need a status or detail view — a plain List Item composition is simpler.",
    accessibility:
      "The whole row is a single native button (List Item's action mode) with aria-expanded/aria-haspopup=\"dialog\"/aria-controls reflecting the anchored Popover's open state — added to List Item itself for this, not layered on top of it.",
    commonMistakes:
      "Wrapping List Item in PopoverTrigger instead of PopoverAnchor — List Item doesn't forward a ref, so PopoverTrigger's clone-based ref assignment silently fails to attach to a real DOM node. Inventing new status colors instead of reusing the existing semantic/feedback/success, semantic/feedback/warning, and semantic/text/danger tokens established for exactly this purpose.",
    tokensUsed: [
      "semantic/feedback/success",
      "semantic/feedback/warning",
      "semantic/text/danger",
      "semantic/text/primary",
      "semantic/text/secondary",
    ],
    properties:
      "merchant, merchantLogoSrc?, merchantInitials?, date, amount, status (success/warning/error), statusLabel, detail (ReactNode, typically BankingTransactionDetailRow items).",
  },
  {
    slug: "banking-account-card",
    name: "Banking Account Card",
    category: "Content & Data",
    industry: "Banking",
    variants: "No top-level variants of its own — inherits Card's elevation and Layer 3 Shape/Surface modes",
    purpose:
      "Banking Account Card is a summary card for one financial account — account type, current balance, a compact balance-history sparkline, and an action button. The second Layer 4 Industry Systems pilot component; React-first, no Figma reference exists yet.",
    whenToUse:
      "Dashboards or account-list views showing one account's current state and short-term balance trend at a glance.",
    whenNotToUse:
      "Detailed transaction history for an account — compose Banking Transaction Row items in a list instead; Account Card is a summary, not a ledger.",
    accessibility:
      "The balance-history chart is exposed via role=\"img\" with an accessible name plus a visually-hidden data table (Line Chart's own accessibility model) — sparkline mode changes only the visual density, not the accessibility tree.",
    commonMistakes:
      "Hardcoding the card's background or border-radius instead of leaving Card's own --surface-fill-default / --shape-radius-container custom properties untouched, which is what makes Glass Surface and Pill Shape modes repaint automatically.",
    tokensUsed: ["semantic/text/primary", "semantic/text/secondary"],
    properties:
      "accountName, accountType, balance, balanceHistory (LineChartDatum[]), balanceHistoryLabel, actionLabel, onAction.",
  },
  {
    slug: "banking-balance-summary",
    name: "Banking Balance Summary",
    category: "Content & Data",
    industry: "Banking",
    variants: "No top-level variants of its own — time ranges are consumer-supplied Tabs, not a fixed variant set",
    purpose:
      "Banking Balance Summary is a spending/income overview card with a time-range-filtered Bar Chart and a loading state. The third Layer 4 Industry Systems pilot component; React-first, no Figma reference exists yet.",
    whenToUse:
      "Summarizing spending or income over a small set of selectable time ranges (e.g. 7D/30D/90D) inside a dashboard.",
    whenNotToUse:
      "A single, non-comparative chart with no time-range filtering — compose Card + Bar Chart directly without Tabs.",
    accessibility:
      "Each time range renders its own Bar Chart instance inside its own Tabs panel, so only the selected range's chart (and its accessible name/hidden data table) is in the accessibility tree at a time — matching Tabs' own hidden-inactive-panel behavior, not a manually toggled visibility hack.",
    commonMistakes:
      "Re-scaling one shared dataset for different time ranges instead of giving each range its own real data — spending data genuinely differs by range, it isn't the same series zoomed in or out. Introducing a new loading-state pattern instead of composing the existing Skeleton / SkeletonLoading primitives.",
    tokensUsed: ["semantic/text/primary", "semantic/text/secondary"],
    properties:
      "title, totalLabel, total, ranges ({ value, label, data: BarChartDatum[] }[]), defaultRange?, loading?, loadingLabel?.",
  },
];
