# Table foundation

Last updated: **2026-07-13** (usability / a11y / composition audit)

## Implementation status

**TABLE FOUNDATION APPROVED — REACT-FIRST**

- Public component: **Table** (`/components/table`)
- Category: Content & Data
- Origin: React-first (HTML semantics)
- Figma verification: **Pending** (`TABLE_FIGMA_COMPONENT_SET_NODE_ID = null`)
- Figma MCP (audit pass): **Failed** — servers unavailable at tool discovery; no invented node IDs
- Data Table (named "Data Grid" during discovery; canonical name finalized as "Data Table" on 2026-07-13): **approved for narrow MVP scope** (sorting only + external Pagination) — not yet implemented, a deliberate separate pass — see [`data-table-discovery.md`](data-table-discovery.md)

Metadata: `lib/table-figma-metadata.ts`

---

## 1. Purpose

Table provides native HTML tabular structure and restrained token-driven presentation. Consumers compose captions, headers, rows, cells, and optional overflow. Table does not own data fetching, sorting, selection, pagination, editing, or business logic.

## 2. Table versus Data Table

| | Table | Data Table (approved scope, not yet implemented) |
|--|-------|---------------------|
| Role | Semantic + visual foundation | Higher-level interaction pattern |
| Markup | Native `<table>` | Composes Table (confirmed) |
| Sorting / selection | Unsupported | Sorting approved for MVP; selection deferred to a later pass |
| Keyboard | Native table + descendant controls | No `role="grid"` — deliberately excluded from scope |
| Status | React Beta | Approved (narrow MVP scope) — implementation not started |

## 3. Native semantic model

Render matching native elements only:

| Component | Element |
|-----------|---------|
| Table | `<table>` |
| TableCaption | `<caption>` |
| TableHeader | `<thead>` |
| TableBody | `<tbody>` |
| TableFooter | `<tfoot>` |
| TableRow | `<tr>` |
| TableHead | `<th>` |
| TableCell | `<td>` |
| TableScrollArea | `<div>` |

Do **not** add redundant `role="table"`, `row`, `columnheader`, `cell`, `grid`, or `gridcell`.

## 4. Valid nesting

Documented composition (browser-valid):

```tsx
<TableScrollArea>                 {/* optional wrapper */}
  <Table>
    <TableCaption />              {/* direct child of table */}
    <TableHeader>                 {/* thead */}
      <TableRow>                  {/* tr */}
        <TableHead scope="col" />
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow>
        <TableHead scope="row" />
        <TableCell />
      </TableRow>
    </TableBody>
    <TableFooter>
      <TableRow>
        <TableHead scope="row" />
        <TableCell />
      </TableRow>
    </TableFooter>
  </Table>
</TableScrollArea>
```

Rules:

- `TableCaption` must be a direct child of `Table`.
- `TableRow` belongs inside `TableHeader`, `TableBody`, or `TableFooter`.
- `TableHead` / `TableCell` belong inside `TableRow`.
- Table does not runtime-enforce every invalid consumer composition.
- Invalid nesting can cause browser DOM repair and React hydration mismatches — follow the documented structure.

## 5. Public compound API

Only **Table** is a registry page. Subcomponents are public exports without separate routes or counts.

There is no context provider and no runtime coupling between subcomponents. Native props remain on each element for TypeScript autocomplete.

## 6. Caption behavior

- Default `visibility="visible"`.
- `visibility="screen-reader"` visually hides the caption without removing it from accessibility APIs.
- Caption stays inside the table — do not replace it with `aria-label` by default.
- No `visibility="hidden"`.
- Captions describe the table’s purpose; avoid repeating a nearby page H1 word-for-word.

### Captions versus scroll-region labels

| Element | Purpose |
|---------|---------|
| `TableCaption` | Accessible **name of the table** |
| `TableScrollArea` `accessibleLabel` / `aria-label` | Names the **overflow region** when `role="region"` is used |

Prefer distinct wording (for example caption `"Active projects"` and region `"Scrollable projects table"`). Do not give the region and table identical names — that produces redundant announcements.

## 7. Column-header behavior

- Use `TableHead` with consumer-supplied `scope="col"` in header rows.
- Do not infer scope from position — multi-level headers may legitimately use `scope="colgroup"` or other values.
- Alignment via `align` prop (`start` | `center` | `end`) — not deprecated HTML `align`.
- Action columns that look empty must still expose screen-reader text (for example `<span className="sr-only">Actions</span>`).

## 8. Row-header behavior

- Use `TableHead` with `scope="row"` for primary row labels in body/footer rows.
- Do not auto-promote the first cell to a row header.
- Prefer row headers over plain `<td>` for the identifying column.

## 9. Multi-level header support

Native attributes pass through on heads and cells:

- `colSpan`, `rowSpan`, `headers`, `id`, `scope`, `abbr`, `aria-describedby`

Table does **not** provide a column-definition system. Complex associations remain HTML authoring.

## 10. Cell alignment

- Default `align="start"` (logical start).
- Numeric values may use `align="end"` deliberately — no automatic inference.
- CSS uses `text-align: start | center | end` for RTL-safe behavior.

## 11. Long-content behavior

| Policy | Behavior |
|--------|----------|
| Default cells | Wrap naturally (`overflow-wrap: anywhere`) |
| Optional nowrap | Set `data-table-wrap="nowrap"` on a cell/head (useful for action columns) |
| Truncation | Not default — hidden text can become inaccessible |
| Page overflow | Prevented by `TableScrollArea`, not by ellipsis |

If a consumer truncates content, the full value must remain available without relying on Tooltip alone (especially on touch).

## 12. Responsive overflow (`TableScrollArea`)

- `TableScrollArea` uses `width: 100%`, `max-width: 100%`, and `min-width: 0` so flex/grid parents can shrink it; the previous `width: 0; min-width: 100%` pattern collapsed in some RTL/grid samples and leaked page overflow.
- Owns `overflow-x: auto` so the page does not scroll horizontally.
- Does not become `role="table"`.
- When `accessibleLabel` / `aria-label` / `aria-labelledby` is present, uses `role="region"`.
- Unlabelled scroll wrappers do **not** become landmarks.

### Focus policy (deliberate)

**`tabIndex` remains consumer-controlled.** Table does not measure overflow or auto-inject `tabIndex={0}` (avoids unnecessary focus stops and hydration complexity).

| Situation | Recommendation |
|-----------|----------------|
| Table fits the viewport | Omit `tabIndex` and usually omit region labelling |
| Known horizontally scrollable application table | Set `tabIndex={0}` and a distinct `accessibleLabel` |
| Keyboard scrolling | Focus the region, then use arrow keys / trackpad / shift+wheel as the browser allows |

### Overflow discoverability

CSS edge fades use Temporary `--table-scroll-shadow` / `--table-scroll-fade-size` with logical gradients so cues reverse in RTL. They indicate more content is scrollable — they do **not** mean columns are removed.

## 13. Keyboard behavior

- No composite keyboard model.
- Tab reaches interactive descendants only.
- Static cells are not focusable.
- Arrow keys are not captured by Table.
- Advanced cell navigation belongs to a hypothetical future ARIA grid pattern (`role="grid"`) — out of scope for both Table and Data Table.

## 14. Interactive content inside cells

Links, buttons, menu triggers, checkboxes, and badges may appear in cells. Do not make `<tr>` clickable. Interactive descendants own their accessible names. Escape closes Menus without Table intercepting keys.

## 15. Empty / loading / error composition

Table has **no** empty, loading, or error props.

```tsx
{/* Empty — colSpan equals visible column count */}
<TableBody>
  <TableRow>
    <TableCell colSpan={3}>
      <EmptyState title="No rows" primaryAction={{ label: "Create", href: "/new" }} />
    </TableCell>
  </TableRow>
</TableBody>

{/* Loading — keep headers; set aria-busy on the table */}
<Table aria-busy="true">...</Table>

{/* Error — Alert before the table, or a full-width row; caption/headers may remain */}
```

Why composition instead of Table props: ownership of fetch/retry/empty messaging belongs to the product surface or Data Table (approved MVP scope, not yet implemented).

## 16. Footer and totals

- `TableFooter` renders native `<tfoot>`.
- Use a row header for the total label and align numeric totals with their columns.
- Footer is not sticky.

## 17. RTL behavior

- Logical alignment and padding (`start` / `end`, `padding-inline`).
- Scroll edge fades use inline-start/end gradients.
- Do not hard-code left/right for Table layout.

## 18. Print behavior

In `@media print`, `TableScrollArea` sets `overflow: visible`, removes clipping fades, and drops min-width constraints so columns are not clipped. Perfect multi-page thead repetition is **not** promised across browsers. Consumers may hide action columns in print with their own styles.

## 19. Token architecture

| Token | Classification |
|-------|----------------|
| `--table-surface` | Alias → semantic surface |
| `--table-border` | Alias |
| `--table-radius` | Alias → `--shape-radius-container` |
| `--table-text` / `--table-muted-text` | Alias |
| `--table-header-*` / `--table-footer-surface` / `--table-row-border` | Alias |
| `--table-caption-text` | Alias |
| `--table-cell-padding-*` / `--table-caption-gap` | **Temporary** geometry |
| `--table-scroll-shadow` / `--table-scroll-fade-size` | **Temporary** |
| Focus ring on scroll area | Uses `--semantic-focus-ring` (Alias) |

No raw semantic colors in `table.module.css`. Squircle remains Experimental via global shape system.

## 20. Shape and surface behavior

- Scroll area uses `--table-radius` → container-capped (Pill is not a capsule).
- Do not apply pill radius to individual cells.
- Flat / Gradient / Glass must keep header, body, footer, and dividers readable; reduced-transparency remains opaque.

## 21. Mobile behavior

- Test targets: 320 / 375 / 768 / desktop / short height.
- No card transformation.
- Final columns remain reachable via horizontal scroll.
- Menu triggers in action columns remain operable.

## 22. React-first decisions

| Decision | Rationale |
|----------|-----------|
| Proceed without Figma | Native table semantics are HTML-standardized |
| No sorting/selection APIs | Data Table concerns — sorting approved for the Data Table MVP; selection deferred |
| Compound API | Matches caption/header/body/footer structure |
| Presentational only | Consumer owns data |
| Consumer-controlled scroll `tabIndex` | Progressive enhancement without forced focus stops |

## 23. Figma parity status

MCP unavailable on foundation and audit passes (2026-07-13). Component-set node ID **null**. Visual geometry Temporary.

## 24. Data Table capabilities beyond Table

Approved for the Data Table MVP (not yet implemented): sorting only, external Pagination composition, loading/empty/error presentation helpers over Table.

Excluded from v1 / deferred: selection (deferred to a later pass), sticky headers, density, stripes, embedded pagination ownership, editing, virtualization, `role="grid"`, arrow-key cell navigation.

## 25. Common mistakes

- Using List Item for multi-column aligned data
- Calling Table a Data Table (or the earlier discovery name, Data Grid)
- Adding `role="grid"` to ordinary tables
- Making entire rows clickable around cell controls
- Omitting captions
- Inferring `scope` incorrectly
- Identical caption and region labels
- Page-level horizontal overflow instead of `TableScrollArea`
- Forcing `tabIndex={0}` on every small table
- Truncating critical data behind Tooltip-only access

## 26. Decision table

| Area | Native platform rule | React behavior | Figma status |
|------|----------------------|----------------|--------------|
| Markup | HTML table elements | Matching compound components | Not applicable |
| Nesting | Valid table model | Documented; not fully runtime-enforced | Not applicable |
| Caption | `<caption>` names table | `visibility` visible / screen-reader | Pending |
| Region label | Optional landmark | Only when named; distinct from caption | Pending |
| Column headers | `<th scope="col">` | Consumer supplies scope | Pending |
| Row headers | `<th scope="row">` | Consumer supplies scope | Pending |
| Multi-level | colspan/rowspan/headers | Native attrs pass through | Pending |
| Alignment | CSS text-align | `align` prop → logical CSS | Pending |
| Overflow | Scroll container | `TableScrollArea` + Temporary edge fades | Pending |
| Scroll focus | Author choice | Consumer `tabIndex`; docs recommend for known overflow | Not applicable |
| Keyboard | Tab to controls | No grid navigation | Not applicable |
| Empty/loading/error | Author composition | Documented patterns only | Not applicable |
| Print | UA print CSS | Overflow visible; no clip | Not applicable |
| Sorting | N/A | Unsupported on Table | Approved for Data Table MVP (not yet implemented) |
| Selection | N/A | Unsupported on Table | Deferred to a later Data Table pass |
| Tokens | N/A | Semantic aliases + Temporary geometry | Pending |
