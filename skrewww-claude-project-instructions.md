# Skrewww — Claude project instructions

Durable guidance for AI agents working in this repository.

**Do not treat this file as a live status dashboard.**

For the latest React component inventory, test results, implementation
status, and active roadmap, read [`docs/project-status.md`](docs/project-status.md)
before making recommendations.

Last instruction sync: 2026-07-25

---

## Purpose

Skrewww is an AI-first design system with:

- A **Next.js documentation repository** (already implemented)
- Token-driven **React Beta** components
- Figma-derived component documentation

The **canonical React registry** is authoritative for React implementation status.
Figma is authoritative only for content successfully inspected via Figma MCP.

---

## Four-layer architecture

1. **Foundation** — tokens, color, type, spacing, radius, elevation, motion, icons, accessibility
2. **Component Library** — Actions, Forms, Navigation, Feedback, Containers & Overlays, Content & Data
3. **Style Systems** — Shape and Surface personalities through CSS custom properties
4. **Industry Systems** — Banking pilot shipped 2026-07-25 (3 components: Banking Transaction Row, Banking Account Card, Banking Balance Summary; see `docs/project-status.md`'s "Layer 4 pilot" section); additional industries planned via the CLI presets described below in Distribution Model

---

## Distribution Model — decided target architecture (2026-07-25)

**This is a final, decided architecture — not a proposal under evaluation.**
None of the described infrastructure exists yet: there is no `@skrewww/core`
npm package, no `skrewww` CLI, and no publishing pipeline. Do not write or
imply that `@skrewww/core` or `npx skrewww` currently work. Components today
live only in this repository's `components/ui/`.

**"The Hybrid Registry Model"**, recorded exactly:

1. **Centralized Token & Governance Package — `@skrewww/core`** (npm, **Planned**)
   - Scope: Layer 1 (Foundations — `styles/tokens.css`, typography, spacing, elevation, motion) and Layer 3 (Style Systems — Shape/Surface CSS custom properties).
   - Purpose: single-source token governance, prevent design/token drift, lock in the WCAG 2.2 AA baseline.
   - Consumption (once built): `npm install @skrewww/core`.

2. **Copy-Owned Component & Preset CLI — `npx skrewww`** (**Planned**, hosted `/registry.json` as its data source)
   - Scope: Layer 2 (Component Library) and Layer 4 (Industry Systems).
   - Purpose: full source ownership in consumer repos (`components/ui/`), maximum customization, no abstraction wall for AI coding tools (Cursor, Claude Code, etc.) working against the code.
   - Consumption (once built): `npx skrewww add <component>` / `npx skrewww init <industry-preset>`.

3. **Monorepo/docs-site operational role** — the docs site (`app/`) is the canonical source and builder: it imports components **directly** from `components/ui/` for its own live previews, not via the future CLI. It generates and serves `/registry.json` at runtime as the feed for external CLI consumption. **The docs site does not dogfood its own CLI.**

4. **SemVer policy for `@skrewww/core`** (real, decided, not deferred): renaming or deleting a token custom property in `styles/tokens.css` requires a **major** version bump in `@skrewww/core`. A `coreVersion` field on registry entries (`ComponentRegistryEntry.coreVersion`, optional) will track each component's minimum required token version once the package exists — currently unpopulated everywhere, since there is no real version to record yet.

### Future-proofing principles (durable rules)

- **Strict Layer Boundary**: components must import foundations exclusively from `@skrewww/core` (or local token aliases linked to it) — no hardcoded color/spacing overrides inside components. This is not a hypothetical concern: the Layer 3 Surface audit already caught exactly this bug class in Figma — Accordion Item and Empty State both had a raw hardcoded white fill, not even bound to a semantic token (see `docs/project-status.md`'s Layer 3 Surface audit section). This rule future-proofs the *code* side against a repeat of that same failure once components are copy-distributed outside this repo, where there's no central audit pass to catch it after the fact.
- **Layer 4 Scaffolding**: industry systems ship as CLI presets composing existing Layer 2 components — never forked/duplicated copies. This is consistent with, not new relative to, the already-documented Layer 4 principle (see the homepage's Industry Systems description in `app/page.tsx`: "inheriting from the core, never forking it").

---

## Token and composition principles

- Primitive → Semantic → Component token layers live in `styles/tokens.css`.
- Prefer semantic aliases over raw primitives in components.
- Mark temporary tokens explicitly; do not rename temporary tokens to imply Figma verification.
- Internal composition under `components/ui/internal/` is not public API.
- FormField owns label, description, required indication, and validation placement.

---

## Accessibility rules

- Target WCAG 2.2 AA.
- Prefer native semantics; use custom controls only when native HTML cannot represent the confirmed interaction model.
- Do not add `role="dialog"` to Popover shells used as neutral positioning surfaces.
- Combobox: DOM focus stays in the input; use `aria-activedescendant` for active options.
- Ordinary tabular UI uses native `<table>` semantics — not `role="grid"`.

---

## Figma / code parity rules

- Figma MCP is authoritative when it succeeds.
- When MCP fails, record unresolved facts — do not guess counts, node IDs, or variables.
- React implementation does **not** imply Figma parity is complete.
- Several React-first Beta components ship with **Figma parity pending**.
- Document parity gaps in `docs/architecture/*-parity.md` or discovery docs where applicable.
- Historical Figma totals (variable counts, component-set counts, empty-page claims) are **not current** unless re-verified by MCP with a dated source.

---

## Layer 2 — completed React foundations

These are implemented in React (Beta). Verify in the registry before claiming elsewhere:

- Calendar Day
- Calendar Grid
- Date Picker
- Menu
- Combobox
- File Upload
- Table
- Data Table
- Tree View
- Bar Chart
- Line Chart
- Timeline
- Core form controls, Select, Search Field, overlays (Dialog, Drawer, Popover), and other registry entries marked `hasImplementation: true`

### Table

- React-first **native HTML** foundation (`/components/table`)
- Uses native table semantics (`<table>`, `<caption>`, `<th>`, `<td>`, …)
- Does **not** use `role="grid"`
- Does not own sorting, selection, pagination, or spreadsheet keyboard navigation
- Figma parity **pending**

### Data Table

- **Implemented** (2026-07-15) — the narrow MVP scope **approved** 2026-07-13 (sorting only + external Pagination composition) is now built at `/components/data-table`
- Architecture gate: **implemented-react-first** (`docs/architecture/data-table-discovery.md`)
- Must **compose Table** — no forked markup, no `columns`/`rows` prop API; the consumer writes real `Table`/`TableHead`/`TableBody` markup and drops in `DataTableSortHeader` for sortable columns
- `useDataTableSort` is the dual controlled/uncontrolled sort-state hook (same `lib/use-controllable.ts` pattern as Accordion/Dialog/Drawer/CalendarGrid range mode); sort cycle per column is none → ascending → descending → none
- Canonical name **Data Table** (not "Data Grid" — scope deliberately excludes `role="grid"`, cell editing, and spreadsheet-style arrow-key cell navigation) and slug `data-table` are decided, final
- Figma parity **pending** — no Figma component set exists yet for Data Table
- Row selection, sticky headers, density variants, and virtualization remain **deferred** — not part of this MVP

Do **not** treat Table and Data Table as interchangeable.

### Tree View

- **Implemented** (2026-07-18) — built directly against a real, well-documented Figma reference: the Content/Tree Item component set (Label, Show chevron, State: Default/Hover/Selected) + the "Tree View (example)" composed demo. Figma node IDs confirmed 2026-07-18 (see `lib/tree-view-figma-metadata.ts` and `docs/project-status.md`'s Figma status section).
- Renders a flat, depth-first list of rows (`role="tree"`/`role="treeitem"`) — not nested DOM groups. `aria-level`/`aria-setsize`/`aria-posinset` are set explicitly per row.
- Indentation is `depth * 20px` computed per row, never a fixed set of per-depth variants — matches Figma's own composed example and its explicit "don't hardcode indentation" guidance.
- `expanded` and `selected` are each independently controlled/uncontrolled via `lib/use-controllable.ts` (same pattern as Accordion/Dialog/Drawer/CalendarGrid/Data Table).
- Single-select only. Multi-select, drag-and-drop reordering, virtualization, and async/lazy-loaded children are **deferred** — none are shown in the Figma reference.

Do **not** treat the pre-existing `tree-item` documentation-only content slug (Figma-facing prose, no registry entry) as the implemented component — Tree View (`components/ui/TreeView.tsx`) is the canonical, implemented pattern; Tree Item is an internal row it composes.

### Bar Chart / Line Chart

- **Implemented** (2026-07-18) — built on **recharts** (added as a dependency) against Figma's "Content/Charts" section. Figma node IDs confirmed 2026-07-18 (see `lib/charts-figma-metadata.ts` and `docs/project-status.md`'s Figma status section).
- Two separate components, matching Figma's own separation into two distinct examples — not one polymorphic `Chart` component.
- Both take identical single-series data (`{ label: string; value: number }[]`) plus a required `label` prop (the chart's accessible name).
- Uses recharts's `ResponsiveContainer` — fluid width (genuinely fills the parent), fixed pixel height (default 240). An earlier draft used fixed pixel width/height, justified partly by a jsdom/ResizeObserver test limitation; corrected 2026-07-18 by adding a `ResizeObserver` polyfill to `vitest.setup.ts` instead of constraining real-world sizing.
- Line Chart's curve type is `"linear"` (straight segments) — confirmed 2026-07-18 by reading the actual Figma vector path data via the Figma Plugin API (every segment is a straight `L` lineto command). An earlier draft used `"monotone"` (a smoothed curve) as an unverified default.
- Color reuses the existing `semantic/action/primary` token — no new semantic token invented.
- Accessibility: each chart's SVG is `aria-hidden`, wrapped in a `role="img"` container with `aria-label` + `aria-describedby` pointing at a visually-hidden (`sr-only`) data table with the same label/value pairs.
- Multi-series support, interactivity (hover tooltips, legend interactivity), and axes/gridlines beyond Bar Chart's existing month labels are **deferred** — none are shown in the Figma reference.

### Timeline

- **Implemented** (2026-07-19) — the third and last of the Layer 2 code-side gaps; closes out Layer 2 entirely. Built against Figma-facing prose already in `content/content-data.ts` (State: Default outlined ring / Highlighted larger solid dot; Title/Timestamp/Description fields) plus directly confirmed behavioral facts. **Figma node IDs confirmed 2026-07-24**: "Content/Timeline Item" component set is node `2058:2092`, the "Timeline (example)" composed demo is node `2058:2102`, parent section "Content/Timeline" is node `2058:2130` — see `lib/timeline-figma-metadata.ts` (`TIMELINE_FIGMA_AUDIT_STATUS = "verified-2026-07-24"`).
- Connector-line suppression between events is purely positional — only the last item omits it, entirely independent of `state`. A Default item can be last (and must suppress its connector); a Highlighted item can be in the middle (and must keep its connector).
- The connector's length is computed via CSS (`flex: 1` inside a grid row stretched to the taller of its two columns), not a fixed pixel value, so it reaches the next item's marker regardless of description length.
- An empty `data` array renders nothing — no established empty-state convention exists anywhere in this codebase (checked Table, Tree View, Bar Chart, Line Chart).
- No truncation on Title, Timestamp, or Description — Alert and Card don't truncate their titles either, and Figma's own reference shows the Description wrapping, not truncating, at 220px. List Item does truncate, but its single-line row density isn't comparable to Timeline's larger content blocks.

---

## Layer 2 — current major React gaps

All three Layer 2 code-side gaps (Tree View, Charts, Timeline) are now implemented. None remain.

Do **not** list Calendar as a current React implementation gap.

Additional work (not missing foundations):

- File Upload Figma parity (React Beta already shipped)
- Table Figma parity (React-first foundation + usability audit shipped)
- Multi-select Combobox
- Temporary-token Figma verification
- Broader Style System rollout

---

## Documentation site and domains

- The **Next.js documentation repository is already implemented** in this project.
- Machine-readable registry, sitemap, LLM files (`llms.txt` / `llms-full.txt`), JSON-LD, and component pages exist.
- Public deployment and the final canonical domain remain **deployment concerns**.
- `skrewww.com` being **reserved** does not mean it is currently live.
- `NEXT_PUBLIC_SITE_URL` controls the deployed React canonical origin.
- `skrewww.dev` is the code fallback when that env var is unset in production.

Do not claim that the documentation website is still a future phase.

---

## Hard constraints

- Do not invent Figma properties, variants, or tokens without MCP confirmation.
- Do not export internal utilities as registry components.
- Do not run Playwright build against `.next` — use `.next-playwright`.
- Do not kill unrelated processes or ports in automation.
- Required quality gates before claiming a component pass complete: lint, typecheck, Vitest, Playwright, production build.
- One dev server per `.next` directory; use `npm run dev:clean` when vendor chunks corrupt.
- Do not place frequently changing test counts or React component totals in this file — use [`docs/project-status.md`](docs/project-status.md).

---

## Current status

See [`docs/project-status.md`](docs/project-status.md) and `/registry.json`.
