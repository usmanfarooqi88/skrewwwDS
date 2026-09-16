# Pre-Guard Hardening (PH-0)

**Phase:** PH-0 ✅ COMPLETE (audit/planning only — no enforcement engine built)
**Baseline:** `aa99f5a` (Reference App RA-0–RA-6 ✅ COMPLETE, CE-3 ✅ COMPLETE)
**Status:** Guard Readiness Audit entry criteria (§14) evaluated — see verdict below

This document is the **single canonical PH-0 deliverable**. It does not
duplicate `docs/architecture/source-of-truth.md` (general conflict
resolution — this document assumes and extends it) or `docs/architecture/
agent-kit.md` (Agent Kit's own trust order and R1 token-precedence rule —
restated here only where directly relevant to Guard-rule safety).

**What PH-0 is not:** no Guard CLI, no Guard package, no ESLint plugin, no
custom MCP server, no CI enforcement product, no LLM review service. This
document identifies which facts are *safe* to later enforce deterministically
and which are not — it enforces nothing itself.

---

## 1. Purpose

A future Guard must answer questions like "is this a real component?", "is
this a real prop?", "is this token allowed here?" with **deterministic,
canonical-source-backed answers**, never model judgment. PH-0's job is to
map every candidate fact to its real canonical source, determine whether that
source is complete/authoritative enough to support a hard rule today, and
flag the ones that aren't — before any enforcement code exists to get it
wrong.

**Locked principle (restated from the task brief, not renegotiated here):**
canonical design-system facts → deterministic validation → clear diagnostics.
LLM review, if it exists later, is advisory only, never the source of truth.

---

## 2. Source-of-truth map

Extends `docs/architecture/source-of-truth.md` (general rules) with the exact
Guard-relevant facts and their canonical owners.

| # | Fact | Canonical source | Generated projection(s) | Authored/derived | Completeness | Confidence | Safe for deterministic enforcement? |
|---|------|-------------------|--------------------------|-------------------|---------------|------------|--------------------------------------|
| 1 | Component existence (implemented) | `lib/component-registry*.ts` (`hasImplementation: true`) | `public/agent/index.json`, `/registry.json` | Authored | Complete (55/55) | High — `components/ui/index.ts` cross-checked | **Yes** |
| 2 | Public React props | `entry.apiProps` in registry | `public/agent/contracts/<slug>.json`'s `api.properties` | Authored | Partial by design (only documented props, not raw TS type) | High for what's modeled; **not exhaustive** | **Yes, as an allow-list of known-good names — not as proof a name is invalid** (see §3) |
| 3 | Component maturity (Stable/Beta) | `entry.status`/`entry.version` in registry | Contract `status`/`version` | Authored | Complete | High | **Yes** |
| 4 | Distribution/installability | `entry.files` non-empty (same field `lib/shadcn-registry-generator.ts` reads) via `isDistributedViaSkrewwwRegistry()` (`lib/agent-kit/project-context.ts`) | `public/r/<name>.json`, `/r/registry.json` | Derived (from `files`) | Complete for the 52 distributed items | High — cross-checked against real generated manifests (`registry-integration.test.ts`) | **Yes** |
| 5 | Registry dependencies | `entry.registryDependencies` | Contract `distribution` field (when present), manifest `registryDependencies` | Authored | Complete for distributed components | High | **Yes** |
| 6 | npm dependencies | `entry.dependencies` | Manifest `dependencies` | Authored | Complete for distributed components | High | **Yes** |
| 7 | Shape applicability | **Not a canonical field** — inferred today only from CSS module usage of `--shape-radius-*`/`data-skrewww-shape` selectors, or from prose (`table-foundation.md` §20-style notes) | None generated | N/A | **Incomplete — no registry field exists** | Low | **No** — see §9 |
| 8 | Surface applicability | Same gap as Shape | None generated | N/A | **Incomplete** | Low | **No** — see §9 |
| 9 | `tokensUsed` | `entry.tokensUsed` in registry | Contract `tokens.used` (registry-only, per AK-1's R1 rule) | Authored/derived hybrid (see §7) | **Variable** — verified-against-Figma for some slugs (Avatar, Calendar Day, Pagination, Data Table per RA-5), "confirmed against implementation" for the rest | Medium — semantics differ per component | **Partial — see §7 for the exact split** |
| 10 | Accessibility metadata | `entry` behavioral fields (`keyboardBehavior`, `focusBehavior`, `announcementBehavior`) when present; otherwise absent, never inferred | Contract `behavior.*` (sparse, omitted when absent — never fabricated, per `agent-kit.md`) | Authored | **Sparse by design** — many components have none of these fields | Medium (accurate where present, silent where absent) | **Partial — see §10** |
| 11 | Keyboard metadata | Same field as above (`keyboardBehavior`) | Same | Authored | Sparse | Medium | **Partial** |
| 12 | Figma verification | `entry.figmaNodeId`/`figmaAvailability`/`figmaReference` | Contract `figma.verified: false` when no node ID (never assumed true) | Authored | Complete as a boolean signal; the underlying node may still be stale (no live re-check) | Medium — boolean is honest, but "verified" only means "was verified once," not "still matches Figma today" | **Yes for the boolean signal only, not for parity claims** |
| 13 | Known limitations | `entry.openQuestions` (registry) + README "Known limitations" (curated subset) | Contract `openQuestions` | Authored | Complete in registry; README is intentionally a curated subset | High | **Yes for registry `openQuestions`; README subset not authoritative for absence** |
| 14 | Recipes/compositions | `agent/recipes/*.ts` (AK-4) | `public/agent/recipes/*.json`, `public/agent/feature-kits/*.json` | Authored | Deliberately narrow (one pilot Feature Kit as of AK-4) | High for what exists; **near-zero coverage** | **Yes, narrowly — absence of a Recipe proves nothing** |
| 15 | Project context (consumer signals) | `lib/agent-kit/project-context.ts`'s `detectProjectContext` | N/A (runtime-only, never persisted) | Derived, confirmed-or-unknown only | Complete for the 8 modeled fields; nothing outside them | High for what's modeled — proven adversarial-input-safe (`project-context.test.ts` scenario D) | **Yes for the 8 confirmed fields, and only those — see §17** |
| 16 | Agent Skill rules | `agent/skill/SKILL.md` (canonical) | `.claude/skills/skrewww-ui/SKILL.md`, `public/agent/skill/SKILL.md` (both byte-identical projections) | Authored | Complete, versioned via behavioral-freeze SHA | High — `skill.test.ts` proves adapter byte-identity | **Yes, as instruction text — not itself a fact source** |

**No guessed authority was used above.** Every "canonical source" cell names
a real file/field this session read directly; every "safe for enforcement"
verdict is qualified rather than asserted where the underlying source is
incomplete.

---

## 3. Public API enforcement safety (Part 3)

**The critical existing invariant — `api.properties` is the only valid React
prop allow-list — is structurally protected, not just documented:**

- `agent-kit.md` states it as a locked rule ("Use only `api.properties` as
  the React prop allow-list... never invent a `variant` prop from
  descriptive `api.variants` alone").
- Enforced by real tests: `lib/agent-kit/contract-compiler.test.ts`,
  `lib/agent-kit/skill.test.ts`, `lib/agent-kit/evaluation-scorer.test.ts`
  (the AK-5 hard-scorer's **forbidden-claim scan** specifically rejects
  `apiReferences` not present in `api.properties`, and separately
  distinguishes a **usage-shaped** reference — e.g. `glowIntensity=` as a
  JSX attribute — from a mention inside `unresolvedGaps`/rejection prose,
  which does not count as a violation).
- `compileComponentContract` throws (`ContractCompilerError`) rather than
  silently emitting a contract where `content.tokensUsed ⊄ registry
  .tokensUsed` — the same fail-closed posture applies to the API surface: a
  descriptive `variants`/`anatomy`/`comparisons` field is never compiled
  into `api.properties`.

**Findings from this pass — no violations found, one structural risk
identified:**

1. **Prose-mentions-prop-like-names risk exists but is currently contained.**
   `entry.openQuestions`, `anatomy`, and `comparisons` strings frequently
   *name* real or historical prop-shaped identifiers in prose (e.g. Button
   Group's own openQuestions mentions `role=radiogroup`, Split Button's
   mentions Figma variant names). None of these leak into `api.properties`
   — confirmed by reading `contract-compiler.ts`'s compiled-field list in
   `agent-kit.md` (§"Compiled fields vs. deliberately unmodeled fields"):
   only `entry.apiProps` maps to `api.properties`; every other field maps
   to a differently-named contract field (`guidance`, `openQuestions`,
   etc.), so a future Guard rule scanning `api.properties` specifically
   (never other contract fields) is safe.
2. **`api.variants`/`api.sizes` vs `api.properties` confusion is the one
   real false-positive trap**, already named explicitly in both
   `agent-kit.md` and the AK-5 scorer rule above. A future rule must check
   "is `X` a real value in a prop that's in `api.properties`" — never "is
   `X` mentioned anywhere in the contract."
3. **Registry vs. generated contract disagreement:** not found in this pass
   for `apiProps` specifically (unlike `tokensUsed`, which has a known,
   tested reconciliation history — see §7). No dedicated "apiProps ⊆
   compiled `api.properties`" *identity* test exists beyond the compiler's
   own direct 1:1 mapping (there is no lossy transform between them, so a
   divergence would require the compiler itself to have a bug, which
   `contract-compiler.test.ts` already exercises structurally).

**Not fixed here:** no schema expansion, no new test. This section is
audit-only per Part 30's fix policy.

---

## 4. Component identity model (Part 4)

A future Guard must **not** collapse these into one category:

| Category | Definition | Canonical signal | Count (this baseline) |
|----------|------------|-------------------|--------------------------|
| **A. Implemented component** | Has a real, working React implementation | `entry.hasImplementation === true` | 55 |
| **B. Distributed/installable component** | Implemented **and** transportable via `npx shadcn add @skrewww/<slug>` | `entry.files` non-empty (⊆ A) — `isDistributedViaSkrewwwRegistry()` | 52 (+ Foundation = 53 total `/r/*.json` discovery items) |
| **C. Internal helper** | A file bundled as a *dependency* of a public component, never independently installable or contract-compiled | `entry.internalDependencies` entries; e.g. `TreeItem.tsx`, `tree-flatten.ts`, `use-data-table-sort.ts` | Not separately counted — bundled, not registry entries |
| **D. App composition** | Application-level code (Reference App, docs-site chrome) that *uses* real components but is not itself a component | Lives under `app/`, `components/reference-app/`, `components/docs/` — never in `lib/component-registry*.ts` | N/A |
| **E. Nonexistent/invented component** | A name an LLM might plausibly generate that has no registry entry at all | Absence from `public/agent/index.json`'s slug list | N/A by definition |

**Why the collapse risk is real:** A ⊋ B by exactly 3 (banking trio,
implemented but deliberately not distributed — Class B per
`distribution-expansion.md` Part 10, pending Figma-verified parity, not a
vanity gap). A rule that treats "implemented" and "installable" as
synonyms would incorrectly claim `npx shadcn add @skrewww/banking-account
-card` works. C is the single highest-risk category for a naive
component-existence check: `TreeItem`, `CalendarMonthCell`,
`DataTableSortHeader`'s own helper `use-data-table-sort` — none of these
are components in the Guard sense, but each has a real file that a glob-
based "found a `.tsx` in `components/ui/`" heuristic would misclassify as
D or E.

**Safe deterministic model:** classify strictly by registry membership
first (A vs. E), then by `entry.files` non-emptiness (A∩B vs. A∖B), never
by file-path pattern-matching alone.

---

## 5. Installability truth (Part 5)

**Verified current, no stale claims found:**

- `isDistributedViaSkrewwwRegistry(slug)` reads the exact same `entry.files`
  field the generator (`lib/shadcn-registry-generator.ts`) itself reads —
  confirmed via `agent-kit.md`'s AK-3 section and cross-checked by
  `lib/agent-kit/registry-integration.test.ts` against real generated
  `public/r/*.json` output. No second, hand-maintained distributed-list
  exists.
- Banking trio (`banking-account-card`, `banking-balance-summary`,
  `banking-transaction-row`) correctly report `false` — deliberately
  excluded, Class B, pending Figma parity (`distribution-expansion.md`
  Part 10, reconfirmed unchanged by RA-6's banking-independence check).
- Foundation is handled as its own installable `registry:file` item
  (`/r/foundation.json`), included in the 53-item discovery count, not
  conflated with a "component."
- `/r/registry.json` — the discovery index — exists and is current (CE-3N
  shipped, CE-3O live-validated 2026-09-15 per `agent-kit.md`'s AK-3
  section; 53 discovery items confirmed on production).
- Searched for `"only six"`, `"only nine"`, `"partial list"`, `"search
  unavailable"` across current-facing docs (`README.md`,
  `docs/getting-started.md`) — **zero matches**. `shadcn-distribution.md`
  does still say "current九 components" in its own historical "Scope of
  this pass" section (2026-08-09 dated), but that section is explicitly
  historical/dated prose within a durable architecture doc describing what
  was true *at that pass* — not a current-facing claim, and per Part 25's
  own instruction ("historical dated entries can remain"), left untouched.
- README's own component count is **not hardcoded** — it reads "count
  derived from `/registry.json` (`metadata.implementedComponentCount`,
  `hasImplementation: true`)" — already immune to staleness by
  construction.

**No fix needed in this category.**

---

## 6. Maturity truth (Part 6)

**One canonical source confirmed: `entry.status`/`entry.version` in
`lib/component-registry*.ts`.** Every projection (Agent Kit contract
`status`/`version`, `/registry.json`'s public metadata, README's
"individual entries remain Beta until promoted" framing) reads from it —
no independent maturity computation exists anywhere in the codebase this
session found.

**Confirmed NOT inferred from:** test coverage, distribution status, Figma
presence, or component age — verified by reading the registry entries
directly during CE-3/RA-5 work (e.g. `toggle-group`'s `figmaAvailability:
"unavailable"` with `status: "beta"` — Figma absence does not downgrade or
otherwise compute maturity; it's an independent field).

**Safe deterministic rule:** `entry.status` is authoritative; a Guard rule
rejecting "component X is Stable" when `entry.status !== "stable"` is
**SAFE HARD RULE** territory (see §23, rule `maturity/false-stable-claim`).

---

## 7. Token / `tokensUsed` enforcement findings (Part 7)

This is the single most nuanced fact in the whole map — treated with the
care Part 7 demands.

**What `tokensUsed` means today is not uniform across components:**

- For components with a **dedicated registry test locking the array to
  verified Figma bindings** (confirmed for Avatar, Calendar Day, Pagination
  as of AK-1; RA-5 additionally treated Data Table's `cssTokens` this way),
  `tokensUsed` is **deliberately narrower than raw CSS usage** — a
  stylesheet can reference a fallback/computed custom property that's
  genuinely rendered but was excluded from a prior Figma-verification pass.
- For every other component, `lib/component-registry.test.ts`'s
  cssTokens-accuracy test (used extensively in CE-3H through CE-3M and
  RA-5 this session) enforces the **opposite** direction: every `var(--…)`
  reference in the component's own owned `.css` files **must** appear in
  `cssTokens`/`tokensUsed` — i.e. for the general case, "used a token not
  listed" is enforced as always wrong (a real, currently-passing test), but
  "listed a token not used" is not checked at all (a stale/over-broad list
  would not currently be caught).
- The two directions are asymmetric on purpose: the accuracy test catches
  **under-declaration** (safe, provable via the CSS module the entry
  itself declares — no ambiguity about which files count). It does not,
  and structurally cannot without additional metadata, catch **over-
  declaration** or the Avatar/Pagination-style intentional narrowing,
  since those are legitimate exceptions distinguished only by the presence
  of a component-specific registry test, not by any general field.

**Classification (per Part 7's exact framework):**

| Candidate rule | Classification | Reasoning |
|---|---|---|
| "Component's owned CSS references a `var(--x)` not in `tokensUsed`" | **SAFE HARD RULE** | Exactly what `lib/component-registry.test.ts`'s existing accuracy test already checks, mechanically, per-file, no ambiguity. Already enforced as a test; promoting it to a Guard rule reuses proven logic (see §15). |
| "`tokensUsed` lists a token the component's CSS never references" | **NOT READY** | Would produce false positives on every Avatar/Pagination/Data-Table-style intentionally-narrowed-vs-Figma entry, and on any component whose `tokensUsed` legitimately includes a token consumed only via a *shared* internal helper file not counted in the "owned CSS" scan. Needs a documented per-component "verified-narrow" flag before this direction is safe. |
| "Using a token not in the canonical Shape/Surface/semantic token set at all (a raw hex, or a non-existent custom property name)" | **SAFE WARNING** | Distinct from `tokensUsed` accuracy — this is about token *existence*, not *declaration completeness*. `token-source-of-truth.md`'s own rule ("do not introduce new hardcoded hex values in public component CSS modules") is a real, stated policy, but has legitimate exceptions (Tailwind docs-shell palette is explicitly out of scope; `[TEMPORARY]`/`[EXPERIMENTAL]` tokens are themselves provisional real values, not violations). Warning, not error, until exceptions are enumerated. |

**Do NOT build a rule that treats every `tokensUsed` gap identically** —
the two directions above have genuinely different false-positive risk
profiles, and conflating them was the exact trap Part 7 warned against.

---

## 8. Token classification audit (Part 8)

`styles/tokens.css` uses five real, currently-used annotation tags (counted
directly in this pass):

| Tag | Count | Meaning |
|-----|-------|---------|
| `[VERIFIED]` | 45 | Confirmed against live Figma MCP inspection at some point |
| `[ALIASED]` | 34 | A semantic/component token that resolves to another token, not a raw value |
| `[TEMPORARY]` | 28 | A real, working value that stands in for an unresolved Figma decision (e.g. Pill mode's 16px container cap, `--table-scroll-shadow`) |
| `[EXPERIMENTAL]` | 2 | Provisional, expected to change |
| `[UNRESOLVED]` | 1 | Known-incomplete, no confirmed value yet |

**Findings:**

- `[VERIFIED]`/`[ALIASED]` tokens are candidates for hard enforcement of
  "use the correct token, not a hardcoded equivalent value" — the value is
  settled.
- `[TEMPORARY]`/`[EXPERIMENTAL]`/`[UNRESOLVED]` tokens are **legitimate
  exceptions**, not violations-in-waiting — using them is currently
  correct (RA-5's own Toggle Group vertical-Pill fix deliberately reused a
  `[TEMPORARY]`-adjacent Pill-container value rather than inventing a new
  one, exactly the sanctioned pattern). A future rule must never flag
  `TEMPORARY` usage as an error; at most, an `INFO`-severity "this token is
  marked temporary, pending Figma resolution" note is appropriate (see
  §21's severity model).
- **Legitimate hardcoded-value exceptions exist and must be preserved**:
  Tailwind docs-shell palette (`ink.*`, out of scope by
  `token-source-of-truth.md`'s own rule), any value inside a `styles/
  tokens.css` Shape/Surface mode block itself (where the raw values *are*
  the token definitions, not usages), and third-party library defaults a
  component intentionally does not override.
- **Not safe as a hard rule yet:** "flag every raw hex/pixel value in a
  component CSS module" — would need a maintained exception list (this
  file's own Shape-mode blocks, any deliberately-unthemed decorative
  value) that does not currently exist as machine-readable metadata.
  Recorded as a Guard Readiness Audit input, not built here (Part 30).

---

## 9. Shape / Surface enforcement (Part 9)

**Finding: no canonical, machine-readable Shape/Surface-applicability field
exists on `ComponentRegistryEntry` today.** This is a genuine metadata gap,
not a rule-design problem.

Current signal sources, all secondary/inferential:

- CSS module usage of `--shape-radius-control`/`--shape-radius-container`
  or `[data-skrewww-shape="…"]` selectors (what RA-5 used to *diagnose*
  Toggle Group's vertical-Pill bug, and what confirmed Table is
  Shape-inert — `table-foundation.md` §20 states this in prose, not a
  field).
- Prose in architecture docs (`table-foundation.md`'s explicit "Table
  exposes no Surface or Shape property" statement) — accurate, but not
  queryable without reading Markdown.

**Distinguishing the four states Part 9 requires** ("participates in
Shape," "fixed shape," "supported subset," "Shape-inert") is possible today
only by manually reading each component's CSS + any architecture-doc prose
— there is no `entry.shapeSupport` or equivalent field. Same for Surface's
four states (Flat/Gradient/Glass/Surface-inert/supported subset).

**Verdict: NOT READY for either Shape or Surface enforcement.** Building a
rule here today would mean either (a) scanning CSS as primary evidence —
explicitly against Part 9's own instruction — or (b) hand-maintaining a
second, parallel Shape/Surface applicability list outside the registry,
which risks exactly the kind of drift `source-of-truth.md` exists to
prevent. **Recorded as a genuine schema-expansion candidate for the Guard
Readiness Audit** (not built here, per Part 30's explicit "if schema
expansion appears necessary: record it for Guard Readiness Audit").

---

## 10. Accessibility enforcement findings (Part 10)

Machine-readable accessibility data today is **sparse by design**: `entry
.keyboardBehavior`/`focusBehavior`/`announcementBehavior` are free-text
strings, present only where authored, "omitted, never fabricated, when
absent" (`agent-kit.md`). There is no structured (boolean/enum) a11y
contract field.

**Candidate rules evaluated against real evidence, not implemented:**

| Candidate | Evidence this session found | Deterministic? |
|---|---|---|
| Icon-only Button requires an accessible name | `Button.tsx`'s real API accepts `aria-label`; RA-5's own Table-Actions fix (`RequestsDataView.tsx`) depended on exactly this — the canonical `TablePreview.tsx` pattern always pairs a bare icon child with `aria-label` | **Feasible** — but requires static analysis of JSX (does this `<Button>` have visible text children or an `aria-label`?), which is a real static-analysis engine, not a registry-field lookup. Readiness: the *rule* is soundly evidenced; the *implementation approach* is out of PH-0 scope (no code written). |
| Dialog requires an accessible title/name | `docs/architecture/*` and component source establish this contract exists in the DS (Dialog composition requires `DialogHeader`/title), but no registry field states "Dialog requires X" as queryable metadata | Same caveat — real static analysis needed, not a metadata lookup |
| Form control requires a label | `FormField`'s own architecture (`docs/architecture/form-field.md`) enforces this via composition, not a lint | Same |
| Invalid state requires an associated error | `ValidationMessage`/`FormField`'s `aria-describedby` wiring is real and tested (Vitest), but is a runtime/composition contract, not a static registry fact | Same |
| MenuItem `disabled` must not execute `onSelect` | Real, tested component behavior (`Menu.tsx`) — this is a **component correctness** invariant, already covered by the component's own unit tests, not a *consumer usage* rule a Guard would check in someone else's project | **Not a Guard-shaped rule at all** — belongs to component tests, not usage enforcement |
| Native `Table` must not be casually converted to `role="grid"`| Explicitly documented as a "Common mistake" in `table-foundation.md` §25 | **Feasible as a static pattern-match** (`role="grid"` literal string near a `<Table>`/`<table>`) — low complexity, but risks false positives if a consumer's own unrelated `<table>` legitimately uses `role="grid"` outside Skrewww's Table |

**Overall verdict for accessibility rules: candidate evidence exists for
several rules, but every one requires real static JSX/AST analysis of
*consumer* code — none is answerable from registry/contract metadata
alone.** This is a materially different (and larger) engineering
commitment than the metadata-lookup rules in §3–§6, and is explicitly
**not implemented here** per the "do not implement lints" instruction.
Recorded as Guard Readiness Audit input, ranked by static-analysis
complexity, not metadata-readiness.

---

## 11. Composition-rule findings (Part 11)

**`relatedComponents` is adjacency, not a contract** — confirmed by reading
several registry entries directly (e.g. Button Group's `relatedComponents`
lists Split Button and Tabs; nothing about that list implies "must be used
with" or "cannot be used without"). No composition rule may be derived from
it.

**Real composition knowledge that does exist:**

- `agent/recipes/*.ts` (AK-4) — authored, narrow (one pilot Feature Kit),
  explicitly ranked below component contracts in trust order. **Composition
  facts here are HARD only for what a Recipe explicitly states about
  itself** (its own referenced component slugs, its own derived
  `componentMaturity`/`installableViaSkrewwwRegistry`) — never generalized
  beyond the specific Recipe.
- Reference App (RA-0–RA-6) — real, tested, working compositions, but
  **evidence of what works, not a prescriptive contract**. Promoting "the
  Reference App does X" into a universal rule was explicitly the trap Part
  11 warns against.
- Architecture-doc prose (`table-foundation.md`'s "Common mistakes" list,
  `form-field.md`'s composition rules) — real, authored, but currently
  Markdown prose, not structured data.

**Classification:**

| Composition fact | Class |
|---|---|
| A Recipe's own stated component list / derived fields | **HARD** (for that Recipe only) |
| "Don't add `role="grid"` to Table" (documented common mistake) | **WARNING** — real, documented, but requires the same static-analysis engine as §10 |
| "Nested Popover composition is risky" (RA-2/RA-3 lesson) | **ADVISORY** — see §12, one incident is not a universal law |
| Any Reference-App-only pattern not independently documented in an architecture doc | **NOT READY** — evidence, not contract |

---

## 12. Reference App lessons safe for enforcement (Part 12)

Extracted durable lessons, each checked against whether it's an isolated
incident or a documented system-level rule:

| Lesson | Source | Generalizable? |
|---|---|---|
| Nested Popover composition (Combobox/Select/DatePicker inside another Popover) causes dismiss/click-through | RA-2 delivery notes (`reference-app-plan.md`) — "Desktop used inline panel instead of Popover... nesting caused dismiss/click-through (G0)" | **ADVISORY only.** This is real, reproduced evidence of one real interaction hazard — worth a documented warning ("avoid nesting two Popover-family overlays") — but it was fixed via **application composition** (G0: don't nest), not a shared-component defect. Guard should not hard-block nested Popovers without broader architecture confirmation that no legitimate nesting pattern exists anywhere in the DS. |
| Page-level horizontal overflow vs. local `TableScrollArea` scroll | RA-1/RA-4 G0 fixes (`overflow-x-clip` shell + table `grid` containment) | **WARNING-worthy, structural.** `table-foundation.md` §12 already documents this as the canonical contract ("Owns `overflow-x-auto` so the page does not scroll horizontally"). Safe to check statically: does a page wrapping `Table` also set page-level `overflow-x-clip`/equivalent? Feasible, not built here. |
| Overlay reachability near the viewport bottom depends on *all* fixed-position page chrome, not just the DS's own `computePopoverPosition` | RA-4 follow-up (`AnalyticsConsentBanner` occlusion) | **ADVISORY only, application-specific.** `computePopoverPosition` was proven correct; the bug was a Reference-App-specific fixed element the DS has no knowledge of. This is evidence that overlay positioning is *not* a Guard problem for arbitrary page chrome — cannot be turned into a general rule without knowing about every possible fixed element in a consumer's page, which Guard cannot. |
| App composition vs. new DS component judgment calls (Command Palette, Multi Select, sidebar width) | RA-0's own decision gates | **NOT a Guard rule** — these are human design decisions, correctly gated behind explicit human/Figma approval already (§13), not something to encode as automated enforcement. |
| Accessibility relationships (label/error association, focus restore) work correctly when composed as documented | RA-3/RA-4 forms + overlay specs, all passing | **Confirms existing contracts are sound**, not a new rule — reinforces that the *documented* composition pattern (FormField + Textarea + ValidationMessage, Dialog + finalFocusRef) is the one to check consumers against, if/when static analysis exists. |

**No single Reference App decision was promoted to universal law without
independent architecture-doc backing**, matching Part 12's explicit
instruction.

---

## 13. Known deferred items — Guard must not treat as settled (Part 13)

| Item | Status | Guard implication |
|---|---|---|
| **Command Palette** | G5 — searchable-command ARIA model unresolved (`reference-app-plan.md` §12); explicitly deferred, not silently dropped (reconfirmed RA-6) | Guard must never validate against an assumed Command Palette pattern; absence of one is correct, not a gap to flag |
| **Searchable Multi Select** | Design-first / effectively blocked pending accessibility decision (§13 of the same doc); Checkbox+Tags composition proven sufficient for MVP | Guard must not flag Checkbox-based multi-selection as "should be a Multi Select component" — that's exactly the premature-component-invention failure mode Guard exists to prevent, applied to Skrewww's own roadmap |
| **Table caption/header visual contract** | Pending Figma Caption master (`table-foundation.md` §19/§23, reconfirmed RA-5/RA-6, non-blocking) | Guard must not assert a "correct" caption/header visual relationship — none is Figma-verified yet |
| **Button Group Squircle outer silhouette** | Needs new, unverified asymmetric (two-corner) clip-path geometry (RA-5, reconfirmed RA-6, non-blocking) | Guard must not flag the current plain-radius joined-child fallback as wrong — it's the documented, deliberate interim state |
| **Banking trio** | Implemented, Figma-`unavailable` for parity, distribution deferred (Class B, `distribution-expansion.md` Part 10) — **not** the same as CE-0's "parity Class B" concept, a distinct meaning reused for a different purpose; the docs are explicit about not conflating the two | Guard must not report banking components as broken/incomplete — they are a deliberate scope boundary, not a defect |

**Guard v0.1 must ship with an explicit "known unresolved, do not enforce"
list mirroring this table** — the single highest-value artifact this
section produces for the Guard Readiness Audit.

---

## 14. False-positive risk matrix (Part 14)

The major PH-0 deliverable, covering every rule class discussed above plus
scenarios not yet mentioned.

| Risk scenario | Example | Affected rule class | Risk |
|---|---|---|---|
| Prop name appears only in an app wrapper, not the DS component | A consumer's own `<MyButton glowIntensity={2}>` wrapping Skrewww's `Button` | api/* | **LOW** — AK-5's scorer already distinguishes usage-shaped references from mentions in rejection prose; a Guard rule inspecting real JSX call sites (not string search) inherits this safety |
| Token appears through a CSS alias, not a literal `var(--x)` | `--table-surface: var(--component-card-surface)` — Table's own token is an alias to Card's | token/* | **MEDIUM** — a naive "scan for `var(--table-surface)`" check would miss that Table's *actual* rendered token ultimately traces to Card's semantic layer; alias chains must be resolved, not string-matched |
| Internal helper mistaken for public component | `TreeItem.tsx`, `DataTableSortHeader.tsx`'s `use-data-table-sort.ts` | component/* | **LOW-MEDIUM** — mitigated entirely by classifying strictly through registry membership (§4), never file-path globbing; risk is HIGH if that discipline is ever abandoned |
| Distributed status confused with implementation status | Assuming all 55 implemented components are `npx shadcn add`-able | distribution/* | **LOW** — both facts are independently queryable (§4/§5); risk only arises from careless rule authoring, not source-of-truth ambiguity |
| Intentional React/Figma divergence flagged as parity failure | Toggle Group has no Figma master at all (`figmaAvailability: "unavailable"`) yet ships a real, human-approved vertical-Pill treatment (RA-5) | composition/*, token/* | **HIGH** if a rule assumes "no Figma = broken"; Toggle Group is proof this is a normal, sanctioned state, not a defect |
| Accessibility behavior supplied by native HTML, not explicit metadata | `Table`'s native `<table>` semantics need no `role`/`aria-*` — `table-foundation.md` explicitly forbids adding redundant roles | accessibility/* | **HIGH** if a rule requires explicit ARIA presence; native semantics are often the *correct* absence of ARIA, and a naive "missing aria-label" check would flag correct code |
| App composition intentionally wraps a DS primitive | `RequestsDataView.tsx`'s row-action `Button` wrapped in application-level `Menu`/`MenuTrigger` composition | composition/* | **LOW-MEDIUM** — the DS's own compound-component pattern (Menu/MenuTrigger/MenuContent) is exactly this kind of "wrapping," and is correct; a rule must distinguish sanctioned compound composition from an actual duplicate-implementation risk |
| `tokensUsed` over-declaration (component lists a token its current CSS doesn't reference) | Not confirmed present in this pass, but structurally possible after any refactor that removes a CSS reference without updating the registry | token/* | **MEDIUM** — no test currently catches this direction (§7); until one exists, a Guard rule in this direction has unknown false-negative *and* false-positive rates |
| Recipe/Feature-Kit absence treated as "this composition pattern doesn't exist/isn't supported" | Only one pilot Feature Kit exists (AK-4) | composition/* | **HIGH** if absence is read as prohibition — the DS supports far more compositions than are currently authored as Recipes |

**Ranking discipline for §23's candidate rules: only LOW-risk rules are
proposed as `ERROR`-severity in the initial candidate set.** MEDIUM-risk
items are proposed at `WARNING` at most; HIGH-risk items are excluded from
the v0.1 candidate set entirely (§25).

---

## 15. Existing reusable tests / validators (Part 15)

| File | Invariant protected | Scope | Reusable as Guard logic? | Should stay test-only? |
|---|---|---|---|---|
| `lib/component-registry.test.ts` (cssTokens-accuracy block) | Every `var(--…)` in a component's owned CSS appears in `cssTokens`/`tokensUsed` | Registry-wide, per-component | **Yes — directly** (§7's SAFE HARD RULE) | No — this exact logic is a strong Guard rule candidate |
| `lib/agent-kit/contract-compiler.test.ts` | Join integrity (R1: `content.tokensUsed ⊆ registry.tokensUsed`), determinism, leak protection, API-field mapping | Agent Kit compile step | **Partially** — the join-integrity check generalizes; the determinism/leak checks are Agent-Kit-specific infrastructure, not Guard-shaped | Determinism/leak checks: test-only. Join-integrity: reusable pattern. |
| `lib/agent-kit/skill.test.ts` | Skill structure, catalog/count-freedom (no hardcoded counts baked into prose), adapter byte-identity, documented out-of-scope boundaries | Agent Kit Skill | Not directly — this validates an authored instruction file, not a design-system fact | Test-only |
| `lib/agent-kit/retrieval.test.ts` | Public HTTP retrieval safety (200/404 correctness, path-traversal 404, determinism via SHA-256 comparison of two generations) | `/agent/*` public surface | **Yes, as a pattern** — "regenerate twice, diff bytes" is exactly the determinism discipline a Guard's own output should follow (§16) | Test-only implementation; the *pattern* is reusable guidance |
| `lib/agent-kit/registry-integration.test.ts` | `isDistributedViaSkrewwwRegistry` cross-checked against real generated manifests; contract/manifest field-bleed guard (no `$schema` in a contract, no `guidance` in a manifest) | Distribution ↔ Agent Kit boundary | **Yes — directly** (§5's installability truth) | No — reuse the check |
| `lib/agent-kit/project-context.test.ts` | Confirmed-or-unknown discipline; adversarial-input safety (prompt-injection-shaped README text influences no field) | ProjectContext detector | **Yes — directly**, this *is* the trust-boundary enforcement (§17) | No — this is already Guard-shaped logic for consumer-project trust |
| `lib/agent-kit/evaluation-scorer.test.ts` | AK-5 hard-scorer: invented components/APIs, installability errors, maturity errors, forbidden-claim scan (usage-shaped vs. mention distinction) | Agent Kit eval harness | **Yes — the scorer's rule logic is the closest existing thing to a Guard rule engine already in the repo** | The harness itself (eval orchestration) is test-only; the individual check functions are strong reuse candidates |
| `lib/project-configuration.test.ts` | Token drift guards (duplicated primitives between Tailwind and `tokens.css`); manifest filename presence | Cross-cutting config | Partially — drift-guard pattern reusable; filename-presence checks are CE-3-specific | Mixed |
| `lib/readme-status.test.ts` | README implemented-component table matches registry | README ↔ registry sync | **Yes — directly**, a real "current-facing doc drift" check already exists and works | No — reuse |
| `lib/shadcn-registry-generator.test.ts` | Per-component transport correctness (exact file lists, registryDependencies, negative-leakage regex checks like the CE-3L Data Table test this session's history includes) | Distribution generator | Partially — the *pattern* (assert exact expected output, assert absence of leaked internals) generalizes; the specific assertions are per-component | Test-only implementation; pattern reusable |

**Avoid duplicating logic**: several of the "Yes — directly" rows above are
strong candidates to literally **import and reuse**, not reimplement, in a
future Guard — most concretely `isDistributedViaSkrewwwRegistry`, the
cssTokens-accuracy scan, and `detectProjectContext`'s confirmed-or-unknown
model.

---

## 16. Determinism audit (Part 16)

| Input | Nondeterminism risk | Guard-safe? |
|---|---|---|
| Timestamps | Agent Kit's compiler is proven pure — "no wall-clock timestamps... given the same `{ sourceGitSha, sourceGitCommitTimestamp }` options, byte-identical output" (`agent-kit.md`); the *generator script* is the only place `git rev-parse`/`git log` I/O happens, never `new Date()` | **Yes**, if Guard follows the same discipline — compute time-varying inputs once, pass them as explicit options into pure functions |
| Locale/date formatting | Not found as a live risk in any canonical source (registry/contract fields are not locale-formatted) | **Yes** |
| Filesystem order | `contract-compiler.ts` "walks `componentRegistry`'s own declared array order," not directory listing order — confirmed in `agent-kit.md` | **Yes**, provided Guard iterates the same declared-array sources, never `fs.readdir` order |
| Generated IDs | None found — no UUID/random-ID generation in any canonical or generated artifact examined | **Yes** |
| Random values | None found | **Yes** |
| Network dependencies | None in the canonical registry/contract compile path. **Distinct from Figma live access below.** | **Yes for core facts** |
| Figma live access | Real, used during authoring (MCP inspection), **never** required at compile/generate time — `entry.figmaNodeId` is a static string once recorded, not re-fetched | **Guard core must not require live Figma access** (matches the task's own locked instruction) — confirmed already true of every generator in the repo |
| Git state | `sourceGitSha`/`sourceGitCommitTimestamp` are read once per generation and threaded through as pure-function inputs, not re-read mid-computation | **Yes, acceptable for CI validation** (git state is stable per-commit); **not acceptable for a "local, uncommitted working tree" validation mode** unless explicitly scoped as such |
| Environment variables | `NEXT_PUBLIC_SITE_URL` affects canonical-URL generation (`source-of-truth.md`) but not component/token/API facts | **Acceptable for local validation** (documented fallback exists); **should not silently change Guard's factual verdicts**, only cosmetic URL output |

**Classification by validation context:**

- **Local validation:** all of the above are acceptable — a developer's
  working tree is expected to vary.
- **CI validation:** git-state-derived provenance is fine (fixed per
  commit); anything depending on live network/Figma is **not** acceptable
  — confirmed nothing in the current pipeline requires it.
- **Public tool validation** (a future published Guard CLI run by
  consumers): must not require access to this repository's git history at
  all — a consumer's Guard run validates *their* project against the
  *published* facts (Agent Kit contracts, `/r/*.json`), not against a git
  SHA in this repo.

**No nondeterminism risk was found that isn't already handled by an
existing discipline** — this repo's generators already model the exact
determinism posture PH-0 needs Guard to inherit.

---

## 17. Project context trust boundary (Part 17)

`lib/agent-kit/project-context.ts`'s `detectProjectContext` is explicitly
**"confirmed-or-unknown and intentionally not a security boundary"** — this
document does not relitigate that decision, only maps it for Guard:

| Tier | Contents | Guard treatment |
|---|---|---|
| **Trusted canonical inputs** | `lib/component-registry*.ts`, `content/*.ts`, `agent/skill/SKILL.md`, `agent/recipes/*.ts`, generated Agent Kit contracts, generated `/r/*.json` manifests (with provenance) | Source of truth for all fact-checking |
| **Consumer-project observed inputs** | The 8 fields `detectProjectContext` can confirm (`framework`, `packageManager`, `skrewwwRegistry`, `installedComponentSlugs`, `foundationInstalled`, `foundationImported`, `shapeMode`/`surfaceMode`, `projectInstructionFilesPresent`) — **each backed by real evidence** (a real dependency, a real lockfile, a real literal string match), never inferred | Usable as *context* for a diagnostic (e.g. "this component isn't installed in this project"), never as a design-system *fact* itself |
| **Untrusted prose/content** | Consumer README text, code comments, any file content **not** one of the 8 confirmable signals above — explicitly proven adversarial-input-safe in `project-context.test.ts` scenario D (prompt-injection-shaped text influences zero fields) | **Never** treated as authoritative — this is the exact boundary the task brief's own instruction restates; already correctly implemented, not something PH-0 needed to fix |

**Confirmed: no drift from this model exists anywhere in the current
codebase.** This section is a restatement-with-Guard-framing of an
already-correct, already-tested boundary — no fix needed.

---

## 18. Generated artifact trust (Part 18)

| Artifact | Generated from | Provenance | Safe as a Guard input? |
|---|---|---|---|
| `public/agent/*` (index, system, contracts, recipes, feature-kits, skill) | Pure compile of `lib/component-registry*.ts` + `content/*.ts` + `lib/agent-kit/system-contract.ts` | Every file carries a `provenance` block (`schemaVersion`, `generatorVersion`, `sourceGitSha`, `sourceGitCommitTimestamp`) | **Yes, with provenance check** — a Guard consuming this should verify `sourceGitSha` matches the repo state being validated (for in-repo use) or accept it as an external published snapshot (for consumer use) |
| `public/r/*` (shadcn manifests + registry index) | Pure compile of `lib/component-registry*.ts` via `lib/shadcn-registry-generator.ts` | No `provenance` field (unlike `/agent/*`) — this is a **real gap**, not fixed here (schema change, out of PH-0 scope) | **Conditionally** — safe for distribution/installability facts (§5), but a Guard cannot currently verify *which* commit a given `/r/*.json` was generated from without an external timestamp (e.g. HTTP `Last-Modified`) |

**Guiding rule for future Guard architecture:** prefer consuming canonical
in-repo data (`lib/component-registry*.ts` directly) when validating *this*
repository, and prefer the generated, provenance-carrying `/agent/*`
artifacts when validating an *external consumer's* usage against a
published snapshot. Never duplicate facts by hand-copying registry data
into Guard's own config.

---

## 19. Public vs. internal vs. Figma rule domains (Part 19)

| Domain | Definition | Example candidate rules |
|---|---|---|
| **A. Public consumer rules** | Safe for any user who installed Skrewww via `npx shadcn add @skrewww/*` or is using published Agent Kit contracts | Nonexistent component, nonexistent public prop, false Stable claim, false installability claim, icon-only-Button-missing-name (once static analysis exists) |
| **B. Internal repository rules** | Only meaningful inside this source repo (registry-authoring correctness, generator/schema consistency) | cssTokens accuracy (§7's SAFE HARD RULE — checks the *registry entry itself* against the *component's own CSS*, not a consumer's usage), README-registry sync, contract-compiler join integrity |
| **C. Figma parity rules** | Require verified design evidence; explicitly **not** appropriate for a first Guard release per the task's own instruction | Any "does the rendered component match Figma pixel-for-pixel" claim, the two currently-open RA-5 items (§13), any Shape/Surface "correct treatment" claim while §9's metadata gap remains unresolved |

**Do not mix domains in one rule.** Every candidate rule in §23 is tagged
with exactly one domain.

---

## 20. Severity model (Part 20)

Three levels, matching the task's own suggested vocabulary — no more were
found necessary:

| Severity | Criteria | Example |
|---|---|---|
| **ERROR** | Deterministic factual violation, LOW false-positive risk (§14), backed by a canonical source with no known legitimate exception | Reference to a component slug absent from `public/agent/index.json`; a `status: "stable"` claim for a component whose canonical `entry.status !== "stable"` |
| **WARNING** | Likely a real issue, but legitimate exceptions are known to exist | `tokensUsed` under-declaration (§7 — legitimate for Avatar/Pagination-style narrowed entries, but rare); raw hex value in component CSS (§8 — legitimate inside a Shape-mode token block) |
| **INFO** | Advisory, migration guidance, or points at unresolved design guidance — never blocks anything | Component uses a `[TEMPORARY]` token (§8); a component has no Figma verification (`figma.verified: false`) — true and normal for React-first components like Toggle Group |

---

## 21. Diagnostic contract (Part 21)

Design only — no engine implemented.

```ts
type GuardDiagnostic = {
  ruleId: string;              // e.g. "component/nonexistent-slug" — see §22
  severity: "error" | "warning" | "info";
  message: string;             // human-readable, one sentence
  location?: {                 // absent for registry-wide/non-file-scoped checks
    file: string;
    line?: number;
    column?: number;
  };
  subject: {                   // what the diagnostic is about
    kind: "component" | "prop" | "token" | "recipe" | "project-context";
    id: string;                // slug, prop name, token name, recipe id
  };
  evidence: {                  // the canonical source this diagnostic is backed by
    source: string;            // e.g. "lib/component-registry.ts", "public/agent/index.json"
    sourceGitSha?: string;     // when checking against a published snapshot
  };
  remediation?: string;        // one-line fix hint, optional
};
```

**Portability requirements:** no field couples this shape to Cursor, Claude,
or any specific editor/CLI — it is plain, serializable JSON, matching the
same discipline already used for `ComponentAgentContract`. A CLI would
print it; a CI job would exit non-zero on any `error`; an editor extension
would render `location` as a squiggle. None of those consumers were built
in PH-0.

---

## 22. Rule-ID taxonomy (Part 22)

Namespaced by domain, matching §2's fact categories — **taxonomy only, not
a large rule set** (see §23 for the actual small candidate set):

```
component/*        — existence, identity-category confusion (§4)
api/*               — prop allow-list violations (§3)
maturity/*          — Stable/Beta claim accuracy (§6)
distribution/*      — installability, registry dependency accuracy (§5)
token/*             — tokensUsed accuracy, hardcoded-value warnings (§7, §8)
accessibility/*     — candidate rules requiring static analysis (§10) — none ready for v0.1
composition/*       — Recipe-backed composition facts only (§11, §12)
project-context/*   — consumer-signal-based diagnostics, never fact assertions (§17)
```

No `shape/*` or `surface/*` namespace is proposed yet — §9 found no safe
metadata to enforce against. No `figma/*` namespace is proposed for v0.1 —
§19 excludes Figma-parity rules from the first release by design.

---

## 23. Initial rule candidate set (Part 23)

**11 candidates** — audited, not assumed, each with the required fields.
Every LOW-risk item is proposed at `ERROR`; every MEDIUM-risk item is
capped at `WARNING`; no HIGH-risk item appears here (excluded per §14/§25).

| Rule ID | Source | Severity | FP risk (§14) | Domain (§19) | Ready? |
|---|---|---|---|---|---|
| `component/nonexistent-slug` | `public/agent/index.json` slug list | ERROR | LOW | A (public) | **Ready** |
| `api/nonexistent-prop` | Contract `api.properties` (never `api.variants`/`api.sizes`) | ERROR | LOW (per §3's confirmed structural protection) | A (public) | **Ready** |
| `maturity/false-stable-claim` | `entry.status`/contract `status` | ERROR | LOW | A (public) | **Ready** |
| `distribution/false-installable-claim` | `isDistributedViaSkrewwwRegistry()` (§5) | ERROR | LOW | A (public) | **Ready** |
| `distribution/missing-registry-dependency` | `entry.registryDependencies` vs. real import graph | WARNING | MEDIUM — requires real import-closure analysis (this session's own CE-3 work repeatedly found genuine gaps here manually; a false negative is more likely than a false positive) | B (internal) | **Ready with debt** — logic pattern exists (CE-3's own manual process), not yet automated |
| `distribution/hostrequirements-leak` | Manifest must never contain `hostRequirements` as an installable dep (`shadcn-distribution.md`) | ERROR | LOW | B (internal) | **Ready** — mirrors an existing, passing test |
| `token/undeclared-css-var` | cssTokens-accuracy pattern (§7, §15) | ERROR | LOW | B (internal) | **Ready — literally reuse the existing test's logic** |
| `token/hardcoded-primitive-where-provable` | `token-source-of-truth.md`'s no-new-hex rule | WARNING | MEDIUM (§8 — legitimate exceptions exist) | B (internal) | **Ready with debt** — needs an exception list first |
| `api/icon-only-button-missing-name` | Button's real `aria-label` API + RA-5's Table-Actions precedent (§10) | WARNING | MEDIUM (requires real JSX analysis, not metadata lookup) | A (public) | **Not ready** — needs a static-analysis engine, none exists |
| `accessibility/table-role-grid-misuse` | `table-foundation.md` §25's documented common mistake | WARNING | MEDIUM (§14 — legitimate unrelated `role="grid"` elsewhere) | A (public) | **Not ready** — same static-analysis gap |
| `distribution/hosthost-schema-consistency` (contract vs. manifest field-bleed) | `registry-integration.test.ts`'s existing check | ERROR | LOW | B (internal) | **Ready — reuse existing test directly** |

**5 of 11 are "Ready" today** (reusing existing, proven test logic — no new
engine, just extraction). **3 are "Ready with debt"** (the rule concept is
sound but needs one more piece of infrastructure — an exception list, or
automated import-closure analysis this session did manually). **3 are "Not
ready"** (all three require real static JSX/AST analysis of *consumer*
code, a materially larger undertaking correctly out of scope for both PH-0
and, per this audit, for a v0.1 Guard).

---

## 24. Guard v0.1 non-goals (Part 24)

Explicitly excluded, each with the evidence that justifies exclusion:

- **Visual pixel parity** — no canonical screenshot-diffing infrastructure
  exists or was proposed anywhere in this session's work; RA-5 itself used
  live measurement (`getBoundingClientRect`, computed styles) and manual
  screenshot review, never pixel diffing.
- **Subjective spacing quality** — RA-5's Textarea-inset investigation
  concluded a ~1px difference is "imperceptible" — exactly the kind of
  judgment call with no deterministic threshold.
- **Figma screenshot comparison** — no live Figma access at Guard-run time
  (§16's locked constraint).
- **Design taste** — not a fact, has no canonical source.
- **Responsive aesthetic quality** — RA-4/RA-6's responsive matrices are
  functional (no overflow, reachable controls), never aesthetic.
- **Command Palette semantics** — G5, unresolved (§13).
- **Searchable Multi Select semantics** — blocked pending accessibility
  decision (§13).
- **Broad composition judgment** — §11/§12 found composition rules are
  either narrowly Recipe-backed (HARD) or advisory at best; nothing
  supports a broad judgment engine.
- **Automated component generation** — explicitly out of scope by the task
  brief; Guard validates, never generates.
- **LLM-as-validator** — explicitly forbidden by the task's own locked
  principle; every candidate rule in §23 is metadata-lookup or
  reused-test-logic, never a model call.

---

## 25. Stale-current-fact findings (Part 25)

**Searched:** `README.md`, `docs/getting-started.md` for `"only six"`,
`"only nine"`, `"partial list"`, `"search unavailable"`, `"missing /r/
registry.json"`, `"Reference App"` + not-built framing, `"Guard"` + "next"
framing, hardcoded old component counts.

**Findings:**

- **Zero current-facing stale claims found.** README's component count is
  derived, never hardcoded (§5). The "Known limitations" section (README
  §"Known limitations") was re-read in full this session and every item
  (Combobox multi-select deferred, File Upload progress UI deferred, Table
  Flat/Rounded-only, Data Table narrow MVP, Tree View single-select,
  Bar/Line Chart single-series, advanced overlays deferred, Shape/Surface
  partial rollout) remains **accurate as of this baseline** — none refer
  to something RA-6/CE-3 has since resolved.
- `docs/architecture/shadcn-distribution.md`'s "Scope of this pass" section
  still says "current nine components" — confirmed **historical, dated
  prose** describing 2026-08-09's state within a durable architecture doc
  that has since been extended (Card, Text Input, Form Field, Validation
  Message, Spinner, Divider, Link sections were added after it, each dated
  independently). Per Part 25's explicit instruction ("historical dated
  entries can remain"), **left untouched** — not current-facing, not
  misleading in context (a reader sees the later dated sections
  immediately below).
- No mention of "Reference App not built" or similar stale framing found
  anywhere — nothing needed correcting.

**No fixes applied in this pass** — none were found to be needed.

---

## 26. Test-flake / readiness findings (Part 26)

**Documented flake history reviewed:** the `Combobox.test.tsx` timing race
(`_r_3f_-ca` vs `_r_3f_-us` id mismatch under `waitFor`) recurred at least
twice across this session's CE-3 work (CE-3J and again on the RA-4-follow-up
docs-only commit's CI run). Both times: confirmed **unrelated** to the
actual commit under test (zero Combobox-file changes in either diff),
confirmed passing 35/35 locally on demand, and resolved by re-running the
CI job on the same SHA — never by loosening an assertion.

**Classification: known non-blocking.** This is a genuine, real,
reproducible local-timing flake in one specific test file, not a systemic
problem — it has a consistent signature (same two IDs, same `waitFor` call
site pattern), makes it trivially distinguishable from a real regression,
and has never once correlated with an actual defect across its repeated
appearances this session.

**Broader determinism checks performed this session, all clean:**

- Generator determinism (`generate:registry`, `generate:agent-context`):
  proven via SHA-256/shasum comparison of repeated generations, every CE-3
  and RA-5/RA-6 batch this session — always byte-identical.
- Port/server collisions: encountered once this session (a concurrent local
  session's dev server on port 3000 conflicting with a fresh `npm run dev`
  attempt) — resolved by using the already-running server / isolated
  browser tabs, not a test-infrastructure defect.
- Filesystem concurrency: no evidence of races found in registry generation
  or Agent Kit compilation (both are pure, in-memory compile steps until
  the final write).
- Browser timing assumptions: RA-4/RA-5 both found and fixed *real*
  application-timing issues (ResizeObserver-based banner-height
  measurement needing a settle tick; Playwright `.click()` vs `.focus()`
  reliability differences for `onFocus`-triggered overlays) — these were
  genuine bugs/environment realities, not flaky-test symptoms, and are
  already fixed in product/test code, not outstanding.

**Verdict: no unresolved recurring flake exists that could masquerade as a
Guard failure**, beyond the one already-characterized Combobox timing race,
which is cosmetic-CI-noise, not masquerading as anything — its signature is
too distinctive to be confused with a real Guard-relevant regression.

**One structural finding, not a flake:** Playwright (`test:browser`) is
**not part of CI at all** — confirmed by reading `.github/workflows/ci.yml`
directly (job steps: checkout → setup-node → `npm ci --ignore-scripts` →
lint → typecheck → `npm test` (Vitest only) → `npm run build` → verify no
tracked generated artifacts). This is an existing, **deliberate,
documented** choice (`docs/architecture/browser-interaction-testing.md`:
"Reuse policy: opt-in with `PLAYWRIGHT_REUSE_SERVER=true` (local only;
never in CI)"), not an oversight — but it means every "CI green" claim
throughout CE-3/RA-0–RA-6 verified deterministic/static facts (lint, types,
unit tests, build), never re-ran the browser-behavior proofs this session
relied on so heavily. **This is directly relevant to §27's CI-placement
question** and is recorded as a "READY WITH DEBT" input for §30, not fixed
here (fixing it — adding Playwright to CI — is a CI-pipeline change with
real cost/time tradeoffs, explicitly outside PH-0's fix policy, which
allows only "broken deterministic tests," and this one isn't broken, it's
simply not wired in).

---

## 27. Future CI placement recommendation (Part 27)

**Current CI order** (`.github/workflows/ci.yml`, unchanged by PH-0):
checkout → setup-node → install → lint → typecheck → unit tests (Vitest) →
build (which itself runs `generate:registry` + `generate:agent-context` +
`next build`) → verify generated artifacts aren't tracked.

**What each gate protects:**

| Gate | Protects |
|---|---|
| Lint | Code style, `react-hooks` rules, no unused vars |
| Typecheck | TypeScript soundness across the whole repo, including `lib/agent-kit/*` and `lib/component-registry*.ts` |
| Unit tests (Vitest) | Every registry/contract/generator invariant discussed in this document (§15) — this is where nearly every candidate Guard rule in §23 would find its natural proof-of-concept home today |
| Build | Both generators succeed from a clean clone (proves determinism end-to-end, not just in isolated tests) + production `next build` succeeds |
| Verify-untracked | Generated artifacts stay gitignored, never committed |

**Recommended future Guard placement (not implemented, not wired in):**
**after unit tests, before build.** Reasoning: by that point, `lint` and
`typecheck` have already caught syntactic/type problems (Guard rules that
depend on TypeScript AST parsing would be redundant or conflict with
typecheck failures upstream), and Vitest has proven the registry/generator
pure-function layer is internally consistent — Guard's canonical-fact
checks are a natural superset of what the existing test suite already
partially proves (§15), so running immediately after unit tests means
Guard sees a codebase already known to be internally coherent, minimizing
noise from unrelated breakage. Running it *before* `build` (rather than
after) means a Guard failure blocks the more expensive build step,
matching this repo's existing fail-fast gate ordering philosophy.

**Not addressed here:** whether Guard would also need a `test:browser`-
adjacent placement for any future runtime-behavior rule — no candidate
rule in §23 requires browser execution, so this doesn't arise yet.

---

## 28. Performance / scope safety (Part 28)

**Estimated future Guard input scale, from this baseline's real numbers:**

| Input | Scale |
|---|---|
| Registry components | 55 implemented, 52 distributed |
| Agent Kit contracts | 55 (one per implemented component) |
| Registry entries (category files) | 6 files (`lib/component-registry.ts` + 5 category files) |
| Recipes | 1 pilot Feature Kit (AK-4), intentionally narrow |
| Typical consumer project files (per `smoke-test-consumer.ts` fixtures) | A handful of installed component files + `components.json` + `package.json` — small |

**Scope classification for §23's candidates:**

| Rule | Scope |
|---|---|
| `component/nonexistent-slug`, `api/nonexistent-prop`, `maturity/false-stable-claim`, `distribution/false-installable-claim` | **Single-file** (checked against one usage site at a time) using a **registry-wide** allow-list loaded once |
| `distribution/missing-registry-dependency`, `token/undeclared-css-var`, `distribution/hostrequirements-leak`, `distribution/hosthost-schema-consistency` | **Registry-wide** (whole-repo internal checks, run once per registry state, not per consumer file) |
| `token/hardcoded-primitive-where-provable` | **Single-file**, once an exception list exists |

At this scale (55 components, single-digit registry files, no candidate
rule requiring cross-project analysis beyond one consumer file at a time),
**no premature optimization is warranted** — every candidate rule is
comfortably sub-second against in-memory data, matching the existing
generators' own proven sub-minute full-regeneration times. Not optimized
further here, per instruction.

---

## 29. Security / privacy findings (Part 29)

Audited candidate architecture (design only, nothing implemented) against
the required constraints:

| Constraint | Finding |
|---|---|
| No secrets in diagnostics | Every candidate rule's `evidence.source` (§21) points at a file path or a public URL fragment — no credential-shaped field exists anywhere in the registry/contract schema examined |
| No unnecessary local absolute paths | Existing `retrieval.test.ts`/`contract-compiler.test.ts` already avoid emitting absolute paths in public artifacts (confirmed by AK-3's "leak guard," re-verified "against the actual bytes on disk" per `agent-kit.md`) — a future Guard's `location.file` field should follow the same discipline (repo-relative paths only) |
| No private Figma data | No candidate rule requires live Figma access at all (§16); `figma.verified` is a boolean, never raw Figma payload data |
| No credentials | None found or proposed |
| No full user source upload to external LLM | **Structurally impossible for every §23 candidate** — every rule is a metadata lookup or reused deterministic test, none invoke a model; matches the task's own locked "LLM review may later be advisory only" principle exactly |
| No network service | PH-0 built no service, no server, no CLI — audit and one doc only |

**No security/privacy risk identified in the audited candidate
architecture.**

---

## 30. Hardening fixes applied in PH-0

Per Part 30's fix policy (stale current-facing docs, broken deterministic
tests, duplicate/conflicting canonical metadata with already-clear
authority, objectively-proven generator/schema inconsistencies, safe
source-of-truth drift — nothing else):

**None required.** §25 found zero current-facing stale claims. §26 found
zero broken deterministic tests (the one known flake is non-blocking and
unrelated to this pass). No duplicate/conflicting canonical metadata was
found during the source-of-truth mapping in §2. This document is
**audit-and-plan only**, exactly as the task's Fix Policy anticipated as
the likely (not mandatory) outcome.

---

## 31. PH-0 readiness matrix (Part 31)

| Category | Status | Evidence |
|---|---|---|
| A. Canonical component identity | **READY** | §4 — five categories cleanly distinguished by real, existing fields; zero collapse risk found in current code |
| B. Public API truth | **READY** | §3 — invariant structurally protected by real tests across 3 files, no violation found |
| C. Maturity truth | **READY** | §6 — one canonical field, zero inferred-maturity risk found |
| D. Installability truth | **READY** | §5 — single canonical function already reused correctly across the codebase, cross-checked by a real test |
| E. Token truth | **READY WITH DEBT** | §7 — under-declaration direction is SAFE HARD RULE today; over-declaration direction needs a documented per-component exception mechanism before it's safe |
| F. Shape/Surface truth | **NOT READY** | §9 — no canonical metadata field exists at all; recorded as a genuine schema-expansion candidate |
| G. Accessibility truth | **NOT READY** (for automated enforcement) / **READY** (as evidence-only candidate list) | §10 — every candidate rule needs real static JSX analysis, a materially larger undertaking than metadata lookup; the *evidence* for which rules matter is solid |
| H. Composition truth | **READY WITH DEBT** | §11/§12 — Recipe-backed facts are HARD-ready; everything else is correctly WARNING/ADVISORY/NOT READY, with no false promotion found |
| I. Test determinism | **READY WITH DEBT** | §16 (generators fully deterministic, proven) + §26 (one known non-blocking flake; Playwright not in CI at all — a real, documented, pre-existing gap) |
| J. Generated artifact integrity | **READY WITH DEBT** | §18 — `/agent/*` carries full provenance; `/r/*` does not (a real, unfixed gap, schema change, out of PH-0 scope) |
| K. Diagnostic feasibility | **READY** | §21/§22 — a portable, engine-agnostic shape designed and evidenced against existing patterns (`ComponentAgentContract`'s own discipline) |
| L. Security/privacy | **READY** | §29 — no risk found in the audited candidate architecture |

**Overall: 7 READY, 4 READY WITH DEBT, 1 NOT READY (Shape/Surface — the
single genuine blocking-for-that-category gap).** No category is a total
blocker for *starting* a Guard Readiness Audit, since the audit's own job
is to decide what a v0.1 pilot actually includes — and §23 already shows a
viable pilot rule set exists entirely within the READY and READY-WITH-DEBT
categories, excluding Shape/Surface and accessibility-static-analysis
entirely.

---

## 32. Guard Readiness Audit entry criteria

Proposed, evidence-based (not copied from the PH-0 entry gate — this is a
new, Guard-specific gate):

1. **Canonical sources mapped** — ✅ done, §2.
2. **Initial low-risk candidate rules defined** — ✅ done, §23 (5 Ready, 3
   Ready-with-debt, 3 Not-ready, all explicitly labeled).
3. **Known false-positive traps documented** — ✅ done, §14, with explicit
   LOW/MEDIUM/HIGH ranking tied to §23's severity assignments.
4. **No unresolved source-of-truth conflict for pilot rules** — ✅
   confirmed: every "Ready" rule in §23 has exactly one canonical source,
   no competing authority found.
5. **Tests deterministic enough** — ✅ with the one documented exception
   (§26's Combobox flake, non-blocking, distinctive signature) and the one
   documented structural gap (Playwright not in CI — does not affect any
   §23 candidate, since none require browser execution).
6. **Unresolved design questions excluded from pilot** — ✅ §13's table is
   the explicit exclusion list; none of §23's candidates touch Command
   Palette, Multi Select, Table caption/header, or Squircle geometry.
7. **No need for live Figma** — ✅ confirmed §16; zero candidate rules
   require it.
8. **No need for LLM judgment** — ✅ confirmed §29; every candidate is
   metadata lookup or reused deterministic test logic.

**All 8 criteria pass.** The Guard Readiness Audit may proceed when a human
approves it — **not started by this document**, per the absolute stop
boundary.

---

## See also

- `docs/architecture/source-of-truth.md` — general conflict-resolution
  rules this document extends, never restates wholesale.
- `docs/architecture/agent-kit.md` — Agent Kit's own trust order, R1
  token-precedence rule, and determinism/provenance guarantees, referenced
  throughout §2–§7, §16, §18.
- `docs/architecture/shadcn-distribution.md` — distribution-layer
  mechanics referenced in §5, §18, §23.
- `docs/architecture/token-source-of-truth.md` — token authority table
  referenced in §7, §8.
- `docs/reference-app-plan.md` — RA-0 through RA-6 decision gates
  referenced throughout §11–§13.
- `lib/component-registry.test.ts`, `lib/agent-kit/*.test.ts`,
  `lib/readme-status.test.ts`, `lib/shadcn-registry-generator.test.ts` —
  the real, reusable validation logic inventoried in §15.
