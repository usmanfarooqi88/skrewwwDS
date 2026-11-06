# AC-0 — Adaptive Context Audit report

**Date:** 2026-11-01
**Audited commit:** `b13fbc57e` (`main`)
**Mode:** read-only audit. No schema change, no implementation, no telemetry, no ADOPT / EXPERIMENT / REJECT label.
**Roadmap:** [agent-kit-adaptive-context-roadmap.md](agent-kit-adaptive-context-roadmap.md), stage AC-0.

All numbers below were measured at the audited commit from the generated `public/agent/` output (`npm run generate:agent-context`), the canonical registry (`componentRegistry`), the generated `public/r/` manifests, and the component source files. No historical AK-0 count is reused.

## 1. Executive summary

- **Scope confirmed:** 58 contracts = 58 registry entries (the slug sets are identical). 27 stable, 31 beta. 6 categories. 4 Recipes and 1 Feature Kit.
- **Install closure is sound where it exists.** For the 55 contracts that have a `distribution` block, `registryDependencies` is identical across the registry, the contracts and the `public/r` manifests (0 mismatches). It also matches the component source imports exactly: every declared component edge is seen in source, and no undeclared component import exists.
- **3 contracts have no machine-readable edges at all:** `banking-account-card`, `banking-balance-summary`, `banking-transaction-row` have no `distribution` block. Their 12 composition edges exist only in component source and, untyped, in `relatedComponents`.
- **`relatedComponents` is not a dependency field.** 159 of its 181 links are not install edges, 105 of 181 have no reverse link, and 5 point at slugs that have no contract.
- **Composition beyond install edges and the 4 Recipes is not modeled.** The project's own documents say this is deliberate (`system.json`, `agent-readiness.md` rows "composition" and P2-1).
- **The discovery index is thin.** `index.json` carries only `slug`, `name`, `category`, `status` and `apiPropertyNames`. It carries no summary and no edges.
- **Decision record: (b) Canonical source metadata gap identified.** See section 8.

## 2. Methodology

| Item | Method |
|---|---|
| Contracts | All 58 files in `public/agent/contracts/` parsed; every key path to depth 3 classified as populated, empty (`""`, `[]`, `{}`), null or absent. |
| Registry | `componentRegistry` imported via `tsx` (58 entries); `registryDependencies` and `internalDependencies` compared with the contracts and with `public/r/<slug>.json`. |
| Source imports | For each registry entry, its `files` (or, for undistributed entries, the matching `components/ui/<Name>.tsx`) were scanned for `@/` and relative imports. Imports were resolved to files and mapped to the owning slug. CSS-module imports were counted separately from `.ts`/`.tsx` imports. |
| Recipes / kits | `public/agent/recipes/*.json` and `feature-kits/*.json` read; required and optional components extracted. |
| Retrieval baseline | See section 6. There is **no ranking code** today; "current retrieval" is the agent-driven flow in `agent/skill/SKILL.md` (read `index.json`, pick slugs, read contracts, optionally read a Recipe). |
| Size estimates | Bytes measured on disk; tokens are **estimated as bytes ÷ 4** (a heuristic, not a tokenizer). |

Documents read: the roadmap (full); `project-status.md` (header and newest entries only); `agent-kit.md` (AK-3 retrieval section); `SKILL.md` (lookup and Recipe sections); `source-of-truth.md` (outline); `agent-readiness.md` (targeted lines on composition and coverage); `system-contract.ts` (head); `content/*.ts` only through the compiled contract fields. The measurement scripts were run from a scratch directory and are not committed.

## 3. Field coverage (58 contracts)

"Populated" means present and non-empty.

| Field | Populated | Empty | Absent | Note |
|---|---|---|---|---|
| `schemaVersion`, `slug`, `name`, `category`, `status`, `version`, `summary` | 58 | 0 | 0 | |
| `accessibilityLevel` | 58 | 0 | 0 | **Constant:** `WCAG 2.2 AA (target)` on all 58. |
| `availability.react` | 58 | 0 | 0 | **Constant:** `available` on all 58. |
| `availability.figma` | 58 | 0 | 0 | 47 available, 6 partial, 5 unavailable. |
| `guidance.purpose`, `whenToUse`, `whenNotToUse`, `commonMistakes`, `accessibility` | 58 each | 0 | 0 | Free text, median 105–151 characters. |
| `guidance.knownLimitation` | 18 | 0 | 40 | |
| `api.properties` | 58 | 0 | 0 | 1–16 per contract (median 6); 389 properties, 187 distinct names, 127 names used by only one contract. |
| `api.variants` | 56 | 2 | 0 | String values only. |
| `api.sizes` | 14 | 44 | 0 | |
| `tokens.used` | 58 | 0 | 0 | Median 6 per contract. |
| `relatedComponents` | 58 | 0 | 0 | 181 links in total. |
| `openQuestions` | 58 | 0 | 0 | Median 2, maximum 7. Free text. |
| `figma.verified` | 58 | 0 | 0 | 24 true, 34 false. |
| `figma.nodeId` / `figma.sourceUrl` / `figma.identity` | 24 / 19 / 5 | 0 | 34 / 39 / 53 | |
| `behavior` | 49 | 0 | 9 | |
| `behavior.keyboard` / `focus` / `announcement` / `dismissal` / `motion` | 43 / 20 / 22 / 6 / 2 | 0 | 15 / 38 / 36 / 52 / 56 | All strings. |
| `distribution` | 55 | 0 | 3 | The 3 absent are the `banking-*` contracts. |
| `distribution.registryDependencies`, `internalDependencies`, `files`, `hostRequirements`, `coreDependencies` | 55 each | 0 | 3 | |
| `distribution.cssTokens` | 50 | 0 | 8 | Absent for 5 distributed contracts: `alert`, `radio-group`, `split-button`, `timeline`, `tree-view`. |
| `distribution.dependencies` (npm packages) | 26 | 0 | 32 | Absent means "none declared" for distributed contracts, and unknown for the 3 undistributed ones. |
| `provenance.*` | 58 | 0 | 0 | |

`index.json` (the discovery index) is a projection of 5 contract fields: `slug`, `name`, `category`, `status`, `apiPropertyNames`.

## 4. Edge classification

Each source is kept separate. Counts are of edges between components (slugs) unless stated.

| Source | What it states | Count | Machine-actionable | Finding |
|---|---|---|---|---|
| **Install dependency**<br>`registryDependencies` | What `shadcn add` also installs | 55 of 55 list `@skrewww/foundation` (constant); **28 component edges across 18 slugs** | Yes (exact slugs) | Registry, contract and `public/r` manifest agree for all 55. Most-used targets: `form-field` 8, `popover` 4, `validation-message` 4, `link` 2. All targets are valid slugs. |
| **Internal file dependency**<br>`internalDependencies` | Private files copied with the component | 200 file entries over 55 contracts | Yes, but values are file paths, not slugs | 78 `lib/`, 97 `components/ui/internal/`, 15 other `components/ui/` source files, 9 CSS modules, 1 public asset. 7 entries are non-public sibling components (`TextInputControl.tsx` ×5, `CalendarMonthCell.tsx`, `CalendarYearCell.tsx`). |
| **Package / host dependency** | `dependencies`, `hostRequirements`, `coreDependencies` | `react` + `react-dom` on 55 (constant); `tokens` on 55 (constant); `shape` and `surface` on 4 (`button`, `card`, `chart-card`, `text-input`); npm packages on 26 (`@phosphor-icons/react` 23, `recharts` 3) | Yes | `shape` / `surface` are sparse: absence on the other 54 is unknown, not "unsupported". |
| **Explicit Recipe composition** | `requiredComponents`, `optionalComponents` | 4 Recipes covering **10 distinct components** of 58 | Yes | `validated-text-field` (req `text-input`; opt `form-field`, `validation-message`), `destructive-confirmation` (`dialog`, `button`), `loading-and-inline-feedback` (`skeleton`, `spinner`, `alert`), `search-no-results` (`search-field`, `empty-state`; marked `containsBeta`). One Feature Kit groups 3 of the 4 Recipes. |
| **Related-component hint**<br>`relatedComponents` | Editorial "see also" link `{label, href}` | **181 directed links**, 1–9 per contract | `href` parses to a slug; the relation itself is untyped | 76 links have a reverse link and 105 do not (including the 5 dangling). **5 dangling:** `button→icon-button`, `tabs→top-nav-item`, `menu→menu-item`, `list-item→menu-item`, `tree-view→tree-item` (no registry entry or contract for those slugs). |
| **Source-import composition** (extra evidence, not in the contracts) | Component A imports component B's `.ts`/`.tsx` | **40 edges** | Only by scanning source | 28 are the declared `registryDependencies` edges, so there is no declared-but-unseen edge. **12 are undeclared and all belong to the 3 `banking-*` contracts.** 4 further edges are shared CSS modules (`split-button→button-group`, `textarea`/`select`/`combobox→text-input`) and are recorded as `internalDependencies`, not component edges. |

**Overlap patterns**
- 22 of the 28 install edges also appear in `relatedComponents`; 6 do not (so a related-only walk misses them).
- 159 of the 181 related links are not install edges.
- 34 of the 40 source-import edges also appear in `relatedComponents`; 6 do not.
- The 12 `banking-*` edges to `avatar`, `badge`, `list-item`, `popover`, `card`, `tag`, `button`, `line-chart`, `bar-chart`, `tabs` and `skeleton` appear in the contracts only as `relatedComponents` entries, mixed with non-dependencies. `banking-transaction-row` also lists `banking-account-card`, which it does not import.
- Compound sub-components appear only as pseudo-property names inside `api.properties` (for example `Step.children`, `AccordionPanel children`, `DialogBody children`). They are not edges.

## 5. Rankability by field

"Deterministic" means exact matching is possible; "semi-deterministic" means bounded fuzzy; "editorial" means natural language; "sparse" means too few populations to rely on.

| Field | Judgment | Evidence |
|---|---|---|
| `slug`, `name` | Deterministic | 58 unique. |
| `category` | Deterministic, coarse | 6 values: Content & Data 18, Forms 17, Feedback 7, Containers & Overlays 6, Actions 5, Navigation 5. |
| `status` | Deterministic | stable 27 / beta 31. |
| `api.properties[].name` | Deterministic, high selectivity | 187 distinct names; 127 appear in exactly one contract; the most common (`label` 23, `value` 14, `disabled` 14) are low-selectivity. Subcomponent entries are encoded as pseudo-names. |
| `api.variants` | Deterministic values | 56 of 58; string values only. |
| `api.sizes` | Sparse | 14 of 58. |
| `tokens.used` | Deterministic, narrower than CSS by design | Median 6, versus a median of 13 `cssTokens`; not interchangeable. |
| `distribution.registryDependencies` | Deterministic | Section 4. |
| `distribution.cssTokens` | Deterministic, incomplete | Absent for 5 of 55 distributed contracts. |
| `distribution.coreDependencies` (`shape`, `surface`) | Sparse | 4 of 55. |
| `accessibilityLevel`, `availability.react`, `hostRequirements`, `provenance` | Deterministic but constant | Same value on every contract, so they cannot discriminate. |
| `availability.figma`, `figma.verified` | Deterministic | 47 / 6 / 5 and 24 / 34. |
| `relatedComponents` | Semi-deterministic | The slug is parseable from `href`; the relation is untyped; 5 dangling; mostly not dependencies. |
| Recipe `requiredComponents` / `optionalComponents` | Deterministic, sparse coverage | 10 of 58 components. |
| `summary` | Editorial | 74–289 characters (median 124); no duplicates. |
| `guidance.*` | Editorial | Medians 105–151 characters (`commonMistakes` up to 688). |
| `openQuestions`, `guidance.knownLimitation` | Editorial | Free text; 18 `knownLimitation`. |
| `behavior.*` | Editorial and sparse | Strings; `keyboard` 43, `focus` 20, `announcement` 22, `dismissal` 6, `motion` 2. |
| `figma.nodeId` / `identity` | Sparse | 24 / 5 of 58. |

This audit establishes which fields are machine-readable. It does **not** measure whether any field, or combination, ranks relevant contracts correctly: no labelled query set exists (section 9).

## 6. Retrieval baseline cases

**Baseline procedure.** There is no ranker. The reference selection is the set of contracts an agent following `SKILL.md` would need to read for each task. It was chosen by the auditor from the contract text and is an audit instrument, not a proposed ranker. Closures are computed per edge type. The "index-only probe" tokenizes the query and matches it against the name, category and `apiPropertyNames` fields of `index.json`.

Reference sizes: all 58 contracts 307,124 B (~76,800 tokens); `index.json` 17,895 B (~4,500); `system.json` 3,556 B (~900). Contract size: min 2,638 B, median 5,061 B, max 10,274 B.

| # | Query | Reference selection | Install closure added (excl. foundation) | Selection + closure | Recipe |
|---|---|---|---|---|---|
| 1 | form field with validation message | `text-input`, `form-field`, `validation-message` (stable) | none | 16,118 B (~4,030 tok), 5.2% of all contracts | `validated-text-field` (5,976 B) |
| 2 | chart inside a dashboard card | `chart-card`, `line-chart` (beta) | `card`, `empty-state`, `alert`, `skeleton`, `button`, `link` (+28,299 B) | 46,785 B (~11,700 tok), 15.2% | none |
| 3 | button with an icon | `button` (stable) | none | 8,582 B (~2,150 tok), 2.8% | none |
| 4 | confirmation dialog for a destructive action | `dialog`, `button` (stable) | none | 14,945 B (~3,740 tok), 4.9% | `destructive-confirmation` (5,319 B) |
| 5 | searchable dropdown | `combobox` (beta) | `form-field`, `popover`, `validation-message` (+15,210 B) | 21,623 B (~5,400 tok), 7.0% | none |
| 6 | date picker | `date-picker` (beta) | `calendar-grid`, `popover`, `form-field`, `validation-message`, `calendar-day` (+25,269 B) | 30,728 B (~7,680 tok), 10.0% | none |
| 7 | banking transaction list row | `banking-transaction-row` (beta) | **none declared** | 5,317 B (~1,330 tok) | none |
| 8 | loading skeleton with inline error feedback | `skeleton`, `spinner`, `alert` (stable) | none | 10,033 B (~2,510 tok), 3.3% | `loading-and-inline-feedback` (5,189 B) |

**Findings per case**
- **Case 2:** the contract for `chart-card` lists `empty-state`, `alert` and `skeleton` as install edges, but its `relatedComponents` lists `card`, `chart-metric`, `bar-chart`, `line-chart` and `area-chart`. The related list covers only `card` of the six closure members; the full closure is reachable only through `registryDependencies`.
- **Case 3:** `button` lists `icon-button` as a related link, and no `icon-button` contract exists. The index-only probe finds `button` plus 7 other slugs.
- **Case 5:** the index-only probe returns **0 hits** for "searchable dropdown", although `combobox` exists. `index.json` has no summary text, so discovery depends on name, category and property names.
- **Case 6:** `validation-message` and `calendar-day` appear only in the transitive closure (through `form-field` and `calendar-grid`).
- **Case 7:** the source imports `avatar`, `badge`, `list-item` and `popover` (+19,335 B), but no machine-readable field states this. A closure over declared edges is empty.
- **Cases 1, 4, 8:** the Recipe's components equal the reference selection.

**Compact context (index entry only).** An index entry for the selected contracts is 163–563 B (~41–141 tokens). It retains `slug`, `name`, `category`, maturity `status` and API property **names**. It omits, for every selected contract: property types, defaults and descriptions; `variants` and `sizes` values; all `guidance` (including `whenNotToUse`, `commonMistakes`, `accessibility`); `tokens`; `behavior`; `openQuestions`; `figma` / `availability`; `relatedComponents`; and the whole `distribution` block, so **every install edge and every installability fact is lost**.

## 7. False-negative risks

Missing or unknown metadata means unknown, never "no dependency".

| # | Risk | Concrete example |
|---|---|---|
| 1 | **Required component missed because its closure is not followed.** | `chart-card` needs `card`, `empty-state`, `alert`, `skeleton` (+ transitive `button`, `link`); `date-picker` needs `calendar-grid`, `popover`, `form-field` (+ `calendar-day`, `validation-message`). |
| 2 | **Components with no machine-readable edges.** | 3 `banking-*` contracts have no `distribution` block; 12 composition edges are only in source. |
| 3 | **Related hint treated as a dependency, or vice versa.** | 159 of 181 related links are not install edges; 6 install edges are not in the related list; `banking-transaction-row` lists a sibling it does not import. |
| 4 | **Dangling related links.** | `icon-button`, `top-nav-item`, `menu-item` (×2), `tree-item` resolve to no contract. |
| 5 | **API allow-list bypass or loss.** | Only names in `api.properties` count as props. A compact entry keeps the names but loses `variants` / `sizes` values (for example `button` `primary` / `secondary` / `danger`). Subcomponent props appear as pseudo-names such as `Step.children`, which a name-only match cannot separate from real props. `className` is declared by 1 contract, `children` by 8; the audit did not check whether components accept other native attributes. |
| 6 | **Maturity.** | 31 of 58 are beta, including `chart-card`, `date-picker`, `combobox` and all `banking-*`. `search-no-results` is `containsBeta`. `status` survives in the index, but Recipe-level caveats do not. |
| 7 | **Installability invisible in compact context.** | The 3 `banking-*` contracts are implemented but not distributed; `index.json` has no distribution information. |
| 8 | **Accessibility facts absent, not absent-by-design.** | `behavior` is absent on 9 contracts (`avatar`, `banking-account-card`, `banking-balance-summary`, `button`, `calendar-day`, `card`, `divider`, `tag`, `text-input`) and `behavior.keyboard` on 15. `accessibilityLevel` is identical on all 58. `guidance.accessibility` is populated on all 58 but is free text. |
| 9 | **Figma, Shape and Surface unknowns.** | `figma.verified` is false on 34; Figma is partial or unavailable on 11; `shape` / `surface` are declared on 4 only. |
| 10 | **Lexical discovery failure.** | "searchable dropdown" matches nothing in `index.json` although `combobox` exists (case 5). |
| 11 | **Token fields differ.** | `tokens.used` (Figma-verified, narrower) and `cssTokens` (CSS) are not interchangeable; `cssTokens` is absent for 5 distributed contracts. |

## 8. Decision record

**(b) Canonical source metadata gap identified.**

The gap, stated without a proposed fix:

- **G1 (evidenced):** three contracts (`banking-account-card`, `banking-balance-summary`, `banking-transaction-row`) carry no machine-readable dependency or composition edges, because they have no `distribution` block. Their 12 composition edges to other components are recoverable only from component source and, untyped, from `relatedComponents`. The roadmap's AC-1 condition, that all required dependency closure can be preserved, cannot be met for these contracts from the contracts alone.
- **G2 (evidenced; impact not established):** the contract schema has no typed composition relation. The only typed relations are install edges (28, over 55 distributed contracts) and Recipe edges (10 components of 58). `relatedComponents` is untyped, partly dangling and mostly not a dependency. The project's documents record this as deliberate: `system.json` states composition structures are not modeled, and `agent-readiness.md` lists composition as "deliberately unmodeled since AK-1" (row P2-1). This audit cannot say whether G2 omits any component that is required for correctness, because no labelled ground truth exists.

Evidence for the other two options, for the record:
- **(a) not chosen:** install closure is sound for 55 contracts (strong evidence), but G1 prevents a closure-preserving pass over all 58.
- **(c) not chosen:** G1 is directly evidenced. G2 is the part for which evidence is insufficient (section 9).

## 9. Open questions and evidence gaps

1. **No labelled retrieval cases exist.** The 8 reference selections in section 6 were chosen by the auditor. Whether any field ranks relevant contracts correctly is **not measured** here.
2. **Is the missing `banking-*` edge data intentional?** They are beta and undistributed; the audit cannot tell whether composition requirements were meant to be omitted.
3. **What are the 5 dangling related links?** `icon-button`, `top-nav-item`, `menu-item`, `tree-item`: planned components, sub-parts, or stale links? No registry entry or contract exists.
4. **Is a required-by-composition edge (beyond install and Recipes) ever needed for correctness?** For example, does `dialog` require `button`? Only the `destructive-confirmation` Recipe states it.
5. **Native attributes.** Whether components accept native attributes beyond `api.properties` was not verified here.
6. **`guidance.*` provenance.** Guidance is compiled from `content/*.ts`; this audit read it only through the compiled contract fields.
7. **Token size.** The ~4 characters-per-token estimate is a heuristic, not a measured tokenizer count.
8. **Linux / CI.** All measurements were taken on macOS at one commit.

## 10. Gates before AC-1

From the roadmap's AC-0 exit gate and the findings above:

1. The owner reviews this report and the source-of-truth map (the AC-0 exit gate).
2. The owner confirms or revises the decision record (b), including the intent behind G1.
3. A labelled set of retrieval cases (task → required components) is agreed, so that G2 can be judged. Without it the roadmap's "no-schema-change or schema-change decision" cannot be made on evidence.
4. The 5 dangling related links are classified (planned, sub-part, or stale).
5. Per the roadmap, AC-1 identifies the authoritative place where any missing fact can be maintained and verified. That is AC-1 work and was not attempted here.

## 11. Addendum A1: Owner revision of Q3 (2026-11-06)

**Status:** Append-only addendum. Sections 1-10 and decision record (b) are unchanged. This addendum does not authorize an AC-1 schema change.

**What prompted it.** The Gate 1 investigation of the three banking components (2026-11-01, a separate note, not part of this report) classified their 12 composition edges. It found the distribution deferral documented, and no banking-specific statement about contract-level composition metadata. On review, the owner revised the reading of open question 2 (section 9).

**Revised Q3 position (owner).**
- Anatomy, states, composition and slots were deliberately left unmodeled in AK-1 and deferred until a real source became available (`docs/architecture/agent-kit.md`, section "Compiled fields vs. deliberately unmodeled fields"; `docs/architecture/agent-readiness.md`, the row "anatomy, states, composition, slots ... deliberately unmodeled since AK-1" and P2-1). The original AK-1 omission was intentional. Section 8 G2 already cited the project documents; this addendum adds the stated reason and the deferral.
- The banking-specific absence of typed composition edges was not separately documented as an intentional decision. The earlier statement that no project-level decision existed was incomplete.
- Recorded conclusion (owner wording): "Composition structures were deliberately deferred in AK-1 because no authoritative real source was available. Banking now provides a concrete source for its 12 code-level import relationships. This satisfies the evidence requirement for evaluating import dependency edges, but does not by itself establish a complete semantic composition model."

**Three layers that must stay distinct.**

| Layer | What it establishes | Evidence | Status |
|---|---|---|---|
| 1. Import dependency closure | Which components import which | Static imports in component source (12 verified for banking) | A real source exists for code-level edges |
| 2. Render-time composition semantics | Whether a child is mandatory or conditional, slots, state relationships | Render-path and implementation evidence | Source-reading classification only (below); render-time verification pending |
| 3. Authoritative contract metadata | Where each fact is maintained and verified (registry or contract fields) | Not established | Undecided. This is AC-1 work |

**Layer 2 classifications recorded by the owner (from source reading).** Class A: Card, Tag, Button, LineChart (banking-account-card); Card, BarChart, Tabs (banking-balance-summary); Avatar, Badge, ListItem, Popover (banking-transaction-row). Class C: Skeleton (conditional on the loading state). All 12 remain required for compile and install closure because they are static imports, whatever their class.

**Effect on this report.**
- Section 8, G1 and G2: unchanged. Decision record (b): unchanged.
- Section 9, question 2: refined. The distribution deferral is documented as intentional. Typed composition was deferred project-wide in AK-1, with a stated reason. The absence of install and dependency edges for the three undistributed banking contracts has no recorded decision; the working hypothesis is a side effect of their undistributed state, not confirmed.
- Section 10, gate 2: the owner has revised the understanding of the intent behind G1. Gates 3 to 5 remain open.

**Still open at the time of this addendum (read-only):** commits b1e7fe60c and a821f6b0d; render-time verification of the 12 edges; classification of the 5 dangling relatedComponents links; labelled retrieval cases; a recomputed scan of undeclared edges and reverse dependents.

**Not authorized by this addendum:** schema, contract, registry or implementation changes; an AC-1 decision; ADOPT, EXPERIMENT or REJECT labels.

## 12. Addendum A2: Follow-up investigation and owner decisions (2026-11-06)

**Status:** Append-only addendum. Sections 1-11, including Addendum A1, are unchanged. **AC-0 remains open.** AC-1 remains unauthorized. This addendum is read-only documentation. It changes no contract, schema, registry file or implementation. The Gate 1 note (`docs/architecture/ac-0-gate-1-banking-edges.md`, uncommitted) is unchanged. This addendum supersedes the 'Still open' list in Addendum A1; A1 itself is unchanged.

**Layer tags.** Findings are tagged as in A1: **[L1]** import dependency closure, **[L2]** render-time composition semantics, **[L3]** authoritative contract metadata. Evidence for one layer is not used as evidence for another.

### 12.1 Method and limits

- Read-only follow-up: commit inspection, jsdom render observation with the repository's Vitest setup, document review, and a source scan of all 58 slugs. Scratch files lived in a gitignored location and were deleted. HEAD was `db0a3f05f` when this addendum was written; the only tracked-file change is the Addendum A1 edit plus this addendum.
- The render observation in 12.3 was recorded in the follow-up run; its scratch test was deleted and was not re-run when this addendum was written. The three existing banking test files were re-run at write time: 3 test files, 20 of 20 tests passed (Vitest 4.1.11).
- Render observation used jsdom with the repository's ResizeObserver polyfill and minimal required props. It did not use a real browser. Children were identified by counting elements that carry each child's CSS-module class tokens (plus recharts classes and ARIA roles for charts). Confidence: high for Card, Tag, Tabs, Skeleton, Avatar, Badge, ListItem and open Popover content; medium for Button (no standalone control to validate against) and for LineChart versus BarChart (shared ChartFrame module).
- The source scan treats helper files not owned by a slug as internal and traverses them. It did not scan CSS `composes` or JSX strings.
- No claim in this addendum carries a [VERIFY-n] tag; each was confirmed against HEAD or removed before writing. Observations from scratch renders recorded in the follow-up run are marked 'not re-run at write time'.

### 12.2 Commit review [L1]

| Commit | Banking files touched | Component edges | Registry / contract / related / openQuestions / composition wording |
|---|---|---|---|
| `b1e7fe60c` (2026-08-31) | Among banking component, registry and contract files, only `lib/banking-figma-metadata.ts` (comment-only reword about Data Table). Also reworded one Banking-pilot paragraph in `docs/project-status.md` (the Data Table wording). It did not touch banking component source, stylesheet, registry or contract entries. | unchanged | none |
| `a821f6b0d` (2026-08-07) | Among banking component, registry and contract files, only `lib/banking-figma-metadata.ts` (+11 doc-comment lines; 7 sibling `*-figma-metadata.ts` files got the same comment). Other files touched (lines added/deleted, `git show --numstat`): `README.md` (2/2), `components/ui/internal/useEscapeKey.ts` (0/17), `docs/audits/grok-repository-audit-2026-08-07.md` (487/0), `docs/project-status.md` (23/1), `eslint.config.js` (7/2), `lib/data.ts` (0/4), `lib/llms-content.ts` (1/1), `lib/routes.ts` (0/5), `package-lock.json` (29/29), `skrewww-claude-project-instructions.md` (1/1), `vitest.config.ts` (1/1). 19 files in total, 639 insertions, 63 deletions. Changed lines that mention banking in passing: `README.md` (1), `skrewww-claude-project-instructions.md` (1) and the new audit document (11); none of them touch banking component source, stylesheet, registry or contract entries. | unchanged | none |
| `fe1309da2` (2026-07-25) | none; it extended `LineChart` (`sparkline`) and `ListItem` (aria passthrough) and predates the banking files | n/a | n/a |
| `28df96011` (2026-08-20) | The latest commit touching a banking component source file or stylesheet is `28df96011` (2026-08-20). It changed `banking-transaction-row.module.css` (+6/-1) and added or changed the test, preview, e2e spec and content entries. `BankingTransactionRow.tsx` did not change. | unchanged | token rename `semantic/action/danger` to `semantic/text/danger` and a `commonMistakes` edit; no composition wording |

Observation: the message of `a821f6b0d` describes changes to `calendar-math.ts` (deleting `findNextEnabledDate`, `monthFromDate` and `firstDateInMonth`), `useCalendarKeyboard.ts` (`moveIfEnabled` as the canonical implementation) and new tests in `useCalendarKeyboard.test.ts` (one for every date disabled by `minDate` with no re-entry point, one for a 42-step boundary). The commit's file list (`git show --name-only`) does not contain them. Checked at HEAD `db0a3f05f`: (1) no commit other than the baseline `f46c4e0e3` (2026-07-13) touches `components/ui/internal/calendar-math.ts` or `components/ui/internal/useCalendarKeyboard.ts` (`git log --all --oneline -- <path>` for each; `git log -3` for each returns only `f46c4e0e3`); (2) no commit other than the baseline changed the occurrence count of `moveIfEnabled`, `findNextEnabledDate`, `monthFromDate` or `firstDateInMonth` (`git log --all --oneline -S` for each; git printed a rename-detection warning, `diff.renameLimit`, with each result); (3) the three functions the message names as deleted exist at HEAD in `components/ui/internal/calendar-math.ts` (`monthFromDate` at line 65, `firstDateInMonth` at line 70, `findNextEnabledDate` at line 74); (4) `moveIfEnabled` exists at `components/ui/internal/useCalendarKeyboard.ts:25`, uses a 42-step limit (`:31`) and, when no enabled date is found, returns the original candidate (`:35`), not null; `moveFocus` then returns without moving focus if `isDisabled(resolved)` is true (`:65`); (5) no file named `useCalendarKeyboard.test.ts` exists at HEAD or in any ref (`git ls-files`; `git log --all --name-only -- '*useCalendarKeyboard.test*'` returns nothing), and a search of the calendar and date-picker unit and e2e test files for `42` and `moveIfEnabled` finds nothing. Consequence: commit messages in this repository do not always describe the diff. The Gate 1 note's evidence-for-intent rows that rely on the absence of a commit message are evidence about messages, not about file content.

The set of component-to-component imports is identical at `7bfb62233`, `28df96011`, `a821f6b0d`, `b1e7fe60c` and HEAD. Latest commit per category at HEAD: for the three component `.tsx` files, `7bfb62233` (creation); for the stylesheets, `28df96011` (`banking-transaction-row.module.css`; the other two last changed in `7bfb62233`); for any path matching `Banking*` or `banking-*`, including tests, previews, e2e specs and `lib/banking-figma-metadata.ts`, `b1e7fe60c`. Result: neither commit changes the Gate 1 interpretation.

### 12.3 Render observation of the 12 banking edges [L2]

Observations in this table were recorded in the follow-up run and were not re-run at write time, except where a row says otherwise.

| # | Edge | Class (owner) | Observed |
|---|---|---|---|
| 1 | account-card to Card | A | present |
| 2 | account-card to Tag | A | present |
| 3 | account-card to Button | A | present |
| 4 | account-card to LineChart | A | present (chart frame, line series, `role=img`; no bar series) |
| 5 | balance-summary to Card | A | present in default and loading states |
| 6 | balance-summary to BarChart | A | present by default; absent while `loading` |
| 7 | balance-summary to Tabs | A | present by default; absent while `loading` |
| 8 | balance-summary to Skeleton | C | absent by default; present while loading; aria-busy per Skeleton.tsx:54 (source only, not render-observed) |
| 9 | transaction-row to Avatar | A | present even when `src` and `initials` are omitted |
| 10 | transaction-row to Badge | A | present |
| 11 | transaction-row to ListItem | A | present; trigger is a button with `aria-haspopup="dialog"` and `aria-expanded` |
| 12 | transaction-row to Popover | A | content absent when closed and present after click. The Popover wrapper leaves no DOM node when closed, so its closed-state presence is not observable. The class rests on source reading |

Every observation matches the Gate 1 classes. All 12 remain required for compile and install closure because they are static imports, whatever their render-time class.

### 12.4 Owner decisions recorded

1. Case #2 Skeleton = C and case #3 Popover = A are preserved.
2. Case #6 (Icon Button) stays unresolved until render-path and usage evidence is provided (see 12.5 and 12.9).
3. Case #12: recipe composition (form-field optional) and install closure (form-field required) are recorded as two separate labels and are not collapsed into one.
4. BarChart = A and Tabs = A are preserved.
5. The remaining eight cases (#1, #4, #5, #7, #8, #9, #10, #11) are **not approved**. They are recorded in 12.6 with task, proposed label and supporting evidence.
6. The five dangling `relatedComponents` links are recorded in 12.5. The proposed split of four sub-part links and one modeling-difference link is **not confirmed**. The Class C status of a target describes the target only; it does not establish what a link means. `tabs` to `top-nav-item` and `list-item` to `menu-item` stay **unresolved** until source evidence establishes the relationship.
7. Reverse dependents and single-location facts are added to the risk list in 12.7 as observations only.
8. The known Gate 1 note errata are recorded in 12.8 as an append-only correction. The note itself is unchanged.
9. An import or an export alone does not establish semantic composition or ownership. Evidence of definition, export and usage is recorded separately from classification.

### 12.5 The five dangling relatedComponents links [L3, with L1 evidence]

The label is identical in the registry and the contract for all five. None of the four target slugs has a registry entry, a contract or an `index.json` entry. All five links are recorded below. **No proposed classification is confirmed.** Two are unresolved: icon-button (pending a product decision) and tabs to top-nav-item. One has a relationship stated in source: list-item to menu-item. Two have source evidence collected: menu to menu-item and tree-view to tree-item. All wait for owner confirmation.

| Link | Label | Target evidence (describes the target only) | Relationship evidence | Status |
|---|---|---|---|---|
| button to icon-button | "Icon Button — compact icon-only actions" (`lib/component-registry.ts:327`) | Docs-only page `content/actions.ts:18`. Inventory Class E, product decision (`component-inventory.md:239`) | Button `whenNotToUse` points to Icon Button (`content/actions.ts:11`). A registry FAQ-style `comparisons` answer (titled "How do Button icons get their color?") ends: "Icon-only actions use this same Button with an aria-label; there is no separate Icon Button implementation." (`lib/component-registry.ts:352`, verified at HEAD `db0a3f05f`). The same Button entry links to Icon Button (`lib/component-registry.ts:327`). The generated Button contract does not contain that sentence (grep of `public/agent/contracts/button.json`, 0 matches, re-confirmed at write time). | **Unresolved** (modeling difference proposed) |
| tabs to top-nav-item | "Top Nav Item — primary app navigation" (`lib/component-registry-navigation.ts:256`) | Docs-only page `content/navigation.ts:183` (noindex). Inventory Class C, "Keep as composition — do not add standalone React API" (`component-inventory.md:245`). No component file | No statement beyond the link label; the contract's `whenNotToUse` names Top Navigation or Sidebar, not Top Nav Item ("Unrelated destinations — use Top Navigation or Sidebar instead.", `content/navigation.ts:37`). Searched for the patterns `top nav`, `top-nav`, `TopNav`, `menu item`, `menu-item`, `MenuItem` in `components/ui/Tabs.tsx`, `components/ui/ListItem.tsx`, the tabs and list-item registry entries, their generated contracts and their `content/` docs (verified at HEAD `db0a3f05f`). | **Unresolved.** The target is Class C; the meaning of the link is not established |
| menu to menu-item | "Menu Item — Figma building block (compound subcomponent)" (`lib/component-registry-navigation.ts:490`) | Docs-only page `content/navigation.ts:141` (noindex). Inventory Class C, "Keep as composition — do not add standalone React API" (`component-inventory.md:240`) | **Definition and exports:** `MenuItem` is defined at `components/ui/Menu.tsx:395` (props type at `:378`), exported from `Menu.tsx` and re-exported from `components/ui/index.ts:180` (type at `:189`). It throws `MenuItem must be used within Menu` outside a `Menu` (`Menu.tsx:63`, observed in a scratch jsdom render; not re-run at write time). A scratch jsdom render of a `Menu` with `MenuContent` and no items opened with `role=menu` and 0 menuitems (not re-run at write time), so `Menu` does not require `MenuItem` to render (scratch files deleted). **Usage:** inside the Menu module, `MenuItem` is defined and reads the Menu context through `useMenuContext("MenuItem")` (`Menu.tsx:412`); no non-test component under `components/ui` imports it. Tests: `components/ui/Menu.test.tsx`, `components/ui/SplitButton.test.tsx` (plus `Menu.test.tsx:67` checks the public export through `import * as PublicUi from "@/components/ui"`). Docs previews and content examples: `components/previews/MenuPreview.tsx`, `SplitButtonPreview.tsx:126-127`, `TablePreview.tsx:76-79`; registry code examples `lib/component-registry-navigation.ts:577-580`, `lib/component-registry.ts:833-834`; App code: `components/ResourcesMenu.tsx:4,46,53`, `components/reference-app/ReferenceUserMenu.tsx:41-42`, `RequestFormWorkflow.tsx:146-147`, `RequestsDataView.tsx:419,424`. `app/` has no usage. String occurrences that are not usage sites: `lib/consumer-scenarios/shadcn-component-scenarios.ts:1235,1246-1248,1368,1385` (import and JSX text inside scenario strings) and example text in `packages/guard/dist/cli.js` (lines 5649-5652 and 6439-6440). `packages/guard/dist/cli.js` is tracked in git and is not ignored: `git ls-files packages/guard/dist` lists only that file, and `git check-ignore -v` reports no ignore rule. A line-scan of the files that render `<MenuItem` found every usage inside a `MenuContent` or `MenuGroup`; this scan is heuristic. **Menu contract:** `public/agent/contracts/menu.json` lists `MenuItem.onSelect`, `MenuItem.target` and `MenuItem.rel` in `api.properties`, and the string `MenuItem` appears 7 times in that contract (recorded only). **Establishes:** ownership (defined and exported with the Menu module), a context requirement, and how consumers render it. **Does not establish:** what the `menu` to `menu-item` link means as a product relationship; an import or an export alone does not establish semantic composition or ownership. | **Evidence collected; owner confirmation pending.** Not confirmed |
| list-item to menu-item | "Menu Item — command/menu semantics" (`lib/component-registry-content-data.ts:385`) | Same target evidence as above | The list-item registry entry states a contrast. `lib/component-registry-content-data.ts:412-413`: `title: "What is the difference between List Item and Menu Item?"` and `body: "List Item is generic collection content without menu or listbox roles. Menu Item belongs inside menu semantics."` `lib/component-registry-content-data.ts:421`: `body: "Native li for all modes. Navigational uses anchor/NextLink. Action uses button type=\"button\". No menuitem, option, or listbox roles."` (quoted as written in source). This text is not in the generated list-item contract (0 matches in `public/agent/contracts/list-item.json`; contracts carry no `comparisons` field). | **Relationship stated in source (contrast); owner confirmation pending.** Not confirmed |
| tree-view to tree-item | "Tree Item — Figma hierarchical row pattern (docs only)" (`lib/component-registry-content-data.ts:884`) | Docs-only page `content/content-data.ts:130` (noindex). Inventory Class C, "Keep as composition — do not add standalone React API" (`component-inventory.md:246`). Internal file `components/ui/internal/TreeItem.tsx` exists | `components/ui/TreeView.tsx` imports `TreeItem` from `@/components/ui/internal/TreeItem` at `:5` and renders `<TreeItem` at `:162` (verified at HEAD `db0a3f05f`). Link added by `8a55ad66e` (2026-09-18) with a test asserting it (`lib/seo-growth-batch1.test.ts`) | **Evidence collected; owner confirmation pending.** Not confirmed |

12.4 item 6 records the owner decision as written before the source statement for list-item to menu-item (`lib/component-registry-content-data.ts:412-413`) was located; the status column above reflects the later evidence.

Missing evidence and what would resolve it:
- icon-button: render-path evidence for an icon-only Button (`aria-label` plus `leadingIcon`, no children); usage evidence (occurrences of `IconButton` or `icon-button` in components, app, content, docs, `public/agent` and eval records, with counts); a read of existing AK-5 eval records on whether agents invent an `IconButton` (no new model runs); the owner's Class E decision.
- tabs to top-nav-item: a source or content statement of the intended relationship, or an owner statement of what the link means. The `menu-item`, `top-nav-item` and `icon-button` links exist from the squashed baseline `f46c4e0e3`, so their history is unrecoverable.
- list-item to menu-item: owner confirmation of how the stated contrast relates to the link.
- menu to menu-item and tree-view to tree-item: owner confirmation after review of the evidence above.

Further observations: the docs pages resolve unless the data lookup fails (`app/components/[slug]/page.tsx:45-47`; the pages were not fetched). `next.config` redirects only `accordion-item` and `form-field-wrapper`. `lib/component-registry-related-links.test.ts` checks label uniqueness only; no test checks that a link resolves. An agent following a link sees a docs-only page on the website and nothing in Agent Kit. The risk of an agent inventing an `IconButton` import is an inference; no agent was run.

### 12.6 Labelled retrieval cases (audit instrument; owner review required)

Labels in this table are audit proposals derived from source imports, `registryDependencies`, Recipe `requiredComponents` and documented guidance. They are not contracts. **Proposed format rule, to be agreed:** where layers differ, a case records a separate label per layer ([L1] install closure, Recipe composition, [L2] render-time class) instead of one merged label.

Three cases decided or layered (#2, #3, #12); one unresolved (#6); eight not approved.

**Cases with an owner decision**

| # | Task | Decision |
|---|---|---|
| 2 | Spending summary with 7D/30D/90D ranges and a loading state. Must: banking-balance-summary, card, bar-chart, tabs, skeleton. Evidence: `BankingBalanceSummary.tsx:1-4,53,54-60,68,78` | Skeleton = C preserved; BarChart = A and Tabs = A preserved. Skeleton is still required for install closure. Consistent with the render observation (12.3) |
| 3 | Transaction row with status badge and detail popover. Must: banking-transaction-row, list-item, avatar, badge, popover. Invalid: `PopoverTrigger` around `ListItem`. Evidence: `BankingTransactionRow.tsx:4-12,78-79,81,83,96,103` | Popover = A preserved. Basis: source reading; the closed-state wrapper is not observable (12.3) |
| 6 | Icon-only close button. Proposed: button; invalid: `icon-button` as an import or slug. Evidence: `content/actions.ts:11`; `component-inventory.md:149,239` | **Unresolved** until render-path and usage evidence is provided (12.5, 12.9) |
| 12 | Validated text field. Evidence: `validated-text-field.ts:23-24`; `component-registry.ts:1229` | **Two separate labels.** Recipe composition: form-field is optional (`agent/recipes/validated-text-field.ts:24`, verified at HEAD `db0a3f05f`). Install closure: form-field is required (`lib/component-registry.ts:1229`, text-input's `registryDependencies`, verified at HEAD `db0a3f05f`). The two are not collapsed |

**Remaining eight cases: proposed, NOT approved**

| # | Task | Proposed label | Facts that must survive | Evidence | Conf. | Open dispute |
|---|---|---|---|---|---|---|
| 1 | Account overview card with sparkline and action | Must: banking-account-card, card, tag, button, line-chart. Optional: banking-transaction-row, banking-balance-summary. Invalid: `shadcn add @skrewww/banking-account-card` | beta 0.1.0-beta; not installable; 7 declared props; `sparkline` declared on line-chart | `BankingAccountCard.tsx:1-4,49,53,59,63` | High | "Must" for Tag and Button is a render-time reading |
| 4 | Dashboard card with a chart plus loading, empty and error states | Must: chart-card, card, empty-state, alert, skeleton, button, link (button and link through empty-state). Optional: line-chart or bar-chart (caller-supplied child) | chart-card, empty-state and the charts are beta; chart-card is installable | `component-registry.ts:1093`; `component-registry-content-data.ts:1564`; `ChartCard.tsx:2-5` | High | The chart is not imported by ChartCard: optional at code level, required at task level |
| 5 | Form date picker | Must: date-picker, calendar-grid, popover, form-field, calendar-day, validation-message. Invalid: undeclared props such as `onChange` or `format` | beta; 12 declared props | `component-registry-forms.ts:1566`; `DatePicker.tsx:15-23` | High | `TextInputControl` is an unowned helper, not a slug |
| 7 | "Searchable dropdown" | Must: combobox, form-field, popover. Invalid: select as the answer | combobox beta; select's `whenNotToUse` points to Combobox | `component-registry-forms.ts:773`; `content/forms.ts:77,181` | High | The index-only lexical probe returns 0 hits for "searchable" and "dropdown"; discovery is a separate problem from the label |
| 8 | Loading and inline feedback, without an empty state | Must: skeleton, spinner, alert. Invalid: empty-state | all three stable; empty-state beta | `loading-and-inline-feedback.ts:21` | Medium | A comment at `:9` calls Skeleton and Alert "not shadcn-distributed", which contradicts the registry (both have `files`). The comment is not in generated output |
| 9 | "Install the banking account card via shadcn" | Answer: not installable. Invalid: the install command | `isDistributedViaSkrewwwRegistry` is false for all 3 banking slugs and `icon-button` | `guard-readiness-audit.md:125,620`; `pre-guard-hardening.md:132-137` | High | none significant |
| 10 | Full-width button with a loading spinner | Must: button. Invalid: `isLoading`, `block`, `icon` as declared props | declared: variant, size, loading, fullWidth, leadingIcon, trailingIcon, href, target, disabled, `aria-label` | registry `apiProps`; `system-contract.ts:22,25` | High | The declared API is not the full set of legal JSX attributes (`className`, `onClick`); "invalid" means "not declared" |
| 11 | Destructive confirmation | Must: dialog, button. Invalid: Toast or Alert as a modal substitute | dialog stable; `initialFocusRef` and `finalFocusRef` declared | `destructive-confirmation.ts:17,22` | High | Whether Dialog focus handling is correct in composition is not verified |

Missing for all eight: owner review of each label, per-layer labels where layers differ, and a re-check of every cited file:line against HEAD at review time. Until then the case set is a proposal and cannot support the section 10 gate 3 judgement of G2.

### 12.7 Additions to the false-negative risk list (section 7), observations only

No schema or implementation change is proposed.

| # | Observation | Evidence |
|---|---|---|
| 12 | **Reverse dependents are not recorded.** Dependencies are recorded only on the dependent's side (`registryDependencies`). No contract has a "used by" field. Measured at HEAD `db0a3f05f`: 21 components import at least one other component (37 import none); 21 components are imported by at least one other component; the two sets are different (compared). The 12 undeclared banking edges point at 11 distinct targets (card is imported by two banking components). For each of these targets, at least one importing component's dependency is recorded on neither side, because the importer does not declare it and the target has no dependents field. Whether non-banking importers of each target declare it (recomputed at HEAD `db0a3f05f`): avatar, badge, bar-chart, line-chart, list-item, tabs and tag have no non-banking importer; button is also imported by empty-state, which declares it; card is also imported by chart-card, which declares it; popover is also imported by select, combobox, date-picker and menu, which all declare it; skeleton is also imported by chart-card, which declares it. Example: `LineChart` `sparkline` and `ListItem` aria passthrough were extended for the banking pilot (`fe1309da2`), and no contract records the dependents. | Recomputation at HEAD `db0a3f05f`: 40 direct imports, 28 declared as `registryDependencies`, 12 undeclared (all in the three banking components), 0 over-declared, 0 indirect edges through helper files, 0 imports through the `components/ui/index` barrel; 34 of 40 importer-target pairs appear in at least one side's `relatedComponents` (12 of 12 banking, 22 of 28 others) |
| 13 | **Facts that live in one place only.** The rule "use `PopoverAnchor`, not `PopoverTrigger`, because ListItem does not forward a ref" is in the banking-transaction-row `guidance.commonMistakes` only; it is absent from the popover and list-item contracts. The ListItem contract does not declare `aria-expanded` or `aria-haspopup`, which banking passes; that passthrough is recorded only in the banking contract's `openQuestions`. | Contract reads and `BankingTransactionRow.tsx:102-103`. Guard's api/nonexistent-prop rule is deferred (guard-foundation.md:454-456,486). This audit did not check whether other tooling, for example TypeScript, enforces declared props. |
| 14 | **Contract and registry disagree on icon-only guidance.** The Button contract's whenNotToUse says 'use Icon Button' (content/actions.ts:11); a registry FAQ says there is no separate Icon Button implementation (lib/component-registry.ts:352); the generated Button contract does not carry that FAQ. Observation only. | `content/actions.ts:11`; `lib/component-registry.ts:352`; `public/agent/contracts/button.json` (0 matches) |

### 12.8 Correction to the Gate 1 note (append-only; the note is unchanged)

The original text of `docs/architecture/ac-0-gate-1-banking-edges.md` is preserved as the audit trail. Read it with the following corrections.

**Original note SHA-256 (recorded when this addendum was written):** `a7ec51ebbf4b11d810527ce8695ab2ae1e80daf75cb208ed249316bc8354d659`. The note was verified unchanged after this addendum was appended.

| # | Note text | Correction |
|---|---|---|
| E1 | "Latest commit touching a banking component file: `b1e7fe60c` (2026-08-31, "sync Figma metadata and docs"). I did not inspect it." | `b1e7fe60c` touched, among banking component, registry and contract files, only `lib/banking-figma-metadata.ts` (comment-only). Also reworded one Banking-pilot paragraph in `docs/project-status.md` (the Data Table wording). It did not touch banking component source, stylesheet, registry or contract entries. The latest commit touching a banking component source file or stylesheet is `28df96011` (2026-08-20). It changed `banking-transaction-row.module.css` (+6/-1) and added or changed the test, preview, e2e spec and content entries. `BankingTransactionRow.tsx` did not change. (`b1e7fe60c` is the latest commit for any path matching `Banking*` or `banking-*`, because that pattern includes `lib/banking-figma-metadata.ts`.) |
| E2 | "Other commits: a contrast fix (`28df96011`, 2026-08-20) and a calendar refactor (`a821f6b0d`, 2026-08-07)." | The subject line of `a821f6b0d` is "refactor: consolidate calendar keyboard duplication into moveIfEnabled"; its full message is quoted below this table. Among banking component, registry and contract files, it touched only `lib/banking-figma-metadata.ts` (+11 doc-comment lines; 7 sibling `*-figma-metadata.ts` files got the same comment). Other files touched (lines added/deleted, `git show --numstat`): `README.md` (2/2), `components/ui/internal/useEscapeKey.ts` (0/17), `docs/audits/grok-repository-audit-2026-08-07.md` (487/0), `docs/project-status.md` (23/1), `eslint.config.js` (7/2), `lib/data.ts` (0/4), `lib/llms-content.ts` (1/1), `lib/routes.ts` (0/5), `package-lock.json` (29/29), `skrewww-claude-project-instructions.md` (1/1), `vitest.config.ts` (1/1). 19 files in total, 639 insertions, 63 deletions. Changed lines that mention banking in passing: `README.md` (1), `skrewww-claude-project-instructions.md` (1) and the new audit document (11); none of them touch banking component source, stylesheet, registry or contract entries. Neither `a821f6b0d` nor `b1e7fe60c` changed the edge set (12.2); for the `docs/project-status.md` paragraph reworded by `b1e7fe60c`, see E1. `28df96011` is the contrast fix; see E1 for its files. |
| S1 | "No render-time verification. The A/B/C classes come from source reading, not from running the components." and "Unread git commits. `b1e7fe60c` and `a821f6b0d` touch banking files but I did not open them. I treated them as incidental from their messages, and that is unverified." | Superseded by 12.2 and 12.3. |
| C1 | "No document or commit message records a decision about contract-level composition metadata for banking." | Accurate for banking specifically. A project-level decision exists (Addendum A1; `agent-kit.md:84-90`). |

Full commit message of `a821f6b0d` (`git log -1 --format=%B a821f6b0d`, quoted exactly):

```
refactor: consolidate calendar keyboard duplication into moveIfEnabled

Resolves the technical debt tracked in docs/project-status.md.

- Delete findNextEnabledDate, monthFromDate, firstDateInMonth
  (calendar-math.ts) — all confirmed dead, zero references
- moveIfEnabled (useCalendarKeyboard.ts) is now the canonical
  implementation: kept the 42-step limit, changed fallback from
  "original candidate" to null, updated moveFocus's check accordingly
- 42 vs. findNextEnabledDate's 366: no original rationale exists in
  git history (single squashed baseline commit, no prior history on
  either file) — 42 is inferred from 3 independent live agreements
  (moveIfEnabled's own cap, generateMonthGrid's 6-week/42-cell grid,
  and a third independent hardcoded 42 in CalendarGrid.tsx's
  resolveInitialFocusDate). Circumstantial, not documented — noted as
  such rather than overclaimed.
- Confirmed moveFocus is moveIfEnabled's only consumer (repo-wide
  grep). Two near-namesakes checked and confirmed unrelated: Menu.tsx's
  moveFocus (menu navigation, no shared code) and
  useCalendarCellGridKeyboard.ts's index-based moveFocus/
  moveIndexIfEnabled (month/year drill-up grid, already independently
  null-based)

New tests (useCalendarKeyboard.test.ts): the original moveFocus
regression scenario (every date disabled by minDate, no re-entry
point), plus a 42-step boundary test.

Verification: tsc clean, lint clean (26 warnings/0 errors, unchanged),
build succeeds, 647/647 vitest (643 baseline + 4 new), 12/12 calendar
Playwright specs including live browser keyboard navigation.
```

### 12.9 Unresolved items: missing evidence and what would resolve it

| Item | Status | Missing evidence | What would resolve it |
|---|---|---|---|
| Case #6 and the icon-button link | Unresolved | Render-path evidence, usage evidence, existing eval records, owner decision on Class E | See 12.5 |
| tabs to top-nav-item | Unresolved | No statement of the intended relationship beyond the link label | Source or content evidence, or an owner statement |
| list-item to menu-item | Relationship stated in source (contrast); owner confirmation pending. Not confirmed | Owner confirmation of how the stated contrast (`lib/component-registry-content-data.ts:412-413`, not in the generated contract) relates to the link | Owner review of 12.5 |
| menu to menu-item; tree-view to tree-item | Evidence collected; not confirmed | Owner confirmation | Owner review of 12.5 |
| Menu contract documentation of MenuItem | Recorded only | `public/agent/contracts/menu.json` lists `MenuItem.onSelect`, `MenuItem.target` and `MenuItem.rel` in `api.properties`; whether this bears on how the menu to menu-item link is read is not decided | Owner review of 12.5 |
| Eight proposed cases | Not approved | Owner review; per-layer labels; file:line re-check | Owner review session on 12.6 |
| Case #12 labels | Recorded as two labels | Owner confirmation of the layered format | Owner review |
| Popover = A | Decided; basis is source reading | Closed-state wrapper not observable in jsdom | Optional: a real-browser render or accessibility-tree check |
| Banking install-edge absence (Q3) | Working hypothesis (side effect of being undistributed), unconfirmed | No recorded decision or commit message | An owner statement of intent |
| Real-browser render verification | Not done | Only jsdom with minimal props; 12.3 not re-run at write time | A real-browser run |

### 12.10 Status of the section 10 gates

| Gate | Status |
|---|---|
| 1. Owner reviews this report and the source-of-truth map | Open |
| 2. Decision record (b) and the intent behind G1 | Decision (b) unchanged. Q3 refined in A1 and A2 |
| 3. Labelled retrieval cases agreed | Open. Three cases decided or layered (#2, #3, #12); one unresolved (#6); eight not approved. |
| 4. Five dangling links classified | Recorded; one unresolved (icon-button), one unresolved (tabs to top-nav-item), one with relationship stated in source (list-item to menu-item), two with evidence collected (menu to menu-item, tree-view to tree-item); none confirmed |
| 5. AC-1 | Not authorized |

**Not authorized by this addendum:** schema, contract, registry or implementation changes; an AC-1 decision; ADOPT, EXPERIMENT or REJECT labels. AC-0 remains open.
