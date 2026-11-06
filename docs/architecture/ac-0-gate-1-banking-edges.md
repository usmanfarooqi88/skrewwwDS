# AC-0 Gate 1 — Banking Component Edges Classification

**Status:** Read-only investigation, not an AC-0 amendment. The parent audit is unchanged.
**Date:** 2026-11-01
**Parent audit:** `db0a3f05f` ([ac-0-audit-report.md](ac-0-audit-report.md), unpushed)

No schema, source or registry file was changed. No ADOPT / EXPERIMENT / REJECT label is given.

## Method and scope

- Imports were read from `components/ui/Banking*.tsx` with `grep` and line-numbered reads.
- Registry entries were loaded through `lib/component-registry.ts`.
- Contracts were read from `public/agent/contracts/banking-*.json`.
- Other evidence: `public/r/`, `content/content-data.ts`, `git log --follow`, and `git grep` over `docs/`.
- An "edge" is a static import of another Skrewww UI component. `react`, `@/lib/cn` and the component's own CSS module are excluded.
- **Caveat on A/B/C:** it classifies runtime rendering only. All 12 imports are hard static imports, so every one is needed to compile and install, whatever its class.

## Component status summary

| Component | Registry status | `industry` (registry) | Contract `distribution` | `public/r` manifest | Recipe | Last touched |
|---|---|---|---|---|---|---|
| `banking-account-card` | beta 0.1.0-beta, `indexing: index` | `Banking` | absent | none | none | created `7bfb62233` (2026-07-25) |
| `banking-balance-summary` | beta 0.1.0-beta, `indexing: index` | `Banking` | absent | none | none | created `7bfb62233` (2026-07-25) |
| `banking-transaction-row` | beta 0.1.0-beta, `indexing: index` | `Banking` | absent | none | none | created `7bfb62233` (2026-07-25) |

- **Latest commit touching a banking component file:** `b1e7fe60c` (2026-08-31, "sync Figma metadata and docs"). I did not inspect it.
- **Other commits:** a contrast fix (`28df96011`, 2026-08-20) and a calendar refactor (`a821f6b0d`, 2026-08-07).
- **Registry keys:** `files`, `registryDependencies`, `internalDependencies`, `dependencies` and `hostRequirements` are **absent** from all three entries. They are not empty arrays. The AC-0 wording "empty" is slightly imprecise here.
- **Contract field:** the contracts have no `industry` field. The registry has `industry: "Banking"`, so the contract projection drops it.
- **Manifests:** `ls public/r | grep -ci banking` returns 0, so there is no manifest. The contracts exist: 3 files.

## 12 edges table

All imports are **named** imports. None are default imports. `LineChart` and `BarChart` also carry a `type` specifier (`LineChartDatum` at AccountCard:14, `BarChartDatum` at BalanceSummary:12).

| # | From | To | Import line | JSX / use line | Class | Evidence | Confidence |
|---|---|---|---|---|---|---|---|
| 1 | account-card | `Card` | `BankingAccountCard.tsx:1` | 49 `<Card title=… footer=…>` | A | Root wrapper, unconditional | High |
| 2 | account-card | `Tag` | `:2` | 59 `<Tag>{accountType}</Tag>` | A | Unconditional; `accountType` is a required prop (`:10`) | High |
| 3 | account-card | `Button` | `:3` | 53 `<Button size="sm" variant="secondary" onClick={onAction}>` | A | Unconditional footer; `actionLabel` and `onAction` required (`:17-18`) | High |
| 4 | account-card | `LineChart` | `:4` | 63 `<LineChart … sparkline height={48} />` | A | Unconditional; `balanceHistory` required (`:14`); public prop type is `LineChartDatum[]` | High |
| 5 | balance-summary | `Card` | `BankingBalanceSummary.tsx:1` | 53 `<Card title=…>` | A | Root wrapper, unconditional | High |
| 6 | balance-summary | `BarChart` | `:2` | 78 `<BarChart data={range.data} …/>` | A | Primary content, one per range. Rendered inside `SkeletonLoading` children, so hidden while `loading` is true | Medium |
| 7 | balance-summary | `Tabs` (+ `TabsList`, `TabsTrigger`, `TabsPanel`) | `:3` | 68 `<Tabs …>`, 69, 71, 77 | A | Time-range filter, wraps the chart panels. Same `loading` gate as #6 | Medium |
| 8 | balance-summary | `Skeleton` (+ `SkeletonLoading`) | `:4` | 54 `<SkeletonLoading loading={loading} …>`, 59-60 `<Skeleton …>` | **C** | The placeholder shows only when `loading` is true (default `false`, `:46`). Gate: `Skeleton.tsx:55` `loading ? (` | High |
| 9 | transaction-row | `Avatar` | `BankingTransactionRow.tsx:4` | 83 `<Avatar … decorative />` | A | Always passed as `ListItem` `leading`. `src` and `initials` are optional (`:21`, `:23`), but the Avatar is not conditional | High |
| 10 | transaction-row | `Badge` | `:5` | 96 `<Badge variant={status} size="sm">` | A | Unconditional; `status` and `statusLabel` required | High |
| 11 | transaction-row | `ListItem` | `:6` | 81 `<ListItem leading=… title=… onClick=…>` | A | The row shell, unconditional | High |
| 12 | transaction-row | `Popover` (+ `PopoverAnchor`, `PopoverContent`, `PopoverBody`) | `:7-12` | 78 `<Popover>`, 79, 108, 109 | A | See ambiguity Q1 | **Medium (ambiguous)** |

Class counts:
- **A:** 11
- **B:** 0
- **C:** 1

**Why B is empty:**
- B means an import used only for hooks, types or constants. No banking file imports a hook or constant from another UI component file.
- The only type imports (`LineChartDatum`, `BarChartDatum`) come from the same module as a rendered component. They are a secondary facet of edges #4 and #6, not separate edges.

## Cross-source nuance (not an AC-0 amendment)

- **`relatedComponents` already names all 12 targets.** The hrefs for all 12 appear as untyped `{label, href}` hints. 11 of the 12 labels say "this composes"; the Avatar label does not ("merchant/counterparty logo or initials").
- **Machine-readable but untyped.** AC-0 G1 said the banking contracts lack machine-readable edges. That holds for typed or install edges. The composition is carried only as free-text label wording inside an untyped hint.
- **Human-readable composition doc.** `docs/distribution-expansion.md` records the composition for all three components in prose, in the PART 1 table (lines 666-668) and in PART 10 (lines 836-838).
- **Upstream components extended for banking.** `fe1309da2` ("extend LineChart and ListItem for the Banking pilot's real needs") and the registry `openQuestions` show the composition was designed on purpose. The upstream edits are `LineChart` `sparkline` and `ListItem` aria passthrough.
- **No reverse-impact record.** A change to `LineChart` sparkline or `ListItem` aria passthrough affects banking, and no contract records that dependent.

## Evidence for intent

| Source | Finding |
|---|---|
| `docs/distribution-expansion.md:297` | `banking-* — Domain — INTENTIONALLY_DEFER` |
| `docs/distribution-expansion.md` PART 10 (836-850) | Class **B**, "technically distributable … intentionally deferred". Reason: Figma `unavailable`, so no verified visual parity. No namespace decision. "still an internal pilot, not a confirmed industry vertical" |
| `docs/project-status.md:2209` | "Deferred (intentional): banking-account-card, banking-balance-summary, banking-transaction-row" |
| `docs/project-status.md:4668` | "banking-* — industry pilot, Figma unavailable" |
| `docs/architecture/pre-guard-hardening.md:132-137, 160-162, 417` | "Banking trio … implemented but deliberately not distributed"; Guard must report `false` for installability |
| Registry JSDoc and `openQuestions` | "Layer 4 Industry Systems (Banking pilot)"; Figma absence "confirmed … not an oversight" |
| `git log --follow` | One creation commit per file (`7bfb62233`, 2026-07-25). No message about "defer", "wip", "not for distribution" or "composition metadata" |

**What these sources do not say:**
- No document or commit message records a decision about **contract-level composition metadata** for banking.
- The recorded deferral is of **distribution**.

## Intent assessment per component

| Component | Distribution absence | Missing composition edges in the contract |
|---|---|---|
| `banking-account-card` | **Intentional.** Beta, pilot, Class B, documented in 4+ places. The `recharts` transitive dependency is noted as a reason | **Insufficient evidence of intent** |
| `banking-balance-summary` | **Intentional.** Same as above | **Insufficient evidence of intent** |
| `banking-transaction-row` | **Intentional.** Same as above; the reason noted is the overlay graph | **Insufficient evidence of intent** |

**Reasoning for the contract column:**
- Step 9's rule (beta, industry banking, not in a Recipe, no distribution, no "add composition metadata" in history) gives "likely intentional deferral". That holds for distribution.
- It does not show that omitting composition metadata was a deliberate choice. No document speaks to it.
- The registry fields that carry install edges (`files`, `registryDependencies`, `internalDependencies`) appear to exist only for distributed components. For these three they are absent entirely. This is consistent with the edges being undeclared as a side effect of deferring distribution. It is **inference, not recorded intent**.
- Nothing suggests oversight either. All three are still beta, and composition is documented elsewhere.

## Open questions for human review

**Q1. Popover (edge #12): A or C?**
- Structural facet: `Popover` and `PopoverAnchor` wrap the whole row (`:78-79`), `detail` is required, and the trigger sets `aria-haspopup="dialog"` (`:103`). That reads as A.
- Behavioural facet: `PopoverContent` is shown only when `open` is true (state at `:75`). The brief's own example for C is "Popover shown only on hover/click".
- I classified it A / Medium because the row cannot render without the Popover wrapper, and the caller cannot replace it. This is your call.

**Q2. BarChart and Tabs (#6, #7): is the `loading` gate enough to make them C?**
- They render only when `loading` is false, which is the default path. I treated them as A.
- If "shown only in some prop states" means C, then #6, #7 and #8 are all C. It would also be consistent to treat #8 as an A-class dependency, since the component imports it regardless.

**Q3. Is the omission of banking edges in contracts intentional?**
- Distribution is clearly deferred on purpose, with the reasons recorded.
- The repo has no statement on whether the contracts should carry composition for undistributed or pilot components. That needs an owner statement. Without one, AC-1 would be choosing the source of truth for composition without knowing the original intent.

**Q4 (carried from AC-0). The 5 dangling `relatedComponents` links are unclassified.**
- None of them are banking-related.
- This gate does not resolve them.

## Limits of this investigation

- **Source reading is selective.** Only the three components' files, their registry and contract entries, the docs lines cited above and `git log --follow` were read.
- **Documentation presence (step 4).** `content/content-data.ts` has entries for all three slugs (`:314`, `:340`, `:360`), each with `category: "Content & Data"` and `industry: "Banking"`. Those lines contain no distribution wording, so no "not applicable" marker exists there. I read only the first lines of each entry.
- **No render-time verification.** The A/B/C classes come from source reading, not from running the components.
- **Unread git commits.** `b1e7fe60c` and `a821f6b0d` touch banking files but I did not open them. I treated them as incidental from their messages, and that is unverified.
