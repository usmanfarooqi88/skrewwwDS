# CE-3 distribution expansion plan

> **CE-3A** · Verified 2026-09-15 · Baseline `2b01ca5` · React **55** (27 Stable / 28 Beta)
> **CE-3D/E/F planning** · Verified 2026-09-15 · Baseline `a867076` · `/r` = foundation + **13**
> **CE-3G higher-complexity planning** · Verified 2026-09-15 · Baseline `08bf6a6` · `/r` = foundation + **21**
> Canonical planning artifact for CE-3. Does **not** redesign the locked
> shadcn transport architecture. Implementation batches CE-3D/E/F are
> **SHIPPED** (see Status table). CE-3H onward are **DEFINED — NOT STARTED**
> below (see CE-3G section).

## Purpose

Expand the proven `npx shadcn@latest add @skrewww/<slug>` install surface
**without**:

- inventing a second registry
- hand-editing `public/r/`
- changing component APIs
- implementing `/r/registry.json` in this overnight pass
- distributing specialized/banking/chart packages prematurely

## Locked architecture (unchanged)

| Concern | Source |
|---------|--------|
| Canonical components | `lib/component-registry*.ts` |
| Generator (pure) | `lib/shadcn-registry-generator.ts` |
| Writer CLI | `scripts/generate-shadcn-registry.ts` |
| Output | `public/r/*.json` (**gitignored**, generated) |
| Installer npm deps | `entry.dependencies` only |
| Host packages | `hostRequirements` → shadcn `docs` only (never installer deps) |
| Skrewww graph | `registryDependencies` |
| File placement | exhaustive `FILE_DESTINATIONS` (no silent defaults) |

## Starting `/r` coverage (verified)

**Foundation** + **8** component manifests:

`button`, `card`, `text-input`, `form-field`, `validation-message`, `spinner`,
`divider`, `link`

All eight are **Stable** and already carry complete distribution metadata
(`files`, `internalDependencies`, `registryDependencies`, `hostRequirements`).

## Critical discovery (CE-3A)

**47 of 55** implemented components lack distribution transport metadata
(`files` / `internalDependencies` / `registryDependencies` empty).

Implication: CE-3 implementation is **not** “flip a switch.” Each new slug
requires:

1. Populate canonical distribution fields from **real imports**
2. Add every transported path to `FILE_DESTINATIONS`
3. Add thin `buildXManifest()` + wire `generate-shadcn-registry.ts`
4. Extend generator tests (+ smoke descriptor when a new pattern appears)

No API/runtime changes required for Tier-1 Stable controls.

## Eligibility classification (all 55)

### Already distributed (8)

`button`, `card`, `text-input`, `form-field`, `validation-message`, `spinner`,
`divider`, `link`

### ELIGIBLE_NOW — Tier 1 (simple Stable / cn-only)

| Slug | Files (owned + internal) | Notes |
|------|--------------------------|-------|
| **checkbox** | Checkbox.tsx, checkbox.module.css, cn.ts | Native input; client component |
| **progress-bar** | ProgressBar.tsx, progress-bar.module.css, cn.ts | No `"use client"` required |
| **skeleton** | Skeleton.tsx, skeleton.module.css, cn.ts | No `"use client"` required |
| **radio** | Radio.tsx, radio.module.css, cn.ts | Native radio; pair later with radio-group |

### ELIGIBLE_AFTER_MAPPING — Tier 2 (one new helper or registryDep)

| Slug | Extra mapping | Notes |
|------|---------------|-------|
| **switch** | `lib/use-controllable.ts` | Stable; settings toggle |
| **slider** | `lib/use-controllable.ts` | Beta; CE deferred → CE-3 later |
| **table** | none beyond cn | Beta; basic table |
| **stepper** | none beyond cn | Beta; CE-2 → CE-3 candidate |
| **badge** | `internal/feedback-types.ts` | Beta |
| **avatar** | `@phosphor-icons/react` | Stable; npm dep |
| **tag** | `@phosphor-icons/react` | Beta |
| **button-group** | `button-group-context.ts` | Beta; needs Button already installed for real use |
| **toggle-group** | keyboard helper + use-controllable | Beta |
| **textarea** | registryDeps → form-field (+ validation-message) | Stable; reuses existing `/r` chain |
| **list-item** | `internal/link-utils.ts` (already mapped for Link) | Beta |
| **pagination** | link-utils (already mapped) | Stable |
| **tabs** | tab-keyboard + use-controllable | Stable |
| **accordion** | use-controllable + phosphor | Beta |
| **timeline** | TimelineItemRow internal | Beta |

### ELIGIBLE_AFTER_DEPENDENCY_FIX / NEEDS_CONSUMER_RESEARCH — Tier 3–4

| Slug | Why deferred from overnight CE-3B/C |
|------|-------------------------------------|
| radio-group | Pulls Radio + ValidationMessage; OK soon after radio |
| search-field / number-input | FormField + TextInputControl + phosphor |
| alert | FeedbackSurface shared internals |
| empty-state | Pulls Button + Link graphs |
| split-button | Button Group chrome + Menu composition |
| credit-card-field | ValidationMessage + format helper + phosphor |
| tooltip / dialog / drawer / popover / menu / select / combobox | Large overlay helper graphs |
| date-picker / calendar-* / phone-number-field / file-upload / tree-view | Multi-file + overlays or phosphor |
| data-table | Composition over Table; verify public entrypoint |

### INTENTIONALLY_DEFER — Tier 5

| Slug | Reason |
|------|--------|
| bar-chart / line-chart | `recharts` package weight + peer assumptions |
| banking-* | Domain + chart/composition graphs |
| `/r/registry.json` | Separate CE-3 later phase (derive from eligibility, no hand list) |

## Transport tiers (evidence-based)

| Tier | Meaning | Overnight target |
|------|---------|------------------|
| **T1** | Component + CSS + `cn`; foundation only | **CE-3B** |
| **T2** | + one shared helper (`use-controllable`) or existing link-utils | **CE-3C** |
| **T3** | Compound / multi Skrewww deps | Later CE-3 |
| **T4** | Overlay/interaction helper graphs | Later CE-3 |
| **T5** | Domain / recharts / banking | Later / research |

## FILE_DESTINATIONS gaps (for planned batches)

### Already mapped (current 8 + shared)

Button/Card/TextInput/FormField/ValidationMessage/Spinner/Divider/Link trees,
`lib/cn.ts`, `icons.tsx`, `internal/link-utils.ts`.

### Required for CE-3B

| Source | Target | Components |
|--------|--------|------------|
| `components/ui/Checkbox.tsx` | `~/components/ui/Checkbox.tsx` | checkbox |
| `components/ui/checkbox.module.css` | `~/components/ui/checkbox.module.css` | checkbox |
| `components/ui/ProgressBar.tsx` | `~/components/ui/ProgressBar.tsx` | progress-bar |
| `components/ui/progress-bar.module.css` | `~/components/ui/progress-bar.module.css` | progress-bar |
| `components/ui/Skeleton.tsx` | `~/components/ui/Skeleton.tsx` | skeleton |
| `components/ui/skeleton.module.css` | `~/components/ui/skeleton.module.css` | skeleton |

(`lib/cn.ts` already mapped.)

### Required for CE-3C

| Source | Target | Components |
|--------|--------|------------|
| `components/ui/Radio.tsx` | `~/components/ui/Radio.tsx` | radio |
| `components/ui/radio.module.css` | `~/components/ui/radio.module.css` | radio |
| `components/ui/Switch.tsx` | `~/components/ui/Switch.tsx` | switch |
| `components/ui/switch.module.css` | `~/components/ui/switch.module.css` | switch |
| `lib/use-controllable.ts` | `~/lib/use-controllable.ts` | switch (+ future slider/toggle-group) |

## Dependency graph findings (recent CE components)

| Component | Transport reality |
|-----------|-------------------|
| Slider | T2 — Slider + CSS + cn + use-controllable |
| Button Group | T2 — + button-group-context; consumer still needs Button |
| Split Button | T3+ — Menu/Popover graph |
| Credit Card Field | T3 — ValidationMessage + format helper + phosphor |
| Phone Number Field | T4 — Select/Popover graph |
| Number Input | T3 — FormField + TextInputControl + phosphor + helpers |
| Toggle Group | T2 — keyboard helper + use-controllable |
| Stepper | T1 — Stepper + CSS + cn |

## Stable / Beta distribution policy

**Recommendation: C — Stable + selected proven Beta.**

Rationale:

- Current `/r` cut is Stable-only by accident of history, not policy.
- Beta is a maturity label, not an installability ban.
- Overnight CE-3B/C stay **Stable-only** for minimum risk.
- Later CE-3 batches may add selected Beta (slider, stepper, toggle-group)
  after Stable T1/T2 prove clean.

Do **not** change component maturity labels in CE-3.

## Smoke harness strategy

`npm run smoke:consumer` is component-agnostic orchestration + per-slug
descriptors in `COMPONENT_DESCRIPTORS` / `MANIFEST_BUILDERS`.

For CE-3B/C:

- Add builders for new slugs
- Add **one** smoke descriptor per **new transport pattern**
  - CE-3B: checkbox (represents T1 Stable + cn)
  - CE-3C: switch (represents T2 + `use-controllable`)
- Do not scaffold 5 identical consumers

## `/r/registry.json` recommendation (later CE-3 phase)

Derive:

canonical registry
→ distribution eligibility allow-list (or `registryDependencies` presence + `files`)
→ item manifests already generated
→ index

**No** hand-maintained second component list. **Not** overnight.

## Batch plan

### CE-3B — Tier 1 Stable (authorized overnight if CE-3A CI green)

| Slugs | `checkbox`, `progress-bar`, `skeleton` |
|-------|----------------------------------------|
| Generator | FILE_DESTINATIONS + 3 build wrappers + CLI wire-up |
| Canonical | populate files/internal/registryDeps/host for each |
| npm deps | none |
| registryDeps | `@skrewww/foundation` |
| Smoke | checkbox (+ optional skeleton assert in same pattern) |
| Risks | Low — identical transport to Spinner/Divider |
| Exit | lint, typecheck, test, build, generate:registry, smoke checkbox, remote CI |

### CE-3C — Tier 2 Stable (authorized only if CE-3B green)

| Slugs | `radio`, `switch` |
|-------|-------------------|
| Generator | FILE_DESTINATIONS for radio/switch + **first** `use-controllable` mapping |
| Canonical | populate distribution fields |
| npm deps | none |
| registryDeps | `@skrewww/foundation` |
| Smoke | switch (proves use-controllable install path) |
| Risks | Low-medium — new shared lib mapping must stay deterministic |
| Exit | same gates as CE-3B + smoke switch |

### Explicitly NOT overnight (historical CE-3B/C bound)

- radio-group, overlays, date/calendar, phone-number-field
- charts / banking
- `/r/registry.json`
- Registry Directory submission
- CE-4 / Reference App / PH-0 / Guard

> **Update 2026-09-15 (attended planning):** `radio-group` is now named in
> **CE-3E** below (radio is already distributed). Overlays / charts / banking /
> `/r/registry.json` remain excluded from unattended execution.

## Target coverage after CE-3B + CE-3C

| Metric | Before | After CE-3B | After CE-3C |
|--------|-------:|------------:|------------:|
| Foundation | 1 | 1 | 1 |
| Component manifests | 8 | **11** | **13** |
| Remaining eligible (T1–T2 rough) | ~20 | ~17 | ~15 |
| Deferred (T3–T5) | ~27 | ~27 | ~27 |

---

## Remaining undistributed set (rechecked 2026-09-15 @ `a867076`)

**Distributed (13):** button, card, checkbox, divider, form-field, link,
progress-bar, radio, skeleton, spinner, switch, text-input, validation-message.

**Remaining implemented (42)** — eligibility from CE-3A + source recheck
(import graphs). Classifications unchanged unless noted.

### Safe for named CE-3D/E/F (this document)

See batch sections below.

### Deliberately excluded from unattended CE-3D/E/F

| Slug(s) | Why |
|---------|-----|
| alert, toast | FeedbackSurface / feedback-icons / feedback-types multi-file graph |
| tabs | New `internal/tab-keyboard.ts` + controllable — Stable, but defer past F |
| search-field / number-input | FormField + TextInputControl + phosphor + helpers |
| select / combobox / menu / dialog / drawer / popover / tooltip | Overlay / focus / portal graphs — attended |
| date-picker / calendar-* / phone-number-field / file-upload / tree-view | Multi-file + overlay or date helpers |
| empty-state / split-button / credit-card-field | Multi Skrewww composition graphs |
| button-group / toggle-group / accordion / timeline / list-item / tag / badge | Beta or helper graphs — after F / attended |
| data-table | Composition over Table — after table is distributed + attended |
| bar-chart / line-chart | `recharts` — INTENTIONALLY_DEFER |
| banking-* | Domain — INTENTIONALLY_DEFER |
| `/r/registry.json` | Separate later CE-3 phase |

---

## CE-3D — Stable chain + link-utils reuse

**Status:** DEFINED — NOT STARTED
**Tier:** Stable T2
**Slugs (exact):** `textarea`, `pagination`
**Why grouped:** Both Stable; both reuse **already-mapped** helpers
(`text-input.module.css` path already in FILE_DESTINATIONS; `link-utils`
already mapped for Link). Proves (1) multi-hop `registryDependencies` like
text-input→form-field, and (2) navigation using shared link-utils without
new helper discovery. High consumer usefulness.

### Per-slug transport

#### `textarea` (Stable · Forms)

| Field | Value |
|-------|--------|
| Owned `files` | `components/ui/Textarea.tsx`, `components/ui/textarea.module.css` |
| `internalDependencies` | `lib/cn.ts`, `components/ui/text-input.module.css` (size classes shared with Text Input — transport CSS only, **not** `@skrewww/text-input`), `public/right-bottom-icon.svg` (decorative resize glyph referenced as `/right-bottom-icon.svg`) |
| `registryDependencies` | `@skrewww/form-field`, `@skrewww/foundation` |
| npm `dependencies` | `[]` (Phosphor arrives transitively via validation-message in the form-field chain) |
| `hostRequirements` | `react`, `react-dom` |
| Do **not** bundle | FormField.tsx / ValidationMessage.tsx (registryDeps only) |

#### `pagination` (Stable · Navigation)

| Field | Value |
|-------|--------|
| Owned `files` | `components/ui/Pagination.tsx`, `components/ui/pagination.module.css` |
| `internalDependencies` | `lib/cn.ts`, `components/ui/internal/link-utils.ts` |
| `registryDependencies` | `@skrewww/foundation` |
| npm `dependencies` | `[]` |
| `hostRequirements` | `react`, `react-dom`, `next` (uses `next/link`, same host model as Link) |

### FILE_DESTINATIONS additions (implement later — not this planning commit)

| Source | Target | Notes |
|--------|--------|-------|
| `components/ui/Textarea.tsx` | `~/components/ui/Textarea.tsx` | new |
| `components/ui/textarea.module.css` | `~/components/ui/textarea.module.css` | new |
| `public/right-bottom-icon.svg` | `~/public/right-bottom-icon.svg` | **new pattern:** static public asset via `registry:file` (schema already used by foundation) |
| `components/ui/Pagination.tsx` | `~/components/ui/Pagination.tsx` | new |
| `components/ui/pagination.module.css` | `~/components/ui/pagination.module.css` | new |

Already mapped (reuse): `text-input.module.css`, `lib/cn.ts`, `internal/link-utils.ts`.

### Compound check

Neither slug is a multi-export compound registry item beyond Textarea’s
`Textarea` + `TextareaControl` in **one** file → **one** registry item.

### Smoke plan

| Pattern | Descriptor |
|---------|------------|
| registryDependency chain + shared CSS + public SVG | **`textarea`** (primary) |
| link-utils + `next` host (already proven by Link; optional assert) | pagination via `shadcn view` only if textarea smoke covers the batch |

DNS: if `shadcn add` hits `ENOTFOUND ui.shadcn.com`, record **NETWORK-BLOCKED**,
not MANIFEST-FAILED. Still require: generate, parse, `shadcn view`,
deterministic regen, no `hostRequirements` in JSON.

### Manifest count delta

13 → **15** component manifests (+ foundation = 16 files).

### Exit gate

lint · typecheck · Vitest · build · `generate:registry` · deterministic regen ·
manifest inspection · representative smoke (`textarea`) · `git diff --check` ·
clean tree · push · **exact-SHA remote CI success**.
**Do not start CE-3E until this gate is green.**

---

## CE-3E — Stable phosphor leaf + Skrewww registry graph

**Status:** DEFINED — NOT STARTED
**Tier:** Stable T2–T3 (still architecture-preserving)
**Slugs (exact):** `avatar`, `breadcrumb`, `radio-group`
**Why grouped:** All Stable. Introduces (1) Stable leaf with npm
`@phosphor-icons/react` (same schema as validation-message), (2) first
`registryDependencies` on `@skrewww/link`, (3) first
`registryDependencies` on `@skrewww/radio` after CE-3C. No overlays.

### Per-slug transport

#### `avatar` (Stable · Content & Data)

| Field | Value |
|-------|--------|
| Owned `files` | `components/ui/Avatar.tsx`, `components/ui/avatar.module.css` |
| `internalDependencies` | `lib/cn.ts` |
| `registryDependencies` | `@skrewww/foundation` |
| npm `dependencies` | `["@phosphor-icons/react"]` |
| `hostRequirements` | `react`, `react-dom` |

#### `breadcrumb` (Stable · Navigation)

| Field | Value |
|-------|--------|
| Owned `files` | `components/ui/Breadcrumb.tsx`, `components/ui/breadcrumb.module.css` |
| `internalDependencies` | `lib/cn.ts` |
| `registryDependencies` | `@skrewww/link`, `@skrewww/foundation` |
| npm `dependencies` | `["@phosphor-icons/react"]` (`House` from `@phosphor-icons/react/dist/ssr`) |
| `hostRequirements` | `react`, `react-dom` (Link install documents `next`) |
| Do **not** bundle | Link.tsx / link-utils (via `@skrewww/link`) |

#### `radio-group` (Stable · Forms)

| Field | Value |
|-------|--------|
| Owned `files` | `components/ui/RadioGroup.tsx` |
| `internalDependencies` | `lib/cn.ts`, `lib/use-controllable.ts` |
| `registryDependencies` | `@skrewww/radio`, `@skrewww/validation-message`, `@skrewww/foundation` |
| npm `dependencies` | `[]` (Phosphor via validation-message) |
| `hostRequirements` | `react`, `react-dom` |
| CSS | Uses `radio.module.css` already shipped by `@skrewww/radio` — **do not** duplicate in radio-group `files` |
| Compound | Single public `RadioGroup` item; options rendered via `Radio` registryDep — **one** manifest |

### FILE_DESTINATIONS additions

| Source | Target |
|--------|--------|
| `components/ui/Avatar.tsx` | `~/components/ui/Avatar.tsx` |
| `components/ui/avatar.module.css` | `~/components/ui/avatar.module.css` |
| `components/ui/Breadcrumb.tsx` | `~/components/ui/Breadcrumb.tsx` |
| `components/ui/breadcrumb.module.css` | `~/components/ui/breadcrumb.module.css` |
| `components/ui/RadioGroup.tsx` | `~/components/ui/RadioGroup.tsx` |

Already mapped: `lib/cn.ts`, `lib/use-controllable.ts`, Link/Radio/ValidationMessage trees.

### Smoke plan

| Pattern | Descriptor |
|---------|------------|
| npm Phosphor on Stable leaf | **`avatar`** (primary) |
| registryDep `@skrewww/link` | `shadcn view` breadcrumb (+ optional composed assert) |
| registryDep `@skrewww/radio` + validation-message | `shadcn view` radio-group |

Same DNS rule as CE-3D.

### Manifest count delta

15 → **18** component manifests (+ foundation = 19 files).

### Exit gate

Same as CE-3D. **Do not start CE-3F until CE-3E remote CI is green.**

---

## CE-3F — Selected proven Beta (simple transport)

**Status:** DEFINED — NOT STARTED
**Tier:** Beta T1–T2 (policy C — Stable + selected proven Beta)
**Slugs (exact):** `slider`, `stepper`, `table`
**Why grouped:** Source graphs are fully understood; helpers already mapped
(`use-controllable` for slider); no overlay/focus architecture; no chart
package; no banking. Maturity stays Beta — distribution ≠ promotion to Stable.

### Per-slug transport

#### `slider` (Beta · Forms)

| Field | Value |
|-------|--------|
| Owned `files` | `components/ui/Slider.tsx`, `components/ui/slider.module.css` |
| `internalDependencies` | `lib/cn.ts`, `lib/use-controllable.ts` |
| `registryDependencies` | `@skrewww/foundation` |
| npm `dependencies` | `[]` |
| `hostRequirements` | `react`, `react-dom` |

#### `stepper` (Beta · Navigation)

| Field | Value |
|-------|--------|
| Owned `files` | `components/ui/Stepper.tsx`, `components/ui/stepper.module.css` |
| `internalDependencies` | `lib/cn.ts` |
| `registryDependencies` | `@skrewww/foundation` |
| npm `dependencies` | `["@phosphor-icons/react"]` (`Check` from `@phosphor-icons/react/dist/ssr`) |
| `hostRequirements` | `react`, `react-dom` |
| Compound | `Stepper` + `Step` in **one** file → **one** registry item |

#### `table` (Beta · Content & Data)

| Field | Value |
|-------|--------|
| Owned `files` | `components/ui/Table.tsx`, `components/ui/table.module.css` |
| `internalDependencies` | `lib/cn.ts` |
| `registryDependencies` | `@skrewww/foundation` |
| npm `dependencies` | `[]` |
| `hostRequirements` | `react`, `react-dom` |
| Compound | Table subcomponents (`Table`, `TableHeader`, …) in **one** file → **one** registry item |

### FILE_DESTINATIONS additions

| Source | Target |
|--------|--------|
| `components/ui/Slider.tsx` | `~/components/ui/Slider.tsx` |
| `components/ui/slider.module.css` | `~/components/ui/slider.module.css` |
| `components/ui/Stepper.tsx` | `~/components/ui/Stepper.tsx` |
| `components/ui/stepper.module.css` | `~/components/ui/stepper.module.css` |
| `components/ui/Table.tsx` | `~/components/ui/Table.tsx` |
| `components/ui/table.module.css` | `~/components/ui/table.module.css` |

Already mapped: `lib/cn.ts`, `lib/use-controllable.ts`.

### Smoke plan

| Pattern | Descriptor |
|---------|------------|
| Beta + use-controllable (already proven by switch) | **`slider`** (primary) |
| Beta + Phosphor | `shadcn view` stepper |
| Compound multi-export single file | `shadcn view` table |

### Manifest count delta

18 → **21** component manifests (+ foundation = 22 files).

### Exit gate

Same as CE-3D/E. After green CI: **STOP** (do not invent CE-3G overnight).

---

## Unattended execution order

Exact sequence for the next overnight agent — **no component-selection freedom**:

1. **CE-3D** — implement `textarea`, `pagination` only
2. Remote CI gate on CE-3D SHA — require `completed` / `success`
3. **CE-3E** — implement `avatar`, `breadcrumb`, `radio-group` only
4. Remote CI gate on CE-3E SHA — require `completed` / `success`
5. **CE-3F** — implement `slider`, `stepper`, `table` only — **only if** CE-3D and CE-3E gates are green and the SAFE-BATCH RULE still holds
6. **STOP**

Do not implement `/r/registry.json`, overlays, charts, banking, tabs, or any
slug not listed above.

---

## Overnight stop boundary (after CE-3F)

The next overnight agent must **NOT** cross into:

- `tabs` / `toggle-group` / `button-group` / `accordion` / `timeline` (new or heavier helpers)
- overlay/focus components (dialog, popover, menu, drawer, tooltip, select, …)
- chart (`recharts`) or banking distribution
- `/r/registry.json` / Registry Directory
- Reference App / PH-0 / Guard
- any slug not named in CE-3D/E/F

Canonical next attended tasks after CE-3F (pick one later):

- Stable `tabs` (+ `tab-keyboard` mapping), or
- T3/T4 overlay distribution research, or
- `/r/registry.json` derivation design

---

## Target coverage after CE-3D → CE-3F (planned)

| Metric | After CE-3C | After CE-3D | After CE-3E | After CE-3F |
|--------|------------:|------------:|------------:|------------:|
| Component manifests | 13 | **15** | **18** | **21** |
| + foundation files | 14 | 16 | 19 | 22 |

---

## Status

| Phase | Status |
|-------|--------|
| CE-3A Distribution Audit | ✅ COMPLETE (`702787d`) |
| CE-3B Tier-1 Stable batch | ✅ COMPLETE (`5952a0e`) |
| CE-3C Tier-2 Stable batch | ✅ COMPLETE (`a867076`) |
| CE-3D Stable chain + link-utils | ✅ COMPLETE (`aef7694`) |
| CE-3E Stable phosphor + Skrewww graph | ✅ COMPLETE (`f200b15`) |
| CE-3F Selected proven Beta | ✅ SHIPPED — `slider`, `stepper`, `table` |
| CE-3G Higher-Complexity Planning | ✅ COMPLETE (docs-only, see section below) |
| CE-3 overall | **IN PROGRESS** — CE-3H = NEXT, NOT STARTED |

---

# CE-3G — Higher-complexity distribution planning

> Verified 2026-09-15 · Baseline `08bf6a6` · React **55** · `/r` = foundation + **21**
> Evidence gathered via direct source/import inspection (`grep`/`tsx` against
> `lib/component-registry.ts`, `components/ui/**`, `components/ui/internal/**`,
> `lib/*.ts`) — not from component names or assumptions. This section is
> **planning only**; no `/r` manifest, `FILE_DESTINATIONS` entry, or runtime
> component changed in CE-3G.

## PART 1 — Exact remaining inventory

`getImplementedComponentCount()` = 55. Distributed (21, verified against
`public/r/*.json`, excluding `foundation.json`):

`avatar`, `breadcrumb`, `button`, `card`, `checkbox`, `divider`, `form-field`,
`link`, `pagination`, `progress-bar`, `radio`, `radio-group`, `skeleton`,
`slider`, `spinner`, `stepper`, `switch`, `table`, `text-input`, `textarea`,
`validation-message`

Remaining undistributed (34, verified: 21 + 34 = 55, no missing/duplicate slug):

`accordion`, `alert`, `badge`, `banking-account-card`, `banking-balance-summary`,
`banking-transaction-row`, `bar-chart`, `button-group`, `calendar-day`,
`calendar-grid`, `combobox`, `credit-card-field`, `data-table`, `date-picker`,
`dialog`, `drawer`, `empty-state`, `file-upload`, `line-chart`, `list-item`,
`menu`, `number-input`, `phone-number-field`, `popover`, `search-field`,
`select`, `split-button`, `tabs`, `tag`, `timeline`, `toast`, `toggle-group`,
`tooltip`, `tree-view`

None of the 34 have any distribution metadata populated on their canonical
`ComponentRegistryEntry` (`files`/`internalDependencies`/`dependencies`/
`registryDependencies`/`hostRequirements` are all `undefined`) — confirmed by
direct inspection, contrasting with `stepper`'s already-populated entry. This
metadata is added **as part of** the distribution work itself, per CE-3A/D/E/F
precedent; it does not pre-exist for undistributed slugs.

### Per-component record (source-verified)

| Slug | Category | Maturity | Figma | Owned files | Internal helpers (new, unmapped) | New npm dep |
|------|----------|----------|-------|--------------|-----------------------------------|-------------|
| `alert` | Feedback | Stable 1.0.0 | available | Alert.tsx (no own CSS) | `internal/FeedbackSurface.tsx` + `feedback-surface.module.css` + `internal/feedback-icons.tsx` + `internal/feedback-types.ts` (shared w/ badge, toast) | none |
| `badge` | Feedback | Beta 0.3.0-beta | available | Badge.tsx, badge.module.css | `internal/feedback-types.ts` (type-only; shared) | `@phosphor-icons/react` (proven) |
| `toast` | Feedback | Stable 1.0.0 | available | ToastProvider.tsx, toast.module.css | `internal/FeedbackSurface.tsx` (shared w/ alert) + own `ToastContext`/`useToast()` (inline) | `@phosphor-icons/react` (proven) |
| `tag` | Content & Data | Beta 0.5.0-beta | available | Tag.tsx, tag.module.css | none new | `@phosphor-icons/react` (proven) |
| `list-item` | Content & Data | Beta 0.5.0-beta | available | ListItem.tsx, list-item.module.css | `internal/link-utils.ts` (**already mapped**) | none |
| `timeline` | Content & Data | Beta 0.1.0-beta | available | Timeline.tsx, timeline.module.css | `internal/TimelineItemRow.tsx` (47 ln) + `timeline-item-row.module.css` | none |
| `empty-state` | Content & Data | Beta 0.5.0-beta | available | EmptyState.tsx, empty-state.module.css | none new (composes `Link`, already mapped) | none |
| `accordion` | Containers & Overlays | Beta 0.5.0-beta | available | Accordion.tsx, accordion.module.css | `lib/use-controllable.ts` (**already mapped**); `AccordionContext`/`AccordionItemContext` inline (no separate file) | `@phosphor-icons/react` (proven) |
| `tabs` | Navigation | Stable 1.0.0 | available | Tabs.tsx, tabs.module.css | `internal/tab-keyboard.ts` + `lib/use-controllable.ts` (mapped); `TabsContext` inline | none |
| `toggle-group` | Actions | Beta 0.1.0-beta | unavailable | ToggleGroup.tsx, toggle-group.module.css | `internal/toggle-group-keyboard.ts` + `use-controllable.ts` (mapped); `ToggleGroupContext` inline | none |
| `button-group` | Actions | Beta 0.1.0-beta | available | ButtonGroup.tsx, `button-group.module.css` | `button-group-context.ts` (**shared file with `split-button`**) | none |
| `split-button` | Actions | Beta 0.1.0-beta | available | SplitButton.tsx | **reuses `button-group.module.css` + `button-group-context.ts` verbatim** (no own CSS); documents `Menu` as a composed peer but does **not** import it | none |
| `menu` | Navigation | Beta 0.4.0-beta | available | Menu.tsx, menu.module.css | `internal/menu-typeahead.ts` + built directly on `Popover`/`PopoverBody`/`PopoverContent`/`PopoverTrigger` + `internal/popover-position.ts` types | none |
| `popover` | Containers & Overlays | Stable 1.0.0 | available | Popover.tsx, popover.module.css | `internal/Portal.tsx`, `internal/OverlayScopeContext.tsx`, `internal/useOverlayEscape.ts`, `internal/useOutsidePointer.ts`, `internal/popover-position.ts`, `internal/focus-utils.ts`, `internal/useFloatingPosition.ts`, `internal/assign-ref.ts` (8 new files, 547 ln total across the overlay-shared set) | none |
| `dialog` | Containers & Overlays | Stable 1.0.0 | available | Dialog.tsx, dialog.module.css | `Portal`, `OverlayScopeContext`, `useBackgroundInert.ts`, `useBodyScrollLock.ts`, `useOverlayEscape.ts`, `useFocusTrap.ts`, `focus-utils.ts`, `assign-ref.ts` (shares 6 of 8 overlay files with popover) | none |
| `drawer` | Containers & Overlays | Beta 0.5.0-beta | available | Drawer.tsx, drawer.module.css | identical overlay-file set to `dialog` | none |
| `tooltip` | Feedback | Stable 1.0.0 | available | Tooltip.tsx, tooltip.module.css | `internal/tooltip-position.ts`, `internal/assign-ref.ts` (shared), `internal/useIsClient.ts`, `internal/useTooltipController.ts`, `internal/useOverlayEscape.ts` (shared); uses `react-dom`'s `createPortal` directly (not the shared `Portal.tsx`) | none |
| `combobox` | Forms | Beta 0.2.0-beta | available | Combobox.tsx, combobox.module.css | built on `Popover`; `internal/combobox-list-status.ts`, `internal/combobox-scroll.ts`, `internal/combobox-filter.ts`, `internal/combobox-keyboard.ts`; reuses `FormField` + `TextInputControl` (mapped) + `text-input.module.css` | `@phosphor-icons/react` (proven) |
| `select` | Forms | Stable 1.0.0 | available | Select.tsx, select.module.css | built on `Popover`; reuses `FormField` + `text-input.module.css` | `@phosphor-icons/react` (proven) |
| `search-field` | Forms | Stable 1.0.0 | available | SearchField.tsx, search-field.module.css | `FormField` + `TextInputControl` (both mapped); `use-controllable.ts` (mapped) — **no overlay** | `@phosphor-icons/react` (proven) |
| `number-input` | Forms | Beta 0.1.0-beta | unavailable | NumberInput.tsx, number-input.module.css | `FormField` + `TextInputControl` (mapped) + `lib/number-input-value.ts` (91 ln, new) — **no overlay** | `@phosphor-icons/react` (proven) |
| `credit-card-field` | Forms | Beta 0.1.0-beta | available | CreditCardField.tsx, credit-card-field.module.css | `ValidationMessage` (mapped) + `lib/credit-card-field-format.ts` (52 ln, new) — **no overlay** | `@phosphor-icons/react` (proven) |
| `phone-number-field` | Forms | Beta 0.1.0-beta | available | PhoneNumberField.tsx, phone-number-field.module.css | `ValidationMessage` (mapped) + `TextInputControl` (mapped) + `SelectControl` (exported from `Select.tsx` → pulls the full `select`/`Popover` graph transitively) + `lib/phone-number-field-countries.ts` (36 ln, new) | none |
| `file-upload` | Forms | Beta 0.1.0-beta | available | FileUpload.tsx, file-upload.module.css | `FormField` (mapped); `internal/file-upload-file-list.ts` (95 ln) + `internal/file-upload-validation.ts` (104 ln, new) — **no overlay**, but real drag/drop + File API browser behavior | `@phosphor-icons/react` (proven) |
| `calendar-day` | Content & Data | Stable 1.0.0 | available | CalendarDay.tsx, calendar-day.module.css | `internal/calendar-date.ts` (**330 ln** — hand-rolled date math, no third-party date lib) | none |
| `calendar-grid` | Content & Data | Beta 0.5.0-beta | partial | CalendarGrid.tsx, calendar-grid.module.css | composes `CalendarDay` + `CalendarMonthCell` + `CalendarYearCell` (own files, share `calendar-period-cell.module.css`); `internal/assign-ref.ts` (shared), `internal/useCalendarKeyboard.ts` (141 ln), `internal/useCalendarCellGridKeyboard.ts` (102 ln), `use-controllable.ts` (mapped) — **largest non-chart source graph of the 34** | `@phosphor-icons/react` (proven) |
| `date-picker` | Forms | Beta 0.5.0-beta | available | DatePicker.tsx, date-picker.module.css | composes `CalendarGrid` (full calendar graph) **+** `Popover` (full overlay graph) **+** `FormField` + `TextInputControl` (mapped) — heaviest transitive graph of the 34 | `@phosphor-icons/react` (proven) |
| `tree-view` | Content & Data | Beta 0.1.0-beta | available | TreeView.tsx, tree-view.module.css | `internal/TreeItem.tsx` (92 ln) + `tree-item.module.css` + `internal/tree-flatten.ts` (115 ln); `use-controllable.ts` (mapped) | none |
| `data-table` | Content & Data | Beta 0.1.0-beta | partial | **no dedicated component file** — a documented composition pattern over `Table` (already distributed) | `DataTableSortHeader.tsx` (60 ln) + `data-table-sort-header.module.css` + `lib/use-data-table-sort.ts` (70 ln hook); consumer writes own `Table`/`TableHead`/`TableBody` markup | none |
| `bar-chart` | Content & Data | Beta 0.1.0-beta | available | BarChart.tsx, bar-chart.module.css | none Skrewww-internal | **`recharts`** (first non-phosphor npm dep) |
| `line-chart` | Content & Data | Beta 0.1.0-beta | available | LineChart.tsx, line-chart.module.css | none Skrewww-internal | **`recharts`** |
| `banking-account-card` | Content & Data | Beta 0.1.0-beta | **unavailable** | BankingAccountCard.tsx, banking-account-card.module.css | composes `Card` + `Tag` + `LineChart` (→ pulls `recharts`) | `recharts` (transitive) |
| `banking-balance-summary` | Content & Data | Beta 0.1.0-beta | **unavailable** | BankingBalanceSummary.tsx, banking-balance-summary.module.css | composes `Card` + `BarChart` (→ `recharts`) + `Tabs` + `Skeleton` | `recharts` (transitive) |
| `banking-transaction-row` | Content & Data | Beta 0.1.0-beta | **unavailable** | BankingTransactionRow.tsx, banking-transaction-row.module.css | composes `Avatar` + `Badge` + `ListItem` + `Popover` (→ pulls the full overlay graph) | none direct |

Confirmed via repo-wide import scan: the **only** genuinely new third-party
runtime npm dependency anywhere in the 34 remaining components is `recharts`
(bar-chart, line-chart, and transitively both non-transaction banking
components). No date library, no positioning library (`useFloatingPosition`
is hand-rolled, not `@floating-ui/*`), no combobox/menu library. Everything
else is `@phosphor-icons/react` (already proven by CE-3E/F) or Skrewww-internal.

## PART 2 — Reclassified complexity (H1–H7)

Adjusted from the task's suggested buckets using source evidence — `menu` and
`split-button` were moved out of the "safe compound" set once evidence showed
`menu` is Popover-built (overlay) and `split-button` has a real (if
undistributed) peer dependency on `menu`; `search-field`/`credit-card-field`/
`number-input`/`file-upload` were kept out of H4 despite being Forms, because
none of them touch `Popover` — only `combobox`/`select`/`date-picker`/
`phone-number-field` do.

| Class | Meaning | Slugs (count) |
|-------|---------|----------------|
| **H1** | Single-file or trivial-shared-type; schema unchanged | `badge`, `tag`, `list-item`, `timeline`, `empty-state` (5) |
| **H2** | Compound/composite + shared helper or inline context; new mappings only, no architecture change | `alert`, `toast`, `accordion`, `tabs`, `toggle-group`, `button-group`, `split-button`, `search-field`, `credit-card-field`, `number-input`, `file-upload` (11) |
| **H3** | Overlay / portal / focus-management | `popover`, `dialog`, `drawer`, `tooltip`, `menu` (5) |
| **H4** | Search / complex interaction / date-like semantics | `combobox`, `select`, `calendar-day`, `calendar-grid`, `date-picker`, `phone-number-field` (6) |
| **H5** | Data / file / tree | `tree-view`, `data-table` (2) |
| **H6** | Third-party-heavy (charts) | `bar-chart`, `line-chart` (2) |
| **H7** | Specialized / domain (banking pilot) | `banking-account-card`, `banking-balance-summary`, `banking-transaction-row` (3) |

Total: 5+11+5+6+2+2+3 = **34** ✅

## PART 3 — Compound component audit

| Slug | One item or multiple? | Public subcomponents, same source? | Context/helper file? | `registryDependencies` | Runtime risk | Existing schema transports unchanged? |
|------|------------------------|--------------------------------------|-----------------------|--------------------------|---------------|------------------------------------------|
| `accordion` | One (Accordion/AccordionItem/Trigger/Panel, one file) | Yes | Inline context (no separate file); `use-controllable` (mapped) | `@skrewww/foundation` | Low — no overlay, keyboard is native disclosure | **Yes** |
| `button-group` | One | Yes (`ButtonGroup` only) | `button-group-context.ts` (**shared with split-button**) | `@skrewww/foundation`; practically needs `button` installed first | Low | **Yes** |
| `toggle-group` | One | Yes | Inline context; `internal/toggle-group-keyboard.ts` + `use-controllable` (mapped) | `@skrewww/foundation` | Low-medium — roving-tabindex keyboard logic | **Yes** |
| `menu` | One (`Menu`/`MenuTrigger`/`MenuList`/`MenuItem` family, one file) | Yes | `internal/menu-typeahead.ts`; **built directly on `Popover`** | `@skrewww/foundation`, `@skrewww/popover` (new) | **High** — inherits full overlay/focus/dismissal graph | No — needs `popover` distributed first |
| `tabs` | One | Yes | Inline context; `internal/tab-keyboard.ts` + `use-controllable` (mapped) | `@skrewww/foundation` | Low-medium — arrow-key tablist nav | **Yes** |
| `timeline` | One (`Timeline`, composes internal `TimelineItemRow`) | No (row is internal-only) | `internal/TimelineItemRow.tsx` (47 ln, new mapping) | `@skrewww/foundation` | Low | **Yes** |
| `list-item` | One | Yes | `internal/link-utils.ts` (**already mapped**, shared with `link`/`pagination`) | `@skrewww/foundation` | Low | **Yes** |
| `tag` | One | No | None new | `@skrewww/foundation` | Low | **Yes** |
| `badge` | One | No | `internal/feedback-types.ts` (type-only, shared) | `@skrewww/foundation` | Low | **Yes** |
| `split-button` | One | No (documents `Menu` as an external peer, does not import it) | **Reuses `button-group-context.ts` + `button-group.module.css` verbatim** (no own CSS file) | `@skrewww/foundation`, `@skrewww/button-group` (new); practically incomplete without `menu` | Medium — transport is simple, but the shipped component is a fragment of its documented usage until `menu`/`popover` exist in `/r` | **Yes**, transport-wise; sequencing-blocked, not schema-blocked |

**Safest compound subset** (existing schema handles unchanged, no overlay
dependency, no undistributed peer): `badge`, `tag`, `list-item`, `timeline`,
`button-group`, `toggle-group`, `accordion`, `tabs` — 8 of the 10 named in
Part 3. `menu` is excluded (Popover-built). `split-button` is transport-ready
but held back to ship alongside `menu` so the manifest's documented usage
isn't misleading on its own.

## PART 4 — Overlay audit

All five overlay components (`popover`, `dialog`, `drawer`, `tooltip`, `menu`)
are `"use client"` and share a real internal runtime stack — confirmed by
direct import inspection, not naming:

| Helper | Used by | Lines | Purpose |
|--------|---------|------:|---------|
| `internal/Portal.tsx` | popover, dialog, drawer | 21 | `createPortal` wrapper |
| `internal/OverlayScopeContext.tsx` | popover, dialog, drawer | 19 | Nested-overlay scope tracking |
| `internal/useOverlayEscape.ts` | popover, dialog, drawer, tooltip | 38 | Escape-key dismissal |
| `internal/useOutsidePointer.ts` | popover | 38 | Click-outside dismissal |
| `internal/useFloatingPosition.ts` | popover | 80 | Hand-rolled positioning (no `@floating-ui/*`) |
| `internal/popover-position.ts` | popover, menu (types) | 134 | Placement/align math |
| `internal/focus-utils.ts` | popover, dialog, drawer | 58 | Initial-focus resolution + focus restoration |
| `internal/assign-ref.ts` | popover, dialog, drawer, calendar-grid, tooltip | 21 | `mergeRefs`/`assignRef` |
| `internal/useFocusTrap.ts` | dialog, drawer | 69 | Modal focus trap |
| `internal/useBodyScrollLock.ts` | dialog, drawer | 14 | `document.body` scroll lock |
| `internal/useBackgroundInert.ts` | dialog, drawer | 55 | `inert`/`aria-hidden` on background content |
| `internal/tooltip-position.ts` | tooltip | — | Tooltip-specific placement |
| `internal/useIsClient.ts`, `internal/useTooltipController.ts` | tooltip | — | Hover/focus-delay controller; uses `react-dom`'s `createPortal` directly, not `Portal.tsx` |

**Browser requirements:** real DOM (`document.activeElement`, `inert`
attribute, pointer events, `getBoundingClientRect`) — none of this can be
verified by `shadcn view` or a JSON-generation check alone.

**Per-component transport + test requirement:**

| Slug | Files transported | `shadcn view` sufficient? | Installed browser smoke required? |
|------|--------------------|-----------------------------|--------------------------------------|
| `popover` | Popover.tsx + css + 8 overlay helpers | No | **Yes** — focus trap N/A but escape/outside-click/positioning/focus-restore must run in a real browser |
| `dialog` | Dialog.tsx + css + 8 overlay helpers (6 shared w/ popover) | No | **Yes** — focus trap, body scroll lock, background inert are unverifiable statically |
| `drawer` | Drawer.tsx + css + identical helper set to dialog | No | **Yes** |
| `tooltip` | Tooltip.tsx + css + 5 helpers | No | **Yes** — hover/focus delay timing, portal positioning |
| `menu` | Menu.tsx + css + menu-typeahead + **registryDependency on `popover`** | No | **Yes**, plus typeahead keyboard behavior |

**Do not distribute overlays in CE-3G** — confirmed, no manifest work done here.

## PART 5 — Search / selection audit

| Slug | Shared helpers | Keyboard logic | Popover/overlay dep? | Internal context? | Multi-file transport | Runtime test need |
|------|-----------------|------------------|-------------------------|----------------------|--------------------------|----------------------|
| `combobox` | `FormField`, `TextInputControl` (mapped), `text-input.module.css` | `internal/combobox-keyboard.ts` | **Yes — `Popover`** | No (controlled via props/state, not context) | High — 4 new internal helpers + Popover graph | **Yes** — listbox semantics, filtering, scroll-into-view are behavioral |
| `select` | `FormField`, `text-input.module.css` | inherited from Popover's own dismissal, plus native `<option>`-like nav | **Yes — `Popover`** | No | Medium | **Yes** |
| `search-field` (re-scoped out of this audit's "search" framing) | `FormField`, `TextInputControl` (mapped) | none beyond native input | **No** | No | Low | T2 sufficient (no overlay) |

`search-field` does not belong architecturally with `combobox`/`select` —
confirmed by absence of any `Popover` import. It is reclassified into H2 (see
Part 2) and handled in the Form/composite batch (CE-3I), not the
search/interaction batch (CE-3K). This is a genuine distribution-readiness
finding, not a re-opening of product architecture.

## PART 6 — Date / calendar audit

| Slug | Internal deps | Third-party date lib? | Popover/Button dep? | Helper files | Locale assumption | Install risk |
|------|-----------------|---------------------------|-------------------------|------------------|------------------------|-------------------|
| `calendar-day` | `internal/calendar-date.ts` (330 ln, hand-rolled) | **No** | No | 1 new (large) | Not inspected further (out of scope — behavior unchanged) | Low — self-contained |
| `calendar-grid` | Composes `CalendarDay` + `CalendarMonthCell` + `CalendarYearCell` (share `calendar-period-cell.module.css`) + `useCalendarKeyboard` (141 ln) + `useCalendarCellGridKeyboard` (102 ln) + `assign-ref` (shared) | No | No (Grid itself has no Popover) | 5 new files | — | Medium — largest non-chart file count of the 34 |
| `date-picker` | `CalendarGrid` (full graph above) **+** `Popover` (full overlay graph, Part 4) **+** `FormField` + `TextInputControl` (mapped) | No | **Yes — `Popover`** | Transitively ~13 new files across both graphs | — | **High** — union of H3 + H4 graphs; heaviest of the 34 |

No date library dependency exists anywhere (`date-fns`, `dayjs`, etc. are
absent) — the entire calendar family is hand-rolled against `Date`. This is
real, useful evidence: consumers installing the calendar family take on zero
extra npm dependencies, but inherit ~700+ lines of internal date/keyboard
logic that must transport correctly. No behavior was modified to produce this
finding.

## PART 7 — Forms / composites audit

| Slug | `registryDependencies` | Shared CSS | Icons | Helpers | App-specific assumptions | Generic-distribution safe? |
|------|---------------------------|---------------|-------|---------|------------------------------|--------------------------------|
| `number-input` | `@skrewww/form-field` (mapped) | none shared | `CaretDown`/`CaretUp` (proven) | `lib/number-input-value.ts` (91 ln, new) | None found | **Yes** |
| `credit-card-field` | `@skrewww/validation-message` (mapped) | none shared | `CreditCard` (proven) | `lib/credit-card-field-format.ts` (52 ln, new) | Card-brand detection is generic (Visa/Mastercard/Amex prefix rules), not tenant-specific | **Yes** |
| `phone-number-field` | `@skrewww/validation-message`, `@skrewww/select` (new — pulls full Popover graph transitively) | reuses `text-input.module.css` via `TextInputControl` | none new | `lib/phone-number-field-countries.ts` (36 ln — country/dial-code table) | Country list is a fixed static table, not app-configurable — fine for generic distribution but consumers cannot currently override it via props | **Yes**, but sequenced after `select`/`popover` |
| `file-upload` | `@skrewww/form-field` (mapped) | none shared | `UploadSimple`, `X` (proven) | `internal/file-upload-file-list.ts` (95 ln) + `internal/file-upload-validation.ts` (104 ln, new) | Drag/drop + `File`/`DataTransfer` browser APIs — real runtime behavior, not app-specific config | **Yes**, but needs T3 browser smoke (not T1/T2) |
| `search-field` | `@skrewww/form-field` (mapped) | reuses `TextInputControl` | `MagnifyingGlass`, `XCircle` (proven) | none new | None | **Yes** |

No form composite in this set has a hidden application-specific assumption
(no hardcoded API endpoint, no tenant config, no environment coupling) —
confirmed by reading each file's non-React/non-`@/` imports (Part 1 table).

## PART 8 — Data / tree audit

| Slug | Source graph | Helper/context files | Third-party packages | Runtime behavior | Browser validation need | Truly generic for `/r`? |
|------|----------------|--------------------------|---------------------------|----------------------|-----------------------------|------------------------------|
| `tree-view` | `TreeView.tsx` + `internal/TreeItem.tsx` (92 ln) + `internal/tree-flatten.ts` (115 ln) + own + `tree-item.module.css` | 3 new files | none | Real keyboard tree navigation (expand/collapse, arrow-key roving focus) via `use-controllable` | **Yes** — keyboard/a11y behavior is exactly what static generation can't verify | **Yes** |
| `data-table` | **No dedicated component.** `DataTableSortHeader.tsx` (60 ln) + `data-table-sort-header.module.css` + `lib/use-data-table-sort.ts` (70 ln hook), layered onto the **already-distributed** `Table` | 2 new files + 1 hook | none | Click-to-sort only; consumer owns all markup (`Table`/`TableHead`/`TableBody`) per `content/content-data.ts`'s own documented scope (no columns-config prop, no virtualization/selection/sticky-header) | Medium — sort-toggle interaction is simple, but must verify the manifest correctly documents "compose with the `table` you already installed" rather than duplicating Table's files | **Yes**, once its composition-only nature is reflected in the manifest description (not a hidden gap — already documented in `content/content-data.ts`) |

Neither is a large source graph by line count. `data-table`'s complexity is
architectural (it's a pattern, not a component with a single entry point),
not code-volume — the manifest for it must be written carefully so installers
understand they're getting a sort-header building block plus a hook, not a
`<DataTable>` component.

## PART 9 — Chart audit

| Slug | Library | Version constraint | Transport files | Config helpers | CSS/tokens | Consumer bundle implication |
|------|---------|------------------------|----------------------|--------------------|----------------|----------------------------------|
| `bar-chart` | `recharts` | Whatever version is pinned in this repo's `package.json` (not inspected/changed in CE-3G — Part 9 forbids `package.json` changes) | BarChart.tsx, bar-chart.module.css | none Skrewww-internal | Uses Foundation tokens for colors/typography | First real `dependencies: ["recharts"]` entry — the installer CLI must actually run `npm install recharts` for the consumer, unlike every prior CE-3 component which only needed already-common `@phosphor-icons/react` |
| `line-chart` | `recharts` | same | LineChart.tsx, line-chart.module.css | none | same | same |

**Should charts be separately distributable?** Yes — `bar-chart` and
`line-chart` have no dependency on each other or on banking; either can ship
alone. **Should they remain deferred from generic CE-3?** No — they are
Figma-`available`, Beta-but-stable-shaped, and technically self-contained.
The real reason to sequence them **last** among the generic set is that they
are the first proof point for a non-`@phosphor-icons` `dependencies` entry —
worth an isolated T3 smoke pass (does `shadcn add` actually trigger
`npm install recharts` in a fresh consumer app) before bundling more
`dependencies`-bearing components. No `package.json` change made here.

## PART 10 — Banking / specialized audit

| Slug | Figma | Composes | Classification |
|------|-------|------------|--------------------|
| `banking-account-card` | **unavailable** | `Card`, `Tag`, `LineChart` (→ `recharts`) | **B** — technically distributable (no blocking transport issue), intentionally deferred |
| `banking-balance-summary` | **unavailable** | `Card`, `BarChart` (→ `recharts`), `Tabs`, `Skeleton` | **B** |
| `banking-transaction-row` | **unavailable** | `Avatar`, `Badge`, `ListItem`, `Popover` (→ full overlay graph) | **B** |

All three are Beta `0.1.0-beta`, explicitly documented in the registry as a
"Layer 4 Banking pilot" family, and **all three have `figmaAvailability:
"unavailable"`** — no verified visual parity exists for any of them, unlike
every other component distributed so far. Shipping public installable
artifacts for components with zero Figma-verified parity would be premature
distribution, not a transport problem — this mirrors the CE-2 precedent of
never treating docs-only content as verified. None are classified **A**
(normal generic distribution now) or **C** (future industry-specific
namespace) — a namespace decision is explicitly out of scope for CE-3G and
not warranted yet since these are still an internal pilot, not a confirmed
industry vertical. **No namespace created, no package created.**

## PART 11 — Third-party dependency matrix

| Group | Package | New in CE-3G scope? | Proven by CE-3D/E/F? | Consumers |
|-------|---------|--------------------------|----------------------------|---------------|
| Icons | `@phosphor-icons/react` | No | **Yes** (badge, stepper, avatar, tag, validation-message, etc.) | badge, toast, accordion, tabs(none), select, combobox, search-field, number-input, credit-card-field, file-upload, calendar-grid, date-picker |
| Overlay/positioning | *(none — hand-rolled `useFloatingPosition`)* | — | — | popover, dialog, drawer, tooltip, menu (all internal, no package) |
| Date | *(none — hand-rolled `calendar-date.ts`)* | — | — | calendar-day, calendar-grid, date-picker |
| Charts | `recharts` | **Yes — first occurrence** | No | bar-chart, line-chart, banking-account-card, banking-balance-summary |
| Other | *(none found)* | — | — | — |

React/`react-dom`/Next host packages are never listed as installer
`dependencies` (existing `buildComponentManifest` behavior — `hostRequirements`
only, surfaced via the manifest's `docs` field) — unchanged in CE-3G.

## PART 12 — FILE_DESTINATIONS matrix (future mappings, none implemented)

| Source | Target | Components | Status |
|--------|--------|-------------|--------|
| `components/ui/internal/link-utils.ts` | `~/components/ui/internal/link-utils.ts` | list-item, pagination(done), link(done) | **ALREADY MAPPED** |
| `lib/use-controllable.ts` | `~/lib/use-controllable.ts` | accordion, tabs, toggle-group, calendar-grid, tree-view | **ALREADY MAPPED** |
| `components/ui/FormField.tsx` + css | `~/components/ui/FormField.tsx` (+css) | number-input, search-field, file-upload, combobox, select, date-picker | **ALREADY MAPPED** |
| `components/ui/TextInputControl.tsx` | `~/components/ui/TextInputControl.tsx` | number-input, search-field, combobox, phone-number-field, date-picker | **ALREADY MAPPED** |
| `components/ui/ValidationMessage.tsx` + css | same | credit-card-field, phone-number-field | **ALREADY MAPPED** |
| `components/ui/internal/feedback-types.ts` | `~/components/ui/internal/feedback-types.ts` | badge, alert, toast | NEW MAPPING |
| `components/ui/internal/FeedbackSurface.tsx` + `feedback-surface.module.css` + `internal/feedback-icons.tsx` | same | alert, toast | NEW MAPPING |
| `components/ui/internal/TimelineItemRow.tsx` + `timeline-item-row.module.css` | same | timeline | NEW MAPPING |
| `components/ui/button-group-context.ts` | `~/components/ui/button-group-context.ts` | button-group, split-button | NEW MAPPING (shared) |
| `components/ui/internal/tab-keyboard.ts` | same | tabs | NEW MAPPING |
| `components/ui/internal/toggle-group-keyboard.ts` | same | toggle-group | NEW MAPPING |
| `components/ui/internal/menu-typeahead.ts` | same | menu | NEW MAPPING |
| `components/ui/internal/{Portal,OverlayScopeContext,useOverlayEscape,useOutsidePointer,useFloatingPosition,popover-position,focus-utils,assign-ref}.ts(x)` | same (8 files) | popover, dialog, drawer, menu (subset), calendar-grid (assign-ref only) | NEW MAPPING |
| `components/ui/internal/{useFocusTrap,useBodyScrollLock,useBackgroundInert}.ts` | same (3 files) | dialog, drawer | NEW MAPPING |
| `components/ui/internal/{tooltip-position,useIsClient,useTooltipController}.ts` | same (3 files) | tooltip | NEW MAPPING |
| `components/ui/internal/{combobox-list-status,combobox-scroll,combobox-filter,combobox-keyboard}.ts` | same (4 files) | combobox | NEW MAPPING |
| `lib/number-input-value.ts` | `~/lib/number-input-value.ts` | number-input | NEW MAPPING |
| `lib/credit-card-field-format.ts` | same | credit-card-field | NEW MAPPING |
| `lib/phone-number-field-countries.ts` | same | phone-number-field | NEW MAPPING |
| `components/ui/internal/{file-upload-file-list,file-upload-validation}.ts` | same (2 files) | file-upload | NEW MAPPING |
| `components/ui/internal/calendar-date.ts` | same | calendar-day, calendar-grid, date-picker | NEW MAPPING |
| `components/ui/internal/{useCalendarKeyboard,useCalendarCellGridKeyboard}.ts` | same (2 files) | calendar-grid, date-picker | NEW MAPPING |
| `components/ui/{CalendarMonthCell,CalendarYearCell}.tsx` + `calendar-period-cell.module.css` | same | calendar-grid, date-picker | NEW MAPPING |
| `components/ui/DataTableSortHeader.tsx` + `data-table-sort-header.module.css` | same | data-table | NEW MAPPING |
| `lib/use-data-table-sort.ts` | same | data-table | NEW MAPPING |
| `components/ui/internal/TreeItem.tsx` + `tree-item.module.css`, `internal/tree-flatten.ts` | same (3 files) | tree-view | NEW MAPPING |

Nothing is UNCERTAIN — every helper's owning component(s) were confirmed by
direct `import` inspection, not inferred. No mapping is implemented in CE-3G.

## PART 13 — Consumer test tiers

| Tier | Definition |
|------|-------------|
| **T1** | Manifest generation (`buildXManifest`) + `shadcn view` succeeds |
| **T2** | Fresh `shadcn add` into a scratch consumer app + `next build` compiles |
| **T3** | T2 + installed component rendered and driven in a real browser (Playwright) — visual + basic interaction |
| **T4** | T3 + full interaction/a11y smoke — keyboard nav, focus management, Escape/outside-dismiss, ARIA state |

| Class | Required tier | Why |
|-------|-------------------|-----|
| H1 | T2 | Static/presentational, no interactive state machine |
| H2 | T3 | Real keyboard nav (accordion/tabs/toggle-group), drag/drop (file-upload), or shared-context wiring that only proves out once installed |
| H3 (overlay) | **T4** | Focus trap, scroll lock, background inert, Escape, outside-click, focus restoration are exactly the class of bug that only appears at runtime — explicit task instruction: "must not be accepted based only on JSON generation" |
| H4 (search/date) | **T4** | Listbox/combobox semantics, calendar arrow-key grid navigation, popover-anchored field dismissal |
| H5 (data/tree) | T3 for `data-table` (simple sort click), **T4** for `tree-view` (keyboard tree nav + a11y) |
| H6 (charts) | T3 | Interaction risk is low; the real risk is the `recharts` install/bundle step itself, which T2 already covers, plus a T3 render-smoke to confirm no SSR/hydration break |
| H7 (banking) | **T4** | Inherits the tier of whatever it composes (charts + overlay); also blocked pending Part 10's Figma-parity gate regardless of test tier |

## PART 14 — Next implementation batches (exact slugs)

Adjusted from the task's suggested CE-3H–M names using the evidence above —
`menu` and `split-button` moved from "safe compound" into the overlay batch;
`split-button` ships with `menu` since it documents `Menu` as a peer.

### CE-3H — Safe compound batch

- **Slugs:** `badge`, `tag`, `list-item`, `timeline`, `empty-state`, `alert`, `toast`, `button-group`, `toggle-group`, `accordion`, `tabs` (11)
- **Complexity class:** H1 (5) + H2-compound-only (6)
- **New mappings:** `feedback-types.ts`, `FeedbackSurface.tsx`+css+icons, `TimelineItemRow.tsx`+css, `button-group-context.ts`, `tab-keyboard.ts`, `toggle-group-keyboard.ts`
- **`registryDependencies`:** `@skrewww/foundation` only (no cross-component deps beyond already-mapped `link-utils`/`use-controllable`)
- **npm `dependencies`:** `@phosphor-icons/react` only (proven)
- **Consumer test tier:** T2 (H1 slugs), T3 (context/keyboard slugs)
- **Expected manifest delta:** 21 → 32
- **Stop conditions:** any slug requiring an import not already catalogued in Part 1/12 must halt that slug, not the batch
- **Exit gate:** green CI on the batch SHA before CE-3I

### CE-3I — Form/composite batch

- **Slugs:** `search-field`, `credit-card-field`, `number-input`, `file-upload` (4)
- **Complexity class:** H2 (forms subset)
- **New mappings:** `number-input-value.ts`, `credit-card-field-format.ts`, `file-upload-file-list.ts`, `file-upload-validation.ts`
- **`registryDependencies`:** `@skrewww/form-field`, `@skrewww/validation-message` (both already `/r`-distributed)
- **npm `dependencies`:** `@phosphor-icons/react`
- **Consumer test tier:** T3 (T2 minimum for search-field/credit-card-field/number-input; file-upload needs real drag/drop + File API smoke)
- **Expected manifest delta:** 32 → 36
- **Stop conditions:** do not include `phone-number-field` here — it pulls `Select`→`Popover` transitively, belongs in CE-3K
- **Exit gate:** green CI before CE-3J

### CE-3J — Overlay/navigation batch

- **Slugs:** `popover`, `tooltip`, `dialog`, `drawer`, `menu`, `split-button` (6)
- **Complexity class:** H3 + the one H2 slug (`split-button`) that is peer-blocked on `menu`
- **New mappings:** full overlay helper set (Part 4/12 — 14 files across Portal/OverlayScope/focus-trap/scroll-lock/inert/escape/outside-pointer/positioning/tooltip-controller)
- **`registryDependencies`:** `popover` becomes a new first-class `@skrewww/popover` dependency for `menu`; `menu` becomes one for `split-button`
- **npm `dependencies`:** none new
- **Consumer test tier:** **T4** for all — this is the batch the task explicitly says must not be JSON-only
- **Expected manifest delta:** 36 → 42
- **Stop conditions:** if T4 browser smoke surfaces a real focus-trap/scroll-lock defect, fix is out of CE-3 scope (no runtime component changes) — halt and report, do not patch silently
- **Exit gate:** green CI **and** a passing T4 Playwright smoke pass, not just `shadcn view`

### CE-3K — Search/date interaction batch

- **Slugs:** `combobox`, `select`, `calendar-day`, `calendar-grid`, `date-picker`, `phone-number-field` (6)
- **Complexity class:** H4
- **New mappings:** combobox's 4 helpers, calendar's 5 files (CalendarMonthCell/YearCell + shared CSS + 2 keyboard hooks) + `calendar-date.ts`, `phone-number-field-countries.ts`
- **`registryDependencies`:** `date-picker` and `phone-number-field` require `@skrewww/popover` (from CE-3J) — **hard sequencing dependency on CE-3J**
- **npm `dependencies`:** `@phosphor-icons/react`
- **Consumer test tier:** **T4** (listbox semantics, calendar grid arrow-key nav)
- **Expected manifest delta:** 42 → 48
- **Stop conditions:** do not start `date-picker`/`phone-number-field` before CE-3J's `popover`/`select` manifests are green
- **Exit gate:** green CI + T4 pass

### CE-3L — Data/tree batch

- **Slugs:** `tree-view`, `data-table` (2)
- **Complexity class:** H5
- **New mappings:** `TreeItem.tsx`+css, `tree-flatten.ts`, `DataTableSortHeader.tsx`+css, `use-data-table-sort.ts`
- **`registryDependencies`:** `data-table`'s manifest must document `@skrewww/table` (already `/r`-distributed) as a dependency rather than re-transporting Table's files
- **npm `dependencies`:** none
- **Consumer test tier:** T4 (`tree-view`), T3 (`data-table`)
- **Expected manifest delta:** 48 → 50
- **Stop conditions:** none beyond standard CI gate
- **Exit gate:** green CI

### CE-3M — Charts batch

- **Slugs:** `bar-chart`, `line-chart` (2)
- **Complexity class:** H6
- **New mappings:** none Skrewww-internal (BarChart.tsx/LineChart.tsx + own CSS only)
- **`registryDependencies`:** `@skrewww/foundation` only
- **npm `dependencies`:** `["recharts"]` — **first non-phosphor real dependency; requires its own isolated T3 install-smoke** confirming a fresh consumer app actually gets `recharts` installed and the chart renders/hydrates without SSR error
- **Consumer test tier:** T3
- **Expected manifest delta:** 50 → **52**
- **Stop conditions:** do not fold banking components into this batch (Part 10 — Figma parity gate, not a transport blocker, is unresolved)
- **Exit gate:** green CI + successful fresh-install `recharts` smoke

Banking (`banking-account-card`, `banking-balance-summary`,
`banking-transaction-row`) is **intentionally not given a batch number** —
Class B per Part 10, blocked on Figma verification, not scheduled.

## PART 15 — Overnight-safe boundary

| Batch | Boundary |
|-------|-----------|
| CE-3H | **UNATTENDED_SAFE** — no overlay, no new npm dep, existing schema, T2/T3 only |
| CE-3I | **UNATTENDED_SAFE** for `search-field`/`credit-card-field`/`number-input`; **ATTENDED_ONLY** for `file-upload` (drag/drop + File API is a new interaction surface, not yet proven by any prior CE-3 batch) |
| CE-3J | **ATTENDED_ONLY** — overlay/focus-trap correctness is exactly the strong-default case the task calls out; current architecture is real but has never been proven through the shadcn transport+consumer-install path |
| CE-3K | **ATTENDED_ONLY** — same reason, plus a hard sequencing dependency on CE-3J |
| CE-3L | **ATTENDED_ONLY** — `tree-view`'s keyboard/a11y surface is unproven through this transport path; `data-table`'s composition-only manifest needs a human sanity check the first time |
| CE-3M | **ATTENDED_ONLY** — first real npm installer dependency; must be watched the first time, not assumed safe from the pattern of prior batches |

Not optimized for overnight throughput, per instruction — the default stays
attended for anything past CE-3I.

## PART 16 — `/r/registry.json` sequencing decision

**Decision: D — an explicit evidence-based point, specifically "after CE-3M
(generic/core coverage complete), before CE-3O (final validation)."**

Rejected alternatives:
- **A (now):** would index 21 of an eventual 52 generic/core components —
  MCP `list`/`search` would present a coverage claim well ahead of reality.
- **B (after generic/core expansion):** this is what D resolves to in
  practice — restated as its own phase (CE-3N) rather than folded silently
  into CE-3M so the index has its own exit gate.
- **C (after all intended CE-3, including banking):** banking's inclusion
  date is unknown (Part 10 — pending Figma verification, no ETA) and
  shouldn't block the index for the other 52.

**Named future phase: CE-3N — Registry index derivation**, sequenced
immediately after CE-3M, before CE-3O. Generated from the canonical
distributed set (whatever `/r/*.json` exists at that point), never a
hand-maintained duplicate list; Beta items included with their maturity
surfaced in item metadata (not hidden); re-run whenever a new component is
added post-CE-3 without needing a redesign.

## PART 17 — Target coverage reassessment

**Decision: B — all generic/core components; banking (specialized) deferred.**

- **Exact target count: 52** (of 55 implemented)
- **Included:** the 21 already distributed + all 31 slugs across CE-3H–CE-3M (5+11-ish batches above: 11+4+6+6+2+2 = 31)
- **Exact exclusions (3):** `banking-account-card`, `banking-balance-summary`, `banking-transaction-row` — Class B (Part 10): technically distributable later, deferred now for lack of Figma-verified parity (all three are `figmaAvailability: "unavailable"`), not for vanity-count reasons
- **Rationale:** 52/55 is the real ceiling for "generic distribution" as defined by this repo's own CE-0 evidence standard (never ship a public artifact without either verified Figma parity or an explicit, reasoned exception) — chasing 55/55 would mean distributing three components with zero design-parity verification, which is the same category of premature-shipping mistake CE-2's audits were built to avoid.

## PART 18 — CE-3 completion shape

1. CE-3H — safe compound (11 slugs)
2. CE-3I — form/composite (4 slugs)
3. CE-3J — overlay/navigation (6 slugs)
4. CE-3K — search/date interaction (6 slugs, depends on CE-3J)
5. CE-3L — data/tree (2 slugs)
6. CE-3M — charts (2 slugs)
7. **CE-3N — `/r/registry.json` derivation** (Part 16)
8. **CE-3O — final consumer/MCP validation** (Part 19 exit requirements)
9. CE-3 = ✅ COMPLETE at 52/55, with banking's 3 slugs recorded as an
   explicit, evidence-based exclusion (not a gap) pending its own future
   Figma-verification-gated decision

## PART 19 — `/r` registry index (CE-3N) exit requirements

- Generated by a pure function reading `public/r/*.json` (or the canonical
  registry's distributed-set marker) at build time — **no hand-maintained
  duplicate slug list**, matching every other CE-3 generator's own
  no-silent-default convention
- Foundation handled as a distinguished, always-first entry (not counted as a
  "component" in coverage metrics, matching current `/r` behavior)
- Both Stable and Beta items included; each item's maturity is a real,
  visible field in its index metadata — no hiding Beta behind a Stable-only
  index
- Item metadata: slug, title, category, maturity, `figmaAvailability`,
  summary — sourced from the same `ComponentRegistryEntry` fields already
  used elsewhere, no new parallel metadata format
- MCP `list`/`search` (if/when a Skrewww MCP exists — none does today, and
  CE-3G does not create one) would read this index rather than re-deriving it
- `shadcn view`/`shadcn add` regression: adding the index must not change any
  existing per-component manifest's shape or `name`
- Live endpoint verification: `/r/registry.json` must resolve and list
  exactly the distributed set present in `public/r/` at generation time —
  verified by a generator test comparing the two, mirroring existing
  generator-test conventions (e.g. the FILE_DESTINATIONS exhaustiveness check)
- Directory readiness: explicitly **not** the same milestone as shadcn
  Registry Directory submission (`STRICTLY OUT OF SCOPE` in CE-3G) — that
  remains a separate, later, unscheduled decision

## Overnight stop boundary (after CE-3G)

The next agent must **NOT**:
- implement any `/r` manifest for CE-3H–M slugs
- add any `FILE_DESTINATIONS` entry
- touch `lib/shadcn-registry-generator.ts` architecture
- implement `/r/registry.json`
- start banking distribution, Reference App, PH-0, or Guard
- run CE-3H before this plan has been reviewed/accepted as a separate task

Canonical next task: **CE-3H — Safe compound batch** (`badge`, `tag`,
`list-item`, `timeline`, `empty-state`, `alert`, `toast`, `button-group`,
`toggle-group`, `accordion`, `tabs`), matching CE-3D/E/F's own
one-batch-at-a-time, gate-then-stop precedent.
