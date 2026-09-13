# Project status

Last verified: **2026-09-13** (OS-1 Security Gate — PASSED; OS-1 Open Source Launch ready to resume from the visibility change)

## 2026-09-13 — OS-1 Open Source Launch (PAUSED before visibility change)

Full audit trail: [`docs/open-source-readiness.md`](open-source-readiness.md).
(OS-0's own dated entry was not added to this file at the time — its result
is recorded here and in that document, which remains the canonical detail
source; no separate retroactive OS-0 entry is being added to avoid
duplicating the same record twice.)

**OS-0 (prior commits `8ffd233`, `da593ab`): READY FOR OS-1**, all three
flagged human decisions now resolved — historical personal paths in Git
history accepted (no history rewrite), the Pro Figma file key accepted
conditional on Figma Pro sharing staying restricted (**HUMAN CONFIRMATION
REQUIRED** — not independently re-verified via Figma API/MCP), and
feedback/security resolved as GitHub Issues + GitHub Private Vulnerability
Reporting with no invented email address.

**OS-1 execution (this pass, commits `e160f36` and this entry):**

- **Canonical domain cleanup** — resolved the three-way `skrewww.com` /
  `skrewww.dev` / `skrewww-ds.vercel.app` inconsistency OS-0 flagged.
  `skrewww.com` is the single confirmed live domain everywhere now:
  `lib/site-config.ts`'s `PRODUCTION_FALLBACK_ORIGIN`, `lib/project-status-facts.ts`,
  `.env.example`, README, `docs/architecture/source-of-truth.md`,
  `docs/architecture/shadcn-distribution.md`, both root instruction files,
  and the two pinned test assertions in `lib/project-configuration.test.ts`.
  Dated historical audit records intentionally left untouched.
- **GitHub pre-launch settings audited and recorded**: CI (`.github/workflows/ci.yml`)
  had already run successfully on the OS-0 push before this pass began.
  License now GitHub-detected as MIT. Homepage still the old Vercel URL,
  topics still empty, branch protection and secret scanning both confirmed
  unavailable while private (verified via API — not assumed) — all deferred
  to the actual launch since they require public visibility.
- **Dependabot vulnerability alerts + automated security fixes enabled**
  (previously off) — this is a real, functional repository setting, not
  documentation.
- **Created the missing `agent-kit` GitHub label** the Agent Kit issue
  template already referenced but that didn't exist.
- **Local gates**: lint/typecheck clean, full Vitest 987/987, clean build,
  both generators clean from a deleted state, `git diff --check` clean.

**Launch paused — new blocker found, not previously knowable.** Enabling
Dependabot alerts surfaced 20 open advisories: **2 critical unauthenticated
RCE in the pinned Next.js `16.2.10`** (Image Optimization API via AVIF; a
Windows-hosted-server path), plus 10 high and 8 moderate — mostly further
Next.js CVEs (SSRF in Server Actions/rewrites, cache confusion, DoS), with a
handful in `sharp`, `js-yaml`, `browserslist`, `nanoid`, and Vitest's mocker
(dev-only). Upgrading Next.js is out of scope for an open-source-readiness
task and was judged too risky to do untested immediately before a public
launch. **Human decision: pause OS-1, fix Next.js in a separate task, then
resume.**

**The repository visibility change was NOT performed — it remains PRIVATE.**
Nothing after it in the launch sequence (post-public security settings,
branch protection, repository metadata, Issues/feedback activation, README
final pass, release/changelog, public smoke tests) was executed, since all
of it depends on visibility having changed.

**OS-1 Open Source Launch — PAUSED, not complete.** Next step: a focused
Next.js security-upgrade task, then resume OS-1 from Part 8 (the visibility
change) using the now-complete Parts 1–7 prep.

## 2026-09-13 — OS-1 Security Gate (Next.js security remediation) — PASSED

Full audit trail: [`docs/open-source-readiness.md`](open-source-readiness.md#security-gate-resolved-next-js-upgraded-1626-1316-3-5).
This is the "focused Next.js security-upgrade task" the entry above deferred
to. Scope was intentionally narrow: fix the security blocker only, no
visibility change, no unrelated upgrades.

**Advisory verification (before touching any package file):** confirmed via
GitHub's Security Advisory API for `vercel/next.js` that `16.3.3` is the
authoritative patched floor for both Critical RCE advisories, and via npm
registry `dist-tags`/`versions` that `16.3.5` was the current stable
(non-preview) 16.x release at execution time — not merely the oldest patched
version, and not Dependabot's suggested branch taken on faith.

**Change made:** `next` `16.2.10 → ^16.3.5` in `package.json` (single line).
`npm install`'s normal resolution naturally bumped Next's own bundled
`sharp` (0.34.5→0.35.4) and all `@next/swc-*`/`@swc/helpers` platform
packages in `package-lock.json` — no direct action on `sharp`, no
opportunistic unrelated upgrades. React/react-dom untouched (`^19.2.7`); the
chosen Next.js version did not require a React bump.

**Remaining-finding adjudication (per the "don't auto-waive HIGH findings"
rule):** after the Next.js bump, `nanoid` (HIGH, production-scope, via
`postcss`), `baseline-browser-mapping` (MODERATE, production-scope, pulled
in directly by `next` itself), `browserslist`/`js-yaml` (HIGH, dev-only),
and `vitest`/`@vitest/mocker` (MODERATE, dev-only, a direct devDependency
already among the original 20 flagged packages) all had a same-major patched
version already inside the range their parent package had declared — each
applied via plain `npm update <pkg>`, zero further `package.json` changes.

**Result: `npm audit` = 0 critical / 0 high / 0 moderate / 0 low, full tree
and `--omit=dev` production scope alike.** Both original Critical Next.js
RCE advisories confirmed resolved. Dependabot alerts and automated security
fixes remain enabled (not disabled to make the launch look clean).

**Full re-validation, all clean:** lint, typecheck, Vitest 987/987,
production build (all expected public outputs present: `/agent/*`, `/r/*`,
`/agent-kit`, `/registry.json`, `/llms.txt`, `/sitemap.xml`), Playwright
376/376 (one full-worker-run timeout flake confirmed non-reproducing in
isolation and in a reduced-worker full run — machine CPU contention, not a
Next.js regression), `smoke:consumer` 13/13, and a `next start` HTTP smoke
13/13 (all expected 200s, safe 404s on invalid contract/recipe/traversal
paths, correct `next/image` behavior). One pre-existing, non-blocking
deprecation warning (`app/opengraph-image.tsx`'s edge runtime, new in Next
16.3.x) left untouched — no speculative edits, build still succeeds.

**Verdict: OS-1 SECURITY GATE PASSED. Repository visibility unchanged
(still PRIVATE) — that step is explicitly reserved for the next task.**
OS-1 Open Source Launch = CURRENT / READY TO RESUME from Part 8 (the
visibility change), using the now-complete Parts 1–7 prep plus this
resolved security blocker.

## 2026-09-13 — Skrewww Agent Kit AK-6 (Public Beta)

Productization and release readiness only — the V3 freeze behavior
(`08fc020fede99d6d97df49126f5f4efb081547d9`) is confirmed byte-for-byte
unchanged (`git diff 08fc020 HEAD -- agent/skill/SKILL.md` empty both at
session start and at close); `lib/agent-kit/contract-schema.ts` untouched.
**Beta version: `0.1.0-beta.1`** (`lib/agent-kit/beta-version.ts` — new,
standalone, not embedded in any generated contract JSON, so it carries no
schema risk).

### Readiness audit — what was actually missing

- **Public docs page:** none existed. Added `/agent-kit` (`app/agent-kit/page.tsx`,
  server component, real `Metadata`) covering all 14 required
  onboarding questions on one focused page — matches the existing
  `/foundations` one-page-many-sections pattern rather than a new
  multi-page tree.
- **Skill distribution for external consumers:** `npm run install:agent-skill`
  only works from inside this source repository — audited and confirmed
  not a public Beta install path. **Fixed the real gap**: `scripts/generate-agent-context.ts`
  now also writes `public/agent/skill/SKILL.md`, byte-identical to
  canonical, served exactly like every other `/agent/*` artifact (static
  file, no route handler). An external consumer can now `GET` the real
  Skill with no access to this repo.
- **Discovery:** added to `components/SidebarNav.tsx` (between Foundations
  and Changelog), `lib/sitemap-data.ts` (`/agent-kit`, `/agent/index.json`),
  and a new `## Agent Kit (Beta)` section in `lib/llms-content.ts`'s
  `buildLlmsTxt()` (six lines: overview URL, index/system/contract-pattern/
  recipe-index/Skill URLs, one policy line) — verified it does **not**
  enumerate all 47 contracts.
- **Feedback path: genuine, unresolved gap — reported, not invented.**
  No GitHub Issues link, contact form, or support email exists anywhere
  in current site code/content; `siteConfig.repositoryUrl`/`figmaUrl` are
  both explicitly `undefined`. The actual git remote
  (`github.com/usmanfarooqi88/skrewwwDS`) is confirmed **private**
  (`gh repo view` → `"visibility":"PRIVATE"`) — publishing it as a public
  channel would both mislead users and disclose a private repo, so it was
  **not** used. The `/agent-kit` page states this honestly instead of
  linking anywhere. **Needs a human decision** (make the repo public with
  Issues enabled, or supply a real support email/form) before Beta has a
  working feedback loop.

### Public Beta positioning (exact wording used)

"Skrewww Agent Kit helps AI coding agents understand and use the Skrewww
Design System from current machine-readable contracts instead of relying
on model memory." Evaluation claim, stated with its caveats every time:
14-case internal Beta evaluation, isolated per case, **35 → 1** hard
errors (Agent Kit off → on), zero invented components/props/installability/
maturity claims on; Cursor Task subagents, vendor model identifier not
exposed; explicitly disclaimed as small/internal, not a universal
benchmark. The `identity-icon-button` residual case is **not** named
publicly (internal eval jargon) — covered by the general Known
Limitations framing instead.

### MCP / Guard — reconfirmed, no new decision

No custom Skrewww MCP server (unchanged from AK-3). No Skrewww Guard —
explicitly stated as "not included in Beta" on the public page and in
`docs/architecture/agent-kit.md`.

### Files added

`app/agent-kit/page.tsx`, `lib/agent-kit/beta-version.ts`,
`lib/agent-kit/beta-release.test.ts` (12 tests: discoverability,
version-model separation, Skill public-projection byte-identity,
private-repo-URL non-leak, release-checklist presence).

### Files changed

`scripts/generate-agent-context.ts` (+Skill public projection step),
`components/SidebarNav.tsx`, `lib/sitemap-data.ts`, `lib/llms-content.ts`,
`content/changelog.ts` (new Beta entry, existing `new`/`improved` item
types only, no internal jargon/SHAs), `README.md`,
`lib/agent-kit/retrieval.test.ts` (+1 assertion covering the new Skill
projection, added to its existing single regeneration rather than a
second concurrent one), `docs/architecture/agent-kit.md` (full AK-6
section + a reusable release checklist), `docs/project-status.md` (this
entry).

**One real bug found and fixed during this pass, not a pre-existing
one:** the first version of `lib/agent-kit/beta-release.test.ts` called
its own `generate-agent-context.ts` regeneration, which raced under
Vitest's parallel file execution against `retrieval.test.ts`'s own
regeneration and intermittently corrupted a concurrent file read
(reproduced twice, `SyntaxError: Unexpected token, not valid JSON` from a
source-map parser choking on a torn read). Fixed by moving the Skill
byte-identity assertion into `retrieval.test.ts`'s single existing
regeneration and making `beta-release.test.ts`'s check a pure read of
whatever's already on disk. Reproduced clean across 3 consecutive runs
after the fix.

### Verified

Focused: `lib/agent-kit/beta-release.test.ts` 12/12; full
`lib/agent-kit/` 126/126 (8 files), stable across 3 consecutive runs.
Lint/typecheck clean. **Full Vitest: 987/987** (105 files — 974 baseline
+ 13 net-new). Full production build green, `/agent-kit` statically
prerendered. Generators (`generate:agent-context`, `generate:registry`)
both succeed from a fully deleted `public/agent/`+`public/r/` state — 57
files under `public/agent/` (2 index + 47 contracts + 5 recipe + 2
feature-kit + 1 Skill), 9 under `public/r/` (unchanged). External
consumer smoke (`npm run smoke:consumer`) re-run clean. Public HTTP
smoke against a real `next start` production server — every documented
Beta interface: `/agent-kit`, `/agent/index.json`, `/agent/system.json`,
`/agent/contracts/button.json`, `/agent/recipes/index.json` +
`/agent/recipes/validated-text-field.json`, `/agent/feature-kits/index.json`
+ `/agent/feature-kits/forms-and-feedback.json`, `/agent/skill/SKILL.md`,
`/r/button.json` → 200; an unknown contract, an unknown Recipe, and a
path-traversal-shaped request → 404. `/agent-kit` page content verified
live (Beta badge, version string, Getting Started, `@skrewww`, Feedback
section all present; no `localhost` leak). `git diff --check` clean.

Full architecture record: [`docs/architecture/agent-kit.md`](architecture/agent-kit.md#ak-6--public-beta).

**Skrewww Agent Kit AK-6 — COMPLETE.** One open item requiring a human
decision: the Beta feedback path (see above). **OS-0 Open Source Readiness
is NEXT** (see the OS-0 entry above, which also resolves the feedback-path
plan). Skrewww Guard moves behind the open-source track — see the phase
roadmap under "Active roadmap".

## 2026-09-13 — Skrewww Agent Kit AK-5 (Evaluations) — COMPLETE

Provider-neutral OFF/ON evaluation harness with **fully isolated** paired
runs. AK-5 is **COMPLETE**. AK-6 Public Beta is **NEXT, NOT STARTED**.

### History (preserved)

| Run | ID | Result |
|-----|-----|--------|
| v1 | `ak5-v1-aa26a17-cursor-inherit` | Strong scores; ON batched 2×7 — methodology fail. Report SHA `7d8ec34c…` |
| v2 | `ak5-v2-32a908b-cursor-inherit-isolated` | Isolation OK; gate fail `inventedApis=1` (`empty-state.variant`). Report SHA `55e2c92b…` |
| v3 | `ak5-v3-08fc020-cursor-inherit-isolated` | Isolation OK; **gate PASSED**. Report SHA `87710e00…` |

### Remediation cause (v2 → v3)

Descriptive `api.variants` was misread as a React `variant` prop. Canonical
Skill + system policy now state: **`api.properties` = React prop allow-list**;
`api.variants`/guidance/scenarios do not create props. Scorer: forbidden
claims only from structured assertions + usage-shaped implementation.
A11y case: token groups (`label` + `controlid`) instead of one literal sentence.

### V3 freeze / execution

- **Freeze SHA:** `08fc020fede99d6d97df49126f5f4efb081547d9`
- **Execution:** Cursor Task subagents; model **not exposed**; setting `inherit`
- **Isolation:** 14/14 OFF + 14/14 ON = **28 unique** Task IDs

**OFF:** inventedComponents 6 · inventedApis 13 · installability 4 ·
maturity 3 · context 0 · authority 2 · a11y 1 · forbiddenClaims 0 ·
missingRequired 6 · **totalHardErrors 35** · meanAggregate 65.36

**ON:** inventedComponents 0 · inventedApis 0 · installability 0 ·
maturity 0 · context 0 · authority 0 · a11y 0 · forbiddenClaims 0 ·
missingRequired 1 · **totalHardErrors 1** · meanAggregate 99.29

**Deltas (ON−OFF):** totalHardErrors **−34**; inventedApis **−13**;
inventedComponents **−6**; a11y **−1**.

**ON residual:** `identity-icon-button` missing `button` (refused due to
Icon Button guidance gap) — Skill/product naming weakness; **does not**
violate invent/install/maturity/authority zeros.

**Release gate:** **PASSED**. AK-6 may start when scheduled; **not started**.

**Verified:** focused Skill/scorer tests 37/37; adapter byte-identical;
lint/typecheck clean; Vitest **974/974** (104 files); build green;
generators green; scorer determinism; `git diff --check` clean.

### v2 isolated result (retained)

See run `ak5-v2-32a908b-cursor-inherit-isolated`. Gate **FAILED** on
`ON inventedApis=1`. Artifacts preserved; not overwritten.

### Original v1 baseline (retained)

Run `ak5-v1-aa26a17-cursor-inherit`. ON was **2×7 batched** (methodology
defect). Report SHA-256
`7d8ec34cbf983efdf418eb070491e55e33cc28e65530910417a711ab0dd845c1`.

## 2026-09-13 — Skrewww Agent Kit AK-4 (Recipes / Feature Kits)

Adds composition guidance **above** component contracts without reopening
the AK-1 component-contract schema (no slots/composition/forbiddenPatterns
on contracts).

**Architecture:** authored Recipes in `agent/recipes/*.ts`; schema
`lib/agent-kit/recipe-schema.ts`; pure compiler
`lib/agent-kit/recipe-compiler.ts`. Generated under
`public/agent/recipes/` and `public/agent/feature-kits/` via the existing
`generate:agent-context` script (same deterministic git provenance).

**Authority:** component contract > Recipe > model memory. Recipes
reference slugs only; explicit API refs validated against current
contracts; maturity (`allStable`/`containsBeta`) and installability
derived (AK-3 `isDistributedViaSkrewwwRegistry`) — never authored.

**Pilot Recipes (4, status Beta):**

| ID | Goal | Required | Maturity |
|----|------|----------|----------|
| `validated-text-field` | Labeled field + inline error | form-field, text-input, validation-message | allStable |
| `destructive-confirmation` | Modal destructive confirm | dialog, button | allStable |
| `loading-and-inline-feedback` | Skeleton / Spinner / Alert | skeleton, spinner, alert | allStable |
| `search-no-results` | Search + empty outcome | search-field, empty-state | containsBeta |

**Feature Kit (1):** `forms-and-feedback` → first three Recipe IDs only
(thin index; no copied Recipe bodies).

**Skill:** Recipe discovery workflow + contract-over-Recipe precedence;
still ≤500 lines; no embedded Recipe catalog; adapter remains
byte-identical via `install:agent-skill`.

**Out of scope (confirmed):** AK-5 eval harness, Guard, custom MCP,
`/r/registry.json`, shadcn catalog expansion, React/Figma/API changes.

**Verified:** lint/typecheck clean; Vitest **954/954** (103 files); production
`npm run build` regenerates contracts + Recipes + Feature Kits; Skill 324
lines (≤500); adapter byte-identical. `/r/*` unchanged (9 manifests).

**Skrewww Agent Kit AK-4 — COMPLETE.** AK-5 (Evaluations) completed in a
later same-day entry above.

## 2026-09-13 — Skrewww Agent Kit AK-3 (Registry / Retrieval + Project Context)

Connects Agent Kit's existing knowledge (AK-1/AK-2) to a real consumer
project: public static retrieval, a proven relationship to the existing
shadcn distribution registry, and pure project-context detection. No
second registry, no second component catalog, no custom Skrewww MCP
server.

**Retrieval:** `generate:agent-context` is now wired into `npm run build`
(`generate:registry && generate:agent-context && next build`), and
`public/agent/` is served exactly like `public/r/` already is — static
files under `public/`, zero route handlers, zero dynamic lookup code.
Verified live against a real production build + `next start`:
`/agent/index.json`, `/agent/system.json`, `/agent/contracts/button.json`
→ 200; `/agent/contracts/not-a-real-slug.json` and a path-traversal-shaped
request → 404, by construction (no file exists), not by application
logic. `lib/agent-kit/retrieval.test.ts` (11 tests) automates this:
artifact-tree completeness, the absence of any `app/agent/*` route,
leak-guard on the real bytes on disk, and byte-for-byte determinism after
a full delete-and-regenerate.

**`/agent` vs `/r`:** kept as genuinely separate schemas — a real contract
has no `$schema`/transport fields, a real shadcn manifest has no
`guidance`/`tokens` fields (`lib/agent-kit/registry-integration.test.ts`).
9 shadcn manifests (unchanged — AK-3 did not expand distribution
coverage, asserted by test).

**MCP: no custom server, existing shadcn tooling confirmed working.**
`npx shadcn mcp init --client <tool>` configures the client to run
shadcn's own `npx shadcn@latest mcp` server — live-verified via a real
JSON-RPC stdio handshake (`initialize` → `serverInfo.name: "shadcn"`;
`tools/list` → `get_project_registries`, `list_items_in_registries`,
`view_items_in_registries`, `get_add_command_for_items`, etc., all
resolved against whatever `components.json` declares, `@skrewww`
included). One genuine gap found and documented, not fixed:
`list_items_in_registries`/`search_items_in_registries` need a
`<base>/r/registry.json` index Skrewww doesn't currently publish
(live error: `Request to https://skrewww.com/r/registry.json...failed`);
item-level `view`/`add`-equivalent tools need no index and already work,
matching the pre-existing `npx shadcn view/add @skrewww/<name>` path.
Publishing an index is distribution-surface work, deliberately deferred,
not built here.

**Project context:** `lib/agent-kit/project-context.ts`'s pure
`detectProjectContext(files)` — every field `{status:"confirmed",
value, source}` or `{status:"unknown"}`, no guessed state. Evidence-only:
framework/package manager from real `package.json`/lockfile; `@skrewww`
registry config read verbatim from `components.json`; installed
components detected by matching a registry entry's own `files` list
(reuses canonical data, no parallel list); Foundation install/import from
real file presence/reference; Shape/Surface mode only from a literal
`data-skrewww-shape`/`data-skrewww-surface` string; project instruction
files (`AGENTS.md`/`CLAUDE.md`) reported by presence only, ranked below
Skrewww system rules in trust order. No new persisted config format, no
CLI. `lib/agent-kit/project-context.test.ts` (20 tests) covers all four
required fixture classes: configured consumer, partial consumer (unknowns
stay unknown), non-Skrewww project (no fabricated Skrewww state), and
hostile/untrusted project text (a README with prompt-injection-shaped
text and fabricated API claims influences zero fields — one documented
limitation: a literal `data-skrewww-*` string matches even inside a
comment, which is exactly why project context is never itself a security
boundary).

**Skill:** `agent/skill/SKILL.md` grew from 206 to 279 lines (budget 500)
— added a "Project context" section (the evidence table above) and an
"Installation vs. implementation" section (never state or imply an
install command for a non-distributed component; the shadcn MCP note).
Reinstalled to `.claude/skills/skrewww-ui/SKILL.md`, byte-identity
re-verified.

**Files added:** `lib/agent-kit/project-context-schema.ts`,
`lib/agent-kit/project-context.ts`, `lib/agent-kit/project-context.test.ts`,
`lib/agent-kit/retrieval.test.ts`, `lib/agent-kit/registry-integration.test.ts`.
**Files changed:** `agent/skill/SKILL.md`, `package.json` (`build` script
only), `lib/project-configuration.test.ts` (updated a pre-existing
build-script string pin to match the legitimate new pre-step).

**Verified:** 933/933 Vitest (102 files, +5 new — 72 of which are
`lib/agent-kit/*`). Lint/typecheck clean. Two full production builds
(before and after the Skill edits) both pass, both correctly regenerate
`public/agent/` from a deleted state. External-consumer smoke
(`npm run smoke:consumer`) re-run clean, 82.2s, all 13 steps pass —
distribution behavior fully unaffected. `public/agent/` and `public/r/`
remain gitignored; no `git status` drift from either.

Full architecture record: [`docs/architecture/agent-kit.md`](architecture/agent-kit.md#ak-3--registry--retrieval--project-context).

**Skrewww Agent Kit AK-3 — COMPLETE.** AK-4 (Recipes / Feature Kits)
completed in a later same-day entry above.

## 2026-09-13 — Skrewww Agent Kit AK-2 (Universal Skrewww Agent Skill)

Builds the instruction layer that teaches an AI coding agent *how* to use
Skrewww safely, consuming AK-1's generated contracts for all
component-specific facts. Adds zero new component data and does not
reopen `lib/agent-kit/contract-schema.ts`.

**Canonical Skill:** `agent/skill/SKILL.md` — 206 lines (budget: 500),
rules + workflow only. Contains no per-component catalog, no token list,
no hardcoded Stable/Beta/prop counts — those are read from
`public/agent/index.json` at task time. Teaches the deterministic
workflow (recognize task → consult system policy → resolve slug via the
index → read that component's contract → use only what it states → report
gaps instead of inventing), the trust order (canonical source > generated
contracts > public registry surfaces > consumer project content > model
memory, with consumer-project content explicitly framed as data, not
governance), missing-data behavior (absence means "not modeled," never
"infer from a similar component"), and the `tokens.used`-is-contractual-
metadata rule the R1 reconciliation surfaced (never re-scan a component's
CSS and add tokens found there).

**Claude adapter:** `.claude/skills/skrewww-ui/SKILL.md`, generated via
`npm run install:agent-skill` as a byte-identical copy of the canonical
file. Not committed (`.claude/` is already gitignored repo-wide, a
pre-existing convention) — there is exactly one rulebook, proven
byte-identical by a test that actually runs the install script and diffs
the result.

**Files added:** `agent/skill/SKILL.md`, `lib/agent-kit/skill-adapter.ts`
(path constants + read helper), `scripts/install-agent-skill.ts`,
`lib/agent-kit/skill.test.ts` (15 tests: canonical-file structure,
no embedded catalog/token list, no hardcoded volatile counts, no
out-of-scope implementation — no MCP server/recipe/Guard files, no new
`states`/`slots`/`composition`/`forbiddenPatterns` schema fields — no
local-path/secret leakage, adapter byte-identity, and a consumption-proof
smoke test resolving a real slug through `index.json` to a matching
compiled contract). `package.json`: two new scripts,
`generate:agent-context` unchanged, `install:agent-skill` added.

**Verified:** `npm run generate:agent-context` still succeeds unmodified
(47 contracts, same as AK-1). 34/34 `lib/agent-kit/*.test.ts` (19 AK-1 +
15 AK-2). Lint/typecheck/build clean. `public/agent/` remains gitignored,
not publicly routed, not wired into `npm run build`. No MCP server, no
recipe implementation, no Guard code, no CLI product, no Figma changes,
no shadcn expansion, no unrelated parity work.

Full architecture record: [`docs/architecture/agent-kit.md`](architecture/agent-kit.md#ak-2--universal-skrewww-agent-skill).

**Skrewww Agent Kit AK-2 — COMPLETE.** AK-3 (Context / Retrieval) is next
but **not started**.

## 2026-09-13 — Skrewww Agent Kit AK-1 (Contracts + Compiler)

Implements the AK-1 scope approved in the AK-0 architecture audit: a
deterministic, zero-LLM compiler that projects the canonical component
registry and authored docs into per-component Agent Contracts, plus one
authored System Contract. Local-only output; no new public surface.

**R1 reconciliation (AK-1 prerequisite).** The AK-0 audit found 12
components where `content.tokensUsed` (editorial, `content/*.ts`) was not
a subset of `registry.tokensUsed` (canonical, `lib/component-registry*.ts`)
— the precondition Agent Kit contract generation requires. Each was traced
against its actual CSS module and classified before correcting the stale
source (never both, never a union): `badge` was formatting-only (a
compound `"A → B"` string split into two entries already present in
registry); `file-upload`, `empty-state`, `popover`, `link` had registry
gaps for genuinely-consumed tokens (added); `toast`, `accordion`,
`list-item`, `dialog`, `drawer` had stale content claims not consumed by
current implementation, corrected to the real tokens already in registry
(`dialog`/`drawer` specifically: both render `box-shadow: none`, so the
content-side `shadow-blur/N`/`shadow-color/N` references were never real —
confirmed absent from `styles/tokens.css` entirely, not merely omitted).
`avatar` and `pagination` surfaced a sharper distinction: their registry
`tokensUsed` arrays are locked by existing tests as **verified Figma
bindings**, deliberately narrower than "every CSS custom property the
component's stylesheet references" — an initial CSS-first pass incorrectly
tried to widen both, caught by the pre-existing
`lib/component-registry.test.ts` assertions, and corrected by narrowing
content instead. Final result: 47/47 joinable components pass
`content.tokensUsed ⊆ registry.tokensUsed`. `docs/architecture/agent-kit.md`
records the rule and this distinction as the canonical reference going
forward.

**AK-1 implementation.**

| Artifact | Purpose |
|---|---|
| `lib/agent-kit/contract-schema.ts` | `ComponentAgentContract` / `SystemAgentContract` / `AgentContractIndex` types; `CANONICAL_AGENT_CONTRACT_SCHEMA_VERSION = "1.0.0"` |
| `lib/agent-kit/contract-compiler.ts` | Pure join/validate/reconcile — throws on join failure or an R1 violation rather than emitting contradictory contracts |
| `lib/agent-kit/contract-compiler.test.ts` | 19 tests: join integrity, R1 guard, token precedence, status/API preservation, sparse-field omission, determinism, leak protection |
| `lib/agent-kit/system-contract.ts` | The one new authored artifact — never/invent rules, token/Shape/Surface policy framing, naming rules |
| `scripts/generate-agent-context.ts` | Writes `public/agent/{index,system,contracts/<slug>}.json`; resolves git SHA + commit timestamp, never wall-clock |

**Verified facts (not a snapshot claim — re-derive from source):** 47
implemented components, 27 Stable / 20 Beta, 263 total API props, 47/47
`ComponentDoc` joins, 0 join failures, 0 detached/invented fields.

**Determinism:** two `npm run generate:agent-context` runs at the same
commit produced byte-for-byte identical output across all 49 generated
files (`diff -r` clean).

**Gates:** lint clean, typecheck clean, 880/880 Vitest (98 files, +1 new),
production build passes, `git diff --check` clean. `/registry.json`,
`/r/*`, the shadcn generator, and `/llms.txt`/`/llms-full.txt` generation
**logic** is fully untouched — `lib/registry-public.ts`,
`lib/shadcn-registry-generator.ts`, and `lib/llms-content.ts` were not
modified. Their **output data** for the tokens the R1 reconciliation
corrected necessarily reflects those corrections (they read
`tokensUsed` straight through from the same canonical registry) — this is
the intended, required effect of fixing stale metadata, not a regression;
verified `/r/*`'s own generated files are byte-identical before/after the
build that also regenerates them, confirming the shadcn layer's own
mechanism produced no incidental drift.

**`public/agent/`** is gitignored (same treatment as `public/r/`), not
wired into `npm run build`, and has no public route — deliberately opt-in
until a real consumer (AK-2 Skill, AK-3 retrieval) exists.

**Scope preserved:** no Figma work, no `states`/Slot/composition modeling,
no Skill, no MCP, no CLI, no Guard, no change to public component APIs.
Full architecture rationale, the R1 rule, and the `avatar`/`pagination`
Figma-binding distinction: [`docs/architecture/agent-kit.md`](architecture/agent-kit.md).

**Skrewww Agent Kit AK-1 — COMPLETE.** AK-2 (Skill) is unblocked but not
started.

## 2026-09-13 — Form Field icon color parity verified (no runtime change)

Targeted audit of the verified Figma contract `component/form-field/icon` →
`semantic/icon/muted` → `color/neutral/400` → `#A0A3AC` against current React.

**Result: already matched — no runtime CSS change required.** Live-rendered
leading/trailing icons on `TextInputControl` resolve `#A0A3AC` (SVG computed
`color` and painted-child `stroke`), verified across Flat/Gradient/Glass.
`--semantic-icon-muted` is declared once and never re-declared per Surface
mode, correctly matching the non-surface-contextual Figma role. New browser
regression coverage locks this: `e2e/form-field-icon.spec.ts`.

**Separate parity debt found (not a color defect):** Form Field's icon
renders 16×16 in the current docs/example path, while the verified Figma
contract is 20×20 (`semantic/icon-size/md`). Deferred — React has no
canonical semantic icon-size CSS layer yet, and the shared `icons.tsx`
path (transported by `/r/button.json`) has distribution blast radius, so a
trivial isolated fix was not safe. `SearchField.tsx`'s `{ sm: 16, md: 20,
lg: 20 }` explicit-size pattern is the template for a future fix.

The historical commit reference `f3c1a02` was checked and does not exist in
this repository — it must not be reused as canonical evidence.

## 2026-09-13 — Figma Presentation V2 campaign closeout (FROZEN)

Live audit + completion pass across the canonical Pro Figma file
(`U6KUuNf7DF4CP9QBOkLSUx`). Free file (`KrQIUWznpBdP0ZuWjOu2e3`) was not
modified this campaign — a Desktop Bridge mis-connection to Free was caught
and corrected before any write occurred.

**Containers & Overlays — V2 complete.** Card and Accordion Item were already
complete; Dialog, Drawer, and Popover were completed this campaign (prior
sessions), each with real attached-instance Anatomy/Content-resilience/Surface
(Flat/Gradient/Glass, mode-switched and verified)/Accessibility blocks, and an
honest Shape-omitted note where radius is bound to a fixed Primitive rather
than the Shape collection. A genuine Title/Close-Icon collision was found and
fixed identically across Dialog and Drawer (Title now `FILL`+`HUG`+
`textTruncation:DISABLED`, wraps rather than truncates, per an explicit
locked correction — Dialog/Drawer/Popover contextual titles WRAP, unlike
compact row labels which truncate). Live-reverified this pass: Dialog
`1124×1884`, Drawer `1044×3536`, Popover `684×1359`, all intact, 0 detached
instances, 0 unresolved collisions. Protected `Native Slots — QA` (`2698:784`)
and `Native Slots` (`2699:910`) untouched.

**Content & Data — V2 complete + cleaned.** Avatar, Divider, Tag, List Item,
Empty State, the Table family (Table Cell, Data Table Column Header, Table
Header/Body Row, Table — composed, no monolithic Data Table master invented),
Tree View, Timeline, and Calendar Day all converted to V2 grammar with real
attached instances. Data Grid and Charts have no canonical component and are
explicitly labeled reference-only. One real canonical defect was found and
fixed: Tree Item's Label was `HUG` inside a `FIXED`-width row, overflowing on
long content — corrected to `FILL` + `ENDING` truncation (compact row label,
correctly distinct from the WRAP rule above). A legacy pre-V2 presentation
frame (407 instances, 0 canonical masters, fully superseded), an abandoned
Table QA instance, an orphaned empty frame, and an orphaned chart data-point
were deleted from the active Pro file after a full pre-cleanup archive
snapshot was taken (`28bittu5TEn0ZrHBRyfwII`). Live-reverified this pass: 11
root children, all classified canonical-active-V2 or active-reference, 0
legacy, 0 unknown, 0 stray, 0 detached instances, 0 unresolved collisions.

**Whole-file QA (Actions, Forms, Navigation, Feedback, Containers & Overlays,
Content & Data).** Live-audited, not rebuilt — these four categories were
already V2-mature going into this campaign and were not part of this
session's build work. Detached-instance scan: 0 detached across 1,574+
instances (Actions 622, Forms 553, Navigation 251, Feedback 148), plus
Containers & Overlays and Content & Data separately verified. Page-root
collision scan: 0 collisions on all six pages. Surface mode-switching
spot-verified on Button (`Surface panel / Flat|Gradient|Glass` genuinely
bound to `VariableCollectionId:2057:10` modes `2057:0/1/2`, not faked).

**Known non-blocking debt — presentation grammar bifurcation.** Two
legitimate V2 grammars coexist: an older topic-first pattern (Icon
configuration → Shape → Surface → State, used by Actions/Button, Forms/Text
Input, Feedback/Alert-Tooltip-Skeleton) and the newer `Examples` (left) /
`Main components` (right) canonical-source-reference pattern (used
throughout Navigation, parts of Forms — Checkbox pure, Select mixed — and all
of this campaign's Containers & Overlays / Content & Data work). Both are
internally consistent and real (not faked); per this campaign's own
instruction not to impose a new grammar late or arbitrarily normalize
intentional differences, no retroactive mass-migration was attempted. Flagged
as a documented follow-up, not a freeze blocker.

**Freeze exit criteria:** all 15 PASS (grammar bifurcation noted as
non-blocking debt under criterion 11, consistent with this file's existing
"PASS WITH DEBT" convention). No P0/P1 presentation issue found. No source
component master was redesigned, mutated, or had a variant/property invented.

**Figma Presentation V2 — FROZEN.** No further open-ended aesthetic polishing;
future Figma presentation edits only when component/system changes require
them. **Skrewww Agent Kit AK-0 (read-only architecture audit) is now
unblocked** — not started this campaign.

## 2026-09-13 — shadcn distribution expansion (Spinner / Divider / Link)

### Architecture — shared token transport

**Choice: extend the existing Foundation transport cut** in `styles/tokens.css`.

Spinner and Divider geometry tokens (`--spinner-size-*`, `--spinner-animation-duration`, `--divider-thickness`, `--divider-color`, `--divider-spacing-*`, `--divider-vertical-min-height`) are shared system infrastructure used by multiple Stable surfaces, not component-private skins. Promoting them above the Foundation boundary lets `/r/foundation.json` deliver them once — no per-component token duplication, deterministic install order via `@skrewww/foundation`, no fake packages.

Link geometry (`--link-*`) is component-owned: declared on `.link` in `link.module.css` so `/r/link.json` transports it without expanding Foundation for Link-only vars. Semantic colors still come from Foundation.

### Link `site-config` decoupling

`components/ui/internal/link-utils.ts` no longer imports `lib/site-config`. Origin is an explicit argument or `globalThis.location?.origin`. Absolute http(s) without origin treats as external (safe for SSR). Docs-site Link / ListItem / Pagination call sites unchanged. Regression: Vitest + generator assert distributed Link graph has no `site-config` string.

### Distribution status

| Metric | Value |
|--------|------:|
| Public `/r/*` items | **9** (was 6) |
| New items | `spinner`, `divider`, `link` |
| Schema | `1.4.0` (unchanged) |

**External consumer proof** (`npm run smoke:consumer`): `spinner`, `divider`, `link`, and composed `spinner-divider-link` — clean install, typecheck, build, no manual repair.

**Remaining Stable not yet distributed (19):** alert, avatar, breadcrumb, calendar-day, checkbox, dialog, pagination, popover, progress-bar, radio, radio-group, search-field, select, skeleton, switch, tabs, textarea, toast, tooltip.

Typical blockers: missing canonical `files` / `registryDependencies` metadata and/or component geometry still below the Foundation cut (colocate in module CSS or promote genuinely shared tokens — same pattern as this batch).

**Exact next batch (recommended):** Batch A — low-dependency Stable primitives once CLI fields + local CSS transport are wired: `skeleton`, `progress-bar`, `avatar`, then `alert` / `toast` if their token cuts are clean. Do **not** start overlays (`dialog`, `popover`, `tooltip`) until Batch A is proven.

No further public architecture approval required for the Foundation-cut / Link-utils pattern established here.

## 2026-09-13 — Icon Size dual-bind repair + Stable-v1 maturity promotion

### Icon Size defect (live Figma)

**Variables (Semantic, Light+Dark identical aliases):**

| Token | ID | Aliases | Resolved px |
|-------|-----|---------|---------------|
| `semantic/icon-size/sm` | `VariableID:2003:3546` | `spacing/16` (`2002:2414`) | 16 |
| `semantic/icon-size/md` | `VariableID:2003:3547` | `spacing/20` (`2002:2415`) | 20 |
| `semantic/icon-size/lg` | `VariableID:2003:3548` | `spacing/24` (`2002:2416`) | 24 |

Scopes: `WIDTH_HEIGHT`. Present in **both Pro and Free**.

**Defect:** Icon `INSTANCE` consumers bound **height only**. Live proof: `setBoundVariable('width')` on an INSTANCE **clears** height (Figma Plugin API limitation — Frames/Components accept true dual width+height; Instances do not).

**Visual impact before repair:** none for current squares (16×16 / 20×20 / 24×24). Issue was **structural** (width unbound → size could drift under resize/overrides).

**Repair (Pro + Free, shared technical fix only):** for every Icon INSTANCE with height → `semantic/icon-size/*`, also bind `minWidth` + `maxWidth` to the **same** variable. Preserves height binding; clamps width to the token.

Verified:

- Pro Actions Button/Icon Button/Link/Split Button: locked
- Pro Forms / Navigation / Feedback / Containers / Content: residual height-only cleared
- Free Actions + Forms + Feedback + Navigation + Containers mirrored
- Fresh Button instances (sm/md/lg, leading+trailing on): locked at 16/20/24
- Icon Button instance-swap (`Icon/DotsThree` → `Icon/Bell`): size lock retained at md 20×20
- No Squircle/Glass/Shape Pro features moved into Free

Canonical record: `lib/icon-size-figma-metadata.ts`

**React:** no code change — React still uses component-local icon dimensions; no CSS `semantic/icon-size` tokens yet (Figma-only structural contract).

### Release sync after Icon Size

| Channel | Sync required? | Why |
|---------|----------------|-----|
| Pro Figma | **Yes — already applied in file** | Structural binding repair on masters/consumers |
| Free Figma | **Yes — already applied in file** | Same shared Semantic tokens + consumer binds |
| Gumroad / Community republish | **Ask before publish** | Shared technical fix is in Free+Pro files; external republish still needs explicit approval |

### Maturity promotion (evidence-based, not blanket)

| Class | Count | Slugs |
|-------|------:|-------|
| **Stable** (`status: stable`, `version: 1.0.0`) | 27 | alert, avatar, breadcrumb, button, calendar-day, card, checkbox, dialog, divider, form-field, link, pagination, popover, progress-bar, radio, radio-group, search-field, select, skeleton, spinner, switch, tabs, text-input, textarea, toast, tooltip, validation-message |
| **Beta** | 20 | accordion, badge, banking-*, bar-chart, calendar-grid, combobox, data-table, date-picker, drawer, empty-state, file-upload, line-chart, list-item, menu, table, tag, timeline, tree-view |
| **Blocked (product invent)** | — | Calendar range Figma variants; Menu selected API invent; separate Icon Button product; Data Table shell master |

**Non-Stable reasons (summary):**

- **calendar-grid / date-picker** — range states React-first · Figma parity pending
- **data-table** — no Figma master; React-ahead MVP
- **menu / combobox** — deferred selection/multi-select scope; intentional API boundaries still open
- **table** — Caption/Footer + Shape mapping still pending within Flat-only Stable-v1 table scope
- **drawer / accordion / empty-state / file-upload / list-item / tag / badge** — openQuestions and/or incomplete docs maturity
- **tree-view / timeline / bar-chart / line-chart** — advanced / example-scoped depth
- **banking-*** — industry pilot, Figma unavailable

**Core library v1.0 Stable release:** **YES for the Stable core (27)** — platform remains `1.0.0`; remaining 20 stay Beta inside the same platform release. Do **not** claim “all 47 Stable”.

## 2026-09-13 — Stable-v1 closeout Phase 1 (Button Layer 3 Glass)

Live re-verification of Paid Figma Button set `2012:7752` against shipped React.

**Result: already complete — no fill/border/blur token rewrite required.**

Live-confirmed (Flat / Glass) on Primary Medium Default/Hover/Pressed and Danger Medium Default/Hover/Pressed/Focused:

| Contract | Live Figma | React |
|----------|------------|-------|
| Primary Default | `#6C4CF2` / Glass 18% | match |
| Primary Hover | `#5638D6` / Glass 24% | match |
| Primary Pressed | `#4229AD` / Glass 30% | match |
| Danger Default | `#E5484D` / Glass 58% | match |
| Danger Hover | `#CC3B37` / Glass 64% | match |
| Danger Pressed | `#B3261E` / Glass 70% | match |
| Focused fill | reuses Default (Danger Focused `2012:7745`) | match |
| Blur | `component/surface/blur` Flat/Gradient `0`, Glass `16` | match |
| Secondary Glass fill | aliases `component/surface/fill` → `#FFFFFF` @ 12% | match |
| Primary/Danger Glass rim | shared 3-stop families (not per-state) | match (135.25deg practical approximation) |

Menu reusable Panel master `Navigation/Menu Panel` `2181:216` still exists with `component/menu/panel-*` + Surface blur — Phase 2 starts from that evidence, not the stale “example-only” claim.

Calendar Day set `2058:2146` still only has Default / Today / Selected / Disabled / Outside. Range states remain **React-first · Figma parity pending**.

Additive this phase:
- Playwright Squircle + Glass rim regression (`e2e/button.spec.ts`) so Squircle clipping cannot silently drop the masked rim.
- Layer 3 Batch C File Upload text assertions updated to live Figma: Empty Message → `semantic/text/secondary`; Error Message → `semantic/text/danger`; icon remains content-muted / icon-danger. Stale assertions still expected Empty title = muted after the earlier File Upload React text parity fix.

## 2026-09-13 — Stable-v1 closeout Phase 2 (Menu Panel master)

READ-ONLY live Figma discovery + fresh-instance Surface validation. **No Figma write required.**

- Master: `Navigation/Menu Panel` `2181:216` (COMPONENT, not example-only)
- Anatomy: single `Items` SLOT (`Items#2757:4`); shell owns surface/border/Gradient overlay/Glass blur; rows own state
- Tokens: `component/menu/panel-surface` `2142:208`, `component/menu/panel-border` `2142:209`, `component/surface/blur` `2057:13`
- Fresh instance Flat/Gradient/Glass: fill `#FFFFFF` / `#FFFFFF` / 12% white; border neutral-200 / neutral-200 / 24% white; blur `0` / `0` / `16`; remained attached
- Dependent instances on Navigation page: 8 attached consumers (including Presentation V2)
- React already aliases `--menu-surface` / `--menu-border` / `--menu-backdrop-filter` (Glass 16px, elevation none); Combobox listbox reuses the same panel shell
- Combobox Listbox Panel `2181:1173` remains the Forms sibling of the same architecture

Stale claim “Menu Surface lives only on an example frame” is obsolete. Phase 2 **CLOSED**.

## 2026-09-13 — Stable-v1 closeout Phase 3 batch (Surface N/A cleanup)

Live Figma re-verification of remaining uncertain Surface participants. Evidence-backed React cleanup only — no new visual direction.

| Component | Figma master | Live Surface finding | React change |
|-----------|--------------|----------------------|--------------|
| Tooltip | `2034:25628` | Fixed `color/neutral/900`; no blur | Removed invented Glass lighten/blur |
| Skeleton | `2034:25640` | Fixed `color/neutral/300`; no blur | Removed invented Gradient/Glass surface rules |
| Tabs | `2024:2849` | Zero fill; no blur | Removed invented Glass tablist fill/blur |
| Breadcrumb Item | `2024:2863` | Default → `component/surface/content-muted`; Hover/Current → `semantic/text/primary` | Default ancestor links now use content-muted (was Link subtle = secondary) |
| Progress Bar | `2034:25546` | Semantic action/feedback fills; no blur | **Surface N/A** (confirmed) |
| Spinner | `2034:25600` | Border/action only; no blur | **Surface N/A** (confirmed) |
| Divider | `2044:26035` | `semantic/border/default` only | **Surface N/A** (confirmed) |

Duplicate Badge vs Alert/Toast tint token names remain non-blocking cleanup (identical values, no rendered drift).

## 2026-09-13 — Stable-v1 closeout Phase 4 + Phase 5

**Phase 4 (parity sweep hygiene):** evidence-backed metadata only — no public API or visual redesign.

- Combobox registry `figmaNodeId` now points at live set `2024:2480` (was discovery start `2002:2365`).
- Search Field master recorded: `Forms/Search Field` `2024:2109` (12 State×Size variants) — `lib/search-field-figma-metadata.ts`.
- Date Picker master recorded: `Forms/Date Picker` `2024:2596` (5 states) — `lib/date-picker-figma-metadata.ts`.
- Remaining intentional / pending (not inventing Figma): Data Table shell, Calendar range variants, MenuItem selected API, separate Icon Button, Chart example-vs-component expansion.

**Phase 5 (Timeline):** public React `Timeline` already exists (`components/ui/Timeline.tsx`, registry, Vitest, `e2e/timeline.spec.ts`) against Figma Item set `2058:2092` / example `2058:2102`. No duplicate implementation. Connector remains positional (last item structurally omits connector — no fake `Last` property).

## 2026-09-13 — Stable-v1 closeout Phase 6 (hardening + RC)

### Exit criteria (explicit)

| ID | Criterion | Result | Evidence |
|----|-----------|--------|----------|
| A | Public API freeze / naming preserved (Search Field, Spinner, Divider, Empty State, Form Field, Accordion, Data Table≠Grid) | **PASS** | Registry APIs unchanged this campaign; no renames |
| B | Layer 1 + Layer 3 Shape/Surface integrity; no critical unresolved token gaps that break shipped contracts | **PASS WITH DEBT** | Button Glass closed Phase 1; Surface N/A cleanup Phase 3; Badge/Alert/Toast duplicate tint names non-blocking; spinner/divider geometry promoted into Foundation for distribution (2026-09-13) |
| C | WCAG 2.2 AA baseline for shipped interactive patterns (keyboard, focus, overlays, forms, disabled, reduced motion) | **PASS WITH DEBT** | Existing unit + Playwright a11y contracts green; no full third-party audit claimed |
| D | Responsive: mobile docs nav, drawer, overflow | **PASS** | `e2e/responsive-nav.spec.ts` + `e2e/sidebar-nav-surface.spec.ts` green 2026-09-13 |
| E | Lint / typecheck / Vitest / Playwright / build / `git diff --check` | **PASS** | Phase gates this campaign; full Playwright re-run in Phase 6 |
| F | Docs / registry / Figma node IDs accuracy for audited masters | **PASS WITH DEBT** | Phases 1–5 metadata updated; stale Menu “no Panel master” prose corrected below |
| G | shadcn `/r/*` distribution valid; `hostRequirements` never public; no metadata leakage | **PASS** | Nine manifests (prior six + spinner, divider, link). Architecture blockers resolved 2026-09-13 — see distribution expansion entry |
| H | Per-component maturity classified with evidence; no blanket Stable promotion | **PASS** | **27 Stable / 20 Beta** (2026-09-13 promotion) |

**Stable-v1 technical readiness:** `STABLE-CORE-READY` (27 Stable · 20 Beta; see Icon Size + maturity promotion entry).

**Not declared:** Free/Pro Community/Gumroad external republish (files already repaired; publish still needs approval).

### Maturity classification (implemented React)

**Stable (registry `status: stable`):** none.

**Beta (all 47):** accordion, alert, avatar, badge, banking-account-card, banking-balance-summary, banking-transaction-row, bar-chart, breadcrumb, button, calendar-day, calendar-grid, card, checkbox, combobox, data-table, date-picker, dialog, divider, drawer, empty-state, file-upload, form-field, line-chart, link, list-item, menu, pagination, popover, progress-bar, radio, radio-group, search-field, select, skeleton, spinner, switch, table, tabs, tag, text-input, textarea, timeline, toast, tooltip, tree-view, validation-message.

**Blocked / deferred (product or Figma invent required — not registry status):**

| Item | Why blocked |
|------|-------------|
| Calendar range Figma variants | Live Day set has no Range Start/End/Middle |
| MenuItem selected / checkable API | Intentional Stable-v1 command model; inventing would be API decision |
| Separate Icon Button Figma/React product | React uses Button + `aria-label`; inventing separate public component needs approval |
| Data Table interaction shell Figma master | React-ahead; do not invent shell |
| Semantic Icon Size dual-bind migration | **Repaired 2026-09-13** — height + minWidth/maxWidth lock on Icon INSTANCEs (Pro+Free) |
| shadcn Spinner/Divider/Link expansion | **Resolved 2026-09-13** — Foundation cut extended; Link decoupled from `site-config`; `/r/*` = 9 |

### Distribution status

Public `/r/*` = **9** (foundation, button, card, text-input, form-field, validation-message, spinner, divider, link). See top-of-file **shadcn distribution expansion** entry for architecture, consumer proof, and next batch.

### Figma Free / Pro / Gumroad sync checklist (do **not** publish yet)

| Channel | Sync required after this campaign? | Why |
|---------|-------------------------------------|-----|
| Pro paid Figma | **Applied in file** — republish needs approval | Icon Size dual-bind repair on masters/consumers |
| Free Community Figma | **Applied in file** — republish needs approval | Same shared Semantic tokens + consumer binds |
| Gumroad | **Ask before new version** | Shared technical fix is in Free+Pro files |

If a future Stable-v1 Figma write changes shared foundations/components, re-evaluate all three channels.

### Known non-blocking debt

- Badge/Alert/Toast duplicate tint token names (identical values)
- Calendar range React-first / Figma parity pending
- Charts remain example-scoped vs rich interactive expansions
- Lint debt: none currently (`--max-warnings 0` green)
- Icon Size dual-bind: **closed 2026-09-13** (see promotion entry)

### Phase 6 product fix (gate failure)

Popover arrow Glass/Flat border assertion failed when floating placement flipped to `top`: `border-*: none` reset collapsed sides to `currentColor` (`#17181B`). Switched to `border-*-width: 0` and placement-aware visible-side color reads in `e2e/popover.spec.ts`.

## 2026-09-11 — Skrewww Agent Kit roadmap entry (PLANNED / GATED)

Documentation-only. No implementation started.

**Skrewww Agent Kit is the next major development initiative after Figma
Presentation V2 completes.** Execution gate: finish Presentation V2 → final
whole-file Presentation QA/freeze → Agent Kit AK-0. **Gate reached
2026-09-13** — see the Figma Presentation V2 campaign closeout entry above
(`Figma Presentation V2 — FROZEN`). Agent Kit AK-0 is now unblocked but has
not been started; it begins only when explicitly started by the user.

**Planned phases (high-level only):**

| Phase | Scope |
|-------|-------|
| AK-0 | Read-only architecture audit |
| AK-1 | Component Contract schema + context compiler |
| AK-2 | Universal Skrewww Agent Skill |
| AK-3 | Registry / MCP integration + project context |
| AK-4 | Recipes / Feature Kits |
| AK-5 | Agent Kit OFF vs ON eval harness |
| AK-6 | Public Beta |

Next major follow-up after Agent Kit Beta: **Skrewww Guard**.

**Locked architecture notes** (decisions only, not implementation design):

- Existing Skrewww registry remains the foundation.
- Custom Skrewww MCP is deferred beyond v0.1; the shadcn-compatible
  registry/MCP path (already proven — see the shadcn distribution layer
  below) is preferred first.
- One portable knowledge core, not separate Claude/Cursor/Codex rulebooks.
- Facts should be generated from canonical Skrewww metadata where possible,
  not hand-authored per surface.
- Agent Skills + adapters are the intended distribution architecture.
- Evals are mandatory before Public Beta.
- n8n is optional future orchestration only.
- Skrewww Guard follows Agent Kit Beta.

**Planning bundle**: detailed Agent Kit research and planning currently
exists locally at
[`docs/skrewww-agent-kit-planning-2026-09-11.zip`](skrewww-agent-kit-planning-2026-09-11.zip)
(untracked, not committed — a local reference bundle only). Consult it when
AK-0 begins; extract and review the selected Markdown files into normal
version-controlled docs only after AK-0 confirms their final placement and
architecture. Do not commit the ZIP itself merely to preserve planning.

## 2026-08-31 — Data Table v1 composition examples

Figma-only. No Data Table shell, no React write, no publish.

- No Content/Data Table master. Basic Table (`2321:1964`) composed unchanged (Flat-only, radius 12).
- Column Header `2805:859` used for sorting. Customer presentation: `Content/Presentation/Data Table` `2491:932`.
- Examples: sorting, mixed static/sortable, optional Checkbox selection, row actions (Icon Button + Menu), Skeleton loading, Empty State, external Pagination, 375px horizontal overflow.
- No Data Table Row required yet. No Gradient/Glass table shell.
- Free deferred until a coherent Table-family port.

## 2026-08-31 — Data Table Column Header

New Figma primitive `Content/Data Table Column Header` `2805:859`.

- Properties: Sort (Unsorted / Ascending / Descending), Align (Start / End), Disabled (False / True), Label (text).
- Sort cycle matches shipped React: none → ascending → descending → none.
- Native-table semantics, not ARIA grid. `DataTableSortHeader` / `useDataTableSort` unchanged.

## 2026-08-31 — Basic Table Native Slots

Figma-only authoring change. React Table API unchanged.

- Basic Table remains Flat-only.
- Rows `INSTANCE_SWAP` → Native Slot `Rows#2791:12`.
- Header/Body Cells `INSTANCE_SWAP` → Native Slots `Cells#2791:0` / `Cells#2791:6`.
- Helper components removed after zero consumers.

## 2026-08-31 — Popover React Surface parity

Figma Containers/Popover `2044:26011` (Content `2044:26006`) is a rich overlay, not a selectable-list shell.

- Card surface + 3-stop Card highlight rim (Dialog `padding-box` / `border-box` pattern).
- No Gradient overlay (canonical Content has only `component/card/surface`).
- No drop shadow (BACKGROUND_BLUR only).
- Glass blur 16 via `--component-surface-backdrop-filter`.
- Arrow uses Card surface/border and does not apply its own blur.
- Padding 12. Radius unchanged (12 in Rounded).
- Menu and Combobox stay simple no-shadow list shells.
- Select and Date Picker keep the prior Popover lock (simple border + elevation + Glass md mix). They do not inherit the rich rim.
- Public APIs and ARIA unchanged.

## 2026-08-31 — Selectable-list panel React parity

Figma Menu Panel `2181:216` and Combobox Listbox `2181:1173` Slot architecture is already **CLOSED**. This React pass is panel-shell parity only.

- Menu `--menu-elevation` is `none` in every Surface mode (no `--popover-elevation`).
- Combobox listbox aliases Menu panel shell tokens (`surface` / `border` / `elevation` / `radius`), not Popover.
- Shared Gradient overlay and Glass blur 16 stay on the panel.
- Rows still have no blur. Option and Menu Item state contracts are unchanged.
- Public APIs unchanged. Popover visual parity is explicitly deferred.

## 2026-08-30 — Combobox option surface parity

Figma option master `2740:554` is established. React option Hover/Active/Selected now reuse the Menu row-highlight Surface contract (`--menu-item-hover-surface` / `component/menu/item-hover`).

- Glass options use 20% white highlight.
- Selected keeps Gradient overlay + Medium 500.
- Active keeps focus ring.
- Panel alone owns Glass blur.
- No API or checkmark changes.
- `semantic/surface/subtle` was not added to Figma.

## 2026-08-30 — Validation Message React text parity

Figma Pro Validation Message semantic-text accessibility is already **CLOSED**. This React pass is text-token parity only. Public API, layout, ARIA, and icons are unchanged.

- **Warning text** aliases warning/800 (`#8A4F00`).
- **Success text** aliases success/700 (`#1F7A4D`).
- **Info text** aliases info/700 (`#1D4ED8`).
- **Error text** stays danger/600 (`#CC3B37`).
- All four types meet normal-text AA on white and elevated (`#F7F7F8`) light field surfaces only.
- Icons are unchanged (Error still untyped `component/validation-message/text`; Warning/Success/Info still `semantic-feedback-*`). Warning icon contrast remains a separate Figma-first task.

## 2026-08-30 — Layer 3 Navigation + Feedback React parity

Figma Navigation + Feedback Surface sweep is already **PASS**. This React pass is Alert-only.

- **Alert description:** `--feedback-{info,success,warning,error}-text` now alias `--semantic-text-secondary` (`#5B5F68`) to match Figma on always-light Alert panels. `--component-surface-content-muted` is unchanged (dismiss, Toast close, other cascade consumers). Titles and type-specific icons are unchanged. Toast still overrides `--feedback-text` to `--semantic-text-primary`.
- **Menu selected:** **API gap — no production change.** `MenuItem` has no `selected` / `aria-selected` contract; existing tests lock that absence. Hover stays overlay-free. Do not invent a Selected API for visual parity.
- **Closed 2026-09-13:** Tooltip Glass, Skeleton Surface, Tabs tablist Glass, and Breadcrumb Default muted-vs-secondary are no longer deferred — React now matches the live Figma Surface N/A / content-muted contracts (see Phase 3 batch above).

## 2026-08-29 — Select keyboard after click-open

Clicking the Select combobox could leave DOM focus on the trigger, so Home/End
(and arrows) did not move between options until a later keyboard-open path
focused an option. The documented contract is unchanged: the combobox opens
the listbox, and Arrow/Home/End move between options. The trigger now keeps
the subsequent click from reclaiming focus, and those keys also work from the
combobox while the listbox is open. Public Select APIs are unchanged.

## 2026-08-29 — Node engine range and install-script policy

Repo hygiene only (no product/API/analytics change):

- `engines.node` is now `>=22.13.0 <23 || >=24 <25`. Supported majors are
  Node **22.13+** (jsdom 29's 22.x floor) and Node **24.x** (current
  Vercel production and local runtime). Node 21 and 23 are not declared
  supported. Node 25+ stays blocked until explicitly validated. Node 20
  was removed as repo-maintenance/security hygiene: it reached upstream
  EOL in April 2026, Vercel still offers 20.x but this repo has no CI or
  other requirement that still needs it, and Next.js 16's `>=20.9.0` floor
  does not force keeping an EOL major.
- `.nvmrc` and `.node-version` pin recommended local Node `24.14.0` (the
  currently verified local version). They already existed and stay
  synchronized; no extra version-manager file was added.
- Install-script audit of the lockfile `hasInstallScript` graph:
  `esbuild@0.28.1` (tsx/vite), `sharp@0.34.5` (optional Next.js image
  optimizer), `unrs-resolver@1.12.2` (eslint-import-resolver-typescript),
  and `fsevents` (chokidar/vite/playwright, Darwin-only). Native binaries
  arrive through optional platform packages. A clean `npm ci --ignore-scripts`
  still loaded and ran esbuild, sharp, and unrs-resolver on darwin-x64.
  **Decision: do not approve those scripts.** Local npm is `11.12.1` and
  has no `allowScripts` / `npm install-scripts` command; adding an allowlist
  would be unsupported config churn.

## 2026-08-29 — Consent-aware GA4 analytics

GA4 (`NEXT_PUBLIC_GA_MEASUREMENT_ID`, via `@next/third-parties/google`) previously
loaded unconditionally whenever configured, with Consent Mode v2 defaults
hard-coded to denied and no way for a visitor to actually grant consent. That
gap is closed:

- `lib/consent.ts` — single canonical persisted consent state
  (`localStorage["skrewww.analyticsConsent.v1"]`, values `"granted"` /
  `"denied"`; anything else — missing, malformed, storage unavailable — reads
  back as `null`/undecided). Read/write never throw.
- `components/analytics/AnalyticsConsentProvider.tsx` — client provider,
  mounted from `AppProviders`. Renders `<GoogleAnalytics>` only once
  `state === "granted"`; before that, the beforeInteractive bootstrap script
  in `app/layout.tsx` still seeds Consent Mode v2 defaults (all denied) but
  makes no network request itself. `allow()`/`decline()` persist the choice
  and push `gtag('consent', 'update', ...)` — only `analytics_storage` ever
  moves; `ad_storage`/`ad_user_data`/`ad_personalization` stay denied
  regardless. `reopen()` lets a returning visitor bring the banner back and
  switch either direction without a reload.
- `components/analytics/AnalyticsConsentBanner.tsx` — non-modal, no focus
  trap, fixed to the viewport bottom, shown only while undecided or
  reopened. A low-emphasis "Analytics preferences" action was added to
  `SidebarNav.tsx` (desktop sidebar + mobile drawer, the only existing
  global nav shell — no new footer was invented) to reopen it later.
- `lib/ga.ts`'s `trackGAEvent()` now reads the same canonical consent state
  on every call and safely no-ops unless it's exactly `"granted"` — the
  named business events (`free_figma_click`, `pro_gumroad_click`, both still
  only wired in `components/HomeHeroCtas.tsx`'s `home_hero` location) never
  fire while undecided or declined.
- Static rendering is unaffected: consent is read client-side, post-hydration
  only, so `/` and other previously-static routes stay statically prerendered
  (verified via `npm run build`'s route table).

**Not a compliance claim.** This ships consent-aware technical behavior only
— gating the GA tag and its events behind an explicit choice, with Basic
Consent Mode semantics. No legal/compliance audit has been performed; this
entry does not assert GDPR, cookie-law, or "privacy compliant" status.

**Verification**: 814 unit tests pass (94 files, +32 from this change),
lint clean at the existing 26-warning ceiling (0 new), typecheck clean,
production build passes, and a focused Playwright suite
(`e2e/analytics-consent.spec.ts`, 13 tests, plus `smoke.spec.ts` and
`pagination.spec.ts` re-verified for regressions) passes with `--workers=1`.

## 2026-08-21 — Developer onboarding documentation

Post-v1 documentation milestone (no runtime/API/token changes):

- Canonical onboarding entry: [`getting-started.md`](getting-started.md)
- Contribution / Git safety: [`contributing.md`](contributing.md) (+ root `CONTRIBUTING.md` pointer)
- README documents the onboarding path and docs map without becoming a full manual

Release tags and platform version history remain in the Skrewww 1.0 readiness
section below; this entry only records the onboarding-doc work.

## 2026-08-21 — Skrewww 1.0 release readiness

Public platform/docs release metadata for **Skrewww Design System 1.0**.

**Gates passed (pre-metadata):**

- Stable-v1 technical readiness: `STABLE-CORE-READY` (27 Stable · 20 Beta; Icon Size dual-bind repaired in Pro+Free)
- Public API freeze: `READY`
- Final pre-v1 release gate: `READY`
- Phosphor consumer dependency transport verified (`@phosphor-icons/react` via ValidationMessage)
- Clean TextInput consumer smoke passed (`npm run smoke:consumer -- text-input`)
- Production origin confirmed: `https://skrewww.com` (`NEXT_PUBLIC_SITE_URL`)
- Live Foundations canonical verified (`https://skrewww.com/foundations`)
- Live `/r/validation-message.json` dependency verified (includes `@phosphor-icons/react`)

**Final gate evidence (pre-metadata baseline):**

| Gate | Result |
|------|--------|
| Unit tests | 769 passed |
| Playwright | 336 passed |
| Lint | 0 errors / 0 warnings |
| Typecheck | pass |
| Build | pass |

**Release model:**

| Identifier | Value |
|------------|-------|
| Platform / `designSystemVersion` | `1.0.0` |
| `documentationVersion` | `1.0.0` |
| Package (`skrewww-docs`) | `1.0.0` |
| Public registry `schemaVersion` | `1.4.0` (unchanged) |
| `CANONICAL_REGISTRY_SCHEMA_VERSION` | `1.0.0` (unchanged) |
| Implemented component statuses | **27 Stable · 20 Beta** (evidence-based promotion 2026-09-13) |
| Supported `/r` install surface | Exactly six: foundation, button, card, text-input, form-field, validation-message |

Platform maturity and individual component maturity are tracked independently. Public framing: *Skrewww 1.0 — platform release with a Stable core. Advanced and parity-pending components remain Beta until explicitly promoted.*

See also: [`docs/architecture/versioning.md`](architecture/versioning.md)

## Documentation preview mode scoping (2026-08-13, additive)

The Button documentation preview no longer writes its Surface and Shape
selection to `<html>`. A reusable `PreviewModeProvider` now owns deterministic
page-local state (Flat/Rounded by default), while `PreviewSandbox` applies the
corresponding data attributes only around component example content. This keeps
all Button example sections synchronized without allowing Squircle or Glass
selectors to restyle documentation Cards, navigation, or other application
chrome, and prevents mode state from leaking across client-side navigation.

This is infrastructure for scoped preview modes, not the final Preview
Inspector UI. Portal-rendered examples still mount to `document.body` through
the existing internal Portal default and therefore sit outside a local sandbox;
a future Inspector pass must provide a documentation-owned portal target or an
equivalent private adapter before applying scoped modes to Dialog, Drawer,
Popover/Menu/Select, Toast, or Tooltip previews. No public component API,
Gradient behavior, Dark mode, or Brand Shape support changed in this correction.
The final right-side Preview Inspector, Search Field icon salience, Calendar
Grid mobile overflow, Dark-mode preview controls, Brand Shape, and the future
Gradient foundation remain separate open work.

See also: [`docs/architecture/source-of-truth.md`](architecture/source-of-truth.md)

## React implementation status

**Verified from code**

| Metric | Value | Source |
|--------|------:|--------|
| Implemented components | 47 | `getImplementedComponentCount()` / `lib/component-registry.ts` |
| Stable | 27 | `status: "stable"` |
| Beta | 20 | `status: "beta"` |
| Registry entries with React | 47 | `hasImplementation: true` |
| Figma-documented components | 63 | `content/` inventory (`lib/data.ts`) |
| Documentation-only (no React) | 16 | Figma docs not in implemented registry set |
| Indexable documentation slugs | 62 | `getIndexableComponentSlugs()` |
| Redirect aliases | 2 | `form-field-wrapper`, `accordion-item` |

### Distribution Model CLI-resolution fields (2026-07-25)

`registry.json`'s schema version bumped to **1.2.0** (additive, backward-compatible) to add five optional CLI-resolution fields to `ComponentRegistryEntry` / `PublicRegistryEntry`, in support of the decided-but-not-yet-built "npx skrewww" distribution model (see [`skrewww-claude-project-instructions.md`](../skrewww-claude-project-instructions.md#distribution-model--decided-target-architecture-2026-07-25)): `dependencies`, `coreDependencies`, `files`, `cssTokens`, `coreVersion`.

**Only Button and Card carry real data**, derived directly from their actual source files (imports, own `.tsx`/`.module.css` files, and every CSS custom property their stylesheet references) — not guessed. `coreVersion` is left unpopulated even on these two, since `@skrewww/core` doesn't exist yet and has no real version to record. At the time this schema shipped (2026-07-25), no Layer 4 (Industry Systems) component existed yet, so no Layer-4 proof-of-concept entry was added then — the Banking pilot (see Layer 4 pilot section below) shipped the same day but after this schema decision, and its three components also do not carry these CLI-resolution fields; they are proof-of-concept-scoped to Button and Card only, not automatically extended to every new component.

**All other 60 registry entries (including the three Banking pilot components) have these five fields absent/undefined.** Populating the full registry against this schema is a separate, not-yet-scheduled pass — do not backfill it with inferred or plausible-sounding values; derive each entry's real `dependencies`/`files`/`cssTokens` from its actual source the same way Button and Card were done.

### `dependencies` semantic correction — schema 1.3.0 → 1.4.0 (2026-08-08)

**`registry.json`'s schema version bumped to 1.4.0.** Unlike the 1.2.0 → 1.3.0 bump (a purely additive new field), this one is a **semantic contract change to an existing field's meaning**, not a JSON-shape change — `PublicRegistryEntry.dependencies` is still `string[] | undefined`, but what it represents has changed:

- **Old meaning (1.2.0–1.3.0):** npm packages directly imported by the component's source, **including host/framework packages** such as React and Next.js. Under this definition, Button's `dependencies: ["react", "next"]` was accurate — its source does import from both.
- **New meaning (1.4.0):** third-party npm packages the distribution/install layer should actually add, **excluding host/framework baseline packages**, which are represented separately in the canonical registry's `hostRequirements` field (see below). Button's `dependencies` is now `[]`, since it has no third-party package need of its own; `react`, `react-dom`, and `next` moved to `hostRequirements` instead.

This was treated as a version-bump-worthy contract change rather than a silent data correction because a consumer relying on the original documented meaning (e.g., "install everything in `dependencies`, including the framework") would now see materially different data under the same field name — the JSON shape never moved, but the externally observable meaning did.

**`hostRequirements` stays canonical-only for now — not exposed in `/registry.json`.** It exists on `ComponentRegistryEntry` (`lib/component-registry.ts`) and is populated for Button (`["react", "react-dom", "next"]`), but is deliberately not added to `PublicRegistryEntry` in this pass, following the same discipline already established for the 1.2.0 fields: wait for at least one more real component to populate it, or an actual distribution consumer to need it, before committing to a public shape. `lib/seo.test.ts` asserts the serialized public registry never contains the string `"hostRequirements"`, guarding against an accidental leak.

**Three version concepts stay independent — do not conflate them:**
- A component's own `version` field (e.g. Button's `"0.1.0-beta"`) — changes when that component's implementation changes.
- `CANONICAL_REGISTRY_SCHEMA_VERSION` (`lib/component-registry.ts`, currently `"1.0.0"`) — versions the shape of the canonical `ComponentRegistryEntry` type itself.
- `PublicRegistryMetadata.schemaVersion` (`lib/registry-public.ts`, now `"1.4.0"`) — versions the derived, public `/registry.json` output shape and its documented field semantics. This is the one this section is about; the other two are unaffected by it.

### shadcn-compatible distribution layer — Foundation + Button (2026-08-08)

A shadcn/ui-compatible transport layer shipped for Foundation + Button
only, generated from the canonical registry rather than hand-maintained.
Proven end-to-end beforehand via a POC: a real `npx shadcn@latest add
@skrewww/button` install into a fresh, Tailwind-free `create-next-app`
project succeeded with zero manual repair — correct file placement,
Foundation auto-resolved once via `registryDependencies`, correct
Shape/Surface mode behavior, working `.sr-only`, no unexpected npm
packages, passing lint/typecheck/build. Full detail, mapping rules, and
follow-ups in
[`docs/architecture/shadcn-distribution.md`](architecture/shadcn-distribution.md).

**This is implemented independently from the previously documented
`@skrewww/core` + `npx skrewww` roadmap** (see
`skrewww-claude-project-instructions.md`'s "Distribution Model" section,
still unimplemented). The shadcn layer is, as of this date, the first
Skrewww distribution mechanism actually proven working end-to-end; the
long-term relationship between the two roadmaps has not been decided.

Key facts:
- New: `lib/shadcn-registry-generator.ts` (pure, tested generation logic),
  `scripts/generate-shadcn-registry.ts` (file-writing CLI entry point,
  wired into `npm run build` via a new `generate:registry` script).
- Output (`public/r/foundation.json`, `public/r/button.json`, served at
  `/r/{name}.json`) is generated at build time and gitignored, not
  committed — same treatment as `/registry.json`, which this feature does
  not modify.
- No canonical schema change: `lib/component-registry.ts`,
  `CANONICAL_REGISTRY_SCHEMA_VERSION`, `lib/registry-public.ts`, and
  `PublicRegistryMetadata.schemaVersion` (`"1.4.0"`) are all untouched.
- Two known follow-ups recorded but deliberately unresolved: `icons.tsx`
  transport coupling (Button ships the whole file for one export) and a
  consumer-side ESLint warning divergence — see the architecture doc for
  the measured numbers. Neither `icons.tsx` nor any ESLint config changed
  in this pass.
- No CI added. This repo has no `.github/workflows/` yet; drift
  protection for this feature relies on the existing local
  `npm run test:all` gate (`test` validates the generator's pure
  functions, `build` runs real generation).

### Automated external-consumer smoke test — 2026-08-09

`npm run smoke:consumer` is now implemented as the automated Tier B
distribution regression test. It scaffolds a fresh Tailwind-free
Next.js consumer in OS temp storage, serves locally generated Skrewww
registry manifests, verifies `@skrewww/button` resolution through
shadcn, recursively confirms `@skrewww/foundation` installation,
validates expected file placement and npm dependency delta, wires
Foundation CSS, renders Button in a real consumer page, and requires
`next build` to pass. The first verified run passed end-to-end in ~45
seconds with no unexpected filesystem or package changes.

The smoke test is intentionally not part of `npm run test:all` because
it is a slower external-consumer integration check involving fresh
project scaffolding and npm/shadcn tooling. Full architecture and
manual external-consumer verification details remain in
[`docs/architecture/shadcn-distribution.md`](architecture/shadcn-distribution.md).

### Card added to shadcn distribution — 2026-08-09

Card became the second component (after Button) distributed through the
shadcn-compatible layer, reusing the same generator mechanism with no
architectural change. `https://skrewww.com/r/card.json` passed all 13
production verification checks (byte-identical to a local build of the
exact deployed commit, correct manifest fields, zero `hostRequirements`
occurrences in the public payload, `/r/foundation.json`/`/r/button.json`
unaffected). Tier B (`npm run smoke:consumer`) now takes an optional
component argument (`-- button` / `-- card`, defaulting to `button`), and
both pass end-to-end. No public registry schema-version bump was needed.
Full mechanics and verification detail in
[`docs/architecture/shadcn-distribution.md`](architecture/shadcn-distribution.md).

### Text Input, Form Field, and Validation Message added to shadcn distribution — 2026-08-09

Three form-layer components — Text Input, Form Field, and Validation Message —
became the third milestone for the shadcn distribution layer, proving the
multi-hop registry dependency chain and npm-package resolution in a real scenario.
All three endpoints (`https://skrewww.com/r/text-input.json`, `/r/form-field.json`,
`/r/validation-message.json`) passed production verification — HTTP 200, valid JSON,
correct manifest fields, byte-identical to the deployed commit (`5e3a2f0`),
and all prior endpoints (`/r/foundation.json`, `/r/button.json`, `/r/card.json`)
remained unaffected. Tier B smoke test (`npm run smoke:consumer -- text-input`)
passed end-to-end: Text Input's dependency chain auto-resolved Form Field and
Validation Message; `@phosphor-icons/react` installed as the only net-new npm
package (Validation Message's real dependency); shared `lib/cn.ts` across all
three components resolved to a single final file; consumer build succeeded.
Verified facts:

- **Dependency chain**: Text Input → Form Field → Validation Message → @phosphor-icons/react + Foundation
- **First real npm package in the layer**: Validation Message's `dependencies: ["@phosphor-icons/react"]` (no prior manifest had non-empty `dependencies`)
- **Shared file resolution**: `lib/cn.ts` transported by all three manifests, installed once
- **No regression**: All 6 endpoints now live; no prior regression
- **No schema bump needed**: Three-component dependency chain fits existing registry-item shape

Full detail in
[`docs/architecture/shadcn-distribution.md`](architecture/shadcn-distribution.md).

### Implemented inventory by category

| Category | Components |
|----------|------------|
| Actions | Button, Link |
| Containers & Overlays | Accordion, Card, Dialog, Drawer, Popover |
| Content & Data | Avatar, Banking Account Card, Banking Balance Summary, Banking Transaction Row, Bar Chart, Calendar Day, Calendar Grid, Data Table, Divider, Empty State, Line Chart, List Item, Table, Tag, Timeline, Tree View |
| Forms | Checkbox, Combobox, Date Picker, File Upload, Form Field, Radio, Radio Group, Search Field, Select, Switch, Text Input, Textarea, Validation Message |
| Feedback | Alert, Badge, Progress Bar, Skeleton, Spinner, Toast, Tooltip |
| Navigation | Breadcrumb, Menu, Pagination, Tabs |

## Figma status

**Partially resolved** — Combobox confirmed 2026-07-13, updated 2026-07-15 (Multi-select removed from Figma, option-list anatomy now confirmed present); File Upload confirmed 2026-07-15 (single-file and multi-file anatomy both Figma-confirmed); basic Table reusable architecture confirmed 2026-08-14; Data Table Column Header mapped 2026-08-31 (no Data Table master)

- Starting node from brief: `2002:2365`
- Combobox component-set node ID: **`2024:2480`** ("Forms/Combobox", section `2024:2501`) — confirmed via Figma MCP on 2026-07-13, after resolving a competing Desktop Bridge instance on port 9224 that had caused the prior timeout. **Updated 2026-07-15**: the `Multi-select` boolean property and its Chips frame were removed from Figma entirely (no corresponding code capability ever existed); a new demo frame ("Combobox (example — open)", node `2113:2`) now confirms option-list/listbox anatomy directly — plain label text only, no icon, no description, matching `ComboboxOption`'s real type. A token gap was found (not fixed): `semantic/surface/subtle`, used by the selected-option background, has no Figma variable (see [`combobox-parity.md`](architecture/combobox-parity.md))
- File Upload component-set node ID: **`2024:2649`** ("Forms/File Upload") — confirmed via direct Figma property inspection on 2026-07-15: 5 state variants (Empty/Dragging/Error/Disabled/Filled) + File Name text property. **Both single-file and multi-file anatomy are Figma-confirmed.** The Filled variant (node `2024:2648`) is a vertical list container holding one or more File Row frames (first: node `2107:10`, File Icon + File Name + Remove Icon); the base variant shows one row (single-file as a list of one), and a multi-file example frame (node `2108:21`) shows three. React's existing `multiple`/`maxFiles`/independently-removable file list already matches this structure — nothing to change (see [`file-upload-discovery.md`](architecture/file-upload-discovery.md), `FILE_UPLOAD_MULTI_FILE_ANATOMY_STATUS = "confirmed-present"` in `lib/file-upload-figma-metadata.ts`)
- Basic Table canonical nodes: **Table `2321:1964`; Header Row `2321:1903`; Body Row `2321:1920`; Cell `2321:1872`** — live-verified 2026-08-14. Native Slot composition verified 2026-08-31 (`Rows#2791:12`, Header `Cells#2791:0`, Body `Cells#2791:6`). Stable-v1 is Flat-only with no Surface property and Rounded-only at `radius/lg` (12px) with `cornerSmoothing=0` and no Shape property, with Card surface/border, zero blur, no shadow, elevated muted header, default body, 12px/16px row geometry, and semantic dividers. Caption/Footer visuals and controlled Table Shape mapping remain pending. Historical example `2044:26192` is not canonical. Data Table remains a separate interaction layer (see [`table-foundation.md`](architecture/table-foundation.md), `lib/table-figma-metadata.ts`, and `lib/layer3-surface-figma-metadata.ts`).
- Data Table: **no shell master**. Sortable header primitive **Content/Data Table Column Header `2805:859`** maps to `DataTableSortHeader` (Sort / Align / Disabled / Label). Customer-facing composition examples live on presentation FRAME **`2491:932`** (not a component). Registry `figmaAvailability: "partial"`. React sorting MVP unchanged (2026-07-15). Free Table-family port deferred (see [`data-table-discovery.md`](architecture/data-table-discovery.md), `lib/data-table-figma-metadata.ts`)
- Tree View component-set node ID: **confirmed 2026-07-18** — "Content/Tree Item" component set is node `2058:1988` (State variants: Default `2058:1985`, Hover `2058:1986`, Selected `2058:1987`); the "Tree View (example)" composed demo is node `2058:1998`; parent section "Content/Tree View" is node `2058:2071`. This closes the one open item from the 2026-07-18 implementation — the component structure, properties, tokens, and 20px-per-depth indentation convention were already accurately described and implemented against; only the node IDs themselves were missing from the record (see `lib/tree-view-figma-metadata.ts`, `TREE_VIEW_FIGMA_AUDIT_STATUS = "verified-2026-07-18"`)
- Bar Chart / Line Chart component-set node IDs: **confirmed 2026-07-18** — parent section "Content/Charts" is node `2058:2568`; "Bar Chart (example)" frame is node `2058:2532`; "Line Chart (example)" frame is node `2058:2559`. Both examples are illustrative/minimal (establishing color, stroke weight, and marker style), not full chart specs — axes beyond Bar Chart's month labels, legends, and multi-series were never shown in Figma and are documented as deliberate v1 deferrals, not gaps (see `lib/charts-figma-metadata.ts`, `CHARTS_FIGMA_AUDIT_STATUS = "verified-2026-07-18"`)
- Timeline component-set node ID: **confirmed 2026-07-24** — "Content/Timeline Item" component set is node `2058:2092` (Title/Timestamp/Description text properties + State: Default/Highlighted variant); the "Timeline (example)" composed demo is node `2058:2102`; parent section "Content/Timeline" is node `2058:2130`. This closes the one open item from the 2026-07-19 implementation — the component structure, properties, tokens, and positional (not state-coupled) connector suppression were already accurately described and implemented against; only the node IDs themselves were missing from the record. Confirmed anatomy: Default is a 10x10 stroke-only dot (1.5px, semantic/action/primary) + a 2x48px Connector Line (semantic/border/default); Highlighted is a 12x12 solid-fill dot (semantic/action/primary), no stroke; Title is always semantic/text/primary, Timestamp/Description always semantic/text/secondary in both states. The last item's connector is structurally absent (no Connector Line child at all), not merely hidden — there is no formal "Show connector" boolean property (see `lib/timeline-figma-metadata.ts`, `TIMELINE_FIGMA_AUDIT_STATUS = "verified-2026-07-24"`)
- Layer 3 approved parity scopes for Button, Avatar, Calendar Day, and Pagination Page Item: **verified and closed 2026-08-11**. Basic Table's Flat-only/Rounded-only Stable-v1 scope was verified and aligned 2026-08-14. These are not claims of full Layer 3 or full design-system parity. Exact component/master IDs, variable bindings, resolved values, closing commits where applicable, and explicit exclusions are archived in `lib/layer3-surface-figma-metadata.ts`.
- Variable collection counts, page inventory, and current component-set totals: **not verified in this pass**

Historical Figma snapshots must not be treated as current state. See [`skrewww-figma-practices-instructions.md`](../skrewww-figma-practices-instructions.md).

## Quality-gate status

**Last verified: 2026-08-11** (latest completed Layer 3 parity verification runs)

| Gate | Result |
|------|--------|
| `npm run verify:node` | Pass (Node 24.14.0, requires >=22.13.0 <23 \|\| >=24 <25) |
| `npm run verify:package` | Pass (`skrewww-docs@0.2.0-beta` lockfile aligned) |
| ESLint | Pass — 0 problems (0 errors, 0 warnings), `--max-warnings 0`. React Hooks Compiler debt closed 2026-08-29; see [`architecture/react-hooks-lint-debt.md`](architecture/react-hooks-lint-debt.md). |
| TypeScript | Pass |
| Vitest | Pass — **688/688 tests** across **81 files** |
| Playwright | Focused Button, Avatar, Calendar Day, and Pagination suites passed during the parity batches; the historical full-suite total was not rerun and is not replaced by focused counts |
| Production build | Pass — Turbopack (default bundler), **81 pages** |
| `npm audit` | **2 high-severity vulnerabilities remain, deliberately unresolved** — `next` (multiple CVEs) and its transitive `sharp` dependency; both require `next@16.3.0` via `npm audit fix --force`, outside the currently pinned exact `"next": "16.2.10"`. 4 other advisories (`brace-expansion`, `js-yaml`, `postcss`, `undici`) resolved 2026-08-07 via plain `npm audit fix` — no `package.json` change, no version outside stated ranges. See note below. |

**Next.js major upgrade — resolved 2026-07-13**: Upgraded 14.2.35 → **16.2.10**
(React 18 → **19.2.7**, ESLint 8 → **9.39.5** with flat config). Closes the
"requires jumping to Next 16.x" note in
[`components/README.md`](../components/README.md). Async params/searchParams
migration applied to both dynamic routes (`app/components/[slug]`,
`app/components/category/[categorySlug]`); 5 React 19 `element.ref`
deprecation call sites fixed (Popover ×2, Dialog, Drawer, Tooltip); one
genuine Turbopack CSS build failure fixed (`@import` reordered before
`@tailwind` directives in `app/globals.css`, see `app/globals.css`). A
regression here has a dedicated tripwire covering all 5 call sites:
`Popover.test.tsx` has one "does not access the deprecated element.ref API"
test for `PopoverTrigger` and one for `PopoverAnchor` (the one Combobox
composes), and `Dialog.test.tsx`/`Drawer.test.tsx`/`Tooltip.test.tsx` each
have one — every test spies on `console.error` with an explicit caller ref
attached (2026-07-14).

**Build page count 71 → 70 — root cause confirmed (2026-07-14)**: `npm run
build`'s summary line dropped from `71/71` (Next 14.2.35) to `70/70` (Next
16.2.10). **No route or content page was lost** — confirmed by instrumenting
both versions' bundled `next/dist/export/index.js` to dump the exact raw path
array each version iterates to produce its "Generating static pages (X/X)"
count (not the printed `Route (app)` table, the actual internal list):

- **Next 14** counts **71** paths, and that raw list explicitly includes
  `/404` and `/500` as two individually-enumerated, separately-counted export
  paths, alongside `/_not-found` (68 shared content/static routes + `/_not-found`
  + `/404` + `/500` = 71).
- **Next 16** counts **70** paths. Its raw list has no `/404` or `/500` entries
  at all — instead it has `/_global-error` (a new App Router global-error-boundary
  route) alongside `/_not-found` (68 + `/_not-found` + `/_global-error` = 70).
  Next 16's `build/index.js` (`moveExportedPage("/_error", "/404", "/404", ...)`
  and the equivalent for `/500`) still writes `pages/404.html` and
  `pages/500.html` to disk — confirmed present in both versions' output — but
  does so as a cheap post-build **copy** from the already-rendered `/_error`
  output rather than running them through the enumerated, individually-counted
  static-generation worker loop that Next 14 used.

Net effect: Next 14 individually counted 3 framework-level fallback routes
(`/_not-found`, `/404`, `/500`); Next 16 counts 2 (`/_not-found`,
`/_global-error`), folding the legacy pages-router-style `/404`/`/500`
generation into an uncounted copy step. That's exactly the -1 delta (71→70),
fully independent of the redirect aliases (`form-field-wrapper`,
`accordion-item`; those are handled entirely by `next.config.js`'s
`redirects()` and were never counted as generated pages in either version).
**70/70 is the correct, current number** and requires no further action.

**Data Table MVP implemented (2026-07-15)**: The narrow scope approved
2026-07-13 in [`data-table-discovery.md`](architecture/data-table-discovery.md)
(sorting only, external Pagination composition) is now built — no columns/rows
prop API; the consumer still writes real `Table`/`TableHead`/`TableBody`
markup and drops in `DataTableSortHeader` for sortable columns.
`useDataTableSort` is a dual controlled/uncontrolled sort-state hook using
`lib/use-controllable.ts` (same pattern as Accordion/Dialog/Drawer/CalendarGrid
range mode) — chosen over a component-prop-only API because it keeps
`DataTableSortHeader` a purely presentational, stateless component (resolved
direction + click handler in, nothing else), pushing all controlled/
uncontrolled complexity into one hook rather than every header cell. Sort
cycle per column: none → ascending → descending → none; activating a
different column always resets it to ascending. `figmaAvailability` was
`"unavailable"` at ship (no Figma component set yet). **Superseded 2026-08-31:**
Column Header `2805:859` is mapped; registry is `"partial"` because there is
still no Data Table master (see Figma status above). Registry
count moved 39 → 40, Figma-documented count 55 → 56 (new `content/content-data.ts`
entry, required for `/components/data-table` to resolve rather than 404),
indexable slugs 54 → 55.

**npm audit — 2 moderate findings resolved via override (2026-07-15)**: The
PostCSS XSS advisory ([GHSA-qx2v-qp2m-jg93](https://github.com/advisories/GHSA-qx2v-qp2m-jg93))
previously reported twice by `npm audit` (once as a direct finding, once via
`next`'s dependency on it) was vendored inside Next 16.2.10's own nested
`node_modules/next/node_modules/postcss@8.4.31` copy — an upstream Next.js
packaging issue, not a problem with this repo's own dependency choices.
Added a root `"overrides": { "postcss": "^8.5.10" }` in `package.json` and
bumped the direct `postcss` devDependency to the same range (npm's
`assertRootOverrides` check rejects an override whose range doesn't match a
package that's also a direct dependency — this is the standard, documented
resolution, not a workaround). `npm install` then fully deduplicated the
tree: `node_modules/next/node_modules/postcss` no longer exists at all: a
single shared `postcss@8.5.19` resolves everywhere, confirmed by direct
inspection of `node_modules/`, not just trusting the audit output.
**`npm audit` now reports 0 vulnerabilities.** All gates (lint, typecheck,
515 Vitest tests, 131 Playwright tests, 71/71-page Turbopack build)
re-verified clean afterward — the version bump didn't disturb Tailwind's
PostCSS pipeline.

**npm audit — 4 of 6 findings resolved via plain `npm audit fix`, 2 deliberately deferred (2026-08-07)**:
The 0-vulnerabilities state above did not hold indefinitely — the advisory
database is not static, and new CVEs get published against already-installed
dependency versions with no code change on this repo's side. A later audit
found the count had risen to 6 (1 moderate, 5 high): `brace-expansion`,
`js-yaml`, `postcss` (a different, newer advisory than the one fixed above),
`sharp`, `undici`, and `next` itself (several CVEs, including SSRF via
attacker-controlled rewrite destinations and a Server Actions DoS). Running
plain `npm audit fix` (no `--force`) resolved `brace-expansion`, `js-yaml`,
`postcss`, and `undici` — all via transitive dependency bumps within their
existing semver ranges (confirmed via `git diff package.json`: zero changes;
`package-lock.json` only). **2 high-severity vulnerabilities remain,
deliberately unresolved**: `next` and its transitive `sharp` dependency both
require `npm audit fix --force`, which would install `next@16.3.0` —
outside the currently pinned exact `"next": "16.2.10"`. Per the same
decision category as the earlier Next 14.2.35→16.x upgrade (evaluated and
deferred separately, not forced through an audit-fix command), this bump is
left as an explicit, separate decision for the project owner rather than
applied silently. Until that decision is made, **`npm audit` reports 2 high
severity vulnerabilities, not 0** — this file will be updated again when
that decision lands.

## Recently shipped

**Verified from code / documented architecture** — see [`calendar-foundation.md`](architecture/calendar-foundation.md)

- **Calendar Grid month/year drill-up subviews** (2026-07-12) — three internal drill levels (day/month/year) with dedicated `CalendarMonthCell`/`CalendarYearCell` components, focus restoration on drill transitions, and range enforcement via `isMonthFullyDisabled`/`isYearFullyDisabled`
- **Calendar Grid date-range selection** (2026-07-12) — opt-in `mode="range"` with `rangeValue`/`defaultRangeValue`/`onRangeValueChange`, live keyboard+hover provisional preview, chronological auto-swap on a backwards second click, and disabled-dates-in-the-middle handling
- **Data Table MVP** (2026-07-15) — the narrow scope approved 2026-07-13 (sorting only + external Pagination) is now implemented at `/components/data-table`: `DataTableSortHeader` composes `TableHead` with a real button, `aria-sort`, and a direction indicator; `useDataTableSort` is a dual controlled/uncontrolled sort-state hook (`lib/use-controllable.ts` pattern) with a none → ascending → descending → none cycle per column. No `columns`/`rows` prop API — the consumer still writes real `Table`/`TableHead`/`TableBody` markup. Figma Column Header mapping landed 2026-08-31 (`2805:859`); there is still no Data Table master. Row selection, sticky headers, density, and virtualization remain deferred as React APIs; see [`data-table-discovery.md`](architecture/data-table-discovery.md)
- **Layer 3 (Shape) radius-token rebinding — 5 of 8 flagged components fixed in Figma (2026-07-17)**: a prior radius-token sweep flagged 8 components whose Figma-side radius binding pointed at the wrong token layer. Confirmed via direct Figma inspection (61 variants checked, zero inconsistencies), Figma-side only — no React code, test, or component-registry changes required, since these components' `tokensUsed` entries already named the correct semantic token:
  - **Actions/Link** (all 42 variants) — rebound from `radius/xs` (Primitive, 2px) to `component/radius/control` (Shape-aware). Real visual change: now renders 4px in Rounded mode, matching Button's control-scale.
  - **Forms/File Upload** (all 5 variants) — rebound from `radius/lg` to `component/radius/container`. No visual change (12px both ways); now properly Shape-aware.
  - **Feedback/Alert** (all 4 variants) and **Feedback/Toast** (all 4 variants) — same fix, same reasoning, no visual change.
  - **Feedback/Skeleton** — handled per sub-shape: Text rebound to `component/radius/control` (no visual change); Rectangle rebound to `component/radius/container` (4px → 12px, deliberate — matches container scale for a large placeholder block); Circle deliberately left at `radius/full` (fixed-circular exception, matching Badge/Avatar/Calendar Day — rebinding would visibly break it into a non-circular shape outside Pill mode).
  - **Not gaps, confirmed intentional exceptions**: Badge, Avatar, and Calendar Day remain fixed-circular at `radius/full` — the remaining 3 of the original 8 flagged components. No further action needed on those.
- **Tree View** (2026-07-18) — the first of the Layer 2 code-side gaps (Tree View, Charts, Timeline) is implemented, built directly against a real, well-documented Figma reference (Content/Tree Item component set + the "Tree View (example)" composed demo — see `docs/project-status.md`'s registry entry for the full token/anatomy citation). `TreeView` renders a flat, depth-first list of rows (`role="tree"`/`role="treeitem"`, not nested DOM groups) with `aria-level`/`aria-setsize`/`aria-posinset` set explicitly per row, since DOM nesting doesn't convey depth here. Indentation is computed as `depth * 20px` padding-left per row (`components/ui/internal/TreeItem.tsx`) — matching the 20px-per-depth unit Figma's own composed example verifies, and explicitly not a fixed set of per-depth variants, which Figma's own component description calls out as the #1 common mistake. `expanded` (string ids) and `selected` (single string | null) are each independently controlled/uncontrolled via `lib/use-controllable.ts` (same pattern as Accordion/Dialog/Drawer/CalendarGrid/Data Table). Keyboard model: roving tabindex (one row in the Tab sequence), ArrowUp/Down move between visible rows, ArrowRight expands + moves onto a newly-revealed first child (deferred via an effect since that child isn't in the DOM until the expand commits) or moves directly if already expanded, ArrowLeft collapses in place or moves to parent, Enter/Space selects. Single-select only — multi-select, drag-and-drop reordering, virtualization, and async/lazy-loaded children are all explicitly deferred, none shown in the Figma reference. Icon is a plain per-node `ReactNode` slot, matching Figma's deliberate lack of a formal icon-swap property. The pre-existing `tree-item` Figma-facing doc entry (`content/content-data.ts`) was not rewritten — it now carries a `knownLimitation` note pointing to Tree View as the real, implemented, canonical pattern.
- **Bar Chart and Line Chart** (2026-07-18, corrected 2026-07-19) — the second of the Layer 2 code-side gaps, built on **recharts 3.9.2** (added as a new dependency; 0 npm audit vulnerabilities) against Figma's "Content/Charts" section (Bar Chart (example) node `2058:2532`, Line Chart (example) node `2058:2559`). Two separate components, matching Figma's own separation into two distinct examples — not one polymorphic `Chart` component. Both take identical single-series data (`{ label: string; value: number }[]`) plus a required `label` prop (the chart's accessible name). Color reuses the existing `semantic/action/primary` token (aliased as `--bar-chart-fill`/`--line-chart-stroke` in `styles/tokens.css`) — no new semantic token invented. Bar Chart renders bars + X-axis month labels only (axisLine/tickLine both disabled, no Y-axis/gridlines/legend/tooltip); Line Chart renders a single stroked path + hollow-ring point markers with no axes at all — both match their respective Figma examples exactly. **Accessibility mechanism**: each chart's SVG is `aria-hidden`, wrapped in a `role="img"` container with `aria-label` (the `label` prop) and `aria-describedby` pointing at a visually-hidden (`sr-only`) `<table>` containing the same label/value pairs — bar heights and line paths convey nothing to assistive tech on their own, so this is a real WCAG mechanism, not optional polish. Deliberately deferred for v1 (documented in each registry entry's `openQuestions`, not silently absent): multi-series support, interactivity (hover tooltips, legend interactivity), and a Y-axis/gridlines beyond Bar Chart's existing month labels — none of these are shown in the Figma reference.
  - **Corrected 2026-07-19, two items**: (1) Both components now use recharts's **`ResponsiveContainer`** (fluid width, fixed height — default 240) instead of the original fixed pixel width/height. The original fixed-size decision was justified partly by a jsdom/ResizeObserver test limitation, which isn't a legitimate reason to constrain the shipped component's real-world sizing — a real consumer needs the chart to fill a variable-width dashboard/card. Fixed the actual test-environment problem instead: added a `ResizeObserver` polyfill to `vitest.setup.ts` (there was no prior global one) that synchronously supplies a fixed, nonzero `contentRect` on `observe()`, which is what `ResponsiveContainer` actually reads (not a second `getBoundingClientRect()` call). This also exposed and fixed a pre-existing dormant bug in `useFloatingPosition.test.ts`, whose own local `ResizeObserver` mock was an arrow function (not a valid constructor) — it had never run for real because that test always early-returned when `ResizeObserver` was undefined. (2) Line Chart's curve type is now **`"linear"`**, not `"monotone"`. The original `"monotone"` choice was an unverified default; checked directly against the real Figma vector path (node `2058:2560`) via the Figma Plugin API — the raw path data is `M 0 140 L 43.3 93.3 L 86.7 110.8 L 130 43.75 ...`, every segment a straight `L` (lineto) command with no curve commands at all. A regression-guard test now asserts the rendered path contains no `C`/`Q`/`S`/`T` curve commands.
- **Timeline** (2026-07-19) — the third and last of the Layer 2 code-side gaps (Tree View, Charts, Timeline), closing out all of Layer 2 entirely. Built against Figma-facing prose already recorded in `content/content-data.ts` (State: Default outlined ring / Highlighted larger solid dot; Title/Timestamp/Description fields) plus specific behavioral facts confirmed directly: connector-line suppression is purely positional (only the last item omits it, entirely independent of `state`), and the Description wraps at 220px in the Figma reference rather than truncating. At implementation time, no numeric Figma node ID had been given or verified for Timeline, unlike Tree View/Charts; this was confirmed 2026-07-24 (see Figma status above; `lib/timeline-figma-metadata.ts`, `TIMELINE_FIGMA_AUDIT_STATUS = "verified-2026-07-24"`). `Timeline` composes an internal `TimelineItemRow` (not publicly exported, matching Tree View/Tree Item's split) into a real `<ol>`. The connector's length is computed via CSS (`flex: 1` inside a grid row stretched to the taller of its two columns), not a fixed pixel value, so it reaches the next item's marker regardless of how long that item's description makes the row — verified with a deliberately long, multi-paragraph description in both the test suite and a live visual check (the connector visibly stretched to match). Seven edge cases were verified against existing repo precedent rather than invented: (1) an empty `data` array renders nothing — no other collection component in this codebase (Table, Tree View, Bar Chart, Line Chart) has an established empty-state convention, confirmed by checking each one and finding no internal `EmptyState` composition anywhere; (2) a single item never has a connector, which falls out automatically from computing `isLast` as `index === data.length - 1` rather than needing a special case; (3–4) with multiple items, only the positionally-last one omits its connector — including a dedicated test where the *last* item is explicitly `state: "default"`, to catch an implementation that incorrectly couples connector visibility to `state === "highlighted"` instead of actual position; (5) a `Highlighted` item in the middle keeps its connector and renders its larger marker correctly with no special-casing needed, since `state` and `isLast` are independent props; (6) no truncation is applied to Title or Timestamp — checked `List Item` (which does truncate to a single line) against `Alert` and `Card` (which don't truncate their titles at all); since Figma's own reference shows the Description wrapping rather than truncating, and List Item's dense single-line-row context isn't comparable to Timeline's larger content blocks, natural wrapping was used everywhere instead of truncation.

## Layer 4 pilot — Banking (first Industry Systems pilot)

**Implemented 2026-07-25** — the first Layer 4 (Industry Systems) pilot, not a Layer 2 gap and not folded into "Major parity gaps" below. Three components, genuinely greenfield: confirmed via a full Figma file search (every page checked) that no Industry Systems page and no Banking-related frame or component exists anywhere in the design file. Figma status for all three is **React-first, Figma parity pending** — no reference exists, none was invented (see `lib/banking-figma-metadata.ts`, `BANKING_FIGMA_AUDIT_STATUS = "confirmed-no-reference-2026-07-25"`, a confirmed *absence*, not a Data Table “pending MCP” status — Data Table now has a mapped Column Header primitive but still no shell master). `category` on all three registry/content entries is **Content & Data**, unchanged — that field still describes the underlying component kind. **Navigation/IA note (superseded same day, see the section directly below)**: at initial implementation, no distinct nav grouping existed yet and these three were reachable only via their `category`, indistinguishable from Layer 2 Content & Data components except by name prefix — corrected the same day by the "Industries" navigation structure below, once Healthcare's future addition made the gap in reachability structurally clear.

- **Banking Transaction Row** (`/components/banking-transaction-row`) — **Composes:** List Item (row shell) + Avatar (merchant logo/initials) + Badge (status) + Popover (detail-view trigger, anchored via `PopoverAnchor` since List Item doesn't forward a ref). Chose **Popover over Drawer**: Popover's own documented purpose ("non-modal floating panel for supplementary or lightly interactive content anchored to a trigger") precisely matches viewing a handful of read-only detail fields for one row without leaving the list; Drawer's placement is currently left-edge-only (`DrawerPlacement = "left"`), an unconventional position for a per-row detail panel, and its own description ("supplementary settings, filters, or secondary forms") targets a heavier use case. Status (`success`/`warning`/`error`) drives both the Badge variant and the amount's color via the existing `semantic/feedback/success`, `semantic/feedback/warning`, and `semantic/action/danger` tokens — no new colors.
- **Banking Account Card** (`/components/banking-account-card`) — **Composes:** Card (surface shell, title + footer slots) + Tag (account type) + Button (action trigger, in Card's footer) + Line Chart in sparkline mode (balance history). Glass Surface + Pill Shape inheritance was verified live via computed-style inspection (not assumed): the same Account Card instance resolves `border-radius: 12px` / `background-color: rgb(255,255,255)` under the default Rounded+Flat mode, `border-radius: 16px` under Pill Shape, and `background-color: rgba(255,255,255,0.72)` under Glass Surface — purely from Card's own `--shape-radius-container`/`--surface-fill-default` custom properties, zero Account-Card-specific surface code.
- **Banking Balance Summary** (`/components/banking-balance-summary`) — **Composes:** Card (layout wrapper, title slot) + Tabs (time-range filter, one `TabsPanel` per range) + Bar Chart (one instance per range, inside its own panel — real per-range data, not one dataset re-scaled) + Skeleton / `SkeletonLoading` (loading state). Tabular numbers use the existing, already-established `font-variant-numeric: tabular-nums` convention (found in `table.module.css`, `progress-bar.module.css`, `pagination.module.css`, `badge.module.css`) applied directly to the balance/total figure classes — no new CSS convention introduced.

**Real Layer 2 extensions surfaced and fixed, not worked around** (the "compose, never duplicate" principle's first real test case):
- **List Item** gained optional `aria-expanded`/`aria-haspopup`/`aria-controls` passthrough on its action-mode button (`components/ui/ListItem.tsx`) — Banking Transaction Row's row needed to announce the anchored Popover's open/closed state, and List Item had no way to accept disclosure ARIA attributes at all. Extension is additive and no-ops on navigational/static rows.
- **Line Chart** gained an optional `sparkline` prop (`components/ui/LineChart.tsx`) — the base chart already has no axes/gridlines/legend by design, so a small `height` alone gets most of the way to a sparkline, but its hollow-ring point-marker dots are unconditional in the base design and dominate the visual at sparkline scale. `sparkline` suppresses the dots and uses a thinner 1.5px stroke (vs 2px); data and accessibility (role="img" + hidden data table) are unchanged.

No new industry-specific tokens were introduced — every token used aliases to existing Foundation/Semantic tokens (`semantic/feedback/success`, `semantic/feedback/warning`, `semantic/action/danger`, `semantic/text/primary`, `semantic/text/secondary`), consistent with the existing Industry-token rule.

## Layer 4 navigation/IA — "Industries" as a distinct nav structure (2026-07-25)

**Real information-architecture fix, same day as the pilot above but a separate decision.** Before this, the three Banking components were reachable only via `category: "Content & Data"` — visually indistinguishable from real Layer 2 Content & Data components (Avatar, Tag, Table, ...) except for the "Banking" name prefix. This is corrected structurally, not cosmetically, because Healthcare and other industries are on the roadmap and need to nest cleanly as siblings, not as a rework.

**Schema decision**: a new, optional `industry` field, orthogonal to `category` (which is unchanged on all three entries — it still describes the underlying component kind, e.g. "Content & Data"). `industry` is the authoritative signal for a two-level Industries > {industry} nav grouping, additive on top of the existing category system rather than a redesign of it:

- `lib/industry-content.ts` (new file, mirrors `lib/category-content.ts`): `industries` array (currently `["Banking"]`, extensible), `IndustryName` type, `industrySlugMap`, `industryPageContent` (summary/description/accessibility/status per industry), `getIndustryPageHref`, `getIndustryNameFromSlug`, and `INDUSTRIES_INDEX_HREF`.
- `ComponentRegistryEntry.industry?: IndustryName` (`lib/component-registry.ts`) and `ComponentDoc.industry?: string` (`lib/types.ts`) — both optional, undefined for every Layer 2 component. Set to `"Banking"` on all three pilot entries in both `lib/component-registry-content-data.ts` and `content/content-data.ts`.
- `PublicRegistryEntry.industry?: string` (`lib/registry-public.ts`) — exposed in `/registry.json`. Schema version bumped **1.2.0 → 1.3.0** (additive).
- `getIndustryIndexing()` added to `lib/indexing-policy.ts`, mirroring `getCategoryIndexing()`.

**New routes**:
- `/components/industries` — a new top-level index, the direct peer of `/components` (lists each industry with a link, mirroring how `/components` lists each Layer 2 category).
- `/components/industries/[industrySlug]` — one page per industry (`/components/industries/banking` today), structured identically to `/components/category/[categorySlug]` — breadcrumb, summary/description/status/accessibility content, and the implemented-components list filtered by `entry.industry === industry`.

**Sidebar** (`components/SidebarNav.tsx`): industry-classified components are excluded from their `category` group (`!component.industry` filter) and instead rendered in a new "Industries" section below the six Layer 2 category groups, visually separated (a top border + brand-colored "Industries" label), with "Banking" as its own indented sub-label above the 3 components — two levels of grouping, matching the two-level nav requirement. `/components/page.tsx` gets the same exclusion plus a pointer to the new Industries index.

**Breadcrumbs and JSON-LD corrected** — industry-classified component pages now show **Home → Industries → Banking → [Component]** instead of **Home → Components → Content & Data → [Component]**:
- `ComponentBreadcrumbs` (`components/docs/ComponentPageMeta.tsx`) looks up the registry entry's `industry` field (via the `slug` prop it already receives) and branches the crumb trail — no new prop threading required of callers.
- `componentPageJsonLd` (`lib/structured-data.ts`) branches its `BreadcrumbList` the same way; `articleSection`/`keywords` use `industry` when present instead of `category`. A new `industryPageJsonLd` mirrors `categoryPageJsonLd` for the new industry pages. `categoryPageJsonLd`'s implemented-component count now excludes industry-classified entries (`!entry.industry`), matching the sidebar/index-page exclusion.

**Sitemap and llms.txt**: `lib/sitemap-data.ts` adds the Industries index and each industry page (same priority tier as category pages). `lib/llms-content.ts` adds an "Industries (Layer 4 — distinct from Component categories above)" section listing the Industries index and each industry page, directly below "Component categories".

**Homepage** (`app/page.tsx`): the Layer 4 "Industry Systems" status line, previously hardcoded "Not started" (stale since the pilot shipped), now reads "Banking pilot (3 components)".

**Not done, deliberately**: no changes to the three Banking components' own code (`BankingTransactionRow.tsx` etc.) — this was registry/navigation/routing structure only. `category` was left as `"Content & Data"` on all three rather than invented a new Layer-2-style category value, since `industry` is the correct, additive signal for this and changing `category` would have been a needless second source of truth for the same fact.

## Major parity gaps

**Verified from code / documented architecture**

- Figma MCP verification for File Upload's temporary tokens (component-set node, variants, and File Name property confirmed 2026-07-15 — see below)
- Figma MCP verification for Data Table — no component set exists yet; not blocking (React-first interaction layer over the now-canonical basic Table)
- File Upload progress UI, preview thumbnails, controlled files, and retry semantics
- Calendar Grid composed range-picker input (two independently-typable start/end text fields + shared calendar, analogous to Date Picker) — judged non-trivial in scope (comparable to rebuilding Date Picker), not built; see [`calendar-foundation.md`](architecture/calendar-foundation.md#composed-range-picker-input--explicitly-out-of-scope)
- ~~Timeline~~ — Tree View, Charts, and Timeline (all three Layer 2 code-side gaps) are now implemented (see Recently shipped). Tree View and Charts' Figma node IDs were confirmed 2026-07-18; Timeline's node ID was confirmed 2026-07-24 (see Figma status above) — no open Figma-verification item remains across all three
- Advanced overlay patterns beyond current Dialog/Drawer/Popover/Menu stack
- Full Style System (Shape/Surface) parity across all components — **Shape/radius partially resolved 2026-07-17**: Link, File Upload, Alert, Toast, and Skeleton confirmed rebound to the correct Shape-aware `component/radius/*` tokens (see Recently shipped); Badge, Avatar, and Calendar Day confirmed as intentional fixed-circular exceptions, not gaps. **Surface substantially resolved 2026-07-17 in Figma**: Button, Card, and Text Input master components genuinely remediated and fresh-instance-verified across Flat/Gradient/Glass (see the Layer 3 Surface baseline section below), and the Surface/content-cascade audit across the remaining registry (3 batches, 23 components) is now complete, with flagged cleanup remaining — Menu Panel master `2181:216` is reusable (verified Phase 2 2026-09-13); Badge/Alert/Toast still carry duplicate tint tokens pending a future consolidation pass (see the Layer 3 Surface audit section below). **React parity for Button/Avatar/Calendar Day/Pagination was a separate, later fix (2026-08-11)** — the Figma verification above did not mean the React implementation matched it; see the "Layer 3 React parity fix" section below for what was actually missing and what's now fixed. **Stable-v1 Gradient was implemented 2026-08-14** as the approved additive fixed `90deg` overlay; File Upload Error participation was resolved later that day, while directional Gradient behavior and broader Foundation color drift remain open.

## Layer 3 Surface baseline

Surface-aware token architecture was prototyped successfully earlier, but a
later master-component audit (2026-07-17) found that the bindings were never
persisted to the actual component masters — `component/surface/content` had
zero real bindings anywhere in the file. Button, Card, and Text Input have
since been genuinely remediated at the master-component level and verified
via fresh-instance testing across Flat/Gradient/Glass. No corresponding claim
of full Surface validation was found in this file or in
[`skrewww-claude-project-instructions.md`](../skrewww-claude-project-instructions.md)
to correct in place — both already treated Surface rollout as open (see
"Broader Style System rollout" there) — so this section is new documentation
of the 2026-07-17 remediation, not a correction of prior text.

**Button — Surface-dependent filled control pattern**

- New tokens: `component/button/primary/background` (+hover, +pressed),
  `component/button/danger/background` (+hover, +pressed),
  `component/button/secondary/background` (+background-elevated, +border)
- Primary/Danger content (Label + icon glyph strokes) bound directly to the
  existing `component/surface/content` token — semantically valid reuse (dark
  background needs light text in Flat/Gradient; light-tinted glass needs dark
  text)
- Secondary's content deliberately unchanged (`semantic/text/primary`,
  `semantic/icon/default`) — its background never darkens enough to need
  switching
- Key finding: Primary/Danger have 3 real background tiers (base, hover,
  pressed) with progressively darker Flat/Gradient values and correspondingly
  tiered Glass opacity — a single shared token per style would have destroyed
  hover/press feedback
- All 45 master variants bound; fresh-instance inheritance verified;
  Flat/Gradient/Glass all verified with no regression

**Correction (2026-08-11) — this subsection describes the Figma contract
only, not React parity.** The bullets above accurately record what was
verified in Figma on 2026-07-17. They do not mean the React implementation
matched it: an independent source-level check (styles/tokens.css and every
component's own `.module.css`) found `component/surface/content` did not
exist anywhere in the React codebase, and Button's Primary/Danger
`color`/`background-color` had zero `[data-skrewww-surface="glass"]`
override at all — rendering identically across Flat/Gradient/Glass in the
shipped product the entire time, contrary to what a reader would reasonably
infer from "all verified with no regression" above. Avatar and Calendar Day
Selected had the identical gap (both reuse the same static
`--semantic-action-primary`/`--semantic-text-inverse` pattern with no Glass
override), and Pagination Current was found to not even be on the
brand-fill family in code — it shipped as the unrelated neutral/elevated
treatment. See the Layer 3 Surface audit and Active roadmap sections below
for the full finding and the 2026-08-11 fix. This correction is left in
place rather than rewritten in place, per this file's own no-silent-rewrite
convention — the original bullets are Figma-accurate and untouched.

**Card — Surface container pattern**

- New tokens: `component/card/surface`, `component/card/border`
  (deliberately unchanged across Flat/Gradient, same reasoning as Secondary
  Button)
- No content token needed — Title/Body correctly stay `semantic/text/primary`
  and `/secondary` across all 3 modes; verified via fresh-instance testing
  (not assumed) that dark text remains readable against the light-tinted
  Glass background
- Both Elevation variants (Flat, Raised) bound; Raised has no stroke at all
  (construction difference, handled correctly)

**Text Input — Surface form-control pattern**

- New tokens: `component/text-input/surface` (uniform across all 5 states),
  `component/text-input/border` (Default/Disabled tier),
  `component/text-input/border-hover` (Hover tier, more prominent in all
  modes including Glass)
- Focused (focus-ring) and Error (danger) strokes deliberately left
  untouched — real semantic feedback colors, confirmed to stay fully opaque
  in Glass mode rather than fading to translucent
- Value text unchanged (`semantic/text/primary` / `semantic/text/disabled`)
  throughout — verified readable in all 3 modes
- All 15 variants (5 states × 3 sizes) bound; fresh-instance verification
  passed for all 5 states in Flat and Glass

**All three**: raw-paint-matches-binding verified, no local instance
overrides used, fresh instances inherit correctly with zero manual setup.

**Superseded 2026-08-14**: Stable-v1 Gradient now has an approved shared
implementation: each participating component preserves its semantic/base
fill and adds one fixed `90deg` lightness overlay from `#FFFFFF14` to
`#0000000A`. Flat and Glass resolve the overlay to none. Participation and
explicit exclusions are recorded in
[`gradient-foundation.md`](architecture/gradient-foundation.md).

**Follow-up finding — blur effect (2026-07-17, after the color-token fix
above landed)**: a user visual check in Figma caught that Glass mode still
showed a hard, unblurred seam where a translucent button crossed a
background boundary — proving the color-only fix was incomplete. Root cause:
`component/surface/blur` (an existing token, resolving to 0 in Flat/Gradient
and 16 in Glass) had only ever been applied as an instance-level override on
the old "Layer 3 Validation (Pill + Glass)" demo instances — never bound on
the actual master components. Fixed by adding a BACKGROUND_BLUR effect
(bound to `component/surface/blur`) to all 62 master variants (45 Button, 2
Card, 15 Text Input). Verified on a fresh instance: blur resolves to 0 in
Flat/Gradient, 16 in Glass, purely from mode-switching.

## Layer 3 React parity — closed approved scopes (2026-08-11)

Live audits used the locked `Skrewww - Design System` file
(`U6KUuNf7DF4CP9QBOkLSUx`) as source of truth. The approved scopes below
are verified and closed; this does **not** declare full Layer 3 or full
design-system parity. Exact master IDs, variable IDs, resolved values, and
exclusions live in `lib/layer3-surface-figma-metadata.ts`.

- **Button** — Primary and Danger Default/Hover/Pressed/Focused/Disabled,
  Secondary's verified Glass treatment, Small/Medium/Large consistency,
  16px Glass blur, disabled opacity, separate Primary/Danger focus-gradient
  families, and the 1px OUTSIDE focused treatment are verified. Rounded is
  4px. Closed by `e0969f8f42a489a3d8c7624d00d795ba0c8cf166`.
- **Avatar** — initials masters are verified at 24/32/48px with 12/14/16px
  type, no stroke, shared Primary Surface fill/content/blur bindings, and a
  fixed `radius/full` circle under every global Shape mode. Closed by
  `61b18bc9eab2428e8e2807daf884625dc6d915b1`.
- **Calendar Day** — the five live masters Default, Today, Selected,
  Disabled, and Outside are verified at 32px, 14px, and `radius/full`.
  Today uses the verified 1.5px inside stroke without a separate dot;
  Selected carries the verified Surface fill/content/16px Glass blur;
  Disabled and Outside retain their distinct opacity behavior. Closed by
  `68ca733af663d819e3d9a556713ce13f1eabd352`.
- **Pagination Page Item** — Default, Hover, Current, Disabled, Ellipsis,
  32px geometry, 16px typography, 4px represented trail gap, Surface
  behavior, stroke absence, and Shape radii are verified. Closed by
  `5cfb4e6`.

**Explicitly unresolved or outside these verified scopes**:

- Button's exact React Squircle polygon equivalence to Figma corner
  smoothing `0.6000000238` remains unverified. Primary Glass Hover's dark
  `#17181B` content can appear muddy over complex backgrounds, but it
  matches live Figma; readability changes require Figma design approval and
  are not a React parity defect.
- Avatar image fallback, icon fallback, Hover, Pressed, Focused, and
  Disabled visual parity remain unverified because no matching masters
  exist.
- Calendar Day Range Start, Range End, Range Middle, and range preview are
  CODE-ONLY / UNVERIFIED. Hover, Selected Hover, Pressed, and Focused are
  also unverified. No range state is claimed to share Selected's verified
  Figma contract.
- Pagination Page Item Pressed, Focused, responsive/compact composition,
  First/Last controls, and exact Squircle polygon equivalence remain
  unverified.
- **Textual Previous/Next intentionally preserved; Figma icon-only Trail is
  composition-only evidence.** This is an approved product decision for
  clarity, accessibility, and existing consumer expectations, and is an
  intentional composition divergence rather than a parity defect. No
  canonical Previous/Next parity is claimed; their disabled Figma
  presentation remains unverified.

## Layer 3 Glass rim and focus correction — Button (2026-08-13, additive)

Appended per this file's correction convention; the entries above are left
as written.

**Glass rim gradient angle corrected, and explicitly classified as an
approximation.** The Glass rim on Button Primary/Danger shipped at
`17.526deg` with the wrong stop distribution. That angle was the raw
`atan(dx/dy)` of Figma's handles, taken without converting for Figma's
downward Y axis, so the rim rendered mirrored — the bright `#FFFFFF` 80%
stop landed on the bottom edge instead of the top. It is now `135.25deg`
with practical CSS stops `0% / 23.1% / 46.2%`; the end colour is repeated
at `100%` so it holds after `46.2%`.

Figma normalizes this gradient's handles **per-axis** to the node bounding
box, so the true angle depends on the element's aspect ratio. Button is
hug-content, so its width tracks its label: the real Figma angle drifts
about 29 degrees between a 113px and a 400px Medium button. Matching that
would require width-dependent runtime geometry, which is not justified for
a decorative 1px rim. **One fixed angle is shipped, derived for the Medium
master box (113x36), and is a practical approximation — not exact
mathematical parity.** The full derivation, raw handles, and a warning
against "correcting" it back toward a naive angle live in
`components/ui/button.module.css` and `lib/layer3-surface-figma-metadata.ts`.

Unchanged in this pass, because live browser verification confirmed they
were already correct: all Surface fill/content/blur tokens, Danger
Flat/Gradient hover/pressed (`#CC3B37` / `#B3261E`), Secondary's Glass fill
(`#FFFFFF1F`) and its 16px blur, and the mask/`mask-composite` inside-border
technique. The predicted Secondary 8px blur gap does not exist.

### Button focus parity repair

Figma's Button masters are repaired across all 45 variants. Representative
Focused nodes are Primary Medium `2012:7715` and Danger Medium `2012:7745`.
Their canonical treatment is a solid `2px` OUTSIDE stroke with no gap,
bound to `semantic/focus-ring` (`VariableID:2002:2472`; Light `#6C4CF2`,
Dark `#8770F6`) and independent of Surface mode.

React now uses that semantic outline for Primary, Secondary, and Danger in
Flat, Gradient, and Glass. The previous Primary/Danger focus pseudo-element
reused the Glass gradient families; because those tokens intentionally
resolve transparent outside Glass, Flat and Gradient had no visible focus
indicator. The pseudo-element responsibility has been removed. The Glass
rim remains a separate `1px` INSIDE masked gradient on the visual-surface
layer, so rim and focus ring remain visible simultaneously without changing
Button layout. React Button focus parity is closed by the passing focused
real-browser keyboard/computed-style suite; repository-wide gate results are
reported separately and are not implied by that component-level status.

Open parity limitations, intentionally not implemented in this pass:

- React has no Dark theme token-switching mode or test harness, so the Figma
  Dark `semantic/focus-ring` value `#8770F6` is not implemented in React.
- Brand Shape is named in the foundations documentation, but React has no
  Brand Shape token mode or Button preview control. Its geometry remains an
  open design-system implementation gap.
- Broader Layer 3 Surface audit items recorded elsewhere in this status file
  remain open; this Button repair does not claim full Layer 3 completion.

Verification for this React batch: lint passed with the existing 26-warning
allowance; typecheck passed; Vitest passed 688/688; focused Button Playwright
passed 15/15; the previously failing Drawer, Empty State, and Line Chart
focused serial rerun passed 17/17; the production build and
`git diff --check` passed. The full Playwright suite is **not green**: its
final serial run was 188/194, with five environment/offline-resource
`net::ERR_INTERNET_DISCONNECTED` console failures and one existing
nondeterministic Menu keyboard-focus failure. It is not reported as passed.

## Layer 3 Surface audit — Batches 1-3 complete

Extends the Button/Card/Text Input baseline above to the rest of the
registry: 3 batches, 23 components checked directly in Figma this session
for the same Surface/content-cascade pattern (color + blur binding at the
master level). Regression check on Button/Card/Text Input ran and passed
clean after every single batch (4 total checks across this session) — no
regressions at any point.

**Batch 1 (11 components — highest contrast risk)**

Fixed:
- Icon Button — reused Button's exact tokens (identical architecture)
- Tag — new `component/tag/surface`
- Badge — 6 new per-style tint-preserving tokens:
  `component/badge/{neutral,primary,success,warning,danger,info}/surface`;
  each style keeps its own color identity at reduced opacity in Glass rather
  than collapsing to generic white
- Alert — new shared `component/feedback/{info,success,warning,danger}/surface`
  family; caught a naming mismatch mid-fix — the "Error" variant maps to the
  "danger" token family, not a literal "error" key
- Toast — reused Card's tokens (a different visual style from Alert despite
  being in the same category)
- Menu — Panel + Item hover fixed. **Corrected 2026-08-13:** the private
  reusable `Navigation/Menu Panel` master does exist (`2181:216`), alongside
  the Menu Item set (`2024:3015`). It owns
  `component/menu/panel-surface` (`2142:208`),
  `component/menu/panel-border` (`2142:209`), and
  `component/surface/blur` (`2057:13`). Earlier wording that the treatment
  lived only on an example frame was stale. This private Figma building
  block does not automatically imply a public React Panel component.
- Popover, Dialog, Drawer — all reused Card's tokens

**Batch A correction — 2026-08-13:** live master re-verification and React
browser parity are complete for Dialog (`2044:25869`), Drawer
(`2044:25965`), Accordion (`2044:25807`, variants `2044:25805` /
`2044:25806`), and Empty State (`2044:26158`). React now consumes one shared
Card-family contract: solid Card surface in Flat/Gradient, 12% white in
Glass, 16px Glass blur, Card border where present, and Surface-aware muted
content. Dialog uses the live three-stop Card highlight border; Drawer and
Empty State have no container border. Decorative React-only elevation was
removed because none of the four live masters contains a drop shadow. This
closes Batch A only, not Layer 3 Surface overall. A broader foundation drift
remains recorded rather than hidden locally: React icon-muted is `#A0A2AC` vs
live Figma `#A0A3AC`. Foundation primary/secondary are now synced to the live
values (`#17181B` / `#5B5F68`).

**Batch B correction — 2026-08-13:** live master re-verification and React
browser parity are complete for Toast (`2034:25468`, masters
`2034:25464–2034:25467`) and Alert (`2034:25402`, masters
`2034:25398–2034:25401`). Toast now consumes the shared Card surface,
Card border, and 16px Glass blur contract; its status changes only the icon,
not the container. Alert remains intentionally distinct, using its four
feedback-tinted surfaces (45% tint in Glass), 16px Glass blur, and no border.
Both use semantic primary content plus the Surface-aware muted cascade where
bound. Neither live component family has elevation or alternate opacity.
React retains one shared structural `FeedbackSurface`, with separate internal
surface roles rather than duplicating the layout or public APIs. This closes
Batch B only, not Layer 3 Surface overall. Broader semantic feedback-color
drift remains open; the exact live icon colors are intentionally scoped to the
Alert/Toast component contract rather than changing global semantic feedback
tokens in this batch.

**Batch C correction — 2026-08-13:** live master re-verification and React
browser parity are complete for File Upload (`2024:2649`; Empty `2024:2644`,
Dragging `2024:2645`, Error `2024:2646`, Disabled `2024:2647`, Filled
`2024:2648`) and List Item (`2044:26095`; Default `2044:26093`, Hover
`2044:26094`). File Upload now consumes the shared Card surface/border and
16px Glass blur contracts for its normal states, preserves the verified
feedback borders, uses the dedicated dragging surface, and applies Disabled's
40% opacity to the whole dropzone without substituting disabled container
colors. Its Filled file list uses the Card shell and Figma-style row dividers;
React intentionally keeps the replacement dropzone visible above that list as
an interaction-first extension. List Item Default is transparent with no blur,
border, or elevation; only Hover consumes `component/menu/item-hover` and the
16px Glass blur, while subtitle/meta content follows the Surface-aware muted
cascade. The existing Flat-equivalent Gradient behavior is preserved; the
separate Gradient-direction decision is not part of Batch C. This closes Batch
C only, not Layer 3 Surface overall. The shared Menu-hover correction was
independently checked against live Menu Item Hover `2024:3012` and Selected
`2024:3013`: `component/menu/item-hover` (`2142:210`) resolves `#F7F7F8` in
Flat/Gradient and `#FFFFFF33` (20%) in Glass. Rendered coverage across Menu,
List Item, and Tree Item consumers passed 9/9, and the complete focused Menu
behavior suite passed 14/14 with no deterministic Menu or Tree regression.

**Glass parity follow-up Batch 1 — 2026-08-14:** Figma replaced direct
semantic-surface bindings on Credit Card Field (`2024:2710–2024:2713`) with
`component/text-input/surface` plus the shared 16px Glass blur, and on Dropdown
Trigger (`2025:3339–2025:3342`) with the Secondary Button surface plus that
same blur. React has no distinct Credit Card Field, while Dropdown Trigger is
composition through `MenuTrigger` and an existing Secondary Button, so neither
requires a new public primitive or duplicate Glass recipe. Sidebar Nav Hover
(`2025:3512`) and Active (`2025:3513`) now use the shared Menu Item Hover
surface: `#F7F7F8` in Flat/Gradient and 20% white in Glass, always without
blur. Hover remains Gradient-free because it is transient; Active retains the
shared Gradient overlay because it is persistent. This records the
role-specific rule: input/control Glass surfaces can use translucent fill plus
16px blur, while Menu/Sidebar navigation highlights are translucent without
blur. Sidebar also follows the shared control Shape radius (`0px` Sharp,
`6px` Rounded, `8px` Squircle) rather than owning a fixed Rounded radius. No
Foundation or Gradient token changed in this follow-up.

**File Upload Error Gradient correction — 2026-08-14:** live Figma Error
master `2024:2646` keeps the neutral `component/card/surface`
(`2128:1499`) base and shared `component/surface/blur` (`2057:13`), while
danger border `2002:2468` and danger content carry the error semantics. Error
therefore now participates in the same fixed `90deg` additive Gradient as
Empty and Filled without replacing the neutral base or introducing an
error-specific recipe. The canonical matrix is Gradient YES for Empty,
Filled, and Error; NO for transient Dragging and dimmed Disabled. Flat and
Glass remain visually unchanged.

Marked not-applicable:
- Link — zero fill across all 45 variants, nothing to cascade
- Tooltip — user decision: stays fixed-dark always, doesn't participate in
  Surface mode

Flagged, not fixed:
- Badge's and Alert/Toast's tint tokens hold identical values under
  different names (`component/badge/danger/surface` vs
  `component/feedback/danger/surface`) — a consolidation opportunity for a
  future cleanup pass, deliberately not touched now to avoid re-risk
  mid-batch

**Batch 2 (12 components — form and interactive controls)**

Fixed:
- Select, Combobox (+ its listbox demo panel built earlier this session),
  Search Field
- Date Picker — trigger + separate Calendar Grid popup panel (two distinct
  surfaces)
- Textarea — all reused Text Input's tokens
- File Upload — reused Card's tokens for Empty/Disabled/Filled; new
  `component/file-upload/dragging-surface` for the Dragging state, whose
  accent border was deliberately left untouched (same treatment as Error's
  danger border)
- Pagination/Page Item — Figma's 32px Current state reused Button's primary
  background + `component/surface/content`, while Hover reused Menu's
  item-hover token. React originally shipped Current on an unrelated
  neutral/elevated family; the completed 2026-08-11 parity batch corrected
  Current and verified Default, Hover, Disabled, and Ellipsis as well. See
  the closed-scope Layer 3 React parity section above.

Marked not-applicable:
- Checkbox, Radio, Switch — user decision: ~16-24px indicators, blur would
  be nonsensical at that scale
- Radio Group — no Figma component exists, correctly so: it's a pure
  fieldset/legend semantic wrapper with no visual surface of its own
- Tabs — zero fill anywhere in the structure, same as Link

**Batch 3 (12 components — containers and content)**

Fixed:
- Accordion Item and Empty State — both had a raw hardcoded white fill, not
  even bound to a semantic token; found and fixed, reused Card's tokens
- List Item — reused Menu's item-hover token
- Avatar — 24-48px, reused Button's primary background +
  `component/surface/content` for initials text
- Table — superseded 2026-08-14 by reusable canonical Table/Row/Cell masters;
  React now matches the locked Flat-only, 12px Rounded-only contract
- Calendar Day — 32px "Selected" state, same solid-brand pattern as Page
  Item, same token reuse

Marked not-applicable:
- Divider — 1px thick, blur nonsensical
- Skeleton — user decision: loading placeholder, not themed content, stays
  neutral gray regardless of theme
- Progress Bar and Spinner — same functional-indicator rationale as
  Skeleton, small/thin scale
- Breadcrumb — zero fill anywhere, same as Link/Tabs

Calendar Grid: no separate component exists — already covered by the same
panel fixed for Date Picker in Batch 2.

**Open items carried forward** (not closed by this audit):
1. Dropdown Menu / Combobox / Command Menu floating-panel consolidation is
   future cleanup, not part of the Menu Panel correction. The reusable
   private Menu Panel master itself is confirmed present and correct.
2. Badge and Alert/Toast maintain duplicate tint tokens with identical
   values under different names — a future consolidation opportunity, not a
   correctness bug (Batch 1)

## Active roadmap

### Phase roadmap (canonical)

This is the canonical phase sequence. Do not duplicate it elsewhere — link
here instead.

| Phase | Status |
|-------|--------|
| Figma Presentation V2 | ✅ Complete (frozen) |
| Agent Kit AK-0 Architecture | ✅ Complete |
| Agent Kit AK-1 Contracts + Compiler | ✅ Complete |
| Agent Kit AK-2 Universal Agent Skill | ✅ Complete |
| Agent Kit AK-3 Retrieval + Project Context | ✅ Complete |
| Agent Kit AK-4 Recipes / Feature Kits | ✅ Complete |
| Agent Kit AK-5 Evaluations | ✅ Complete |
| Agent Kit AK-6 Public Beta | ✅ Complete |
| OS-0 Open Source Readiness | ✅ Complete (READY FOR OS-1) |
| OS-1 Security Gate (Next.js upgrade) | ✅ Complete (PASSED — 0 critical/high/moderate/low, full and production scope) |
| **OS-1 Open Source Launch** | **← CURRENT — READY TO RESUME from the visibility change (Part 8)** |
| Community / Beta Stabilization | Planned |
| Skrewww Guard | Later — not next |

**Next required step: resume OS-1 from the visibility change (Part 8)** —
the Next.js security blocker (2 critical unauthenticated-RCE advisories
surfaced by enabling Dependabot) is resolved; Next.js is now `16.3.5`, and
`npm audit` is clean. Guard is no longer the next milestone regardless — it
sits behind the open-source track and Beta stabilization. See
[`docs/open-source-readiness.md`](open-source-readiness.md) for the full
audit result and current launch-checklist state.

### Component/distribution work (parallel track)

**Scope discipline — "do not expand sideways" clarified**: this phrase governs starting **new React component/product scope** (new components, new industries, new product surfaces) — it does not apply to distribution work on components that are already built. The primary track (the Figma Surface/parity follow-ups and Timeline-class work below) remains the priority when choosing where to spend limited attention. shadcn distribution packaging (Card, Text Input, and future already-built components) is an explicitly allowed **parallel track**, not a violation of that discipline — it is distribution hardening on already-shipped components, not new component expansion, and it is not blocked or deferred by the primary track.

1. **File Upload token verification** — diff the Filled/Empty/Dragging/Error/Disabled variants' token bindings against `file-upload.module.css`'s Temporary aliases now that the component set (`2024:2649`) and both single-file and multi-file anatomy are confirmed
2. **Coherent Table-family Free port** — Free currently has no Basic Table family; Column Header and Data Table presentation stay deferred until Table/Header Row/Body Row/Cell port together. Technical sequencing, not Pro-exclusive gating
3. Infrastructure and source-of-truth maintenance — ongoing

Keep only if they become product requirements (not active work):

- Checkbox compact/label-visibility if the empty-label table-selection override becomes authoring-fragile
- Data Table Row only if selected/hover chrome or denser action rows are required

## Source-of-truth rules

| Topic | Authority |
|-------|-----------|
| React implementation status | Canonical registry + public exports + tests/build |
| Figma design status | Figma MCP when successful; otherwise marked unresolved |
| Token values in React | `styles/tokens.css` |
| Token values in Figma | Figma variables when MCP-verified |
| Volatile counts | This file + registry-derived tests |
| Durable principles | Standing instruction files + architecture docs |
| Canonical URLs | `NEXT_PUBLIC_SITE_URL` at deploy time |

**Deferred:** treating README prose counts as authoritative without registry derivation.

**Unresolved:** current Figma variable/collection totals until MCP succeeds.
