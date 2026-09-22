# shadcn-compatible distribution layer

## What this is

A shadcn/ui-compatible transport layer that lets `npx shadcn@latest add
@skrewww/button` install Skrewww's Button (and its Foundation dependency)
into any Next.js project, generated from the canonical registry rather than
hand-maintained. Proven end-to-end in a real POC: a fresh, Tailwind-free
`create-next-app` project, a real shadcn CLI install against a locally
served registry, correct file placement, correct Shape/Surface mode
behavior (including Squircle clip-path and Glass backdrop-filter), working
`.sr-only`, zero unexpected npm packages, and passing lint/typecheck/build
— all with zero manual repair after install.

The shadcn distribution layer is implemented independently from the
previously documented `@skrewww/core` + `npx skrewww` roadmap (see
`skrewww-claude-project-instructions.md`'s "Distribution Model" section).
That roadmap is still an unimplemented, decided-but-not-built direction.
The shadcn layer described here is, as of this writing, the **first**
Skrewww distribution mechanism actually proven working end-to-end. The
long-term relationship between the two — whether they coexist
permanently, one supersedes the other, or they converge — has not been
decided. Do not treat this document as deprecating the `npx skrewww`
roadmap, and do not treat that roadmap as a blocker for using or extending
this layer.

## Scope of this pass

Foundation + Button + Card + Text Input + Form Field + Validation Message +
Spinner + Divider + Link (2026-09-13 expansion).
The mechanism (generator, lookup table, extraction) is structurally able
to support more components — adding one means adding its files to
`lib/component-registry.ts` (already the convention), an entry per new
file to `FILE_DESTINATIONS` in `lib/shadcn-registry-generator.ts`, and
a thin `buildXManifest()` wrapper around the generic
`buildComponentManifest(slug)` (extracted when Card was added — see the
Card section below) — but no additional component beyond the current nine,
native CLI, community registry infrastructure, or Vite/Remix generalization is
in scope here.

## How it works

- **Canonical source of truth stays `lib/component-registry.ts`** — no
  shadcn-specific field exists there. `CANONICAL_REGISTRY_SCHEMA_VERSION`
  is unaffected by this feature.
- **`lib/shadcn-registry-generator.ts`** holds all generation logic as
  pure, importable functions: reading real source files, mapping a
  canonical `ComponentRegistryEntry` to a shadcn `registry-item.json`
  shape, and mechanically extracting the Foundation CSS tier from
  `styles/tokens.css` + `styles/foundation.css` using the existing
  boundary-comment markers (not hardcoded line numbers). Importing this
  module never writes a file.
- **`scripts/generate-shadcn-registry.ts`** is the only place that writes
  to disk — a thin CLI wrapper around `buildDistributedRegistryItems()`
  + `buildRegistryIndex()`, writing every `public/r/<name>.json` install
  manifest and the discovery catalog `public/r/registry.json` from that
  **same** ordered collection (CE-3N). No second allowlist.
- **Transport-layer flattening happens only in the generator.** The
  canonical type keeps a component's own `files` and its private
  `internalDependencies` as separate arrays; the private
  `buildComponentManifest(slug)` function is the one place that
  concatenates them into a single shadcn `files[]` array, per the doc
  comment already on `ComponentRegistryEntry`. `buildButtonManifest()`
  and `buildCardManifest()` are both thin wrappers around it — extracted
  when Card was added, since the original Button-only function already
  contained no logic specific to Button beyond its own literal slug.
- **Per-file `type` and `target` are explicit and exhaustive, never
  inferred from a file extension and never defaulted.** `FILE_DESTINATIONS`
  in `lib/shadcn-registry-generator.ts` is a literal lookup table from
  real repo-relative path to `{ type, target }`. `classifyFile()` throws
  if a path isn't listed — a canonical entry gaining a new file/internal
  dependency without a matching table entry fails the build, not a
  consumer's install. `target` is always an explicit `~/`-rooted path
  (e.g. `~/lib/cn.ts`), never left as `""` — this was a deliberate
  strengthening over the original POC (which left `target: ""` and
  relied on the install-time consumer's own `components.json` aliases
  matching Button's literal imports, which only worked because the POC's
  test project's default aliases happened to line up).
- **Host requirements never leak as an installable dependency.**
  `hostRequirements` is rendered only into the shadcn item's free-text
  `docs` field, never into `dependencies` — preserving the same
  canonical-only discipline already established for `/registry.json`
  (`lib/seo.test.ts` guards that route; this layer doesn't touch that
  route at all). The actual list differs per component, derived from real
  source, not copied between entries: Button's is `["react", "react-dom",
  "next"]` (it imports `next/link`); Card's is `["react", "react-dom"]`
  only, since Card has no Next.js import of its own.

## Generated vs. committed

`public/r/*.json` is generated at build time (`npm run generate:registry`,
invoked by `npm run build` before `next build`) and is **gitignored, not
committed**. Reasoning: `/registry.json` already works this way — computed,
not hand-maintained — and `docs/architecture/source-of-truth.md` already
treats generated/derived artifacts as non-source. Committing the shadcn
manifests would create a second place the same data could live and drift
out of sync with `lib/component-registry.ts` between generator runs.
Determinism and correctness are instead guarded by tests
(`lib/shadcn-registry-generator.test.ts`), not by diffing a committed
snapshot — the test suite explicitly does not introduce a committed JSON
snapshot as a second source of truth.

## Build/test pipeline placement

The existing gate order is `verify:node → verify:package → lint →
typecheck → test → test:browser → build`. This feature does **not**
change that order. Instead:

- `npm test` (Vitest) runs `lib/shadcn-registry-generator.test.ts`, which
  exercises only the pure functions — no filesystem writes, no
  `public/r/` output. This is what catches a canonical/generator mismatch
  on every `npm test` run.
- `npm run build` runs `generate:registry` (the real, file-writing step)
  immediately before `next build`.
- `npm run test:all` needs no new wiring: it already ends in `npm run
  build`, so the real generation step runs exactly once per `test:all`
  invocation, via `build`, not duplicated by also being called from
  `test:all` directly.

**Known implication, not yet acted on:** `test:browser` (Playwright) runs
*before* `build` in this pipeline, so no currently-passing browser test
can rely on `/r/*.json` existing on disk — those static files are only
guaranteed present after `build` has run. If a future Playwright test
needs to fetch `/r/foundation.json` or `/r/button.json`, either the
pipeline order must change (moving `generate:registry` ahead of
`test:browser`) or that specific test must explicitly run
`npm run generate:registry` itself before starting its dev/preview
server. No current browser test consumes these paths, so no pipeline
change is made in this pass.

## URL shape

Served as static files under `public/r/`:

- Install / view payloads: `/r/{name}.json`
  (e.g. `https://skrewww.com/r/button.json`)
- Discovery catalog (CE-3N): `/r/registry.json`
  (e.g. `https://skrewww.com/r/registry.json`) — official shadcn
  `registry.json` schema; `shadcn list` / `search` fetch this path via the
  configured `@skrewww` namespace URL template
  (`…/r/{name}.json` with `name=registry`). Index items omit file
  `content`; install payloads remain on the individual manifests.
  Foundation is included as an installable `registry:file` item. Current
  coverage (verified 2026-09-22, OSS-1A): foundation + 55 component
  manifests = **56** discovery items (55/58 React components; the three
  banking pilots remain intentionally deferred). This count moves as
  components are added — treat `/r/registry.json` itself as the source of
  truth, not this line.
  See [`docs/distribution-expansion.md`](../distribution-expansion.md) for
  the batch-by-batch history that built up to full non-banking coverage.

This coexists with `/registry.json`
at the root — a different path, a different purpose (shadcn CLI
consumption vs. the existing public registry feed) — with zero changes to
`app/registry.json/route.ts`, `lib/registry-public.ts`, or
`PublicRegistryMetadata.schemaVersion` (still `1.4.0`). Existing
`/registry.json` consumers are unaffected. Agent Kit (`/agent/*`) remains
knowledge/contracts only — never merged into the shadcn index.

## Known follow-ups (not resolved in this pass)

- **`icons.tsx` transport coupling**: Button transports the whole
  85-line `components/ui/icons.tsx` file (4 exported icons) though it
  only uses `LoadingSpinner`. Measured in the POC: `icons.tsx` is 13.3%
  of Button's manifest payload, of which roughly 9.6 percentage points
  are unrelated icons (`PlusIcon`, `ChevronRightIcon`, `SearchIcon`).
  Not severe enough to justify splitting from one component's data —
  revisit once a second component also needs `icons.tsx`, so the
  coupling can be evaluated in both directions.
- **Consumer ESLint divergence**: a fresh `create-next-app` consumer
  shows 17 lint warnings (0 errors) on Button.tsx's underscore-prefixed
  destructuring pattern, because the canonical Skrewww repo's
  `eslint.config.js` extends only `eslint-config-next/core-web-vitals`,
  while `create-next-app`'s default scaffold also extends
  `eslint-config-next/typescript` (which enables
  `@typescript-eslint/no-unused-vars` without an `argsIgnorePattern: "^_"`
  override this repo doesn't need). Cosmetic, non-blocking, no lint
  configuration change made here.
- **First repository-wide CI**: this repo currently has no
  `.github/workflows/`. `npm run test:all` is the only current
  enforcement mechanism for the drift protection this feature relies on
  (via `test` + `build`), run locally/manually. Adding a first CI
  workflow is a separate, repository-wide decision, not made as a side
  effect of this feature.

## Verified External Consumer Test — 2026-08-09

Distinct from the original POC section above (which used a locally
served registry): this pass installed `@skrewww/button` from the **live
production registry** (`https://skrewww.com/r/{name}.json`) into a
brand-new, genuinely Tailwind-free `create-next-app` project, with real
browser interaction testing (not just static screenshots).

**Outcome: PASS WITH DOCUMENTED TOOLING LIMITATION.** The limitation
found is upstream `shadcn` CLI behavior (`init` requiring a Tailwind
config), not a defect in the `@skrewww` registry or transport layer —
the registry itself, Foundation dependency resolution, file placement,
and runtime behavior all validated cleanly.

### Tailwind-free limitation

`shadcn` CLI **4.16.2**'s `init` command hard-requires an existing
Tailwind CSS configuration and refuses to proceed without one —
confirmed failing identically across all three `--base` options (`base`,
`radix`, `aria`):

```
- Validating Tailwind CSS.
✖ Validating Tailwind CSS.
No Tailwind CSS configuration found... Install Tailwind CSS then try again.
```

Zero side effects from the failed attempts (`package.json` and file tree
byte-identical before/after). **Tailwind-free consumers must skip `init`
entirely** and hand-author `components.json` instead. Minimal config
that worked, exactly as used in this test:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "registries": {
    "@skrewww": "https://skrewww.com/r/{name}.json"
  }
}
```

### Foundation auto-resolution

`npx shadcn@latest add @skrewww/button` automatically resolved and
installed `@skrewww/foundation` via its `registryDependencies` entry —
no separate `add @skrewww/foundation` command was needed.

### Installed file targets (verified exact paths)

- `components/ui/Button.tsx`
- `components/ui/button.module.css`
- `lib/cn.ts`
- `components/ui/icons.tsx`
- `styles/skrewww-foundation.css` (Foundation CSS target)

### No unexpected npm packages

`package.json` was diffed before `shadcn add` and after — identical.
Zero new npm packages were installed as a side effect of the `add`
command.

### Build and runtime

Verified passing under **Next.js 16.3.0 / React 19.2.8** in the fresh
consumer app: `next build` compiled, typechecked, and generated static
output successfully.

### Runtime verification coverage

All confirmed rendering correctly in the fresh consumer, via real
browser interaction (not just static screenshots) — computed
`getComputedStyle` values and genuine DOM events, not visual
approximation:

- **Rounded** and **Squircle** shape modes — `border-radius`/`clip-path`
  checked directly (Rounded: `6px` / `none`; Squircle: `8px` / a
  resolved 34-point `polygon(...)`, confirming the superellipse geometry
  genuinely resolves in a real consumer browser, not just the source
  repo).
- **Flat** and **Glass** surface modes.
- **Hover** state — confirmed via `:hover` match + computed
  `background-color` change.
- **Focus-visible** state — confirmed via real `Tab` keypresses +
  `:focus-visible` match + computed outline.
- **Disabled** state — confirmed a real click attempt does not fire the
  handler, `pointer-events: none` applied.
- **`.sr-only`** utility — present, visually hidden, accessible.
- **Local `box-sizing: border-box`** — confirmed load-bearing on its own
  with the consumer's ambient reset removed.

## Card added to distribution — 2026-08-09

Card became the second real component (after Button) distributed through
this layer, reusing the identical mechanism with no architectural change.

**Manifest facts (`/r/card.json`):**
- `name: "card"`, `type: "registry:ui"`
- `dependencies: []` — Card has no third-party npm package need of its own
- `registryDependencies: ["@skrewww/foundation"]` — Foundation resolves
  separately via its own registry dependency, exactly as it does for
  Button
- `docs` states host requirements as `react, react-dom` only — unlike
  Button, Card has no `next/link` import, so `next` is correctly absent
- Transports exactly three files, each carrying an explicit `path`,
  `content`, `type`, and `target`: `components/ui/Card.tsx`,
  `components/ui/card.module.css`, `lib/cn.ts`
- The canonical-only `hostRequirements` field stays absent from the
  public shadcn payload — same discipline already established for
  Button and for `/registry.json`

**Generator change**: `buildButtonManifest()`'s body (already free of any
logic specific to Button beyond its own literal slug) was extracted into
a private, generic `buildComponentManifest(slug)`; `buildButtonManifest()`
and the new `buildCardManifest()` are both thin wrappers over it.
`FILE_DESTINATIONS` gained two literal entries for Card's two files —
still an explicit, fail-closed lookup table, no fallback added. No public
registry schema-version bump was needed: adding a second component to
`/r/*.json` introduced no new field or structural change to the shape.

**Production verification (2026-08-09)**: `https://skrewww.com/r/card.json`
passed all 13 checks run against it after deployment — HTTP 200,
`application/json` content type, a valid non-empty registry-item shape,
correct `name`/`type`, an exact `dependencies`/`registryDependencies`
match, correct `docs` wording, exactly the three expected files each
carrying all four required fields, zero occurrences of the string
`hostRequirements` anywhere in the raw payload, and the live payload
byte-identical to a fresh local `buildCardManifest()` output generated
from the exact pushed commit (`5f08d9e`). `/r/foundation.json` and
`/r/button.json` both continued to return 200 after the deployment,
confirming no regression to the two existing manifests.

**Tier B (`scripts/smoke-test-consumer.ts`) extended, not duplicated**:
the script now takes an optional component-name argument
(`npm run smoke:consumer`, `npm run smoke:consumer -- button`, and
`npm run smoke:consumer -- card`), defaulting to `button` for backward
compatibility. An unsupported component name fails immediately, before
any scaffold or network work, listing the supported components in the
error message. `--keep` continues to work with a component argument
present. Card's Tier B run passed end-to-end; Button's Tier B run (both
the default-arg and the explicit `-- button` form) still passes unchanged
after the parameterization. All shared orchestration — dynamic port, the
async `spawn`-based subprocess runner that prevents the same-process
registry-server deadlock, OS-temp isolation, npm-dependency-delta
diffing, and cleanup guarantees — was left untouched.

## Text Input, Form Field, and Validation Message added to distribution — 2026-08-09

Three interdependent form components became the next real case to test the distribution layer's multi-hop dependency chain and npm-package resolution.

**Manifest facts (`/r/text-input.json`, `/r/form-field.json`, `/r/validation-message.json`):**

- **Text Input** (`name: "text-input"`)
  - `dependencies: []` — no third-party npm packages
  - `registryDependencies: ["@skrewww/form-field", "@skrewww/foundation"]` — depends on Form Field, which itself depends on Validation Message
  - Transports: `components/ui/TextInput.tsx`, `components/ui/TextInputControl.tsx`, `components/ui/text-input.module.css`, `lib/cn.ts`

- **Form Field** (`name: "form-field"`)
  - `dependencies: []` — no third-party npm packages
  - `registryDependencies: ["@skrewww/validation-message", "@skrewww/foundation"]` — depends on Validation Message
  - Transports: `components/ui/FormField.tsx`, `components/ui/form-field.module.css`, `lib/cn.ts`

- **Validation Message** (`name: "validation-message"`)
  - `dependencies: ["@phosphor-icons/react"]` — **first real npm package dependency** in this layer, beyond Foundation's own requirements
  - `registryDependencies: ["@skrewww/foundation"]`
  - Transports: `components/ui/ValidationMessage.tsx`, `components/ui/validation-message.module.css`, `lib/cn.ts`

**Verified dependency graph**:
```
text-input
  → form-field
    → validation-message
      → @phosphor-icons/react
      → @skrewww/foundation
    → @skrewww/foundation
  → @skrewww/foundation
```

**Production verification (2026-08-09)**: All three endpoints (`https://skrewww.com/r/text-input.json`, `/r/form-field.json`, `/r/validation-message.json`) passed all checks — HTTP 200, valid JSON, correct manifest fields, exact `dependencies`/`registryDependencies` match, and byte-identical to a fresh local build of the pushed commit (`5e3a2f0`). `/r/foundation.json`, `/r/button.json`, and `/r/card.json` all continued to return 200 after deployment, confirming no regression.

**Tier B (`npm run smoke:consumer -- text-input`) extended**: The smoke test now supports Text Input as a component argument and passed end-to-end. Verified:
- Text Input's registry dependency chain auto-resolved (Form Field and Validation Message installed without separate `add` commands)
- Correct file placement for all three components + Foundation
- npm dependency delta matched expected: `@phosphor-icons/react` was the only net-new npm package installed
- Shared `lib/cn.ts` file transport across all three components resolved to a single, byte-identical final file
- Text Input's internal FormField reference resolved correctly at runtime
- Foundation CSS activated and applied
- Consumer `next build` succeeded

**Milestone fact**: This is the first verified case of a real, multi-hop shadcn registry dependency chain with non-empty npm `dependencies`, proving that the transport and resolution layers handle both registry-to-registry composition and npm-package pull-in correctly.

**No public registry schema-version bump was needed.** Adding three more components to `/r/*.json` and resolving a three-component chain introduced no new field or structural change to the shadcn registry-item shape.

## Spinner + Divider + Link expansion — 2026-09-13

**Token transport rule:** genuinely shared geometry that multiple
independent components need belongs **above** the Foundation cut in
`styles/tokens.css` so `/r/foundation.json` delivers it once.
Component-private geometry belongs in that component's CSS module and
travels with its own `/r/{name}.json` payload.

Applied here:

- Spinner/Divider shared geometry → Foundation cut (no duplication).
- Link geometry (`--link-*`) → `link.module.css` (Link-owned).
- Link helpers must not import docs-site `lib/site-config`; origin is
  explicit or runtime `location.origin`.

**Manifests:** `/r/spinner.json`, `/r/divider.json`, `/r/link.json` —
each `registryDependencies: ["@skrewww/foundation"]`, empty npm
`dependencies`, no `hostRequirements` in serialized output.

**Consumer proof:** `npm run smoke:consumer -- spinner|divider|link` and
composed `spinner-divider-link`. Schema remains `1.4.0`.

## Cross-cutting component-token delivery audit — 2026-09-22 (OSS-1A)

The "Token transport rule" above (component-private geometry lives in the
component's own CSS module) was applied consistently for charts and for
Spinner/Divider/Link, but not retroactively to most earlier components.
OSS-1A re-audited every distributed manifest's transported payload (not
repo source) for `var(--token)` references with no CSS fallback that are
undefined by the manifest's own CSS, its resolved `registryDependencies`
closure, or Foundation — including scanning `.tsx` for inline
custom-property definitions (e.g. Slider sets its own `--slider-*`
variables via React inline `style`, which is correctly self-sufficient and
not a bug).

**Finding (exact, not approximate):** **35 of 55** distributed components
reference **315 distinct** custom properties that no part of their install
closure defines. Every one of those 315 tokens comes from exactly one
place: the component tier of `styles/tokens.css` — the span between
`/* ── Form control geometry` and `/* ── Shape modes ── */` that
`extractFoundationCssFromSource()` deliberately excludes from the
Foundation transport. Zero come from anywhere else, so this is a single
root cause, not a collection of unrelated defects.

The 20 clean components are: `button`, `card`, `text-input`, `form-field`,
`validation-message`, `spinner`, `divider`, `link`, `slider`, `stepper`,
`button-group`, `toggle-group`, `search-field`, `credit-card-field`,
`number-input`, `split-button`, `bar-chart`, `line-chart`, `area-chart`,
`chart-metric`.

**Consumer proof (two independent clusters, real browsers, fresh
installs):**

- `@skrewww/badge` — computed `padding: 0px`, `border-radius: 0px`,
  `background-color: rgba(0,0,0,0)`, `border-color: rgb(23,23,23)`
  instead of the intended success treatment.
- `@skrewww/alert` — computed `padding: 0px`, `border-radius: 0px`,
  `gap: normal`, `border-width: 0px`; `--feedback-padding`,
  `--feedback-radius` and `--feedback-info-border` all resolve to nothing,
  while the Foundation-tier `--semantic-surface-default` correctly
  resolves to `#fff` in the same document. That contrast is the whole bug
  in one measurement: Foundation transport works, the component tier
  simply never ships.

Note this is a **distribution-only** defect. The docs site loads
`styles/tokens.css` whole, so every tier cascades from `:root` and the
site renders correctly; only the `/r` install path is affected.

**Disposition — deferred to a dedicated phase (OSS-1B), not fixed here.**
Both candidate fixes change architecture rather than being mechanical:

1. *Per-component ownership* (the CH-1 chart pattern) means relocating 315
   declarations out of the canonical token file into 35 component CSS
   modules. Beyond volume, 15 of those tokens are referenced by a file
   other than their name-owner — `--popover-surface`/`-border`/
   `-elevation`/`-viewport-padding` are consumed by `select.module.css`
   and `date-picker.module.css` (and `--popover-surface` is not consumed
   by `popover.module.css` at all), and eight `--calendar-day-*` tokens
   are consumed by `calendar-period-cell.module.css`. Scoping those to a
   component root only resolves if the consuming element is actually
   nested inside the owning element, which is a per-component DOM
   judgement, not a mechanical move.
2. *Expanding the Foundation transport to carry the component tier* would
   ship ~361 tokens to every consumer regardless of what they installed,
   and the tier is explicitly marked `[TEMPORARY]` in `tokens.css` — there
   is no architecture evidence that global delivery is the intended
   design, so this is a Foundation-scope decision, not a bug fix.

There is also a third design question either option must answer first: 12
component-tier tokens (`--menu-surface`, `--menu-border`,
`--menu-elevation`, `--menu-item-hover-surface`, `--menu-backdrop-filter`,
`--feedback-{info,success,warning,error}-surface`,
`--file-upload-dragging-surface`, `--pagination-page-radius`,
`--component-list-item-supporting-text`) are re-declared inside the
Shape/Surface mode blocks that Foundation *does* transport. A declaration
placed on the component element would defeat those ancestor-level mode
overrides, so token ownership and Shape/Surface mode precedence have to be
decided together.

**Guard rail in the meantime:** `lib/token-delivery-audit.test.ts` checks
all 56 manifests on every `npm test`. It allowlists the 35 currently-known
components so CI is not red on a tracked, deliberately-deferred defect,
but the allowlist is shrink-only — fixing a component without removing it
from the list fails the test, and a regression in any of the 20 clean
components fails it too. Deleting that allowlist entirely is OSS-1B's exit
criterion.

## Distributed token delivery hardening — 2026-09-22 (OSS-1B)

**Verdict: Option B accepted.** Expanding the Foundation transport to carry
the component tier of `styles/tokens.css` closed the 315-token gap without
relocating declarations into 35 component CSS modules.

### Final Foundation extraction rule

`extractFoundationCssFromSource()` now ships, in this exact source order:

1. Universal Primitive / Semantic / Brand tokens (everything in `:root`
   above `/* ── Form control geometry`)
2. Component-tier defaults (from that comment through the end of the same
   `:root` block — the closing `}` is dropped because the function emits
   its own)
3. Shape mode blocks (`/* ── Shape modes ── */` …)
4. Surface mode blocks (`/* ── Surface modes ── */` …)
5. `styles/foundation.css` utilities (`.sr-only`, …)

Source of truth remains `styles/tokens.css` (+ `styles/foundation.css` for
utilities). Generation is deterministic: every declaration is a verbatim
substring; there is no hand-retyped parallel token truth.

### Why mode overrides remain safe

Shape and Surface attributes are applied to `<html>` in both this repo and
typical consumers. Mode selectors (`[data-skrewww-shape="…"]`,
`[data-skrewww-surface="…"]`) therefore target the same element as
`:root` and have equal specificity — **source order decides**. Keeping
component-tier defaults *inside* the emitted `:root` block, still *ahead*
of the mode blocks, preserves the cascade `tokens.css` already has:
defaults first, mode overrides last. Computed-style proof:
`scripts/oss1b-foundation-cascade-proof.ts` (Badge/Alert defaults; Shape
overrides `--pagination-page-radius`; Surface overrides `--menu-surface`
and `--file-upload-dragging-surface`; Popover / Calendar Day tokens
resolve with no other component CSS present).

### OSS-1B regression root cause (not an extraction boundary bug)

Expanding the tier correctly pulled in three fallback-less references that
the source never defined: `--primitive-shadow-blur-4`,
`--primitive-shadow-color-4`, and `--radius-full` (used by
`--popover-elevation` / `--tag-radius`). Because the audit scans
Foundation itself, every install graph — including previously-clean
button/card — failed with those three gaps. Closed in `styles/tokens.css`
(primitive declarations); proven by Foundation self-consistency + mutation
tests in `lib/token-delivery-audit.test.ts`. **KNOWN_AFFECTED deleted.**

### Cost (measured against pre-Option-B extraction on the same tokens file)

| | Raw | Gzip | Declared tokens |
|---|---:|---:|---:|
| Before (cut before Form control geometry) | 44 474 B | 9 630 B | 148 |
| After (Option B + missing primitives) | 70 177 B | 15 545 B | 497 |
| Delta | +57.8% | +61.4% | +349 |

Absolute cost: **+25.7 KB raw / +5.9 KB gzip** on a stylesheet every
consumer imports once. Accepted: one install graph, cross-component tokens
work without peer installs, no component API or registry schema change.

### Exit criteria met

- REAL BUG = 0 across 55 distributed components; unresolved runtime token
  references = 0; HOST-OWNED = 0
- KNOWN_AFFECTED absent
- No per-component migration of the 315 declarations
- No upstream shadcn PR / npm publish (OSS-2 remains separate)
