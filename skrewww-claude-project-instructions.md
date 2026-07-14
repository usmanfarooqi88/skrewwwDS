# Skrewww — Claude project instructions

Durable guidance for AI agents working in this repository.

**Do not treat this file as a live status dashboard.**

For the latest React component inventory, test results, implementation
status, and active roadmap, read [`docs/project-status.md`](docs/project-status.md)
before making recommendations.

Last instruction sync: 2026-07-13

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
4. **Industry Systems** — planned

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

---

## Layer 2 — current major React gaps

- Tree View
- Charts
- Timeline

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
