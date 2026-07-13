# Project status

Last verified: **2026-07-13** (derived from repository registry, tests, and build configuration — not manually maintained counts)

See also: [`docs/architecture/source-of-truth.md`](architecture/source-of-truth.md)

## React implementation status

**Verified from code**

| Metric | Value | Source |
|--------|------:|--------|
| Implemented Beta components | 39 | `getImplementedComponentCount()` / `lib/component-registry.ts` |
| Registry entries with React | 39 | `hasImplementation: true` |
| Figma-documented components | 55 | `content/` inventory (`lib/data.ts`) |
| Documentation-only (no React) | 16 | Figma docs not in implemented registry set |
| Indexable documentation slugs | 54 | `getIndexableComponentSlugs()` |
| Redirect aliases | 2 | `form-field-wrapper`, `accordion-item` |

### Implemented inventory by category

| Category | Components |
|----------|------------|
| Actions | Button, Link |
| Containers & Overlays | Accordion, Card, Dialog, Drawer, Popover |
| Content & Data | Avatar, Calendar Day, Calendar Grid, Divider, Empty State, List Item, Table, Tag |
| Forms | Checkbox, Combobox, Date Picker, File Upload, Form Field, Radio, Radio Group, Search Field, Select, Switch, Text Input, Textarea, Validation Message |
| Feedback | Alert, Badge, Progress Bar, Skeleton, Spinner, Toast, Tooltip |
| Navigation | Breadcrumb, Menu, Pagination, Tabs |

## Figma status

**Partially resolved** — Combobox confirmed 2026-07-13; File Upload and Data Table MCP verification still required (prior attempt: connection timeout)

- Starting node from brief: `2002:2365`
- Combobox component-set node ID: **`2024:2480`** ("Forms/Combobox", section `2024:2501`) — confirmed via Figma MCP on 2026-07-13, after resolving a competing Desktop Bridge instance on port 9224 that had caused the prior timeout (see [`combobox-parity.md`](architecture/combobox-parity.md))
- File Upload component-set node ID: unresolved — **React Beta implemented; live Figma verification pending** (see [`file-upload-discovery.md`](architecture/file-upload-discovery.md))
- Data Table component-set node ID: unresolved — Figma verification still pending, but **not blocking**: naming/scope (sorting-only MVP, external Pagination) was approved 2026-07-13 as a React-first product decision, same precedent as Table (see [`table-foundation.md`](architecture/table-foundation.md), [`data-table-discovery.md`](architecture/data-table-discovery.md))
- Variable collection counts, page inventory, and current component-set totals: **not verified in this pass**

Historical Figma snapshots must not be treated as current state. See [`skrewww-figma-practices-instructions.md`](../skrewww-figma-practices-instructions.md).

## Quality-gate status

**Last verified: 2026-07-13** (post Next.js 16 upgrade, branch `upgrade/next-16`)

| Gate | Result |
|------|--------|
| `npm run verify:node` | Pass (Node 24.14.0, requires >=20.19.0) |
| `npm run verify:package` | Pass (`skrewww-docs@0.2.0-beta` lockfile aligned) |
| ESLint | Pass — 26 problems (0 errors, 26 warnings), `--max-warnings 26` |
| TypeScript | Pass |
| Vitest | **495 tests** across **64 files** (unchanged from pre-upgrade baseline) |
| Playwright | **125 tests** (isolated `.next-playwright` on port 3100, unchanged) |
| Production build | Pass — Turbopack (default bundler), 70/70 pages, no webpack fallback needed |
| `npm audit` | 1 moderate remaining (PostCSS XSS, vendored inside Next's own `postcss@8.4.31`, unresolved upstream even in 16.2.10) — down from 5 (1 moderate, 4 high) pre-upgrade; see resolved note below |

**Next.js major upgrade — resolved 2026-07-13**: Upgraded 14.2.35 → **16.2.10**
(React 18 → **19.2.7**, ESLint 8 → **9.39.5** with flat config). Closes the
"requires jumping to Next 16.x" note in
[`components/README.md`](../components/README.md). Async params/searchParams
migration applied to both dynamic routes (`app/components/[slug]`,
`app/components/category/[categorySlug]`); 5 React 19 `element.ref`
deprecation call sites fixed (Popover ×2, Dialog, Drawer, Tooltip); one
genuine Turbopack CSS build failure fixed (`@import` reordered before
`@tailwind` directives in `app/globals.css`, see `app/globals.css`).

## Recently shipped

**Verified from code / documented architecture** — see [`calendar-foundation.md`](architecture/calendar-foundation.md)

- **Calendar Grid month/year drill-up subviews** (2026-07-12) — three internal drill levels (day/month/year) with dedicated `CalendarMonthCell`/`CalendarYearCell` components, focus restoration on drill transitions, and range enforcement via `isMonthFullyDisabled`/`isYearFullyDisabled`
- **Calendar Grid date-range selection** (2026-07-12) — opt-in `mode="range"` with `rangeValue`/`defaultRangeValue`/`onRangeValueChange`, live keyboard+hover provisional preview, chronological auto-swap on a backwards second click, and disabled-dates-in-the-middle handling

## Major parity gaps

**Verified from code / documented architecture**

- Figma MCP verification for File Upload component-set node and temporary tokens
- Combobox option-list/listbox anatomy (option icons, descriptions, selected indicator) and a clear-all control have no Figma spec yet — confirmed absent, not unaudited (see [`combobox-parity.md`](architecture/combobox-parity.md#option-anatomy)); React's current option list is React-first pending a Figma reference frame
- File Upload progress UI, preview thumbnails, controlled files, and retry semantics
- Multi-select Combobox — Figma confirms the `Multi-select` property and chip-removal icon, but its own component description flags a known limitation (Value text doesn't auto-hide) that any build needs to work around (see [`combobox-parity.md`](architecture/combobox-parity.md#multi-select-known-limitation))
- Calendar Grid composed range-picker input (two independently-typable start/end text fields + shared calendar, analogous to Date Picker) — judged non-trivial in scope (comparable to rebuilding Date Picker), not built; see [`calendar-foundation.md`](architecture/calendar-foundation.md#composed-range-picker-input--explicitly-out-of-scope)
- Tree View, Charts, Timeline
- Advanced overlay patterns beyond current Dialog/Drawer/Popover/Menu stack
- Full Style System (Shape/Surface) parity across all components

## Active roadmap

1. **Data Table MVP (approved scope, 2026-07-13)** — canonical name **Data Table** (`data-table`), deliberately not "Data Grid" since `role="grid"`, cell editing, and spreadsheet-style arrow-key cell navigation are out of scope. Approved narrow scope: **sorting only** (header sort control + `aria-sort`; row selection deferred to a later pass), composes `Table`/`TableScrollArea`, **external `Pagination` composition** (no embedded/compound pagination API). No cell editing, virtualization, sticky headers, or density variants in v1. Decision recorded in [`data-table-discovery.md`](architecture/data-table-discovery.md); implementation itself has not started — a deliberate, separate next pass.
2. **File Upload Figma parity** — MCP re-audit for component-set node, variants, and token bindings
3. **Combobox polish** — request a Figma reference frame for option-list anatomy (confirmed absent today); a clear-all control is confirmed absent from Figma too, so building one would be a new design addition, not a parity fix
4. Infrastructure and source-of-truth maintenance — ongoing

## Source-of-truth rules

| Topic | Authority |
|-------|-----------|
| React implementation status | Canonical registry + public exports + tests/build |
| Figma design status | Figma MCP when successful; otherwise marked unresolved |
| Token values in React | `styles/tokens.css` |
| Token values in Figma | Figma variables when MCP-verified |
| Volatile counts | This file + registry-derived tests |
| Durable principles | Standing instruction files + architecture docs |
| Canonical URLs | `NEXT_PUBLIC_SITE_URL` at deploy time |

**Deferred:** treating README prose counts as authoritative without registry derivation.

**Unresolved:** current Figma variable/collection totals until MCP succeeds.
