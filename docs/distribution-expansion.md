# CE-3 distribution expansion plan

> **CE-3A** · Verified 2026-09-15 · Baseline `2b01ca5` · React **55** (27 Stable / 28 Beta)  
> Canonical planning artifact for CE-3. Does **not** redesign the locked
> shadcn transport architecture.

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

### Explicitly NOT overnight

- radio-group, overlays, date/calendar, phone-number-field
- charts / banking
- `/r/registry.json`
- Registry Directory submission
- CE-4 / Reference App / PH-0 / Guard

## Target coverage after CE-3B + CE-3C

| Metric | Before | After CE-3B | After CE-3C |
|--------|-------:|------------:|------------:|
| Foundation | 1 | 1 | 1 |
| Component manifests | 8 | **11** | **13** |
| Remaining eligible (T1–T2 rough) | ~20 | ~17 | ~15 |
| Deferred (T3–T5) | ~27 | ~27 | ~27 |

## Status

| Phase | Status |
|-------|--------|
| CE-3A Distribution Audit | ✅ COMPLETE (`702787d`) |
| CE-3B Tier-1 Stable batch | ✅ COMPLETE (`5952a0e`) |
| CE-3C Tier-2 Stable batch | ✅ SHIPPED — `radio`, `switch` (+ `use-controllable`) |
| CE-3 overall | **IN PROGRESS** (remaining tiers + `/r/registry.json` later) |
