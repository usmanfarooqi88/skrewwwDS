# Contributing to Skrewww

This is the contribution and Git-safety guide for the Skrewww repository.

**Local setup and system overview** live in
[`getting-started.md`](getting-started.md). Read that first if you are new.

Current status and open gaps:
[`project-status.md`](project-status.md).

---

## Scope discipline

- Audit the relevant implementation, tests, and docs before editing.
- Make the smallest change that satisfies the task.
- Do not refactor unrelated code, tokens, or APIs “while you are there.”
- Preserve public component APIs unless changing them is the explicit goal.
- Preserve component maturity: platform version and per-component Beta/Stable
  status are independent — do not blanket-promote components.

---

## Source of truth

Summarized rules (full detail:
[`architecture/source-of-truth.md`](architecture/source-of-truth.md)):

- **Registry** (`lib/component-registry*.ts`) is canonical for component
  inventory, status, and public metadata.
- **Figma** is authoritative for approved visual/component behavior only when
  live Figma MCP (or archived verified metadata) has been inspected. Never
  invent node IDs, variable IDs, colors, or parity claims.
- **React** owns runtime semantics, keyboard/focus behavior, and the public
  TypeScript API.
- **Accessibility may intentionally diverge from Figma.** Document the
  decision; do not silently “normalize” either side.
- Classify differences: parity gap, intentional non-parity, or deferred scope —
  do not treat every mismatch as a bug.

---

## Implementation workflow

1. Find the registry entry and current React implementation.
2. Inspect Figma masters/tokens when the work is parity-related.
3. Classify parity vs intentional non-parity before coding.
4. Implement narrowly (component + tests + required docs/registry metadata).
5. Prefer semantic/component tokens over hardcoded values.
6. Run focused verification, then widen to appropriate full gates.
7. Inspect the full diff; stage only intended files.

Detailed steps:
[`getting-started.md` — Working on a component](getting-started.md#working-on-a-component).

---

## Testing expectations

- Prefer focused unit/browser tests for the area you changed.
- Run `lint`, `typecheck`, and `npm test` before proposing a merge when code
  changed.
- Run Playwright when the change is visually or interaction-observable.
  For full-suite confidence, use `--workers=1`
  (see [Getting Started — Testing](getting-started.md#testing-and-verification)).
- Run `npm run build` when registry generation, app routes, or production
  output may be affected.
- Never claim a gate passed if it failed, timed out, or did not run.
- Do not raise the ESLint warning ceiling casually; the current
  `--max-warnings 26` budget is already fully used.

Commands and when to widen:
[`getting-started.md` — Testing and verification](getting-started.md#testing-and-verification).

---

## Selective staging

- Review `git status` and the full diff before staging.
- Stage **only** the files that belong to the change.
- **Do not** use `git add .` or `git add -A` for release-sensitive or
  multi-concern work.
- **Do not** stage generated `public/r/` manifests (gitignored build output).
- **Do not** stage secrets (`.env.local`, credentials, tokens).
- Confirm unrelated files are not included before committing.

---

## Generated and ignored artifacts

Never hand-edit or force-add:

- `public/r/`
- `.next/`, `.next-playwright/`
- `*.tsbuildinfo`
- `test-results/`, `playwright-report/`, `coverage/`

Change registry **source** and regenerate with
`npm run generate:registry` (also runs during `npm run build`).

---

## Commits, tags, and history

- Commit only after the verification you claim has actually been run.
- Prefer clear, scoped commit messages (what/why), matching recent history.
- Do **not** force-push, amend shared history, or rewrite published commits
  unless an explicit project process requires it and is approved.
- Release tags (for example `v1.0.0`) must point at an **explicitly verified**
  commit — never retarget a published tag to a newer hotfix without a deliberate
  versioning decision.
- Platform version bumps and per-component status promotions are separate
  decisions (see [`architecture/versioning.md`](architecture/versioning.md)).

---

## Accessibility and intentional non-parity

- Prefer native HTML semantics when they fit the interaction model.
- Document intentional React overrides (for example accessibility contrast
  decisions, or APIs deferred relative to Figma).
- Do not copy inaccessible Figma values into React for the sake of parity.

Examples of intentional non-parity are summarized in
[`getting-started.md` — Figma and React](getting-started.md#figma-and-react-responsibilities).

---

## Pull requests

If you open a PR:

- Keep the change set reviewable and on-topic.
- State what was verified (commands run).
- Call out intentional non-parity or deferred scope.
- Link registry/docs updates when public metadata changed.

---

## AI-assisted contributions

If you use an AI coding agent in this repository, also follow
[`../AGENTS.md`](../AGENTS.md). Human contributors can work without reading it.
