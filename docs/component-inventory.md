# Skrewww component inventory (CE-0 → CE-1E)

> **Last updated:** 2026-09-14 · **CE-0 freeze SHA:** `7593ea4` · **CE-1A–CE-1E:** COMPLETE through Phone Number Field (CE-1 closed)
> Planning source for completed CE-1. Do **not** start CE-2 / CE-3 / PH-0 / Guard here.

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
| Live Figma | Pro file `U6KUuNf7DF4CP9QBOkLSUx` (read-only MCP) | Forms page `2002:2368`; Phone Number Field set `2024:2776` verified CE-1E |

**Do not equate** `content/` count with “missing React components.” Many content
entries are Figma item primitives that React correctly models via composition.

## Exact totals (verified 2026-09-14, post CE-1E)

### React (canonical registry)

| Metric | Count |
|--------|------:|
| Implemented public React components | **52** |
| Stable | **27** |
| Beta | **25** |
| Public docs pages (implemented) | **52** |
| Agent Kit contracts | **52** |
| `/r` component manifests | **8** (+ `foundation` shared cut = 9 files) |

`/r` components: button, card, divider, form-field, link, spinner, text-input, validation-message.
Slider / Button Group / Split Button / Credit Card Field / Phone Number Field `/r` deferred to **CE-3**.

### Figma / documentation inventory

| Metric | Count |
|--------|------:|
| `content/` documented entries | **63** |
| With React counterpart (registry) | **52** |
| Docs-only (no React registry entry) | **11** |
| Of those: internal / building-block (Class C) | **10** |
| Of those: genuine public Figma→React gap candidates (Class B) | **0** |
| Of those: modeling difference (Class E) | **1** (Icon Button) |

### Classification totals

| Class | Meaning | Count |
|-------|---------|------:|
| **A** | Public parity (both sides) | **49** |
| **B** | Genuine Figma→React gap | **0** |
| **C** | Figma internal / building block | **10** |
| **D** | React→Figma gap (confirmed no Figma master) | **3** |
| **E** | Naming / modeling difference | **1** |
| **F** | Legacy / unknown | **0** |

### Parity depth (Class A + partial A)

| Parity status | Count | Notes |
|---------------|------:|-------|
| VERIFIED (`figmaAvailability: available`) | **46** | Includes Slider + Button Group + Split Button + Credit Card Field + Phone Number Field |
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
| Actions | 4 | 5 | 1 | 0 | 0 (+ Icon Button = E) |
| Containers & Overlays | 5 | 6 | 1 | 0 | 1 (accordion-item) |
| Forms | 16 | 16 | 0 | 0 | 0 |
| Feedback | 7 | 7 | 0 | 0 | 0 |
| Navigation | 4 | 11 | 7 | 0 | 7 |
| Content & Data | 16 | 18 | 2 | 0 | 2 (tree-item, timeline-item) |

Largest remaining **product** gap pressure: none for Class B. CE-2 candidates are separate.

## CE-1 status

| Item | Status |
|------|--------|
| **CE-1A Slider** | ✅ COMPLETE — Class B → A; Beta `0.1.0-beta`; `/r` deferred to CE-3 |
| **CE-1B Button Group** | ✅ COMPLETE — Class B → A; Beta `0.1.0-beta`; `/r` deferred to CE-3 |
| **CE-1C Split Button** | ✅ COMPLETE — Class B → A; Beta `0.1.0-beta`; `/r` deferred to CE-3 |
| **CE-1D Credit Card Field** | ✅ COMPLETE — Class B → A; Beta `0.1.0-beta`; `/r` deferred to CE-3 |
| **CE-1E Phone Number Field** | ✅ COMPLETE — Class B → A; Beta `0.1.0-beta`; `/r` deferred to CE-3 |
| **CE-1 overall** | ✅ **COMPLETE** |

Remaining genuine **Class B** gaps: **none**.

**Also track (not auto-implement):**

- **Icon Button (Class E)** — product decision whether to keep Button+`aria-label` or add a public React API matching Figma.
- **PARTIAL parity** — Data Table shell, Radio Group Figma framing, Calendar Grid range/grid verification — dedicated parity tasks, not greenfield components.
- **Class D Banking** — React→Figma documentation/design follow-up if Industry Systems expands in Figma.

## CE-2 candidates — NOT YET APPROVED / NOT STARTED

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
| SaaS dashboard | **READY WITH GAPS** | denser filters; notification center; optional Icon Button clarity |
| Settings / admin | **READY WITH GAPS** | Toggle Group; denser form composites |
| Form-heavy product | **READY WITH GAPS** | Number Input (CE-2 candidate); specialists now shipped |
| Marketing / content site | **READY** | Core content + actions + feedback sufficient |

## Distribution coverage (inventory only)

| Layer | Count | Note |
|-------|------:|------|
| Implemented | 52 | |
| Docs | 52 implemented + 11 docs-only | |
| Agent contracts | 52 | |
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
| Button Group | yes (Actions/Button Group `2022:1013`) | yes | A | public | Beta | yes | yes | no (CE-3) | VERIFIED | — | Maintain | Actions; CE-1B; joined independent Buttons; not radiogroup |
| Calendar Day | yes | yes | A | public | Stable | yes | yes | no | VERIFIED | — | Maintain | Content & Data; figmaAvailability=available |
| Calendar Grid | yes | yes | A | public | Beta | yes | yes | no | PARTIAL | P2 | Dedicated parity task if product needs | Content & Data; figmaAvailability=partial |
| Card | yes | yes | A | public | Stable | yes | yes | yes | VERIFIED | — | Maintain | Containers & Overlays; figmaAvailability=available |
| Checkbox | yes | yes | A | public | Stable | yes | yes | no | VERIFIED | — | Maintain | Forms; figmaAvailability=available |
| Combobox | yes | yes | A | public | Beta | yes | yes | no | VERIFIED | — | Maintain | Forms; figmaAvailability=available |
| Credit Card Field | yes (Forms/Credit Card Field `2024:2714`) | yes | A | public | Beta | yes | yes | no (CE-3) | VERIFIED | — | Maintain | Forms; CE-1D; compound number/expiry/CVC; generic icon; not payment processor |
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
| Phone Number Field | yes (Forms/Phone Number Field `2024:2776`) | yes | A | public | Beta | yes | yes | no (CE-3) | VERIFIED | — | Maintain | Forms; CE-1E; country Select + type=tel; flag placeholder decorative; not SMS/carrier verification |
| Popover | yes | yes | A | public | Stable | yes | yes | no | VERIFIED | — | Maintain | Containers & Overlays; figmaAvailability=available |
| Progress Bar | yes | yes | A | public | Stable | yes | yes | no | VERIFIED | — | Maintain | Feedback; figmaAvailability=available |
| Radio | yes | yes | A | public | Stable | yes | yes | no | VERIFIED | — | Maintain | Forms; figmaAvailability=available |
| Radio Group | yes | yes | A | public | Stable | yes | yes | no | PARTIAL | P2 | Dedicated parity task if product needs | Forms; figmaAvailability=partial |
| Search Field | yes | yes | A | public | Stable | yes | yes | no | VERIFIED | — | Maintain | Forms; figmaAvailability=available |
| Select | yes | yes | A | public | Stable | yes | yes | no | VERIFIED | — | Maintain | Forms; figmaAvailability=available |
| Skeleton | yes | yes | A | public | Stable | yes | yes | no | VERIFIED | — | Maintain | Feedback; figmaAvailability=available |
| Spinner | yes | yes | A | public | Stable | yes | yes | yes | VERIFIED | — | Maintain | Feedback; figmaAvailability=available |
| Split Button | yes (Actions/Split Button `2022:1086`) | yes | A | public | Beta | yes | yes | no (CE-3) | VERIFIED | — | Maintain | Actions; CE-1C; primary Button + Menu; joined chrome |
| Switch | yes | yes | A | public | Stable | yes | yes | no | VERIFIED | — | Maintain | Forms; figmaAvailability=available |
| Slider | yes (Forms/Slider `2024:2373`) | yes | A | public | Beta | yes | yes | no (CE-3) | VERIFIED | — | Maintain | Forms; CE-1A; State Default/Hover/Focused/Disabled; single-thumb |
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
| Dropdown Trigger | yes (content/) | no | C | internal | — | docs-only | no | no | — | — | Keep as composition — do not add standalone React API | Navigation; building-block / item |
| Icon Button | yes (content/) | no | E | public (Figma) | — | docs-only | no | no | — | P2 | Product decision vs Button+aria-label | Actions; content explicitly maps React to Button |
| Menu Item | yes (content/) | no | C | internal | — | docs-only | no | no | — | — | Keep as composition — do not add standalone React API | Navigation; building-block / item |
| Page Item | yes (content/) | no | C | internal | — | docs-only | no | no | — | — | Keep as composition — do not add standalone React API | Navigation; building-block / item |
| Sidebar Nav Item | yes (content/) | no | C | internal | — | docs-only | no | no | — | — | Keep as composition — do not add standalone React API | Navigation; building-block / item |
| Step Item | yes (content/) | no | C | internal | — | docs-only | no | no | — | — | Keep as composition — do not add standalone React API | Navigation; building-block / item |
| Timeline Item | yes (content/) | no | C | internal | — | docs-only | no | no | — | — | Keep as composition — do not add standalone React API | Content & Data; building-block / item |
| Top Nav Item | yes (content/) | no | C | internal | — | docs-only | no | no | — | — | Keep as composition — do not add standalone React API | Navigation; building-block / item |
| Tree Item | yes (content/) | no | C | internal | — | docs-only | no | no | — | — | Keep as composition — do not add standalone React API | Content & Data; building-block / item |

## Stabilization register (unchanged)

CE-0 does not close STAB-001…STAB-006. Those remain Community/Beta
steady-state items (`/r/registry.json`, CoC private contact, Figma Pro
sharing confirmation, Free Figma terms, early external signal, NEW badge).

## Roadmap after CE-1E

- Community/Beta Stabilization = steady-state monitoring
- **CE-0 = COMPLETE**
- **CE-1A Slider = COMPLETE**
- **CE-1B Button Group = COMPLETE**
- **CE-1C Split Button = COMPLETE**
- **CE-1D Credit Card Field = COMPLETE**
- **CE-1E Phone Number Field = COMPLETE**
- **CE-1 overall = COMPLETE**
- **CE-2 = NEXT, NOT STARTED**
- CE-3 / Reference App / PH-0 / Guard = later / NOT STARTED
