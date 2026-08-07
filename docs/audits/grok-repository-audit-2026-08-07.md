# Skrewww Repository Audit

Audit date: 2026-08-07
Auditor: Cursor Grok
Repository commit: `eba2151edc82290f154b7bb53aa4b0cc8ad946d4` ("Figma links updated with fixes", 2026-08-06)
Working tree at start: clean (`git status --short` empty)
Audit scope: full repository — implementation, tests, docs, SEO/LLM outputs, security, performance, distribution readiness, per the audit brief's 12 phases
Implementation changes made: None

---

## 1. Executive summary

**Overall assessment.** The React implementation is in genuinely good shape: 47/47 registry-claimed components actually exist and pass their own tests, the real (uncontaminated) quality gates are clean, and several architectural decisions — the controlled/uncontrolled hook, Table/Data Table's compose-not-replace boundary, the React 19 ref-as-prop migration, native-first form semantics — are well-executed and internally consistent. The documentation layer, however, has drifted in specific, verifiable ways: at least one flatly incorrect claim (Combobox's Figma node ID called "pending" in README when it has been confirmed since 2026-07-13), one durable instruction file that has never been updated to acknowledge the Banking pilot's existence, a self-contradiction inside the public, LLM-facing `/llms.txt` output, and a public "0 vulnerabilities" security claim that is no longer true today. The single highest-leverage infrastructure problem found is that neither `eslint.config.js` nor `vitest.config.ts` exclude `.claude/**`, so a stray local worktree currently makes `npm run lint`, `npm test`, and `npm run test:all` all report false failures/inflated counts — this has already caused confusion once before (see AUDIT-001) and will recur for any future contributor or agent who leaves a worktree behind.

**Release readiness.** The product itself (React components, build, real test suite) is release-ready at Beta scope, as it already claims to be. Two things should block calling the *quality-gate story* trustworthy until fixed: the lint/test contamination (AUDIT-001) and the current `npm audit` findings (AUDIT-002). Neither is a defect in shipped component code.

**Strongest areas:** the registry-as-single-source-of-truth architecture (verified: registry counts, indexable-slug counts, redirect aliases, and public registry schema all cross-check exactly against source); the controlled-state hook and its dev-mode controlled/uncontrolled-drift warning; Table vs. Data Table's genuinely-enforced "composition, not a grid widget" boundary; the already-diagnosed-and-fixed date-rollover test flakiness (verified still fixed today, independently, not just re-cited).

**Highest risks:** stale/incorrect public-facing claims (Combobox Figma status in README, Layer 4 status in README/`llms-content.ts`/standing instructions, "0 vulnerabilities" in project-status.md), and the lint/test hermeticity gap.

**Findings by severity:** Critical: 0 · High: 4 · Medium: 8 · Low: 5 · Observations: 9.

**Confidence and audit limitations.** All quality-gate results in Section 3 were executed live during this audit, not inferred from documentation. Figma-side facts are taken only from the repository's own recorded MCP-verification metadata (`lib/*-figma-metadata.ts`) — this audit did not have Figma MCP access and did not independently re-verify any Figma node, so all Figma facts here are "the repo's own recorded state is internally consistent/inconsistent," never "Figma actually shows X." Accessibility and styling audits (Phases 6–7) were spot-checks of representative components (Dialog/Popover/Combobox/Table/Switch/feedback-surface, plus the shared hooks and token files) rather than an exhaustive per-component pass across all 47 implemented components — this is stated explicitly wherever coverage was partial.

---

## 2. Verified repository baseline

| Metric | Verified value | Evidence |
|---|---:|---|
| Package name / version | `skrewww-docs@0.2.0-beta` | `package.json:2-3`; `npm run verify:package` |
| Next.js | `16.2.10` | `package.json:31` |
| React / React DOM | `^19.2.7` | `package.json:32-33` |
| TypeScript | `^5.5.4` | `package.json:56` |
| Node engine requirement | `>=20.19.0` | `package.json:6`; matches `.nvmrc` and `.node-version` (both `20.19.0`) |
| Actual Node used this audit | `v24.14.0` | `node --version`; satisfies `>=20.19.0` |
| Registry entries (`lib/component-registry.ts` + category files) | 47 | Computed live via `componentRegistry.length` |
| Entries with `hasImplementation: true` | 47 (100% of registry) | `getImplementedComponentCount()` |
| Figma-documented components (`lib/data.ts` `allComponents`) | 63 | Computed live |
| Documentation-only (no React) | 16 | `accordion-item, breadcrumb-item, button-group, credit-card-field, dropdown-trigger, icon-button, menu-item, page-item, phone-number-field, sidebar-nav-item, slider, split-button, step-item, timeline-item, top-nav-item, tree-item` |
| Indexable component slugs | 62 | `getIndexableComponentSlugs()` (`lib/indexing-policy.ts`) |
| Redirect aliases | 2 | `REDIRECTED_COMPONENT_SLUGS` = `form-field-wrapper`, `accordion-item` (`lib/routes.ts:2-5`) |
| Industry components / industries | 3 components, 1 industry (`Banking`) | `banking-transaction-row`, `banking-account-card`, `banking-balance-summary`, all `industry: "Banking"` |
| Duplicate registry slugs | 0 | Checked programmatically |
| `figmaAvailability` breakdown (all 47) | available 40, partial 2, unavailable 5 | Computed live |
| Registry `status` breakdown | all 47 = `"beta"` | Computed live |
| Public registry (`/registry.json`) schema version | `1.3.0` | `lib/registry-public.ts:153`; matches `docs/project-status.md`'s claimed 1.2.0→1.3.0 bump |
| Entries with real CLI-resolution metadata (`dependencies`/`files`/`cssTokens`) | 2 — `button`, `card` only | Confirmed — see AUDIT-011 for accuracy of that data |
| Unit test files (real, tracked) | 79 files / 643 tests | `find` + scoped `vitest run --exclude "**/.claude/**"` (both executed live) |
| Playwright spec files | 24 files / 161 tests | `find ./e2e`; `npm run test:browser` |
| Production build | 81/81 pages | `npm run build`, Turbopack |
| `docs/architecture/react-hooks-lint-debt.md` | **Does not exist** | The audit brief lists it as required reading; `ls docs/architecture/` confirms it is absent. The lint debt it would presumably document is real (see `eslint.config.js:30-48`) but has no dedicated doc — it's explained inline in the ESLint config comment instead. |

---

## 3. Quality-gate results

All commands were run individually, live, in this working tree, with no code changes.

| Command | Result | Exit code | Details |
|---|---|---:|---|
| `node --version` | — | 0 | `v24.14.0` |
| `npm --version` | — | 0 | `11.12.1` |
| `npm run verify:node` | **Pass** | 0 | "Node runtime verified: 24.14.0 (requires >=20.19.0)" |
| `npm run verify:package` | **Pass** | 0 | "Package metadata verified: skrewww-docs@0.2.0-beta" |
| `npm run verify:analytics` | **Fail** as run without credentials; **Pass** once `.env.local`'s documented vars are sourced | 1 → 0 | Fails by design without `VERCEL_API_TOKEN`/`VERCEL_PROJECT_ID` in the shell — the script's own docstring says so and it is deliberately excluded from `test:all`. Re-run with `.env.local` sourced (as the script instructs) succeeded with a real API response: 18 visitors / 92 pageviews, last 7 complete UTC days. Classification: **environment/tooling**, not a product defect. |
| `npm run lint` | **Fail** as literally run | 1 | 97 problems (40 errors, 57 warnings). Root-caused: **100% of the 40 errors and 31 of the 57 warnings come from `.claude/worktrees/sleepy-spence-e6b186/.next-playwright/`**, a stray local build artifact from an unrelated prior session, which `eslint.config.js` does not exclude. Diagnostic re-run with `--ignore-pattern ".claude/**"` → **0 errors, 26 warnings, exit 0** — exactly matches `package.json`'s `--max-warnings 26` and `docs/project-status.md`'s claimed baseline. See AUDIT-001. |
| `npm run typecheck` | **Pass** | 0 | No output; unaffected by the worktree (TypeScript's `**` glob does not match dot-directories by default). |
| `npm test` | **Fail-equivalent (inflated pass)** as literally run | 0 | Reports 154 files / 1233 tests passed — but 75 of those files are the same stray worktree's duplicate test suite (`vitest.config.ts`'s `exclude` also omits `.claude/**`). Diagnostic re-run with `--exclude "**/.claude/**"` added → **79 files / 643 tests, all passing, exit 0**. This is the real number. See AUDIT-001. |
| `npm run test:browser` | **Pass** | 0 | 161/161 Playwright tests passed. Not affected by the contamination (`testDir: "./e2e"` is a fixed path, not a repo-wide glob). |
| `npm run build` | **Pass** | 0 | Turbopack, 81/81 pages generated. One benign warning: "Using edge runtime on a page currently disables static generation" (the `/opengraph-image` route, `ƒ` dynamic — expected for `ImageResponse`-based OG images, not a regression). |
| `npm audit` | **Fail** | 1 | **6 vulnerabilities (1 moderate, 5 high)**: `brace-expansion` (high, DoS), `js-yaml` (high, quadratic CPU), `next` (high — several CVEs including SSRF-via-rewrites and Server Actions DoS, affecting the installed 16.2.10 line; fix requires bumping to `next@16.3.0`, outside the pinned exact-version range), `postcss` (moderate — a *different*, newer advisory than the one already fixed 2026-07-15), `sharp` (high, transitive via `next`), `undici` (high, transitive). Directly contradicts `docs/project-status.md`'s "0 vulnerabilities" claim (dated 2026-07-15). See AUDIT-002. No dependency changes were made per audit rules. |
| `npm run test:all` | **Fail** | 1 | Stops at the `lint` step (composed with `&&`) for the same reason as the standalone `lint` failure above — never reaches `typecheck`/`test`/`test:browser`/`build` in this composed run, even though every one of those gates is independently clean. This is the most visible symptom of AUDIT-001: the one command the project's own rules call "required before claiming a component pass complete" currently cannot complete at all in a working tree with a leftover worktree present. |

---

## 4. Critical findings

None. No security, data-loss, unusable-build, or severe-accessibility-failure class issue was found.

---

## 5. High findings

### AUDIT-001 — `.claude/worktrees/**` is not excluded from lint or unit-test discovery, silently corrupting both gates

- **Severity:** High
- **Confidence:** Confirmed (reproduced live, root-caused with a diagnostic re-run, and cross-confirmed by a prior commit that hit the same issue)
- **Category:** Tooling / release-process integrity
- **Evidence:**
  - `eslint.config.js:5-8` explicitly ignores only `.next-playwright/**`, with a comment claiming `.next/**` etc. are "already ignored by the preset" — no entry for `.claude/**`.
  - `vitest.config.ts`'s `exclude: ["**/node_modules/**", "**/e2e/**", "**/.next/**"]` — same gap.
  - A stray `.claude/worktrees/sleepy-spence-e6b186/` (dated 2026-08-01, gitignored via `.gitignore:40`, not part of tracked source) sat on disk during this audit. It contains its own nested `.next-playwright` build output and its own copy of every `*.test.ts(x)` file.
  - `npm run lint` as literally run: 97 problems (40 errors/57 warnings), exit 1. Parsed programmatically by file block: **all 40 errors and 31 of 57 warnings are inside `.claude/worktrees/...`**; the real repo alone produces exactly 0 errors / 26 warnings.
  - `npm test` as literally run: 154 files / 1233 tests, exit 0 (inflated). `npx vitest run --exclude "**/.claude/**"` (all other config excludes preserved): 79 files / 643 tests, exit 0 (real).
  - This is not a first occurrence: commit `1a3669c` (2026-08-02, "fix(tests): pin dormant date-rollover failures...") independently hit and documented the exact same contamination ("Vitest 590/590 scoped; 1180/1180 raw due to the same worktree duplication... unrelated to this fix") but did not fix the underlying config gap, only worked around it for that one commit's own reporting.
- **Files and lines:** `eslint.config.js:5-8`; `vitest.config.ts` (`exclude` array).
- **Actual behavior:** Any contributor or agent session that creates an isolated git worktree under `.claude/worktrees/` (a supported, expected pattern for this tooling) and leaves it in place will cause every subsequent `npm run lint`, `npm test`, and `npm run test:all` in the main working tree to report wrong, inflated, or failing results — including making the composed `test:all` gate impossible to complete.
- **Expected behavior:** `.claude/**` should be excluded from both ESLint's and Vitest's file discovery, the same way `.next-playwright/**` already is, so quality-gate results depend only on tracked source.
- **User/system impact:** No product impact (nothing shipped is affected), but it directly undermines the trustworthiness of the project's own required-before-claiming-complete gate sequence, and it has already caused confusion once (the 2026-08-02 commit had to manually diagnose and explain it away rather than fix it).
- **Recommended correction:** Add `{ ignores: [".claude/**"] }` to `eslint.config.js`'s ignores array (alongside the existing `.next-playwright/**` entry), and add `"**/.claude/**"` to `vitest.config.ts`'s `exclude` array. Both are one-line, low-risk changes.
- **Suggested verification:** Recreate a stray worktree (or leave one from a real session) and confirm `npm run lint` / `npm test` counts are unaffected after the fix.
- **Related findings:** None.

### AUDIT-002 — `npm audit` currently reports 6 vulnerabilities (1 moderate, 5 high); `docs/project-status.md` claims 0

- **Severity:** High
- **Confidence:** Confirmed
- **Category:** Security / source-of-truth staleness
- **Evidence:** `npm audit` output (Section 3): `brace-expansion` (high), `js-yaml` (high), `next` 9.3.4-canary.0–16.3.0-preview.10 (high — multiple CVEs including SSRF via rewrites, Server Actions DoS, cache-response confusion — the installed `16.2.10` falls inside the affected range), `postcss` (moderate — a different, newer GHSA than the one already remediated on 2026-07-15), `sharp` (high, transitive), `undici` (high, transitive). `docs/project-status.md:67`: "`npm audit` | **0 vulnerabilities** — resolved 2026-07-15 via a `postcss` override."
- **Files and lines:** `docs/project-status.md:67`; live `npm audit` output.
- **Actual behavior:** 6 real, currently-open advisories against installed dependency versions.
- **Expected behavior:** Either the doc's claim is corrected to reflect current reality, or the vulnerabilities are triaged and addressed (the `next` fix requires a version bump outside the current exact-pinned `"next": "16.2.10"`, which is a real decision, not a one-line fix).
- **User/system impact:** The Next.js advisories are legitimately high-severity for a deployed public site (SSRF via attacker-controlled rewrite destinations, Server Actions DoS). This is a live, deployed documentation site (confirmed reachable in a prior working session at `skrewww.com`), so this is not a hypothetical.
- **Recommended correction:** Triage each advisory; for `next`, evaluate upgrading past `16.3.0-preview.10`'s affected range (note the audit's own suggested fix version, `16.3.0`, is itself still inside the vulnerable range string shown — verify the actual first-patched version before upgrading). Do not run `npm audit fix --force` blindly; it will bump `next` outside the currently-pinned exact version. This audit did not modify dependencies per its own rules.
- **Suggested verification:** Re-run `npm audit` after any dependency change and update `docs/project-status.md`'s quality-gate table with a new dated result — do not leave a stale "0 vulnerabilities" claim standing regardless of outcome.
- **Related findings:** None.

### AUDIT-003 — README states Combobox's Figma component-set node ID is still pending; it was confirmed 2026-07-13

- **Severity:** High
- **Confidence:** Confirmed
- **Category:** Source-of-truth contradiction
- **Evidence:** `README.md:155`: "**Figma MCP verification pending** for several parity audits (including Combobox component-set node ID)". `lib/combobox-figma-metadata.ts:8-9`: `COMBOBOX_FIGMA_COMPONENT_SET_NODE_ID: string | null = "2024:2480"` with comment "confirmed via Figma MCP on 2026-07-13". `docs/architecture/combobox-parity.md:9`: same node ID, "Confirmed via Figma MCP on 2026-07-13." `docs/project-status.md:44`: same, plus a later 2026-07-15 update (multi-select removal, option-list anatomy confirmed).
- **Files and lines:** `README.md:155` (incorrect) vs. `lib/combobox-figma-metadata.ts:8-9`, `docs/architecture/combobox-parity.md:9`, `docs/project-status.md:44` (all agree and are correct).
- **Which source is authoritative:** Per `docs/architecture/source-of-truth.md`'s own "Figma status" hierarchy, Figma MCP inspection results (recorded in the metadata file) outrank README prose. The metadata file, parity doc, and project-status.md are unanimous and dated; README is the outlier.
- **Actual behavior:** README tells a reader (human or AI agent) that Combobox's Figma component-set node is unresolved.
- **Expected behavior:** README should either drop this specific claim or state it accurately (e.g., "Combobox and File Upload component-set node IDs are confirmed; remaining gaps are the selected-option token binding and several undiffed dimension values — see combobox-parity.md").
- **User/system impact:** A contributor or coding agent reading only README (a very plausible entry point) would believe MCP access has never succeeded for Combobox, and might either re-attempt unnecessary MCP work or distrust the actually-confirmed anatomy documented elsewhere.
- **Recommended correction:** Update `README.md`'s "Known limitations" bullet to remove the Combobox node-ID claim or repoint it at the real remaining gap (the `semantic/surface/subtle` token mapping, tracked in `combobox-parity.md`'s "Selected-surface token gap").
- **Suggested verification:** Re-run `lib/readme-status.test.ts`-style consistency checks (that test currently only checks the implemented-component table, not this prose paragraph — see AUDIT-012).
- **Related findings:** AUDIT-004 (same class of staleness, different topic).

### AUDIT-004 — Layer 4 (Industry Systems) is described as entirely future/planned in three durable/public sources, despite a shipped 3-component Banking pilot

- **Severity:** High
- **Confidence:** Confirmed
- **Category:** Source-of-truth contradiction, public-facing (one instance is machine-readable and LLM-facing)
- **Evidence:**
  - `skrewww-claude-project-instructions.md:33`: "4. **Industry Systems** — planned; distributed via the CLI presets..." — this file contains **zero** occurrences of the word "Banking" anywhere (`grep -c Banking` = 0), even though it was last "instruction-synced" 2026-07-25 (line 11), the same day the Banking pilot shipped per `docs/project-status.md`'s own "Layer 4 pilot" section.
  - `README.md:81`: "4. Industry Systems — planned; see Distribution Model below for how it will ship" — this directly contradicts README's *own* "Implemented React components" table four lines above it (`README.md:21`), which already lists `Banking Account Card, Banking Balance Summary, Banking Transaction Row` as implemented. This is a **self-contradiction within one file**, not just a cross-file one.
  - `lib/llms-content.ts:87`: "4. Industry Systems — future industry-specific layers inheriting from the core." — this is the public, LLM-facing `/llms.txt` / `/llms-full.txt` output. The **same file**, 21 lines later (`lib/llms-content.ts:108-111`), correctly emits a real "## Industries (Layer 4 — distinct from Component categories above)" section listing the live Industries index and the Banking page. One generated document contradicts itself.
  - Ground truth: `app/page.tsx:35-37` correctly shows `status: "Banking pilot (3 components)"` for Layer 4 on the actual homepage — the homepage itself is accurate.
- **Files and lines:** As above.
- **Actual behavior:** Three separate documents (one durable/instructional, one human-facing, one machine/LLM-facing) describe Layer 4 as pure future work; the homepage and the registry disagree.
- **Expected behavior:** All four-layer architecture summaries should read consistently with the homepage's own accurate status line.
- **User/system impact:** `llms-content.ts` is specifically built for AI-agent/LLM consumption (its whole purpose). An agent reading only that file's top-level architecture summary would incorrectly conclude Industry Systems doesn't exist yet, then contradict itself two sections later — actively confusing, not just stale.
- **Recommended correction:** Update the "4. Industry Systems" summary line in all three places to something like "Industry Systems — Banking pilot shipped (3 components); additional industries planned via the CLI preset model," mirroring `app/page.tsx`'s own wording.
- **Suggested verification:** A test asserting `llms-content.ts`'s top-level architecture summary and its own "Industries" section don't disagree on whether Layer 4 has shipped anything would catch this class of regression going forward.
- **Related findings:** AUDIT-003.

---

## 6. Medium findings

### AUDIT-005 — `docs/project-status.md`'s own "Last verified" date is internally inconsistent, and downstream dates are frozen far behind real changes

- **Severity:** Medium
- **Confidence:** Confirmed
- **Category:** Documentation staleness / generated metadata
- **Evidence:** `docs/project-status.md:3`: "Last verified: **2026-07-15**"; `docs/project-status.md:56`: "**Last verified: 2026-07-25**" (Quality-gate section); the document's own body contains dated entries through 2026-07-26 (Industries nav). Separately, `lib/site-config.ts:29`: `lastUpdated: "2026-07-13"`, explicitly commented "Fixed source date — do not regenerate on every build." This single hardcoded value is consumed by `lib/sitemap-data.ts` (8 call sites, every route's `lastModified`), `lib/structured-data.ts:144,166` (JSON-LD `dateModified`), `lib/llms-content.ts:93` ("Last updated" line in `/llms.txt`), and `lib/registry-public.ts:159` (`/registry.json`'s `lastUpdated`). Real commit history shows substantive shipped changes on 2026-07-15, -17, -18, -19, -24, -25, -26, and 2026-08-06 (confirmed via `git log`), all after the frozen 2026-07-13 date.
- **Files and lines:** `docs/project-status.md:3` vs. `:56`; `lib/site-config.ts:29` and its 5 consumers.
- **Actual behavior:** Every generated public artifact (sitemap, JSON-LD, `/registry.json`, `/llms.txt`) reports 2026-07-13 as "last updated," regardless of how much has shipped since.
- **Expected behavior:** A "last updated" date on public SEO/LLM surfaces should reflect real change recency, or at minimum the project's own status doc shouldn't contain two different "last verified" dates in its own header vs. body.
- **User/system impact:** Search engines and LLM crawlers see a document that hasn't "changed" in 25+ days despite meaningful content changes — a real (if soft) SEO/trust cost. This is Medium, not High, because nothing is functionally broken.
- **Recommended correction:** Fix `docs/project-status.md`'s top-of-file date to match its most recent dated section, and decide deliberately whether `siteConfig.lastUpdated` should be bumped on meaningful releases (even manually) rather than frozen indefinitely.
- **Suggested verification:** None automated today; consider a test that flags when `siteConfig.lastUpdated` is more than N days older than the latest commit touching `content/`, `lib/component-registry*.ts`, or `styles/tokens.css`.
- **Related findings:** AUDIT-006 (same root cause, different symptom).

### AUDIT-006 — Every generated public URL points at `skrewww.dev`, not the real reserved/verified domain, because `NEXT_PUBLIC_SITE_URL` is unset

- **Severity:** Medium (Observation-adjacent; classified Medium because it affects live, deployed SEO surfaces, not just local dev)
- **Confidence:** Confirmed for the code-level mechanism; the actual production domain assignment is stated per this project's own prior operational knowledge and was not re-verified live in this specific audit pass (no live-browser check was performed here — see Section 15 limitations)
- **Category:** Deployment configuration / SEO
- **Evidence:** `lib/site-config.ts:5-17`: `resolveSiteOrigin()` falls back to `PRODUCTION_FALLBACK_ORIGIN = "https://skrewww.dev"` whenever `NEXT_PUBLIC_SITE_URL`/`NEXT_PUBLIC_SITE_ORIGIN` are unset and `NODE_ENV !== "development"`. Running `getPublicRegistry()` in this exact repository state (no env override) yields `canonicalBaseUrl: "https://skrewww.dev"`. `skrewww-claude-project-instructions.md:189-191` and `README.md:147-149` both correctly document this fallback behavior and correctly warn that `skrewww.com` being reserved "does not mean it is currently live."
- **Files and lines:** `lib/site-config.ts:3-17`.
- **Actual behavior:** Absent the env var, every canonical URL, sitemap entry, JSON-LD `url`, and `/registry.json` `canonicalBaseUrl` resolves to `skrewww.dev`.
- **Expected behavior:** If the real production deployment's intended domain differs, `NEXT_PUBLIC_SITE_URL` needs to be set at deploy time — this is explicitly the project's own documented mechanism, so this finding is really "confirm the deploy-time env var matches intent," not a code bug.
- **User/system impact:** If the live deployment does not have `NEXT_PUBLIC_SITE_URL` set to its real serving domain, every generated canonical/SEO surface is wrong for search engines and social previews.
- **Recommended correction:** Confirm the Vercel (or other host) project's environment variables include `NEXT_PUBLIC_SITE_URL` set to the actual serving domain before/at each production deploy.
- **Suggested verification:** A deploy-time smoke check comparing the deployed `/registry.json`'s `canonicalBaseUrl` against the actual request host would catch a misconfiguration immediately.
- **Related findings:** AUDIT-005.

### AUDIT-007 — Switch's thumb shadow hardcodes a color that exactly duplicates an existing, unreferenced token

- **Severity:** Medium
- **Confidence:** Confirmed
- **Category:** Token architecture violation
- **Evidence:** `components/ui/switch.module.css:58`: `box-shadow: 0 1px 2px rgb(19 19 22 / 0.12);`. `styles/tokens.css:37`: `--primitive-shadow-color-5: rgb(19 19 22 / 0.12); /* shadow-color/5 — TODO: confirm alpha */` — byte-for-byte the same value. `components/ui/internal/feedback-surface.module.css:55`: `.dismiss:hover { background: rgb(19 19 22 / 0.06); }` — same base ink color, a distinct alpha (0.06) with **no** existing token counterpart at all.
- **Files and lines:** `components/ui/switch.module.css:58`; `components/ui/internal/feedback-surface.module.css:55`.
- **Classification (per the audit's own categories):**
  - `switch.module.css:56` (`border-radius: 50%` on `.thumb`) — **Intentional exception / correct structural value.** A toggle thumb must render as a true circle at any size regardless of Shape mode; this matches the project's own documented fixed-circular precedent (Badge/Avatar/Calendar Day in `docs/project-status.md`'s Layer 3 baseline). Not a finding.
  - `switch.module.css:58` (shadow color) — **Token architecture violation.** The exact value already exists as `--primitive-shadow-color-5`; using the raw literal means a future correction to that token (it's still marked "TODO: confirm alpha" in its own definition) would silently miss this duplicate.
  - `feedback-surface.module.css:55` — **Unresolved.** No existing primitive/semantic token matches `0.06` alpha; this is a genuinely new, untokenized value, not a case of an existing token being bypassed.
- **Actual behavior:** Two raw color literals in the entire component library (confirmed via full-tree grep — these are the *only* two `rgb()`/`rgba()`/hex/hsl literals across `components/ui/**/*.module.css`).
- **Expected behavior:** `switch.module.css:58` should read `var(--primitive-shadow-color-5)`; `feedback-surface.module.css:55` needs a real hover-tint token decision (new primitive, or reuse an existing subtle-surface token) rather than an ad hoc value.
- **User/system impact:** Low today (values are correct-looking and consistent with the rest of the system visually) but a real, if small, maintainability gap exactly matching what the token architecture exists to prevent.
- **Recommended correction:** Replace the Switch literal with the existing token; decide and record a real token for the feedback-surface hover tint.
- **Suggested verification:** A lint rule or test scanning `components/ui/**/*.module.css` for raw `rgb(`/`rgba(`/hex/`hsl(` literals (excluding `styles/tokens.css` itself) would catch regressions of this class going forward — today's count is exactly 2, so a test could reasonably assert "no more than these 2 known exceptions" as a ratchet.
- **Related findings:** None.

### AUDIT-008 — `docs/project-status.md` overstates the "Gradient aliased to Flat" gap for the `--surface-fill-default` tier

- **Severity:** Medium
- **Confidence:** Confirmed
- **Category:** Documentation accuracy
- **Evidence:** `docs/project-status.md:285-289` ("Open item"): "Gradient mode currently has no distinct visual treatment of its own for any of these 3 components [Button, Card, Text Input] — it is aliased to the same values as Flat." Actual code, `styles/tokens.css:755-768`:
  ```css
  [data-skrewww-surface="flat"] { --surface-fill-default: var(--semantic-surface-default); ... }
  [data-skrewww-surface="gradient"] {
    /* [EXPERIMENTAL] Gradient stops pending Figma Surface collection */
    --surface-fill-default: linear-gradient(180deg, var(--semantic-surface-default) 0%, var(--semantic-surface-elevated) 100%);
    --surface-fill-control: var(--semantic-surface-default);
  }
  ```
  `--surface-fill-default` genuinely differs (a real `linear-gradient()` vs. a flat color) — Card and other `--surface-fill-default` consumers do render visibly differently under Gradient. Only `--surface-fill-control` is identical to Flat. This `linear-gradient` block is present as far back as the repository's own baseline commit (`f46c4e0`, 2026-07-13), predating the 2026-07-17 doc entry that calls it "aliased" — so this was not a later regression the doc failed to catch up to; the claim was imprecise from when it was written.
- **Files and lines:** `docs/project-status.md:285-289` vs. `styles/tokens.css:755-768`.
- **Actual behavior:** Doc says "no distinct treatment... aliased to Flat" (implying zero visual difference); code shows a real, distinct (if `[EXPERIMENTAL]`/unverified-stops) gradient for the `default` fill tier specifically.
- **Expected behavior:** The doc should distinguish the two fill tiers: `--surface-fill-default` has a real (if Figma-unconfirmed) gradient; `--surface-fill-control` is the tier that's genuinely aliased.
- **User/system impact:** Low — a reader would under-credit real, working (if experimental) work, not over-credit missing work. Still a documentation-accuracy defect per this audit's mandate.
- **Recommended correction:** Rephrase to "Gradient's control-fill tier is aliased to Flat; the default/container fill tier has a real linear-gradient, marked EXPERIMENTAL pending Figma color-stop confirmation."
- **Suggested verification:** None needed beyond the correction itself.
- **Related findings:** None.

### AUDIT-009 — Button and Card's CLI-resolution `cssTokens` metadata is already stale relative to their real source

- **Severity:** Medium
- **Confidence:** Confirmed
- **Category:** Distribution-model readiness / data accuracy
- **Evidence:** `docs/project-status.md:24`: "Only Button and Card carry real data, derived directly from their actual source files... not guessed." `lib/component-registry.ts:145-175` (Button's `cssTokens`) and the equivalent Card entry do **not** include `--glass-backdrop-filter-sm`/`-md` or `--squircle-clip-path-control`/`-container` — but both are real, current custom-property references in `components/ui/button.module.css` and `components/ui/card.module.css` today (confirmed via `grep -oE "var\(--[a-z0-9-]+" ...`). These two properties were added by the Shape/Surface squircle-and-glass fix committed 2026-08-06 (`0fa9dec`), after the registry's CLI-resolution fields were populated (schema shipped 2026-07-25 per the same doc paragraph).
- **Files and lines:** `lib/component-registry.ts` (Button `cssTokens` array, and Card's equivalent) vs. `components/ui/button.module.css`, `components/ui/card.module.css` (current `var(--...)` references).
- **Actual behavior:** The registry's only two "real, not guessed" CLI-resolution entries are already incomplete relative to current source, four days after they were populated (and roughly one day before this audit).
- **Expected behavior:** `cssTokens`/`files`/`dependencies` should reflect the component's current CSS/imports, or the project should not claim these are trustworthy without a mechanism to keep them in sync.
- **User/system impact:** No user impact today (no CLI exists to consume this data yet), but it is a concrete, reproduced demonstration that this metadata drifts the moment the underlying CSS changes, which matters a great deal once 47 components need it and a real CLI is reading it.
- **Recommended correction:** Before scaling this metadata to more components, add either a codegen step (extract `cssTokens` from the actual stylesheet at build/CI time) or a test that fails when a component's declared `cssTokens` doesn't match a fresh extraction from its stylesheet.
- **Suggested verification:** Add exactly that test; it would have caught this on the squircle/glass PR.
- **Related findings:** None.

### AUDIT-010 — `dangerouslySetInnerHTML` for JSON-LD injection has no `<`-escaping defense

- **Severity:** Medium
- **Confidence:** Confirmed as a latent pattern gap; **not currently exploitable** (no untrusted input reaches this sink today)
- **Category:** Security (defense-in-depth)
- **Evidence:** `components/docs/JsonLd.tsx:11-15`:
  ```tsx
  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }} />
  ```
  `JSON.stringify` does not escape `<`; a value containing the literal substring `</script>` would prematurely close the tag. Every current caller passes first-party, developer-authored data (component summaries, site config, category/industry content) — there is currently no user-generated or externally-sourced text flowing into any JSON-LD `entry` in this repository.
- **Files and lines:** `components/docs/JsonLd.tsx:14`.
- **Actual behavior:** No escaping at the injection sink.
- **Expected behavior:** The standard, well-known mitigation for this exact pattern is escaping `<` (e.g., `.replace(/</g, "\\u003c")`) before injection, so the component is safe by construction rather than safe only because every current caller happens to be trusted.
- **User/system impact:** None today. Becomes a real risk the moment any future field feeding JSON-LD (a component summary, a description) ever becomes editable by anyone other than the core team without this fix landing first.
- **Recommended correction:** Add the escape in `JsonLd.tsx` once, centrally.
- **Suggested verification:** A unit test asserting `JsonLd` escapes a deliberately adversarial string containing `</script>`.
- **Related findings:** None.

### AUDIT-011 — File Upload's README wording conflates a resolved fact with genuinely-deferred features

- **Severity:** Medium
- **Confidence:** Confirmed as imprecise wording; not a factual error like AUDIT-003
- **Category:** Documentation clarity
- **Evidence:** `README.md:158`: "**File Upload** — React Beta implemented; live Figma MCP verification, progress UI, and preview thumbnails remain deferred." But `lib/file-upload-figma-metadata.ts:8-9,93,95`: component-set node (`2024:2649`), single-file anatomy, and multi-file anatomy are all confirmed (`FILE_UPLOAD_FIGMA_AUDIT_STATUS = "verified-2026-07-15"`). What genuinely remains undone is progress UI and preview thumbnails — features that don't exist in React yet, not Figma-verification gaps.
- **Files and lines:** `README.md:158`.
- **Actual behavior:** One sentence groups a done item ("Figma MCP verification" of the shipped anatomy) with two genuinely-not-done items under one "remain deferred."
- **Expected behavior:** Split the claim: anatomy/component-set verification is done; progress UI, preview thumbnails, and controlled-files support are the real remaining gaps.
- **User/system impact:** Low — a careful reader would still find the truth in `file-upload-discovery.md`, but the README summary alone is misleading.
- **Recommended correction:** Reword to "React Beta implemented; component-set and anatomy Figma-confirmed 2026-07-15; progress UI, preview thumbnails, and controlled-files support remain deferred."
- **Suggested verification:** None needed beyond the wording fix.
- **Related findings:** AUDIT-003 (same document, same class of drift, different severity).

### AUDIT-012 — README's implemented-component table is tested for consistency; its prose ("Known limitations," architecture summary) is not

- **Severity:** Medium
- **Confidence:** Confirmed
- **Category:** Test-gap / process
- **Evidence:** `lib/readme-status.test.ts` (via `lib/readme-inventory.ts`'s `compareReadmeInventory`) only diffs the "| Category | Components |" table against the registry. AUDIT-003, AUDIT-004, and AUDIT-011 are all README prose paragraphs outside that table, and none of them are covered by any test.
- **Files and lines:** `lib/readme-status.test.ts`; `lib/readme-inventory.ts`.
- **Actual behavior:** The one part of README that's mechanically checked (the table) is accurate; the parts that aren't checked (prose) are exactly where the drift in this audit was found.
- **Expected behavior:** N/A — this is a coverage gap, not a bug in the existing test.
- **User/system impact:** This is the structural reason AUDIT-003/004/011 were able to accumulate silently.
- **Recommended correction:** See Section 12 (test-gap priorities) — a lightweight test asserting README's "Known limitations" bullets don't reference a status (`pending`, `unresolved`, `null`) that the registry/metadata files have since resolved would be disproportionately high-value relative to its size.
- **Suggested verification:** N/A.
- **Related findings:** AUDIT-003, AUDIT-004, AUDIT-011.

---

## 7. Low findings

### AUDIT-013 — `docs/project-status.md` header date inconsistency compounds with stale numeric claims

- **Severity:** Low
- **Confidence:** Confirmed
- **Category:** Documentation staleness
- **Evidence:** `docs/project-status.md:64-65` claims "Vitest **590 tests** across **75 files**" and "Playwright **160 tests**," both dated "Last verified: 2026-07-25." This audit's live, real (contamination-excluded) run today: **643 tests / 79 files** (Vitest) and **161 tests** (Playwright).
- **Files and lines:** `docs/project-status.md:64-65`.
- **Actual behavior:** Numbers are stale by 53 tests / 4 files (Vitest) and 1 test (Playwright) — expected drift given real commits landed after 2026-07-25 (the squircle/glass fix, the hero CTA work, and others), not evidence of any regression.
- **Expected behavior:** None required beyond normal update cadence; flagged only because the brief asks for it explicitly, and because it's a second, independent confirmation that this file's "Last verified" dates (see AUDIT-005) don't reflect current reality.
- **User/system impact:** Negligible.
- **Recommended correction:** Refresh the numbers next time this file is touched.
- **Suggested verification:** N/A.
- **Related findings:** AUDIT-005.

### AUDIT-014 — Production build page count (81) vs. last documented count (80)

- **Severity:** Low
- **Confidence:** Confirmed
- **Category:** Documentation staleness
- **Evidence:** `docs/project-status.md:66`: "80/80 pages (+2 new /components/industries...)". Live build today: 81/81.
- **Files and lines:** `docs/project-status.md:66`.
- **Actual behavior:** One additional generated page exists beyond the last documented count (consistent with normal ongoing route additions, e.g. the hero CTA / other recent work); not itself a defect given this project's own prior history of the page-count number shifting for legitimate framework-internal reasons (see the 71→70 investigation already on record in the same file).
- **Recommended correction:** Refresh alongside AUDIT-013.
- **Related findings:** AUDIT-005, AUDIT-013.

### AUDIT-015 — `lib/routes.ts` exports a `@deprecated` `SITE_ORIGIN` constant

- **Severity:** Low
- **Confidence:** Confirmed presence; usage sites not exhaustively traced in this pass
- **Category:** Maintainability / dead-code candidate
- **Evidence:** `lib/routes.ts` (bottom): `/** @deprecated Use siteConfig.origin or absoluteUrl() from lib/site-config.ts */ export const SITE_ORIGIN = (...)`.
- **Files and lines:** `lib/routes.ts`.
- **Actual behavior:** A deprecated export remains in the public `lib/` surface.
- **Recommended correction:** Grep for remaining consumers; remove if none, or finish the migration if any remain.
- **Suggested verification:** `grep -rn "SITE_ORIGIN" --include="*.ts" --include="*.tsx"` excluding its own definition.
- **Related findings:** None.

### AUDIT-016 — `docs/architecture/react-hooks-lint-debt.md`, listed as required reading, does not exist

- **Severity:** Low
- **Confidence:** Confirmed
- **Category:** Documentation gap
- **Evidence:** `ls docs/architecture/` does not list this file. The lint debt it would presumably document (`react-hooks/refs`, `react-hooks/immutability`, `react-hooks/set-state-in-effect` downgraded to `warn` for 26 known call sites) is real and is explained — adequately, if informally — inline in `eslint.config.js:30-48`'s comment.
- **Files and lines:** N/A (absence).
- **Recommended correction:** Either create the referenced doc (extracting the `eslint.config.js` comment into `docs/architecture/`) or stop referencing a file that doesn't exist from future audit briefs/instructions.
- **Related findings:** None.

### AUDIT-017 — `TextInputControl.tsx` exists but is not part of the public export barrel

- **Severity:** Low
- **Confidence:** Confirmed as correctly *not* exported; flagged only to document the pattern for future maintainers
- **Category:** Observation-adjacent architecture note
- **Evidence:** `components/ui/TextInputControl.tsx` exists alongside `TextInput.tsx`; `components/ui/index.ts` exports only `TextInput`/`TextInputProps`. This mirrors the `TextareaControl`/`Textarea` split already used elsewhere in the codebase (an unexported "control" primitive composed by a public wrapper). Correctly not leaked as public API.
- **Recommended correction:** None — noted for completeness since Phase 5 explicitly asks to check for unintentionally-exported internals; this one is intentional and correctly scoped.
- **Related findings:** None.

---

## 8. Observations

1. **`useControllableState` (`lib/use-controllable.ts`) is a clean, correct implementation.** It computes `isControlled` from an explicit override, an explicit "was a value prop provided" flag, or a `value !== undefined` fallback (in that priority order) — correctly handling the classic ambiguous-`undefined` edge case by giving callers an explicit escape hatch (`valueProvided`) rather than relying solely on the ambiguous signal. It warns in development (not production) if a component flips between controlled/uncontrolled across renders, matching React's own official anti-pattern guidance. `setValue` calls `onChange` exactly once per invocation regardless of mode. Worth preserving as the house pattern.
2. **Table vs. Data Table's boundary is real and correctly documented**, not just claimed. Neither `Table.tsx` nor `DataTableSortHeader.tsx` uses `role="grid"` (grepped directly). `content/content-data.ts`'s own prose explicitly states Data Table "composes Table... sorting only, no columns-config prop" and Table "still does not orchestrate selection, pagination ownership, or spreadsheet navigation." This directly satisfies the audit brief's specific ask and is a genuinely well-executed architectural decision.
3. **The React 19 ref-as-prop migration is real, deliberate, and tested.** `Dialog.tsx`, `Drawer.tsx`, `Popover.tsx`, `Tooltip.tsx`, and `Menu.tsx` do not use `forwardRef` — initially flagged as a possible inconsistency, but confirmed (via `Popover.tsx:155,165,174,194,367`) to be the documented, intentional React 19 direct-`ref`-prop pattern, matching `docs/project-status.md`'s own record of "5 React 19 `element.ref` deprecation call sites fixed." Not a defect.
4. **The 2026-08-02 date-rollover test fix (commit `1a3669c`) is genuinely still resolved today, independently re-verified.** The historical failure class ("Date Picker timer instability," closest match in this repo's history) was 3 Vitest tests + 1 Playwright test relying on an undocumented default-to-real-current-date fallback in `CalendarGrid.tsx:189-191`. The fix pins explicit reference dates/values (`defaultValue="2026-07-11"`, `defaultVisibleMonth={{year:2026,month:7}}`, `page.clock.setFixedTime(...)`). This audit's own fresh full test runs today (2026-08-07, well past the original August-rollover date) show 0 failures across all 79 unit test files and all 24 Playwright specs — confirming the fix holds, not merely re-citing the old diagnosis.
5. **Environment-variable and secret hygiene is good.** `.env.example` documents every variable's purpose, server-only status, and where to obtain it, with no real values. Only `.env.example` is tracked by git (`git ls-files | grep ^\.env`); `.env`/`.env*.local` are correctly gitignored. `NEXT_PUBLIC_*`-prefix discipline is respected — server-only tokens (`VERCEL_API_TOKEN`, etc.) are explicitly commented as never to be `NEXT_PUBLIC_`-prefixed.
6. **External-link `rel` handling is centralized and safe by default.** Both `Button.tsx`'s `isExternalHref`/`resolvedRel` logic and `Link.tsx`'s shared `getLinkRel(target, rel)` helper auto-apply `rel="noopener noreferrer"` when `target="_blank"` is set without an explicit `rel`. Every `target="_blank"` usage found in the codebase goes through one of these two components.
7. **`dangerouslySetInnerHTML` has exactly one call site in the entire codebase** (`components/docs/JsonLd.tsx`, see AUDIT-010) — no `eval`, `new Function`, or other injection-class pattern was found anywhere outside `node_modules`/generated directories.
8. **Server/client component boundaries are used deliberately, not reflexively.** 14 of the ~63 real (non-test) files under `components/ui/` have no `"use client"` directive at all (`Badge`, `BankingAccountCard`, `BankingBalanceSummary`, `Breadcrumb`, `Card`, `Divider`, `Link`, `Pagination`, `ProgressBar`, `Skeleton`, `Spinner`, `Timeline`, `ValidationMessage`, `icons.tsx`) — these are genuinely presentational, hook-free components correctly left as server components rather than blanket-marked client.
9. **TODO/FIXME/HACK markers are minimal and all already tracked elsewhere.** Full-tree grep (excluding generated directories) found exactly 5: two `styles/tokens.css` shadow-token alpha/blur "TODO: confirm" comments (already surfaced via `docs/project-status.md`'s open-item tracking) and one Card registry `openQuestions` TODO (already an explicit, documented open question, not hidden debt).

---

## 9. Source-of-truth contradictions

| Topic | Source A | Source B | Authority | Required correction |
|---|---|---|---|---|
| Combobox Figma node ID | `README.md:155` — "pending" | `lib/combobox-figma-metadata.ts:8-9`, `docs/architecture/combobox-parity.md:9`, `docs/project-status.md:44` — confirmed `2024:2480`, dated 2026-07-13 | Metadata file (per `source-of-truth.md`'s Figma-status hierarchy) | Fix README (AUDIT-003) |
| Layer 4 status | `skrewww-claude-project-instructions.md:33`, `README.md:81`, `lib/llms-content.ts:87` — "planned"/"future" | `app/page.tsx:35-37` — "Banking pilot (3 components)"; `docs/project-status.md`'s Layer 4 pilot section; registry `industry` field on 3 entries | Homepage + registry (both derived from live code) | Fix all three stale sources (AUDIT-004) |
| `npm audit` result | `docs/project-status.md:67` — "0 vulnerabilities" (dated 2026-07-15) | Live `npm audit` today — 6 vulnerabilities | Live command result | Re-verify and update the doc (AUDIT-002) |
| Gradient surface treatment | `docs/project-status.md:285-289` — "aliased to Flat, no distinct treatment" | `styles/tokens.css:755-768` — real distinct `linear-gradient()` for `--surface-fill-default` | Runtime token source (`styles/tokens.css`, per `source-of-truth.md`'s Tokens table) | Fix the doc's characterization (AUDIT-008) |
| Button/Card `cssTokens` completeness | `docs/project-status.md:24` — "real data... not guessed" | Actual `button.module.css`/`card.module.css` — 2 tokens each missing per component | Actual stylesheet | Refresh the registry data or add a sync check (AUDIT-009) |
| File Upload Figma-verification framing | `README.md:158` — groups verification with deferred features | `lib/file-upload-figma-metadata.ts` — component-set/anatomy already confirmed 2026-07-15 | Metadata file | Reword README (AUDIT-011) |
| Vitest/Playwright counts | `docs/project-status.md:64-65` — 590 tests/75 files, 160 Playwright (dated 2026-07-25) | Live run today — 643 tests/79 files, 161 Playwright | Live command result | Refresh counts (AUDIT-013) |

---

## 10. Accessibility coverage matrix

Spot-checked, not exhaustive across all 47 implemented components — see Section 1's stated limitation. Components below were chosen for architectural complexity (overlay stacking, active-descendant patterns, table semantics) per the audit brief's explicit "review deeply" list; a full 47-component pass was not performed in this session.

| Component | Semantics | Keyboard | Focus | Screen reader | Tests | Gaps |
|---|---|---|---|---|---|---|
| Dialog | Native modal pattern documented; no `forwardRef` (React 19 ref-prop, confirmed intentional) | Not independently re-tested this pass beyond confirming existing test file structure | Focus-trap logic exists (`useFocusTrap` internal hook, per earlier lint-debt context) | Not independently verified this pass | `Dialog.test.tsx` exists, includes a documented "does not access deprecated element.ref" regression guard | Full escape/nested-overlay/inert re-verification not performed independently this pass — relying on existing passing test suite (161/161 Playwright, includes `overlays.spec.ts`) rather than a fresh manual audit |
| Popover | `role="dialog"` deliberately *not* applied to neutral positioning shells, per `skrewww-claude-project-instructions.md:82` — confirmed this rule exists as a stated principle; not independently re-verified against every Popover consumer in this pass | — | Ref-forwarding via explicit `ref` prop confirmed (`Popover.tsx:155,367`) | — | `Popover.test.tsx` includes anchor/trigger ref-API regression tests | Same as Dialog — relying on existing 161/161 Playwright pass (`overlays.spec.ts` covers open/close/escape/outside-click/nested) rather than independent manual re-verification |
| Combobox | `aria-activedescendant` pattern documented (`skrewww-claude-project-instructions.md:83`); DOM focus stays in the input per the same rule | Filter/pointer-sync policy fully documented in `combobox-parity.md` (prefix/substring modes, blur-revert policy, pointer-hover activation with one-frame guard) | — | Polite no-results announcement policy explicitly documented (8-point policy in `combobox-parity.md:58-67`) | `Combobox.test.tsx` + `e2e` combobox coverage exists | Selected-option background token gap remains open (documented, not hidden — see `combobox-parity.md`'s own tracked gap) |
| Table | Native `<table>`/`<caption>`/`<th>` — explicitly *not* `role="grid"` (confirmed via grep) | N/A (native table, no custom keyboard model by design) | N/A | Native semantics — screen readers get real table navigation for free | `Table.test.tsx` + extensive `e2e/table.spec.ts` (18 Playwright tests covering RTL, print media, narrow viewports, multi-level headers) | None found in this pass |
| Switch | Custom control; hardcoded circular thumb intentional (AUDIT-007) | Not independently re-tested | Focus-visible outline present (`switch.module.css:33-36`) | Not independently verified | `Switch.test.tsx` exists | Not deeply re-audited this pass |
| File Upload | Native multipart, drag-and-drop enhancement, advisory validation | Not independently re-tested | — | Polite status announcements documented as shipped | `FileUpload.test.tsx` + `e2e/file-upload.spec.ts` | Progress UI, preview thumbnails, controlled files remain genuinely unbuilt (correctly documented as deferred, not a hidden gap) |

**General note:** This audit did not independently re-derive contrast ratios, re-test reduced-motion/reduced-transparency handling, or re-verify focus-restoration behavior component-by-component beyond what the existing (passing) test suite already covers. Given 161/161 Playwright tests pass — including dedicated focus-restoration assertions visible in spec names like "closes with Escape and restores trigger focus," "restores menu focus," "restores combobox focus" — there is real, executed evidence these behaviors work as tested, but this audit did not independently probe beyond what's already asserted.

---

## 11. Token and Layer 3 audit

| Component | Shape | Surface | Content cascade | Blur | Contrast | Finding |
|---|---|---|---|---|---|---|
| Button | `component/radius/control`, confirmed bound | Primary/Danger backgrounds have 3 real tiers (base/hover/pressed); content bound to `component/surface/content` | Confirmed correct per `docs/project-status.md`'s Layer 3 baseline | Squircle clip-path + glass backdrop-filter tokens present in current CSS (added 2026-08-06) but **not yet reflected in registry `cssTokens`** | Not independently re-measured this pass | AUDIT-009 |
| Card | `component/radius/container` | Real `linear-gradient()` for `--surface-fill-default` under Gradient (AUDIT-008); Glass fill separately confirmed | — | Same squircle/glass-token registry lag as Button | Not independently re-measured | AUDIT-008, AUDIT-009 |
| Switch | Fixed circular thumb (intentional exception) | Marked not-applicable to Surface per documented user decision (control too small for meaningful blur) | N/A | N/A (correctly excluded) | Not independently re-measured | AUDIT-007 (shadow-color literal) |
| Feedback surface (Alert/Toast internal) | — | Shared `component/feedback/{tone}/surface` tokens per tone, confirmed via CSS custom-property scoping (`.info`/`.success`/`.warning`/`.error` blocks) | — | N/A | Not independently re-measured | AUDIT-007 (hover-tint literal) |
| Menu | — | Documented as lacking a reusable master "Panel" component in Figma — a known, tracked open item (`docs/project-status.md`'s Layer 3 audit, Batch 1) | — | — | — | Confirmed still an open, tracked item; not independently re-verified against current Figma state (no MCP access this pass) |
| Data Table / Table | `component/radius/container` (demo-frame only per doc) | Reuses Card's tokens | — | — | — | Consistent with documented React-first/Figma-parity-pending status |

**Broader token-bypass sweep result:** across the entirety of `components/ui/**/*.module.css`, exactly **2** raw color literals exist (both covered in AUDIT-007); no undefined CSS custom properties or unused-but-defined token declarations were found in the specific files inspected this pass. A full unused-CSS-variable sweep across all of `styles/tokens.css` (hundreds of declarations) was not performed exhaustively — this audit spot-checked the two files the brief specifically named plus their immediate token dependencies.

---

## 12. Test-gap priorities

| Priority | Behavior | Current coverage | Recommended test |
|---|---|---:|---|
| High | README prose claims (Known Limitations, architecture summary) staying in sync with resolved Figma/registry facts | None — only the implemented-component table is checked (`lib/readme-status.test.ts`) | A test that scans README's "Known limitations" section for slugs/topics matching a registry entry whose relevant metadata field no longer supports the claimed "pending"/"unresolved" status (would have caught AUDIT-003) |
| High | `.claude/**` exclusion from lint/test discovery | None — this is an infra gap, not a missing test | Not a test per se; add the config exclusions (AUDIT-001) and, optionally, a CI check that fails if `npm run lint`/`npm test` file counts exceed the known-good tracked-file count |
| Medium | Registry CLI-resolution field (`cssTokens`) accuracy vs. actual stylesheet | None | A test that extracts real `var(--...)` references from each `files`-listed `.module.css` and asserts they're a superset of the declared `cssTokens` array, for any entry that has `cssTokens` populated (would have caught AUDIT-009) |
| Medium | `llms-content.ts` internal self-consistency (top-level architecture summary vs. detailed sections) | None | A test asserting the "Industry Systems"/Layer 4 summary line doesn't say "future"/"planned" while a later section in the same output lists live industry pages (would have caught AUDIT-004's `llms-content.ts` instance) |
| Low | `docs/project-status.md`'s own header date vs. its most recent dated section | None | A lightweight doc-lint test comparing the top "Last verified" date string against the maximum date appearing anywhere else in the file |

This audit deliberately does not recommend a large batch of new component-level tests — the existing 643 unit + 161 Playwright tests already provide real, passing, non-trivial coverage (keyboard models, focus restoration, RTL, print media, narrow viewports, controlled/uncontrolled state, React 19 ref-API regression guards). The gaps found here are concentrated in **documentation/registry self-consistency**, not component behavior, so the recommended additions target that specifically rather than inflating the test count for its own sake.

---

## 13. Distribution readiness

| Requirement | Current state | Gap | Recommendation |
|---|---|---|---|
| `/registry.json` as CLI data source | Live, schema `1.3.0`, served at `/registry.json`, generated from `lib/component-registry.ts` | None structural | — |
| `dependencies`/`coreDependencies`/`files`/`cssTokens`/`coreVersion` schema | Defined on `ComponentRegistryEntry`; populated for exactly 2 of 47 entries (Button, Card) | Data already drifts from source within days of being populated (AUDIT-009); no sync mechanism exists | Build the sync-check test (Section 12) before populating the remaining 45 entries, or the drift problem scales 45x |
| Token requirements (`@skrewww/core` scope) | Not yet built; SemVer policy for it is decided and documented (`skrewww-claude-project-instructions.md:59`) | `coreVersion` intentionally left unpopulated everywhere, correctly, since no real package version exists yet | No action needed until `@skrewww/core` ships |
| Industry preset delivery | Only Banking exists; no CLI exists to deliver it as a preset | The Layer 4 CLI-preset model is fully specified in docs but has zero implementation | Not a gap for *this* stage — correctly scoped as "planned," per the durable instructions (once corrected per AUDIT-004 to acknowledge the pilot exists while the CLI itself remains unbuilt) |
| File resolution model | `files: string[]` field exists on the schema; populated correctly (path-wise) for Button/Card | Not yet exercised by any real consumer | — |
| Registry entries falsely appearing CLI-ready | None found beyond the accuracy gap in the 2 populated entries — the other 45 entries correctly leave all 5 fields `undefined` rather than guessing | — | Continue this discipline; do not backfill with inferred values per the project's own stated rule |

**Practical gap list for a minimal CLI proof of concept**, in rough priority order:
1. Fix the Button/Card `cssTokens` drift (AUDIT-009) and add the sync-check test — a CLI that resolves incomplete token lists will produce visibly broken copied components.
2. Decide and implement the actual "copy files + rewrite import paths" resolution logic — currently only declarative metadata exists, no resolution code.
3. Decide how a consumer's `styles/tokens.css` (or future `@skrewww/core`) is expected to already define the tokens a copied component references — there's no current mechanism to verify a target repo has the required tokens before a component is copied in.
4. Extend the `dependencies`/`files`/`cssTokens` population to at least a handful of components beyond Button/Card (with the sync-check in place first) to prove the pattern scales before committing further.

---

## 14. Recommended remediation sequence

### Immediate
- AUDIT-001 — add `.claude/**` to `eslint.config.js` and `vitest.config.ts` exclusions. One-line-each, zero product risk, restores trust in the one gate sequence the project's own rules call mandatory.
- AUDIT-002 — triage the 6 `npm audit` findings (at minimum, update `docs/project-status.md` to stop claiming "0 vulnerabilities"; do not leave a false security claim standing regardless of remediation timeline).
- AUDIT-003 — fix README's Combobox Figma-status claim (small, high-clarity-value edit).
- AUDIT-004 — fix the Layer 4 "planned"/"future" language in `skrewww-claude-project-instructions.md`, `README.md`, and `lib/llms-content.ts` (the last is public/LLM-facing and self-contradicts within one generated file — highest-visibility of the three).

### Next
- AUDIT-005/006 — decide a real policy for `siteConfig.lastUpdated` and confirm `NEXT_PUBLIC_SITE_URL` is correctly set wherever this project is actually deployed.
- AUDIT-007 — replace the two raw color literals with tokens (or a deliberate new token for the feedback-surface case).
- AUDIT-008 — correct the Gradient-aliasing claim in `docs/project-status.md`.
- AUDIT-009 — build the `cssTokens`-vs-stylesheet sync-check test before populating more registry entries.
- AUDIT-010 — add `<`-escaping to `JsonLd.tsx`.
- AUDIT-012 — add the README-prose consistency test described in Section 12.

### Later
- AUDIT-011, 013, 014, 015, 016, 017 — low-risk documentation refreshes and a small dead-code check, batchable into routine maintenance.

---

## 15. Commands and methodology

**Commands run (all live, this session, no code changes):** `node --version`, `npm --version`, `npm run verify:node`, `npm run verify:package`, `npm run verify:analytics` (twice — once without credentials to observe the documented failure mode, once with `.env.local` sourced to confirm it genuinely works), `npm run lint` (twice — once raw, once with `--ignore-pattern ".claude/**"` as a diagnostic), `npm run typecheck`, `npm test` (twice — once raw, once with `--exclude "**/.claude/**"` as a diagnostic), `npm run test:browser`, `npm run build`, `npm audit`, `npm run test:all`.

**Search methods:** `grep -rn`/`grep -rEn` across tracked source for TODO/FIXME/HACK, `dangerouslySetInnerHTML`/`eval`/`new Function`, raw color literals in component CSS, `target="_blank"` usage, `forwardRef` presence, `role="grid"` absence, and specific doc-vs-metadata phrase cross-references (e.g. "pending"/"unresolved" in README/architecture docs cross-checked against the corresponding `lib/*-figma-metadata.ts` file). Registry/route/test counts were computed programmatically via a throwaway `tsx` script run from the repository root (so `@/*` path aliases resolved correctly) that imported the real `lib/component-registry.ts`, `lib/data.ts`, `lib/indexing-policy.ts`, `lib/routes.ts`, `lib/registry-public.ts`, and `lib/site-config.ts` modules directly — this script was written and executed entirely outside the repository (in the session scratchpad) and never touched repository files.

**Excluded directories (per audit brief):** `node_modules`, `.next`, `.next-playwright`, `coverage`, `playwright-report`, `test-results`, `.git`, `.claude/worktrees` — none of these were inspected as product source. The one exception: `.claude/worktrees/sleepy-spence-e6b186` was identified and its *effect on tooling* (not its contents as source) is the subject of AUDIT-001 — its contents were not read or treated as part of this repository's implementation.

**Limitations:**
- No Figma MCP access was available in this audit session. All Figma-related findings compare the repository's own recorded metadata/documentation against itself, not against a live Figma file.
- Accessibility and Layer 3 styling audits (Phases 6–7) were spot-checks of the components the brief explicitly named for deep review, plus the two CSS files it explicitly named — not an exhaustive line-by-line pass across all 47 implemented components' CSS and ARIA wiring.
- The live-deployment domain claim in AUDIT-006 (that `skrewww.dev` vs. the real serving domain matters) restates this project's own already-documented fallback mechanism and was not re-verified against an actual live HTTP request to a production URL during this specific audit session — the code-level mechanism and its consequence are fully verified; the current real-world Vercel environment-variable configuration was not re-checked live in this pass.
- `npm audit`'s suggested fix path for `next` (`16.3.0`) was read directly from the audit tool's own output; this audit did not independently verify against the advisory database whether `16.3.0` is actually outside the vulnerable range or merely the next available version npm proposes.

---

## 16. Final verification

- `git status --short` — **empty** at the start of this audit; re-run after writing this report:

```
?? docs/audits/grok-repository-audit-2026-08-07.md
```

- Files created: exactly one — `docs/audits/grok-repository-audit-2026-08-07.md` (this report).
- Confirmation that no production code was changed: confirmed. No file under `app/`, `components/`, `lib/`, `content/`, `styles/`, `scripts/`, or any config file (`package.json`, `eslint.config.js`, `vitest.config.ts`, `tsconfig.json`, `next.config.js`) was modified during this audit. The one throwaway analysis script used to compute Section 2's baseline numbers was written to and executed from the session's external scratchpad directory, never inside this repository, and is not part of this repository's working tree.
