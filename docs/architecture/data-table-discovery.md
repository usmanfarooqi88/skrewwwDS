# Data Table — discovery and implementation gate

Last updated: **2026-07-15** (approved MVP implemented — see **Implementation status** below)

> **Implementation status (2026-07-15): DONE.** The approved narrow MVP scope below is now built: `DataTableSortHeader` (a sortable column-header building block composing `TableHead`) and `useDataTableSort` (a dual controlled/uncontrolled sort-state hook using `lib/use-controllable.ts`, same pattern as Accordion/Dialog/Drawer/CalendarGrid range mode). Data Table has no `columns`/`rows` prop API — the consumer still writes real `Table`/`TableHead`/`TableBody` markup and drops `DataTableSortHeader` in for sortable columns. Sort cycle per column: none → ascending → descending → none. Registered at `/components/data-table`. **Figma (2026-08-31):** `DataTableSortHeader` maps to Content/Data Table Column Header `2805:859`; `figmaAvailability: "partial"` because there is still no Content/Data Table master — customer examples are composition-only on presentation frame `2491:932`. Everything below this note is the original discovery/decision record and is left as written — see docs/project-status.md for current registry/test counts.

> Historical naming note: this document and its gate were tracked under the working name **"Data Grid"** from initial discovery through the 2026-07-13 Table audit. The canonical name was finalized as **"Data Table"** on 2026-07-13. File renamed from `data-grid-discovery.md` accordingly. Sections below that describe past discovery/audit state keep the "Data Grid" name where that is what was actually written or decided at the time — see the **Final decision** section for what changed and when.

## Final decision

**APPROVED — narrow MVP scope** (Data Table) — **2026-07-13**

Result: **C. DATA TABLE MVP APPROVED — narrow scope, not yet implemented**

Naming, canonical slug, MVP interactive pillar, and pagination approach are now decided (final, not provisional):

- **Canonical name:** Data Table (deliberately not "Data Grid" — the scope explicitly excludes `role="grid"`, cell editing, and spreadsheet-style arrow-key cell navigation; "Table" correctly signals it composes the existing Table foundation rather than reimplementing grid semantics)
- **Canonical slug:** `data-table`
- **MVP interactive pillar:** sorting only (header sort control + `aria-sort`). Row selection is explicitly deferred to a later pass, not included in v1.
- **Pagination:** external composition with the existing `Pagination` component — no embedded/compound pagination API in Data Table itself.
- Everything else already listed below as excluded (no cell editing, no virtualization, no sticky headers, no density variants, no `role="grid"`) remains excluded for v1.

This decision was made as a **product/scope decision, independent of Figma evidence** — the same React-first precedent Table itself used. Figma MCP still has not authenticated or read the design file (see **1. Figma MCP result** below); that remains a separate, non-blocking parity gap for a later pass, not a blocker for this scope decision.

**Implementation has not started.** This pass records the approved decision only — building Data Table is a deliberate, separate next pass (see **25. Next steps**).

### Related decision — TABLE FOUNDATION APPROVED — REACT-FIRST (2026-07-13)

A separate **Table** foundation proceeded without Figma confirmation because native HTML table semantics are standardized:

- **Table** is a low-level semantic and visual primitive (`/components/table`) — **implemented**.
- **Data Table** is the higher-level data interaction pattern; its scope is now **approved** (sorting only + external Pagination) but it is **not yet implemented**.
- Table does **not** imply sorting, selection, pagination, spreadsheet keyboard navigation, sticky headers, density, or striped rows.
- Data Table **composes Table** rather than reimplementing native `<table>` structure — confirmed as part of this decision, not just a preference.
- Table uses native HTML semantics — not `role="grid"`. Data Table follows the same rule.
- Table Figma parity remains **pending** until MCP confirms a component set.

See: [`table-foundation.md`](table-foundation.md)

Do not implement Data Table yet. This document records the approved scope; implementation is a separate pass.

Metadata: `lib/data-table-figma-metadata.ts` (`DATA_TABLE_IMPLEMENTATION_GATE = "approved-narrow-mvp"`)

> Historical note: An earlier revision of this file stated that no table-related React component existed. Table foundation was approved and implemented in a subsequent React-first pass. Data Table (named "Data Grid" at the time) then remained gate-blocked through the 2026-07-13 Table audit, until this same-day pass approved its narrow MVP scope and finalized its canonical name.

---

## Renewed gate — what Table now supplies (2026-07-13 audit)

| Capability | Table status |
|------------|--------------|
| Native `<table>` structure | Implemented |
| Caption (visible / screen-reader) | Implemented |
| Column and row headers (`scope` consumer-supplied) | Implemented |
| Multi-level headers via native attrs | Implemented (pass-through) |
| Rows / cells / footer totals | Implemented |
| Cell alignment (logical start/center/end) | Implemented |
| Responsive overflow (`TableScrollArea`) | Implemented |
| Overflow discoverability (Temporary edge fades) | Implemented |
| RTL logical CSS | Implemented |
| Print-friendly overflow | Implemented |
| Interactive cell composition | Documented + previewed |
| Manual empty / loading / error composition | Documented + previewed |
| Tokens + shape/surface container behavior | Implemented (geometry Temporary) |

## What Data Table needed — now resolved by this decision

| Requirement | Status (2026-07-13) |
|-------------|--------|
| Canonical product name + slug | **Resolved** — Data Table / `data-table` |
| Figma/content evidence of anatomy | Still unresolved — approved React-first without it, same precedent as Table |
| Data-driven columns/rows + `getRowId` | Still to be designed in the implementation pass |
| Sorting intent API | **Resolved** — MVP pillar: header sort control + `aria-sort` |
| Selection modes | **Resolved — deferred.** Explicitly excluded from v1, not included in the MVP |
| Loading / empty / error orchestration APIs | Approved as presentation helpers over Table (composition-based), detail left to implementation pass |
| Density / sticky header | **Resolved — excluded from v1** |
| Row-actions conventions beyond cell Menu | Still open, deferred beyond MVP |
| Pagination composition contract | **Resolved** — external `Pagination` composition, no embedded/compound API |
| Controlled state contracts | Still to be designed in the implementation pass |
| Registry + docs + tests under Data Table name | Not started — separate implementation pass |

## Approved implementation brief (2026-07-13)

This is the **approved** scope for the **Data Table MVP** — no longer provisional. Building it is a deliberate, separate next pass; this document does not implement it.

1. Compose `Table` / `TableScrollArea` / caption / headers — do not fork markup.
2. Data-driven `columns` + `rows` + `getRowId`.
3. **Sorting only** — header sort control + `aria-sort`. Row selection (Checkbox column) is explicitly **deferred to a later pass**, not part of v1.
4. Loading / empty / error as Data Table presentation helpers that still render Table underneath.
5. **External `Pagination` composition** — no embedded/compound page API in Data Table itself.
6. No `role="grid"`, no cell editing, no virtualization, no sticky header, no density variants in v1.

---

## 1. Figma MCP result

| Item | Result |
|------|--------|
| Date | 2026-07-13 (foundation + audit passes) |
| Connector attempted | `plugin-figma-figma` / `user-figma-console` |
| Authentication | **Not usable** — servers already in error state at tool discovery |
| Server error | Live tool discovery failed; tools unavailable until connection is fixed |
| File read | **Not performed** |
| Pages inspected | **None** |
| Nodes inspected | **None** |
| Component-set node IDs | **None** |
| Variable collections | **None verified** |

Starting URL from brief: [Skrewww — Design System](https://www.figma.com/design/U6KUuNf7DF4CP9QBOkLSUx/Skrewww---Design-System?node-id=2002-2365) (`2002:2365`)

Per project policy, MCP failure does not invent node IDs, variants, tokens, or dimensions. The naming/scope decision above was made independent of this — Figma parity remains a separate, non-blocking follow-up for the implementation pass.

---

## 2. Repository discovery result

### Search terms

Data Grid, Data Table, Table, Table Header, Table Row, Table Cell, Column Header, Sortable Header, Selectable Row, Row Actions, Pagination, Loading Table, Empty Table, Sticky Header, Density, Zebra rows, Horizontal scroll.

### Findings (post–Table foundation, at time of 2026-07-13 audit)

| Location | Finding |
|----------|---------|
| `content/content-data.ts` | **Table** entry exists (React-first). **No** Data Table entry (at time of this audit) |
| `lib/component-registry*.ts` | **Table** registered. **No** data-table registry entry (at time of this audit) |
| `components/ui/Table.tsx` | Implemented compound foundation |
| `styles/tokens.css` | `--table-*` tokens (aliases + Temporary geometry) |
| `components/ui/Pagination.tsx` | Implemented — suitable for **external** composition |
| `components/ui/EmptyState.tsx` / Spinner / Skeleton / Alert / Checkbox | Available for composition |
| Roadmap / README / project-status | Listed as blocked/unimplemented at time of this audit — **superseded by the Final decision above**; those docs are updated as part of this same pass |

---

## 3. Canonical naming — decided

| Option | Slug candidate | Pros | Cons | Status |
|--------|----------------|------|------|--------|
| **Data Table** | `data-table` | Common industry name for data-driven tables; correctly signals composition over Table rather than a spreadsheet grid | Not previously used in repo or roadmap | **DECIDED (2026-07-13) — canonical name** |
| **Data Grid** | `data-grid` | Matches earlier roadmap language; product term for interactive tabular data | Without a grid interaction model, risks implying ARIA spreadsheet grid (`role="grid"`, cell editing, arrow-key cell navigation) — none of which are in scope | **Rejected** — deliberately not chosen for this reason |
| **Table** | `table` | **Implemented** as native foundation | Must not absorb Data Table's interaction APIs | **Shipped foundation** (unchanged, separate component) |
| Table foundation → Data Table later | `table` then `data-table` | Separates static vs interactive | — | **Current architecture** — this is the path taken |

**Decision (final, not provisional):** public name **Data Table** (`/components/data-table`), composing **Table**. Deliberately not "Data Grid": the scope explicitly excludes `role="grid"`, cell editing, and spreadsheet-style arrow-key cell navigation, so "Table" is the accurate signal, not "Grid".

---

## 4. Semantic architecture

### Key rule

Do **not** use `role="grid"` for Data Table — the name itself was chosen specifically to avoid implying ARIA spreadsheet-grid semantics.

| Pattern | Markup | When |
|---------|--------|------|
| **Native table (Data Table MVP)** | Compose Table primitives | Conventional tabular UI — this is the approved MVP path |
| **ARIA Grid** | `role="grid"` / `gridcell`, roving tabindex or `aria-activedescendant` | Spreadsheet-like composite widget — explicitly **out of scope** |

**Calendar Grid** already uses `role="grid"` for date cells — unrelated to tabular Data Table.

---

## 5. Native Table versus ARIA Grid decision

| Question | Evidence | Decision |
|----------|----------|----------|
| Cell-level arrow navigation? | None | **Not MVP** |
| Managed cell focus / roving tabindex? | None | **Not MVP** |
| Spreadsheet editing? | Explicit non-goal | Deferred |
| Conventional headers + rows + sort? | Product decision (2026-07-13) | **Approved MVP pillar: sorting only** |

**Decision:** Data Table MVP, now approved, **composes Table** (native HTML semantics). True ARIA Data Grid remains **out of scope** — not part of this or any currently-planned pass.

---

## 6–9. Confirmed Figma variants, properties, states, anatomy

**Still none MCP-verified.** This gate approved scope and naming as a **product decision independent of Figma evidence** (same precedent as Table foundation) — visual/Figma anatomy confirmation remains a separate, non-blocking follow-up.

| Topic | Status |
|-------|--------|
| Variants (density, striped, sticky, selection) | **Excluded from v1** (density/sticky/striped) or **deferred** (selection) — decided, not blocking |
| Properties (columns, sort, selection mode) | Sort: **approved for v1**. Selection: **deferred**. Columns/rows: to be designed in implementation pass |
| States (loading, empty, error, hover row) | Approved as composition-based presentation helpers over Table |
| Anatomy | Composes Table's shipped anatomy; Data Table-specific chrome (sort control) designed in implementation pass |

---

## 10–21. Data Table behaviors — approved scope

Prior sections' proposals for a data-driven API, sort intent, external Pagination, keyboard model, responsive overflow, and accessibility are now **approved** for the narrow MVP, per the **Final decision** and **Approved implementation brief** above. Row selection, density, sticky headers, virtualization, and cell editing remain **not approved** — excluded from v1 or deferred to a later pass.

Approved narrow MVP: compose Table; `columns`/`rows`/`getRowId`; sort intent only (no selection in v1); loading/empty/error presentation; external Pagination; no `role="grid"`.

---

## 22. Open questions

**Resolved by this decision (2026-07-13):**

1. ~~Canonical public name and slug for the interactive pattern?~~ → **Data Table** / `data-table`.
2. ~~Is sorting confirmed?~~ → **Yes, single-column, as the MVP interactive pillar.**
3. ~~Is row selection confirmed?~~ → **Deferred to a later pass — not in v1.**
4. ~~Density / striped / sticky header properties?~~ → **Excluded from v1.**
5. ~~Is a read-only Table enough, or must interactive features ship as Data Table?~~ → **Interactive (sorting) ships as Data Table MVP; read-only Table remains available on its own.**
6. ~~Should loading/empty/error become Data Table APIs or stay composition-only?~~ → **Composition-based presentation helpers over Table.**

**Still open for the implementation pass:**

1. Does Figma contain **Table**, **Data Table**, or a **Data Grid**-style component? (Figma MCP still unavailable — not blocking for React-first MVP)
2. Component-set node ID(s), if/when Figma MCP is restored
3. Row actions column conventions beyond cell Menu
4. Token bindings for sort indicators (no selected-row tokens needed yet — selection is deferred)
5. Exact controlled-state contract (`columns`/`rows`/`getRowId`/sort state shape)

---

## 23. Parity table

| Area | Figma evidence | Repository evidence | Approved React behavior | Status |
|------|----------------|---------------------|-------------------------|--------|
| Canonical name | None | Table shipped; Data Table now decided | Data Table composes Table | **Resolved (2026-07-13)** |
| Table foundation | None | `/components/table` implemented | Presentational native table | **Shipped** |
| Native `<table>` | None | Table primitives | Required for Data Table MVP | Confirmed (policy) |
| ARIA `role="grid"` | None | Calendar Grid only (dates) | Out of scope for Data Table | Excluded |
| Sort | None | Unsupported on Table | Header sort control + `aria-sort` | **Approved MVP pillar** |
| Selection | None | Unsupported on Table | Not in v1 | **Deferred** |
| Pagination | None | Pagination component exists | External composition | **Approved (system)** |
| Empty / loading / error | None | Composition docs on Table | Data Table presentation helpers over Table | Approved (composition-based) |
| Registry / React Data Table | None | Not implemented | Build in a separate, deliberate pass | **Approved, not yet implemented** |

---

## 24. Implementation gate checklist

**APPROVE DATA TABLE REACT-FIRST MVP** — checklist result as of 2026-07-13:

- [x] Canonical name + slug confirmed — **Data Table** / `data-table`
- [x] Explicit React-first approval recorded (no Figma component-set node ID; same precedent as Table)
- [x] Confirmed that Data Table composes Table (no markup fork)
- [x] At least one interactive purpose beyond Table: **sorting**
- [x] Native table vs ARIA grid choice recorded: **native / compose Table**
- [x] Deferred list agreed: **no cell edit, no cell arrow nav, no selection in v1, no sticky/density/virtualization in v1**
- [x] Pagination approach recorded: **external Pagination composition**
- [ ] Column header + data row interaction anatomy — designed in the implementation pass, not this one

**Current status:** scope and naming decided → **APPROVED — narrow MVP scope** (result **C**). Implementation itself is a **separate, deliberate next pass**.

---

## 25. Next steps

1. **Implement the approved Data Table MVP** in a separate, deliberate pass: compose Table, `columns`/`rows`/`getRowId`, header sort control + `aria-sort`, external Pagination composition, no `role="grid"`.
2. Add a Data Table content/registry entry as part of that implementation pass (not this one).
3. Restore Figma MCP when possible and audit Data Table for parity — non-blocking follow-up, not a gate for the MVP above.
4. Do **not** start Tree View, Timeline, Charts, or ARIA spreadsheet grid in parallel.

**Recommended next development batch:** implement the approved **Data Table MVP** (sorting only + external Pagination, composing Table) as its own deliberate pass.
