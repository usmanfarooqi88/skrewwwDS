# Project memory — durable decisions

A short decision log for Skrewww: choices and working principles that should still hold next month.

- **This file = durable decisions.** Things that were decided and should not be re-litigated without a new decision.
- **[`project-status.md`](project-status.md) = current / volatile status.** Counts, test results, what shipped when, CI runs, blockers, "next task".
- **Architecture detail lives in [`architecture/`](architecture/)**; this file only records the decision and points there.

Keep entries short, dated, and factual. Do not paste task state, run IDs, test counts or node IDs here. To change a
decision, add a new dated entry that says what it supersedes — do not silently rewrite history.

---

## Product shape

- Skrewww is an AI-first, multi-industry design system platform with four layers: **Foundation**, **Component Library**,
  **Style Systems** (Shape/Surface), **Industry Systems**. It ships as a React/TypeScript library, paired Figma files
  (Free and Pro), a shadcn-style source distribution (`/r/*`), the `@skrewww/react` npm package, and Agent Kit.
- These are **separate distribution paths over one canonical source** — never a second source of truth. The shadcn
  `/r/*` path copies source into a project; `@skrewww/react` is an installed library. See
  [`architecture/react-package.md`](architecture/react-package.md) and
  [`architecture/shadcn-distribution.md`](architecture/shadcn-distribution.md).
- Near-term industry verticals: banking, healthcare, hospitality-booking, enterprise-saas, ecommerce, automotive,
  kiosk-systems, research-scientific. XR is deferred ("eventually").

## Source-of-truth and verification

- The canonical registry and the React implementation decide what exists and what its API is. Figma decides visual
  behavior **only where actually verified**. Generated outputs (contracts, guidelines, manifests, snapshots) are
  projections, never authority. See [`architecture/source-of-truth.md`](architecture/source-of-truth.md).
- Verify against actual source and live tool output, not summaries. Never trust aspirational spec language: assumed
  anatomy can turn out not to exist in code.
- Report honestly. Say what failed, what was skipped and what is unknown; never claim a gate passed that did not run.
- When code and Figma diverge, prefer fixing the real thing to match verified reality over documenting the gap as
  absent — but through an explicit, scoped task, not as a side effect.
- Unknown is not pass and not error: name the authority that would resolve it and stop when the decision depends on it.

## Figma practices

- Figma is **read-only unless a task explicitly authorizes a write**. Never publish a library, Figma Community file or
  Gumroad upload without an explicit request.
- State indicators must not alter control dimensions: a decorative selected-state indicator that would otherwise change
  component size is overlaid / out-of-flow (decided 2026-10-02; applied to Tabs).
- Prefer property/variable-tree inspection over screenshots for verification, then confirm the visual result by eye:
  property checks can all pass while a visual defect (for example a missing blur) remains.
- System-level properties live on **masters**, never as instance-level overrides.
- Surface (Flat/Gradient/Glass) validation needs the interactive switch-mode-and-check approach, not a static token
  sweep. Real Glass needs both a translucent color and a background-blur effect bound at the master level.
- Radius: Badge, Avatar, Calendar Day and Skeleton Circle are intentional fixed-circular exceptions (`radius/full`);
  other controls follow the Shape-aware component radius tokens.
- When briefing with Figma-verified data, include the actual node IDs in the brief text. Re-resolve node IDs live
  before writing; do not reuse stale ones.
- Keep a single Figma Desktop Bridge instance connected; if it fails, check for a second instance on the fallback port.

## Components and naming

- The canonical component name is **Data Table** (not "Data Grid"), to avoid grid/spreadsheet-navigation connotations;
  its v1 scope is sorting only.
- Docs-only components (no registry entry) are never presented as installable React components.
- Public export names come from `components/ui/index.ts`; anything under `components/ui/internal/` is not public API.
- One-off resolved architectural comparisons go in `lib/component-registry-content-data.ts`'s existing comparisons
  array, not new per-component metadata files.

## Spacing standard (decided 2026-10-02)

> **Skrewww uses a 4px base spacing grid with an 8px-preferred macro rhythm.**

- Micro/component spacing may use 4px increments; macro/layout spacing prefers 8px multiples. Skrewww is **not** a
  strict 8pt system.
- Priority: **existing `spacing/<n>` token → valid 4px-grid value → arbitrary value only with a documented
  exception.** No one-off spacing tokens for isolated tweaks; prove the scale cannot represent a need before adding one.
- Keep scales separate: opacity, radius, typography and border width have their own tokens.
- `spacing/2` is a **documented retained exception** for established anatomy (seams, insets, micro gaps).
- `spacing/6` is **deprecated for new use**, with a staged migration; **no silent token migration is allowed** — each
  stage is an explicit, scoped task with Free/Pro synchronized and nothing published as a side effect.
- `spacing/6` stays in the scale as a **scoped exception, not a general spacing choice** (decided 2026-10-03); the justified
  anatomies are the Badge Small horizontal inset and Tooltip vertical padding, where Figma and React agree. It is not
  to be used elsewhere and is not slated for deletion.
- Stage 1 (Figma-only parity gaps where React was already compliant) is done; the Tabs 6px was resolved by restructuring the indicator as an overlay (see
  the state-indicator rule under Figma practices). Full detail and status: [`architecture/spacing-foundation.md`](architecture/spacing-foundation.md).
- Small interactive controls use explicit tokenized heights with vertically centered content; control height must not be
  derived from deprecated off-grid spacing values (decided 2026-10-02 after the Small-control migration).
- Figma Combobox follows the shared Small / Medium / Large control-size family and mirrors Select sizing anatomy (decided
  2026-10-03). The wider gap between Figma Medium/Large control heights and React's is not resolved by this.

## Release, distribution and git discipline

- `@skrewww/react` releases are manual, by the npm scope owner, only on explicit request, and prereleases are published
  with an **explicit `--tag beta`** (npm ignores `publishConfig.tag`; `prepublishOnly` enforces it).
- Make Kit guidelines are **generated** from canonical metadata plus one short manual setup file; a Make Kit never
  replaces Agent Kit, and Figma snapshots are evidence, not authority.
- Skrewww Make Kit v1 uses the published React package plus generated guidelines with no attached Figma library while the npm package remains a pilot subset of the Figma libraries (validated in
  the real Make environment, 2026-10-03). The kit pins an exact published `@skrewww/react` version; the Make-assigned kit package (`@make-kits/…`) is not the runtime package.
- Make host-shell keyboard focus can escape the embedded preview; that is a Make environment limitation and must not be confused with the package-level Dialog focus behavior.
- Commits are SSH-signed and selectively staged — never `git add .`/`-A`, never force-push or rewrite published history,
  and never stage generated output (`public/r`, `public/agent`, `dist`, tarballs, `make-kit/dist`) or unrelated untracked paths.
- Do not start the next roadmap task after a task's stop point; surface it and wait.
