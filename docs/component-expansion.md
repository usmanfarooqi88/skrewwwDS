# CE-2 component expansion prioritization

> **CE-2A** · Verified 2026-09-14 · Post CE-1 (`e134d9b`) · Class B = 0
> **CE-2B** Number Input ✅ (`eaba1e7`)
> **CE-2C** Toggle Group ✅ — Segmented Control **RESOLVED BY TOGGLE GROUP**
> **CE-2D** Multi Select audit ✅ — **DEFERRED (decision D)**, not implemented
> **CE-2E** Advanced Filters audit ✅ — **decision B, composition pattern (future Recipe, Reference-App-evidenced)**, not implemented
> **CE-2F** Stepper audit ✅ — **decision B, compound Stepper + Step justified**, proposed contract only, not implemented (**still pending Figma/MCP verification — not rejected or deferred**)
> **CE-2G** Notification Center audit ✅ — **decision C, composition pattern (future Recipe, Reference-App-evidenced)**, not implemented
> **CE-2H** Command Palette audit ✅ — **decision C, composition pattern**, accessibility role model flagged as genuinely unresolved (not just deferred to a Recipe), not implemented
> **CE-2I** App Shell / richer navigation audit ✅ — **decision D, Reference-App template first** (a narrower "responsive primary navigation" composition is separately already proven in-house and C-ready), not implemented; **CE-2 planning pass recommended to pause here**
> **CE-2J** Stepper Figma/MCP verification ✅ — **decision B, READY WITH NARROWER CONTRACT** (`orientation` and `Step.description` dropped, zero Figma evidence; everything else verified live against `Navigation/Step Item` node `2024:2944`). Still not implemented — verified contract ready for CE-2K.
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
| **Stepper** | B | Medium for checkout/onboarding/setup-wizard flows — already anticipated by 3 shipped components' own docs (Breadcrumb, Timeline) and a Navigation-category status note | Live-verified `Navigation/Step Item` (node `2024:2944`) + `Stepper Trail (example)` frame (node `2024:2949`), Timeline's position-derived-state precedent, ToggleGroup/ToggleGroupItem's compound-children precedent | Medium | Low (state model, tokens, and a11y guidance all live-verified) | **23** | **P1 / READY** | **VERIFIED NARROW CONTRACT — READY FOR CE-2K (CE-2J decision B)** | See CE-2J audit below. Compound Stepper + Step, `orientation` and `Step.description` dropped (no Figma evidence); everything else live-verified against Figma, not implemented yet |
| Notification Center | C | Medium for SaaS — **removed from the direct component-implementation queue** | List Item (already documented for "activity feeds"), Popover/Drawer, Button/Icon Button, Badge (already documented for "count indicators"), EmptyState | N/A — not a component | N/A — not a component | **21** | — | **NOT A STANDALONE COMPONENT (CE-2G decision C)** | See CE-2G audit below. Composition pattern using existing primitives; future Recipe pending Reference App evidence, not implemented |
| Command Palette | C | Medium for power-user/developer apps — **removed from the direct component-implementation queue** | Menu (`MenuItem`/`MenuGroup`/`MenuLabel`/`MenuSeparator` already cover icon/shortcut/group/disabled), Dialog, Popover, SearchField, EmptyState | N/A — not a component | Unresolved for the searchable/filtered shape — no casual combination of `menu`/`listbox`/`combobox` roles | **20** | — | **NOT A STANDALONE COMPONENT (CE-2H decision C)** | See CE-2H audit below. A non-searchable "quick actions" shape is already fully buildable from Menu today; the searchable/filtered shape has a genuinely unresolved accessibility role question, not just a documentation gap |
| App Shell / richer nav | D | Medium, but irreducibly app-specific for the "big shell" shapes (routing/permissions/workspace state) — **removed from the direct component-implementation queue** | Breadcrumb, Tabs, Menu, Avatar, Badge, Drawer (already proven for mobile nav in Skrewww's own site), Button/Icon Button, SearchField | Very high for a full shell; low for the already-proven responsive-nav slice | Medium | **16** | — | **REFERENCE-APP TEMPLATE FIRST (CE-2I decision D)** | See CE-2I audit below. The mobile-drawer + sidebar-nav pairing already works in Skrewww's own site and is separately C-ready as composition guidance; the broader shell/template shapes need real routing/permissions evidence from a Reference App |

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

## CE-2F — Stepper product + architecture audit (decision B — compound Stepper + Step justified, proposed contract only)

**Audit only. Stepper was not implemented in CE-2F.** This is a **product/process step indicator** — explicitly not Number Input's increment/decrement steppers, which are an unrelated, already-shipped concept sharing only the word "stepper."

### Existing capability audit

- **`step-item`** (`content/navigation.ts`) — a real, already-authored content entry: *"Step Item is a single step within a multi-step Stepper, showing progress through a linear process (checkout, onboarding, setup wizard)."* Specifies `variants: State (Completed/Current/Upcoming) — 3 variants`, `accessibility: aria-current="step" on the active step, ideally an aria-label summarizing "Step 3 of 5,"` `commonMistakes: Allowing users to click ahead to Upcoming steps that require earlier steps first`, and `properties: State as variants — structurally verified so only Completed shows a checkmark. Label (text), per-state Number (text).` Marked Class **C** (internal building block) in `docs/component-inventory.md`, Figma-verification status **"docs-only"** — i.e. authored content, never independently confirmed against a live Figma node via MCP (unlike, e.g., Combobox's confirmed-then-removed Multi-select property).
- **Already publicly anticipated by three other shipped surfaces**: Breadcrumb's own docs (`whenNotToUse: "...linear step progress (use Stepper)"`, `commonMistakes: "Using Breadcrumb as a progress Stepper"`), Timeline's own docs (`whenNotToUse: "A fixed, known-length linear process with progress state — use Step Item"`), and a registry-level FAQ already comparing Breadcrumb vs. Stepper (`lib/component-registry-navigation.ts`). The Navigation category page's own status note already tells visitors *"Sidebar, Stepper, and Top Navigation items remain documentation-only"* — a real, existing, publicly-visible gap statement, not one invented for this audit.
- **Progress Bar** — quantitative (`role="progressbar"`, percentage), explicitly lists "multi-step completion" as a use case but only as a raw percentage, not a labeled sequence of named steps.
- **Tabs** — peer content views (`tablist`/`tab`/`tabpanel`), switches what's shown, not a progress/sequence indicator.
- **Breadcrumb** — hierarchy/location, not a linear sequence with completion state.
- **Pagination** — page navigation within a result set, not a fixed named sequence.
- **Timeline** — chronological event history (open-ended, timestamped), explicitly distinguished from a *"fixed, known-length linear process with progress state"* by its own docs.
- No existing component owns "a fixed, known-length, linear sequence of named steps with completed/current/upcoming state." This gap is real, not manufactured, and — unusually for this project's CE-2 audits — already substantially specified rather than blank.

### Stepper use-case taxonomy (not bundled into one API)

1. **Linear progress stepper** (fixed named steps, no per-step content shown) — the shape `step-item`'s content actually specifies.
2. **Multi-step form/wizard** — same visual shape, paired with app-owned form/routing logic outside Stepper.
3. **Checkout flow** / 4. **Onboarding flow** / 7. **Approval process** — same shape, different app context; not separate APIs.
5. **Status/process tracking without user navigation** (read-only) — same shape, `onStepClick` simply omitted.
6. **Clickable navigation between completed/current steps** — same shape, `onStepClick` provided, scoped only to Completed/Current per `step-item`'s own "don't let users click ahead" guidance.
8. **Vertical process/timeline-like stepper** — **no evidence** of this need anywhere in current docs/content; not part of the proposed v1 contract (see Orientation below). This is deliberately **not** the same thing as Timeline, which already owns open-ended chronological history.

Shapes 1–7 are one visual/interaction contract used in different app contexts — not unrelated visualizations bundled together. Shape 8 is excluded from v1 pending evidence.

### Semantic boundary

- **Progress** = quantitative (a percentage/fraction), no per-item identity.
- **Tabs** = peer views, switches what's displayed, no ordering/completion semantics.
- **Breadcrumb** = hierarchy/location within nested structure, not a fixed linear sequence.
- **Pagination** = navigating a result set's pages, no notion of "completed."
- **Timeline** = open-ended chronological *history* of events, not a fixed known-length forward process.
- **Stepper** = a fixed, known-length, ordered sequence of named steps with Completed/Current/Upcoming state. Distinct from all five on at least one axis (fixed-length vs. open-ended, qualitative-named-steps vs. quantitative percentage, forward-progress vs. peer-switching, sequence vs. hierarchy). The boundary is not fuzzy, and three already-shipped components' own docs already draw it.

### Product need

Real, and better evidenced than either CE-2D (Multi Select) or CE-2E (Advanced Filters) had at this point: checkout/onboarding/setup-wizard/multi-page-form/booking/approval-process flows are common, recurring SaaS patterns, and — unlike a generic "other systems have one" justification — this project's **own** docs across three shipped components already reference Stepper as the intended answer, and the Navigation category page already tells visitors it's a known, documentation-only gap. Not tied to a currently-shipped Skrewww industry vertical (no direct KYC/banking-application-flow content found), so the need is general-SaaS rather than Skrewww-specific-industry evidence — still real, not manufactured.

### Interaction model

Read-only by default. Optional navigation should be a plain callback (`onStepClick?: (index: number) => void`), restricted to Completed (and reasonably Current) steps — never Upcoming, per `step-item`'s own explicit guidance. **Stepper does not own routing** — the app decides what `onStepClick` does (navigate, change local wizard state, etc.); Stepper never renders an `href` or performs navigation itself. This mirrors Breadcrumb's `items` carrying `href`s for actual page navigation vs. a callback-only model here, because Stepper steps are typically *not* independently addressable pages the way breadcrumb ancestors are — an open question worth confirming during implementation, not resolved by assumption here.

### State model — smallest useful set

**Completed / Current / Upcoming — exactly the three states `step-item`'s own content already specifies**, computed **structurally from position** (`index < currentStep` → Completed, `index === currentStep` → Current, `index > currentStep` → Upcoming) rather than manually assigned per step — matching this codebase's own established precedent (Timeline's docs explicitly warn against coupling visual state to a manually-set flag instead of real list position). **Error, optional, skipped, and disabled-individual-step states are deliberately excluded from v1** — no product evidence in this codebase supports them; they would be a documented future extension only if a real use case surfaces (e.g. via Reference App), not spectulated now.

### Accessibility findings

- Ordered list semantics (`role="list"`/`<ol>`), matching Timeline's real-list convention.
- `aria-current="step"` on the Current step only — already specified in `step-item`'s content, a real (if unverified-in-Figma) ARIA pattern, not invented here (WAI-ARIA `aria-current` explicitly includes a `"step"` token for exactly this use case).
- Each step needs an accessible summary along the lines of "Step 3 of 5: Shipping," per `step-item`'s own guidance.
- Completed steps, only if `onStepClick` is provided, should render as real interactive elements (native `<button>`, matching this codebase's established preference for real interactive elements over `div`+`onClick` everywhere else); Upcoming steps must never be focusable/interactive.
- State must not be conveyed by color alone — `step-item`'s own spec already builds this in structurally (Completed swaps to a checkmark instead of a number; Current/Upcoming keep numbers), not merely a color change.
- `focus-visible` on interactive Completed/Current steps, matching the established token convention used by Toggle Group/Tabs/etc.
- No custom ARIA roles needed — `aria-current="step"` plus a real ordered list plus (optionally) real buttons covers this cleanly with standard semantics.

### Orientation and responsive implications

**Horizontal only for a first contract.** No evidence anywhere in current docs/content supports a vertical variant being a real product requirement today — `step-item`'s own `variants` field lists only the three states, no orientation axis. Vertical is a plausible **later** extension, not assumed automatically (per explicit instruction). **Responsive behavior for long flows (5, 8+ steps) is a genuine, honest gap**: nothing in current content addresses label truncation, a condensed "Step 3 of 5" fallback, or horizontal overflow on narrow viewports. This is recorded as an open question for a future implementation to resolve with real evidence (ideally from Reference App usage) — not invented here, and explicitly not a "mobile carousel" or new responsive-container primitive.

### Architecture comparison

Per this task's own stated preference criteria (keep routing external, preserve flexible content, avoid huge config objects, clear Agent Kit usage, clean accessibility):

| | Option A — config-array (`steps={[...]}`) | **Option B — compound `<Stepper><Step/></Stepper>`** | Option C — composition from existing primitives |
|---|---|---|---|
| Application routing | Must be threaded through config objects (e.g. `steps[i].href` or `.onClick`) | Stays external — `onStepClick(index)` callback only, app decides what happens | N/A — no dedicated abstraction at all |
| Flexible per-step content | Constrained to whatever shape the config object allows | Full `ReactNode` per `<Step>` child — icons, rich labels, descriptions | N/A |
| Config-object size | Grows with every new per-step need (label, description, icon, href, disabled...) — the exact anti-pattern this task warns against choosing "merely because it is concise" | None — each `<Step>` is its own element | N/A |
| Agent Kit clarity | An agent must learn one array-item schema | An agent already knows this shape from `ToggleGroup`/`ToggleGroupItem` (CE-2C) — direct precedent in this same codebase | Requires bespoke per-use guidance each time |
| Accessibility | Still achievable, but state/ARIA logic lives awkwardly split between the array and the renderer | State computed once in `Stepper` from `currentStep` + child position, matching Timeline's position-derived-state precedent | Would have to be re-solved per composition instance |
| **Fit** | Weaker — Breadcrumb already uses this shape for genuinely different data (real addressable `href`s per ancestor) | **Best fit** — matches this project's own most recent precedent (Toggle Group) and keeps routing external cleanly | Not viable — no missing primitive combination cleanly represents "structurally-derived Completed/Current/Upcoming state," this is exactly what a small compound component is for |

### Final decision: **B — compound `Stepper` + `Step` is justified**

- **Product rationale:** real, recurring need (checkout/onboarding/wizard/approval flows), and unusually well-evidenced for a CE-2 audit — three shipped components' own docs and a public category status note already anticipate it.
- **Semantic rationale:** owns a distinct role (fixed-length, named, ordered, completion-stateful) that Progress/Tabs/Breadcrumb/Pagination/Timeline each fail to cover on a different axis; the boundary was already partly drawn by this codebase's own existing docs, not invented here.
- **Interaction rationale:** a narrow, callback-only navigation model (`onStepClick`, Completed/Current only) keeps routing/business-flow ownership with the consuming app, per explicit instruction.
- **Accessibility rationale:** unlike CE-2D's Multi Select, the accessibility model is **not the blocker** — `aria-current="step"`, ordered-list semantics, and non-color state are already specified in real content and require no invented ARIA.
- **Architecture rationale:** compound children (Option B) directly matches this codebase's own most recent precedent (`ToggleGroup`/`ToggleGroupItem`, CE-2C) and avoids the config-object anti-pattern this task explicitly warns against.
- **Figma rationale:** existing `step-item` content is real and detailed but explicitly **unverified against the live Figma file** ("docs-only" status) — safer to reconcile it via an MCP verification pass before implementation than to either blindly trust unverified content or discard it and start over.
- **Agent Kit rationale:** a genuine component contract would be appropriate once built (this is a true primitive, not a wizard-specific pattern) — but not created in this audit.

### Proposed contract — PROPOSED, NOT YET IMPLEMENTED

- **Responsibility:** visual, accessible display of progress through a fixed, known-length, linear sequence of named steps. Does **not** own routing, form state, or business-flow logic.
- **Tentative API:** `<Stepper currentStep={number} orientation="horizontal" aria-label="..." onStepClick?={(index) => void}>` composed with `<Step>{children}</Step>` (optional `description` prop). Exact `currentStep` indexing convention (0- vs. 1-based) left as an open implementation question, not decided speculatively here.
- **Selected/state model:** Completed / Current / Upcoming, computed structurally from `index` vs. `currentStep` — no manually-assigned per-step state prop, no Error/optional/skipped states in v1.
- **Current/completed/upcoming behavior:** Completed → checkmark + (if `onStepClick` provided) real interactive `<button>`; Current → number + `aria-current="step"` + visual emphasis; Upcoming → number, muted, never interactive.
- **Interactive vs. read-only:** read-only unless `onStepClick` is provided; even then, restricted to Completed (and reasonably Current) — Upcoming is never clickable.
- **Orientation:** horizontal only in v1; vertical is a later, non-blocking extension pending evidence.
- **Accessibility:** ordered list (`role="list"`/`<ol>`), `aria-current="step"` on Current, per-step accessible summary ("Step 3 of 5: Shipping"), real `<button>` for interactive steps, no color-only state, `focus-visible` on interactive steps.
- **Shape/Surface:** reuse existing semantic/component connector-line and step-chrome tokens (following Timeline's connector-line and Toggle Group's joined-chrome precedent) — no new hardcoded colors.
- **Responsive behavior:** **open question, not resolved here** — needs real evidence (ideally Reference App) for how 5–8+ steps should degrade on narrow viewports before implementation locks in an approach.
- **Maturity:** Beta, `0.1.0-beta`, matching this project's established convention for net-new CE-2 components.
- **Testing plan (for a future implementation, not run now):** render/labeling; state derivation from `currentStep` (Completed/Current/Upcoming) across boundary positions; `aria-current="step"` placement; checkmark-only-on-Completed; `onStepClick` fires only for Completed/Current, never Upcoming; Upcoming steps have no `tabindex`/are not `<button>`; keyboard Tab order visits only interactive steps; `focus-visible` on interactive steps; no color-only state change (verify icon/text differs); horizontal-only in v1; a narrow-viewport browser test documenting actual overflow behavior rather than assuming a fix.

### Figma recommendation

**Reconcile via an MCP verification pass on the existing `step-item` content before implementation** — a middle path between CE-2B/CE-2C's pure React-first (which had zero prior Figma anticipation) and CE-2D's Multi Select conclusion (design-first required, because no real spec existed at all). Here, real content already exists and is unusually well-specified for a not-yet-implemented item, but its Figma-verification status is "docs-only" — never confirmed against the live file the way Combobox's now-removed Multi-select property was. Confirming (or correcting) this content against the real Figma file first avoids either blindly trusting unverified content or wastefully discarding genuinely useful existing work.

### Agent Kit recommendation

**A component contract, once built** — Stepper is a true reusable primitive (not a wizard-specific composition the way Advanced Filters was), so it warrants the same contract treatment as any other component (comparisons distinguishing it from Progress Bar/Tabs/Breadcrumb/Pagination/Timeline, real `apiProps` only). **No Agent Kit artifact was added in this audit**, per explicit instruction.

### Reference App relevance

**Yes, as a refinement source, not a precondition.** Unlike CE-2D (where Reference App evidence was needed to determine *whether* a hard accessibility problem was worth solving at all) or CE-2E (where it would validate an entire pattern shape from scratch), here the core contract is already reasonably well-specified from existing content. A real onboarding/settings wizard in the future Reference App would still be valuable for: confirming real step counts (testing the responsive-overflow open question), confirming whether back-navigation to Completed steps is actually wanted in practice, and validating the `currentStep` indexing convention against a real consumer. **Recorded as a Reference App validation target**, not started here.

## CE-2G — Notification Center product + architecture audit (decision C — composition, not a component)

**Audit only. Notification Center was not implemented in CE-2G.**

### Existing capability audit

Every atomic piece a notification UI needs already exists — an even richer overlap than CE-2E's Advanced Filters audit found:

- **List Item** (`components/ui/ListItem.tsx`) — `title`, `description`, `metadata`, `leading`, `trailing`, `href`/`onClick`, `disabled`. Its own content entry's purpose text: *"A single row in a list showing an avatar, title/subtitle, and trailing metadata — **the standard pattern for activity feeds and contact lists**."* A notification row is an activity-feed row; this is a near-exact structural match already, not an approximation: `leading` → avatar/icon, `title` → notification text, `description`/`metadata` → detail/timestamp, `trailing` → unread marker or action.
- **Badge** — own docs: *"count indicators"* explicitly listed as a use case, directly covering an unread-count badge on a bell trigger.
- **EmptyState** — *"Any list/table/collection view when it has zero items"* — directly covers a "no notifications" state, already generic and reusable.
- **Popover** — *"a small set of related options not needing Dialog's attention-commanding weight"* — fits a compact notification dropdown from a bell trigger.
- **Drawer** — own docs already say `whenToUse: "Settings panels, filters, secondary forms"` (same citation CE-2E used) — a reasonable, if not perfectly-worded, fit for a heavier/mobile notification panel.
- **Toast** — explicitly *transient* (own docs: "typically auto-dismissing after a few seconds") — the opposite of a persistent notification list; correctly a different, already-solved concern, not something Notification Center should re-implement or subsume.
- **Alert** — persistent but *contextual/inline* (tied to the page content it annotates), not a collected list of discrete notification events — a different concern again.
- **Menu** — action/command semantics (`role="menu"`/`role="menuitem"`), not the right container for a list of readable, individually-focusable notification rows.
- **Button/Icon Button** — bell trigger, mark-all-read action.
- **No dedicated content entry exists for "Notification Center" or "Notification Item"** anywhere in `content/*.ts` — unlike CE-2F's Stepper audit, which found a real, detailed `step-item` content entry with states/a11y already specified. The only prior evidence is a generic mention ("notification center") in `docs/component-inventory.md`'s Reference-app-readiness table for the SaaS dashboard archetype, at the same evidence level CE-2E's Advanced Filters had — not the richer, pre-specified level CE-2F found.

### Notification product-shape taxonomy (not one component)

1. **Transient toast** — already solved, out of scope (`Toast`).
2. **Inline alert** — already solved, out of scope (`Alert`).
3. **Notification bell trigger** — composition: `Button`/`Icon Button` + `Badge`.
4. **Unread-count badge** — composition: `Badge`, already documented for "count indicators."
5. **Notification popover** — composition: `Popover` wrapping a list of `ListItem` rows.
6. **Full notification page** — composition: a plain page composing `ListItem` rows, no special container needed at all.
7. **Grouped notifications** (e.g. "Today" / "Earlier") — composition: a heading + `ListItem` rows per group; no new primitive.
8. **Read/unread states** — a `ListItem` usage convention (see below), not a new component.
9. **Mark-as-read** — a `ListItem` `trailing`-slot `onClick`, or the row's own `onClick`.
10. **Clear/delete** — a `ListItem` `trailing`-slot `Button`/`Icon Button`.
11. **Notification preferences** — **application feature**, a settings form built from existing form components (Switch/Checkbox/FormField) — has nothing distinctly "notification" about it as a UI concern.
12. **Real-time delivery** — **application/backend concern entirely**, explicitly out of any design-system scope (see State ownership below).

Shapes 1–2 are already solved by existing components and are not part of this scope. Shapes 3–10 are composition using existing primitives, with no missing piece. Shapes 11–12 are application logic the design system should not own.

### Semantic boundary

- **Toast** = transient, auto-dismissing, not part of a persistent list.
- **Alert** = persistent but page-contextual, tied to specific page content it annotates.
- **Menu** = actions/commands, not a readable list of past events.
- **Popover/Drawer** = presentation containers, not notification-specific — reused as-is, not duplicated.
- **Badge** = a status/count indicator, already covers the unread-count need directly.
- **Notification Center** would need to own a real, distinct semantic structure beyond simple composition to justify a new component. It does not: the item shape is already `ListItem`'s documented "activity feed" pattern, the container is already `Popover`/`Drawer`, the count is already `Badge`, the empty state is already `EmptyState`. Unlike CE-2F's Stepper (where `Step Item`'s Completed/Current/Upcoming state machine and `aria-current="step"` genuinely did not exist anywhere else), nothing here requires new semantics — only a specific, nameable **arrangement** of existing ones.

### Product need

Real for SaaS dashboards, banking/admin apps, project management, and team-collaboration tools — collecting system/activity events for a user to review is a genuinely cross-product pattern, not manufactured. But — same caveat as CE-2E's Advanced Filters — the recurring need is for **arrangement**, not for a missing atomic control, and (like Advanced Filters) it is named only generically in this project's own readiness tracking ("notification center" as a SaaS-dashboard gap), not backed by a dedicated content entry the way Stepper was.

### State ownership boundary

Skrewww should **not** own: realtime sockets, push delivery, a notification backend, persistence, a read-state database, user-preferences storage, polling, API fetching, authorization, or analytics — all of that is squarely consumer-application concern, and notably more numerous/heavier concerns than Advanced Filters' equivalent list. Its responsibility, if a Recipe is eventually written, stops at: notification-item structure (already `ListItem`), read/unread visual treatment (a `ListItem` usage convention), timestamp placement (`ListItem`'s `metadata` slot), avatar/icon slot (`ListItem`'s `leading` slot), action affordances (`trailing` slot `Button`s), list grouping (a heading + `ListItem` rows), empty state (`EmptyState`), and container composition (`Popover`/`Drawer`). Local UI state — e.g. whether the popover is currently open — is a reasonable pattern-level concern; persisted/fetched/realtime state is not.

### Notification Item question (Part 6) — answered directly

**The real missing primitive is not Notification Center, and it is not even a new "Notification Item."** `ListItem`'s existing shape (`leading`/`title`/`description`/`metadata`/`trailing`/`href`/`onClick`) already represents a notification row cleanly, and its own content entry already names "activity feeds" as the intended use case. No new item component is justified — this is squarely a `ListItem` **usage convention** (which slot carries which notification field, how unread is visually marked), not a new export.

### Read/unread semantics

- **Unread visual marker**: a small dot/indicator (e.g. in `ListItem`'s `leading` or as a prefix) **paired with** a font-weight or text-color change on the title — per this codebase's own established "no reliance on color alone" convention (mirrored elsewhere: Toggle Group's `aria-checked` + surface change, Step Item's checkmark swap, not just a color).
- **Accessible description**: since `ListItem`'s own accessibility guidance already requires a clickable row to be one real link/button, an unread row's accessible name should include a non-visual "(unread)" cue (e.g. visually-hidden text appended to the row's accessible name) rather than relying on the visual dot alone.
- **Mark-as-read**: a plain `Button`/`Icon Button` in the `trailing` slot, or the row's own `onClick` — app-defined behavior, not a Notification-Center-owned state machine.
- **Unread count / all-read state**: `Badge` already covers the count; "all read" is simply the count reaching zero or the badge being hidden — application state, not a new design-system concept.
- Visual read/unread treatment does **not** imply persistence — it reflects whatever state the application currently passes in; the design system holds no opinion on how "read" is determined or stored.

### Accessibility findings

- List semantics: an ordered or unordered list (`role="list"`) of `ListItem` rows, matching this codebase's established list-primitive convention (Timeline, Tree View).
- Group headings (e.g. "Today"/"Earlier"): plain headings, no new pattern needed.
- Unread-state announcement: the "(unread)" accessible-name cue above; no aggressive `aria-live` announcement of new arrivals is recommended — that depends entirely on the app's actual delivery mechanism (websocket vs. polling vs. none), which this audit has no evidence for. **Explicitly recommend against adding `aria-live="polite"`/`"assertive"` behavior without real evidence of how notifications actually arrive in a consuming app** — exactly the caution this task's own instructions call for.
- Mark-all-read: a plain, labeled `Button`.
- Popover/Drawer focus management: already solved by those components' own existing, documented contracts (focus trap for Drawer, dismiss-on-Escape/outside-click for Popover) — nothing new to invent.
- Empty-state announcement: `EmptyState`'s existing pattern applies as-is.
- No custom ARIA roles needed anywhere in this composition.

### Container model

**Notification Center should not own its own container.** Desktop: `Popover` for a compact bell dropdown, or a plain page (no special container) for a full notification page. Mobile: `Drawer`, or the same plain full page. This strongly avoids duplicating `Popover`/`Drawer` — the composition guidance is simply "use the existing container that fits the surface," not a new responsive-container primitive.

### Data model (component props vs. application domain model)

A `ListItem` usage for a notification needs only its existing props (`title`, `description`/`metadata`, `leading`, `trailing`, `href`/`onClick`) — **not** a new domain-shaped schema (`id`, `userId`, `read_at`, `notification_type`, `payload`, `created_at`, etc.). Mapping an application's real notification data model onto `ListItem`'s existing generic props is entirely the consuming app's responsibility; the design system does not become a domain DTO library.

### Architecture comparison

| | A — standalone `<NotificationCenter notifications={...}/>` | B — compound `NotificationCenter` + `NotificationItem` | **C — composition (Popover/Drawer + ListItem + Badge + Button + EmptyState)** | D — Reference App / application pattern only |
|---|---|---|---|---|
| Reuse | Low — re-wraps an already-solved item shape (`ListItem`) | Medium — still re-specifies an item shape `ListItem` already covers | High — zero new exports | N/A |
| API complexity | High — would need a domain-shaped `notifications` array prop, the exact anti-pattern Part 10 warns against | Medium — a new `NotificationItem` API duplicating `ListItem`'s existing slots | None — no new API surface | N/A |
| Data coupling | High — a config-array API tends to accept application-shaped data directly | Medium | Low — stays a documentation/Recipe concern | N/A |
| Accessibility | Re-solves focus/list/empty-state semantics already solved elsewhere | Same, partially | Inherits already-solved contracts from `ListItem`/`Popover`/`Drawer`/`EmptyState` | N/A |
| Agent Kit clarity | Another surface to keep consistent with `ListItem` guidance | Same risk, smaller | Guidance ("compose ListItem inside Popover/Drawer, Badge for count, EmptyState for zero") is simpler to apply correctly | N/A |
| Figma implications | Needs a monolithic component set for an inherently compositional feature | Needs two new component sets duplicating `List Item`'s real anatomy | None beyond existing primitives | N/A |
| Maintenance | High — speculative schema-driven API | Medium — new item component with no genuinely new semantics to justify it (unlike `Step Item`'s real state machine) | Low | N/A |
| Testing | High | Medium | Scoped to whatever a validated future Recipe specifies | N/A |
| **Verdict** | **Not justified** | **Not justified — `ListItem` already owns the item shape cleanly; no genuinely new semantics like `Step Item`'s state machine exist here** | **Selected direction** | **Valid for the *formalization* step, not the architecture-class decision — same relationship as CE-2E** |

### Final decision: **C — composition/pattern using existing primitives, not a standalone or compound component**

- **Product rationale:** the need is real (SaaS/admin/collaboration activity review) but is for *arrangement*, not a missing atomic control — matching CE-2E's Advanced Filters conclusion, not CE-2F's Stepper conclusion.
- **Semantic rationale:** no distinct semantic structure is missing — `ListItem` already owns "activity feed row" by its own documented purpose, `Badge` already owns "count indicator," `EmptyState` already owns "zero items." Unlike Stepper's `Step Item` (a real Completed/Current/Upcoming state machine that existed nowhere else), nothing here is semantically new.
- **State-ownership rationale:** the list of things Skrewww should not own here (realtime sockets, push delivery, backend, persistence, read-state database, preferences storage, polling, auth, analytics) is long and squarely application-side — a standalone component would be under constant pressure to grow data-fetching/realtime concerns it should never own.
- **Accessibility rationale:** fully addressable today via each composed primitive's already-solved contracts (`Popover`/`Drawer` focus, `ListItem`'s real-link/button rule, `EmptyState`'s pattern); the one genuinely open question (live-arrival announcements) is correctly left unresolved pending real delivery-mechanism evidence, not invented.
- **Architecture rationale:** both standalone (A) and compound (B) would re-specify an item shape `ListItem` already covers cleanly — a premature abstraction, not a missing-primitive problem.
- **Figma rationale:** no monolithic or compound component set is warranted for something inherently compositional with no new item-level anatomy to design.
- **Agent Kit rationale:** composition guidance ("bell = Button + Badge; panel = Popover/Drawer; rows = ListItem with leading=avatar, metadata=timestamp, trailing=unread/action; empty = EmptyState") is more accurate and easier for a coding agent to apply correctly than a new, data-coupled component API would be.

### Proposed composition outline — PROPOSED PATTERN, NOT IMPLEMENTED

No exports created. Conceptual composition roles only, for a **future** Recipe/docs guidance once validated:

- **NotificationBell** — `Button`/`Icon Button` trigger + `Badge` (unread count), opening a `Popover` (compact) or `Drawer` (fuller/mobile).
- **NotificationList** — an ordered `role="list"` of `ListItem` rows, optionally grouped under plain headings ("Today"/"Earlier").
- **NotificationItem** — not a new export, a `ListItem` **usage convention**: `leading` = avatar/icon, `title` = notification text, `description`/`metadata` = detail/timestamp, `trailing` = unread marker and/or mark-read/clear action.
- **UnreadBadge** — `Badge`, already documented for "count indicators."
- **EmptyNotifications** — `EmptyState`, already documented for "zero items."
- **MarkAllRead** — a plain `Button`.

None of these should become React exports unless a Recipe is written and Reference App usage validates the shape.

### Recommended future representation (Agent Kit)

**Docs composition guidance now (if anything) → future Recipe once validated by Reference App usage** — the same conclusion CE-2E reached for Advanced Filters, for the same reason: Recipes are for *validated* composition in this project's own convention, and nothing here needs a new component contract. **No Agent Kit artifact was added in this audit.**

### Figma recommendation

**Pattern/example, not a component or component set, and not now.** Notification Center is inherently compositional with no new item-level anatomy to specify (`ListItem`'s anatomy already covers it). If/when formalized, an example/reference frame showing the composition — matching how this project already treats compound patterns — fits better than any new component set. Avoids a monolithic Figma set for what is an application-level feature built from existing pieces.

### Reference App relevance

**Yes — likely a better evidence source than documenting a pattern speculatively now.** A real dashboard/settings/activity screen in the future Reference App would surface actual notification density, whether a bell-popover or a full page is the right primary surface, real mobile layout needs, real empty-state copy, and real mark-all-read expectations — all open questions this audit cannot responsibly resolve from first principles alone. **Recorded as a Reference App validation target**, not started in this task.

## CE-2H — Command Palette product + architecture audit (decision C — composition, accessibility role model genuinely unresolved)

**Audit only. Command Palette was not implemented in CE-2H.** Combobox and Menu were not modified.

### Existing capability audit

- **Menu** — already a rich compound system: `Menu`, `MenuTrigger`, `MenuContent`, `MenuItem`, `MenuGroup`, `MenuLabel`, `MenuSeparator`, and a dedicated `MenuShortcut` export. `MenuItem` already supports icon, **keyboard-shortcut display** (`shortcut?: string`, rendered via `.itemShortcut`), destructive styling, disabled state, and `onSelect`. `MenuGroup`/`MenuLabel` already provide grouping and group headings. Roles: `role="menu"` + `role="menuitem"`. **No submenu/nested-command support exists yet** — the registry itself already records this as a known gap: *"Submenus and Context Menu are separate future components."*
- **Combobox** / **Select** — `role="combobox"` + `role="listbox"` + `role="option"`, a **value-selection** model (choosing commits a value). Not touched or modified in this audit, per explicit instruction.
- **Dialog** — `role="dialog"` + `aria-modal="true"`, focus-trapping modal container — a strong fit for the "takes over the screen" global-palette shape.
- **Popover** — non-modal floating panel, dismiss-on-Escape/outside-click — a reasonable fit for a smaller, trigger-anchored "quick actions" shape.
- **SearchField** — text input specialized for search/filter, own docs already say *"Any search/filter input, whether inline in a toolbar or as a page-level search bar"* (the same citation CE-2E's Advanced Filters audit used).
- **EmptyState** — already covers "no results" for any list/collection.
- **No dedicated `content/*.ts` entry, and no other shipped component's docs forward-reference, "Command Palette" anywhere** — the only prior mentions are generic CE-2 planning-doc entries, the same evidence tier as CE-2E/CE-2G, not CE-2F's richer tier.

### Command Palette product-shape taxonomy (not one component contract)

1. **Global app command palette** (search + mixed navigation/action results) — the VS Code/Linear-style shape; carries the real accessibility tension (see below).
2. **Navigation launcher** (search results are routes) — closer in spirit to Combobox/Select's actual "choose a destination" model, though still not literal value-persistence.
3. **Searchable action list** — same tension as shape 1.
4. **Recent commands** — a data/state concern (what was recently used), not a UI shape of its own; composes into whichever container is chosen.
5. **Grouped commands** — **already solved** by `MenuGroup`/`MenuLabel`.
6. **Keyboard-shortcut launcher** (e.g. Cmd/Ctrl+K opens a short, static list of top actions, no live filtering) — **zero new ARIA needed at all**: this is just `Menu`, fully buildable today.
7. **Nested commands/subcommands** — a real, compounding gap: even `Menu` itself doesn't support submenus yet, so this shape isn't achievable through composition today either, independent of the search-semantics question.
8. **Entity search** (e.g. search users/files, then act on the result) — sits closer to Combobox/Select's real selection model, since picking a result is closer to "choosing a value" than shapes 1/3 are.
9. **Contextual editor commands** — application/product-specific, not a general design-system concern.
10. **AI/agent command launcher** — squarely application/business-logic-specific; "AI invocation" is explicitly named in this audit's own state-ownership boundary as something Skrewww should not own.

Shape 6 is fully solved today with zero new work. Shapes 1, 3, and 8 carry the real accessibility question, in decreasing degree (1/3 hardest, 8 closer to an existing pattern). Shape 5 is solved. Shape 7 is blocked independent of the ARIA question by Menu's own already-acknowledged submenu gap. Shapes 4, 9, 10 are data/application concerns, not UI shapes.

### Semantic boundary

- **Combobox** = searchable **value selection** — choosing sets a field's value. Wrong model for shapes 1/3/6 (executing an action or navigating is not "setting a value"), a closer-but-imperfect fit for shape 8.
- **Search Field** = a plain text query input, no attached list/popup of its own.
- **Menu** = an **action-execution** list, already rich (icons/shortcuts/groups/disabled), but with no built-in live-filter/search mechanism and no submenu support.
- **Dialog/Popover** = containers, correctly reused as-is, not duplicated.
- **List/List Item** = readable rows; not the right fit here since `MenuItem` already owns the "executable row with icon/shortcut" structure more precisely than `ListItem` does.
- Command Palette would only need to become a component if it owned a **distinct, reusable interaction contract** beyond composing these — and per the accessibility analysis below, no single clean contract exists for the shapes that actually motivate wanting one (1/3), while the shape that's trivially achievable (6) needs no new contract at all.

### Product need

Real for developer tools, admin tools, and keyboard-heavy productivity apps — genuinely cross-product for that segment, not manufactured, and not justified merely because well-known products (VS Code, Linear, Notion) have one (per explicit instruction, that comparison was not used as the rationale here). But evidence inside this project is at the generic-mention tier (CE-2 planning docs only), same as Advanced Filters/Notification Center, not the richer tier Stepper had.

### State ownership boundary

The heaviest "must not own" list of any CE-2 audit so far: application routing, search backend, command-execution business logic, recent-history persistence, permissions, analytics, **AI invocation**, network requests, and command registration across app modules. This is a strong, compounding signal against a standalone/compound component — a command palette's entire purpose is to reflect app-wide, cross-module state, which is inherently the application's responsibility, not the design system's. Skrewww's responsibility, if a Recipe is eventually written, stops at: the searchable-list interaction shell, group/label rendering (already solved by `MenuGroup`/`MenuLabel`), the highlighted-active-item visual, keyboard navigation within the open list, shortcut-label display (already solved by `MenuItem`'s `shortcut` prop), empty state (`EmptyState`), and Dialog/Popover composition. The app command registry, global open-shortcut registration, and command execution stay entirely external.

### Keyboard model

- **Global open shortcut (Cmd/Ctrl+K)**: **application-owned**, not component-owned — the design system must not register a global `document`-level keydown listener; per explicit instruction, no such listener is proposed here.
- **Arrow Up/Down**: list-navigation concern, owned by whichever list container is used (matches `Menu`'s existing roving-focus/typeahead precedent).
- **Enter**: activates the highlighted item — an execution/navigation effect, app-defined.
- **Escape**: closes the container — already solved by `Dialog`/`Popover`'s existing dismiss behavior.
- **Home/End**: reasonable list-navigation extras, not new semantics.
- **Type-to-search**: belongs to the search input, not the item list — a real, live filter (distinct from `Menu`'s existing typeahead-jump-to-match, which is not a filter).
- **Disabled items**: already solved by `MenuItem`'s existing `disabled` prop.
- **Nested commands**: not resolved — blocked by `Menu`'s own already-acknowledged submenu gap, independent of everything else.
- **Focus return after close**: already solved by `Dialog`'s existing focus-restoration contract.
- **Tab behavior**: within a modal `Dialog`, Tab should stay trapped (already solved); the search-input-to-list relationship (does Tab move focus into the list, or does the list navigate purely via arrow keys with focus staying in the input?) is exactly the kind of decision that depends on which role model is chosen (see below) — not resolved here.

### Accessibility findings — the real blocker, per this task's own explicit caution

**No single clean semantic model emerges for the searchable/filtered shapes (1, 3), and this task's own instructions are explicit: "Do NOT combine `menu`, `listbox`, and `combobox` semantics casually... If no clean semantic model emerges: recommend composition/defer rather than inventing ARIA."** Two real candidate models exist, and neither is a settled, uncontroversial convention:

1. **Reuse `role="combobox"` (search input) + `role="listbox"` + `role="option"`** — matches this codebase's own established Combobox/Select role structure exactly, but "selecting" an option in that pattern conventionally means *persisting a value*, not *executing an action or navigating*. Per this task's own **Command vs. Selection** distinction (Part 8), silently inheriting Combobox's value-selection semantics for something that actually executes a command would be semantically wrong. Using the same role structure while documenting "selecting = activating, not persisting" as an intentional deviation is a defensible, real-world-precedented choice (this is broadly how mature command-palette implementations elsewhere approach it) — but it is a **documented judgment call**, not a clean inherited pattern, and this project has not made that call before.
2. **Reuse `role="menu"` + `role="menuitem"`** — matches the action-execution semantics correctly, and reuses `Menu`'s already-rich `MenuItem`/`MenuGroup`/`MenuLabel`/`shortcut` support directly. But `role="menu"` is conventionally opened by a trigger and does not have an established live-filter/search-box relationship in the WAI-ARIA APG the way `combobox`+`listbox` does — combining a real-time-filtering search input with `menu`/`menuitem` semantics underneath is itself not a standard, pre-solved pattern either.

Neither option is simply "already solved by composing existing primitives" the way Advanced Filters' and Notification Center's accessibility questions were — **this is the one open point in this audit that is closer to CE-2D's Multi Select conclusion than to CE-2E/CE-2G's.** The difference from CE-2D: shape 6 (a non-searchable quick-actions launcher, just `Menu`) is fully clean and buildable today, and shapes 1/3's ambiguity is resolvable with a deliberate, documented role decision rather than being a dead end — but that decision should not be made speculatively in a docs-only audit.

Other findings, all already addressable: screen-reader announcement of result count (a `role="status"` region, matching Combobox's own existing "no-results announcement" convention); group labels (`MenuLabel`, solved); disabled items (`MenuItem.disabled`, solved); empty results (`EmptyState`, solved); focus restoration (`Dialog`, solved); no duplicate/conflicting roles as long as one of the two models above is chosen deliberately, not blended.

### Command vs. selection vs. navigation

Explicitly distinct, per this task's own framing: **Selection** = choosing a value (Combobox/Select's real job). **Command** = executing an action (`Menu`'s real job). **Navigation** = moving to a route/view (arguably a special case of "command"). A Command Palette may contain both commands and navigation items, but **must not silently inherit Combobox's value-selection model** — confirmed above as the crux of the unresolved accessibility question. **Extending Combobox would be semantically wrong** for the command/navigation-execution use case, independent of the fact that this audit was also explicitly forbidden from touching it.

### Container model

**Should not own its own container.** Desktop: `Dialog` (modal, centered/near-top) for the global-palette shape; `Popover` (anchored, non-modal) for a smaller quick-actions shape. Mobile: `Dialog` presented full-screen is the natural existing fit — no new responsive surface is proposed or needed. This strongly avoids duplicating `Dialog`/`Popover`.

### Item model

**The real missing primitive is not a new `CommandItem`.** `MenuItem` already covers label, icon, shortcut, disabled, and an `onSelect` action callback — almost exactly the shape Part 10 describes wanting to check for duplication against, and it already passes that check. The only thing `MenuItem` doesn't own is which items are currently *visible* after a live filter — a compositional/rendering concern (the app or a future Recipe decides which `MenuItem`s to render based on the search input's value), not a missing prop on the item itself. No new item export is justified.

### Grouping / empty / recents

Already solved: grouping and group headings (`MenuGroup`/`MenuLabel`), empty state (`EmptyState`), separators (`MenuSeparator`). "Recent commands" is a data/state concern (which items to show first), not a rendering primitive — once the app supplies "recent" items in whatever order it wants, they render as ordinary `MenuItem`s, no new export needed.

### Architecture comparison

| | A — standalone `<CommandPalette commands={...}/>` | B — compound `CommandPalette`+`CommandGroup`+`CommandItem` | **C — composition (Dialog/Popover + SearchField + Menu primitives)** | D — application feature only | E — Reference App first |
|---|---|---|---|---|---|
| Semantic clarity | Would have to pick one of the two contested role models and bake it in without real validation | Same problem, plus duplicates `MenuItem`'s already-solved shape in a new `CommandItem` | Defers the role-model decision to whoever writes a future, validated Recipe — doesn't force a premature answer | Same as C but with even less design-system-level guidance | Same deferral, framed as evidence-gathering first |
| Accessibility | High risk — commits to an unresolved model now | High risk — same, plus a duplicated item API to keep consistent | Lower risk — reuses already-solved container/item contracts (`Dialog`/`Popover`/`MenuItem`) for everything except the one open question, which stays open | Lowest risk to the design system, but offers no guidance at all | Same as C, with real usage informing the eventual choice |
| API complexity | High — domain-shaped `commands` prop, the same anti-pattern flagged in CE-2E/CE-2G | Medium — new `CommandItem` API re-specifying what `MenuItem` already has | None — no new API surface | None | None |
| App coupling | High | Medium | Low | Low | Low |
| Keyboard ownership | Risk of the component reaching for a global shortcut listener (explicitly disallowed) | Same risk | Composition guidance explicitly states the global shortcut is app-owned | Same | Same |
| Reuse | Low — re-wraps `Menu`'s already-rich item model | Medium | High — zero new exports; shape 6 is already 100% buildable today | High | High |
| Agent Kit clarity | Another surface, plus an unresolved a11y model to keep consistent | Same | Guidance ("Dialog/Popover + SearchField + Menu items; shortcut display already exists; global open-shortcut and command registry stay in the app") is accurate today without overclaiming a settled model | Weaker — no positive guidance offered | Same as C |
| Figma implications | Monolithic set for an inherently compositional, partly-unresolved feature | Two new sets, one (`CommandItem`) duplicating `Menu Item`'s real anatomy | None beyond existing primitives | None | None |
| Maintenance | High — would likely need a breaking rework once the a11y question is actually resolved with real usage | Same | Low | Low | Low |
| **Verdict** | **Not justified — commits to an unresolved model** | **Not justified — `MenuItem` already owns the item shape; the new item duplicates it while adding nothing** | **Selected direction** | **Undersells the real, nameable composition (shape 6 especially) — C is the more accurate label** | **Consistent with C, not a separate track — see Reference App relevance below** |

### Final decision: **C — composition/pattern, not a standalone or compound component**

- **Product rationale:** real for developer/power-user/admin tools, but for *arrangement* of already-rich existing primitives (`Menu` especially), not a missing atomic control — and the evidence inside this project sits at the generic-mention tier, same as CE-2E/CE-2G.
- **Semantic rationale:** `MenuItem`/`MenuGroup`/`MenuLabel`/`MenuSeparator` already own the item/grouping/shortcut/disabled structure; `Dialog`/`Popover` already own the containers; nothing new is missing for the item/container layer.
- **Accessibility rationale — the genuinely hard part of this audit:** for the searchable/filtered shapes (1/3), no single clean, already-established semantic model exists without a deliberate judgment call between reusing `combobox`/`listbox`/`option` (with documented "activate not persist" semantics) or `menu`/`menuitem` (with an undocumented live-filter relationship). Per this task's own explicit instruction, that ambiguity is **recorded, not resolved speculatively** — composition defers the decision to a future, real, validated Recipe rather than baking an unvalidated choice into a public component API now. This is the one point in this audit closer to CE-2D's Multi Select conclusion than to CE-2E/CE-2G's clean accessibility stories.
- **Keyboard rationale:** the global open-shortcut and app-wide command registry are explicitly application-owned; the design system's only legitimate keyboard responsibility (arrow-nav/Enter/Escape within an open list) is already solved by the composed primitives.
- **Architecture rationale:** both standalone and compound options would either commit prematurely to an unresolved accessibility model or duplicate `MenuItem`'s already-solved item shape — both are premature-abstraction risks, not missing-primitive problems.
- **Figma rationale:** no monolithic or compound component set is warranted; an example/reference frame, if any, fits better, and only for the parts that are actually settled (the non-searchable shape-6 launcher).
- **Agent Kit rationale:** composition guidance ("non-searchable quick-actions = Menu directly, today; searchable/filtered command palette = Dialog/Popover + SearchField + Menu-derived items, with the ARIA role model an open, real design decision — not yet resolved") is more honest and more useful to a coding agent than a component contract that quietly commits to one of two contested accessibility models.

### Proposed composition outline — PROPOSED PATTERN, NOT IMPLEMENTED

No exports created. Conceptual composition roles only, for **future** docs/Recipe guidance once the accessibility role question is deliberately resolved (ideally with real Reference App usage informing it):

- **CommandLauncher** — the trigger + container: `Dialog` (global, modal, centered/near-top) or `Popover` (smaller, anchored quick-actions). The global open-shortcut (Cmd/Ctrl+K) is application-owned, composed into the app's own event handling, not the design system's.
- **CommandSearch** — `SearchField`, driving a live filter of visible items. The exact ARIA relationship between this input and the results below is the open question flagged above — not resolved here.
- **CommandGroups** — `MenuGroup`/`MenuLabel`, already fully solved.
- **CommandItem** — **not a new export** — a `MenuItem` usage convention (label, icon, `shortcut`, `disabled`, `onSelect` already all exist).
- **CommandEmpty** — `EmptyState`, already fully solved.
- **ShortcutHint** — **not new** — `Menu`'s existing `MenuShortcut`/`shortcut` prop already covers this.

For the **non-searchable shape (6)** specifically — a short, static Cmd/Ctrl+K launcher of top actions — no open question remains at all; it is fully buildable today by composing `Menu` as-is.

### Recommended future representation (Agent Kit)

**Docs composition guidance now (clearly distinguishing the fully-solved non-searchable shape from the open searchable-shape question) → a future Recipe only once the accessibility role model is deliberately decided and validated**, ideally informed by Reference App usage. Not a component contract (the accessibility question is unresolved, unlike Stepper where a real contract was justified), not a Recipe yet (this project's own convention reserves Recipes for validated composition). **No Agent Kit artifact was added in this audit.**

### Figma recommendation

**Example/pattern, not a component or component set — and only for the settled parts.** A monolithic "Command Palette" Figma component set would be premature given the unresolved accessibility role question for the shapes that actually motivate wanting one; over-modeling this in Figma without real product evidence risks designing around an interaction model that later needs to change once the ARIA question is actually settled.

### Mobile/responsive implications

Desktop: centered/near-top `Dialog`, or an anchored `Popover` for the smaller quick-actions shape. Mobile: `Dialog` presented full-screen is the natural existing fit — no new responsive surface proposed. Existing containers are sufficient; nothing new is needed here regardless of how the accessibility question above is eventually resolved.

### Reference App relevance

**Yes — and here it's closer to a precondition than a refinement source**, unlike CE-2E/CE-2G where composition was already fully clean. Real command categories, the actual navigation-vs-action mix, whether shortcuts are genuinely needed, whether nesting is truly required (blocked today regardless by `Menu`'s own submenu gap), real mobile behavior, and — most importantly — real usage patterns that would inform whether "activate not persist" listbox semantics or menu semantics reads more correctly to actual users, are all open questions this audit could not and should not resolve from first principles alone. **Recorded as a Reference App validation target**, not started here.

## CE-2I — App Shell / richer navigation product + architecture audit (decision D — Reference-App template first)

**Audit only. App Shell was not implemented in CE-2I.** No navigation components were implemented or modified; Skrewww's own site navigation was inspected but not refactored, per explicit instruction.

### Existing capability audit

**Public, reusable primitives already usable for shell-building**: `Breadcrumb` (location/hierarchy), `Tabs` (peer views — secondary nav), `Menu` (actions, with `MenuGroup`/`MenuLabel` grouping), `Avatar` (account representation), `Badge` (status/count), `Button`/`Icon Button`, `SearchField`, `Drawer`, `Popover`, `Dialog`.

**What currently lives only inside the Skrewww site itself, not the public library** (`components/ui/`): `Sidebar.tsx`, `SidebarNav.tsx`, `SidebarNavLink.tsx`, `MobileDocsNav.tsx`, `NavBadge.tsx` — all outside `components/ui/`, none published/distributed.

### Product-shape taxonomy (12 shapes, wildly different maturity)

1. **Admin dashboard shell** — no in-house evidence, irreducibly bound to routing/permissions/workspace state.
2. **SaaS app shell** — same as 1, generic-only reasoning.
3. **Docs shell** — **exactly what Skrewww's own site already is** — real, concrete, working evidence.
4. **Top-nav website shell** (horizontal bar instead of sidebar) — a different structural shape entirely; zero Skrewww evidence.
5. **Left-sidebar app navigation** — the structural piece `Sidebar.tsx` already is, minus its docs-specific hardcoding.
6. **Collapsible sidebar** — Skrewww's current `Sidebar` has **no collapse behavior** at all (fixed `w-64`, or hidden entirely below `md`) — a real, unevidenced gap, not a proven need.
7. **Mobile drawer navigation** — **already solved**, proven, composed from `Drawer` + the same `SidebarNav` content used on desktop.
8. **Utility/header actions** (search, account menu, etc. in a top bar) — zero evidence; Skrewww's docs site has no such utility header.
9. **Secondary navigation** — `Tabs` already exists generically and is reused elsewhere.
10. **Workspace/account switcher** — zero evidence anywhere in this project; heavily app-specific, matching Command Palette's "AI invocation"-class of concerns that must stay external.
11. **Nested navigation** — `SidebarNav` has flat two-level grouping (category + Industries sub-groups) today; deeper collapsible nesting is unevidenced.
12. **Breadcrumb/content-header region** — `Breadcrumb` exists as a primitive; the "breadcrumb + heading" region is composed **ad hoc per page** today (e.g. a docs-specific `ComponentBreadcrumbs` wrapper + a directly-styled `<h1>`), not abstracted into a shared component even at the site level.

Shapes 3/5/7 have real, working, in-house evidence. Shapes 1/2/4/6/8/10/11 have little-to-no evidence within this project. Shapes 9/12 partially exist as primitives/conventions already, without a shared abstraction.

### Component / layout / template classification

- **PRIMITIVE** (already public, reused as-is): `Breadcrumb`, `Tabs`, `Menu`, `Avatar`, `Badge`, `Button`/`Icon Button`, `SearchField`.
- **LAYOUT PRIMITIVE** (candidate, not yet built, not evidenced enough to build now): a generic `<aside>`-based sidebar rail with collapse/icon-only-rail/footer-area support.
- **COMPOSITION** (already proven, no new export needed): the mobile drawer-nav pairing — `Drawer` wrapping the same nav-content component used for the desktop sidebar.
- **FEATURE PATTERN** (candidate for future docs/Recipe guidance, independent of Reference App timing): the "responsive primary navigation" pairing itself — persistent sidebar on desktop, `Drawer` on mobile, sharing one nav-content source. This is not speculative; it's the pattern already running in production in this exact repo.
- **APPLICATION TEMPLATE** (Reference-App territory, not a design-system component): "admin dashboard shell," "SaaS app shell" — these bundle workspace-switching, permissions, and routing decisions that are irreducibly app-specific.

### Product need

Real for SaaS/admin/enterprise/internal tools in the abstract, but **not justified by aesthetic consistency alone**, per explicit instruction — the concrete, evidenced need inside this project is narrower than "App Shell" as a whole: it's specifically the responsive-navigation pairing (shapes 5/7), which is proven, not the full dashboard-shell template (shapes 1/2), which has no in-house evidence at all.

### Responsibility boundary

Skrewww should **not** own: routing, permissions, active-route derivation, auth, account/workspace state, data fetching, nav configuration from a backend, analytics, feature flags — the widest "must not own" list of any CE-2 audit yet, wider even than Command Palette's. Potential design-system responsibility, if ever built: layout slots, responsive structure, navigation container chrome, collapsible behavior, mobile `Drawer` composition, landmark semantics, focus handling.

**Concrete evidence this boundary is real, not abstract**: `SidebarNavLink.tsx` (site-specific, not public) directly calls `usePathname()` from `next/navigation` to derive active-route state — a hard, framework-specific coupling. By contrast, the **public** `components/ui/` library (`Link`, `Button`, `Pagination`, `ListItem`) already has an established, accepted convention of rendering `next/link`'s `<Link>` for `href`-based navigation, but **none of them derive active-route state from the router** — that pattern is confined entirely to app-specific code today. This is exactly the dividing line Part 5 draws, already enforced in practice by this codebase, not just in theory: rendering a link is a design-system concern; knowing which link is "active" from the router is an application concern.

### Current-site evidence (Part 6) — audited, not refactored

- `Sidebar.tsx`: a plain `<aside>`, `hidden md:block`, fixed `w-64`, hardcoded logo/branding, no collapse, no icon-only mode, no footer/user area — genuinely docs-site-specific, not a generic primitive today.
- `MobileDocsNav.tsx`: a `<header>` + hamburger trigger opening a `Drawer` containing the **same** `SidebarNav` component used on desktop — confirming **no duplication between desktop/mobile nav**; the content is shared, only the container differs.
- The desktop/mobile layout coupling (`Sidebar`'s `w-64` and `app/layout.tsx`'s `md:ml-64` main-content offset) is two independently hardcoded values that must be kept in sync manually — a real, minor fragility in the current site, noted as an observed fact, not something fixed here.
- No dedicated `AppHeader`/`ContentHeader` abstraction exists anywhere, even at the site level — each surface (`Sidebar`'s internal header row, `MobileDocsNav`'s header, each page's breadcrumb+`<h1>`) is separately hand-composed.
- **No skip-to-content link exists anywhere in the current site** — an honest, observed accessibility gap in the current shell, explicitly not fixed in this audit (refactoring the site is out of scope).
- Could any proven piece become a design-system primitive later? Yes — specifically the responsive sidebar/drawer **pairing pattern**, once genericized away from its docs-specific hardcoding (width, branding, `usePathname` coupling). Not yet, and not the rest of the site's shell code, most of which is genuinely docs-site-specific.

### Accessibility findings

- Landmark semantics: `<aside>` (complementary/navigation-adjacent), `<nav>` (already used inside `SidebarNav`), `<main>` (already present in `app/layout.tsx`) — standard semantics, nothing new to invent.
- Skip-to-content: **currently absent** in the real site — a genuine gap, noted not fixed.
- Active-page indication: already solved in the site-specific code (`aria-current="page"` pattern via `SidebarNavLink`), but that solution is coupled to `usePathname()` — a public primitive would need the app to supply "is this the active item" some other way (e.g. a boolean prop or an `href`-vs-current-URL comparison the app performs), not assume a specific router.
- Icon-only nav labels: not currently evidenced anywhere in this project (no collapsed/rail mode exists) — an open question, not resolved here.
- Mobile Drawer focus trap / focus restoration: **already solved** by `Drawer`'s own existing, documented contract — nothing new needed for the mobile-nav composition.
- Collapsed-sidebar discoverability, nested-navigation semantics, reduced-motion for collapse animations: all **unevidenced open questions**, since no collapse behavior exists anywhere in this project today — not invented here.
- No custom ARIA roles are proposed anywhere in this audit.

### Responsive model

Desktop: persistent sidebar — proven. Collapsible sidebar and top-nav variants: **unevidenced**, not assumed. Mobile: `Drawer` — proven, already solved. No universal responsive algorithm is proposed; the existing `Drawer` + shared nav-content pairing already covers the one responsive transition this project has real evidence for (persistent sidebar ↔ drawer).

### Sidebar decision (Part 9) — **B, not A**

**A generic public Sidebar primitive is not justified yet.** More than half of what a genuinely reusable Sidebar would need to solve is either unevidenced in this project (collapse behavior, icon-only rail mode, footer/user area) or app-specific styling (fixed width, fixed branding) rather than a universal design-system concern. What already works well (active state, badges, section headings, mobile reuse) is either already solved by existing pieces (`NavBadge`, category-group headings, the `Drawer` pairing) or coupled to app-specific router state (active-page derivation). **Recommend B — document the proven `<aside>` + nav-content + responsive-`Drawer`-pairing composition using semantic HTML and existing tokens, not a new generic Sidebar export**, deferring a true collapsible/rail Sidebar primitive until real evidence (ideally Reference App) shows it's needed.

### Navigation data model (Part 11)

**No public navigation schema (`{label, href, icon, children, badge}`) is proposed.** This project's own site already models its nav data as a simple, app-specific array (`primaryNavLinks` in `lib/sidebar-nav.ts`, built in a prior session task) — exactly the kind of data structure that should stay with the consuming app, not become a design-system-owned DTO shape, matching the same "avoid becoming a domain DTO library" conclusion CE-2E/CE-2G reached for filters/notifications. Presentation primitives (`SidebarNavLink`-equivalent rendering, once genericized away from `usePathname`) are the right level of ownership; the data shape that drives them is not.

### Architecture comparison

| | A — standalone `<AppShell/>` | B — small layout primitive family (`AppShell`/`AppHeader`/`AppSidebar`/`AppMain`) | C — composition/pattern/docs/Recipe | **D — Reference-App template first** | E — application-owned only |
|---|---|---|---|---|---|
| Reuse | Low — would re-wrap primitives that already work | Medium — some genuine layout value, but for unevidenced sub-behaviors (collapse, rail mode) | High for the proven responsive-nav slice; unclear for the rest | N/A — evidence-gathering, not a build | N/A |
| API complexity | Very high — slot-prop explosion (`sidebar`/`header`/`navigation`/`mobileNavigation`) is exactly the anti-pattern this task's own Part 10 warns about | Medium-high — four new exports, several with unevidenced responsibilities | Low — guidance only for the proven slice | None yet | None |
| Routing coupling | High risk — active-state logic would either lock the library to a router or need real abstraction work never yet attempted | Same risk, spread across fewer but still-real touchpoints | Low — the app supplies active-state; guidance documents the pattern, not a component that reaches for the router | N/A | N/A |
| Accessibility | Would need to (re)solve landmark/skip-link/focus-trap semantics that are today either solved (`Drawer`) or genuinely absent (skip-link) from real evidence | Same, distributed | Inherits `Drawer`'s already-solved contract for the mobile piece; the rest stays open | N/A | N/A |
| Product flexibility | Low — a full shell API tends to fight products whose layout genuinely differs (top-nav vs. sidebar, single-tenant vs. workspace-switching) | Medium | High — composition stays flexible by construction | Highest | Highest |
| Agent Kit clarity | Another large surface, much of it built on unevidenced assumptions | Same, smaller | Guidance for the proven slice is accurate and useful now | Nothing yet, but avoids overclaiming | Nothing |
| Figma implications | A huge, mostly-speculative component set | Four sets, several unevidenced | None beyond existing primitives, for the proven slice | None | None |
| Maintenance/testing | High — likely needs a breaking rework once real routing/permissions requirements surface | Same, smaller scope | Low | Low (nothing built yet) | Low |
| **Verdict** | **Not justified — premature, highest risk** | **Not justified yet — several responsibilities remain genuinely unevidenced** | **Justified narrowly, for the already-proven responsive-nav slice only — not the full "App Shell" concept** | **Selected as the dominant/primary direction for the harder, higher-value "shell" shapes** | **Correct for the truly app-specific pieces (workspace switcher, permissions, routing) regardless of which other option wins** |

### Final decision: **D — Reference-App template first**, with a narrower composition slice already at C-readiness

This audit does not pick a single letter uniformly, because the evidence genuinely splits — matching CE-2H's own precedent of carving out a fully-solved sub-shape within an overall harder conclusion:

- **The responsive primary-navigation pairing (shapes 5 + 7)** — persistent sidebar on desktop, `Drawer` on mobile, one shared nav-content source, active state supplied by the app rather than derived by a public component — is **already proven, working, in-house**, and is ready for **composition/docs guidance now (C-readiness)**, independent of Reference App timing. This is not speculative the way "App Shell" as a whole is.
- **The broader shell/template shapes (admin dashboard shell, SaaS app shell, top-nav shell, collapsible sidebar, utility header, workspace switcher, nested navigation)** genuinely need a real application to validate — their defining, high-value behaviors (collapse, workspace state, routing-aware active state, permission-gated nav items) don't exist anywhere in this project yet, and specifying them generically now would mean inventing requirements rather than discovering them.

**Rationale, per each required axis:**
- **Product:** real in the abstract, concretely evidenced only for the narrower responsive-nav slice.
- **Semantic:** the "big shell" shapes bundle multiple genuinely distinct concerns (layout, routing-awareness, workspace state, permissions) that don't share one clean component boundary — exactly the kind of premature-abstraction risk this whole CE-2 series has repeatedly found reason to avoid (Advanced Filters, Notification Center, Command Palette).
- **Responsibility boundary:** the widest "must not own" list yet (routing, permissions, active-route derivation, auth, workspace state, backend nav config, analytics, feature flags) — reinforced by concrete, in-repo evidence (`usePathname()` confined to app-specific code, never the public library).
- **Accessibility:** what's provably solved (mobile Drawer focus trap, landmark semantics) is solved via existing primitives; what's genuinely open (collapse discoverability, icon-only labeling, reduced-motion for collapse — none of which currently exist anywhere in this project) has no evidence to design against yet.
- **Responsive:** the one transition this project has real evidence for (sidebar ↔ drawer) is already solved; collapsible/top-nav variants are unevidenced.
- **Architecture:** both A and B commit to unevidenced responsibilities and risk the slot-explosion/routing-coupling failure modes this task explicitly warned against; D avoids inventing requirements speculatively.
- **Figma:** a full App Shell component family would be premature and likely wrong once real requirements surface; a Reference App screen is the right artifact for the shapes that need real validation.
- **Agent Kit:** guidance for the proven responsive-nav slice, without pretending the rest of "App Shell" already has a settled shape, is more honest and useful than either silence or a speculative contract.

### Proposed composition roles (for the proven slice only) — PROPOSED PATTERN, NOT IMPLEMENTED

No exports created. Conceptual roles only:

- **AppHeader** — the logo/branding row, currently fused into `Sidebar`'s internal header div and `MobileDocsNav`'s own header separately; a future genericized version would need to stop hardcoding branding.
- **PrimaryNavigation** — the shared nav-content component (today: `SidebarNav`), rendered inside a persistent `<aside>` on desktop and inside a `Drawer` on mobile — the one already-proven pairing.
- **MobileNavigation** — not a new primitive; `Drawer` composing `PrimaryNavigation`, exactly as `MobileDocsNav` already does.
- **ContentHeader** — the breadcrumb + heading region, currently composed ad hoc per page (`ComponentBreadcrumbs` + a styled `<h1>`); a candidate for future docs guidance, not evidenced enough yet for a component.
- **UtilityActions** — zero evidence in this project; not proposed.

Recommended home once written: **docs guidance first**, potentially a future Recipe once the responsive-nav slice specifically (not the full shell) is validated against a second real usage beyond Skrewww's own site — Reference App is the natural candidate for that second usage.

### Agent Kit recommendation

Layout-primitive contracts or a full `AppShell` contract are **not** recommended yet — too much of the concept is unevidenced. Docs composition guidance for the proven responsive-nav slice is the right near-term artifact; a Reference App example is the right artifact for the broader shell shapes once built. **No Agent Kit artifact was added in this audit.**

### Figma recommendation

**Reference App screen, not a component or component family, for the shell shapes as a whole.** A page layout example (not a component set) would fit the proven responsive-nav slice if it's ever formalized, since it's a compositional arrangement, not new item-level anatomy. A large, speculative "App Shell" Figma component family would risk designing around requirements that don't exist yet in this project.

### Reference App relevance — a major validation target

**Yes, explicitly and more heavily than any prior CE-2 audit.** The future Reference App is the natural place to validate: responsive sidebar collapse behavior, header density, navigation nesting depth, real active-state derivation against a real router (validating whether the public library should ever cross the `usePathname()` boundary, and how), account/workspace actions, mobile Drawer behavior at real content scale, and the content-header/breadcrumb relationship across multiple page types. **Recorded as a major Reference App validation target** — likely the single largest one identified across the whole CE-2 series so far.

## CE-2J — Stepper Figma/MCP verification (decision B — ready with narrower contract)

**Verdict: B — READY WITH NARROWER CONTRACT.** A first attempt at this task was BLOCKED (Figma access unavailable — WebSocket Desktop Bridge not connected, REST API token expired). On retry, Figma access was confirmed restored (`figma_get_status` → connected via WebSocket Desktop Bridge to the live "Skrewww - Design System" file, key `U6KUuNf7DF4CP9QBOkLSUx`) and the full verification below was completed against real, live Figma data — not the docs-only content. **Stepper was still not implemented in this task** (verification only, per explicit instruction); Figma was not modified.

### Part 1 — Figma source located

**`Navigation/Step Item`** — `nodeId 2024:2944`, `type: COMPONENT_SET`, category `Navigation`, **3 variants** (`State = Completed | Current | Upcoming`). Retrieved live via the Desktop Bridge plugin (`source: "desktop_bridge_plugin"`, description explicitly marked reliable/current).

**No separate `Stepper` component or component set exists.** Searching "stepper" returns only `Navigation/Step Item` and (as an intentionally-distinguished cross-reference) `Content/Timeline Item` — "Stepper" appears only as prose in component descriptions, never as its own instantiable component. This matches CE-2F's original assumption. However, a real composed reference **does** exist: a `SECTION` named **`Navigation/Stepper`** (id `2024:2973`) containing a `FRAME` named **`Stepper Trail (example)`** (id `2024:2949`) with an author annotation: *"One complete step sequence using attached instances; connectors remain plain rectangles."* This is the Stepper-level evidence CE-2F lacked.

### Part 2 — Verified anatomy

Each `Step Item` variant: `HORIZONTAL` auto-layout, `itemSpacing: 8`, zero padding, exactly two children — a 24×24px `Circle` (`FRAME`, `cornerRadius: 9999` bound to `radius/full`) and a `Label` (`TEXT`). Inside `Circle`: **Completed** contains an `INSTANCE` of `Icon/Check` (a real, existing icon component, not a text glyph); **Current** and **Upcoming** each contain a `Number` `TEXT` node instead. No connector line, no description slot, and no generic icon-swap slot exist on `Step Item` itself — the connector only exists in the composed `Stepper Trail (example)` frame (see Part 7).

### Part 3 — Verified states

**Exactly `Completed | Current | Upcoming` — no more, no fewer.** `componentSetProps` on the component set: `Label`, `Number Current`, `Number Upcoming`, `State` — no `Error`, `Disabled`, `Optional`, `Skipped`, `Hover`, `Focus`, or `Pressed` variant exists anywhere. This confirms CE-2F's "smallest useful state model" instinct exactly, with real evidence rather than a guess.

### Part 4 — Verified orientation

**No orientation property or axis exists at all** — not "unspecified," structurally absent. `State` is the only variant axis. This confirms CE-2F's horizontal-only-v1 caution was correct, and goes further: there is no partial vertical evidence to weigh — it simply isn't modeled.

### Part 5 — Verified interaction intent

**Zero Figma prototype reactions** on the `Step Item` variants or on any instance in the `Stepper Trail (example)` frame (`reactions: []` throughout) — Figma does not positively confirm clickability via prototyping. Interaction intent is communicated **only through text**: the component description's own "COMMON MISTAKES" line — *"Allowing users to click ahead to Upcoming steps that require earlier steps to be completed first — verify whether skipping ahead is actually intended before making steps clickable"* — is a **normative constraint** (Upcoming must never allow bypassing sequence), not a positive confirmation that Completed/Current *are* clickable. This is consistent with, and does not contradict, CE-2F's proposed `onStepClick` model (restricted to Completed/Current, never Upcoming) — but it doesn't independently mandate that a click handler exist at all. Clickability remains correctly an implementation-time/app-level decision, exactly as CE-2F proposed, now with explicit normative backing for the one constraint that *is* clear (never let Upcoming skip ahead).

### Part 6 — Verified content model

`Label` — real `TEXT` component property (default `"Payment"`), confirmed a genuine content property, not fixed example text. `Number Current` / `Number Upcoming` — real per-state `TEXT` properties (default `"2"` each); no separate `Number` property for Completed, consistent with Completed always showing the check icon instead. **No `description` property or layer exists anywhere on `Step Item`.** CE-2F's proposed `Step.description?` prop has **zero Figma evidence** — see Part 12/14.

### Part 7 — Verified layout / spacing

Single `Step Item`: 24×24px circle, 8px gap to label. Composed `Stepper Trail (example)`: `HORIZONTAL` auto-layout, `itemSpacing: 8` (same 8px value governs both circle-to-label *and* step-to-connector-to-step gaps), `counterAxisAlignItems: CENTER`, `primaryAxisAlignItems: MIN` (left-aligned, no justify/space-between). **Connector**: a plain `RECTANGLE`, 32px × 1.5px, fill `semantic/border/default` — matching the frame's own annotation exactly. **Steps are content-sized, not equal-width** — every instance in the example (widths 65/98/101/92px) has `layoutGrow: 0`. No wrapping/overflow behavior is present in this fixed-width demo frame — the narrow-viewport/many-steps open question CE-2F flagged remains genuinely open; Figma does not resolve it.

### Part 8 — Verified token mapping

| Element | State | Property | Token |
|---|---|---|---|
| Circle | Completed | fill | `semantic/action/primary` |
| Circle | Completed | stroke | none |
| Circle | Current | fill | `semantic/surface/default` |
| Circle | Current | stroke (1.5px) | `semantic/action/primary` |
| Circle | Upcoming | fill | `semantic/surface/default` |
| Circle | Upcoming | stroke (1.5px) | `semantic/border/default` |
| Circle | all | corner radius | `radius/full` (primitive — see Part 9) |
| Label | Completed/Current | fill | `semantic/text/primary` |
| Label | Upcoming | fill | `component/surface/content-muted` |
| Label | all | font-family | `font-family/sans` |
| Label | all | font-size | 16px (raw, not a bound variable) |
| Label | Current | font-weight | **700 (bold)** |
| Label | Completed/Upcoming | font-weight | 400 (regular) |
| Connector | — | fill | `semantic/border/default` |

**New, previously-unspecified finding**: Current's label is bold (700) while Completed/Upcoming are regular (400) — a real, additional non-color state signal the docs-only content never mentioned. This strengthens, and is fully compatible with, CE-2F's accessibility rationale (state conveyed by more than color/icon alone).

### Part 9 — Shape / Surface behavior

**Confirmed independent of both axes, not just assumed.** The circle's corner radius is bound to the **primitive** token `radius/full`, not a Shape-driven **component** token (the pattern other Shape-participating components use, e.g. `component/button/radius-control`) — so it is fixed at "full" regardless of the global Shape setting. No Surface-related tokens (gradient-overlay, glass-backdrop-filter, or similar) are bound anywhere on `Step Item`. `componentSetProps` confirms no `Shape` or `Surface` property exists at all. This verifies (not just assumes, as CE-2F had to) that the indicator is intentionally fixed and independent of Shape/Surface.

### Part 10 — Accessibility support

Figma's own description text already states the exact runtime semantics CE-2F proposed, verbatim: *"The overall stepper should communicate progress via `aria-current="step"` on the active step, and ideally an `aria-label` summarizing 'Step 3 of 5.'"* Visually: Completed/Current/Upcoming are distinguished by fill + stroke + icon-vs-number + (newly found) font-weight — never color alone. No direct contradiction to CE-2F's proposed runtime accessibility architecture was found; the accessibility architecture itself is unchanged, per instruction.

### Part 11 — Figma vs. docs-only `step-item` comparison matrix

| Field | Docs-only content | Live Figma | Classification |
|---|---|---|---|
| Component existence | "Step Item" content entry | Real `COMPONENT_SET` `Navigation/Step Item` (2024:2944) | **MATCH** |
| States | Completed/Current/Upcoming | Exactly Completed/Current/Upcoming | **MATCH** |
| Checkmark only on Completed | "only Completed shows a checkmark" | Confirmed: `Icon/Check` instance in Completed; `Number` text in Current/Upcoming | **MATCH** |
| Label property | "Label (text)" | Real `Label` TEXT property, default "Payment" | **MATCH** |
| Number property | "per-state Number (text)" | `Number Current` + `Number Upcoming` TEXT properties (no Completed variant) | **MATCH** (refined) |
| `aria-current="step"` guidance | present | present verbatim | **MATCH** |
| "Step 3 of 5" guidance | present | present verbatim | **MATCH** |
| Click-ahead common mistake | present | present verbatim | **MATCH** |
| Orientation | horizontal-only assumed (no evidence either way) | no orientation axis exists at all | **MATCH** (confirms the assumption) |
| `description` content property | proposed by CE-2F (not in docs-only content itself) | **does not exist** | **MISMATCH** — CE-2F's proposal outran the evidence here |
| Icon slot | not addressed | fixed `Icon/Check` only, not a general-purpose swappable slot | **PARTIAL** |
| Interaction/clickability | CE-2F proposed `onStepClick` restricted to Completed/Current | normative guidance only (never Upcoming); no positive confirmation Completed/Current are clickable | **PARTIAL** |
| Indicator geometry | not addressed | 24×24 circle, `radius/full`, 8px gaps | **NOT VERIFIABLE (docs-only)** → now **VERIFIED (Figma)** |
| Connector treatment | not addressed | plain 32×1.5px rectangle, `semantic/border/default` | **NOT VERIFIABLE (docs-only)** → now **VERIFIED (Figma)** |
| Content-sized vs. equal-width | not addressed | content-sized, confirmed | **NOT VERIFIABLE (docs-only)** → now **VERIFIED (Figma)** |
| Token names | generic "reuse semantic tokens" instinct | exact bindings resolved (see Part 8 table) | **MATCH** (refined with real names) |
| Font-weight state signal | not mentioned anywhere | Current = bold (700), else regular (400) | **NEW** — not previously documented anywhere |
| Shape participation | not proposed | confirmed absent (`radius/full` primitive, no Shape property) | **MATCH** |
| Surface participation | not proposed | confirmed absent (no gradient/glass tokens, no Surface property) | **MATCH** |
| Error/Disabled/Optional/Skipped states | excluded from v1 by CE-2F | confirmed absent from Figma entirely | **MATCH** |

### Part 12 — React proposed-contract recheck

| Prop/concept | CE-2F proposal | CE-2J classification |
|---|---|---|
| `Stepper.currentStep` | `number` | **SUPPORTED BY RUNTIME SEMANTICS** — inherently a code-level index/derived-state concept (matching Timeline's position-derived-state precedent already cited in CE-2F); Figma's `Number Current`/`Number Upcoming` are per-instance display text, not an index-selection mechanism, so Figma neither verifies nor contradicts this — it simply isn't the kind of thing Figma would model. |
| `Stepper.orientation` | `"horizontal"` (only value) | **SHOULD REMOVE from v1 API** — Figma has no orientation axis at all (Part 4), so exposing a single-value enum prop is unnecessary API surface. Narrowed: drop the prop entirely; reintroduce only if/when a vertical variant is evidenced. |
| `Stepper.onStepClick?` | `(index) => void`, restricted to Completed/Current | **VERIFIED (partially) / SUPPORTED BY RUNTIME SEMANTICS** — Figma's own text explicitly warns against letting Upcoming skip ahead (supports the restriction), but does not positively confirm click-ability should exist by default. Kept as proposed: optional, app-supplied, restricted to Completed/Current. |
| `Step` (compound child) | `<Step>{children}</Step>` | **VERIFIED** — matches `Label`'s real TEXT property exactly (children = label content). |
| `Step.description?` | optional `ReactNode` | **SHOULD REMOVE from v1 API** — zero Figma evidence (Part 6); this was CE-2F's proposal outrunning the evidence available at the time. Not implemented, not carried forward. |
| Per-item `index`/child-count derivation | implied (structural, from position) | **VERIFIED** — Figma's own state model is purely positional (Completed = before current, Current = at index, Upcoming = after), matching the structural-derivation approach CE-2F proposed and Timeline's own established precedent. |

### Implementation-readiness decision: **B — READY WITH NARROWER CONTRACT**

Not A (the `description` prop must be dropped — Decision A would mean the full original proposal is ready as-is, which it isn't). Not C (no contradiction or ambiguity requires a human design decision — the one gap found, `description`, has a clear resolution: remove it, don't invent it). Not D (a real, live, well-specified Figma component set exists — `step-item` was never a fiction). Not E (verification is now complete).

**CE-2F proposed → CE-2J verified:**

```
CE-2F proposed:
<Stepper currentStep={number} orientation="horizontal" onStepClick?={(index) => void}>
  <Step description?="...">Label</Step>
</Stepper>

CE-2J verified (narrower):
<Stepper currentStep={number} onStepClick?={(index) => void} aria-label="...">
  <Step>Label</Step>
</Stepper>
```

- **Removed**: `orientation` — Figma has no orientation axis at all; reintroduce only with future evidence.
- **Removed**: `Step.description?` — zero Figma evidence; not a real content property.
- **Added** (newly justified by verified anatomy, not previously in CE-2F's prop list): an `aria-label`/`aria-labelledby` requirement on `Stepper` itself, matching Figma's own explicit accessibility guidance ("Step 3 of 5" summary) and this codebase's convention elsewhere (Toggle Group, Radio Group).
- **Unchanged**: `currentStep`, `onStepClick?`, compound `<Step>{children}</Step>`, structural Completed/Current/Upcoming derivation, no Shape/Surface participation, `radius/full` indicator, exact token table above, font-weight-700-on-Current as an additional non-color signal, content-sized (not equal-width) layout, plain-rectangle connector treatment (32×1.5px, `semantic/border/default`), 8px consistent gap.

**VERIFIED NARROW CONTRACT — READY FOR CE-2K IMPLEMENTATION.** No code was written in this task.

### Open questions carried into any future implementation

- Narrow-viewport / many-step (5–8+) responsive overflow behavior — genuinely unresolved by this fixed-width Figma demo frame, not invented here.
- Whether `onStepClick` should be provided at all by default in a given consuming app, versus a purely read-only Stepper — Figma gives normative guidance (never let Upcoming skip ahead) but not a definitive yes/no on whether Completed/Current should be clickable; this remains an app-level decision.
- Exact `currentStep` indexing convention (0- vs. 1-based) — not addressed by Figma, left to implementation.

## Next CE-2 candidate

Multi Select is **deferred, not rejected** (CE-2D). Advanced Filters is **not a standalone component** (CE-2E). **Stepper is now VERIFIED and READY**: CE-2J's live Figma verification confirmed the compound Stepper + Step contract, narrowed to drop `orientation` and `Step.description` (zero Figma evidence for either) — a full verified contract is recorded in the CE-2J section, marked **READY FOR CE-2K IMPLEMENTATION**, but **not implemented in this task**. Notification Center is **not a standalone or compound component** (CE-2G). Command Palette is **not a standalone or compound component** (CE-2H). App Shell / richer navigation is **Reference-App template first, not a component** (CE-2I) — removed from the direct component-implementation queue; the proven responsive-nav slice is separately ready for composition guidance independent of Reference App timing.

**Recommended next task: CE-2K — implement the verified Stepper + Step contract.** This is a recommendation only; CE-2K was not started in this task.

## Out of scope

CE-3 `/r`, Reference App, PH-0, Guard, Figma writes, banking Class D work, PARTIAL parity fixes, implementing Multi Select, modifying Combobox, implementing Advanced Filters, modifying Data Table, implementing Stepper, creating `Stepper.tsx`/`Step.tsx`, modifying Number Input, implementing Notification Center, implementing Notification Item, implementing Command Palette, implementing Command Item, modifying Menu, modifying Dialog, implementing App Shell, implementing Sidebar, refactoring Skrewww's own site navigation, modifying Figma, adding an Agent contract for Stepper, adding an `/r` manifest for Stepper, adding Recipes, adding Feature Kits, broad refactors.

## CE-2 phase-completion recommendation (Part 19 — not executed)

**Recommend B: pause CE-2 candidate discovery after this audit; perform the Stepper Figma/MCP verification next.**

Status summary:

- **Implemented**: Number Input, Toggle Group.
- **Justified, pending verification**: Stepper (compound Stepper + Step) — the one CE-2 candidate with a real, actionable next step already defined (an MCP verification pass against existing `step-item` content).
- **Deferred / composition, not components**: Multi Select, Advanced Filters, Notification Center, Command Palette, App Shell / richer navigation.

Five of the seven audited-beyond-Number-Input candidates landed on "not a standalone component" (composition, deferred, or Reference-App-first) rather than "build this." That pattern itself is a signal: the CE-2A scoring table's remaining candidates were increasingly either (a) already covered by existing primitives once actually audited, or (b) irreducibly tied to application/product specifics (routing, permissions, workspace state, AI invocation) that a design-system audit cannot responsibly resolve by further speculative discovery. Continuing to discover new candidates (Option A) risks diminishing returns — repeating this same "mostly composition" pattern without new information. Closing CE-2 outright and moving to CE-3 (Option C) would skip Stepper's own concrete, already-identified next step. Moving Reference App earlier (Option D) is close, but Stepper's proposed contract already has a well-defined, narrower next action (Figma/MCP verification) that doesn't require a Reference App and is worth doing first, since it's the one candidate actually close to shippable. **Recommend B**: verify Stepper next, then let the accumulated Reference-App validation targets from CE-2E through CE-2I (Advanced Filters, Notification Center, Command Palette's role model, and now App Shell's larger shapes) inform whether and when Reference App work begins.

### CE-2J update (retry — completed)

The "verify Stepper next" step above was first attempted and found BLOCKED (Figma access unavailable), then **retried successfully once Figma access was restored** — see the CE-2J section above, now updated in place with the completed live verification. Result: **decision B, READY WITH NARROWER CONTRACT** (`orientation` and `Step.description` dropped; everything else verified). Per CE-2J's own Part 18 (A/B → "CE-2K — Implement verified Stepper + Step"), the recommendation is now **CE-2K: implement the verified contract** — not executed in this task.
