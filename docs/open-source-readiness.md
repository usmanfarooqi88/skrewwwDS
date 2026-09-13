# Open source readiness (OS-0 / OS-1)

**OS-0 audit date:** 2026-09-13 · **Audited commit:** `2d7208b` ·
**Repository visibility:** still PRIVATE

**OS-0 verdict:** READY FOR OS-1, conditional on three human decisions — all
three resolved (see [Blockers and decisions](#blockers-and-decisions)).

**OS-1 status: Security Gate PASSED — CURRENT / READY TO RESUME from the
visibility change.** All launch prep (domain cleanup, community files, CI,
Dependabot opt-in) is complete and pushed. Enabling Dependabot surfaced 2
critical unauthenticated-RCE advisories in the pinned Next.js version — new
information not available when OS-1 was scoped. Human decision: fix Next.js
in a separate task before making the repository public. That task is done:
Next.js was upgraded `16.2.10 → 16.3.5` and the full dependency tree now
audits clean (`npm audit`: 0 critical/high/moderate/low, both full and
production scope). See
[Security gate resolved](#security-gate-resolved-next-js-upgraded-1626-1316-3-5)
for the full record. The repository remains PRIVATE — the visibility change
itself was intentionally deferred to a follow-up task for a clean audit
trail.

This is a technical readiness audit, not legal advice. See
[`docs/project-status.md`](project-status.md#phase-roadmap-canonical) for the
canonical phase roadmap.

## Intended public scope

Open-sourced under MIT:

- React/TypeScript component library and CSS/token foundations
- The documentation platform (Next.js app)
- Tests (Vitest + Playwright) and eval harness
- Registry and shadcn distribution infrastructure
- Agent Kit: contracts, compiler, Skill, ProjectContext, Recipes/Feature Kits
- Development tooling and scripts

Public but **generated at build time** (never tracked): `public/agent/*`,
`public/r/*`, `.next/`, the local Claude Skill adapter.

Explicitly **not** in the repository and not covered by its MIT grant: paid
Figma Pro source/assets, Gumroad deliverables, credentials, and any private
business material. See [`docs/licensing.md`](licensing.md).

## Current-tree exposure audit

595 tracked files. No tracked binaries, archives, databases, logs, certificates,
or key material — the only tracked non-source extensions are `.svg` (5 brand
assets), `.json`, `.md`, `.css`, and config files.

| Area | Classification |
|---|---|
| `components/`, `lib/`, `app/`, `styles/`, `content/`, `e2e/`, `scripts/`, `agent/` | PUBLIC-SAFE |
| `docs/` (architecture, getting-started, contributing, audits) | PUBLIC-SAFE |
| `evals/agent-kit/` (cases, fixtures, 3 runs) | PUBLIC-SAFE — see [Evaluation artifacts](#evaluation-artifacts) |
| `public/*.svg` (brand assets) | PUBLIC-SAFE-WITH-DOC-CHANGE — covered by `TRADEMARKS.md` |
| `lib/*-figma-metadata.ts`, some `docs/architecture/*` (Pro Figma file key) | **REVIEW-REQUIRED** — see decision 2 |
| `skrewww-*-instructions.md` (3 root files) | PUBLIC-SAFE — durable technical rules, no private business content |
| `.env.example` | PUBLIC-SAFE — placeholders only, secrets clearly marked server-only |

**Fixed during OS-0:** `evals/agent-kit/runs/ak5-v2-.../metadata.json` contained
28 `transcriptPath` values exposing a local macOS username, home-directory
layout, and Cursor session paths. Removed at HEAD, which also makes v2's
schema match v3 (v3 never recorded the field). Verified this does not touch
AK-5 evidence: the scorer reads only `sourceGitSha`, `modelIdentifier`,
`executionEnvironment`, `isolationNotes`, `sourceGitCommitTimestamp`, and both
recorded report SHA-256 values still match exactly
(`55e2c92b…`, `87710e00…`).

## Git history audit

**Methodology.** 168 commits across all refs. Checked: (1) every path ever
added, filtered for non-source file types; (2) every path ever touched,
matched against credential/archive/key/database filename patterns; (3) all
added lines in full history against high-confidence vendor credential formats
(OpenAI, GitHub PAT/OAuth, AWS, Google, Slack, Figma, PEM private keys, JWTs);
(4) all added lines against broad `secret|password|api_key|token = "…"`
assignment shapes; (5) all added lines for absolute `/Users/` paths.

**Findings.**

| Check | Result |
|---|---|
| Non-source file types ever added | Only `.eslintignore`, `.gitignore`, `.node-version` |
| Credential/key/archive/db filenames ever committed | None |
| High-confidence credential patterns | **0 hits** |
| Broad secret-assignment patterns | **0 hits** |
| Absolute `/Users/` paths | 28 hits, all from the single v2 eval metadata file above |

**No credential exposure was found anywhere in history.** No secret values
appear in this document by design.

**Residual:** the 28 personal-path strings remain in history even though HEAD
is now clean. They are not credentials — they reveal a username, a local
directory layout, and Cursor session UUIDs that point at files no external
party can access. Publishing with them intact is a low-severity privacy
disclosure, not a security incident.

**No history rewrite was performed or attempted.** `filter-repo`,
`filter-branch`, BFG, and force-push are explicitly out of scope for OS-0 and
require separate human approval.

## Secret and config audit

- `.env.example` uses placeholders throughout and documents which variables are
  server-only secrets (`VERCEL_API_TOKEN`, `VERCEL_PROJECT_ID`, `VERCEL_TEAM_ID`)
  versus public-by-design (`NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_SITE_URL`).
- Env vars referenced in source are limited to site URL/origin, GA measurement
  ID, Vercel analytics credentials (server-only), and CI/Playwright/Node config.
- Test fixtures use obviously fake values (`prj_test123`, `team_test456`).
- `.gitignore` covers `.next/`, `public/r/`, `public/agent/`, `.claude/`, and
  env files. A full production build in a fresh clone leaves `git status` clean.
- Generated Agent Kit artifacts remain covered by the existing AK-3/AK-6
  leakage tests (absolute paths, env references, credential-shaped strings,
  provenance field allow-list).

## Third-party licenses and assets

505 packages resolved in the installed tree: 425 MIT, 28 Apache-2.0, 25 ISC,
13 BSD-family, plus a small reciprocal set consumed as ordinary dependencies —
`axe-core` and `lightningcss` (MPL-2.0) and `@img/sharp-libvips-*`
(LGPL-3.0-or-later, an optional platform binary via Next.js image
optimization). All 26 direct dependencies are MIT or Apache-2.0. No copyleft
code is vendored or copied into this repository.

No third-party source has been copied in and relicensed. Phosphor icons are an
npm dependency; `components/ui/icons.tsx` holds original SVG primitives. Fonts
(Inter, JetBrains Mono) are fetched and self-hosted at build time via
`next/font/google` under the SIL Open Font License — no font binaries tracked.

Full detail: [`docs/licensing.md`](licensing.md).

## Licensing and trademark

- [`LICENSE`](../LICENSE) — MIT, `Copyright (c) 2026 Usman Farooqi`. Sole human
  author across all 168 commits (two git identities, same person), so there is
  no third-party contributor rights complication.
- `package.json` now declares `"license": "MIT"` (previously unset, which is
  also why GitHub reported no detected license).
- [`docs/licensing.md`](licensing.md) — the MIT/dependency/brand/commercial boundary.
- [`TRADEMARKS.md`](../TRADEMARKS.md) — fork freely, don't impersonate; logos
  and the Skrewww name are not granted by the code license.
- `package.json` keeps `"private": true` — no accidental npm publish.

## Free vs. Pro commercial boundary

The repository contains **no** paid Figma source, exported Pro asset, or
Gumroad deliverable. The public homepage already links to Gumroad
(`usmanfarooqi.gumroad.com/l/skrewww-pro`) as a storefront CTA — that URL is
intentionally public and is not a new exposure.

`docs/licensing.md` and `TRADEMARKS.md` both state plainly that MIT covers the
code only, so open-sourcing cannot be read as "everything Skrewww makes is now
free."

**Open item:** terms for the Free Community Figma file have not been decided
and are deliberately not asserted anywhere.

## Community files

| File | Status |
|---|---|
| `LICENSE` | Added (MIT) |
| `CONTRIBUTING.md` → `docs/contributing.md` | Existing, single canonical source, no duplication |
| `CODE_OF_CONDUCT.md` | Added — reporting route flagged as an open item |
| `SECURITY.md` | Added — vulnerability vs. bug distinction; reporting route flagged |
| `TRADEMARKS.md` | Added |
| `docs/licensing.md` | Added |
| `.github/workflows/ci.yml` | Added |
| `.github/ISSUE_TEMPLATE/` | Added — bug, Agent Kit, docs, feature + config |
| `.github/pull_request_template.md` | Added |

## CI

`.github/workflows/ci.yml` runs on pushes to `main` and all pull requests:
`npm ci --ignore-scripts` → lint → typecheck → Vitest → build (which also runs
both generators) → a check that the build leaves `git status` clean, catching a
contributor who commits generated artifacts. One job, one install, cancel-in-progress
concurrency. No Guard, no design-system enforcement — that remains future work.

This is the repository's first CI; none existed before OS-0.

## Fresh-clone validation

A clean `git clone` into a temporary directory, with no `.env`, no untracked
helpers, and no access to private Figma:

| Step | Result |
|---|---|
| `npm ci` | Pass |
| `npm run lint` | Pass |
| `npm run typecheck` | Pass |
| `npm test` | **987/987 (105 files)** |
| `npm run build` | Pass |
| Generators (via build) | 57 files in `public/agent/`, 9 in `public/r/` |
| `git status` after build | Clean — generated artifacts correctly ignored |

A new contributor can clone, install, test, and build with no secrets and no
dependency on the maintainer's machine.

## Evaluation artifacts

Three AK-5 runs (~460 KB total) are tracked: `cases.ts`, `fixtures.ts`,
`prompt-generator.ts`, and per-run `metadata.json`, `report.json`,
`SUMMARY.md`, and `off/`+`on/` case outputs.

**Decision: keep them public.** They are reproducibility evidence for the
published Beta evaluation claim, contain only this project's own prompts and
model-generated JSON about Skrewww's own components, and include no customer,
personal, or third-party content. A scan for personal-data patterns produced
one match — the literal string "Enter a valid email address." inside a
generated form example.

The only real issue was the v2 `transcriptPath` leak, fixed at HEAD above.

## Generated artifact policy

Contributors must not commit these — all are produced by `npm run build`:

| Path | Produced by |
|---|---|
| `public/agent/**` (contracts, index, system, recipes, feature kits, Skill copy) | `npm run generate:agent-context` |
| `public/r/**` (shadcn manifests) | `npm run generate:registry` |
| `.next/`, `.next-playwright/` | `next build` |
| `.claude/skills/skrewww-ui/SKILL.md` | `npm run install:agent-skill` |

All are gitignored, and CI fails if a build dirties the tree.

## Public documentation audit

No `ask the maintainer`-style internal instructions, no session transcripts, no
credentials, no private URLs, and no `localhost` presented as production in
tracked docs. Personal filesystem paths: none remaining at HEAD.

**Finding (non-blocking):** domain references are inconsistent — 29 mentions of
`skrewww.com`, 14 of `skrewww.dev` (the `siteConfig` production fallback), and
the GitHub repository homepage field points at `skrewww-ds.vercel.app`. Three
different claimed domains will confuse external readers. Worth reconciling
before or at launch.

## AK-6 feedback path resolution

AK-6 deliberately left the public feedback path unresolved because no public
channel existed. **Prepared in OS-0; activates in OS-1** when repository
visibility changes:

- Issues are already enabled on the repository.
- Four issue templates plus a config with a security contact link are in place.
- The `/agent-kit` page's Feedback section and `SECURITY.md` must be updated to
  point at the public tracker **as part of the OS-1 launch commit**, not before
  — the channel is not live while the repository is private.

## shadcn registry directory readiness

Not submitted, and not to be submitted during OS-0. Assessment only:

shadcn's public Registry Directory lists open-source-compatible registries.
Skrewww already serves namespaced items (`@skrewww/<name>` → `/r/<name>.json`)
and item-level `view`/`add` are proven working. The known gap recorded in AK-3
still applies: **Skrewww does not publish a `/r/registry.json` index**, which
shadcn's own list/search tooling expects for browsing a registry. That is very
likely a prerequisite for a useful directory listing.

Deliberately **not** built in OS-0 — it is distribution-surface work, not
open-source-readiness work. Revisit after OS-1.

## Blockers and decisions

Items 1–3 below were resolved by human decision during OS-1 (see
`docs/project-status.md`'s OS-1 entry): item 1 accepted (no history
rewrite), item 2 accepted conditional on Figma Pro sharing staying
restricted, item 3 resolved as GitHub Issues (product feedback) + GitHub
Private Vulnerability Reporting (security, enabled once public) with no
invented email address. The domain inconsistency was also resolved in
OS-1 — `skrewww.com` is now the single canonical domain everywhere.

1. **Git history retains 28 personal-path strings** (username, home-directory
   layout, Cursor session UUIDs) in one eval metadata file. HEAD is clean.
   **Decision: accept as low-severity. No history rewrite.**
2. **The Pro Figma file key appears in 16 tracked files** (`lib/*-figma-metadata.ts`
   and architecture docs) as parity metadata. A file key is not a credential
   and Figma enforces access server-side, but publishing it reveals the paid
   file's identity and would matter if that file's sharing were ever loosened
   to "anyone with the link." **Decision: accept, conditional on Figma Pro
   sharing remaining restricted — HUMAN CONFIRMATION REQUIRED that the Pro
   file's current sharing setting is actually restricted before or
   immediately after launch; this was not independently re-verified via
   Figma API/MCP in this pass.**
3. **No private security/conduct reporting channel exists.** GitHub private
   vulnerability reporting returned 404 pre-launch (public-repo-only).
   **Decision: enable GitHub PVR immediately after the repository becomes
   public; product feedback goes through GitHub Issues.** Conduct reports
   have no dedicated private channel yet — `CODE_OF_CONDUCT.md` says so
   honestly rather than inventing an address; this remains an explicit
   admin follow-up, not a launch blocker.

### New blocker found during OS-1 — launch paused

**Enabling Dependabot vulnerability alerts (an OS-1 step) surfaced 20 open
alerts: 2 critical, 10 high, 8 moderate.** The two critical findings are
unauthenticated RCE advisories against the pinned Next.js version
(`16.2.10`) — one via the Image Optimization API when AVIF files are used,
one on Windows-hosted servers. The remaining alerts are mostly other Next.js
CVEs (SSRF in Server Actions/rewrites, cache confusion, DoS) plus a handful
in `sharp`, `js-yaml`, `browserslist`, `nanoid`, and Vitest's mocker
(dev-only).

This was not known when OS-1 was scoped — dependency vulnerability
remediation is explicitly out of scope for an open-source *readiness* task,
and upgrading Next.js right before a public launch, untested, was judged too
risky to do inline. **Human decision: pause the launch. Fix Next.js first,
in a separate task, then resume OS-1.**

**The repository visibility change (Part 8 of the OS-1 launch) was
NOT performed.** Everything before it — domain cleanup, community files,
CI, Dependabot/security-fix opt-in, label creation — is complete and
pushed. The repository remains PRIVATE.

### Security gate resolved (Next.js upgraded 16.2.10 → 16.3.5)

**Verdict: OS-1 SECURITY GATE PASSED.** Verified via GitHub's Security
Advisory API for `vercel/next.js` that `16.3.3` is the authoritative patched
floor for both Critical RCE advisories, and that `16.3.5` was the current
stable (non-preview) 16.x release at execution time. Updated `next` from an
exact pin `16.2.10` to `^16.3.5` in `package.json`; `npm install` naturally
bumped Next's own bundled `sharp` (0.34.5→0.35.4) and `@next/swc-*`/
`@swc/helpers` platform packages in `package-lock.json` — no direct action
taken on `sharp` itself, no unrelated dependency upgraded. React/react-dom
were untouched (`^19.2.7`) — the chosen Next.js version did not require a
bump and no advisory forced one.

After the Next.js upgrade, three findings remained in scope for adjudication
per the task's "don't automatically waive HIGH findings" rule. All three had
a same-major patched version already inside the range their parent package
had declared, so each was applied as a plain `npm update <pkg>` (zero
`package.json` changes beyond the `next` line):

- `nanoid` 3.3.17→3.3.19 (HIGH, production-scope — pulled in by `postcss`,
  which already declared `^3.3.17`)
- `baseline-browser-mapping` 2.10.42→2.11.23 (MODERATE, production-scope —
  pulled in directly by `next` itself, which already declared `^2.9.19`)
- `browserslist` 4.28.5→4.28.9 and `js-yaml` 4.3.1→4.3.2 (both HIGH,
  dev-only — via `autoprefixer`/`eslint-config-next` and `eslint`
  respectively; fixed opportunistically since the patch was free and
  in-range, even though dev-only findings weren't launch-blocking)
- `vitest`/`@vitest/mocker` 4.1.10→4.1.11 (MODERATE, dev-only, direct
  devDependency — one of the original 20 flagged packages, not an unrelated
  upgrade; already inside the declared `^4.1.10` range)

**Result: `npm audit` (full tree) = 0 critical / 0 high / 0 moderate / 0
low. `npm audit --omit=dev` (production/runtime scope) = 0 findings of any
severity.** Both original Critical Next.js RCE advisories are confirmed
resolved. Dependabot alerts and automated security fixes remain enabled
(not disabled to make the launch look clean); GitHub's alert list will
re-scan and clear once this fix is pushed.

Full validation re-run clean after the upgrade: lint clean, typecheck
clean, Vitest 987/987, production build succeeded with all expected public
outputs (`/agent/*`, `/r/*`, `/agent-kit`, `/registry.json`, `/llms.txt`,
`/sitemap.xml`), Playwright 376/376 (one timeout flake in a full-worker run
was confirmed non-reproducing both in isolation and in a reduced-worker
full run — CPU contention on this machine, not a Next.js regression),
`smoke:consumer` 13/13, and a `next start` HTTP smoke covering all expected
200/404 paths plus the `next/image` optimization endpoint 13/13. One
pre-existing, non-blocking deprecation warning (`app/opengraph-image.tsx`'s
`export const runtime = "edge"`, new in Next 16.3.x) was left untouched per
the no-speculative-edits rule — it does not fail the build.

`eslint-config-next` remains pinned at its own devDependency version
(`^16.2.10`) — untouched, since bumping it was not required by any
advisory and is out of scope for a narrow security fix.

## OS-1 launch checklist

Repository settings:

- [x] Resolve decisions 1–3 above
- [x] Fix the 2 critical Next.js RCE advisories — resolved in the OS-1 Security Gate task: Next.js upgraded `16.2.10 → 16.3.5`, `npm audit` now 0 critical/high/moderate/low (full and production scope)
- [ ] Change visibility to public
- [ ] Enable private vulnerability reporting (Settings → Code security) — confirmed available once public
- [x] Enable Dependabot alerts + security updates — enabled in OS-1 (this is what surfaced the Next.js blocker)
- [ ] Enable secret scanning and push protection — confirmed unavailable while private (`422 Secret scanning is not available for this repository`); retry once public
- [ ] Add branch protection / ruleset on `main` (require the CI check; no force-push) — confirmed unavailable while private (`403 Upgrade to GitHub Pro or make this repository public`); retry once public
- [ ] Set repository topics (e.g. `design-system`, `react`, `typescript`, `shadcn`, `ai-agents`) — currently empty, not yet set
- [ ] Fix the homepage field (currently `https://skrewww-ds.vercel.app`) to `https://skrewww.com`
- [x] Confirm GitHub detects the MIT license on the repository page — confirmed via API (`license.spdx_id: "MIT"`)
- [ ] Decide whether to enable Discussions (currently off)
- [x] Create the `agent-kit` label referenced by the Agent Kit issue template (didn't exist; created, color `#6C4CF2`)

Content updates for the launch commit (not yet made — repo still private):

- [ ] `SECURITY.md` — real reporting route (GitHub PVR)
- [ ] `CODE_OF_CONDUCT.md` — real reporting route, or continue stating the gap honestly
- [ ] `/agent-kit` Feedback section — point at the public issue tracker
- [ ] `docs/project-status.md` — mark OS-1 complete, OS-0 superseded
- [x] Reconcile domain references — resolved in OS-1: `skrewww.com` is the single confirmed canonical domain; `PRODUCTION_FALLBACK_ORIGIN` in `lib/site-config.ts` and all doc/instruction references to the `.dev` fallback were updated to match (dated audit records in `docs/audits/` intentionally left as historical, unedited findings)

Verification before announcing:

- [x] CI green on a real pull request-equivalent push — the `ci.yml` workflow ran successfully on the OS-0 push (`da593ab`) before this pass even started
- [ ] Fresh public clone: install → lint → typecheck → test → build — done against local `main` in OS-1 (987/987, clean build); re-run against the actual public URL once visibility flips
- [ ] Issue templates render correctly in the GitHub UI
