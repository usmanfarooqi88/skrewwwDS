# Skrewww — Figma practices instructions

Durable Figma working practices for this project.

For current **React** implementation status, read [`docs/project-status.md`](docs/project-status.md).
**Do not copy the React registry inventory into this Figma-practices file.**

Last instruction sync: 2026-07-13

---

## Durable practices

- Inspect the actual Figma file before inventing component properties or visual states.
- Do not modify the Figma file during implementation passes unless explicitly requested.
- Distinguish confirmed Figma behavior, React-only extensions, temporary implementation, and deferred scope.
- Record node IDs when MCP inspection succeeds.
- Use existing variable collections and naming before creating parallel token names.
- Component sets and variants must map to documented registry entries — not ad hoc canvas examples.
- Prefer a **single file** with **category-based pages** over fragmented library files.
- Use real Figma variants and component properties — do not fake variants with disconnected frames.
- Keep Auto Layout discipline; avoid absolute positioning for ordinary component anatomy.
- Bind fills, strokes, and typography to variables where the system expects tokens.
- Follow established file hygiene: clear page purpose, no orphan exploration as “shipped” components.
- Apply plugin API lessons carefully; do not assume Plugin API capabilities match MCP read results.
- Icon construction uses Phosphor; bind iconography through the system’s documented approach.
- Grid and spacing guidance belongs on foundation pages; components should consume those tokens.

---

## Confirmed Figma page structure (conservative)

**Source:** user-provided screenshot of the Figma file page list (2026-07-13).  
**MCP:** unavailable — this section confirms **page existence only**, not page completeness or component-set contents.

### Orientation

- Cover
- Guide / Getting Started
- Changelog

### Foundations

- Colors
- Typography
- Spacing & Grid
- Shape
- Surface
- Elevation
- Motion
- Iconography (Phosphor)
- Accessibility
- Logo

### Component category pages

- Actions
- Forms
- Navigation
- Feedback
- Containers & Overlays
- Content & Data

### Important limits

- Page existence is confirmed.
- The screenshot does **not** verify the detailed contents of every page.
- Do **not** call category pages complete merely because they exist.
- Figma MCP is currently **unavailable**.
- Current component-set counts, standalone-component counts, variables, modes, and token bindings remain **verification pending**.

---

## Current Figma verification status

**Status: MCP verification required** (last attempt: 2026-07-13 — connection / tool discovery failed)

| Topic | Status |
|-------|--------|
| File URL | `https://www.figma.com/design/U6KUuNf7DF4CP9QBOkLSUx/Skrewww---Design-System` |
| Starting node (brief) | `2002:2365` |
| Page list (names only) | Confirmed from screenshot — see above |
| Combobox component-set node | Unresolved |
| File Upload component-set node | Unresolved |
| Table component-set node | Unresolved |
| Variable collection count | Unresolved |
| Variable count per collection | Unresolved |
| Component-set / standalone totals | Unresolved |
| Modes / token bindings | Unresolved |

When MCP succeeds, update this section with exact node IDs and a verification date. Until then, do not cite historical counts as current.

---

## Historical snapshot (do not treat as current)

Earlier project notes (pre-synchronization) claimed figures such as:

- ~119 variables across four collections
- only six pages built
- remaining / most component pages empty
- no documentation site exists

Those claims are **obsolete historical context**. They must not be restated as the live Figma or product state.

---

## Domain and documentation site

- **`skrewww.com`** — reserved intended brand domain; not assumed live
- **`skrewww.dev`** — code fallback when `NEXT_PUBLIC_SITE_URL` is unset in production
- **`NEXT_PUBLIC_SITE_URL`** — deployment authority for React canonical URLs in metadata, sitemap, JSON-LD, and registry
- **Local development** — typically `http://localhost:3000`

The React/Next.js documentation repository is **built**. Live production deployment and the final canonical domain must **not** be inferred from the Figma file.

Do not state that no documentation site exists.

---

## React-first components and Figma maturity

React implementations may exist before corresponding Figma component sets are MCP-verified. In that case:

- Mark Figma parity **pending**
- Keep component-set node IDs **null** until inspected
- Do not invent variants, properties, or token bindings

Known React-first / pending-parity examples (details in `docs/project-status.md` and architecture docs):

- Calendar Day, Calendar Grid, Date Picker, Menu, Combobox — React implemented; Figma maturity MCP-pending
- File Upload — React Beta implemented; Figma verification pending
- Table — React-first native HTML foundation; Figma verification pending
- Data Table (named "Data Grid" during discovery; canonical name finalized as "Data Table" on 2026-07-13) — **implemented** (2026-07-15) at the approved narrow MVP scope (sorting only via DataTableSortHeader + useDataTableSort, external Pagination composition); must compose Table; Figma verification pending — no Figma component set exists yet for Data Table

---

## Related docs

- [`docs/architecture/source-of-truth.md`](docs/architecture/source-of-truth.md)
- [`docs/project-status.md`](docs/project-status.md)
- [`docs/architecture/table-foundation.md`](docs/architecture/table-foundation.md)
- [`docs/architecture/data-table-discovery.md`](docs/architecture/data-table-discovery.md)
- [`docs/architecture/file-upload-discovery.md`](docs/architecture/file-upload-discovery.md)
- [`docs/architecture/combobox-parity.md`](docs/architecture/combobox-parity.md)
- [`skrewww-component-build-rules.md`](skrewww-component-build-rules.md)
