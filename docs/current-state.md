# Skrewww — Current State

**Last updated:** 2026-11-01
**HEAD:** 9cafd9637 (`main`) plus this file's own commit (a commit cannot record its own hash)

Fast orientation layer only. Detailed history lives in [project status](project-status.md) (canonical, not duplicated here).
Items tagged *(owner-reported)* come from the owner's instructions and are not recorded in the repo docs.

## Active task

**AC-0 — Adaptive Context Audit** (read-only gate). Refresh the AK-0 findings for the adaptive-context use case:
current per-field coverage for all contract slugs, edge classification, baseline retrieval cases, false-negative risks,
and an evidence-backed decision record. No schema edits, telemetry or ADOPT/EXPERIMENT labels at this stage.
No AC-0 audit document exists yet (`docs/audits/` has none).
Source: [roadmap](architecture/agent-kit-adaptive-context-roadmap.md) AC-0; project-status Phase roadmap row "Adaptive Context & Decision Efficiency".

## Next 3 after that

Locked sequence; each is conditional on the previous exit gate.

1. **AC-1** — Schema / source-of-truth decision: explicit no-schema-change or schema-change decision, before any retrieval change.
2. **AC-2** — Adaptive retrieval extension to the existing AK-3 layer, using only audit-approved signals and keeping dependency closure.
3. **AC-3** — Extend AK-5 evaluation: paired runs (full context, compact context, adaptive) with frozen thresholds before results.

Beyond AC-3: AC-4 (usage-aware hot cache) and AC-5 (low-risk decision layer) are experiments only; see parked.

## Blocked / needs decision

- **`docs/community/`** — untracked and not in `.gitignore`. project-status notes it was "left untracked/untouched". Needs inspection, then track or gitignore.
- **`app/compare/` production verification** *(owner-reported)* — `app/compare/`, `components/compare/`, `lib/comparison.ts`, `lib/comparison.test.ts` and `docs/audits/compare-research-2026-10-17.md` are untracked and uncommitted. The work is not recorded in project-status, and no production verification is recorded.
- **`evals/agent-kit/runs/ak5-v4-05e7525-claude-code-sonnet5-safe/`** — untracked (31 files, 168 KB). v1–v3 are committed evidence, so needs a review-and-commit decision; do not gitignore `runs/`.
- **`skills/skrewww-design-system.md`** — untracked; decide together with `docs/community/` (publishing-prep pair).

## Recently completed (last 7 days)

From `git log` and GitHub; none are recorded in project-status yet.

- 2026-11-01: Dependabot security batch merged: `next` 16.4.3 (PR #21, `89276d907`) and `source-map-js` 1.2.2 (PR #15, `9cafd9637`). `sharp` 0.35.5 arrived via #21 (#16 auto-closed). CI and Vercel Production green.
- 2026-11-01: 3 critical + 4 high runtime vulnerabilities on skrewww.com fixed (`next` ×5, `sharp`, `source-map-js`). `npm audit --omit=dev` reports 0. `@skrewww/react` was never affected.
- 2026-10-30: Clarified shadcn distribution and OSS directory wording (`5d65e0b31`)
- 2026-10-30: Improved Button and Text Input guidance (`8958386ae`)
- 2026-10-30: Track Figma and Gumroad CTA clicks from the Resources menu and mobile drawer (`f2d01a966`)
- 2026-10-30: Clarified that 1.0.0 is the documentation platform release, not a product version; refined structured data (`01aecc14d`)
- 2026-10-30: CI run `41041824231` failed on a transient Google Fonts fetch; rerun (job `124028297778`) passed. No commit.

## On hold / parked

- **AC-4 usage-aware hot cache** and **AC-5 low-risk decision layer** — experiments, only after AC-3 justifies them (roadmap).
- **Skrewww UI builder (post-Agent Kit)** *(owner-reported)* — not mentioned in repo docs.
- **AK-7 Skill truth refresh** — not mentioned in `agent-kit.md` or project-status, so not listed as an item. AK-0…AK-6 are all recorded complete.
- **CCV-6 compatibility baseline** — next CCV slice, "not started" (project-status, 2026-10-11). CCV-7 follows.
- **Guard CI-2 / CI-3** — "NOT STARTED" (project-status header).
- **Multi Select** — CE-2D decision D, deferred (not implemented, not rejected). **App Shell** — CE-2I decision D, Reference-App template first.

## Known open issues

- **22 open Dependabot alerts, all dev-only** (6 high: `undici` ×5, `vite` ×1; 12 medium; 4 low). None reach the shipped site or the package. Open PRs: #20 `undici`, #18 `vite`, #13 `brace-expansion`, #22 `postcss-selector-parser`, #23 `@vitest/mocker` + `vitest`.

- **CI font-fetch failure** — `next/font/google` (JetBrains Mono) failed once on CI; the rerun passed. Monitor for recurrence. If it recurs, cache `.next/cache` in `ci.yml` before considering `next/font/local`.
- **Dark semantic/text/danger contrast ~2.78:1** *(owner-reported)* — figure not found in tracked files; needs a measured source before work starts.
- **project-status.md is stale** — "Last verified" 2026-10-11; newest entry is CCV-5. Oct 23–30 work is not logged there.
- **F1: shadcn CLI drops the `@skrewww-component` origin marker on install** — recorded, not fixed. 67 known `UPSTREAM_TRANSFORM` verifier failures (55 marker removals plus 12 leading-comment removals).
- **CCV deferrals** — `react-package.yml` path filter lacks `lib/consumer-scenarios/**`; `smoke:consumer` pins shadcn 4.16.2 vs CCV 4.21.1 (both CCV-7).
- **Make Kit (MK-2E) limitations** — Make-environment focus-escape and generated-demo link limitations.
