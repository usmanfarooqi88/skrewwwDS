# CE-2 component expansion prioritization

> **CE-2A** · Verified 2026-09-14 · Post CE-1 (`e134d9b`) · Class B = 0
> **CE-2B** Number Input ✅ (`eaba1e7`)
> **CE-2C** Toggle Group ✅ — Segmented Control **RESOLVED BY TOGGLE GROUP**
> **CE-2D** Multi Select audit ✅ — **DEFERRED (decision D)**, not implemented
> **CE-2E** Advanced Filters audit ✅ — **decision B, composition pattern (future Recipe, Reference-App-evidenced)**, not implemented
> Planning for CE-2 net-new work. Does **not** reopen CE-1 / Figma Class B parity.

## Purpose

CE-2 adds components that close **real product-building gaps**, not marketing
count inflation. Candidates are scored against frequency, reuse, architecture
fit, and Reference App readiness — not against another design system’s catalog.

## Entry conditions (met at CE-2A)

| Check | Result |
|-------|--------|
| CE-1 complete | ✅ |
| Class B gaps | **0** |
| Post CE-2B inventory | **53 / 27·26 / 53 / 53** |
| Post CE-2C inventory | **54 / 27·27 / 54 / 54** |

## Classification legend

| Type | Meaning |
|------|---------|
| **A** | Genuine missing primitive |
| **B** | Composition / pattern (prefer documenting composition first) |
| **C** | Duplicate / largely covered by existing capability |
| **D** | Future advanced / system feature |

## Scoring rubric (1–5 each)

1. Application frequency  
2. Cross-industry usefulness  
3. Current Skrewww gap severity  
4. Dependency value for later patterns  
5. Implementation clarity  
6. Accessibility clarity  
7. Reuse of existing foundations  
8. Agent / composition usefulness  

**Total** = sum (max 40).

## Candidate matrix

| Candidate | Type | Need | Reuse potential | Complexity | A11y risk | Total | Priority | Decision | Notes |
|-----------|------|------|-----------------|------------|-----------|------:|----------|----------|-------|
| **Number Input** | A | High | FormField, TextInputControl, Slider math | Medium | Medium | **34** | P1 | ✅ **CE-2B DONE** | React-first / Figma pending (Class D) |
| **Toggle Group** | A | High for settings/admin exclusive choices | Button Group adjacency chrome patterns | Medium | Medium | **31** | P2 | ✅ **CE-2C DONE** | Single radiogroup; Segmented Control = presentation |
| Segmented Control | B/C | — | — | — | — | **27** | — | **RESOLVED BY TOGGLE GROUP / NOT A SEPARATE COMPONENT** | CE-2C decision **A** |
| Multi Select | A | Medium — no clean a11y pattern yet for the differentiating (searchable + chips) case | Combobox pattern knowledge, Tag (`removable`/`onRemove` already exists), Popover | High | High | **26** | — | **DEFERRED (CE-2D decision D)** | See CE-2D audit below. Not rejected — needs product evidence + accessibility research/Figma before reconsidering |
| Advanced Filters | B | Medium for SaaS dashboards — **removed from the direct component-implementation queue** | SearchField, Select, Combobox, Checkbox, Radio Group, Toggle Group, Slider, Number Input, CalendarGrid (`mode="range"`), Popover, Drawer, Button, Tag | N/A — not a component | N/A — not a component | **24** | — | **NOT A STANDALONE COMPONENT (CE-2E decision B)** | See CE-2E audit below. Composition pattern using existing primitives; future Recipe pending Reference App evidence, not implemented |
| **Stepper** | A/B | Medium for multi-step flows | Pagination, Tabs, Progress Bar | Medium–High | Medium | **23** | **P3 / NEXT** | CANDIDATE / NOT STARTED | Distinct from Pagination |
| Notification Center | D | Medium for SaaS | Toast, Badge, Popover/Drawer | High | Medium | **21** | P5 | CANDIDATE / NOT STARTED | System surface |
| Command Palette | D | Medium for power-user apps | Menu, Combobox, Dialog | High | High | **20** | P5 | CANDIDATE / NOT STARTED | App command surface |
| App Shell / richer nav | D | Medium | Sidebar/Top Nav items (Class C), Menu | Very high | Medium | **16** | P6 | CANDIDATE / NOT STARTED | Layout system |

## CE-2C — Toggle Group vs Segmented Control (decision A)

| Option | Meaning | Result |
|--------|---------|--------|
| **A** | Toggle Group is the semantic component; segmented appearance is presentation | **SELECTED** |
| B | Segmented Control is canonical; Toggle Group unnecessary | Rejected — “Toggle Group” matches selection semantics and CE-2A ranking |
| C | Two separate components | Rejected — no durable semantic/API/a11y split beyond presentation |

**Evidence:**

- Button Group explicitly owns **no** selection (`role=group`, independent Buttons).
- Radio Group owns **form-field** exclusive radios (legend, validation, radio indicators).
- Tabs own **content panels** (`tablist` / `tabpanel`).
- Settings gaps need compact joined exclusive segments (List/Grid) — that is Toggle Group’s job.
- Shipping both Toggle Group and Segmented Control would duplicate one capability under two names.

**Accessibility model (implemented):** single selection only — `role="radiogroup"` + `role="radio"` + `aria-checked`, roving tabindex, arrow-key automatic selection. Multiple selection deferred (not justified for 0.1.0-beta). Re-click does not clear.

**Segmented Control:** documentation alias / use-case name for Toggle Group’s joined presentation. **No React export.**

## CE-2D — Multi Select product + architecture audit (decision D — defer)

**Audit only. Multi Select was not implemented in CE-2D.**

### Existing capability audit

- **Select** — single value (`value: string`), non-searchable, custom `role="combobox"` + `role="listbox"` + `role="option"` with a hidden native `<select>` form fallback.
- **Combobox** — single value, searchable/editable, same combobox/listbox/option role structure, local filter (`prefix`/`substring`), no multi-value capability anywhere in `Combobox.tsx` (verified: no array-typed value, no `multiple` prop).
- **Checkbox** — exists as a standalone control; there is **no dedicated Checkbox Group wrapper component** yet — "several visible binary choices" is currently an ad hoc composition of multiple `Checkbox`es inside `FormField`, not a formal primitive.
- **Tag** — already supports `removable`/`onRemove` — directly reusable as a chip-removal primitive for any future multi-value display, without needing new chip UI.
- **Menu** — `role="menu"`/`role="menuitem"` (action menu), not a selection listbox; no `aria-multiselectable` or checked-menuitem pattern exists anywhere in the codebase today.
- **Popover** — generic positioning/overlay primitive; already used by Combobox and Select for the dropdown surface, reusable for any future multi-select popup.
- **SearchField / FormField** — no multi-select-specific integration exists; FormField's label/validation composition would apply the same way it does to Select/Combobox today.
- No existing component owns "select several values, optionally by searching, with a removable summary of what's selected."

### Why multi-select was previously absent — verified, not guessed

Source: [`docs/architecture/combobox-parity.md`](architecture/combobox-parity.md#multi-select-removed), corroborated in `docs/project-status.md`'s 2026-07-15 Combobox parity entry.

Figma's Combobox component set originally carried a `Multi-select` (BOOLEAN) property with a "Chips frame" showing **hardcoded example chips** — i.e. a placeholder, not a specified interaction. That property and frame were **deleted from Figma on 2026-07-15**, and the parity doc is explicit: *"no multi-select/chip capability exists anywhere in `Combobox.tsx` ... the Figma property was documenting a capability that was never built in React ... This is no longer 'a known limitation to design around' — there is nothing left to design around ... If Multi-select is ever built in React in the future, it will need a fresh Figma spec — the removed variant is not a reference to revive."*

**Classification: closest to reasons 3 (Figma never actually defined it — the property had no real interaction spec behind it) and 6 (legacy decision — a vestigial, unimplemented property was cleaned up to match reality).** It was **not** a deliberate accessibility- or product-driven rejection of multi-select as a future capability — no such rationale is recorded anywhere. It is also not "reason 1, intentionally out of scope forever" — the parity doc explicitly leaves the door open to a future, freshly-designed build.

### Product need

Plausible and real in the abstract — assigning multiple team members, choosing multiple tags/categories/filters are common SaaS/admin patterns, and CE-2A's own scoring already rated this "Medium" need. But the project's own [`docs/component-inventory.md`](component-inventory.md) Reference-app readiness table does **not** name Multi Select as a material gap for any app type today — the listed gaps are "denser filters," "notification center," "denser form composites." Multi Select is a plausible future need, not a currently-evidenced blocking one.

### Semantic boundary

Unlike Toggle Group/Segmented Control (a naming duplicate of one capability), Multi Select's boundary against existing primitives is **not fuzzy** — no component today owns "several selected values, optionally searchable, with a removable summary":

- **Select / Combobox** — exactly one value.
- **Checkbox Group** (composition, not yet a formal component) — visible multiple binary choices, no search, no chip summary.
- **Tags** — representation of already-selected values, not a selection control.
- **Advanced Filters** — a broader domain pattern that could *compose* a Multi Select as one building block, not a substitute for it.

So the semantic case for eventually having a distinct component is real. The blocker is accessibility maturity, not naming overlap.

### Accessibility model — the hard part, and why it blocks a decision to build now

Two materially different ARIA shapes are in play, and they are not equally well-specified:

1. **A plain multi-select listbox** (`role="listbox"` + `aria-multiselectable="true"` + `role="option"` items, no search) — this **is** a well-established, documented pattern (WAI-ARIA APG "Multi-Select Listbox"). But this shape mostly overlaps with just composing multiple `Checkbox`es — it doesn't clearly justify a new component distinct from a future Checkbox Group.
2. **A searchable combobox with a live filter input and a removable-chip summary of selected values** — the product-interesting shape (and the one the old, vestigial Figma property gestured at with hardcoded example chips) — has **no single canonical, cross-screen-reader-consistent ARIA pattern**. Combining an editable combobox with multi-selection and dynamic chip removal is a widely-acknowledged hard accessibility problem industry-wide (the ARIA 1.2 combobox pattern doesn't cleanly extend to multi-select; production implementations vary). Key open questions the task calls out — chip/tag removal announcement, selected-count announcement on change, Backspace-to-remove-last-chip vs. Backspace-in-search-text, Escape behavior when chips vs. the listbox are focused — do not have a single settled answer to point to without either genuine accessibility research or a concrete interaction spec (ideally from Figma) to ground the decisions in.

Per this task's own instruction ("Do not invent ARIA patterns... If accessible behavior cannot be defined cleanly: recommend deferral"), the searchable+chips shape — the shape actually worth building — cannot be cleanly defined right now.

### Architecture comparison

| | A — Standalone | B — Extend Combobox | C — Composition only |
|---|---|---|---|
| API complexity | High (`value: string[]`, search, chips, compound keyboard model) | High — bolts a second selection mode onto an already-shipped, Figma-tracked single-select API | Low, but only covers the simple (non-searchable) case |
| Code reuse | Medium — Popover + Tag reusable; core multi-select/search/chip logic is net-new | High superficially, but reuses by mutating a settled component | High for the simple case; none for search+chips |
| Accessibility | Unresolved for the differentiating case (see above) | Same unresolved problem, inherited by an already-public API | Clean for the simple case; doesn't solve the real want |
| Test complexity | High (nav, chip removal by click/Backspace, search filter, disabled options, SR announcements) | High, plus full Combobox regression risk | Low |
| Figma parity | None exists; old property was explicitly vestigial, not a spec to revive | Would need to reopen a 2026-07-15 decision that deliberately closed this without new Figma evidence | N/A |
| Agent Kit clarity | Needs explicit contract guidance vs. Combobox/Select — doable | Risk of agents misusing a dual-mode Combobox | Already clear (compose Checkbox + FormField) |
| Maintenance / breaking-change risk | Low once built correctly, **but** building on an under-specified a11y foundation risks a breaking rework later | High — retrofits a shipped, tracked component | Low |

**Option B is also out of scope for this task by explicit instruction (Part 7) and is architecturally weak regardless: it would reopen a deliberately, recently closed parity decision without new Figma evidence.**

### Decision: **D — Defer Multi Select**

- **Semantic reason:** the boundary against Select/Combobox/Checkbox/Tags is real and not fuzzy, so a distinct component is conceptually justified *eventually* — but conceptual justification alone isn't sufficient to build now.
- **Product reason:** plausible, not currently evidenced as a blocking gap in the project's own readiness tracking; better validated by concrete use cases than built speculatively.
- **Accessibility reason:** the differentiating shape (searchable + removable chips) has no clean, established ARIA pattern to implement against without inventing one — explicitly disallowed by this task's own instructions.
- **Architecture reason:** Option A's accessibility risk is unresolved; Option B is both out of scope and reopens a settled parity decision; Option C only solves the less interesting half of the problem.
- **Figma implication:** the previously-removed Figma property was never a real interaction spec ("hardcoded example chips") — there is nothing to revive, and the parity doc already says a future build needs a **fresh** Figma spec.
- **Agent Kit implication:** none yet — no contract to write, no risk of agents being told about a component that doesn't exist. Deferring avoids publishing an under-specified Beta contract that would need a breaking rework later.

### Figma recommendation

**Design-first (or Reference-App-evidence-first) before any future implementation** — unlike Number Input and Toggle Group, whose interaction contracts were narrow enough to specify React-first, Multi Select's genuinely hard part (search + multi-select + removable chips + their combined accessibility behavior) needs either a concrete Figma interaction spec or real product evidence to ground the ARIA decisions in. Recommend **not** proceeding React-first here.

### Reference App relevance

**Likely the correct path.** Real dashboard/settings composition (assigning team members, multi-value filters) would surface concrete, evidenced use cases and disambiguate whether the plain multi-select-listbox shape (composable today via Checkboxes) is actually sufficient, or whether the harder searchable+chips shape is genuinely needed — rather than speculatively building the harder, accessibility-unresolved version now. This is deferred to whenever Reference App work begins; it is **not** started in this task.

## CE-2E — Advanced Filters product + architecture audit (decision B — composition, not a component)

**Audit only. Advanced Filters was not implemented in CE-2E. Data Table was not touched.**

### What "Advanced Filters" actually means — ten distinct shapes, not one

The name was never scoped precisely before this audit. Identified shapes, classified individually rather than as one product:

| # | Shape | Classification |
|---|-------|-----------------|
| 1 | Inline filter bar (row of controls in a toolbar) | **Composition** — already buildable from SearchField/Select/Toggle Group/Button |
| 2 | Popover filter panel (desktop) | **Composition** — Popover already documented for "a small set of related options" |
| 3 | Drawer-based mobile filters | **Composition** — Drawer's own docs already say `whenToUse: "Settings panels, filters, secondary forms."` verbatim |
| 4 | Data-table column filters | **Application logic / future Data Table feature** — Data Table has zero filter capability today (sorting-only MVP); explicitly not touched this task |
| 5 | Faceted filters (counts per option) | **Application logic** — counts come from real data/API, not a design-system concern |
| 6 | Search + multiple criteria | **Composition** — SearchField + Select/Combobox/Checkbox side by side |
| 7 | Date/range filters | **Mostly primitive already** — `CalendarGrid` already supports `mode="range"` (`rangeValue`/`onRangeValueChange`); composing it inside Popover covers this |
| 8 | Saved filters | **Application logic** — persistence is explicitly out of scope for the design system (see State ownership below) |
| 9 | Active-filter chips | **Primitive already exists** — `Tag` (`removable`/`onRemove`), see below |
| 10 | Filter builder / rule builder | **Application logic** — query/rule construction is product-specific business logic, not a UI primitive |

Six of ten shapes are pure composition or already-covered primitives; three (4, 5, 8, 10 — data-table filters, facet counts, saved filters, rule builder) are application/business logic that the design system should not own; only shape 4 touches Data Table, and it is explicitly deferred, not fixed, in this task.

### Existing capability audit

Every atomic control a filter UI needs already exists: `SearchField` (`whenToUse: "Any search/filter input, whether inline in a toolbar or as a page-level search bar"` — literally already documents this use case), `Select`/`Combobox` (single-value filter dropdowns), `Checkbox` (individual boolean filters — no formal Group wrapper yet, same minor gap CE-2D noted, non-blocking), `Radio Group`/`Toggle Group` (exclusive-choice filters), `Slider`/`Number Input` (numeric-range filters), `CalendarGrid` `mode="range"` (date-range filters), `Popover` (desktop panel), `Drawer` (mobile panel — explicitly documented for filters, though its only placement is `"left"`, not a bottom-sheet), `Button`/`Button Group` (Apply/Clear/Reset triggers), `Tag` (removable active-filter chips). `Menu` does not fit (`role="menu"`/`role="menuitem"`, no `aria-multiselectable` or checked-item pattern anywhere in the codebase). `Data Table` has no filter capability and was not touched. No missing primitive blocks building a filter UI today.

### Product need

Real and recurring for SaaS dashboards, admin tools, and CRM-style screens — `docs/component-inventory.md`'s own Reference-app-readiness table already names "denser filters" as a gap for the SaaS dashboard archetype. But the recurring need is for the **composition** (arranging existing controls into a filter bar/panel with active-chip feedback), not for a missing atomic control — nothing in the shape audit above identifies a control that doesn't already exist.

### Component vs. pattern vs. application-logic boundary

- **PRIMITIVE** (already exists, reused as-is): SearchField, Select, Combobox, Checkbox, Radio Group, Toggle Group, Slider, Number Input, CalendarGrid, Popover, Drawer, Button, Tag.
- **COMPOSITION** (arranging existing primitives, no new export needed): filter bar row, filter popover/drawer panel, active-filter chip row.
- **FEATURE PATTERN** (a named, documented way of composing the above — candidate for a future Recipe): "Advanced Filters" as a whole.
- **APPLICATION LOGIC** (must live in the consuming app, not the design system): URL query serialization, backend query syntax, API requests/data fetching, saved-filter persistence, authorization, business validation, facet-count computation, rule-builder logic.

### State ownership boundary

Skrewww should **not** own: URL query serialization, backend query syntax, API requests, data fetching, analytics, saved-filter persistence, authorization, or business validation — all of that is consumer-application concern. Skrewww's responsibility, if and when a Recipe is written, stops at: visual grouping of filter controls, the controls themselves (already built), active-filter display (`Tag`), clear/reset action affordance (`Button`), and accessible filter-panel structure (`Popover`/`Drawer` composition + labeling). Local UI state (which filters are currently open/expanded, draft vs. applied values before an explicit Apply) is a reasonable pattern-level concern; persisted/serialized/fetched state is not.

### Accessibility findings

- **Filter-group labeling** — each filter section needs a real accessible name (`aria-label`/`aria-labelledby` on a `fieldset`/`region`), same convention already used by `ToggleGroup`/`Radio Group`.
- **Popover/Drawer focus management** — already solved: both components already implement focus trapping (Drawer) or dismiss-on-Escape/outside-click (Popover) per their own documented accessibility contracts; no new focus-management work needed.
- **Active-filter removal** — `Tag`'s existing `removable`/`onRemove` already provides an accessible remove affordance per chip.
- **Clear-all action** — a plain `Button`; no special pattern needed.
- **Result-count / live-region announcements when filters change** — a real, unresolved design decision (does the result count update live via `aria-live="polite"`, or only on explicit Apply?) — this is exactly the kind of question that depends on the specific product's interaction model and **should not be hard-coded into the design system**; it is an application-level choice a Recipe can document as guidance, not mandate as component behavior.
- **Live updates vs. explicit Apply** — an interaction-pattern decision (see Apply/Clear/Reset below), not something the design system should force one way.
- **No color-only active states** — already the established Skrewww convention (verified elsewhere in the token system: active/selected states pair a visual change with a semantic/ARIA state, e.g. `Toggle Group`'s `aria-checked` + surface change).
- Overall: the a11y requirements are addressable **today**, cleanly, using existing components' already-solved focus/dismiss/labeling contracts. Nothing here requires inventing a new ARIA pattern (unlike CE-2D's Multi Select conclusion).

### Desktop vs. mobile

**Desktop**: inline filter bar or Popover panel — both fully covered by existing `SearchField`/`Select`/etc. and `Popover`. **Mobile**: Drawer is the documented, intended container (`whenToUse: "Settings panels, filters, secondary forms"`), but its only placement today is `"left"` — not the bottom-sheet shape many mobile filter UIs use. This is a **real, minor gap** worth flagging, but it does not block composition (a left-edge Drawer is still a valid, accessible mobile filter panel) and does **not** justify a new responsive-container primitive in this task, per explicit scope. If a bottom-sheet shape is later wanted, that is a `DrawerPlacement` extension to raise separately — not part of this audit's conclusion and not started here.

### Data Table relationship

**Stay independent.** Data Table currently has zero filter capability (sorting-only MVP, confirmed via source inspection — no `filter` reference anywhere in `Table.tsx`/`DataTableSortHeader.tsx`, and no mention in `docs/architecture/data-table-discovery.md`/`table-foundation.md`). Coupling a generic filter pattern directly into Data Table now isn't justified — it would entangle a still-evolving, narrow-MVP component with a pattern that hasn't even been validated once yet. Advanced Filters may eventually gain Data-Table-specific examples once both mature, but that is future work, not this task, and Data Table's own PARTIAL parity debt was explicitly not touched.

### Active-filter representation

**Already solved — no new "Filter Chip" component needed.** `Tag`'s own documented purpose is *"a removable, user-generated or user-applied label — distinct from Badge, which is a non-removable system status indicator"* — an exact semantic match for "Status: Active", "Country: UAE", "Date: Last 30 days" style active-filter chips. `Badge` would be the wrong choice (non-removable, system-status semantics).

### Apply / Clear / Reset

Interaction-pattern decisions, correctly **not** a universal component API: immediate-apply vs. explicit-Apply-button is a product/UX choice that depends on query cost and result-set size; "Clear all" and "Reset to defaults" are plain `Button`s with app-defined behavior. A future Recipe can document common variants (e.g. "immediate-apply for cheap client-side filters, explicit Apply for expensive server queries") as guidance, not enforce one universal state model.

### Architecture comparison

| | A — Standalone `<AdvancedFilters />` | B — Composition pattern | C — Missing primitives first | D — Wait for Reference App |
|---|---|---|---|---|
| Reuse | Low — would re-wrap controls that already work standalone | High — every needed control already exists | N/A — no primitives are actually missing | N/A |
| API complexity | High — would need to abstract over an open-ended set of filter-field types (text/select/range/date/boolean), risking a prop-explosion API or a rigid schema that fights real use cases | None — composition has no new API surface | N/A | N/A |
| Application coupling | High — a generic filter component tends to leak query/state concerns into the design system (violates the state-ownership boundary above) | Low — stays a documentation/Recipe concern, state stays in the app | N/A | N/A |
| Accessibility | Would need to re-solve focus/dismiss/labeling already solved by Popover/Drawer/Tag | Inherits already-solved a11y contracts from the composed primitives | N/A | N/A |
| Responsive behavior | Would need to bake in a Popover-vs-Drawer switch itself | Natural — pattern doc just says "Popover on desktop, Drawer on mobile" | N/A | N/A |
| Agent Kit clarity | Another surface to keep consistent with Select/Combobox/Checkbox guidance | Docs/Recipe guidance is simpler for agents to apply correctly than a bespoke schema-driven API | N/A | N/A |
| Figma implications | Would need a monolithic component set for what is inherently compositional — poor fit | None required beyond existing primitives' own Figma status | N/A | N/A |
| Maintenance | High — a speculative, schema-driven API is exactly the kind of thing that needs a breaking rework once real usage appears | Low | N/A | N/A |
| Testing | High — every field-type permutation | Scoped to whatever a validated Recipe actually specifies | N/A | N/A |
| Usefulness across products | Uncertain — filter needs vary enough across products (SaaS dashboard vs. CRM vs. catalog) that one rigid component risks fitting none of them well | High — the underlying controls already serve all of them; only the arrangement is product-specific | N/A | N/A |
| **Verdict** | **Not justified** | **Selected direction** | **Not needed — audit found no missing primitive that blocks composition** | **Valid for the *formalization* step, not the architecture-class decision** |

### Final decision: **B — Composition pattern, not a standalone component**

- **Product rationale:** the recurring need is real (SaaS dashboards), but it is a need for *arrangement* of existing controls, not for a missing atomic control.
- **Semantic rationale:** ten distinct product shapes were identified; six are pure composition or already-covered primitives, and the remaining four (Data Table filters, facet counts, saved filters, rule builder) are application logic the design system should not own. No single "Advanced Filters" component could coherently represent all ten without either an overly rigid schema or scope creep into application logic.
- **Architecture rationale:** every control a filter UI needs already exists; a standalone component would mostly re-wrap working primitives behind a new, speculative, schema-driven API — exactly the kind of premature abstraction that tends to need a breaking rework once real usage appears (see Architecture comparison).
- **Accessibility rationale:** unlike CE-2D's Multi Select conclusion, the accessibility requirements here are **already addressable** using each composed primitive's existing, documented focus/dismiss/labeling contracts (Popover, Drawer, Tag) — no new ARIA pattern needs to be invented, so accessibility is not what's blocking a decision here (state-ownership and premature-abstraction risk are).
- **Figma rationale:** no monolithic Figma component set is warranted for something inherently compositional; existing primitives' own Figma status is unaffected. If a mobile bottom-sheet `DrawerPlacement` is ever wanted, that is a separate, narrow Figma+React extension to Drawer, not part of Advanced Filters.
- **Agent Kit rationale:** guidance/docs (and eventually a Recipe) that says "compose SearchField/Select/Checkbox/CalendarGrid inside Popover (desktop) or Drawer (mobile), represent active selections as removable `Tag`s, keep query state in the app" is both more accurate and easier for a coding agent to apply correctly than a bespoke schema-driven `<AdvancedFilters />` API would be.

### Proposed composition outline — PROPOSED PATTERN, NOT IMPLEMENTED

No exports created. Conceptual composition categories only, for a **future** Recipe/docs guidance once validated:

- **FilterBar** — a row layout composing `SearchField` + one or more `Select`/`Toggle Group`/`Combobox` filter controls + a trigger `Button` for less-common filters.
- **FilterPopover** / **FilterDrawer** — the same filter-control composition inside `Popover` (desktop) or `Drawer` (mobile), switched responsively; not a new component, a documented arrangement.
- **ActiveFilters** — a row of removable `Tag`s reflecting currently-applied filter values, each `onRemove` clearing that one filter.
- **ClearFilters** — a plain `Button` clearing all active filters at once.

None of these should become React exports unless a Recipe is written and Reference App usage validates the shape — see Reference App relevance below.

### Recommended future representation (Agent Kit)

**Docs composition guidance now (if anything) → future Recipe once validated by Reference App usage.** Not a new component contract (there is no new component), not a Recipe yet (Recipes are for *validated* composition per this project's own convention — CE-2D and CE-2C both avoided publishing under-specified surfaces), not a Feature Kit (too early — Feature Kits group existing validated Recipes). **No Recipe or Feature Kit was added in this task**, per explicit instruction.

### Figma recommendation

**Feature-kit/pattern-level guidance, not a Figma component set, and not now.** Advanced Filters is inherently compositional (see shape audit) — a monolithic Figma "Advanced Filters" component would misrepresent it as one primitive when it's an arrangement of several. If/when formalized, the right Figma artifact (if any) is an *example/reference frame* showing the composition, matching how Skrewww already treats compound patterns — not a new component set.

### Reference App relevance

**Yes — likely a better evidence source than building or documenting a pattern speculatively now.** A real dashboard/admin screen in the upcoming Reference App would surface the actual filter-field mix, whether Apply is immediate or explicit, and whether the left-only Drawer placement is sufficient for a real mobile filter panel — all open questions this audit could not resolve from first principles alone. **Recorded as a Reference App validation target.** Not started in this task.

## Next CE-2 candidate

Multi Select is **deferred, not rejected** (CE-2D). Advanced Filters is **not a standalone component** (CE-2E) — removed from the direct component-implementation queue while its product need is preserved as a future composition/Recipe target.

**Stepper** (score 23) is the next actual component candidate — **report only, NOT STARTED**.

## Out of scope

CE-3 `/r`, Reference App, PH-0, Guard, Figma writes, banking Class D work, PARTIAL parity fixes, implementing Multi Select, modifying Combobox, implementing Advanced Filters, modifying Data Table, adding Recipes, adding Feature Kits, implementing Stepper / Notification Center / Command Palette / App Shell.
