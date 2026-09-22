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
    purpose:
      "Tree Item describes the individual hierarchical row in a Tree View — file explorers, nested category browsers, org charts. It is the Figma row pattern; public React composition and interaction live on Tree View.",
    whenToUse:
      "Content with genuine hierarchical depth where indentation communicates structure. For React, compose Tree View — expanded and selected state are owned there, not by a standalone Tree Item export.",
    whenNotToUse: "Flat, non-nested lists — use List Item instead of a hierarchical Tree Item row.",
    accessibility:
      "role=\"treeitem\" within a parent role=\"tree\", with aria-expanded, aria-level, aria-setsize, aria-posinset. Full keyboard navigation is provided by Tree View’s composition.",
    commonMistakes:
      "Building indentation as a fixed per-component property instead of a real per-instance spacer value. Treating this docs page as a public standalone React TreeItem API.",
    tokensUsed: [
      "semantic/surface/elevated",
      "semantic/action/primary",
      "semantic/icon/muted",
      "component/radius/control",
    ],
    properties: "State as variants. Label (text). Show chevron (boolean).",
    knownLimitation:
      "There is no public standalone React TreeItem export. Rows are an internal implementation detail of Tree View (components/ui/internal/TreeItem.tsx). Use Tree View for the canonical, publicly documented React pattern. This page remains Figma-facing prose about the Content/Tree Item component set.",
    relatedLinks: [
      {
        label: "Tree View — public React hierarchical composition",
        href: "/components/tree-view",
      },
      {
        label: "List Item — flat, non-nested row alternative",
        href: "/components/list-item",
      },
    ],
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
    variants: "Single component — orientation and stacking are props, not variants",
    purpose: "Compare values across categories with bars: a single series by default, or several series grouped, stacked, or stacked to 100%, vertical or horizontal.",
    whenToUse: "Comparing discrete categorical values, or the composition of several series per category (stacked / percent), where relative length matters more than exact precision.",
    whenNotToUse: "Trends over ordered time — use Line Chart or Area Chart. Parts of a single whole (Pie/Donut do not exist yet), distributions of raw points (Scatter is not available), or more than about four series (only four color slots exist; identification then relies on the legend and hidden table).",
    accessibility: "role=\"img\" with an accessible name, described by a visually-hidden (sr-only) data table with one column per series (missing values read \"No data\"), so series are identified by name, never by color alone. The plot, legend and tooltip are aria-hidden; the chart is a static visualization with no keyboard tab stop, and the tooltip is pointer/touch-only supplementary information.",
    commonMistakes: "Creating HorizontalBarChart / StackedBarChart components or props — use orientation=\"horizontal\" and stacking=\"stacked\" | \"percent\". Inventing props: chart families are separate components (do not add a `type`, `variant` or `stacked` prop), `series` keys must be unique and never \"label\", and raw Recharts props are not accepted. Pie, Donut, Scatter, Heatmap, Waterfall, Funnel and other chart families do not exist yet — do not import or claim them. Treating \"static\" as \"no accessibility work needed\": the hidden data table is required, not optional polish.",
    tokensUsed: ["semantic/action/primary", "semantic/text/primary", "semantic/text/secondary", "semantic/border/default", "semantic/border/strong", "semantic/surface/default", "semantic/surface/subtle", "color/warning/700", "color/success/700"],
    properties: "data (rows: { label, value } or { label, [series.key]: number | null }). label (accessible name / hidden table caption). height (fixed pixel height, default 240 — width is fluid, filling the parent). orientation (\"vertical\" columns, default | \"horizontal\"). stacking (\"none\" grouped, default | \"stacked\" | \"percent\"). series ({ key, label, color?, format? }[] — omit for a single series read from each row's `value`), legend (boolean, default: true for several series), tooltip (boolean, default false), showCategoryAxis, showValueAxis, showGrid (booleans), valueFormat (a function or { kind: \"number\" | \"compact\" | \"percent\" | \"currency\" }), labelFormat (a function or { kind: \"date\", granularity }).",
  },
  {
    slug: "line-chart",
    name: "Line Chart",
    category: "Content & Data",
    variants: "Single component — no variants",
    purpose: "Visualize a trend across ordered points: a single series by default, or several series as separate lines. Includes a compact sparkline mode.",
    whenToUse: "One or more trend lines across ordered categories (for example months) where the shape of change matters, including comparing several series.",
    whenNotToUse: "Categorical comparisons without an inherent order — use Bar Chart. Magnitude or accumulation where the filled area matters — use Area Chart. More than about four series (only four color slots exist).",
    accessibility: "role=\"img\" with an accessible name, described by a visually-hidden (sr-only) data table with one column per series (missing values read \"No data\"), so series are identified by name, never by color alone. The plot, legend and tooltip are aria-hidden; the chart is a static visualization with no keyboard tab stop, and the tooltip is pointer/touch-only supplementary information.",
    commonMistakes: "Adding axes, grid, legend or tooltip to the default chart when the Figma reference shows none (they are opt-in), or switching to an area chart with a `type` prop — Area Chart is its own component. Inventing props: chart families are separate components (do not add a `type`, `variant` or `stacked` prop), `series` keys must be unique and never \"label\", and raw Recharts props are not accepted. Pie, Donut, Scatter, Heatmap, Waterfall, Funnel and other chart families do not exist yet — do not import or claim them. Treating \"static\" as \"no accessibility work needed\": the hidden data table is required, not optional polish.",
    tokensUsed: ["semantic/action/primary", "semantic/text/primary", "semantic/text/secondary", "semantic/border/default", "semantic/border/strong", "semantic/surface/default", "semantic/surface/subtle", "color/warning/700", "color/success/700"],
    properties: "data (rows: { label, value } or { label, [series.key]: number | null }). label (accessible name / hidden table caption). height (fixed pixel height, default 240 — width is fluid, filling the parent). sparkline (boolean, default false — compact inline rendering: hides the markers, uses a 1.5px stroke and hides all axes, grid, legend and tooltip; data and accessibility are unchanged, e.g. the balance-history trend in Banking Account Card). markers (boolean, default true; always false in sparkline mode). series ({ key, label, color?, format? }[] — omit for a single series read from each row's `value`), legend (boolean, default: true for several series), tooltip (boolean, default false), showCategoryAxis, showValueAxis, showGrid (booleans), valueFormat (a function or { kind: \"number\" | \"compact\" | \"percent\" | \"currency\" }), labelFormat (a function or { kind: \"date\", granularity }).",
  },
  {
    slug: "area-chart",
    name: "Area Chart",
    category: "Content & Data",
    variants: "Single component — stacking is a prop, not a variant",
    purpose: "Show magnitude or accumulation over ordered categories with a filled area: a single series by default, or several series overlapped, stacked, or stacked to 100%.",
    whenToUse: "Volume over time, cumulative totals, or the composition of a whole across ordered categories (stacked / percent) where the filled area helps the reader.",
    whenNotToUse: "Only the shape of change matters, or many overlapping series — use Line Chart. Comparing discrete categories — use Bar Chart. Data with negative values in stacked or percent mode (not designed). Parts of a single whole (Pie/Donut do not exist yet).",
    accessibility: "role=\"img\" with an accessible name, described by a visually-hidden (sr-only) data table with one column per series (missing values read \"No data\"), so series are identified by name, never by color alone. The plot, legend and tooltip are aria-hidden; the chart is a static visualization with no keyboard tab stop, and the tooltip is pointer/touch-only supplementary information.",
    commonMistakes: "Using a `stacked` boolean or a separate StackedAreaChart — use stacking=\"stacked\" | \"percent\". There is no Figma reference for Area Chart, so do not claim Figma parity. Inventing props: chart families are separate components (do not add a `type`, `variant` or `stacked` prop), `series` keys must be unique and never \"label\", and raw Recharts props are not accepted. Pie, Donut, Scatter, Heatmap, Waterfall, Funnel and other chart families do not exist yet — do not import or claim them. Treating \"static\" as \"no accessibility work needed\": the hidden data table is required, not optional polish.",
    tokensUsed: ["semantic/action/primary", "semantic/text/primary", "semantic/text/secondary", "semantic/border/default", "semantic/border/strong", "semantic/surface/default", "semantic/surface/subtle", "color/warning/700", "color/success/700"],
    properties: "data (rows: { label, value } or { label, [series.key]: number | null }). label (accessible name / hidden table caption). height (fixed pixel height, default 240 — width is fluid, filling the parent). stacking (\"none\" overlapped, default | \"stacked\" | \"percent\"). series ({ key, label, color?, format? }[] — omit for a single series read from each row's `value`), legend (boolean, default: true for several series), tooltip (boolean, default false), showCategoryAxis, showValueAxis, showGrid (booleans), valueFormat (a function or { kind: \"number\" | \"compact\" | \"percent\" | \"currency\" }), labelFormat (a function or { kind: \"date\", granularity }).",
  },
  {
    slug: "chart-metric",
    name: "Chart Metric",
    category: "Content & Data",
    variants: "Single component — no variants",
    purpose: "A labeled value with an optional directional delta, for use above a chart (typically inside Chart Card) or standalone.",
    whenToUse: "Summarizing a chart with a headline number — a total, a count, a current value — optionally with how it changed versus a comparison period.",
    whenNotToUse: "Business-specific metrics with their own semantics (revenue, occupancy, patient counts) — those are an industry composition's naming decision, not Chart Metric's; it only displays a pre-formatted label/value/delta you supply.",
    accessibility: "The delta's direction is announced in words (\"Increased\"/\"Decreased\"/\"Unchanged\") via visually-hidden text before the value, so it is never conveyed by the icon or color alone. The delta icon is aria-hidden.",
    commonMistakes: "Assuming an \"increase\" is colored green (or a \"decrease\" red) — it never is; `direction` selects only the icon. Passing an unformatted number — value/delta are pre-formatted strings, matching Bar/Line/Area Chart's own established convention.",
    tokensUsed: ["semantic/text/primary", "semantic/text/secondary"],
    properties: "label (string). value (pre-formatted string, e.g. \"$4,231.09\"). delta ({ direction: \"up\" | \"down\" | \"flat\"; value: string; label?: string } — direction drives only the icon; value is pre-formatted, e.g. \"+4.2%\"; label is optional comparison context, e.g. \"vs last 30 days\").",
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
