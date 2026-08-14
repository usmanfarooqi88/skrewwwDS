# Table foundation

Last updated: **2026-08-14** (canonical Figma parity)

## Implementation status

**TABLE FOUNDATION APPROVED — REACT-FIRST SEMANTICS + CANONICAL FIGMA VISUAL PARITY**

- Public component: **Table** (`/components/table`)
- Category: Content & Data
- Origin: React-first native HTML semantics; visual anatomy now aligned to reusable Figma masters
- Figma verification: **Verified 2026-08-14** — Table `2321:1964`, Header Row `2321:1903`, Body Row `2321:1920`, Cell `2321:1872`
- Historical Table example `2044:26192` is retained as evidence but is not canonical
- Data Table (named "Data Grid" during discovery; canonical name finalized as "Data Table" on 2026-07-13): **implemented at the narrow MVP scope** (sorting only + external Pagination) and remains separate — see [`data-table-discovery.md`](data-table-discovery.md)

Metadata: `lib/table-figma-metadata.ts`

---

## 1. Purpose

Table provides native HTML tabular structure and restrained token-driven presentation. Consumers compose captions, headers, rows, cells, and optional overflow. Table does not own data fetching, sorting, selection, pagination, editing, or business logic.

## 2. Table versus Data Table

| | Table | Data Table (implemented narrow MVP) |
|--|-------|---------------------|
| Role | Semantic + visual foundation | Higher-level interaction pattern |
| Markup | Native `<table>` | Composes Table (confirmed) |
| Sorting / selection | Unsupported | Sorting approved for MVP; selection deferred to a later pass |
| Keyboard | Native table + descendant controls | No `role="grid"` — deliberately excluded from scope |
| Status | React Beta + canonical Figma visual parity | React Beta (sorting + external Pagination) |

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

Why composition instead of Table props: ownership of fetch/retry/empty messaging belongs to the product surface or the separately implemented Data Table interaction layer.

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
| `--table-surface` | Alias → Card surface, locally rebound to Flat |
| `--table-border` | Alias → Card border, locally rebound to Flat |
| `--table-radius` | Verified `radius/lg` value, fixed at 12px for Stable-v1 |
| `--table-text` / `--table-muted-text` | Alias |
| `--table-header-*` / `--table-body-surface` / `--table-row-border` | Verified semantic/shared aliases |
| `--table-footer-surface` | Existing React alias; canonical Figma Footer visual pending |
| `--table-caption-text` | Alias |
| `--table-cell-padding-*` | Verified 12px block / 16px inline geometry |
| `--table-caption-gap` | **Temporary**; canonical Figma Caption visual pending |
| `--table-scroll-shadow` / `--table-scroll-fade-size` | **Temporary** |
| Focus ring on scroll area | Uses `--semantic-focus-ring` (Alias) |

No raw color values are introduced in `table.module.css`; the shell locally rebinds existing shared contracts to their Flat semantic aliases.

## 20. Shape and surface behavior

- Stable-v1 Table is Rounded-only: the shell keeps `radius/lg` (12px) with ordinary circular corners (`cornerSmoothing=0` in Figma) under Sharp, Rounded, Pill, and Squircle ancestors.
- Rows and cells do not own outer corner geometry; the scroll shell clips their fills.
- Stable-v1 Table is Flat-only: scoped token rebinding keeps Card surface/border opaque, blur at `none`, header elevated, and body default under Flat, Gradient, and Glass ancestors.
- Table exposes no Surface or Shape property. Controlled Table Shape mapping is deferred.

## 21. Mobile behavior

- Test targets: 320 / 375 / 768 / desktop / short height.
- No card transformation.
- Final columns remain reachable via horizontal scroll.
- Menu triggers in action columns remain operable.

## 22. React-first semantic decisions retained after Figma parity

| Decision | Rationale |
|----------|-----------|
| Preserve native compound semantics | Figma visual composition is not a one-to-one React export map |
| No sorting/selection APIs | Data Table concerns — sorting approved for the Data Table MVP; selection deferred |
| Compound API | Matches caption/header/body/footer structure |
| Presentational only | Consumer owns data |
| Consumer-controlled scroll `tabIndex` | Progressive enhancement without forced focus stops |

## 23. Figma parity status

Reusable visual anatomy was verified live on 2026-08-14: Table `2321:1964`, Header Row `2321:1903`, Body Row `2321:1920`, and Cell `2321:1872`. The shell is Flat-only with no Surface property, 12px Rounded-only with `cornerSmoothing=0` and no Shape property, clipped, shadowless, and uses Card surface/border plus zero blur. Header/body typography, color, padding, and dividers are verified. Caption and Footer visual contracts remain intentionally pending; the historical example `2044:26192` is not canonical.

Presentation QA remains a separate backlog: budget/date wrapping, column presentation, Pagination number visibility, Table/Pagination spacing, and interactive-cell alignment are not claimed as closed by this visual-anatomy parity pass.

## 24. Data Table capabilities beyond Table

Implemented for the Data Table MVP: sorting only via `DataTableSortHeader` + `useDataTableSort`, with external Pagination composition over Table.

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
| Caption | `<caption>` names table | `visibility` visible / screen-reader | Visual contract pending |
| Region label | Optional landmark | Only when named; distinct from caption | Pending |
| Column headers | `<th scope="col">` | Consumer supplies scope | Visual cell anatomy verified |
| Row headers | `<th scope="row">` | Consumer supplies scope | Visual body-cell anatomy verified |
| Multi-level | colspan/rowspan/headers | Native attrs pass through | Pending |
| Alignment | CSS text-align | `align` prop → logical CSS | Start/Center/End verified |
| Overflow | Scroll container | `TableScrollArea` + Temporary edge fades | Figma composition + React behavior verified |
| Scroll focus | Author choice | Consumer `tabIndex`; docs recommend for known overflow | Not applicable |
| Keyboard | Tab to controls | No grid navigation | Not applicable |
| Empty/loading/error | Author composition | Documented patterns only | Not applicable |
| Print | UA print CSS | Overflow visible; no clip | Not applicable |
| Sorting | N/A | Unsupported on Table | Implemented separately in Data Table MVP |
| Selection | N/A | Unsupported on Table | Deferred to a later Data Table pass |
| Tokens | N/A | Shared aliases + verified geometry | Shell/row/cell verified; Caption/Footer pending |
