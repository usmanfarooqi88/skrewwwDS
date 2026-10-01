# Make Kit guidelines (MK-2B)

**Status:** compiler and setup contract implemented. **No Make Kit exists** and
nothing is published. Assembly of an actual kit (MK-2D) is blocked on confirming
and publishing the chosen Figma library and on npm publication of
`@skrewww/react` (MK-2C).

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
