# Getting Started with Skrewww

This is the **canonical developer onboarding guide** for the Skrewww
repository. Read this before deeper architecture notes or contribution rules.

It answers, in order:

1. What is Skrewww?
2. How do I run it locally?
3. Where is everything in the repository?
4. How is the design system architected?
5. What is the source of truth between Figma and React?
6. How do I modify or add a component?
7. How do tokens work?
8. How does the registry / distribution system work?
9. Which tests must I run?
10. What Git / release rules must I follow?
11. Where do I look next?

For volatile implementation status — inventory, parity progress, open gaps —
see [`project-status.md`](project-status.md). This guide stays free of snapshot
test counts and release SHAs so it does not go stale.

Contribution and Git safety:
[`contributing.md`](contributing.md).

---

## Quick start

```bash
git clone <repository-url>
cd skrewwwDS
npm install
npm run dev
```

`npm run dev` starts the Next.js development server. Next.js serves on
`http://localhost:3000` by default; the port is printed in the terminal on
startup.

To confirm your Node runtime matches what the repository expects before
starting:

```bash
npm run verify:node
```

---

## What is Skrewww?

Skrewww is a token-driven design system, plus the Next.js documentation site
that renders it. Both live in this one repository.

The repository contains:

- the React component implementations,
- the design tokens they are built from,
- the documentation site that previews and documents them,
- a canonical registry that describes every component,
- a shadcn-compatible distribution layer generated from that registry.

Components favour native HTML semantics, using custom controls only where
native HTML cannot represent the confirmed interaction model. The
accessibility baseline is WCAG 2.2 AA (target).

---

## Prerequisites

| Requirement | Value | Source |
|---|---|---|
| Node.js | `>=20.19.0` | `engines` in `package.json`, `.nvmrc`, `.node-version` |
| Package manager | npm | `package-lock.json` (lockfile is authoritative) |
| Git | required for clone / contribution | — |

Confirm the Node runtime matches repository policy:

```bash
npm run verify:node
npm run verify:package
```

---

## Install and run locally

```bash
npm install     # install dependencies
npm run dev     # start the dev server
```

Other everyday commands:

| Command | Purpose |
|---|---|
| `npm run dev` | Start the dev server (writes to `.next`) |
| `npm run dev:clean` | Remove `.next`, then start dev — use if the build cache looks corrupted |
| `npm run verify:node` | Confirm Node satisfies `engines` |
| `npm run verify:package` | Confirm package / lockfile metadata alignment |
| `npm run lint` | ESLint (`--max-warnings 26` — ceiling is currently full) |
| `npm run typecheck` | TypeScript, no emit |
| `npm test` | Vitest unit tests (single run) |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:browser` | Playwright browser tests |
| `npm run build` | Production build (regenerates the registry first) |
| `npm run generate:registry` | Regenerate the distribution manifests only |
| `npm run smoke:consumer` | Clean-consumer install smoke for the `/r` graph |
| `npm run test:all` | Full gate chain — see [Testing and verification](#testing-and-verification) |

Playwright builds and serves its own isolated output rather than reusing the
dev server's `.next` directory, so you can keep `npm run dev` running while
browser tests execute. Avoid running a production build and the dev server
against the same output directory at the same time.

---

## Repository structure

```
app/                    Next.js App Router routes (pages, registry.json route, OG image)
components/ui/          Public React components (exports via components/ui/index.ts)
components/ui/internal/ Internal composition primitives — not public API
components/previews/    Client-side live previews for the docs site (not canonical source)
components/docs/        Documentation UI helpers (API tables, JSON-LD, copy actions)
content/                Figma-derived documentation prose + public changelog data
styles/                 Design tokens (`tokens.css`) and foundation/global CSS
lib/                    Canonical registry, public registry, SEO, sitemap, site config
lib/*-figma-metadata*   Archived verified Figma evidence (when present)
scripts/                Registry generation, consumer smoke, verify:node / verify:package
e2e/                    Playwright browser specs
docs/                   Getting started, contributing, architecture, project status
public/                 Static assets; public/r/ is generated and gitignored
```

Unit tests are colocated as `*.test.ts` / `*.test.tsx`. Browser tests live in
`e2e/`. Docs previews under `components/previews/` are **not** the source of
truth for component behavior — `components/ui/` is.

---

## Design-system architecture

### Token layers

`styles/tokens.css` is the runtime source of truth for token values, and
declares its own layering:

```
Primitive → Semantic → Component → Brand → Shape → Surface
```

Read it in that order. A component should consume a **semantic** or
**component** token rather than a raw primitive or a hardcoded value.

**Brand**, **Shape**, and **Surface** sit alongside that chain:

- **Brand** — brand ramp and brand-facing aliases.
- **Shape** — radius / personality modes (`sharp`, `rounded`, `pill`, `squircle`).
- **Surface** — material modes (`flat`, `gradient`, `glass`).

Tokens carry classification comments (`[VERIFIED]`, `[ALIASED]`,
`[TEMPORARY]`, `[UNRESOLVED]`, `[EXPERIMENTAL]`) — these tell you how much a
value can be trusted and whether it is still pending design confirmation.

Rules of thumb:

- Prefer the token that owns the **semantic role**, not a nearby hex that
  merely looks the same.
- Component-scoped tokens are valid when the meaning is component-specific.
- Do **not** reuse `[TEMPORARY]` / TEMP aliases merely because they visually
  match — fix or introduce the correct semantic/component token instead.
- Keep `styles/tokens.css` and any guarded Tailwind docs-shell duplicates in
  sync when you change shared primitives (see tests in
  `lib/project-configuration.test.ts`).

Detail: [`architecture/token-source-of-truth.md`](architecture/token-source-of-truth.md).

### Shape and Surface

Skrewww is **one component architecture**, not several parallel libraries.
Visual personality is applied through mode contracts set as data attributes
on an ancestor element — the document root carries the defaults:

- **Shape**: `sharp`, `rounded`, `pill`, `squircle`
- **Surface**: `flat`, `gradient`, `glass`

Components respond to these by reading Shape/Surface-aware CSS custom
properties, so switching a mode restyles existing components rather than
swapping in different ones.

Important caveat: **not every component participates in every mode.** Some
components are deliberately fixed (for example, shapes that must stay
circular), and some Stable-v1 scopes are intentionally restricted to a single
mode. Check the component's own CSS module, its registry entry, and
[`project-status.md`](project-status.md) before assuming a component supports
a given mode.

Gradient in particular has a narrow, explicitly bounded Stable-v1 contract —
read [`architecture/gradient-foundation.md`](architecture/gradient-foundation.md)
before touching it.

### From tokens to distribution

```
tokens  →  components/ui  →  components/previews + content  →  registry  →  public/r
```

The registry (`lib/component-registry.ts` and its category files) is the
canonical description of every component. The docs site reads it, and the
distribution layer is generated from it.

---

## Figma and React responsibilities

Skrewww is designed against Figma, but the two are not interchangeable
sources of truth. Day-to-day rules:

- **Inspect Figma through live Figma MCP** (or archived verified metadata)
  before claiming parity. Figma is authoritative for approved visual and
  component behaviour **only when that evidence has actually been inspected**.
- **Never invent Figma facts** — node IDs, variable IDs, colors, states, or
  parity claims. If unknown, record it as unknown.
- **Inspect the master / component set / variables** relevant to the change —
  not only an example or marketing frame. An example frame is not automatically
  a canonical component.
- **React is authoritative for runtime behaviour** — semantics, keyboard,
  focus management, and the public component API.
- **Accessibility can override a Figma value.** If a design would produce an
  inaccessible result, raise it and fix it properly — do not copy it into
  React. Blind parity is not the goal.
- **Classify differences** — parity gap, intentional non-parity, or deferred
  Stable-v1 scope. Do not silently normalize either side.
- **Figma visual parity ≠ React API stability.** Closing a visual gap does not
  require promoting a component to Stable, and platform `1.0.0` does not mean
  every component API is frozen as Stable.
- **React-first does not mean parity.** Some components shipped in React before
  a Figma counterpart existed; “implemented” is not “matches Figma”.

### Intentional non-parity (examples)

These are product decisions, not unfinished bugs:

- **Link Subtle (default)** — React accessibility override relative to Figma
  contrast; treat as intentional unless product revisits it.
- **Menu Selected** — Figma may show a Selected item treatment; React has
  **no** generic selected / checkable Menu API for Stable-v1 (command model).
  Future checkable items would be additive, not a silent retrofit.
- **Pagination Previous / Next** — React keeps textual boundary controls;
  aligning to icon-only Figma composition requires an explicit presentation
  decision.

How conflicts are resolved in detail:
[`architecture/source-of-truth.md`](architecture/source-of-truth.md).

Agent-oriented Figma safety rules also live in [`../AGENTS.md`](../AGENTS.md).

---

## Working on a component

A practical sequence that matches how changes are made in this repository:

1. **Identify the canonical registry entry** — `lib/component-registry.ts` and
   category files (`lib/component-registry-*.ts`). Note `status`, `version`,
   `openQuestions`, `apiProps`, and distribution fields when present.
2. **Audit the current React implementation** in `components/ui/` (and its
   CSS module / tests). Public exports are listed in `components/ui/index.ts`.
   Anything under `components/ui/internal/` is not public API.
3. **Inspect Figma masters / tokens** when the work is parity-related (live
   MCP or archived verified metadata). Do not invent evidence.
4. **Classify** parity gap vs intentional non-parity vs deferred scope before
   coding — check [`project-status.md`](project-status.md) and the component's
   `openQuestions`.
5. **Implement narrowly** — smallest change that satisfies the task. Do not
   change runtime solely to match Figma when accessibility or an explicit
   product decision says otherwise.
6. **Follow the token chain** — prefer semantic/component tokens; avoid
   unexplained hardcoding and TEMP-alias reuse.
7. **Update registry metadata / docs** when public props, status notes, or
   install fields change. Docs previews are not canonical source.
8. **Add or update focused regression tests** for the behaviour you changed.
9. **Run focused verification**, then widen gates as appropriate (below).
10. **Inspect the full diff and selectively stage** — never rely on
    `git add .` for mixed or release-sensitive work. See
    [`contributing.md`](contributing.md).

Warnings:

- Do not treat `components/previews/` as the component source of truth.
- Do not churn public APIs without an explicit decision and docs/registry
  updates.
- Do not “fix” a Stable-v1 restriction that is an intentional scope boundary.

---

## Testing and verification

Work outward from the change. Run cheap, targeted checks first; widen only as
far as the change warrants.

**1 — Focused tests** for the files you touched:

```bash
npx vitest run path/to/file.test.ts
npx playwright test e2e/some-spec.spec.ts --workers=1
```

**2 — Runtime / package policy** (especially after toolchain or metadata edits):

```bash
npm run verify:node
npm run verify:package
```

**3 — Static checks:**

```bash
npm run lint
npm run typecheck
```

**4 — Unit tests:**

```bash
npm test
```

**5 — Production build** (also regenerates `/r` manifests):

```bash
npm run build
```

**6 — Browser tests** when the change is observable in a rendered page
(layout, styling, interaction, focus, accessibility):

```bash
npm run test:browser
```

For **full-suite** Playwright confidence (and for release candidates), run with
a single worker so failures are not masked by parallelism:

```bash
npx playwright test --workers=1
```

(`npm run test:browser` uses Playwright’s defaults locally; CI already forces
`workers: 1`. Prefer `--workers=1` explicitly for release-gate runs.)

**7 — Consumer smoke** when registry dependency transport or install graphs
may be affected:

```bash
npm run smoke:consumer -- text-input
```

**8 — Everything** for broad changes or release confidence:

```bash
npm run test:all
```

Also always:

```bash
git diff --check
```

**Focused vs full.** Docs-only or comment changes do not need the full browser
suite. Token or CSS changes that touch many surfaces deserve a wide run. Say
which checks you actually ran — never report a gate as passing if it failed,
timed out, or did not finish.

**Lint warnings.** ESLint is configured with `--max-warnings 26`. That budget
is currently fully used; do not add warnings casually, and do not “clean”
unrelated warnings in an unrelated PR without agreement.

Browser testing conventions:
[`architecture/browser-interaction-testing.md`](architecture/browser-interaction-testing.md).

---

## Registry and distribution

Two different numbers matter:

| Surface | Meaning |
|---|---|
| **Implemented React components** | All registry entries with `hasImplementation: true` (currently dozens; count is derived at runtime — do not hardcode it in docs). Documented on this site with live previews. |
| **shadcn `/r` install surface** | The **subset** generated into `public/r/*.json` and installable via `npx shadcn@latest add @skrewww/<name>`. |

**Current supported `/r` items (exactly six):**

`foundation`, `button`, `card`, `text-input`, `form-field`, `validation-message`

Other implemented components are **not** part of the current install surface.

### How generation works

- **Canonical source**: `lib/component-registry.ts` + category files.
- **Generator**: `lib/shadcn-registry-generator.ts`, invoked by
  `scripts/generate-shadcn-registry.ts` via `npm run generate:registry`
  (also runs during `npm run build`).
- **Output**: `public/r/` — **generated and gitignored**. Never hand-edit or
  force-add these files.
- **Docs metadata feed**: `/registry.json` (separate from `/r/{name}.json`).

### Dependency semantics (important)

- Registry item `dependencies` lists **third-party npm packages** the install
  layer should add (not React/Next host packages).
- Host frameworks belong in canonical `hostRequirements` and are **not**
  leaked into public `/r` JSON.
- Having a package in this repo’s `package.json` does **not** prove a consumer
  receives it — the **generated** item must declare it.

Example graph:

```
text-input
  → form-field
    → validation-message  (npm: @phosphor-icons/react)
    → foundation
  → foundation
```

Prove transport with:

```bash
npm run smoke:consumer -- text-input
```

Public `/registry.json` `schemaVersion` is **1.4.0**. The canonical
`ComponentRegistryEntry` shape is versioned separately
(`CANONICAL_REGISTRY_SCHEMA_VERSION` = **1.0.0**). See
[`architecture/versioning.md`](architecture/versioning.md).

Full distribution notes:
[`architecture/shadcn-distribution.md`](architecture/shadcn-distribution.md).

---

## Git and contribution safety

Short version — details in [`contributing.md`](contributing.md):

- Audit before write; keep diffs scoped.
- Inspect the full diff; **selective stage** only intended files.
- Do **not** use `git add .` for release-sensitive or mixed work.
- Do **not** stage `public/r/` or other generated/ignored artifacts.
- Commit only after the verification you claim actually ran.
- No force-push / history rewrite on shared branches.
- Release tags must point at explicitly verified commits; do not casually
  retarget published tags.
- Platform `1.0.0` and per-component Beta status are independent maturity
  tracks ([`architecture/versioning.md`](architecture/versioning.md)).

---

## Stable-v1 boundaries

Current work is focused on hardening what exists rather than widening scope.
The active priorities are parity, accessibility, documentation, testing, and
distribution reliability.

That means the following should not be introduced casually, without explicit
scope agreed up front:

- new component families,
- new public APIs on existing components,
- unrelated visual systems,
- broad token-architecture changes.

Several components also carry deliberately narrow Stable-v1 scopes — a
restriction to a single Surface or Shape mode, or a feature explicitly
deferred. These are decisions, not oversights. Confirm the current scope in
[`project-status.md`](project-status.md) and the relevant architecture note
before treating a limitation as a bug to fix.

---

## Before considering a change complete

- [ ] Scope stayed limited to the task; no unrelated refactors
- [ ] Public component API preserved, unless changing it was the point
- [ ] Semantic or component tokens used instead of unexplained hardcoded values
- [ ] Design parity checked where a verified counterpart applies
- [ ] Accessibility considered — semantics, keyboard, focus, contrast
- [ ] Relevant component states verified
- [ ] Relevant Shape/Surface modes verified, for modes the component supports
- [ ] Focused regression coverage added or updated
- [ ] Focused tests pass
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm test` passes
- [ ] `npm run build` passes
- [ ] Browser tests run if the change is visually or behaviourally observable
- [ ] `git diff --check` passes
- [ ] Generated registry output regenerated rather than hand-edited, if relevant
- [ ] Own diff reviewed; only intended files staged (no `git add .` for mixed work)
- [ ] Generated `public/r/` not hand-edited or force-added

---

## Where to read next

| Document | What it covers |
|---|---|
| [`../README.md`](../README.md) | Concise project overview and public status |
| [`contributing.md`](contributing.md) | Contribution rules, staging, commits, a11y expectations |
| [`project-status.md`](project-status.md) | Current status, inventory, open gaps |
| [`architecture/source-of-truth.md`](architecture/source-of-truth.md) | How conflicting claims are resolved |
| [`architecture/token-source-of-truth.md`](architecture/token-source-of-truth.md) | Token layering and parity labels |
| [`architecture/shadcn-distribution.md`](architecture/shadcn-distribution.md) | Registry and `/r` distribution layer |
| [`architecture/versioning.md`](architecture/versioning.md) | Platform vs component vs schema versioning |
| [`architecture/gradient-foundation.md`](architecture/gradient-foundation.md) | Stable-v1 Gradient contract |
| [`architecture/browser-interaction-testing.md`](architecture/browser-interaction-testing.md) | Browser testing approach |
| [`../AGENTS.md`](../AGENTS.md) | Agent guidelines (optional for humans) |

The `docs/architecture/` directory also holds per-component notes (Table,
Calendar, Form Field, Combobox, Data Table, File Upload, …). Read the note for
the component you are changing before editing it.

### AI-assisted contributions

If you use an AI coding agent, follow [`../AGENTS.md`](../AGENTS.md) in
addition to this guide and [`contributing.md`](contributing.md). Human
contributors do not need AGENTS.md to work in this repository.
