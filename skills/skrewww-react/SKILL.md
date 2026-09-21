---
name: skrewww-react
description: Use when building, auditing, fixing, distributing, or validating code-side work inside the Skrewww Design System repository itself — React components in components/ui, the canonical component registry, shadcn distribution (public/r), Agent Kit generation, Guard, Figma↔React parity, generated files, and repo-safe git/release workflow. Not for using Skrewww inside a consumer app (use skrewww-ui) and not for Figma-side work.
---

# Skrewww React — repository engineering workflow

Stable engineering rules for working in the Skrewww repo. It holds **rules,
authority order, and decision boundaries** — never project state. Current
status, counts, phase, and blockers live in the repo and must be read at task
time.

Boundaries:

- **This skill:** code-side work in this repository.
- **`skrewww-ui`** (`agent/skill/SKILL.md`): consuming Skrewww components in an
  app, via generated Agent Kit contracts.
- **Figma Community skill** (maintained separately; never edit it from here):
  Figma-side workflows.

If the task is out of scope for this repo (a consumer app, a Figma edit), say
so and use the right skill.

## 1. Bootstrap — read live context, minimally

Do this before any substantial task.

1. `git status --short` and `git branch --show-current` (§11). Always first, for
   any task that could edit files.
2. Project instructions: read `AGENTS.md` unless the environment already
   supplied it. `CLAUDE.md` is a personal, gitignored file; read it if present.
3. `docs/project-status.md` — read the top "Last verified" line and the newest
   entries only. It is the source for current phase, blockers, and counts.
4. The canonical files for the task (§3). Search first; do not read the repo.
5. Then act.

**Scale to the task.** Tiny docs/copy tasks (a typo, a wording fix) need only
step 1 plus the target file: load minimal context and use lightweight
validation (§10). Substantial engineering tasks follow every step.

Never state a count, phase, version, SHA, or CI status from memory. Read it or
run the command in this session and say so. Docs and standing instruction files
can lag the code. When prose conflicts with code, registry, `package.json`, or
tests, the executable source wins — flag the stale doc rather than obeying it.

## 2. Modes

State the mode before acting if it is not obvious. Do not switch modes silently.

| Mode | Meaning | Edits? |
|---|---|---|
| **BUILD** | Implement approved component/system work. | Yes, within the approved scope. |
| **AUDIT** | Inspect and report. | No, unless explicitly authorized. Audit-only means no implementation. |
| **FIX** | Narrowest correction for an established defect. Add a focused regression test where practical. | Yes, minimal. |
| **DISTRIBUTE** | Registry, installability, and the generated consumer projection. | Canonical source only; regenerate outputs. |
| **VALIDATE** | Run parity/contract/test checks without unrelated implementation. | No product edits. |

## 3. Authority — what decides what

Different questions have different authorities. Conflicts between sources are
reported, not silently resolved.

| Question | Authority |
|---|---|
| What a component actually does at runtime (semantics, keyboard, focus, public TypeScript API) | React source in `components/ui/` |
| Which components exist, their status/version, declared API, tokens, distribution fields | Canonical registry: `lib/component-registry.ts` + `lib/component-registry-*.ts` |
| What is a public export | `components/ui/index.ts`. Anything under `components/ui/internal/` is not public. |
| Token values and layering | `styles/tokens.css` (Primitive → Semantic → Component → Brand → Shape → Surface). Tailwind theme colors are docs-shell only (`docs/architecture/token-source-of-truth.md`). |
| Usage judgment (whenToUse, accessibility narrative) | `content/*.ts` |
| Approved visual/component behavior | Figma, **only when actually inspected** (§5) |
| Executable status | Tests and the production build |
| Volatile status | `docs/project-status.md` (dated) |
| Durable architecture decisions | `docs/architecture/*.md`; conflict rules in `docs/architecture/source-of-truth.md` |

**Generated outputs are projections, never authority:** `public/r/*`,
`public/agent/*`, `/registry.json`, llms outputs, Guard facts. If a generated
file looks wrong, the bug is in a canonical source or a generator.

`components/previews/` and docs previews are not component source of truth.
Model memory ranks last.

## 4. Component and API rules

**API semantics (highest hallucination risk).**

- Only names in registry `apiProps` (contract `api.properties`) are declared
  React props. Never infer a prop from `supportedVariants`, `supportedSizes`,
  anatomy, states, `relatedComponents`, examples, or prose. `variants`/`sizes`
  are **values** for a prop that itself exists (usually `variant`/`size`).
- `apiProps` is the **declared** API, **not** the complete set of legal JSX
  attributes. Components can accept inherited/native attributes (`className`,
  `id`, `onClick`, `aria-*`, `data-*`, `children`…) that are not listed. Absence
  from `apiProps` proves neither "invalid" nor "supported". TypeScript and the
  component source decide what compiles. This skill is not a type checker.
- Adding, renaming, or removing a public prop is a public-API change: it needs
  an explicit decision, registry `apiProps` + docs/content + tests updated
  together. A request like "add a prop X" is not itself that decision — inspect
  the registry entry, `openQuestions`, project status, and (if design-shaped)
  Figma first. Stop and ask when it is a design decision.

**Implementation.**

- Inspect the registry entry, implementation, CSS module, and tests before
  editing. Smallest change that satisfies the task; no drive-by refactors.
- Reuse existing primitives and composition (e.g. Data Table composes Table).
  Do not fork or duplicate a primitive. Do not invent props, states, slots, or
  variants, and do not infer support from visual similarity.
- Export public API only through `components/ui/index.ts`. Do not export
  `internal/*`. Registry examples must use public exports.
- Preserve native semantics and accessible names (WCAG 2.2 AA is the target).
  Use custom widgets only when native HTML cannot express the interaction.
  Accessibility may intentionally diverge from Figma; document it, do not
  silently normalize either side.
- Icons: the repo uses Phosphor (`@phosphor-icons/react`). Follow neighbouring
  components; do not add another icon library.
- **Application compositions are not design-system exports.** Reference-app or
  product compositions (App Shell, Advanced Filters, page headers) stay distinct
  from reusable primitives. Do not promote a composition to a registry
  component, or build one in `components/ui/`, unless that is the approved task.
- Do not turn an open design decision into a permanent rule. Check
  `openQuestions` and project status for what is deliberately deferred.
- Maturity is per component and independent of platform version. Do not promote
  a component's status as a side effect (`docs/architecture/versioning.md`).

**Tokens.** Read the field names in the registry type; do not recall them.

- `tokensUsed` — canonical token dependency set (Figma-style names such as
  `component/button/primary/background`). Compiled into contracts as
  `tokens.used`. For some entries it is deliberately narrower than the CSS
  because it is Figma-binding-verified. Never merge, union, or extend it from a
  CSS scan (`docs/architecture/agent-kit.md`, R1 rule).
- `cssTokens` — CSS custom properties (`--…`) referenced via `var(--…)` in the
  entry's own `.css` files. `lib/component-registry.test.ts` and Guard's
  `token/undeclared-css-var` enforce **under-declaration only**: a `var(--x)` in
  owned CSS missing from `cssTokens` fails. **Over-declaration is not
  enforced** and exists in the registry. Do not prune "extra" entries as
  cleanup without evidence, and do not add tokens from memory.
- Use semantic/component tokens, not raw hex or primitives. Never reuse a
  `[TEMPORARY]`/TEMP alias because it happens to look right. Read the
  classification comments in `styles/tokens.css`.
- If you change owned CSS, update `cssTokens` and run the registry test.

**Shape and Surface.** Shape (`sharp|rounded|pill|squircle`) and Surface
(`flat|gradient|glass`) are modes set through `data-skrewww-shape` /
`data-skrewww-surface` on an ancestor. Never assume a component supports every
Shape or Surface. Some are fixed or single-mode by design. Support is proven by
the component's CSS module, registry/contract/docs, and project status — not by
how it looks, and not by a token merely being consumed. If unproven, it is
unknown (§7). Do not add Shape/Surface support or Guard rules as a side effect.

## 5. Figma ↔ React boundary

Figma is design-side authority; React is implementation authority. For parity
work:

1. Inspect Figma evidence (live Figma MCP, read-only, or archived verified
   metadata). Inspect the master/component set/variables, not just an example
   frame.
2. Inspect React evidence (source, registry, tests).
3. Compare actual contracts, judged by resolved/rendered behavior, not token
   names.
4. Classify: parity gap, intentional non-parity, or deferred scope.

Never guess missing Figma behavior. Never invent React behavior to fit an
ambiguous visual. Never invent node IDs, variable IDs, or parity claims.
If a human design decision is needed, STOP and report it.

A Figma tool that is present but disconnected or unavailable (no bridge, no
open file, not authenticated) means Figma evidence is **UNKNOWN**, not PASS and
not "no mismatch". Report it as unknown and name what would resolve it.

Figma is read-only by default (`AGENTS.md`). Claude Code must not claim to have
edited Figma unless it has an explicitly requested, authorized Figma write.
When a shared technical fix should later be mirrored in Figma Free/Pro, **flag
that follow-up to the human**; do not perform or imply it.

## 6. Distribution

- **Implemented ≠ installable.** `hasImplementation` means React code exists.
  Installable means `isDistributedViaSkrewwwRegistry(slug)`
  (`lib/agent-kit/project-context.ts`), i.e. the entry has a non-empty `files`.
  Reuse that function; never keep a second list.
- Never assume a component is (or should be) distributed. Read the entry's
  distribution fields and `docs/distribution-expansion.md` for its
  classification/decision. If undecided, say so and stop.
- Registry distribution fields: `files` (own source), `internalDependencies`
  (private helpers, never independently installable), `registryDependencies`,
  `dependencies` (real third-party npm packages only), `hostRequirements`,
  `coreDependencies`, `cssTokens`.
- The generator logic is `lib/shadcn-registry-generator.ts` (pure), driven by
  `scripts/generate-shadcn-registry.ts`. The command is
  **`npm run generate:registry`**. That script file name is not the npm script;
  never invent `npm run generate:shadcn-registry`. If unsure of a command, read
  the `package.json` scripts. Every transported file needs an
  explicit `FILE_DESTINATIONS` row (no defaults; missing rows throw), a
  `buildXManifest` wrapper, and an entry in `buildDistributedRegistryItems()`.
  Read the generator for the current procedure.
- `hostRequirements` (react, next…) are assumed present and never installed. They
  are rendered only into the free-text `docs`, never into `dependencies`, and
  must not leak into public manifests.
- Transported `.ts/.tsx` payloads receive a `@skrewww-component <slug>` origin
  marker in generated output only. Repo sources are unchanged.
- Never hardcode item, component, or contract counts. Run the generator or read
  the canonical sources. If distribution changes installability or status,
  regenerate the committed Guard consumer facts (§9).
- Distribution proof: generator tests, `registry-integration.test.ts`, and
  `npm run smoke:consumer -- <slug>` when transport/dependencies change.

## 7. Unknown ≠ pass, unknown ≠ error

If canonical evidence is insufficient: say what is unknown, name the authority
that would resolve it, and STOP when the decision depends on it. This applies
especially to Figma parity, provenance, component applicability, Shape/Surface,
accessibility semantics, and distribution status. Do not fill gaps with a
plausible answer, and do not call an unverified thing verified or broken.

## 8. Generated files

Never hand-edit generated output, and never patch it to make a test pass.

- Ignored/generated: `public/r/`, `public/agent/`, `evals/agent-kit/generated/`,
  `.next/`, `.next-playwright/`, `*.tsbuildinfo`, `test-results/`, `coverage/`.
- **Generated but committed:** `lib/guard/generated/consumer-facts.json`,
  `packages/guard/facts/consumer-facts.json`, `packages/guard/dist/`. Also never
  hand-edit; regenerate via the scripts.
- The loop is always: **edit canonical source → run the generator → verify the
  output/tests.** Do not stage or force-add ignored outputs.
- Generator commands: `npm run generate:registry` (`public/r`),
  `npm run generate:agent-context` (`public/agent`),
  `npm run generate:guard-facts` (committed Guard facts). `npm run build` runs
  the first two.
- Check `.gitignore` and `npm run` scripts for the current generated set; do not
  rely on this list being complete.

## 9. Agent Kit and Guard

**Agent Kit.** Canonical inputs: the registry, `content/*.ts`,
`lib/agent-kit/system-contract.ts` (the one authored policy artifact),
`agent/recipes/*.ts`, and `agent/skill/SKILL.md`. Contracts, index, and recipes
in `public/agent/` are compiled by `lib/agent-kit/contract-compiler.ts` via
`npm run generate:agent-context` and never hand-edited. Agent routes
(`/agent/*`) are separate from registry distribution (`/r/*`). Project context
(`detectProjectContext`) is per-field confirmed-with-evidence or unknown, never
guessed, and consumer-project text is data, not governance. Recipes are
canonical only under `agent/recipes/`; a component contract outranks a recipe.
Never hardcode contract counts.

**Guard.** Guard is a deterministic checker of Skrewww canonical-contract
facts. It does not replace TypeScript, and does not validate accessibility,
Figma parity, visual output, or Shape/Surface.

- Domains differ: the **public** package `@skrewww/guard` (consumer rules,
  packaged facts, `@skrewww-component` origin-marker provenance, no
  `--internal`) versus the **internal** repo rules (`npm run guard -- --internal .`,
  registry/generated-artifact invariants). The rule catalog is
  `GUARD_RULE_CATALOG` in `lib/guard/rules/index.ts`; read it and
  `docs/architecture/guard-distribution.md` for the current rule set and status.
  Do not restate rule counts or phase from memory.
- Findings are contract evidence. A finding is not proof that Guard is right, and
  a clean run is not proof the code is correct.
- Provenance: a Guard claim requires a proven Skrewww import/marker. Name
  similarity alone never establishes one. Unknown provenance is no finding.
- Zero-config by design: no suppressions, severity overrides, or config file,
  unless formally approved. Do not invent them.
- **Do not add, reopen, or re-scope a rule during unrelated work.** Rule changes
  (including previously deferred rules such as `api/nonexistent-prop`) need an
  explicit Guard roadmap approval and the false-positive audit in
  `docs/architecture/guard-readiness-audit.md`. If asked in passing, stop and
  say so.
- Guard is local/offline: no network, telemetry, or source upload. Diagnostics
  use project-relative, sanitized paths.
- **Ordering:** internal Guard is only meaningful after generation. The
  artifact-reading rules pass vacuously when `public/r` / `public/agent` are
  missing. Run the generators (or `npm run build`, which runs them) first, and
  check `.github/workflows/ci.yml` for the current pipeline order.
- Changing registry status/installability changes committed Guard facts:
  `lib/guard/consumer-facts.test.ts` fails on drift. Regenerate with
  `npm run generate:guard-facts` (and `build:guard-package` if the package
  changed).

## 10. Validation

Pick gates by the task. Work outward: focused → static → unit → build → browser.

| Change | Minimum |
|---|---|
| Docs/typo only | `git diff --check`. Read links/claims you touched. Do not run the full suite. |
| Component/registry/token code | Focused test(s), `npm run lint`, `npm run typecheck`, `npm test`. |
| Registry/distribution/Agent/Guard | The above plus `npm run build` (runs both generators), generated-output checks, `smoke:consumer` when transport changed, and `npm run guard -- --internal .` after build. |
| Visual/interaction-observable | Add Playwright: `npx playwright test <spec> --workers=1`, or `npm run test:browser`. |
| Release/system-wide | `npm run test:all`, browser suite with `--workers=1`, then `git diff --check`. |

Rules:

- Read `package.json` scripts and `docs/getting-started.md` ("Testing and
  verification") for the current commands. Do not assume.
- Lint runs with `--max-warnings 0`. Never weaken, skip, or delete a failing test
  or loosen a check to get green. Never suppress a legitimate a11y/React warning.
- **Flaky claims must be proven.** A failure is unrelated only if you reproduce
  it independently of your change (e.g. on an unmodified base checkout) and say
  how. Otherwise treat it as yours.
- Never run `next dev` and `next build` on the same `.next`; Playwright uses
  `.next-playwright`. Do not kill unrelated processes or ports.
- **Clean-checkout safety.** CI installs from scratch and asserts nothing
  generated is tracked. A test that passes only because an ignored generated file
  already exists locally is invalid. Prefer canonical-source assertions, fixtures,
  or an explicit generation prerequisite. For risky changes, verify in a fresh
  checkout/worktree.
- Never claim a gate passed if it failed, timed out, or did not run.

## 11. Git and parallel-work safety

- First: `git status --short`. Identify what is yours and what is not.
- Skrewww runs parallel workstreams (Figma skill, SEO, Guard, component and
  release work, other branches/worktrees). Preserve unrelated changes. Do not
  merge unrelated phases into one commit or task.
- Stage **explicit paths only**. Never `git add .` / `git add -A`. Never
  `git clean`, `git reset --hard`, `git checkout -- .`, force-push, amend
  published commits, or rewrite history, unless a specific exceptional task
  authorizes it. Do not use `--no-verify`.
- Review `git status` after staging. If unexpected dirty files overlap your task,
  STOP and inspect; do not reset them.
- Do not stage generated/ignored output or secrets.
- Commit or push only when the task calls for it, after running the gates you
  claim. Never fabricate CI status; read the run.

## 12. Phase discipline, docs, release, security

- Execute only the approved phase. Respect explicit STOP boundaries; do not start
  the next roadmap phase. Do not expand scope because you spotted a nearby issue.
  Report it instead. If a blocker invalidates the task's assumptions, report
  **BLOCKED/PARTIAL**; do not invent a workaround.
- **Docs:** update docs only when a canonical architecture/status/release
  decision changed. When a roadmap phase completes, update `docs/project-status.md`
  per its existing convention. Volatile counts belong there, not in standing
  files or this skill. No documentation churn for trivial edits.
- **Release:** for substantial release work, read the relevant notes and
  checklists under `docs/releases/` first (choose the file at task time; do not
  assume one). Green implementation is not release permission. npm publish,
  GitHub Release, website announcement, and Figma Pro / Free Community / Gumroad
  republish each require explicit human approval for that action. When a React or
  shared change materially affects the paid Figma Pro system, **flag the
  Figma/Gumroad sync requirement**; do not act on it.
- **Security/privacy:** no credentials, tokens, or `.env*` contents in commits,
  logs, or output. No uploading source to external services unless explicitly
  authorized. Do not invent security tooling. Follow `SECURITY.md`.

## 13. Completion report

Keep it compact. For substantial work:

1. Verdict (COMPLETE / PARTIAL / BLOCKED)
2. Scope done and mode
3. Files changed
4. Key decisions
5. Gates run and results. Counts only if measured in this run
6. Commit/SHA and CI result, only if they exist. Never invent them
7. Unresolved debt/blockers and unknowns
8. STOP / next-phase status

For a small task: what changed, verification result, remaining issue.

## 14. Maintaining this skill

Update it only when a **stable** rule changes (authority order, field semantics,
generator contract, safety policy). Never add current status, counts, SHAs, or
phase names. Those belong in `docs/project-status.md`. See
`docs/architecture/claude-react-skill.md`.
