# Skrewww component inventory (CE-0 → CE-2K)

> **Last updated:** 2026-09-15 · **CE-0 freeze SHA:** `7593ea4` · **CE-1:** COMPLETE · **CE-2A–C:** Toggle Group shipped; **CE-2D:** Multi Select audited and deferred; **CE-2E:** Advanced Filters audited — composition, not a component; **CE-2F:** Stepper audited — compound Stepper+Step justified; **CE-2G:** Notification Center audited — composition, not a component; **CE-2H:** Command Palette audited — composition, a11y role model genuinely unresolved; **CE-2I:** App Shell / richer navigation audited — Reference-App template first, no more CE-2A candidates remain; **CE-2J:** Stepper Figma/MCP verification COMPLETE (decision B, narrower contract); **CE-2K:** Stepper **SHIPPED** (Beta `0.1.0-beta`) — **CE-2 Net-New Component Expansion is now COMPLETE**
> Class B = **0**. See [`docs/component-expansion.md`](component-expansion.md).

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

## Exact totals (verified 2026-09-15, post CE-2K)

### React (canonical registry)

| Metric | Count |
|--------|------:|
| Implemented public React components | **55** |
| Stable | **27** |
| Beta | **28** |
| Public docs pages (implemented) | **55** |
| Agent Kit contracts | **55** |
| `/r` component manifests | **8** (+ `foundation` shared cut = 9 files) |

`/r` components: button, card, divider, form-field, link, spinner, text-input, validation-message.
CE-1 specialists + Number Input + Toggle Group + **Stepper** `/r` deferred to **CE-3**.

### Figma / documentation inventory

| Metric | Count |
|--------|------:|
| `content/` documented entries | **66** |
| With React counterpart (registry) | **55** |
| Docs-only (no React registry entry) | **11** |
| Of those: internal / building-block (Class C) | **10** |
| Of those: genuine public Figma→React gap candidates (Class B) | **0** |
| Of those: modeling difference (Class E) | **1** (Icon Button) |

`content/` entries: +1 (`stepper`, matched to the new `stepper` registry entry). `step-item` stays docs-only/Class C — see classification note below.

### Classification totals

| Class | Meaning | Count |
|-------|---------|------:|
| **A** | Public parity (both sides) | **50** |
| **B** | Genuine Figma→React gap | **0** |
| **C** | Figma internal / building block | **10** |
| **D** | React→Figma gap (confirmed no / pending Figma master) | **5** |
| **E** | Naming / modeling difference | **1** |
| **F** | Legacy / unknown | **0** |

**CE-2K classification decision — Stepper is Class A, Step Item stays Class C (not reclassified to E).**
CE-2K's own task brief raised the question of whether Step Item should move
to Class E ("modeling difference") because Figma's public model is
`Navigation/Step Item` (a component set) + a composed `Stepper Trail
(example)` frame, while React's public model is one top-level `Stepper`
component internally composing `Step` children — no standalone Figma
"Stepper" component exists. Re-evaluating this against CE-0's own
classification rules and the **directly analogous existing precedent
already in this table**: **Timeline** (Class A) has the exact same shape —
Figma has no standalone "Timeline" component either, only `Content/Timeline
Item` (Class C) — and Timeline Item was correctly never reclassified to E
merely because React names the top-level export differently from Figma's
item-level component. Class E is reserved for a genuine, **unresolved
product ambiguity** (Icon Button: an open question whether Button+`aria-
label` truly satisfies the same need Figma's distinctly-named component
implies). Stepper has no such ambiguity — it unambiguously, verifiably
implements the capability Step Item + the composed example describe, with
a deliberate, already-verified architectural decision (compound
`Stepper`+`Step`, exactly matching Figma's item-level anatomy). **Stepper →
Class A** (verified live Figma anatomy + a real, verified React
implementation — parity at the capability level, matching Timeline's own
established precedent). **Step Item stays Class C**, unchanged, same
treatment as Timeline Item.

### Parity depth (Class A + partial A)

| Parity status | Count | Notes |
|---------------|------:|-------|
| VERIFIED (`figmaAvailability: available`) | **46** | Includes Slider + Button Group + Split Button + Credit Card Field + Phone Number Field |
| PARTIAL | **3** | radio-group, data-table, calendar-grid |
| UNKNOWN / unavailable (Class D) | **5** | Banking pilot trio + Number Input + Toggle Group |

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
| Actions | 5 | 6 | 1 | 0 | 0 (+ Icon Button = E) |
| Containers & Overlays | 5 | 6 | 1 | 0 | 1 (accordion-item) |
| Forms | 17 | 17 | 0 | 0 | 0 |
| Feedback | 7 | 7 | 0 | 0 | 0 |
| Navigation | 5 | 12 | 7 | 0 | 7 |
| Content & Data | 16 | 18 | 2 | 0 | 2 (tree-item, timeline-item) |

Class B = 0. CE-2B Number Input + CE-2C Toggle Group + **CE-2K Stepper** shipped (Stepper is Class A, Figma-verified — see classification note above). Segmented Control resolved by Toggle Group. Multi Select audited and **deferred** (CE-2D). Advanced Filters is **composition, not a component** (CE-2E). Notification Center is **composition, not a component** (CE-2G). Command Palette is **composition, not a component, searchable role model unresolved** (CE-2H). App Shell / richer navigation is **Reference-App template first** (CE-2I). **CE-2 Net-New Component Expansion is now COMPLETE** — no further CE-2A-scored implementation candidates remain. Next: **CE-3 — Distribution Expansion (NOT STARTED in this task)**.

## CE-1 status

| Item | Status |
|------|--------|
| **CE-1A–CE-1E** | ✅ COMPLETE |
| **CE-1 overall** | ✅ **COMPLETE** |
| Class B gaps | **0** |

## CE-2 status

| Item | Status |
|------|--------|
| **CE-2A Expansion Prioritization** | ✅ COMPLETE — [`docs/component-expansion.md`](component-expansion.md) |
| **CE-2B Number Input** | ✅ COMPLETE — Beta `0.1.0-beta`; React-first / Figma pending; `/r` deferred to CE-3 |
| **CE-2C Toggle Group** | ✅ COMPLETE — Beta `0.1.0-beta`; Segmented Control = presentation (decision A); `/r` deferred to CE-3 |
| **CE-2D Multi Select audit** | ✅ COMPLETE — **decision D (defer)**; see [`docs/component-expansion.md`](component-expansion.md#ce-2d--multi-select-product--architecture-audit-decision-d--defer) |
| **CE-2E Advanced Filters audit** | ✅ COMPLETE — **decision B (composition, not a component)**; see [`docs/component-expansion.md`](component-expansion.md#ce-2e--advanced-filters-product--architecture-audit-decision-b--composition-not-a-component) |
| **CE-2F Stepper audit** | ✅ COMPLETE — **decision B (compound Stepper + Step justified)**, proposed contract only; see [`docs/component-expansion.md`](component-expansion.md#ce-2f--stepper-product--architecture-audit-decision-b--compound-stepper--step-justified-proposed-contract-only) |
| **CE-2G Notification Center audit** | ✅ COMPLETE — **decision C (composition, not a component)**; see [`docs/component-expansion.md`](component-expansion.md#ce-2g--notification-center-product--architecture-audit-decision-c--composition-not-a-component) |
| **CE-2H Command Palette audit** | ✅ COMPLETE — **decision C (composition, not a component)**, accessibility role model genuinely unresolved; see [`docs/component-expansion.md`](component-expansion.md#ce-2h--command-palette-product--architecture-audit-decision-c--composition-accessibility-role-model-genuinely-unresolved) |
| **CE-2I App Shell audit** | ✅ COMPLETE — **decision D (Reference-App template first)**; responsive-nav slice separately C-ready; see [`docs/component-expansion.md`](component-expansion.md#ce-2i--app-shell--richer-navigation-product--architecture-audit-decision-d--reference-app-template-first) |
| **CE-2J Stepper Figma/MCP verification** | ✅ COMPLETE — **decision B, READY WITH NARROWER CONTRACT** (`orientation`/`Step.description` dropped; live-verified against `Navigation/Step Item` node `2024:2944`); see [`docs/component-expansion.md`](component-expansion.md#ce-2j--stepper-figmamcp-verification-decision-b--ready-with-narrower-contract) |
| **CE-2K Stepper implementation** | ✅ **SHIPPED** — Beta `0.1.0-beta`; compound `Stepper`+`Step`; Class A (see classification note above); `/r` deferred to CE-3; see [`docs/component-expansion.md`](component-expansion.md) |
| **CE-2 — Net-New Component Expansion** | ✅ **COMPLETE** — no further CE-2A-scored implementation candidates remain |
| **Next phase** | **CE-3 — Distribution Expansion — NOT STARTED** |

See full scoring in [`docs/component-expansion.md`](component-expansion.md).

**Also track (not auto-implement):**

- **Icon Button (Class E)** — product decision whether to keep Button+`aria-label` or add a public React API matching Figma.
- **PARTIAL parity** — Data Table shell, Radio Group Figma framing, Calendar Grid range/grid verification — dedicated parity tasks, not greenfield components.
- **Class D** — Banking + Number Input + Toggle Group Figma follow-up through normal design workflow (unaffected by CE-2K; Stepper is Class A, not Class D, since its Figma source was verified before implementation).

## Reference-app readiness

| App type | Readiness | Material gaps |
|----------|-----------|---------------|
| SaaS dashboard | **READY WITH GAPS** | denser filters; notification center; optional Icon Button clarity |
| Settings / admin | **READY WITH GAPS** | Toggle Group shipped; denser form composites remain |
| Form-heavy product | **READY WITH GAPS** | Number Input shipped; denser composites / filters remain |
| Marketing / content site | **READY** | Core content + actions + feedback sufficient |

## Distribution coverage (inventory only)

| Layer | Count | Note |
|-------|------:|------|
| Implemented | 55 | |
| Docs | 55 implemented + 11 docs-only | |
| Agent contracts | 55 | |
| `/r` distributed components | 8 | + foundation; Stepper deferred to CE-3 |
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
| Number Input | no (React-first / Figma pending) | yes | D | public | Beta | yes | yes | no (CE-3) | UNKNOWN | — | Maintain / later Figma | Forms; CE-2B; text+spinbutton; steppers; not currency/Slider |
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
| Stepper | yes (Navigation/Step Item `2024:2944`) | yes | A | public | Beta | yes | yes | no (CE-3) | VERIFIED | — | Maintain | Navigation; CE-2K; compound Stepper + Step; state derived from currentStep, not a component variant; Class A per Timeline/Timeline-Item precedent (see classification note above) |
| Switch | yes | yes | A | public | Stable | yes | yes | no | VERIFIED | — | Maintain | Forms; figmaAvailability=available |
| Slider | yes (Forms/Slider `2024:2373`) | yes | A | public | Beta | yes | yes | no (CE-3) | VERIFIED | — | Maintain | Forms; CE-1A; State Default/Hover/Focused/Disabled; single-thumb |
| Table | yes | yes | A | public | Beta | yes | yes | no | VERIFIED | — | Maintain | Content & Data; figmaAvailability=available |
| Tabs | yes | yes | A | public | Stable | yes | yes | no | VERIFIED | — | Maintain | Navigation; figmaAvailability=available |
| Tag | yes | yes | A | public | Beta | yes | yes | no | VERIFIED | — | Maintain | Content & Data; figmaAvailability=available |
| Text Input | yes | yes | A | public | Stable | yes | yes | yes | VERIFIED | — | Maintain | Forms; figmaAvailability=available |
| Textarea | yes | yes | A | public | Stable | yes | yes | no | VERIFIED | — | Maintain | Forms; figmaAvailability=available |
| Timeline | yes | yes | A | public | Beta | yes | yes | no | VERIFIED | — | Maintain | Content & Data; figmaAvailability=available |
| Toast | yes | yes | A | public | Stable | yes | yes | no | VERIFIED | — | Maintain | Feedback; figmaAvailability=available |
| Toggle Group | no (React-first / Figma pending) | yes | D | public | Beta | yes | yes | no (CE-3) | UNKNOWN | — | Maintain / later Figma | Actions; CE-2C; radiogroup single; Segmented Control = presentation |
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
| Step Item | yes (Navigation/Step Item `2024:2944`) | no | C | internal | — | VERIFIED | no | no | — | — | CE-2K (2026-09-15): **Stepper shipped** (Beta `0.1.0-beta`) — see the `Stepper` row above (Class A). Step Item itself **stays Class C**, unchanged — same treatment as Timeline Item; it is the internal state a Step derives structurally, not a standalone React export (`state` is never a public Step prop). | Navigation; building-block / item |
| Timeline Item | yes (content/) | no | C | internal | — | docs-only | no | no | — | — | Keep as composition — do not add standalone React API | Content & Data; building-block / item |
| Top Nav Item | yes (content/) | no | C | internal | — | docs-only | no | no | — | — | Keep as composition — do not add standalone React API | Navigation; building-block / item |
| Tree Item | yes (content/) | no | C | internal | — | docs-only | no | no | — | — | Keep as composition — do not add standalone React API | Content & Data; building-block / item |

## Stabilization register (unchanged)

CE-0 does not close STAB-001…STAB-006. Those remain Community/Beta
steady-state items (`/r/registry.json`, CoC private contact, Figma Pro
sharing confirmation, Free Figma terms, early external signal, NEW badge).

## Roadmap after CE-2K

- Community/Beta Stabilization = steady-state monitoring
- **CE-0 = COMPLETE**
- **CE-1 = COMPLETE**
- **CE-2A Expansion Prioritization = COMPLETE**
- **CE-2B Number Input = COMPLETE**
- **CE-2C Toggle Group = COMPLETE** (Segmented Control resolved by Toggle Group)
- **CE-2D Multi Select audit = COMPLETE** — **decision D, deferred** (not implemented; not a rejection)
- **CE-2E Advanced Filters audit = COMPLETE** — **decision B, composition not a component** (not implemented; product need preserved as a future Recipe target, pending Reference App evidence)
- **CE-2F Stepper audit = COMPLETE** — **decision B, compound Stepper + Step justified**
- **CE-2G Notification Center audit = COMPLETE** — **decision C, composition not a component** (not implemented; product need preserved as a future Recipe target, pending Reference App evidence)
- **CE-2H Command Palette audit = COMPLETE** — **decision C, composition not a component, accessibility role model genuinely unresolved** (not implemented; Menu/Combobox/Dialog untouched)
- **CE-2I App Shell / richer navigation audit = COMPLETE** — **decision D, Reference-App template first** (responsive-nav slice separately C-ready; not implemented; Skrewww's own site navigation inspected but not refactored)
- **CE-2J Stepper Figma/MCP verification = COMPLETE** — **decision B, READY WITH NARROWER CONTRACT**. Live-verified against `Navigation/Step Item` (node `2024:2944`, 3 variants) and a composed `Stepper Trail (example)` frame (node `2024:2949`). `orientation` and `Step.description` dropped from CE-2F's proposal (zero Figma evidence); everything else verified.
- **CE-2K Stepper implementation = COMPLETE** — Beta `0.1.0-beta`, compound `Stepper`+`Step`, Class A (Timeline/Timeline-Item precedent). Docs, live preview, canonical registry, and generated Agent contract all shipped. `/r` deferred to CE-3.
- **CE-2 — Net-New Component Expansion = ✅ COMPLETE**
- **Next phase: CE-3 — Distribution Expansion — NOT STARTED**
- Reference App / PH-0 / Guard = later / NOT STARTED
