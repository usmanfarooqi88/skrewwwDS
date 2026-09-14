# CE-2 component expansion prioritization

> **CE-2A** · Verified 2026-09-14 · Post CE-1 (`e134d9b`) · Class B = 0
> **CE-2B** Number Input ✅ (`eaba1e7`)
> **CE-2C** Toggle Group ✅ — Segmented Control **RESOLVED BY TOGGLE GROUP**
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
| Multi Select | A | Medium — Combobox intentionally dropped multi-select | Combobox, Tag, Menu | High | High | **26** | **P3 / NEXT** | CANDIDATE / NOT STARTED | Needs explicit product approval |
| Advanced Filters | D/B | Medium for SaaS dashboards | Data Table, Select, Number Input, Tag | High | Medium | **24** | P4 | CANDIDATE / NOT STARTED | Pattern/composition |
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

## Next CE-2 candidate

**Multi Select** (score 26) — **NOT STARTED**.

Requires explicit product approval because Combobox intentionally dropped multi-select in Figma.

## Out of scope

CE-3 `/r`, Reference App, PH-0, Guard, Figma writes, banking Class D work, PARTIAL parity fixes, implementing Multi Select in this pass.
