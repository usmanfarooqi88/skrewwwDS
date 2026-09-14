# CE-2 component expansion prioritization

> **CE-2A** · Verified 2026-09-14 · Post CE-1 (`e134d9b`) · Class B = 0
> **CE-2B** Number Input ✅ (`eaba1e7`)
> **CE-2C** Toggle Group ✅ — Segmented Control **RESOLVED BY TOGGLE GROUP**
> **CE-2D** Multi Select audit ✅ — **DEFERRED (decision D)**, not implemented
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
| Advanced Filters | D/B | Medium for SaaS dashboards | Data Table, Select, Number Input, Tag | High | Medium | **24** | **P3 / NEXT** | CANDIDATE / NOT STARTED | Pattern/composition; may end up depending on a future Multi Select for multi-value filters, not blocked by its absence today |
| Stepper | A/B | Medium for multi-step flows | Pagination, Tabs, Progress Bar | Medium–High | Medium | **23** | P4 | CANDIDATE / NOT STARTED | Distinct from Pagination |
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

## Next CE-2 candidate

Multi Select is **deferred, not rejected** — CE-2D leaves it in the candidate matrix with its DEFERRED status, revisit only with new product evidence or a fresh accessibility/Figma spec.

**Advanced Filters** (score 24) is the next candidate — **report only, NOT STARTED**. Note: Advanced Filters may itself end up composing a future Multi Select for multi-value filter fields, but is not blocked by its absence today (composition/pattern work per its own Type `D/B` classification).

## Out of scope

CE-3 `/r`, Reference App, PH-0, Guard, Figma writes, banking Class D work, PARTIAL parity fixes, implementing Multi Select, modifying Combobox, implementing Advanced Filters / Stepper / Notification Center / Command Palette / App Shell.
