# CE-3 distribution expansion plan

> **CE-3A** · Verified 2026-09-15 · Baseline `2b01ca5` · React **55** (27 Stable / 28 Beta)
> **CE-3D/E/F planning** · Verified 2026-09-15 · Baseline `a867076` · `/r` = foundation + **13**
> Canonical planning artifact for CE-3. Does **not** redesign the locked
> shadcn transport architecture. Implementation batches CE-3D/E/F are
> **DEFINED — NOT STARTED** below.

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
| CE-3 overall | **IN PROGRESS** (stop overnight; `/r/registry.json` later) |
