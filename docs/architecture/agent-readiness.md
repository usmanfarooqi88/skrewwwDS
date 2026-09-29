# Agent Readiness Audit (AG-0)

**Phase:** AG-0 Agent Readiness Audit ✅ COMPLETE — audit + AG-1 spec only, no
implementation. **AG-1A ✅ COMPLETE (2026-09-29)** — P0-1 cleared for the five
pilot components; see §20. **AG-1B ✅ COMPLETE (2026-09-29)** — read-only Figma
snapshots for the five pilots; see §21.
**Baseline:** `b1f8a45` (verified 2026-09-29). Live Agent Kit contracts at
`https://skrewww.com/agent/contracts/<slug>.json` carried the same
`provenance.sourceGitSha`.
**Question:** can Skrewww safely support an **Audit Agent** today, and what
must AG-1 build?
**Verdict:** **READY WITH REQUIRED PREWORK.** One P0 (machine-readable Figma
identity for audited components) must land first; everything else is P1/P2.

Counts below are dated evidence from the baseline commit, not standing facts —
re-derive them from source before reuse.

## 1. Authority graph

Existing authority is documented in `source-of-truth.md`, `agent-kit.md`
(R1 rule), `token-source-of-truth.md`, and `guard-foundation.md`. AG-0 adds no
new authority.

| Claim type | Canonical source | Generated derivative | Public surface | Validator |
|---|---|---|---|---|
| Component exists / slug | `lib/component-registry*.ts` | `public/agent/index.json`, contracts | `/components/<slug>`, `/agent/*`, `/registry.json` | `component-registry.test.ts`; Guard `component/nonexistent-slug` |
| Maturity (`status`) | registry | contract `status` | docs page, llms.txt | Guard `maturity/false-stable-claim` |
| Documented React API | registry `apiProps` | contract `api.properties` | docs page | tests; **no Guard rule** (`api/nonexistent-prop` formally deferred) |
| Actual React API | `components/ui/*.tsx` + `components/ui/index.ts` | — | — | `tsc` |
| Figma-named token dependencies | registry `tokensUsed` (R1, locked) | contract `tokens.used` | docs page | compiler R1 subset check; per-component Figma-binding tests (Avatar, Calendar Day, Pagination) |
| CSS custom properties used | registry `cssTokens` (own CSS only) | contract `distribution.cssTokens`, `/r/*` | install manifests | Guard `token/undeclared-css-var` (under-declaration only) |
| Token runtime values | `styles/tokens.css` | — | — | `project-configuration.test.ts` drift tests |
| Usage judgment | `content/*.ts` | contract `guidance` | docs page | compiler join |
| Figma availability | registry `figmaAvailability` | contract `availability.figma` | docs page | none (hand-maintained) |
| Figma node reference | registry `figmaNodeId` / `figmaSourceUrl` | contract `figma.nodeId` / `sourceUrl` | — | per-component metadata tests (e.g. charts) |
| Figma node prose | registry `figmaReference` | **not compiled** | — | none |
| Live Figma structure/bindings | Figma file (MCP/plugin inspection) | — | Figma Community / Gumroad | human + MCP |
| Installability | registry `files` → `isDistributedViaSkrewwwRegistry` | `/r/*.json`, contract `distribution` | `/r/*` | Guard `distribution/false-installable-claim`; generator tests |

**Authority corrections found during AG-0** (repo docs win over the AG-0 brief):

- The brief called `cssTokens` the canonical token field and `tokensUsed`
  stale terminology. Current authority (R1, `agent-kit.md`) is the opposite
  framing: `tokensUsed` is the canonical **Figma-named** dependency set;
  `cssTokens` is a separate **CSS-variable** set (own stylesheet only,
  under-declaration enforced). They are different domains, not synonyms.
- `figma.verified` in contracts is `Boolean(figmaNodeId)` — "a node ID is
  recorded", **not** "parity verified" (`contract-compiler.ts`).
- `agent-kit.md`'s AK-1 section says `public/agent/` is not routed; AK-3
  superseded this — contracts are served publicly.

## 2. Component identity

**Stable key: `slug`.** It joins registry ↔ `content/*.ts` ↔ contract ↔ docs
page ↔ `/r/<slug>.json` ↔ Guard facts. No duplicate slugs, names, or Figma
node IDs across 58 registry entries (baseline).

| Slug | React export | Figma availability | `figmaNodeId` | Figma link actually available |
|---|---|---|---|---|
| `button` | `Button` | available | — | prose only: "Actions / Button — Style × Size × State (45 variants)"; live set `2012:7752` |
| `text-input` | `TextInput` | available | — | prose only; live set `2022:1151` |
| `dialog` | `Dialog` + compound parts | available | — | prose says "No canonical Dialog COMPONENT_SET/master" — **stale**: live `COMPONENT 2044:25869` |
| `data-table` | `DataTableSortHeader`, `useDataTableSort` | partial | `2805:859` | structured (column header only; table is composition-only) |
| `chart-card` | `ChartCard` | available | `3239:8017` | structured |

**Weak links:**

- 20/58 entries carry `figmaNodeId`; **31 entries are `available` with no node
  ID** (includes Button, Text Input, Alert, Dialog, Avatar, Pagination, Tabs).
  For those, the only link is `figmaReference` prose, which is not compiled
  into contracts — the Button contract reports `figma: { verified: false }`.
- No `figmaFileKey` field; the file is only implied by `figmaSourceUrl`.
  Free (`KrQIUWznpBdP0ZuWjOu2e3`) was forked from Pro (`U6KUuNf7DF4CP9QBOkLSUx`)
  and **shares node IDs for shared components** — a node ID without a file key
  is ambiguous.
- Slug ≠ export symbol (`data-table` → `DataTableSortHeader`); the mapping is
  only implied by `files`.
- Figma-internal helpers (e.g. Chart Card Content, Menu Panel) are components
  in Figma but not registry entries; an agent must not treat them as
  unmatched components.

**Answer:** today the agent can reliably say "this Figma component and this
React component are the same entity" only for components with a recorded
node ID. For the rest it would be name-matching — unsafe. → **P0-1**.

## 3. Agent contract readiness

Contracts are **B — a generated, deterministic projection** of canonical
sources (`contract-compiler.ts` is pure; provenance carries git SHA +
commit timestamp; compiler never writes canonical sources). They are not
canonical authority.

| Field | Classification | Note |
|---|---|---|
| `slug`/`name`/`category` | SUFFICIENT | |
| `status`/`version` | SUFFICIENT | per-component maturity |
| `availability.figma` | PARTIAL | hand-maintained; can contradict prose (Dialog) |
| `api.properties` | PARTIAL | documented subset; 19/387 names are free-form (`"DialogBody children"`, `MenuItem.onSelect`, `useDataTableSort(options)`); native attrs listed inconsistently |
| `api.variants` / `api.sizes` | AMBIGUOUS | value/scenario metadata, not props; no state model |
| `tokens.used` | DERIVED BUT TRUSTWORTHY | Figma naming domain; can lag live Figma (Alert, §5) |
| `distribution.cssTokens` | DERIVED BUT TRUSTWORTHY | own CSS only — misses `internalDependencies` CSS (Alert has none) |
| `figma.verified` | DERIVED AND RISKY | name reads like parity; means "node ID recorded" |
| `figma.nodeId` / `sourceUrl` | PARTIAL | 20/58; no file key |
| `behavior.*` | PARTIAL | sparse by design; absent ≠ unsupported |
| `guidance.*` | SUFFICIENT | authored judgment |
| anatomy, states, composition, slots | MISSING | deliberately unmodeled since AK-1 |
| `provenance` | SUFFICIENT | enables staleness detection |

## 4. Figma machine-readability

Probed read-only via the plugin API (Desktop Bridge), Pro file, baseline date.

- **Masters: STRUCTURED ENOUGH.** Component sets expose typed properties
  (`TEXT`, `BOOLEAN`, `INSTANCE_SWAP`, `VARIANT` with options), variant
  children, and **named** bound variables per node (Button: 45 variants,
  8 properties, 14 bindings on the first variant). Descriptions follow a
  sectioned format (`PURPOSE / WHEN TO USE / ACCESSIBILITY / TOKENS USED /
  PROPERTIES`, plus `STATUS` on Beta components).
- **Modes are explicit collections:** Semantic `Light|Dark`, Shape
  `Rounded|Sharp|Pill|Squircle|Brand Shape`, Surface `Flat|Gradient|Glass`
  (Free: 3 shapes, 2 surfaces).
- **Presentation frames are PRESENTATION-DEPENDENT** and sit beside masters
  (10 on the Actions page). Extraction must select `COMPONENT_SET` /
  top-level `COMPONENT` only, never frames or instances.
- **Static references** (Bar/Line/Area chart frames) are not components;
  `figmaAvailability: "partial"` is the only signal.
- **Description `TOKENS USED` is prose** and has been stale before (Free
  Badge/Toast/List Item, fixed 2026-09-28). Bound variables are the truth.
- **Read path caveat:** variable-name resolution was proven via the plugin
  API. The hosted REST variables endpoint is plan-restricted (unverified for
  this account) → AG-1 should consume a snapshot, not live REST (P1-6).

## 5. Token traceability

Chain: Figma bound variable → registry `tokensUsed` → `styles/tokens.css` →
component CSS module.

| Property | Figma → registry | registry → CSS | Verdict |
|---|---|---|---|
| Button primary background | `component/button/primary/background` = `tokensUsed` | CSS uses `--component-button-primary-fill` (different leaf name), value raw `#6c4cf2`, not an alias chain | NAME-MATCH ONLY / PARTIAL |
| Button radius | `component/radius/control` = `tokensUsed` | `--component-radius-control` (mapping only in a comment) | PARTIALLY TRACEABLE |
| Alert radius | live binds **`component/radius/feedback`**; `tokensUsed` says `component/radius/container` | `--feedback-radius: var(--shape-radius-container)`; no `--component-radius-feedback` exists | **BROKEN** — Pill mode: Figma feedback `radius/full` (9999), Figma container `radius/3xl` (32px), React container `16px [TEMPORARY]` |
| Alert danger surface | `component/feedback/danger/surface` (now Light/Dark-aware in Figma) | `--feedback-error-surface: #fde2e1`, no dark theme in `tokens.css` | PARTIAL; dark mode NOT_APPLICABLE in React |
| Dialog/Card surface | `component/card/surface` | `--component-card-surface` | PARTIALLY TRACEABLE |

Findings: the Figma-name domain (`tokensUsed` ↔ live bindings) is directly
comparable. `styles/tokens.css` also carries per-value parity labels in
comments — `[VERIFIED]`, `[TEMPORARY]`, `[EXPERIMENTAL]` (the label set in
`source-of-truth.md`); e.g. Rounded `--shape-radius-control: 6px [TEMPORARY]`
vs Figma `component/radius/control` = `radius/sm` (4px), while Button's own
`--component-button-radius-control: 4px` is `[VERIFIED]`. These labels are
the closest existing record of token parity status and AG-1 should capture
them as evidence (a `[TEMPORARY]` value is an acknowledged gap, still `fail`,
not `pass` and not `intentional-difference`). The CSS domain is not mechanically mappable (renamed leaves, raw
values, styles living in `internalDependencies`). Figma stabilization tokens
(`color/*/900`, `semantic/feedback/*-surface`, `component/feedback/*/icon`,
`component/radius/feedback`) exist only in Figma.

## 6. React API truth

- Custom props: registry `apiProps` → contract `api.properties` (documented
  subset). Actual API: TypeScript props types; `components/ui/index.ts` for
  public vs `internal/`.
- `api/nonexistent-prop` is **formally deferred** in Guard with real-source
  evidence: Button accepts the full native attribute set; `className` is
  widely unlisted; a type-checker mirror duplicates `tsc` and rejects
  `data-*` on intersection types.
- Figma property names do not map mechanically to React: `Style` → `variant`,
  `Size` → `size`, `State` → CSS pseudo-states (not props), `Label` →
  `children`, `Show leading icon` → presence of `leadingIcon`.

**The agent cannot safely emit NONEXISTENT PROP as FAIL.** It may report
"not in the documented API" as UNKNOWN/info and defer truth to `tsc`.

## 7. Figma ↔ React parity model

Existing metadata distinguishes: `available` / `partial` / `unavailable`
availability, node-ID presence, and prose. It cannot express:

| Needed state | Representable today? |
|---|---|
| FULL PARITY (verified) | No — `figma.verified` means node recorded |
| PARTIAL FIGMA REFERENCE | Yes (`partial`) |
| STATIC EXAMPLE ONLY | Only via prose |
| REACT-FIRST / FIGMA-FIRST | Only via prose (Dialog) |
| NO FIGMA REFERENCE | Yes (`unavailable`) |
| UNKNOWN | No explicit value |

**Minimum refinement for AG-1** (not implemented): an additive per-component
`figmaIdentity` block — `{ fileKey, nodeId, nodeType: "COMPONENT_SET" |
"COMPONENT" | "FRAME", role: "master" | "static-reference" | "composition-only",
verifiedAt }` — and keep parity verdicts out of the registry: parity is an
**audit output**, not stored metadata.

## 8. Guard readiness

- Deterministic, offline, six rules (3 public, 3 internal). Explicitly does
  **not** validate Figma, Shape/Surface, accessibility, or visual parity.
- Programmatic API `runGuard({ mode, target, projectRoot, claims })` returns
  structured `GuardDiagnostic`s with `subject`, `evidence.source`,
  `evidence.sourceGitSha`. CLI `--json` is deferred; the API is sufficient.
- No component-scope flag; results filter by `subject.id` (slug).
- Rule evaluation already models `violation | pass | not-applicable |
  unknown`, with "unknown is never a violation".

Boundary holds: **Guard = deterministic validation; Agent = reasoning,
explanation, orchestration.** No fuzzy Figma judgment belongs in Guard.

## 9. Evidence model (proposed, not implemented)

Extends Guard's existing `RuleEvaluation` vocabulary rather than inventing a
parallel one.

```ts
type AuditStatus = "pass" | "fail" | "unknown" | "not-applicable" | "intentional-difference";

type AuditFinding = {
  findingId: string;             // stable: `${slug}:${category}:${claimKey}`
  componentSlug: string;         // canonical identity
  category: "identity" | "api" | "tokens" | "states" | "figma-structure" | "react" | "accessibility" | "documentation" | "guard";
  claim: string;                 // what is being checked
  status: AuditStatus;
  expected?: string;
  actual?: string;
  evidence: Array<{
    sourceType: "figma" | "registry" | "contract" | "css" | "tsx" | "content" | "guard" | "docs";
    sourceRef: string;           // e.g. "figma:U6KU…/2034:25402 variant Type=Info topLeftRadius", "styles/tokens.css:284"
    observed: string;            // verbatim fact, never paraphrased inference
    capturedAt: string;          // snapshot git SHA or Figma snapshot timestamp
  }>;
  basis: "deterministic" | "inferred";   // observed fact vs model reasoning
  confidence: "high" | "medium" | "low";
  severity: "blocker" | "major" | "minor" | "info";
  suggestedFix?: { target: "figma" | "registry" | "css" | "tsx" | "content"; description: string };
  requiresHumanDecision: boolean;
};
```

**Status semantics (locked for AG-1):**

- `pass` — deterministic comparison, both sides observed, equal.
- `fail` — deterministic comparison, both sides observed, unequal, and no
  recorded intentional difference.
- `unknown` — a required side is missing, unmapped, unresolvable, or only
  prose. **Never counts as pass or fail.**
- `not-applicable` — the dimension does not exist on one side by design
  (React Dark mode; Glass for Free).
- `intentional-difference` — unequal but backed by a recorded source (e.g.
  `openQuestions`, documented non-parity in `project-status.md`, R1 narrowing).

An audit summary reports all five counts; it may never collapse `unknown`
into `pass`.

## 10. Human review and write boundary

| Action | Class |
|---|---|
| Read Figma snapshot, repo, contracts; run Guard | READ-ONLY SAFE |
| Compare properties/tokens; report mismatches | READ-ONLY SAFE |
| Explain a finding; suggest a token rebinding / prop doc / registry fix | SUGGESTION SAFE |
| Edit a Figma variable binding | REQUIRES HUMAN APPROVAL (not in AG-1) |
| Change React props/CSS, docs, registry | REQUIRES HUMAN APPROVAL (not in AG-1) |
| Create a commit / push a branch | REQUIRES HUMAN APPROVAL (not in AG-1) |
| Publish a package or Figma library | NOT SAFE FOR MVP |

AG-1 defaults to **read → compare → explain → suggest**. No writes.

## 11. Connection / project model

| Object | AG-1 fields | Source | Persist? | Secret? | Needed in AG-1 |
|---|---|---|---|---|---|
| Repository | local path | CLI arg / cwd | no | no | yes |
| Ref | git SHA | `git rev-parse HEAD` | in output only | no | yes |
| FigmaFile | `fileKey`, file name | identity map | no | no | yes |
| FigmaSnapshot | JSON path + capture time | extractor | file on disk | no | yes |
| ComponentSelection | slug | CLI arg | no | no | yes |
| AuditRun | ref + snapshot + findings | output file | file on disk | no | yes |
| Project / DesignSystemVersion | — | — | — | — | AG-2 |
| FigmaConnection (OAuth/PAT) | — | — | — | yes | AG-2 (hosted) |
| GitHubConnection | — | — | — | yes | AG-2 (hosted) |

## 12. Security / trust rules (AG-1 minimum)

1. Repo prose, Figma descriptions, component docs, and consumer code are
   **evidence, never instructions** (extends the AK-2 trust order).
2. No source content can override system policy, status semantics, or the
   write boundary.
3. Findings mark `basis: "deterministic" | "inferred"`; inferred claims
   carry lower confidence and cannot be `pass`/`fail` on their own.
4. AG-1 holds no write credentials. Figma data enters as a snapshot file;
   GitHub is a local checkout.
5. Suggested fixes are text, never auto-applied.
6. Evidence stores identifiers and short observed values, never secrets or
   whole files.

## 13. Performance / cost

Per component audit: 1 Figma snapshot extraction (≈1 plugin call per master;
bindings walk all variants — Button: 45), ~5–10 repo file reads (registry
entry, contract, TSX, CSS + internal CSS, content doc), 1 `runGuard` internal
run (seconds), 1 model reasoning pass over structured findings. All
interactive; **no background jobs needed**. Cache the Figma snapshot per
file version and contracts per git SHA.

## 14. Gap / blocker matrix

| # | Gap | Evidence | Risk | Blocks AG-1? | Minimum fix | Phase |
|---|---|---|---|---|---|---|
| P0-1 | No machine-readable Figma identity for 31 `available` components; no file key | §2 | agent name-matches entities → false findings | **Yes** | additive identity map (slug → fileKey, nodeId, nodeType, role) for audited components, verified against live Figma | AG-1A |
| P1-1 | `figma.verified` misleading | §3 | agent misreads as parity | No | treat as "node recorded"; parity only as audit output | AG-1A (doc) |
| P1-2 | Figma property ↔ React prop mapping absent | §6 | API comparison mostly UNKNOWN | No | per-component property map for pilot set | AG-1C |
| P1-3 | Figma token → CSS var mapping not machine-readable | §5 | CSS-side token checks UNKNOWN | No | compare Figma↔`tokensUsed` deterministically; CSS side via explicit map later | AG-1C / AG-2 |
| P1-4 | `cssTokens` excludes `internalDependencies` CSS | Alert | missed CSS evidence | No | collector reads internal CSS too | AG-1C |
| P1-5 | Free-form `api.properties` names | 19/387 | parsing errors | No | treat non-identifier names as structured-unknown | AG-1D |
| P1-6 | Hosted Figma variables read path unverified | §4 | hosted AG-2 may not resolve names | No (AG-1 uses snapshot) | plugin-API snapshot extractor | AG-1B |
| P2-1 | No state/anatomy/composition model | §3 | state audits are reasoning-only | No | defer (AK-4 territory) | later |
| P2-2 | Registry Figma prose drift (Dialog, Alert tokens) | §2, §5 | stale claims | No — AG-1 should *detect* these | pilot acceptance cases | AG-1F |
| P2-3 | React has no Dark theme | §5 | none (N/A semantics) | No | product decision | roadmap |
| P2-4 | Free gating matrix only in prose | site-config, docs | Free audits need hand rules | No | Pro-only in AG-1 | AG-2 |
| P2-5 | `agent-kit.md` AK-1 routing text historical | §1 | doc confusion | No | doc cleanup | later |
| P2-6 | Guard `--json` deferred | §8 | none (API exists) | No | use `runGuard()` | — |

## 15. Build / buy / defer

| Capability | Decision |
|---|---|
| Canonical facts, contracts, Guard, evaluation vocabulary | USE EXISTING |
| Figma identity map, snapshot extractor, comparator, evidence schema | SMALL EXTENSION |
| Report/reasoning layer | NEW AGENT INFRASTRUCTURE (thin) |
| Database, login, persistent workspace, background jobs | DEFER (AG-2+) |
| Vector DB / embeddings / agent memory | DEFER — facts are structured and slug-keyed; retrieval is a lookup |
| Multi-agent orchestration | DEFER |
| Autonomous write access | NOT IN MVP |

## 16. Readiness scorecard

| Area | Verdict |
|---|---|
| Canonical identity | READY WITH REQUIRED PREWORK (P0-1) |
| Contracts | READY (as projection; don't read `figma.verified` as parity) |
| Figma | READY WITH REQUIRED PREWORK (snapshot extractor) |
| React | READY (API truth via `tsc`; no NONEXISTENT PROP fails) |
| Tokens | READY WITH REQUIRED PREWORK (Figma side ready; CSS side UNKNOWN until mapped) |
| Guard | READY |
| Evidence | READY WITH REQUIRED PREWORK (schema to add) |
| Human-review safety | READY (read-only by design) |
| Connection model | READY (local CLI, no auth) |

**Overall: READY WITH REQUIRED PREWORK.**

## 17. AG-1 Audit Agent MVP contract

**Input:** repo path (default cwd) + optional git ref; Pro Figma file key; one
component slug; a Figma snapshot JSON (produced by AG-1B).

**Pipeline:** resolve identity (slug → registry → identity map; abort with
`unknown` identity if absent) → gather canonical contract (compile or read
`public/agent/contracts/<slug>.json`, check provenance SHA) → gather Figma
facts from snapshot → gather React facts (TSX exports, own + internal CSS
vars) → gather token facts (`tokensUsed`, bindings, CSS vars) → run
`runGuard({ mode: "internal" })`, filter by slug → deterministic comparisons
→ classify with the five statuses → model writes explanations and suggested
fixes for non-pass findings → emit report for human review.

**Output:** `audit/<slug>.<sha>.json` (findings + counts + provenance) and a
Markdown summary. Nothing else is written.

**Example (Alert, real current semantics, abbreviated):**

```json
{
  "component": "alert",
  "ref": "b1f8a45",
  "figma": { "fileKey": "U6KUuNf7DF4CP9QBOkLSUx", "nodeId": "2034:25402", "nodeType": "COMPONENT_SET" },
  "summary": { "pass": 3, "fail": 2, "unknown": 2, "not-applicable": 1, "intentional-difference": 0 },
  "findings": [
    { "category": "api", "claim": "Figma Type options ↔ registry variants", "status": "pass",
      "expected": "Info|Success|Warning|Error", "actual": "info|success|warning|error", "basis": "deterministic" },
    { "category": "tokens", "claim": "container radius token", "status": "fail",
      "expected": "component/radius/feedback (live Figma binding)", "actual": "component/radius/container (registry tokensUsed)",
      "basis": "deterministic", "severity": "major", "requiresHumanDecision": false,
      "suggestedFix": { "target": "registry", "description": "Update tokensUsed after deciding React parity (see next finding)." } },
    { "category": "tokens", "claim": "Pill-mode radius rendering", "status": "fail",
      "expected": "radius/full (9999) in Pill via component/radius/feedback", "actual": "--feedback-radius → --shape-radius-container = 16px [TEMPORARY] in Pill",
      "basis": "deterministic", "severity": "major", "requiresHumanDecision": true,
      "suggestedFix": { "target": "css", "description": "Decide Pill geometry for feedback surfaces, then add --component-radius-feedback per Shape mode and point --feedback-radius at it." } },
    { "category": "tokens", "claim": "CSS usage for feedback surface", "status": "unknown",
      "actual": "styles live in internalDependencies; no Figma→CSS name map", "basis": "deterministic" },
    { "category": "states", "claim": "Dark-mode surface", "status": "not-applicable",
      "actual": "styles/tokens.css defines no dark theme", "basis": "deterministic" },
    { "category": "api", "claim": "Figma 'Show close' ↔ React prop", "status": "unknown",
      "actual": "no property map; candidate 'dismissible' is inferred", "basis": "inferred", "confidence": "medium" },
    { "category": "guard", "claim": "Guard internal rules for alert", "status": "pass", "basis": "deterministic" }
  ]
}
```

## 18. AG-1 implementation slices (not implemented)

| Slice | Goal | Likely affected | Output | Acceptance | Stop boundary |
|---|---|---|---|---|---|
| **AG-1A** Identity map | Resolve P0-1 for a pilot set (Button, Text Input, Alert, Dialog, Chart Card) | new data module next to registry + test; `agent-kit.md` note on `figma.verified` | slug → `{fileKey, nodeId, nodeType, role, verifiedAt}` | every pilot entry verified against live Pro via MCP; test fails on unknown slug | no contract schema change, no Figma edits |
| **AG-1B** Figma snapshot extractor | Read-only master facts | script using plugin/bridge read path | `snapshots/<fileKey>/<slug>.json` (props, variants, per-variant bindings, description sections) | deterministic re-run; masters only; frames excluded | read-only; no REST auth |
| **AG-1C** Repo facts collector | Contract + registry + TSX exports + own/internal CSS vars + Guard results | new `lib/audit/` module | normalized repo facts JSON | covers `internalDependencies` CSS; Guard filtered by slug | no repo writes |
| **AG-1D** Comparator + evidence schema | Deterministic comparisons, five-status classification | `lib/audit/` + tests | findings JSON | `unknown` never counted as pass; free-form prop names → unknown | no model calls |
| **AG-1E** Explanation layer | Model explains non-pass findings, suggests fixes | thin CLI wrapper | Markdown report | every statement cites evidence; inferred vs observed labeled | no writes, no auto-fix |
| **AG-1F** Pilot calibration | Golden cases | tests | acceptance suite | detects Alert radius drift, Alert `tokensUsed` staleness, Dialog `figmaReference` staleness; no false fail on Dark mode | Pro only |

## 19. Out of scope for AG-0 / AG-1

Agent UI, hosted API, auth, database, persistent workspace, autonomous Figma
or repo edits, Build/Guard/Content agents, Free-file audits, industry
systems, Consumer Contract Verification, Guard CI-2/CI-3.

## 20. AG-1A — Figma identity map (implemented 2026-09-29)

Clears **P0-1** for the five pilots. Identity only: no parity, token, API, or
Figma changes.

**Schema.** One optional field on the canonical registry entry, next to the
existing `figma*` fields — `figmaIdentity?: FigmaIdentity`
(`lib/figma-identity.ts`):

| Field | Meaning |
|---|---|
| `fileKey` | Figma file key (not a URL) |
| `nodeId` | `<number>:<number>`, unique only within `fileKey` |
| `nodeType` | `COMPONENT_SET` \| `COMPONENT` \| `FRAME` |
| `role` | `master` \| `static-reference` \| `composition-only` (role/type pairs validated) |
| `verifiedAt` | ISO date the pair was confirmed against the live file |

- The identity key is the `(fileKey, nodeId)` pair; a node ID alone is never
  a complete identity (Free and Pro share node IDs).
- Existing fields keep their meaning: `figmaAvailability` unchanged,
  `figmaNodeId` still "a node ID is recorded" (it must equal
  `figmaIdentity.nodeId` when both are set), `figmaReference` prose
  untouched — including Dialog's stale "no master" note (AG-1F calibration).
- Contracts expose it 1:1 as `figma.identity` (compiled, never hand-written).
  `figma.verified` keeps its meaning — a concrete node is recorded — and is
  now also `true` for a pilot whose node is recorded only via `figmaIdentity`.
  It is never a parity claim.
- Versions: `CANONICAL_REGISTRY_SCHEMA_VERSION` and
  `CANONICAL_AGENT_CONTRACT_SCHEMA_VERSION` 1.0.0 → 1.1.0 (additive field);
  `AGENT_CONTRACT_GENERATOR_VERSION` 1.0.0 → 1.1.0. Public `/registry.json`
  does not expose the field and is unchanged.

**Pilot identities** (Pro `U6KUuNf7DF4CP9QBOkLSUx`, each resolved by ID in the
live file: one local master of that name, in its own canonical section, with
live instances):

| Slug | Node | Type | Role |
|---|---|---|---|
| `button` | `2012:7752` Actions/Button | COMPONENT_SET | master |
| `text-input` | `2022:1151` Forms/Text Input | COMPONENT_SET | master |
| `alert` | `2034:25402` Feedback/Alert | COMPONENT_SET | master |
| `dialog` | `2044:25869` Containers/Dialog | COMPONENT | master |
| `chart-card` | `3239:8017` Containers/Chart Card | COMPONENT | master |

**Enforced by** `lib/figma-identity.test.ts` (checked-in evidence only, no
live Figma in CI): exactly the five pilots carry identity, every identity
validates, no duplicate `(fileKey, nodeId)` pair, legacy `figmaNodeId`
consistency, a bare node ID is not an identity, contracts expose identity 1:1
with no parity fields, and compilation is reproducible.

**Remaining identity debt (53 of 58 entries at `e9634ce`):** 27 `available`
entries with no node ID at all, and 19 entries with a legacy `figmaNodeId` but
no file key/type/role (the rest are `partial`/`unavailable` with neither). Each needs the same live-Figma verification before an
agent can audit it. Next: **AG-1B — read-only Figma snapshot extractor.**

## 21. AG-1B — read-only Figma snapshots (implemented 2026-09-29)

Turns each AG-1A identity into a versioned, machine-readable record of what
that exact Figma node contains. No comparison, no React facts, no Figma writes.

**Snapshots are captured evidence — not canonical truth and never parity.**
Live Figma stays the authority for Figma; the registry and contracts do not
read snapshots.

**Architecture (transport separated from normalization):**

```
figmaIdentity (registry)
  → scripts/figma-snapshot/capture-in-figma.js   plugin-runtime, read-only → RawFigmaCapture
  → lib/figma-snapshot/normalize.ts               pure, deterministic       → FigmaSnapshot
  → lib/figma-snapshot/validate.ts                identity + integrity checks
  → agent/figma-snapshots/<fileKey>/<slug>.json   committed evidence
```

- Repo code cannot call the Figma Desktop Bridge, so the capture script runs
  in the Figma plugin runtime (the bridge's `figma_execute` today) and emits
  `RawFigmaCapture` (`lib/figma-snapshot/raw-capture.ts`) — the boundary any
  future transport (plugin, REST) must produce. The script refuses targets
  whose file key differs from the open file (Free shares node IDs with Pro).
- `scripts/figma-snapshot/write-snapshots.ts` takes identities from the
  registry, normalizes, validates, and writes nothing unless every snapshot
  passes.

**Read surface (plugin API, pilots):**

| Fact | Available |
|---|---|
| Node ID/name/type, page, parent section | structured |
| Component properties (VARIANT/TEXT/BOOLEAN/INSTANCE_SWAP, keys, defaults, options) | structured |
| Variants and their values | structured |
| Variable bindings (radius, padding, gap, size, fills, strokes, gradient stops, effects, fontFamily, opacity) incl. inside nested instances | structured, with variable names |
| Variable collections, modes, per-mode values (one alias hop) | structured |
| Explicit variable modes set on a variant | structured |
| Text styles on text layers | structured (style name) |
| Nested instances → main component / component set, variant selections | structured |
| Auto-layout (mode, gap, padding, sizing, alignment), radius, stroke, size | structured |
| Description | prose (section headings derived) |
| Nested instance text/boolean/swap override values | not captured |
| Rendered per-mode output, full alias chains | not captured |
| Documentation links | not captured |
| Whether a nested component is public/helper/decorative | not determinable (Icon/ naming only) |

**Schema** (`lib/figma-snapshot/schema.ts`, `FIGMA_SNAPSHOT_SCHEMA_VERSION`
1.0.0): `schemaVersion`, `capturedAt` (the only volatile field), `capture`
(method, capture-script version, file name), `identity` (must equal the
registry's `figmaIdentity`), then three blocks:

- `observed` — node, componentProperties, variants, layouts, children,
  variableBindings, textStyles, nestedInstances, explicitVariableModes,
  variables, collections. Figma names are preserved exactly. Per-variant facts
  are grouped with a `scope` of `"all"` or the variant names that have them.
- `derived` — only from `observed`: description section headings, property
  counts, variant count, whether all axis combinations exist, directly bound
  collections, distinct nested masters (`icon` by naming convention only).
- `unknowns` — what was not captured and why (always includes React mapping,
  parity, rendered values, mode support).

No React mapping (`Style → variant` etc.) and no mode-support claims ("supports
Dark") appear anywhere; the validator rejects React/parity keys.

**Pilot snapshots** (Pro, captured 2026-09-29):

| Slug | Properties | Variant axes | Variants | Bindings (grouped) | Variables | Nested masters |
|---|---|---|---|---|---|---|
| `button` | 8 | Size, State, Style | 45 (complete) | 68 | 35 | Icon/ArrowRight, Icon/Check |
| `text-input` | 7 | Size, State | 15 (complete) | 44 | 21 | Icon/Calendar, Icon/WarningCircle |
| `alert` | 4 | Type | 4 (complete) | 40 | 21 | 5 icons |
| `dialog` | 2 | — | — | 88 | 25 | Actions/Button, 3 icons |
| `chart-card` | 0 | — | — | 61 | 21 | Actions/Button, Containers/Card, Containers/Chart Card Content, 2 icons |

**Reproducibility:** two independent live captures were byte-identical at the
raw level; re-normalizing the second with a different `capturedAt` reproduced
every committed snapshot exactly apart from that field.

**Limits / debt:** only the five pilots have snapshots (53 registry entries
have no identity yet); Button's per-variant scopes make it the largest file
(~99 KB) — expressing scopes as axis predicates is a later optimization;
capture requires a human-run plugin step until an automated transport exists.
Next: **AG-1C — repo facts collector.**
