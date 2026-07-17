# Project status

Last verified: **2026-07-15** (derived from repository registry, tests, and build configuration — not manually maintained counts)

See also: [`docs/architecture/source-of-truth.md`](architecture/source-of-truth.md)

## React implementation status

**Verified from code**

| Metric | Value | Source |
|--------|------:|--------|
| Implemented Beta components | 40 | `getImplementedComponentCount()` / `lib/component-registry.ts` |
| Registry entries with React | 40 | `hasImplementation: true` |
| Figma-documented components | 56 | `content/` inventory (`lib/data.ts`) |
| Documentation-only (no React) | 16 | Figma docs not in implemented registry set |
| Indexable documentation slugs | 55 | `getIndexableComponentSlugs()` |
| Redirect aliases | 2 | `form-field-wrapper`, `accordion-item` |

### Implemented inventory by category

| Category | Components |
|----------|------------|
| Actions | Button, Link |
| Containers & Overlays | Accordion, Card, Dialog, Drawer, Popover |
| Content & Data | Avatar, Calendar Day, Calendar Grid, Data Table, Divider, Empty State, List Item, Table, Tag |
| Forms | Checkbox, Combobox, Date Picker, File Upload, Form Field, Radio, Radio Group, Search Field, Select, Switch, Text Input, Textarea, Validation Message |
| Feedback | Alert, Badge, Progress Bar, Skeleton, Spinner, Toast, Tooltip |
| Navigation | Breadcrumb, Menu, Pagination, Tabs |

## Figma status

**Partially resolved** — Combobox confirmed 2026-07-13, updated 2026-07-15 (Multi-select removed from Figma, option-list anatomy now confirmed present); File Upload confirmed 2026-07-15 (single-file and multi-file anatomy both Figma-confirmed); Data Table MCP verification still required

- Starting node from brief: `2002:2365`
- Combobox component-set node ID: **`2024:2480`** ("Forms/Combobox", section `2024:2501`) — confirmed via Figma MCP on 2026-07-13, after resolving a competing Desktop Bridge instance on port 9224 that had caused the prior timeout. **Updated 2026-07-15**: the `Multi-select` boolean property and its Chips frame were removed from Figma entirely (no corresponding code capability ever existed); a new demo frame ("Combobox (example — open)", node `2113:2`) now confirms option-list/listbox anatomy directly — plain label text only, no icon, no description, matching `ComboboxOption`'s real type. A token gap was found (not fixed): `semantic/surface/subtle`, used by the selected-option background, has no Figma variable (see [`combobox-parity.md`](architecture/combobox-parity.md))
- File Upload component-set node ID: **`2024:2649`** ("Forms/File Upload") — confirmed via direct Figma property inspection on 2026-07-15: 5 state variants (Empty/Dragging/Error/Disabled/Filled) + File Name text property. **Both single-file and multi-file anatomy are Figma-confirmed.** The Filled variant (node `2024:2648`) is a vertical list container holding one or more File Row frames (first: node `2107:10`, File Icon + File Name + Remove Icon); the base variant shows one row (single-file as a list of one), and a multi-file example frame (node `2108:21`) shows three. React's existing `multiple`/`maxFiles`/independently-removable file list already matches this structure — nothing to change (see [`file-upload-discovery.md`](architecture/file-upload-discovery.md), `FILE_UPLOAD_MULTI_FILE_ANATOMY_STATUS = "confirmed-present"` in `lib/file-upload-figma-metadata.ts`)
- Data Table component-set node ID: unresolved — Figma verification still pending, but **not blocking**: the sorting-only MVP (external Pagination composition) approved 2026-07-13 was implemented 2026-07-15 as a React-first product, same precedent as Table (see [`table-foundation.md`](architecture/table-foundation.md), [`data-table-discovery.md`](architecture/data-table-discovery.md))
- Variable collection counts, page inventory, and current component-set totals: **not verified in this pass**

Historical Figma snapshots must not be treated as current state. See [`skrewww-figma-practices-instructions.md`](../skrewww-figma-practices-instructions.md).

## Quality-gate status

**Last verified: 2026-07-15** (Data Table MVP implemented; see note below)

| Gate | Result |
|------|--------|
| `npm run verify:node` | Pass (Node 24.14.0, requires >=20.19.0) |
| `npm run verify:package` | Pass (`skrewww-docs@0.2.0-beta` lockfile aligned) |
| ESLint | Pass — 26 problems (0 errors, 26 warnings), `--max-warnings 26` |
| TypeScript | Pass |
| Vitest | **515 tests** across **66 files** (501 prior baseline + 14 new: `useDataTableSort` hook + `DataTableSortHeader` component) |
| Playwright | **131 tests** (isolated `.next-playwright` on port 3100; 125 prior baseline + 6 new `e2e/data-table.spec.ts`) |
| Production build | Pass — Turbopack (default bundler), **71/71 pages** (70/70 prior baseline + 1 new `/components/data-table` page), no webpack fallback needed |
| `npm audit` | **0 vulnerabilities** — resolved 2026-07-15 via a `postcss` override; see resolved note below |

**Next.js major upgrade — resolved 2026-07-13**: Upgraded 14.2.35 → **16.2.10**
(React 18 → **19.2.7**, ESLint 8 → **9.39.5** with flat config). Closes the
"requires jumping to Next 16.x" note in
[`components/README.md`](../components/README.md). Async params/searchParams
migration applied to both dynamic routes (`app/components/[slug]`,
`app/components/category/[categorySlug]`); 5 React 19 `element.ref`
deprecation call sites fixed (Popover ×2, Dialog, Drawer, Tooltip); one
genuine Turbopack CSS build failure fixed (`@import` reordered before
`@tailwind` directives in `app/globals.css`, see `app/globals.css`). A
regression here has a dedicated tripwire covering all 5 call sites:
`Popover.test.tsx` has one "does not access the deprecated element.ref API"
test for `PopoverTrigger` and one for `PopoverAnchor` (the one Combobox
composes), and `Dialog.test.tsx`/`Drawer.test.tsx`/`Tooltip.test.tsx` each
have one — every test spies on `console.error` with an explicit caller ref
attached (2026-07-14).

**Build page count 71 → 70 — root cause confirmed (2026-07-14)**: `npm run
build`'s summary line dropped from `71/71` (Next 14.2.35) to `70/70` (Next
16.2.10). **No route or content page was lost** — confirmed by instrumenting
both versions' bundled `next/dist/export/index.js` to dump the exact raw path
array each version iterates to produce its "Generating static pages (X/X)"
count (not the printed `Route (app)` table, the actual internal list):

- **Next 14** counts **71** paths, and that raw list explicitly includes
  `/404` and `/500` as two individually-enumerated, separately-counted export
  paths, alongside `/_not-found` (68 shared content/static routes + `/_not-found`
  + `/404` + `/500` = 71).
- **Next 16** counts **70** paths. Its raw list has no `/404` or `/500` entries
  at all — instead it has `/_global-error` (a new App Router global-error-boundary
  route) alongside `/_not-found` (68 + `/_not-found` + `/_global-error` = 70).
  Next 16's `build/index.js` (`moveExportedPage("/_error", "/404", "/404", ...)`
  and the equivalent for `/500`) still writes `pages/404.html` and
  `pages/500.html` to disk — confirmed present in both versions' output — but
  does so as a cheap post-build **copy** from the already-rendered `/_error`
  output rather than running them through the enumerated, individually-counted
  static-generation worker loop that Next 14 used.

Net effect: Next 14 individually counted 3 framework-level fallback routes
(`/_not-found`, `/404`, `/500`); Next 16 counts 2 (`/_not-found`,
`/_global-error`), folding the legacy pages-router-style `/404`/`/500`
generation into an uncounted copy step. That's exactly the -1 delta (71→70),
fully independent of the redirect aliases (`form-field-wrapper`,
`accordion-item`; those are handled entirely by `next.config.js`'s
`redirects()` and were never counted as generated pages in either version).
**70/70 is the correct, current number** and requires no further action.

**Data Table MVP implemented (2026-07-15)**: The narrow scope approved
2026-07-13 in [`data-table-discovery.md`](architecture/data-table-discovery.md)
(sorting only, external Pagination composition) is now built — no columns/rows
prop API; the consumer still writes real `Table`/`TableHead`/`TableBody`
markup and drops in `DataTableSortHeader` for sortable columns.
`useDataTableSort` is a dual controlled/uncontrolled sort-state hook using
`lib/use-controllable.ts` (same pattern as Accordion/Dialog/Drawer/CalendarGrid
range mode) — chosen over a component-prop-only API because it keeps
`DataTableSortHeader` a purely presentational, stateless component (resolved
direction + click handler in, nothing else), pushing all controlled/
uncontrolled complexity into one hook rather than every header cell. Sort
cycle per column: none → ascending → descending → none; activating a
different column always resets it to ascending. `figmaAvailability:
"unavailable"` — no Figma component set exists yet for Data Table. Registry
count moved 39 → 40, Figma-documented count 55 → 56 (new `content/content-data.ts`
entry, required for `/components/data-table` to resolve rather than 404),
indexable slugs 54 → 55.

**npm audit — 2 moderate findings resolved via override (2026-07-15)**: The
PostCSS XSS advisory ([GHSA-qx2v-qp2m-jg93](https://github.com/advisories/GHSA-qx2v-qp2m-jg93))
previously reported twice by `npm audit` (once as a direct finding, once via
`next`'s dependency on it) was vendored inside Next 16.2.10's own nested
`node_modules/next/node_modules/postcss@8.4.31` copy — an upstream Next.js
packaging issue, not a problem with this repo's own dependency choices.
Added a root `"overrides": { "postcss": "^8.5.10" }` in `package.json` and
bumped the direct `postcss` devDependency to the same range (npm's
`assertRootOverrides` check rejects an override whose range doesn't match a
package that's also a direct dependency — this is the standard, documented
resolution, not a workaround). `npm install` then fully deduplicated the
tree: `node_modules/next/node_modules/postcss` no longer exists at all: a
single shared `postcss@8.5.19` resolves everywhere, confirmed by direct
inspection of `node_modules/`, not just trusting the audit output.
**`npm audit` now reports 0 vulnerabilities.** All gates (lint, typecheck,
515 Vitest tests, 131 Playwright tests, 71/71-page Turbopack build)
re-verified clean afterward — the version bump didn't disturb Tailwind's
PostCSS pipeline.

## Recently shipped

**Verified from code / documented architecture** — see [`calendar-foundation.md`](architecture/calendar-foundation.md)

- **Calendar Grid month/year drill-up subviews** (2026-07-12) — three internal drill levels (day/month/year) with dedicated `CalendarMonthCell`/`CalendarYearCell` components, focus restoration on drill transitions, and range enforcement via `isMonthFullyDisabled`/`isYearFullyDisabled`
- **Calendar Grid date-range selection** (2026-07-12) — opt-in `mode="range"` with `rangeValue`/`defaultRangeValue`/`onRangeValueChange`, live keyboard+hover provisional preview, chronological auto-swap on a backwards second click, and disabled-dates-in-the-middle handling
- **Data Table MVP** (2026-07-15) — the narrow scope approved 2026-07-13 (sorting only + external Pagination) is now implemented at `/components/data-table`: `DataTableSortHeader` composes `TableHead` with a real button, `aria-sort`, and a direction indicator; `useDataTableSort` is a dual controlled/uncontrolled sort-state hook (`lib/use-controllable.ts` pattern) with a none → ascending → descending → none cycle per column. No `columns`/`rows` prop API — the consumer still writes real `Table`/`TableHead`/`TableBody` markup. Row selection, sticky headers, density, and virtualization remain deferred; see [`data-table-discovery.md`](architecture/data-table-discovery.md)
- **Layer 3 (Shape) radius-token rebinding — 5 of 8 flagged components fixed in Figma (2026-07-17)**: a prior radius-token sweep flagged 8 components whose Figma-side radius binding pointed at the wrong token layer. Confirmed via direct Figma inspection (61 variants checked, zero inconsistencies), Figma-side only — no React code, test, or component-registry changes required, since these components' `tokensUsed` entries already named the correct semantic token:
  - **Actions/Link** (all 42 variants) — rebound from `radius/xs` (Primitive, 2px) to `component/radius/control` (Shape-aware). Real visual change: now renders 4px in Rounded mode, matching Button's control-scale.
  - **Forms/File Upload** (all 5 variants) — rebound from `radius/lg` to `component/radius/container`. No visual change (12px both ways); now properly Shape-aware.
  - **Feedback/Alert** (all 4 variants) and **Feedback/Toast** (all 4 variants) — same fix, same reasoning, no visual change.
  - **Feedback/Skeleton** — handled per sub-shape: Text rebound to `component/radius/control` (no visual change); Rectangle rebound to `component/radius/container` (4px → 12px, deliberate — matches container scale for a large placeholder block); Circle deliberately left at `radius/full` (fixed-circular exception, matching Badge/Avatar/Calendar Day — rebinding would visibly break it into a non-circular shape outside Pill mode).
  - **Not gaps, confirmed intentional exceptions**: Badge, Avatar, and Calendar Day remain fixed-circular at `radius/full` — the remaining 3 of the original 8 flagged components. No further action needed on those.

## Major parity gaps

**Verified from code / documented architecture**

- Figma MCP verification for File Upload's temporary tokens (component-set node, variants, and File Name property confirmed 2026-07-15 — see below)
- Figma MCP verification for Data Table — no component set exists yet; not blocking (React-first, same precedent as Table)
- File Upload progress UI, preview thumbnails, controlled files, and retry semantics
- Calendar Grid composed range-picker input (two independently-typable start/end text fields + shared calendar, analogous to Date Picker) — judged non-trivial in scope (comparable to rebuilding Date Picker), not built; see [`calendar-foundation.md`](architecture/calendar-foundation.md#composed-range-picker-input--explicitly-out-of-scope)
- Tree View, Charts, Timeline
- Advanced overlay patterns beyond current Dialog/Drawer/Popover/Menu stack
- Full Style System (Shape/Surface) parity across all components — **Shape/radius partially resolved 2026-07-17**: Link, File Upload, Alert, Toast, and Skeleton confirmed rebound to the correct Shape-aware `component/radius/*` tokens (see Recently shipped); Badge, Avatar, and Calendar Day confirmed as intentional fixed-circular exceptions, not gaps. Surface parity is still fully open and untouched by this pass

## Active roadmap

1. **File Upload token verification** — diff the Filled/Empty/Dragging/Error/Disabled variants' token bindings against `file-upload.module.css`'s Temporary aliases now that the component set (`2024:2649`) and both single-file and multi-file anatomy are confirmed
2. **Data Table Figma parity** — MCP audit for a component-set node once available; not blocking (see [`data-table-discovery.md`](architecture/data-table-discovery.md))
3. **Combobox selected-option token gap** (low priority) — `semantic/surface/subtle` (used by `--combobox-option-selected-surface`) has no Figma variable; either add the missing variable or rename the CSS token to an existing one — a separate, deliberate decision, not urgent (see [`combobox-parity.md`](architecture/combobox-parity.md#selected-surface-token-gap))
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
