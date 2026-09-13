# CE-2 component expansion prioritization

> **CE-2A** · Verified 2026-09-14 · Post CE-1 (`e134d9b`) · Class B = 0  
> Planning only for CE-2 net-new work. Does **not** reopen CE-1 / Figma Class B parity.

## Purpose

CE-2 adds components that close **real product-building gaps**, not marketing
count inflation. Candidates are scored against frequency, reuse, architecture
fit, and Reference App readiness — not against another design system’s catalog.

## Entry conditions (met)

| Check | Result |
|-------|--------|
| CE-1 complete | ✅ |
| Class B gaps | **0** |
| React / Stable·Beta / Docs / Contracts | **52 / 27·25 / 52 / 52** |
| CI on `e134d9b` | completed / success |
| This task may implement | **Number Input only** (if audit supports) |

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
| **Number Input** | A | High — form-heavy readiness explicitly gaps this; pairs with Slider | FormField, TextInputControl, Button/icon patterns, Slider min/max/step math | Medium | Medium (spinbutton + steppers) | **34** | **P1** | **APPROVED FOR CE-2B** | Not currency/quantity. Distinct from Slider (direct entry vs visual adjust). |
| Toggle Group | A/B | High for settings/admin exclusive choices | Button, Button Group adjacency, Radio Group semantics | Medium | Medium (radiogroup vs toolbar) | **31** | P2 | CANDIDATE / NOT STARTED | Closest runner-up. May overlap naming with Segmented Control — resolve product name before CE-2C. |
| Segmented Control | B/C | Medium — often same UX as Toggle Group | Same as Toggle Group | Medium | Medium | **27** | P3 | CANDIDATE / NOT STARTED | Likely **same product** as Toggle Group under another name. Do not ship both without a decision. |
| Multi Select | A | Medium — Combobox intentionally dropped multi-select in Figma | Combobox, Tag, Menu | High | High | **26** | P3 | CANDIDATE / NOT STARTED | Reopens a deliberate Figma simplification; needs explicit product approval. |
| Advanced Filters | D/B | Medium for SaaS dashboards | Data Table, Select, Number Input, Tag | High | Medium | **24** | P4 | CANDIDATE / NOT STARTED | Pattern/composition more than one primitive; benefits from Number Input first. |
| Stepper | A/B | Medium for multi-step flows | Pagination, Tabs, Progress Bar | Medium–High | Medium | **23** | P4 | CANDIDATE / NOT STARTED | Distinct from Pagination Page Item; flow chrome, not form numeric entry. |
| Notification Center | D | Medium for SaaS | Toast, Badge, Popover/Drawer | High | Medium | **21** | P5 | CANDIDATE / NOT STARTED | System surface beyond Toast; larger IA. |
| Command Palette | D | Medium for power-user apps | Menu, Combobox, Dialog | High | High | **20** | P5 | CANDIDATE / NOT STARTED | App command surface; heavy keyboard/a11y surface. |
| App Shell / richer nav | D | Medium | Sidebar/Top Nav items (Class C), Menu | Very high | Medium | **16** | P6 | CANDIDATE / NOT STARTED | Layout system, not a single component. Reference App territory. |

### Score detail (Number Input)

| Criterion | Score | Rationale |
|-----------|------:|-----------|
| Frequency | 5 | Ubiquitous in forms, settings, checkout quantity-adjacent UIs, admin |
| Cross-industry | 5 | Forms everywhere; not industry-specific |
| Gap severity | 5 | Inventory marks form-heavy apps “READY WITH GAPS” for Number Input |
| Dependency value | 4 | Unlocks Advanced Filters / denser forms later |
| Implementation clarity | 4 | Clear min/max/step; known spinbutton patterns |
| Accessibility clarity | 3 | Must get spinbutton + steppers right; doable |
| Foundation reuse | 5 | FormField + Text Input chrome + Button/icon |
| Agent usefulness | 3 | Clear “use Number Input vs Slider” guidance |

### Score detail (Toggle Group — runner-up)

| Criterion | Score | Rationale |
|-----------|------:|-----------|
| Frequency | 4 | Strong in settings; less universal than numeric entry |
| Cross-industry | 4 | Settings/admin heavy |
| Gap severity | 4 | Settings readiness gap called out |
| Dependency value | 3 | Less of a dependency for other CE-2 items |
| Implementation clarity | 3 | Naming vs Segmented Control / Button Group must stay sharp |
| Accessibility clarity | 3 | Exclusive selection vs independent Button Group |
| Foundation reuse | 5 | Button + Button Group adjacency |
| Agent usefulness | 5 | High risk of agents misusing Button Group as radiogroup |

**Number Input outranks Toggle Group** on frequency, form-heavy gap severity, and dependency value for later filter patterns. Toggle Group remains the **recommended next CE-2 candidate** after CE-2B — **NOT STARTED**.

No other candidate outranks Number Input enough to require a human decision to switch CE-2B. Segmented Control must not be implemented as a second product without resolving duality with Toggle Group.

## Duplicate / composition checks

| Candidate | Existing coverage |
|-----------|-------------------|
| Number Input | **Not** covered by Text Input `type="number"` (no public API, no steppers, inconsistent chrome). **Not** Slider (visual adjust). |
| Toggle Group | Button Group is **independent** buttons, not exclusive selection. Radio Group exists but is form-oriented, not segmented chrome. |
| Multi Select | Combobox is single-select by design (Figma multi-select removed). |
| Stepper | Pagination is paging, not wizard steps. |
| Notification Center | Toast is ephemeral, not a center/inbox. |
| Command Palette | Menu/Combobox are related primitives, not a palette shell. |
| App Shell | Item primitives (Class C) exist; no app chrome component. |

## CE-2B authorization

| Item | Status |
|------|--------|
| Number Input | **APPROVED FOR CE-2B** |
| All other candidates | **CANDIDATE / NOT STARTED** |

CE-2 overall remains **IN PROGRESS** until product decides further CE-2C+ scope. This document does **not** mark CE-2 complete.

## Out of scope for CE-2A/B

CE-3 `/r`, Reference App, PH-0, Guard, Figma writes, banking Class D work, PARTIAL parity fixes.
