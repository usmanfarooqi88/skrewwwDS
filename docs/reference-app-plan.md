# Reference App / Composition Validation Plan

**Phase:** RA-1 ✅ COMPLETE (App Shell + fixture foundation)  
**Status:** Shell and fixtures shipped — data/forms workflows not started  
**Baseline:** CE-3 closed at `55b4bd2`; RA-0 plan at `74bbf3b`  
**Canonical next task:** RA-2 — Data workflow (**NOT STARTED**)

This document is the **single source of truth** for the Reference App phase.
Do not create parallel planning docs. RA-2+ starts only after explicit
human approval.

---

## RA-1 delivery (2026-09-15)

| Item | Result |
|------|--------|
| Routes | `/reference`, `/reference/data`, `/reference/new`, `/reference/edit/[id]`, `/reference/settings` |
| Shell | Application composition in `components/reference-app/` — **no** `AppShell` DS export |
| Docs isolation | `DocsChrome` skips docs Sidebar/MobileDocsNav on `/reference/*` |
| Nav | Shared `REFERENCE_NAV_ITEMS` for desktop aside + mobile `Drawer` |
| Fixtures | `lib/reference-app/` — owners, labels, 5 requests, workspace summary |
| State | Local React state for mobile drawer only |
| Shape/Surface | Default root tokens only — gallery deferred |
| Command Palette / Multi Select | Untouched (RA-0 decisions hold) |
| Visual backlog | Untouched |
| Vitest | 1143 / 1143 (1135 baseline + 8 RA-1) |
| Browser | `e2e/reference-app-shell.spec.ts` — desktop / 900px / mobile Escape+focus |
| Gaps | No G3/G4/G5 discovered in RA-1; sidebar width remains hardcoded `w-64` (known candidate G2/G3, not acted on) |

Manual visual review: `/reference` at 1280×800 and 390×844.

---

## 1. Purpose

The Reference App proves that Skrewww components work together in realistic
product compositions. It is **not**:

- another component docs page
- a visual playground or fake Dribbble dashboard
- a second design system or component library
- a place to invent arbitrary product APIs

It must expose, before PH-0 / Guard:

| Gap class | Examples |
|-----------|----------|
| Composition | layout, state conflicts, keyboard conflicts |
| Product realism | API friction, missing primitives, docs assumptions |
| Quality | a11y, responsive, visual-system inconsistency |

**Gap classification rule (see §18):** a composition problem does **not**
automatically mean “create a new component.”

---

## 2. Preflight (RA-0 verified)

| Check | Result |
|-------|--------|
| `main` == `origin/main` | Yes at CE-3 SHA `55b4bd2` |
| Working tree | Clean at audit start |
| CI | Green on CE-3 close |
| Distribution | 52/55 React distributed; 53 `/r` items; banking 3 intentionally undistributed |
| CE-0 Class B | 0 |
| Existing `docs/reference-app*.md` | **None** — this file is the first canonical plan |

### Existing guidance in repo (read, not duplicated)

| Source | Guidance |
|--------|----------|
| `docs/project-status.md` (CE-2D–I) | Multi Select DEFERRED; Advanced Filters / Notification Center / Command Palette = composition; App Shell = Reference-App template first; searchable Command Palette a11y unresolved |
| `docs/component-expansion.md` | Full CE-2 audit reasoning for the above |
| `docs/distribution-expansion.md` | CE-3 transport/registry complete; banking excluded from `/r` |
| `AGENTS.md` / `CLAUDE.md` | Smallest change; Figma read-only unless asked; no public API changes without need |
| Site nav (`Sidebar*.tsx`, `MobileDocsNav`) | Proven desktop `<aside>` + shared nav + mobile `Drawer` pattern — **outside** `components/ui/` |

---

## 3. Component coverage matrix (55 React)

Classification for Reference App **usage**, not CE-0 parity.

**Legend:** Essential | Useful | Optional | Excluded

### A. Foundational layout / input primitives

| Component | Usage | Reason |
|-----------|-------|--------|
| Button | Essential | Primary actions everywhere |
| Link | Essential | In-app navigation + external |
| Card | Essential | Dashboard panels, settings sections |
| Divider | Useful | Section separation in shell/settings |
| Avatar | Useful | User menu / notification rows |
| Skeleton | Useful | Loading states on data route |
| Spinner | Optional | Inline busy; Skeleton preferred for page load |

### B. Navigation

| Component | Usage | Reason |
|-----------|-------|--------|
| Breadcrumb | Essential | Content-header hierarchy |
| Tabs | Essential | Settings sections; filter modes if needed |
| Menu | Essential | Row actions, user menu, header overflow |
| Pagination | Essential | Data workflow |
| Stepper | Optional | Only if a multi-step create flow is kept thin; not required for MVP shell |
| Accordion | Optional | Dense settings / FAQ-like help |

### C. Forms

| Component | Usage | Reason |
|-----------|-------|--------|
| Form Field | Essential | Label/hint/error stack |
| Text Input | Essential | Core fields |
| Textarea | Essential | Notes / description (also visual backlog) |
| Search Field | Essential | Data toolbar + filters |
| Select | Essential | Status / category filters and form selects |
| Combobox | Essential | Searchable assignee / project-like fields |
| Checkbox | Essential | Row select / filter options / prefs |
| Radio / Radio Group | Useful | Mutually exclusive settings |
| Switch | Useful | Preference toggles |
| Number Input | Useful | Quantity / capacity fields if scenario needs |
| Date Picker | Useful | Due dates / date filters |
| Validation Message | Essential | Form errors |
| File Upload | Optional | Attachments only if create flow justifies |
| Phone Number Field | Optional | Contact fields — scenario-dependent |
| Credit Card Field | Excluded | No payment domain in selected scenario |
| Slider | Optional | Density / threshold prefs only if natural |

### D. Overlays

| Component | Usage | Reason |
|-----------|-------|--------|
| Dialog | Essential | Confirm delete; create/edit modal |
| Drawer | Essential | Mobile nav; mobile filters; notification panel candidate |
| Popover | Essential | Desktop filters; compact menus |
| Tooltip | Useful | Icon-only header actions |
| Alert | Useful | Inline page-level messages |

### E. Data display

| Component | Usage | Reason |
|-----------|-------|--------|
| Table | Essential | Presentational building block |
| Data Table | Essential | Sortable header composition; visual backlog target |
| Empty State | Essential | Zero results / empty inbox |
| List Item | Essential | Notifications / activity |
| Badge | Essential | Status chips (non-removable) |
| Tag | Essential | Active filter chips (removable) |
| Timeline | Optional | Activity history panel |
| Tree View | Optional | Folder/project tree only if shell needs nesting evidence |
| Calendar Day / Calendar Grid | Useful | Date range in advanced filters |

### F. Feedback / status

| Component | Usage | Reason |
|-----------|-------|--------|
| Toast | Essential | Save / error feedback |
| Progress Bar | Optional | Long upload or batch action |
| Button Group | Useful | Segmented toolbar actions + visual backlog |
| Split Button | Useful | Primary + overflow create action + visual backlog |
| Toggle Group | Useful | View mode (table/list) + visual backlog |

### G. Date / time

Covered via Date Picker + Calendar Grid under forms/data filters.

### H. Charts

| Component | Usage | Reason |
|-----------|-------|--------|
| Bar Chart | Essential | Dashboard status |
| Line Chart | Useful | Trend on overview (one chart family is enough if space is tight) |

### I. Complex interactive

Covered by Data Table, Combobox, Menu, Drawer/Dialog compositions — no
separate class of components beyond inventory above.

### J. Specialized banking / deferred

| Component | Usage | Reason |
|-----------|-------|--------|
| Banking Account Card | Excluded | Intentionally undistributed; Reference App must not depend on them |
| Banking Balance Summary | Excluded | Same |
| Banking Transaction Row | Excluded | Same |

**Coverage intent:** ~35–40 components exercised naturally; do not force all 55.

---

## 4. Deferred compositions (CE findings reassessed)

### 4.1 Advanced Filters

| Question | Answer |
|----------|--------|
| Compose from | Search Field, Select, Combobox, Date Picker / Calendar Grid, Checkbox, Toggle Group, Popover (desktop), Drawer (mobile), Button, Tag (active chips), Badge (counts if needed) |
| Missing capability | None blocking; Drawer is left-only (no bottom-sheet) — validate whether left Drawer is enough on mobile |
| Include in Reference App? | **Yes** — primary composition stress on data route |
| New DS component? | **No** — remain application composition (G0) |
| Design-first later? | Only if Reference App proves a reusable Recipe is worth documenting |

### 4.2 Notification Center

| Question | Answer |
|----------|--------|
| Compose from | Drawer or Popover, List Item, Badge, Button, Empty State, Tabs (All / Unread), Toast/Alert for transient vs persistent |
| Missing capability | Unread persistence / push — app-owned, not DS |
| Include? | **Yes** — lightweight header affordance + panel |
| New DS component? | **No** — composition |
| Design-first? | No |

### 4.3 Command Palette

| Question | Answer |
|----------|--------|
| Non-searchable (static Cmd+K menu) | Composable today via Dialog/Popover + Menu items |
| Searchable (live filter + execute) | **Accessibility role model still unresolved** (combobox/listbox vs menu) — see §11 |
| Include searchable now? | **No — BLOCKED / DEFERRED** |
| Include non-searchable? | Optional Useful only if it stays pure Menu; not required for RA MVP |
| New DS component? | Not until a11y model is decided with evidence |

### 4.4 App Shell / richer navigation

| Question | Answer |
|----------|--------|
| Compose from | Layout regions + Link/Button + Menu + Breadcrumb + Drawer (mobile) + Avatar; active route from app router (not DS) |
| Missing capability | Possible later: shared sidebar width token / skip-link pattern / collapse — **candidates only after evidence** |
| Include? | **Yes — largest validation target** |
| New `AppShell` export? | **Not in RA** — prove composition first |
| Design-first component? | Only if composition repeatedly fails (G4) |

### 4.5 Multi Select

| Question | Answer |
|----------|--------|
| Realistic need | Assign multiple labels/owners on edit form; multi-criterion filter facets |
| Compose today? | Checkbox group + Tag summary for simple cases; searchable+chips still hard |
| Include workflow that *would* want it? | **Yes** — label assignment on form / filter facets |
| Decision gate | See §13 |

---

## 5. Product scenario selection

### Candidates scored (1–5, higher better)

| Criterion | A. Ops workspace | B. Support inbox | C. Project tracker |
|-----------|------------------|------------------|--------------------|
| Component coverage | 5 | 4 | 5 |
| Composition stress | 5 | 4 | 5 |
| A11y stress | 5 | 4 | 4 |
| Responsive stress | 5 | 4 | 5 |
| Realism | 5 | 5 | 4 |
| Impl cost (higher = cheaper) | 4 | 5 | 3 |
| Expose missing primitives | 5 | 3 | 5 |
| Avoid feature stuffing | 4 | 5 | 3 |
| **Total** | **38** | **34** | **34** |

### A — Compact SaaS ops / admin workspace (SELECTED)

Desktop-first product console for managing **operational records** (e.g.
“Requests” / “Work items”): overview metrics, searchable/filterable table,
create/edit drawer or dialog, settings, notifications. No banking, no auth
backend, no domain DTOs owned by Skrewww.

**Why:** Max stress on App Shell + Advanced Filters + Data Table + forms +
overlays + charts without inventing a second product platform. Matches CE-2I
“admin / SaaS shell” evidence need.

### B — Support inbox (runner-up)

Strong realism and lower cost; weaker chart/filter/shell stress.

### C — Lightweight project tracker

Good coverage but higher stuffing risk (boards, trees, steppers).

**Selected:** **A — Ops / admin workspace.**

---

## 6. Information architecture (routes)

Recommend **4 routes** under `/reference` (see §19).

| Route | User task | Primary components | Composition under test | State families | Responsive | Keyboard / a11y |
|-------|-----------|--------------------|------------------------|----------------|------------|-----------------|
| `/reference` | Scan health of the workspace | Card, Bar Chart, Line Chart (optional), Badge, Button, List Item (activity), Skeleton | Dashboard density; shell + content header | Fixture metrics; loading → ready | Charts stack / scroll; cards reflow | Skip link; landmark regions |
| `/reference/data` | Find, filter, act on records | Search Field, Select/Combobox, Tag, Data Table/Table, Menu, Pagination, Empty State, Checkbox, Popover/Drawer, Toast | **Advanced Filters + table + row actions** | Query filters; sort; page; selection; empty | Table scroll; filters → Drawer; actions → Menu | Table headers; filter focus trap; row Menu |
| `/reference/edit/[id]` or `/reference/new` | Create/edit one record | Form Field, Text Input, Textarea, Select, Combobox, Date Picker, Checkbox, Validation Message, Button/Button Group, Dialog confirm, Toast | Form stack + validation + save feedback | Dirty form; field errors; submit | Single column mobile; sticky actions | Label/error linking; dialog restore focus |
| `/reference/settings` | Adjust preferences | Tabs, Switch, Radio Group, Toggle Group, Button Group, Form Field | Settings density; Shape/Surface sample mount points | Local prefs only | Tabs → stacked | Tablist keyboard |

Optional fifth (only if needed after RA-1): `/reference/activity` for Timeline — **not** in MVP.

**Out of MVP routes:** dedicated Command Palette page; banking demos; auth.

---

## 7. App Shell (composition plan — no `AppShell` component)

### Structure

```
[ skip link ]
header: brand | primary nav (md+) | search (optional) | notifications | user Menu
aside (md+): secondary nav Links (active from usePathname — app-owned)
main: content header (title + Breadcrumb + contextual actions) | children
mobile: Menu/Button opens Drawer with same nav tree as aside
```

### Requirements to validate

| Concern | Expectation |
|---------|-------------|
| Desktop nav | Persistent aside; one shared nav data module |
| Mobile nav | Drawer wrapping **same** nav content (site already proves this) |
| Page header | Title + Breadcrumb + actions (Split Button / Button Group as needed) |
| Content region | Single scroll container; no double scroll traps with Drawer |
| Responsive transition | `md` breakpoint: aside ↔ Drawer; no duplicate sources of truth |
| Focus order | Skip → header → nav → main; Drawer focus trap when open |
| Skip / landmarks | Add skip-to-content in Reference App (site gap is known; do not silently “fix site” in RA) |
| Overlays on mobile | Nav Drawer vs filter Drawer vs notification Drawer — **one at a time**; document stacking if both requested |

### Candidate gaps (record only)

- Shared layout width token / CSS variable for sidebar offset (today site hardcodes `w-64` / `md:ml-64`) → possible **G2/G3**, not auto-new component
- Collapse / icon rail → **unevidenced**; do not build in RA-1 unless forced

---

## 8. Data workflow

**Scenario:** “Requests” table — search + advanced filters + sort + row actions + pagination + empty state.

```
SearchField
+ Filter trigger → Popover (desktop) / Drawer (mobile)
    Select status | Combobox owner | Date range | Checkbox flags
+ ActiveFilters as removable Tags
+ DataTable (sortable columns) + row Menu (View / Edit / Archive)
+ Pagination
+ EmptyState when filters yield zero
+ Toast on archive/confirm
```

**Authority:** current Data Table API (sort MVP; **no built-in filters**). Filters remain **outside** the table component (CE-2E).

**Visual backlog exposure (§15):** this screen is the primary host.

---

## 9. Advanced Filters (application composition)

- **Do not** create `AdvancedFilters` DS export.
- Reference App may ship `reference/filters.tsx`-style app code.
- Prefer **Apply** on mobile Drawer; live-filter on desktop is product choice — announce result count if live.
- Active chips = `Tag` + `onRemove`; clear-all = `Button`.
- Left-only Drawer: validate; if insufficient, record **G3** (placement API) — do not invent bottom-sheet without approval.

---

## 10. Form workflow

**Scenario:** Create/Edit Request — only justified fields:

| Field | Component |
|-------|-----------|
| Title | Text Input |
| Description | Textarea |
| Status | Select |
| Owner | Combobox |
| Due date | Date Picker |
| Labels | Checkbox group **or** Tag picker composition (§13) — **not** Multi Select component |
| Priority | Toggle Group or Radio Group |
| Notify watchers | Switch |

**Exclude:** Credit Card Field; Phone unless contact subform is added later.

Submit → Toast success; validation → Validation Message; destructive Archive → Dialog confirm.

**Visual backlog:** Textarea padding; Button Group / Toggle Group if used for priority/view.

---

## 11. Overlay composition

| Overlay | Workflow |
|---------|----------|
| Dialog | Confirm archive/delete; maybe short “new” on desktop |
| Drawer | Mobile nav; mobile filters; notification center |
| Popover | Desktop filter panel; compact help |
| Menu | Row actions; user account |
| Tooltip | Icon-only header buttons |

**Risks to validate (realistic, not pathological):** focus restore after Dialog; Escape dismiss; scroll lock; mobile Drawer vs keyboard; z-index when Toast fires over Dialog.

**Avoid:** Dialog inside Dialog; Menu inside Popover chains built only for testing.

---

## 12. Command Palette decision

| Item | Decision |
|------|----------|
| Composition of searchable palette | Primitives exist (Dialog + Search Field + list), but **ARIA model unresolved** |
| Correct a11y model | **Still unresolved** — do not invent; do not silently use Combobox value-selection for command execution |
| Reference App include searchable palette? | **BLOCKED / DEFERRED** |
| Non-searchable static action menu | Allowed as optional Menu demo only — not a substitute for resolving searchable semantics |
| Gap class if forced | **G5** until human + a11y decision |

---

## 13. Multi Select decision gate

**Workflow that would want it:** assign multiple **labels** on edit form; multi-select **owners** in filters.

| Question | Answer |
|----------|--------|
| A. Existing composition clean? | **Partially** — Checkbox list + Tags works for small finite sets; searchable chip combobox does **not** |
| B. Real component required? | **Not proven yet** — need Reference App evidence of pain |
| C. Merely convenient? | Searchable multi is convenient; Checkbox multi is sufficient for MVP labels |
| D. Keyboard/a11y contract | Searchable+chips still lacks a single canonical ARIA pattern (CE-2D) |
| E. Figma first? | **Yes** for any searchable Multi Select — design-first, not React-first |

**Outcome:** **COMPOSITION SUFFICIENT** for MVP label assignment via Checkbox (+ Tags).  
Searchable Multi Select remains **DESIGN-FIRST CANDIDATE** / effectively **BLOCKED PENDING ACCESSIBILITY DECISION** — **do not implement in RA**.

---

## 14. Responsive strategy

### Viewport matrix

| Name | Width |
|------|-------|
| Desktop | ≥ 1280 |
| Tablet / narrow | 768–1023 |
| Mobile | 375–430 |

### Adaptations

| Composition | Desktop | Narrow | Mobile |
|-------------|---------|--------|--------|
| Nav | Aside | Aside or collapse if proven | Drawer |
| Table | Full columns | Horizontal scroll + cue (§15) | Scroll or card-stack **only if** table fails usability — prefer scroll first to expose backlog |
| Actions | Visible buttons | Button Group / Split | Menu overflow |
| Filters | Popover + chip row | Same | Drawer + chips |
| Forms | 2-col where natural | 1-col | 1-col + sticky footer actions |
| Overlays | Dialog/Popover | Dialog | Drawer preferred for filters/nav |
| Charts | Side-by-side | Stack | Stack + min width |
| Long content | Main scroll | Same | Same; avoid nested body lock bugs |

---

## 15. Table / Data Table visual backlog (expose, do not fix)

Host screen: **`/reference/data`**

| Issue | How Reference App exposes it |
|-------|------------------------------|
| Header gray fill incomplete | Wide table with many columns + sort headers |
| Actions-cell / ellipsis inconsistency | Row Menu (ellipsis) on every row; compare to docs examples mentally |
| Horizontal-scroll discoverability | Force overflow at tablet width |
| Sticky right Actions (future) | Note as observation if actions scroll away — **do not implement sticky in RA-0/1 without approval** |
| Overflow edge fade/cue | Same overflow table — observe absence |

Track as **G2** candidates during RA-5; fixes need approval.

---

## 16. Other saved visual backlog (expose, do not fix)

| Item | Natural exposure |
|------|------------------|
| Button Group dividers / Squircle / Glass | Content header actions; settings |
| Split Button divider / states | Primary “New request” + menu |
| Toggle Group vertical Pill rounding | View mode or priority control |
| Textarea padding asymmetry | Edit form description |

---

## 17. Shape / Surface validation

**Do not** duplicate every route × every style.

### Practical matrix

| Mount | Shapes | Surfaces |
|-------|--------|----------|
| Shell chrome (header/aside) | Default product shape (one) | Flat (default) |
| Dashboard cards + charts | Rounded + one alternate via settings toggle **or** story control | Flat + Glass sample on one card |
| Data toolbar / filters | Default | Flat |
| Form controls | Default + settings “Shape preview” section showing Button/Input in Sharp / Rounded / Pill | Flat / Gradient sample on Button only |
| Overlays | Default | Glass on one Dialog **if** Glass exists for that component |

Prefer a **Settings → Appearance** subsection that remounts a small gallery over cloning pages.

---

## 18. Gap classification framework

| Code | Meaning | Action |
|------|---------|--------|
| G0 | Application composition only | Fix in Reference App code |
| G1 | Docs/example gap | Docs only |
| G2 | Token/layout bug | Bugfix with approval |
| G3 | Existing component API gap | **Human approval** before API change |
| G4 | Candidate new DS component | **Human approval** + usually design-first |
| G5 | Accessibility architecture blocker | **Human approval**; may block feature (e.g. searchable Command Palette) |

Evidence required: route, repro steps, expected vs actual, related CE audit if any.

---

## 19. Location / routing recommendation

### Current app

Single Next.js App Router tree: `app/layout.tsx` + docs pages (`/components`, `/foundations`, `/agent-kit`, …). Docs chrome (Sidebar) is global today.

### Recommendation

| Choice | Detail |
|--------|--------|
| URL | `/reference` (+ nested routes above) |
| Source | `app/reference/` route group **with its own nested `layout.tsx`** that **does not** reuse docs Sidebar — Reference App shell is the subject under test |
| Nav pollution | Add a single discreet link from site footer or Agent Kit/docs “Examples” only after RA-2+ is stable — **not** required in RA-1 |
| Why not separate app | Avoids second architecture, keeps Vitest/Playwright in-repo, public clone still works |
| Why not `/examples/...` only | `/reference` is shorter and matches roadmap language |

**Tests:** colocated `app/reference/**/*.test.tsx` and/or `tests/reference-*` using existing harness patterns.

---

## 20. Data strategy

| Rule | Detail |
|------|--------|
| Location | e.g. `lib/reference-app/fixtures.ts` (+ optional `types.ts`) |
| IDs | Stable string IDs (`req_001`, …) |
| Content | Fictional SaaS ops data; no real PII |
| Network | None — no fetch/DB/auth |
| Tests | Import same fixtures; deterministic |

---

## 21. State strategy

- React `useState` / URL `searchParams` for filters/pagination **only if** simple
- Component-controlled APIs as today
- **No** Redux, Zustand, React Query, DB, auth, API routes for Reference App

---

## 22. Validation strategy (for later RAs)

| Area | Method |
|------|--------|
| A Visual | Manual + screenshots; RA-5 backlog review |
| B Responsive | Playwright viewport matrix |
| C Keyboard | Playwright + manual |
| D Accessibility | axe / existing a11y tests + manual SR spot-check |
| E Composition | Integration tests on routes |
| F State | Vitest interaction tests |
| G Shape/Surface | Manual matrix + optional visual snapshots |
| H Browser | Chromium primary; spot Safari/Firefox if CI allows |
| I Distribution parity | Smoke that Reference App imports from same `components/ui` as `/r` (no fork copies) |

Harness preference: **Vitest** for unit/integration; **existing browser harness / Playwright** for routes; **manual** for visual backlog; **Figma** only when a G2/G4 claims parity.

---

## 23. Definition of Done (Reference App phase)

The phase may close when **all** are true:

1. One coherent ops-workspace workflow across the four routes  
2. App Shell composition validated desktop + mobile (no `AppShell` export required)  
3. Data workflow: search + filters + table + row actions + pagination + empty  
4. Form workflow: create/edit + validation + toast + confirm dialog  
5. Overlays exercised in real workflows (Dialog, Drawer, Popover, Menu, Tooltip)  
6. Feedback: Toast + at least one Alert or Empty State path  
7. Responsive matrix checked for nav, table, filters, forms, overlays, charts  
8. Keyboard: skip link, nav, table/menu, dialog focus restore  
9. Accessibility: no critical axe findings on reference routes; known G5 items explicitly deferred  
10. Shape/Surface practical matrix executed once  
11. No dependency on banking components  
12. All G3/G4/G5 findings listed with status resolved **or** explicitly deferred  
13. Visual backlog (§15–16) reviewed with notes (fixes optional, approval-gated)  
14. Distribution/CI remain green; Reference App does not break docs site  
15. Canonical docs updated (`project-status` + this plan status)

---

## 24. Phase plan

| Phase | Scope | Likely files | Risks | Validation | Stop boundary |
|-------|-------|--------------|-------|------------|---------------|
| **RA-0** | This audit | `docs/reference-app-plan.md`, `docs/project-status.md` | Scope creep into build | Doc quality | **STOP — no routes** |
| **RA-1** | ✅ COMPLETE — App Shell + fixtures + stub pages | `app/reference/**`, `components/reference-app/**`, `lib/reference-app/**`, `components/DocsChrome.tsx` | Docs chrome bleed; skip-link; routing active state | Vitest + Playwright shell specs | **STOP — no data filters** |
| **RA-2** | Data workflow + Advanced Filters composition | reference data route modules | Table overflow; filter state complexity | Vitest + browser | No Multi Select component; no table API expansion without approval |
| **RA-3** | Forms + overlays + notifications composition | edit/new + settings + header notifications | Focus traps; stacked Drawers | Keyboard + a11y | No Command Palette searchable; no Credit Card |
| **RA-4** | Responsive + a11y pass across routes | tests + small layout fixes (G0/G1 only) | Accidental G3 API changes | Viewport matrix + axe | Stop before visual bugfix campaigns |
| **RA-5** | Visual/parity backlog **review** | notes in this doc / status; fixes only with approval | Scope into CE visual fixes | Manual + evidence | No drive-by component restyles |
| **RA-6** | Final validation vs DoD + PH-0 gate | status docs | Premature PH-0 | Full checklist §23 | **STOP** — wait for PH-0 approval |

---

## 25. PH-0 entry criteria

Enter PH-0 Pre-Guard Hardening only when:

1. RA-6 DoD (§23) met or waivers explicitly recorded  
2. No unresolved **critical** G3/G5 composition blockers for shipped Reference App paths  
3. Searchable Command Palette either still deferred with G5 note **or** resolved with approved a11y model  
4. Multi Select still not silently shipped; status remains composition / design-first  
5. Responsive + keyboard evidence attached (tests or recorded manual)  
6. Major visual backlog understood (fixed or ticketed)  
7. CE-3 distribution still green (registry + Vitest)  
8. Reference App stable enough to cite as integration evidence for Guard  

---

## 26. Absolute stop (RA-0)

RA-0 must **not**: create routes/screens; implement Multi Select or AppShell; fix visual backlog; change component APIs; modify Figma; add dependencies; start PH-0/Guard; start RA-1.

---

## 27. Roadmap snapshot

```
CE-3 ✅ COMPLETE (55b4bd2)

Reference App:
  RA-0 ✅ COMPLETE
  RA-1 ✅ COMPLETE
  RA-2 NOT STARTED  ← next
  RA-3 … RA-6 later

PH-0 later
Guard NOT STARTED
```
