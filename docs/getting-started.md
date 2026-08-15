# Getting Started with Skrewww

This is the primary guide for developers new to the Skrewww repository. It
covers what the project is, how to run it, how the design system is put
together, and how to make and verify a change safely.

For current implementation status — component inventory, parity progress,
open gaps — see [`project-status.md`](project-status.md). This guide is kept
deliberately free of volatile counts so it stays accurate over time.

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
| Node.js | `>=20.19.0` | `engines` in `package.json`, `.nvmrc` |
| Package manager | npm | `package-lock.json` |

The repository pins a Node version in `.nvmrc`. No other runtime versions are
specified, so use your normal npm version.

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
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, no emit |
| `npm test` | Vitest unit tests (single run) |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:browser` | Playwright browser tests |
| `npm run build` | Production build (regenerates the registry first) |
| `npm run generate:registry` | Regenerate the distribution manifests only |
| `npm run test:all` | The full gate chain — see [Testing and verification](#testing-and-verification) |

Playwright builds and serves its own isolated output rather than reusing the
dev server's `.next` directory, so you can keep `npm run dev` running while
browser tests execute. Avoid running a production build and the dev server
against the same output directory at the same time.

---

## Repository structure

```
app/                    Next.js App Router routes, including the registry route
components/ui/          Public React components (exported via components/ui/index.ts)
components/ui/internal/ Internal composition primitives — not public API
components/previews/    Client-side live previews used by the docs site
components/docs/        Documentation UI (JSON-LD, API tables, copy actions)
content/                Figma-derived documentation prose, by category
styles/                 Design tokens and global styles
lib/                    Registry, registry generator, SEO, sitemap, indexing, metadata
scripts/                Registry generation, consumer smoke test, verification scripts
e2e/                    Playwright browser specs
docs/                   This guide, architecture notes, project status
public/r/               Generated distribution manifests — build output, not source
```

Unit tests are colocated next to the code they cover as `*.test.ts` /
`*.test.tsx` files. Browser tests live separately in `e2e/`.

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
Tokens carry classification comments (`[VERIFIED]`, `[ALIASED]`,
`[TEMPORARY]`, `[UNRESOLVED]`, `[EXPERIMENTAL]`) — these tell you how much a
value can be trusted and whether it is still pending design confirmation.

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
sources of truth. The rules that matter day to day:

- **Figma is authoritative for approved visual and component behaviour** —
  when that evidence has actually been inspected and recorded. Verified
  findings are archived in the repository's Figma metadata files.
- **React is authoritative for runtime behaviour** — semantics, keyboard
  interaction, focus management, and the public component API.
- **Accessibility can override a Figma value.** If a design would produce an
  inaccessible result, the correct outcome is to raise it and fix it
  properly — not to copy it into React. Blind parity is not the goal.
- **React-first does not mean parity.** Several components were built in
  React before a Figma counterpart existed. Those are marked as such; do not
  read "implemented" as "matches Figma".
- **An example frame is not a component.** A demo or illustration frame in
  Figma is not automatically a canonical, reusable component set.
- **Do not invent Figma facts.** Node IDs, variables, states, and parity
  claims belong in the repository only when they have genuinely been
  verified. If something is unknown, record it as unknown.

How conflicts are resolved, in detail:
[`architecture/source-of-truth.md`](architecture/source-of-truth.md).

---

## Working on a component

A practical sequence that matches how changes are made in this repository:

1. **Find the canonical component.** Public components live in
   `components/ui/` and are exported from `components/ui/index.ts`. Anything
   under `components/ui/internal/` is a composition primitive, not public API.
2. **Read its current status.** Check its registry entry and
   [`project-status.md`](project-status.md) for known gaps, deferrals, and
   Stable-v1 boundaries before assuming something is a bug.
3. **Check the design counterpart where one applies** — and note whether the
   component is React-first with parity still pending.
4. **Follow the token chain.** Trace the CSS module's custom properties back
   through `styles/tokens.css`. Fix values at the layer that actually owns
   them; prefer correcting a shared token over patching one component.
5. **Make the smallest scoped change** that satisfies the task. Avoid
   unrelated refactors.
6. **Preserve the public API** unless changing it is the explicit point of
   the work.
7. **Verify the relevant states** — default, hover, focus, active, disabled,
   error, and any component-specific states.
8. **Verify the relevant Shape and Surface modes**, but only those the
   component actually claims to support.
9. **Add or update focused regression coverage** for the behaviour you
   changed.
10. **Run the focused tests**, then the quality gates below.
11. **Review your own diff** before committing — confirm nothing unrelated
    was swept in.

---

## Testing and verification

Work outward from the change. Run the cheap, targeted checks first, and widen
only as far as the change warrants.

**1 — Focused tests.** Run the specific unit or browser tests covering what
you touched:

```bash
npx vitest run path/to/file.test.ts
npx playwright test e2e/some-spec.spec.ts
```

**2 — Static checks.**

```bash
npm run lint
npm run typecheck
```

**3 — Unit tests.**

```bash
npm test
```

**4 — Production build.**

```bash
npm run build
```

**5 — Browser tests**, when the change is observable in a rendered page —
layout, styling, interaction, focus, or accessibility:

```bash
npm run test:browser
```

**6 — Everything**, when the change is broad or you want the same chain used
for release confidence:

```bash
npm run test:all
```

**Focused vs full.** Running the entire browser suite is not required for
every contribution. A token or CSS change that affects many components
deserves a wide run; a docs-only or comment change does not. Use judgement,
and say which checks you actually ran — never report a gate as passing if it
did not run or did not finish.

**Also check your diff is clean:**

```bash
git diff --check
```

Browser testing conventions and rationale:
[`architecture/browser-interaction-testing.md`](architecture/browser-interaction-testing.md).

---

## Registry and distribution

Skrewww exposes a shadcn-compatible distribution layer, generated from the
same registry the docs site uses.

- **Source**: `lib/component-registry.ts` plus the per-category registry
  files, with the generation logic in `lib/shadcn-registry-generator.ts`.
- **Generator**: `scripts/generate-shadcn-registry.ts`, run via
  `npm run generate:registry`. It also runs automatically as part of
  `npm run build`.
- **Output**: `public/r/` — one manifest per distributed component.
- **Runtime metadata route**: `app/registry.json/route.ts`, which serves the
  registry as JSON from the running site.

**`public/r/` is generated build output, not source.** It is excluded from
version control. Never hand-edit those files — change the registry source and
regenerate. If a manifest looks wrong, fix the registry entry or the
generator, then re-run `npm run generate:registry` and confirm the output.

Architecture, verified consumer testing, and known follow-ups:
[`architecture/shadcn-distribution.md`](architecture/shadcn-distribution.md).

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
- [ ] Own diff reviewed before committing

---

## Where to read next

| Document | What it covers |
|---|---|
| [`../README.md`](../README.md) | Project overview, component inventory, site features |
| [`project-status.md`](project-status.md) | Current status, inventory, open gaps — the volatile state |
| [`architecture/source-of-truth.md`](architecture/source-of-truth.md) | How conflicting claims are resolved |
| [`architecture/token-source-of-truth.md`](architecture/token-source-of-truth.md) | Token layering and parity labels |
| [`architecture/shadcn-distribution.md`](architecture/shadcn-distribution.md) | Registry and distribution layer |
| [`architecture/gradient-foundation.md`](architecture/gradient-foundation.md) | Stable-v1 Gradient contract |
| [`architecture/browser-interaction-testing.md`](architecture/browser-interaction-testing.md) | Browser testing approach |
| [`architecture/versioning.md`](architecture/versioning.md) | Versioning policy |

The `docs/architecture/` directory also holds per-component notes — for
example Table, Calendar, Form Field, Combobox, Data Table, and File Upload.
Read the note for the component you are working on before changing it.

### AI-assisted contributions

If you are working with an AI coding agent, follow the agent guidelines in
[`../AGENTS.md`](../AGENTS.md) in addition to this guide. Human contributors
do not need to read it to work in this repository.
