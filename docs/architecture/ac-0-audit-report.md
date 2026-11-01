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
