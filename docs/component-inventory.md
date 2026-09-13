# Skrewww component inventory (CE-0)

> **Audit date:** 2026-09-13 · **Freeze SHA:** `7593ea4` (audit start) · **Status:** COMPLETE
> Inventory only — does **not** start CE-1 / CE-2 / CE-3 / PH-0 / Guard.

This document is the durable planning source for CE-1. Prefer the tables over
prose. Re-derive volatile counts from `lib/component-registry*.ts` and
`content/*` if they drift.

## Authoritative sources

| Side | Source | Role |
|------|--------|------|
| React | `lib/component-registry*.ts` | Canonical implemented public components |
| Docs / Figma-documented names | `content/*.ts` via `lib/data.ts` `allComponents` | Published documentation inventory (includes docs-only) |
| Agent Kit | `public/agent/contracts/*.json` (generated) | One contract per implemented registry component |
| Distribution | `public/r/*.json` (generated) | shadcn `@skrewww` manifests (+ `foundation`) |
| Figma evidence | `lib/*-figma-metadata.ts`, registry `figmaAvailability`, content prose | Verified parity notes |
| Live Figma | Pro file `U6KUuNf7DF4CP9QBOkLSUx` (read-only MCP) | Library present; full page inventory not fully enumerable via MCP in this session |

**Do not equate** `content/` count with “missing React components.” Many content
entries are Figma item primitives that React correctly models via composition.

## Exact totals (verified 2026-09-13)

### React (canonical registry)

| Metric | Count |
|--------|------:|
| Implemented public React components | **47** |
| Stable | **27** |
| Beta | **20** |
| Public docs pages (implemented) | **47** |
| Agent Kit contracts | **47** |
| `/r` component manifests | **8** (+ `foundation` shared cut = 9 files) |

`/r` components: button, card, divider, form-field, link, spinner, text-input, validation-message.

### Figma / documentation inventory

| Metric | Count |
|--------|------:|
| `content/` documented entries | **63** |
| With React counterpart (registry) | **47** |
| Docs-only (no React registry entry) | **16** |
| Of those: internal / building-block (Class C) | **10** |
| Of those: genuine public Figma→React gap candidates (Class B) | **5** |
| Of those: modeling difference (Class E) | **1** (Icon Button) |

### Classification totals

| Class | Meaning | Count |
|-------|---------|------:|
| **A** | Public parity (both sides) | **44** |
| **B** | Genuine Figma→React gap | **5** |
| **C** | Figma internal / building block | **10** |
| **D** | React→Figma gap (confirmed no Figma master) | **3** |
| **E** | Naming / modeling difference | **1** |
| **F** | Legacy / unknown | **0** |

### Parity depth (Class A + partial A)

| Parity status | Count | Notes |
|---------------|------:|-------|
| VERIFIED (`figmaAvailability: available`) | **41** | Lightweight — not a full visual re-audit |
| PARTIAL | **3** | radio-group, data-table, calendar-grid |
| UNKNOWN (no Figma / Class D) | **3** | Banking pilot trio |

## Why Figma can have more entries than React

1. **Item primitives** — Figma often publishes Accordion Item, Menu Item, Tree Item, etc. as component sets; React exposes the parent (`Accordion`, `Menu`, `TreeView`) with composition/children.
2. **Variant vs component** — Figma component-sets encode Style×Size×State; React uses props (`variant`, `size`, `disabled`).
3. **Public API boundary** — Not every Figma library node is a consumer-facing React export (`components/ui/internal/` exists for a reason).
4. **Visual vs runtime** — Charts/examples and presentation frames may exist without a 1:1 React “shell.”
5. **Industry pilots** — Banking React components were shipped React-first with **confirmed absence** of Figma masters (Class D), not forgotten Figma work.

Numerical Figma−React equality is **not** a product goal.

## Category coverage

| Category | React | Content docs | Docs-only | Class B gaps | Class C blocks |
|----------|------:|-------------:|----------:|-------------:|---------------:|
| Actions | 2 | 5 | 3 | 2 (button-group, split-button) | 0 (+ Icon Button = E) |
| Containers & Overlays | 5 | 6 | 1 | 0 | 1 (accordion-item) |
| Forms | 13 | 16 | 3 | 3 (slider, credit-card-field, phone-number-field) | 0 |
| Feedback | 7 | 7 | 0 | 0 | 0 |
| Navigation | 4 | 11 | 7 | 0 | 7 |
| Content & Data | 16 | 18 | 2 | 0 | 2 (tree-item, timeline-item) |

Largest **product** gap pressure: Forms (Slider) and Actions composition (Button Group / Split Button). Navigation’s high docs-only count is mostly **items**, not missing appshells.

## CE-1 recommended scope (NOT STARTED)

Genuine **Class B** gaps only:

| Priority | Component | Rationale |
|----------|-----------|-----------|
| **P1** | Slider | Foundational continuous-value control; high frequency; users invent custom UI |
| **P2** | Button Group | Common action clustering pattern |
| **P2** | Split Button | Common primary+menu action pattern |
| **P3** | Credit Card Field | Specialist / industry-adjacent |
| **P3** | Phone Number Field | Specialist |

**Also track (not auto-implement):**

- **Icon Button (Class E)** — product decision whether to keep Button+`aria-label` or add a public React API matching Figma.
- **PARTIAL parity** — Data Table shell, Radio Group Figma framing, Calendar Grid range/grid verification — dedicated parity tasks, not greenfield components.
- **Class D Banking** — React→Figma documentation/design follow-up if Industry Systems expands in Figma.

## CE-2 candidates — NOT YET APPROVED

Absent from both registry and content inventory (except as noted). Candidates for later product review only:

| Candidate | Notes |
|-----------|-------|
| Number Input | Forms; often paired with Slider |
| Toggle Group / Segmented Control | Exclusive multi-option control |
| Multi Select | Combobox intentionally dropped multi-select in Figma |
| Stepper | Multi-step flows (distinct from Pagination Page Item) |
| Command Palette | App command surface (related to Menu but distinct) |
| Notification center | Beyond Toast |
| App shell / richer navigation chrome | Beyond item primitives |
| Advanced filters / denser data patterns | Beyond Data Table MVP |

## Reference-app readiness

| App type | Readiness | Material gaps |
|----------|-----------|---------------|
| SaaS dashboard | **READY WITH GAPS** | Slider; denser filters; notification center; optional Icon Button clarity |
| Settings / admin | **READY WITH GAPS** | Slider; Toggle Group; denser form composites |
| Form-heavy product | **READY WITH GAPS** | Slider; Number Input; phone/credit specialists |
| Marketing / content site | **READY** | Core content + actions + feedback sufficient |

## Distribution coverage (inventory only)

| Layer | Count | Note |
|-------|------:|------|
| Implemented | 47 | |
| Docs | 47 implemented + 16 docs-only | |
| Agent contracts | 47 | |
| `/r` distributed components | 8 | + foundation |
| `/r/registry.json` | 0 | STAB-001 / CE-3 — not this pass |

## Master inventory table

| Component | Figma | React | Class | Public/Internal | Stable/Beta | Docs | Agent | /r | Parity | Priority | Next | Notes |
|-----------|-------|-------|-------|-----------------|-------------|------|-------|----|--------|----------|------|-------|
| Accordion | yes | yes | A | public | Beta | yes | yes | no | VERIFIED | — | Maintain | Containers & Overlays; figmaAvailability=available |
| Alert | yes | yes | A | public | Stable | yes | yes | no | VERIFIED | — | Maintain | Feedback; figmaAvailability=available |
| Avatar | yes | yes | A | public | Stable | yes | yes | no | VERIFIED | — | Maintain | Content & Data; figmaAvailability=available |
| Badge | yes | yes | A | public | Beta | yes | yes | no | VERIFIED | — | Maintain | Feedback; figmaAvailability=available |
| Banking Account Card | no (confirmed absent) | yes | D | public | Beta | yes | yes | no | UNKNOWN | P3 | Optional Figma Industry follow-up | Content & Data; figmaAvailability=unavailable |
| Banking Balance Summary | no (confirmed absent) | yes | D | public | Beta | yes | yes | no | UNKNOWN | P3 | Optional Figma Industry follow-up | Content & Data; figmaAvailability=unavailable |
| Banking Transaction Row | no (confirmed absent) | yes | D | public | Beta | yes | yes | no | UNKNOWN | P3 | Optional Figma Industry follow-up | Content & Data; figmaAvailability=unavailable |
| Bar Chart | yes | yes | A | public | Beta | yes | yes | no | VERIFIED | — | Maintain | Content & Data; figmaAvailability=available |
| Breadcrumb | yes | yes | A | public | Stable | yes | yes | no | VERIFIED | — | Maintain | Navigation; figmaAvailability=available |
| Button | yes | yes | A | public | Stable | yes | yes | yes | VERIFIED | — | Maintain | Actions; figmaAvailability=available |
| Calendar Day | yes | yes | A | public | Stable | yes | yes | no | VERIFIED | — | Maintain | Content & Data; figmaAvailability=available |
| Calendar Grid | yes | yes | A | public | Beta | yes | yes | no | PARTIAL | P2 | Dedicated parity task if product needs | Content & Data; figmaAvailability=partial |
| Card | yes | yes | A | public | Stable | yes | yes | yes | VERIFIED | — | Maintain | Containers & Overlays; figmaAvailability=available |
| Checkbox | yes | yes | A | public | Stable | yes | yes | no | VERIFIED | — | Maintain | Forms; figmaAvailability=available |
| Combobox | yes | yes | A | public | Beta | yes | yes | no | VERIFIED | — | Maintain | Forms; figmaAvailability=available |
| Data Table | yes | yes | A | public | Beta | yes | yes | no | PARTIAL | P2 | Dedicated parity task if product needs | Content & Data; figmaAvailability=partial |
| Date Picker | yes | yes | A | public | Beta | yes | yes | no | VERIFIED | — | Maintain | Forms; figmaAvailability=available |
| Dialog | yes | yes | A | public | Stable | yes | yes | no | VERIFIED | — | Maintain | Containers & Overlays; figmaAvailability=available |
| Divider | yes | yes | A | public | Stable | yes | yes | yes | VERIFIED | — | Maintain | Content & Data; figmaAvailability=available |
| Drawer | yes | yes | A | public | Beta | yes | yes | no | VERIFIED | — | Maintain | Containers & Overlays; figmaAvailability=available |
| Empty State | yes | yes | A | public | Beta | yes | yes | no | VERIFIED | — | Maintain | Content & Data; figmaAvailability=available |
| File Upload | yes | yes | A | public | Beta | yes | yes | no | VERIFIED | — | Maintain | Forms; figmaAvailability=available |
| Form Field | yes | yes | A | public | Stable | yes | yes | yes | VERIFIED | — | Maintain | Forms; figmaAvailability=available |
| Line Chart | yes | yes | A | public | Beta | yes | yes | no | VERIFIED | — | Maintain | Content & Data; figmaAvailability=available |
| Link | yes | yes | A | public | Stable | yes | yes | yes | VERIFIED | — | Maintain | Actions; figmaAvailability=available |
| List Item | yes | yes | A | public | Beta | yes | yes | no | VERIFIED | — | Maintain | Content & Data; figmaAvailability=available |
| Menu | yes | yes | A | public | Beta | yes | yes | no | VERIFIED | — | Maintain | Navigation; figmaAvailability=available |
| Pagination | yes | yes | A | public | Stable | yes | yes | no | VERIFIED | — | Maintain | Navigation; figmaAvailability=available |
| Popover | yes | yes | A | public | Stable | yes | yes | no | VERIFIED | — | Maintain | Containers & Overlays; figmaAvailability=available |
| Progress Bar | yes | yes | A | public | Stable | yes | yes | no | VERIFIED | — | Maintain | Feedback; figmaAvailability=available |
| Radio | yes | yes | A | public | Stable | yes | yes | no | VERIFIED | — | Maintain | Forms; figmaAvailability=available |
| Radio Group | yes | yes | A | public | Stable | yes | yes | no | PARTIAL | P2 | Dedicated parity task if product needs | Forms; figmaAvailability=partial |
| Search Field | yes | yes | A | public | Stable | yes | yes | no | VERIFIED | — | Maintain | Forms; figmaAvailability=available |
| Select | yes | yes | A | public | Stable | yes | yes | no | VERIFIED | — | Maintain | Forms; figmaAvailability=available |
| Skeleton | yes | yes | A | public | Stable | yes | yes | no | VERIFIED | — | Maintain | Feedback; figmaAvailability=available |
| Spinner | yes | yes | A | public | Stable | yes | yes | yes | VERIFIED | — | Maintain | Feedback; figmaAvailability=available |
| Switch | yes | yes | A | public | Stable | yes | yes | no | VERIFIED | — | Maintain | Forms; figmaAvailability=available |
| Table | yes | yes | A | public | Beta | yes | yes | no | VERIFIED | — | Maintain | Content & Data; figmaAvailability=available |
| Tabs | yes | yes | A | public | Stable | yes | yes | no | VERIFIED | — | Maintain | Navigation; figmaAvailability=available |
| Tag | yes | yes | A | public | Beta | yes | yes | no | VERIFIED | — | Maintain | Content & Data; figmaAvailability=available |
| Text Input | yes | yes | A | public | Stable | yes | yes | yes | VERIFIED | — | Maintain | Forms; figmaAvailability=available |
| Textarea | yes | yes | A | public | Stable | yes | yes | no | VERIFIED | — | Maintain | Forms; figmaAvailability=available |
| Timeline | yes | yes | A | public | Beta | yes | yes | no | VERIFIED | — | Maintain | Content & Data; figmaAvailability=available |
| Toast | yes | yes | A | public | Stable | yes | yes | no | VERIFIED | — | Maintain | Feedback; figmaAvailability=available |
| Tooltip | yes | yes | A | public | Stable | yes | yes | no | VERIFIED | — | Maintain | Feedback; figmaAvailability=available |
| Tree View | yes | yes | A | public | Beta | yes | yes | no | VERIFIED | — | Maintain | Content & Data; figmaAvailability=available |
| Validation Message | yes | yes | A | public | Stable | yes | yes | yes | VERIFIED | — | Maintain | Forms; figmaAvailability=available |

### Docs-only / Figma-documented without React registry entry

| Component | Figma | React | Class | Public/Internal | Stable/Beta | Docs | Agent | /r | Parity | Priority | Next | Notes |
|-----------|-------|-------|-------|-----------------|-------------|------|-------|----|--------|----------|------|-------|
| Accordion Item | yes (content/) | no | C | internal | — | docs-only | no | no | — | — | Keep as composition — do not add standalone React API | Containers & Overlays; building-block / item |
| Breadcrumb Item | yes (content/) | no | C | internal | — | docs-only | no | no | — | — | Keep as composition — do not add standalone React API | Navigation; building-block / item |
| Button Group | yes (content/) | no | B | public | — | docs-only | no | no | — | P2 | CE-1 candidate | Actions; content inventory; no registry entry |
| Credit Card Field | yes (content/) | no | B | public | — | docs-only | no | no | — | P3 | CE-1 candidate | Forms; content inventory; no registry entry |
| Dropdown Trigger | yes (content/) | no | C | internal | — | docs-only | no | no | — | — | Keep as composition — do not add standalone React API | Navigation; building-block / item |
| Icon Button | yes (content/) | no | E | public (Figma) | — | docs-only | no | no | — | P2 | Product decision vs Button+aria-label | Actions; content explicitly maps React to Button |
| Menu Item | yes (content/) | no | C | internal | — | docs-only | no | no | — | — | Keep as composition — do not add standalone React API | Navigation; building-block / item |
| Page Item | yes (content/) | no | C | internal | — | docs-only | no | no | — | — | Keep as composition — do not add standalone React API | Navigation; building-block / item |
| Phone Number Field | yes (content/) | no | B | public | — | docs-only | no | no | — | P3 | CE-1 candidate | Forms; content inventory; no registry entry |
| Sidebar Nav Item | yes (content/) | no | C | internal | — | docs-only | no | no | — | — | Keep as composition — do not add standalone React API | Navigation; building-block / item |
| Slider | yes (content/) | no | B | public | — | docs-only | no | no | — | P1 | CE-1 candidate | Forms; content inventory; no registry entry |
| Split Button | yes (content/) | no | B | public | — | docs-only | no | no | — | P2 | CE-1 candidate | Actions; content inventory; no registry entry |
| Step Item | yes (content/) | no | C | internal | — | docs-only | no | no | — | — | Keep as composition — do not add standalone React API | Navigation; building-block / item |
| Timeline Item | yes (content/) | no | C | internal | — | docs-only | no | no | — | — | Keep as composition — do not add standalone React API | Content & Data; building-block / item |
| Top Nav Item | yes (content/) | no | C | internal | — | docs-only | no | no | — | — | Keep as composition — do not add standalone React API | Navigation; building-block / item |
| Tree Item | yes (content/) | no | C | internal | — | docs-only | no | no | — | — | Keep as composition — do not add standalone React API | Content & Data; building-block / item |

## Stabilization register (unchanged)

CE-0 does not close STAB-001…STAB-006. Those remain Community/Beta
steady-state items (`/r/registry.json`, CoC private contact, Figma Pro
sharing confirmation, Free Figma terms, early external signal, NEW badge).

## Roadmap after CE-0

- Community/Beta Stabilization = steady-state monitoring
- **CE-0 = COMPLETE**
- **CE-1 = NEXT, NOT STARTED** (Class B gaps above)
- CE-2 / CE-3 / Reference App / PH-0 / Guard = later / NOT STARTED
