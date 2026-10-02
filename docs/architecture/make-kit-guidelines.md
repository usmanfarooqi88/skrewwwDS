# Make Kit guidelines (MK-2B)

**Status:** compiler and setup contract implemented (MK-2B); the package is published (MK-2C, now
`@skrewww/react@0.1.0-beta.2`) and the October 2026 Figma libraries are published. **No Make Kit exists yet.**
Repository preparation for assembly (MK-2D) is done and verified; creating the kit is a manual Figma Make UI step —
see "Assembly readiness (MK-2D)" at the end.

## What this is

A deterministic compiler that turns canonical Skrewww metadata into the
*guidelines* a future Figma Make Kit would carry, plus one short hand-written
setup file. It is **not a source of truth**: it is a compiled projection, like
the Agent contracts it reads.

```
canonical registry ──► Agent contracts + system contract + recipes ─┐
package.json + package entry (real public exports) ─────────────────┼─► Make guideline compiler ─► make-kit/dist/
styles/tokens.css (Shape/Surface modes) ────────────────────────────┤        (pure, deterministic)
make-kit/setup.md (the only hand-written file, copied verbatim) ────┘
```

## Generated vs manual

| File (in `make-kit/dist/`) | Kind | Fed by |
|---|---|---|
| `guidelines/components/<slug>.md` (one per package component) | generated | Agent contract (summary, guidance, API props, behavior, tokens, relationships, status, accessibility level, Figma *availability*) + the package entry's public exports |
| `guidelines/system.md` | generated | system contract (principles, never-invent, naming, tokens, Shape/Surface policy), modes derived from `styles/tokens.css`, status census from contracts, three small authored policy lists (see below) |
| `guidelines/accessibility.md` | generated | system contract `accessibilityBaseline`, contracts' `accessibilityLevel`, recipes' composition-level notes |
| `guidelines/composition.md` | generated | authored recipes whose required components are all in the package |
| `guidelines/Guidelines.md` | generated | overview/router; lists files and components |
| `guidelines/setup.md` | **manual** | `make-kit/setup.md`, copied verbatim and validated |
| `manifest.json` | generated | package surface, components, exports, modes, provenance |

`make-kit/setup.md` holds only Make/Vite environment setup (stylesheet import,
React baseline, Shape/Surface attributes on `<html>`, the Dialog portal rule,
routing, fonts, Figma boundary). The compiler **rejects** a setup file that
contains a component API table, restates a canonical component fact, hard-codes
the package version, contains forbidden content, or omits required topics.

The only authored text inside the compiler is in `lib/make-kit/policy.ts`: source
precedence, the Figma boundary and status rules. Each statement names the
canonical document it restates, and a test checks that document still contains
the anchor phrase.

## npm imports are derived, not maintained

`@skrewww/react` imports come from the **actual** package surface, never from a
registry field or hand-written path: package name, version, peers and the
`./styles.css` specifier from `packages/react/package.json`; public export names
(including compound exports such as `DialogContent`) from the same barrel
statements the package entry re-exports (`readBarrelExportsByModule` in
`lib/react-package/pilot-entry.ts`). If an export disappears, compilation fails.
`npm run check:make-guidelines -- --verify-dist` additionally requires every
promised export to exist in the **built** `packages/react/dist`.

Agent contracts describe the root component's props only; compound parts are
listed from the package entry and the guideline says their props are not modeled
there. No Agent schema was changed.

## Status and Shape/Surface

Status is read from the registry/contracts and a mismatch fails the build. If
the package later includes Beta components the output carries `beta`
automatically. Shape and Surface values come from the token stylesheet. Per-
component mode support is **not** machine-readable today, so the guidelines say
so; the compiler fails if a contract ever starts declaring shape/surface fields,
so guidance cannot go stale silently.

## Figma boundary

Figma references in the guidelines are optional reference metadata (availability
and "verified reference recorded" only — no node ids, file keys or snapshot
payloads). Captured Figma snapshots are not included and are not authority.
Live Figma access is never required, and the compiler makes no Figma or network
call. React owns runtime API and semantics; Figma owns visual behavior where
verified. Canonical prose containing a Figma node id fails validation.

## Output policy, provenance, commands

- **Generated and gitignored** (`make-kit/dist/`), like `public/agent/`. Committing it
  would put a commit SHA inside committed output.
- **Deterministic:** guideline files carry no commit data and are byte-identical
  for unchanged inputs across commits. `manifest.json` records
  `sourceGitSha` / `sourceGitCommitTimestamp` (same convention as the Agent
  contracts), the contract/registry/Agent Kit versions, and a SHA-256 digest of
  all guideline files.
- `npm run build:make-guidelines` writes the output.
- `npm run check:make-guidelines` compiles twice (byte-identical), validates
  package/contract/status/export mapping, and, if `make-kit/dist` exists,
  requires it to match a fresh compile. No network, no Figma, no writes.
  `-- --verify-dist` also checks the built package. It runs in the main CI job and
  in the package workflow.

## What MK-2B does not do

It does not publish `@skrewww/react`, create or publish a Make Kit, touch Figma,
expand the package beyond its 8-component pilot, add charts or React 18, change
component status or any Shape/Surface value, or start AG-1C. Deferred: MK-2C
(publication), MK-2D (kit assembly and verification), Figma library
publication/admin confirmation, React 18, package expansion, CSS class naming.

## Assembly readiness (MK-2D, 2026-10-03)

**Verdict: ready for manual Make Kit assembly.** Nothing in this repository blocks the kit; the one remaining step cannot be
automated with the available tooling.

**Old blockers.** "Publish `@skrewww/react`" — cleared (beta.2 public, exact-version install verified from the registry).
"Confirm/publish the chosen Figma library" — cleared: the Pro and Free libraries were published in the October 2026 release
(owner-confirmed), and the first kit needs no attached library (decision below). Plan eligibility could not be checked from
here; Figma documents kits as available to Full seats on paid plans, and the Skrewww workspace is a Pro-tier team with a Full seat.

**Revalidated.** `build:react-package`, `build:make-guidelines`, `check:make-guidelines` and `check:make-guidelines -- --verify-dist` pass:
14 files, deterministic, no network or Figma access, manifest package `@skrewww/react` `0.1.0-beta.2` (ESM, peers `react` and
`react-dom` `^19.2.0`, stylesheet `@skrewww/react/styles.css`; the public package's one runtime dependency is
`@phosphor-icons/react`), 8 components all `stable`, 17 root exports (Button, Card, Dialog + 8 compound parts, FormField, Link, Spinner,
TextInput, ValidationMessage, SkrewwwRouterProvider), Shape `sharp|rounded|pill|squircle` and Surface `flat|gradient|glass` from the
token stylesheet, `guidelines/setup.md` byte-identical to `make-kit/setup.md`. The generated prose contains no Figma file key, node id
or snapshot payload (only statements that snapshots are not included); the 16 import statements in the guidelines use only real
package-root exports and no deep imports. The public npm package matches the manifest (version, peers, exports, `sideEffects` CSS).

### Figma library decision (recommendation)

No earlier decision exists. **Recommendation: attach no Figma library to the first kit** (package + guidelines only).
- The npm package is self-contained: `styles.css` carries tokens, Foundation and component styles, so Make renders Skrewww without a library.
- The package is an 8-component pilot; either library exposes far more (Free 23 components, Pro 52). Attaching one invites Make to compose
  Figma-only components (Tabs, Select, Combobox, Search Field, Split Button…) that are **not** in npm, which the guidelines forbid implying.
- Free cannot represent two package components (Form Field and Validation Message exist in Pro only); Pro is the paid product. Figma
  documents kits as published to the owner's team or organization (not publicly), so Pro would not leak publicly, but it would still add
  paid assets and Figma-only surface for no rendering benefit.
- Revisit (Free first) when the package surface grows to cover the library. This is a recommendation for the owner to confirm in the UI,
  not a durable rule.

### Make capability matrix

Sources: Figma Help "Get started with Make kits", "Write design system guidelines for Make kits", "Bring your design system package to a
Make kit" (checked 2026-10-03). The available Figma tooling creates and edits Design/FigJam/Slides files and reads libraries; it has no Make
Kit action.

| Capability | Class | Notes |
|---|---|---|
| Compile the guideline payload | AUTOMATABLE (done) | `npm run build:make-guidelines`, deterministic |
| Create a Make Kit | MANUAL | Make file → Settings → Create a kit (documented UI flow; no API documented) |
| Add the npm package | MANUAL | "Assemble your kit" modal; public npm packages are supported |
| Pin an exact package version | MANUAL, UNVERIFIED | Figma's docs do not describe version selection; the owner must enter `0.1.0-beta.2` explicitly. `latest` is still `0.1.0-beta.1`, so a default would install the wrong version |
| Attach a published library | MANUAL (not used) | Figma supports importing variables and styles; not recommended for kit 1 |
| Add guidelines | MANUAL | Markdown files in the kit's `guidelines/` folder with an entry file (`Guidelines.md`); upload/import mechanics are not documented |
| Starter code / environment | MANUAL | Follow `guidelines/setup.md` (Vite, React 19.2) |
| Test the kit | MANUAL | prompt Make to build, in the UI |
| Publish / share | MANUAL | published to the owner's team or organization |
| API creation or CI assembly | UNAVAILABLE | none documented |

### Assembly payload and manual steps

The kit receives the generated `make-kit/dist/guidelines/` tree **unmodified** — Figma's expected layout (a `guidelines/` folder with
`Guidelines.md`, `setup.md`, `components/`) already matches, and Figma sets no file-count or size limit, so no packaging layer is needed:

```
guidelines/Guidelines.md  system.md  accessibility.md  composition.md  setup.md
guidelines/components/{button,link,card,text-input,form-field,validation-message,spinner,dialog}.md
```

plus one npm dependency, **exactly `@skrewww/react@0.1.0-beta.2`**, and no attached library. `manifest.json` is a verification artifact
(digest, provenance) and is not uploaded. Steps for the owner: `npm run build:react-package && npm run build:make-guidelines` at the
verified commit; open a Make file → Settings → Create a kit → "Assemble your kit"; add `@skrewww/react` at exactly `0.1.0-beta.2`
(confirm the resulting kit `package.json` shows the exact version, not a tag or range); add the 13 guideline files with the same
folder structure; test with the scenarios below; publish to the team.

### Validation status

No Make environment was available, so the kit guidance itself is **NOT_TESTABLE** here and nothing was hand-corrected into a pass.
Package-level behavior was verified against the real public `0.1.0-beta.2` in a clean Vite + React 19 consumer (41/41): Button and Link
render real anchors with no provider, Button token height, Card, Form Field and Text Input label/description/error wiring, assertive
Validation Message, Spinner, Shape and Surface computed behavior, Dialog portal / focus / Escape / mode inheritance from `<html>`, router
provider behavior and no console errors. Scenarios to run in Make after assembly: Button (action, link, Shape/Surface), form composition
(FormField + TextInput + ValidationMessage, beta.2 spacing 4px / 8px), Card with a Button, Dialog, routing (native anchors by default),
accessibility adherence. Classify each PASS / PASS_WITH_GUIDANCE_LIMITATION / FAIL_PACKAGE / FAIL_GUIDELINE / FAIL_MAKE_ENVIRONMENT and
do not fix generated output by hand.

**Figma boundary.** Guidelines state only that a verified Figma reference exists; they never claim a Figma-only component is in npm.
No pixel parity is claimed and no Figma file was changed.
