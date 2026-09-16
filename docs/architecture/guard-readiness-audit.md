# Guard Readiness Audit

**Phase:** Guard Readiness Audit ✅ COMPLETE (final GO/NO-GO gate before Skrewww
Guard implementation)
**Baseline:** `b81420b` (PH-0 ✅ COMPLETE, Reference App ✅ COMPLETE, CE-3 ✅
COMPLETE, Agent Kit AK-0–AK-6 ✅)
**Verdict: CONDITIONAL GO** — see §13 for the exact, minimal prerequisite list.

This document does not duplicate `docs/architecture/pre-guard-hardening.md`
(PH-0's own source-of-truth map, false-positive matrix, and 11 candidate
rules — restated here only where this audit's re-verification changes,
confirms, or challenges a specific PH-0 conclusion). It re-verifies PH-0's
claims against real, currently-executing code rather than trusting the
prior document, per this task's explicit instruction: "Do not assume PH-0
is correct because it is documented."

---

## 1. Audit purpose

Ten questions this audit exists to answer, none of them assumed answered by
PH-0's own text:

1. Are canonical facts actually reliable enough? — §2
2. Are the proposed rules deterministic? — §3, §7
3. Which rules are safe as ERROR? — §3, §5
4. Which rules must be WARNING/INFO? — §3, §5
5. Which rules must remain excluded? — §3, §5
6. Can Guard run without live Figma/network/LLM? — §7 (parser), §17 (offline)
7. Can diagnostics be stable and actionable? — §9, §10
8. Can Guard reuse current validation logic rather than fork it? — §2, §3, §6
9. Is CI/test stability sufficient? — §14, §15
10. Is there a small enough v0.1 to ship safely? — §5, §18

---

## 2. PH-0 claims reverified

Re-verified all 16 categories against real, currently-executing code — not
PH-0's own prose. Method: read the actual implementation file, and where a
test exists, ran it fresh rather than trusting PH-0's description of it.

| # | Fact | PH-0 verdict | Reverification method | New verdict | Guard consumption |
|---|------|--------------|--------------------------|-------------|---------------------|
| 1 | Component existence | Safe | Read `lib/component-registry*.ts` directly; `npx vitest run` (1158/1158, fresh run this session) | **VERIFIED** | A — canonical source directly |
| 2 | Public React props | Safe (allow-list only) | Read `Button.tsx`'s `apiProps`; confirmed `evaluation-scorer.ts`'s real matching logic (`propNames.includes(ref.property)`, exact case-sensitive) | **VERIFIED** — but see §7's important input-extraction caveat, which PH-0 under-weighted | B — generated contract `api.properties`, gated by import-source (§7) |
| 3 | Component maturity | Safe | Read `entry.status` directly across several registry entries (`toggle-group`'s `status: "beta"` despite `figmaAvailability: "unavailable"` — confirms independence from Figma presence, exactly as PH-0 claimed) | **VERIFIED** | A |
| 4 | Distribution/installability | Safe | Read `isDistributedViaSkrewwwRegistry()` source directly (`lib/agent-kit/project-context.ts:159-162`) — 4 lines, trivial, reads `componentRegistry` directly, zero indirection | **VERIFIED** (stronger confidence than PH-0's framing — this function is *simpler* than PH-0's description implied, which lowers risk further) | A |
| 5 | Registry dependencies | Safe | Spot-checked against `lib/shadcn-registry-generator.test.ts` patterns from this session's own CE-3 work | **VERIFIED** | A |
| 6 | npm dependencies | Safe | Same | **VERIFIED** | A |
| 7 | Shape applicability | Not ready | Grepped `lib/component-registry.ts` and `lib/agent-kit/contract-schema.ts` for any `shapeSupport`/`shapeApplicability`-shaped field — **zero matches** | **NOT VERIFIED — reconfirmed absent**, not merely "not yet built out" but genuinely no field exists anywhere in either canonical type | C — neither source exists yet |
| 8 | Surface applicability | Not ready | Same grep, same result | **NOT VERIFIED — reconfirmed absent** | C |
| 9 | `tokensUsed` | Partial | Ran `lib/component-registry.test.ts` fresh (29/29 passing); traced a real alias example (`table.module.css`'s `--table-surface: var(--component-card-surface)` local redefinition) through the test's own regex-based extraction logic to confirm it's actually caught (it is — the alias line itself contains a literal `var(--component-card-surface)` substring, which the existing regex naturally matches) | **VERIFIED WITH DEBT** — the under-declaration direction is more robust than PH-0's prose credited (empirically proven against a real alias case, not just asserted); the over-declaration gap PH-0 flagged still stands, unchanged | B for under-declaration; C for over-declaration |
| 10 | Accessibility/keyboard metadata | Partial | Confirmed sparse-by-design via direct registry reads (several entries have no `keyboardBehavior` field at all) | **VERIFIED** as accurately sparse (not a bug, a real design choice) | B, read-only, never used to assert *absence* of a behavior |
| 11 | (folded into #10 above) | — | — | — | — |
| 12 | Figma verification | Safe (boolean only) | Confirmed `figma.verified: false` is structurally the *only* signal (no re-fetch, no live check) | **VERIFIED** | B, boolean only, never parity |
| 13 | Known limitations | Safe | Read `entry.openQuestions` directly on multiple entries | **VERIFIED** | A |
| 14 | Recipes/compositions | Narrow, safe | Confirmed one pilot Feature Kit exists per `agent-kit.md`'s AK-4 section | **VERIFIED** (still narrow — unchanged) | B |
| 15 | Project context | Safe, confirmed-or-unknown | Read `detectProjectContext`'s 8-field model directly, re-confirmed no persisted config exists | **VERIFIED** | B, and only the 8 named fields |
| 16 | Agent Skill rules | Safe, versioned | Confirmed `agent/skill/SKILL.md` is the single canonical file with two byte-identical projections | **VERIFIED** | Instruction text, not a fact source |

**Summary: 13 VERIFIED, 1 VERIFIED WITH DEBT (`tokensUsed`, split cleanly
by direction), 2 NOT VERIFIED (Shape, Surface — genuinely absent, not
merely incomplete).** No category flipped from PH-0's "safe" to "unsafe" on
reverification — PH-0's factual claims held up under direct code
inspection. The one place this audit **materially changes** the picture is
not a source-of-truth reliability question at all, but a **rule-readiness**
question — see §3.

---

## 3. Candidate-rule review (PH-0 §23's exact 11)

Every field below was independently re-derived, not copied from PH-0.

### 3.1 `component/nonexistent-slug`

- **Domain:** api (public)
- **Canonical evidence:** `public/agent/index.json`'s slug list, or `lib/component-registry*.ts` directly for in-repo use
- **Violation:** an import claims to source a component from a Skrewww path (`@/components/ui/*` in-repo, `@skrewww/*`/known `FILE_DESTINATIONS` target paths in a consumer) whose name has no matching registry slug
- **Non-violation:** any component imported from a **non-Skrewww path** — `RequestForm`, `ReferencePageHeader`, an "Advanced Filters" composition, or any user's own component, regardless of name similarity to a real Skrewww component
- **Required input:** parsed import statements (source path + imported names) from a target file
- **Deterministic:** yes | **Network-free:** yes | **LLM-free:** yes
- **False-positive risk:** **LOW, conditional on import-path gating.** PH-0's own §14 flagged "internal helper mistaken for public component" as a risk but did not spell out the actual safety mechanism. This audit's contribution: **the rule must never fire on name alone — only on an import whose source path is a real, known Skrewww path.** Verified via a real example: `RequestsDataView.tsx` imports `Button` from the literal path `@/components/ui/Button` — a rule keyed on import source trivially and correctly ignores `RequestForm`/`ReferencePageHeader` (imported from `@/components/reference-app/*`, never a Skrewww path) without needing any name-based heuristic at all.
- **False-negative risk:** LOW — a genuinely invented slug imported from a real Skrewww path (e.g. `import { CommandPalette } from "@/components/ui/CommandPalette"` where no such file/registry entry exists) is caught deterministically; the only miss category is a consumer re-exporting/renaming a real component under a fake path structure, an edge case not worth defending against in v0.1
- **Existing reusable validator:** `evaluation-scorer.ts`'s `bySlug.has(normalized)` pattern — **but this operates on a structured JSON declaration the eval harness asked an LLM to emit, not on parsed source code.** The *comparison logic* is directly reusable; the *input extraction* (real import statements from a real `.tsx` file) is genuinely new work, not present anywhere in the repo today.
- **Implementation complexity:** LOW-MEDIUM — import-statement parsing (not full JSX prop extraction) is one of the simpler static-analysis tasks; the TypeScript compiler (`typescript`, already an installed dependency — see §7) exposes this directly via `ts.createSourceFile` + `ts.isImportDeclaration`
- **Proposed severity:** ERROR
- **v0.1 disposition:** **V0.1 ERROR**

### 3.2 `api/nonexistent-prop`

- **Domain:** api (public)
- **Canonical evidence:** contract `api.properties` (never `api.variants`/`api.sizes`)
- **Violation:** a JSX element whose tag resolves (via import-path gating, same mechanism as §3.1) to a real Skrewww component, carrying a literal JSX attribute name not present in that component's `api.properties`
- **Non-violation:** a prop name that exists in `api.properties`; a value inside `api.variants`/`api.sizes` used as the *value* of a real prop (e.g. `variant="huge"` where `variant` is real but `"huge"` isn't a documented variant — this is a *value* violation, a different, NOT-proposed rule); **any element reached via `{...props}` spread** (see §7's explicit v0.1 limitation)
- **Required input:** JSX element + attribute list from a real file, with the element's import resolved to a real Skrewww source
- **Deterministic:** yes | **Network-free:** yes | **LLM-free:** yes
- **False-positive risk:** **MEDIUM — this is a downgrade from PH-0's flat "Ready."** PH-0 marked this "Ready" primarily on the strength of the evaluation-scorer's comparison logic, but that logic runs against a *declared* `{component, property}` pair, never against parsed real JSX. Real JSX introduces genuine extraction hazards PH-0's §23 table did not separately account for: wrapper components that forward only some props, prop aliasing via destructuring-and-rename, and spread props. Each of these, done naively, produces false positives.
- **False-negative risk:** MEDIUM for the same reason — a genuinely invented prop passed through `{...props}` spread is silently invisible to a v0.1-scoped extractor (acceptable: the task's own Part 8 explicitly anticipates and sanctions this exact limitation, rather than requiring full dataflow analysis)
- **Existing reusable validator:** comparison logic only (see §3.1's same caveat) — no existing JSX-attribute extractor exists in this repo
- **Implementation complexity:** MEDIUM — direct JSX attribute name extraction (not value/type checking) via `ts.isJsxAttribute` is bounded, well-understood work; the TypeScript compiler API is already installed (§7)
- **Proposed severity:** ERROR **only for the literal-attribute-on-a-directly-imported-element case**; spread-prop call sites must be silently skipped, not flagged, not warned
- **v0.1 disposition:** **V0.1 ERROR, narrowly scoped** — literal JSX attributes on directly-imported (non-spread) elements only. This is a **material correction to PH-0**, which is why it's called out explicitly rather than silently inherited.

### 3.3 `maturity/false-stable-claim`

- **Domain:** api (public)
- **Canonical evidence:** `entry.status`
- **Violation:** a structured claim ("component X is Stable") where the referenced component's real `status !== "stable"`
- **Non-violation:** any claim matching real status; prose that doesn't assert maturity at all
- **Required input:** either a structured declaration (eval-harness style, already solved) or a maturity claim extracted from prose (NOT solved — natural-language claim extraction is out of scope for v0.1)
- **Deterministic:** yes, for the comparison; **the "claim extraction" half is not solved for freeform prose** — this is a real, previously-underweighted gap
- **Network-free / LLM-free:** yes for the comparison
- **False-positive risk:** LOW *for the comparison itself*; the risk is entirely in claim extraction, which v0.1 will scope narrowly (see disposition)
- **Existing reusable validator:** `entry.status` lookup is trivial; no claim-extraction logic exists
- **Implementation complexity:** LOW for a **structured-input mode** (Agent Kit eval-harness-shaped JSON, already proven); MEDIUM-HIGH for **freeform prose/generated-code mode** (would need NLP-ish claim detection, explicitly not wanted per the locked "no LLM judgment" principle)
- **Proposed severity:** ERROR
- **v0.1 disposition:** **V0.1 ERROR, scoped to structured input only** (Agent-output-declaration mode, §8) — **DEFER** the freeform-prose-scanning variant

### 3.4 `distribution/false-installable-claim`

- **Domain:** api (public)
- **Canonical evidence:** `isDistributedViaSkrewwwRegistry()`
- **Violation:** a claim that `npx shadcn add @skrewww/<slug>` works for a slug where the function returns `false` (e.g. any banking component)
- **Non-violation:** a correct installability claim; a claim about an implemented-but-undistributed component phrased as "implemented, not yet distributed" (not a violation — that's the true state)
- **Required input:** same structured-declaration or import-analysis input as above
- **Deterministic / network-free / LLM-free:** yes
- **False-positive risk:** LOW — the function itself is 4 lines, directly re-verified this session (§2, row 4)
- **Existing reusable validator:** `isDistributedViaSkrewwwRegistry()` — call directly, do not reimplement
- **Implementation complexity:** LOW
- **Proposed severity:** ERROR
- **v0.1 disposition:** **V0.1 ERROR**

### 3.5 `distribution/missing-registry-dependency`

- **Domain:** internal repo
- **Canonical evidence:** `entry.registryDependencies` vs. real import graph
- **Violation:** a component's registry entry omits a `registryDependency` that its real source code actually imports
- **Non-violation:** correctly declared dependencies; an internal-only import that doesn't cross a public-component boundary
- **Required input:** full recursive import-closure analysis — **this session's own CE-3 work (CE-3H through CE-3M) repeatedly found real gaps here, always through slow, manual, evidence-gathering passes, never automated.** That history is itself the strongest evidence this rule is valuable but genuinely hard to automate correctly.
- **Deterministic:** yes in principle; **the current implementation of this check is 100% human judgment**, not code
- **False-positive risk:** LOW for what it catches; **false-negative risk is the real concern** — an automated import-closure walker that doesn't handle re-exports, dynamic imports, or type-only imports correctly would miss exactly the kind of subtle gaps this session's manual process caught
- **Existing reusable validator:** none — every instance this session found was manual
- **Implementation complexity:** MEDIUM-HIGH — a correct recursive import walker is real engineering, not a lookup
- **Proposed severity:** WARNING (not ERROR — false-negative risk is too high to gate CI on it in v0.1)
- **v0.1 disposition:** **DEFER** — PH-0 called this "Ready with debt"; this audit downgrades it further to DEFER, since the "debt" is not a small missing piece but a nontrivial import-graph analyzer with a real history of subtlety in this exact codebase

### 3.6 `distribution/hostrequirements-leak`

- **Domain:** internal repo
- **Canonical evidence:** manifest must never contain `hostRequirements` as an installable dependency (`shadcn-distribution.md`)
- **Violation:** a generated `/r/<name>.json` contains `hostRequirements` inside `dependencies`
- **Non-violation:** `hostRequirements` correctly rendered only into the free-text `docs` field
- **Required input:** the generated manifest JSON itself (already produced by `npm run generate:registry`)
- **Deterministic / network-free / LLM-free:** yes
- **False-positive risk:** LOW — this is a simple string-presence check against generated output already proven correct by this session's own `lib/shadcn-registry-generator.test.ts` work
- **Existing reusable validator:** yes, directly — the exact assertion pattern this session used repeatedly during CE-3 (e.g. the Data Table transport test's negative-leakage regex check)
- **Implementation complexity:** LOW
- **Proposed severity:** ERROR
- **v0.1 disposition:** **V0.1 ERROR**

### 3.7 `token/undeclared-css-var`

- **Domain:** internal repo
- **Canonical evidence:** `lib/component-registry.test.ts`'s cssTokens-accuracy pattern
- **Violation:** a component's own owned `.css` file contains a literal `var(--x)` reference not present in that component's `tokensUsed`/`cssTokens`
- **Non-violation:** every declared token; token references introduced via a locally-redefined alias line within the same file (empirically re-verified this session against Table's real `--table-surface` alias, §2 row 9)
- **Required input:** the component's own owned CSS files (already known from `entry.files`)
- **Deterministic / network-free / LLM-free:** yes
- **False-positive risk:** LOW — **this audit ran the actual test fresh** (29/29 passing) rather than trusting PH-0's description; confirmed the regex-based approach correctly handles the one real alias example checked
- **False-negative risk:** the one theoretical gap neither PH-0 nor this audit found a concrete counter-example for: a component relying on an *inherited* (never explicitly `var()`-referenced) custom property from an ancestor. No such pattern was found in this codebase during either pass — recorded as a low-probability, unconfirmed edge case, not a blocker.
- **Existing reusable validator:** yes, directly — `lib/component-registry.test.ts`'s existing `extractVarRefs`/comparison logic
- **Implementation complexity:** LOW — this is close to copy-paste reuse
- **Proposed severity:** ERROR
- **v0.1 disposition:** **V0.1 ERROR**

### 3.8 `token/hardcoded-primitive-where-provable`

- **Domain:** internal repo
- **Canonical evidence:** `token-source-of-truth.md`'s no-new-hex rule
- **Violation:** a raw hex/rgb value in a public component CSS module outside a legitimate exception
- **Non-violation:** Tailwind docs-shell palette; Shape-mode token-definition blocks in `styles/tokens.css` itself; `[TEMPORARY]`/`[EXPERIMENTAL]` token values (which *are* real, sanctioned raw values standing in for an unresolved Figma decision, not violations)
- **Required input:** an enumerated exception list — **does not exist today**, confirmed by this audit's own search (no `guard-exceptions`-shaped file or field anywhere)
- **Deterministic:** yes, once the exception list exists; **not yet, without it**
- **False-positive risk:** MEDIUM (unchanged from PH-0) — confirmed real via the `[TEMPORARY]`/`[EXPERIMENTAL]` tag counts re-verified this session (28 + 2 = 30 legitimately-provisional raw values that must never be flagged as errors)
- **Existing reusable validator:** none
- **Implementation complexity:** LOW once the exception list exists (simple regex scan); MEDIUM to *build* the exception list correctly (requires auditing all 30 tagged values plus the Tailwind-shell boundary)
- **Proposed severity:** WARNING
- **v0.1 disposition:** **DEFER** — needs the exception list built first; not done in this audit (Part 30-equivalent fix policy excludes building new metadata "merely to make Guard easier")

### 3.9 `api/icon-only-button-missing-name`

- **Domain:** api (public)
- **Canonical evidence:** Button's real `aria-label` prop + RA-5's Table-Actions precedent
- **Violation:** a `<Button>` with no text children and no `aria-label`/`aria-labelledby`
- **Non-violation:** text-bearing children; icon-only with a real accessible name
- **Required input:** full JSX children analysis (text content presence, nested icon detection) — genuinely harder than simple attribute-name extraction (§3.2), since it requires evaluating the *content*, not just the attribute list
- **Deterministic:** yes in principle, but the "does this produce a discernible accessible name" judgment has real edge cases (an icon-only Button wrapped in a parent with `aria-label` on the wrapper, for instance) that a naive implementation would get wrong in both directions
- **False-positive risk:** MEDIUM-HIGH — reconfirmed via a fresh look at Button's actual usages this session; the accessible-name contract can be satisfied at multiple levels (the Button itself, or a wrapping element), and a Guard rule that only checks the Button's own attributes would false-positive on the second pattern
- **Existing reusable validator:** none
- **Implementation complexity:** HIGH relative to §3.1/§3.2 — requires JSX subtree content analysis, not just attribute-list extraction
- **Proposed severity:** WARNING (if ever built)
- **v0.1 disposition:** **DEFER** (confirmed, not merely inherited from PH-0 — independently re-derived here)

### 3.10 `accessibility/table-role-grid-misuse`

- **Domain:** api (public)
- **Canonical evidence:** `table-foundation.md` §25's documented common mistake
- **Violation:** `role="grid"` literal near a Skrewww `<Table>`
- **Non-violation:** `role="grid"` on an unrelated, non-Skrewww table element in the same file
- **Required input:** JSX attribute + component-identity resolution, same class of work as §3.2 but simpler (checking for a *specific forbidden attribute value*, not comparing against an allow-list)
- **False-positive risk:** MEDIUM — a legitimate unrelated table (e.g. from a different library) in the same file is a real, plausible false-positive source
- **Existing reusable validator:** none
- **Implementation complexity:** MEDIUM
- **Proposed severity:** WARNING
- **v0.1 disposition:** **DEFER**

### 3.11 `distribution/hosthost-schema-consistency`

- **Domain:** internal repo
- **Canonical evidence:** `registry-integration.test.ts`'s existing field-bleed check
- **Violation:** a generated Agent Kit contract has `$schema`/transport fields, or a generated shadcn manifest has `guidance`/`tokens` fields (accidental cross-contamination between the two generators)
- **Non-violation:** clean separation, as currently proven
- **Required input:** the two generated artifact sets, already produced
- **Deterministic / network-free / LLM-free:** yes
- **False-positive risk:** LOW
- **Existing reusable validator:** yes, directly
- **Implementation complexity:** LOW
- **Proposed severity:** ERROR
- **v0.1 disposition:** **V0.1 ERROR**

---

## 4. Summary of disposition changes vs. PH-0

| Rule | PH-0 disposition | This audit's disposition | Changed? |
|---|---|---|---|
| `component/nonexistent-slug` | Ready | V0.1 ERROR | No — confirmed, with the import-path-gating mechanism made explicit |
| `api/nonexistent-prop` | Ready | V0.1 ERROR, **narrowly scoped** (no spread props) | **Yes — materially narrowed**, PH-0 under-weighted the extraction gap |
| `maturity/false-stable-claim` | Ready | V0.1 ERROR, **structured-input only** | **Yes — scoped**, freeform-prose variant deferred |
| `distribution/false-installable-claim` | Ready | V0.1 ERROR | No — confirmed |
| `distribution/missing-registry-dependency` | Ready with debt | **DEFER** | **Yes — downgraded**, this session's own manual-discovery history is the evidence |
| `distribution/hostrequirements-leak` | Ready | V0.1 ERROR | No — confirmed |
| `token/undeclared-css-var` | Ready | V0.1 ERROR | No — confirmed, empirically re-tested |
| `token/hardcoded-primitive-where-provable` | Ready with debt | DEFER | No — confirmed |
| `api/icon-only-button-missing-name` | Not ready | DEFER | No — confirmed, independently re-derived |
| `accessibility/table-role-grid-misuse` | Not ready | DEFER | No — confirmed |
| `distribution/hosthost-schema-consistency` | Ready | V0.1 ERROR | No — confirmed |

**Net effect: 6 rules locked for V0.1 ERROR (down from PH-0's implied 5
"Ready" + partial credit for 2 more), 5 DEFER.** Two rules
(`api/nonexistent-prop`, `maturity/false-stable-claim`) survive but with
meaningfully **narrower** scope than PH-0 implied — this is the audit doing
its job.

---

## 5. Locked v0.1 rule set

**6 rules** — within the task's own 4–8 target range, all LOW false-positive
risk, all reusing proven logic or trivial lookups.

| Rule ID | Severity | Domain | FP risk | Canonical source |
|---|---|---|---|---|
| `component/nonexistent-slug` | ERROR | Public (§20) | LOW | `public/agent/index.json` / `lib/component-registry*.ts` |
| `api/nonexistent-prop` (non-spread only) | ERROR | Public | LOW (scoped) | Contract `api.properties` |
| `maturity/false-stable-claim` (structured input) | ERROR | Public | LOW (scoped) | `entry.status` |
| `distribution/false-installable-claim` | ERROR | Public | LOW | `isDistributedViaSkrewwwRegistry()` |
| `distribution/hostrequirements-leak` | ERROR | Internal | LOW | Generated `/r/*.json` |
| `token/undeclared-css-var` | ERROR | Internal | LOW | `lib/component-registry.test.ts` pattern |
| `distribution/hosthost-schema-consistency` | ERROR | Internal | LOW | `registry-integration.test.ts` pattern |

(7 listed — the task's own guidance says "approximately 4–8... unless
evidence strongly supports a different number"; all 7 are independently
LOW-risk and directly evidenced, so no artificial trim was applied.)

**Deferred (5):** `distribution/missing-registry-dependency`,
`token/hardcoded-primitive-where-provable`,
`api/icon-only-button-missing-name`, `accessibility/table-role-grid-misuse`
— plus the freeform-prose variant of `maturity/false-stable-claim` and the
spread-prop variant of `api/nonexistent-prop`, both explicitly carved out
of their otherwise-locked parent rule.

**Rejected (0):** no candidate was found unsafe enough to reject outright —
every deferred item is deferred on *readiness*, not *validity*.

---

## 6. Shape / Surface decision (reverified)

**Still NOT READY, reconfirmed by direct grep against both
`lib/component-registry.ts` and `lib/agent-kit/contract-schema.ts` this
session (§2, rows 7–8) — zero matches for any Shape/Surface applicability
field.** `shape/*` and `surface/*` are **locked out of Guard v0.1
entirely.**

**No metadata added in this audit** (matches the explicit instruction not
to infer support from CSS scanning as canonical truth, and not to add
metadata here). **Explicit future prerequisite recorded:** before any
`shape/*`/`surface/*` rule can exist, `ComponentRegistryEntry` needs a real,
authored field (e.g. `shapeSupport: "participates" | "fixed" | "inert"` and
the Surface equivalent) — a schema-expansion decision for whoever implements
Guard v0.1's *next* increment, explicitly not PH-0 or this audit's job to
build.

---

## 7. Accessibility decision (reverified)

Re-examined all accessibility-shaped candidates independently (§3.9,
§3.10) rather than accepting PH-0's "not ready" verdict at face value.
**Confirmed independently: no accessibility rule is safe for v0.1 without
building a real JSX-content analyzer** — the icon-only-Button case
specifically has a genuine multi-pattern accessible-name contract (name can
live on the Button itself or a wrapping element) that a naive check would
get wrong in both directions. **DEFER both.** No Guard architecture
broadening was done to accommodate them, per instruction.

---

## 8. Token-rule decision (reverified)

Challenged with a real example, not asserted: Table's `--table-surface:
var(--component-card-surface)` alias (§2, row 9; §3.7). **Result: the
under-declaration direction survives the challenge** — the existing
regex-based test correctly catches this exact alias pattern because the
alias *definition line itself* is literal text inside the component's own
owned CSS file, which the regex scans directly. This is stronger,
empirically-tested confidence than PH-0's assertion-only treatment.

**Confirmed distinct domains, as instructed:**
- Under-declaration (component's own CSS uses an undeclared token) — this
  domain is **internal-repo-only** in practice: it only makes sense to
  check against a component's *own* registry entry and *own* CSS files,
  which only exist inside this repository. A consumer project that has
  installed `@skrewww/table` does not have `entry.tokensUsed` available to
  check against (it receives only the rendered `.css`/`.tsx` files, not the
  registry entry) — **so this rule, as currently evidenced, cannot run
  against consumer code at all, only against this repository's own
  source.** This is a materially important scoping fact PH-0's §7 did not
  make explicit.
- Over-declaration and Figma-binding-narrowing — remain **NOT READY**,
  unchanged, for the reasons PH-0 already gave (no way to distinguish a
  legitimately-narrowed entry from a stale one without a new per-component
  flag).

**Inherited/indirect helper usage:** no concrete example of a component
relying purely on CSS-inheritance (never an explicit `var()`) was found in
either pass — recorded as a theoretical, unconfirmed gap, not a blocker
(§3.7).

---

## 9. Component identity model (reverified)

Re-confirmed the 5-category split directly against real code (§2's methods
throughout), and — the actual deliverable this section exists to produce —
**worked out the exact mechanism that prevents false-positives on
`RequestForm`/`ReferencePageHeader`/"Advanced Filters" composition, which
PH-0 named as examples but did not fully mechanize:**

**The rule: a component/prop check may only ever fire on an element whose
import statement resolves to a known Skrewww source path.** Concretely,
verified against real source (`components/reference-app/RequestsDataView
.tsx`):

- `import { Button } from "@/components/ui/Button"` → **in scope** (real
  Skrewww path, in-repo)
- `import { RequestForm } from "@/components/reference-app/RequestForm"`
  (hypothetical, matching the real file's own location) → **never in
  scope** — the import path itself is not a Skrewww path, so the rule never
  even asks "is `RequestForm` a real slug"

For an external consumer project (post-`shadcn add`), the equivalent gate
is: a file physically located at one of the known `FILE_DESTINATIONS`
target paths (e.g. `~/components/ui/Button.tsx`) is in scope; anything
else — including a consumer's own `components/ui/MyWidget.tsx` — is not.

**This single mechanism is the entire answer to Part 7's core question**
("how does Guard distinguish a user-created component from a false
Skrewww-component claim"): it never inspects names in isolation, only
names reached through a gated import source. This was implicit in PH-0 but
not stated as the load-bearing safety mechanism it actually is — made
explicit here because §3.1/§3.2's false-positive-risk verdicts depend on
it directly.

---

## 10. Prop-validation limitations (reverified)

Confirmed via direct inspection of `Button.tsx`'s own real props and a real
consumer file's import style:

| Pattern | v0.1 can detect? |
|---|---|
| `<Button size="huge" />` (literal attribute, directly-imported component) | **Yes** |
| `const props = {...}; <Button {...props} />` | **No — explicitly out of scope, not flagged, not warned** (per task's own example) |
| A wrapper component forwarding a subset of props (`function MyButton(props) { return <Button {...props} label="x" /> }`) | **No** — the wrapper's own prop surface is invisible to a v0.1 checker that only inspects the literal Button call site |
| Renamed import (`import { Button as SkButton } from "@/components/ui/Button"`) | **Yes, if the import-path-gating (§9) correctly follows the local binding name, not just the literal string "Button"** — this is a real requirement for the extractor, not automatic, and must be built correctly, not assumed |
| Prop *value* validity (e.g. `variant="huge"` where `variant` is real but `"huge"` isn't a documented option) | **No — a different, unproposed rule; v0.1 only checks prop *names* exist, never validates values** |

**Explicit v0.1 limitation, stated plainly (not promised as complete
semantic analysis):** Guard v0.1's prop rule catches only literal,
non-spread JSX attributes on directly-imported (possibly locally-renamed)
Skrewww components. It does not attempt full dataflow analysis, wrapper-
component prop-forwarding tracking, or prop value validation.

---

## 11. Consumer input model

**Chosen primary mode: A — individual source file(s).** Reasoning: every
locked v0.1 rule (§5) operates on facts extractable from one file at a
time (import statements + JSX in that file, or — for the two internal-repo
rules — one component's own registry entry + owned CSS files). Nothing in
the locked set requires whole-project analysis (e.g. cross-file prop
forwarding, which is explicitly deferred, §10).

**Secondary mode: E — the Skrewww repo itself**, for the two internal-repo
rules (`token/undeclared-css-var`, `distribution/hostrequirements-leak`,
`distribution/hosthost-schema-consistency`) which only make sense run
against this repository's own registry/generated output, not a consumer
project (§8's finding).

**Explicitly not chosen for v0.1:** B (whole consumer project — no locked
rule needs it), C (generated code snippet — no generation pipeline exists
to validate), D (Agent output before writing — plausible *future* mode
reusing the eval-harness's structured-declaration pattern for
`maturity/false-stable-claim`'s structured-input variant, but not required
for the file-based rules).

**Context required:** for mode A, just the target file's own text (parsed
for imports + JSX) plus the canonical fact source (§12). No project-wide
`tsconfig.json` resolution, no `node_modules` traversal — import paths are
matched as literal strings against the known Skrewww path set, not
resolved through the full TypeScript module-resolution algorithm (a
deliberate v0.1 simplification, recorded here, not hidden).

---

## 12. Parsing strategy

**No new dependency needed.** Confirmed directly (`package.json`
inspection this session): `typescript` (`^5.5.4`) is already an installed
dependency, and its Compiler API (`ts.createSourceFile`,
`ts.forEachChild`, `ts.isImportDeclaration`, `ts.isJsxElement`,
`ts.isJsxAttribute`, `ts.isJsxSpreadAttribute`) is sufficient for every
locked v0.1 rule's extraction needs (import-path resolution, JSX tag
identity, literal-vs-spread attribute distinction). No `ts-morph`,
`@babel/parser`, or ESLint-plugin-authoring dependency is required.

**Explicitly avoided:** regex-based JSX parsing for structural checks
(matches the task's own instruction) — the one place this audit's locked
rule set *does* use regex is `token/undeclared-css-var`
(`extractVarRefs`), which is scanning **CSS text**, not JSX/TS syntax; CSS
custom-property references have simple enough grammar that a regex is
appropriate there and is already proven correct by a real, passing test —
a fundamentally different case from parsing JSX structure with regex,
which the task correctly warns against.

**Recorded, not installed:** if a future increment needs robust
cross-file/wrapper-component tracking (§10's deferred patterns), a real
type-checker-backed resolution (`ts.createProgram` + full `TypeChecker`,
still zero new dependencies since `typescript` already provides this) would
be the next step — heavier than `createSourceFile` alone, not needed for
the locked v0.1 set, not built here.

---

## 13. Rule-engine boundary (planning only)

Four conceptually separate stages, matching the task's own instruction —
**no files or code created**:

```
1. INPUT / PARSING
   ts.createSourceFile on one target file → AST
   (no registry knowledge, no rule knowledge)

2. FACT EXTRACTION
   AST → { imports: [...], jsxUsages: [{component, attrs, spread}] }
   (no rule knowledge — pure structural extraction)

3. RULE EVALUATION
   extracted facts + canonical registry/contract data → violations
   (pure functions, one per rule ID, each independently testable —
   mirrors evaluation-scorer.ts's own per-check-function shape)

4. DIAGNOSTICS
   violations → GuardDiagnostic[] (§15's shape)
   (formatting/output only — no rule logic here)
```

**Why this separation matters for the specific risks found in this
audit:** stage 2 (fact extraction) is where §10's real limitations live —
keeping it a separate, independently-testable module means a future
increment can improve extraction (e.g. add wrapper-component tracking)
without touching rule-evaluation logic at all, and vice versa. Mixing
these (as the task explicitly warns against) would make the §10
limitations invisible/entangled inside rule logic instead of being a
clearly-bounded, upgradable seam.

---

## 14. Canonical fact-loader strategy

**Recommendation: consume the canonical TypeScript registry directly
(`lib/component-registry*.ts`) for internal-repo rules, and the generated
Agent Kit contracts (`public/agent/*.json`) for public/consumer rules —
not a new Guard-specific fact bundle (§ next).**

| Option | Tradeoff |
|---|---|
| Canonical TS registry directly | Zero staleness risk, but only importable from *inside* this repository — unusable for an external consumer's Guard run |
| Generated Agent Kit contracts | Already public, already provenance-stamped (`sourceGitSha`), already proven safe to retrieve (`retrieval.test.ts`) — the correct choice for anything running outside this repo |
| Generated public registry (`/r/*.json`) | Correct source specifically for `distribution/*` rules (installability); **lacks provenance** (§18 of PH-0, reconfirmed unchanged in this audit — no fix applied, per fix policy) |
| A new, intentionally-compiled "Guard fact bundle" | **Not recommended for v0.1** — see §13 (bundle decision) below; would be a third parallel projection of the same underlying facts |

**Recommended split:** Guard, when run *inside* this repository (its own
CI/local dev), reads `lib/component-registry*.ts` directly for maximum
freshness. Guard, when run as a published tool against *external* consumer
code, reads the generated `/agent/*` contracts (public, provenance-stamped,
already the sanctioned external-facing projection). Both paths converge on
the same underlying facts — no second source of truth is created either
way.

---

## 15. Generated fact-bundle decision

**Not necessary for v0.1.** Evaluated directly against the task's own
checklist:

- **Necessary?** No — §14 already identifies two existing, sufficient
  projections (canonical registry for in-repo use, Agent Kit contracts for
  external use). A third bundle would duplicate one or the other.
- **Unnecessary?** Yes, for the reason above.
- **Helpful for external consumer installation?** Marginally — a
  single-file `guard-facts.json` would be simpler to fetch than several
  `/agent/contracts/<slug>.json` files, but `/agent/index.json` already
  serves as a lightweight allow-list for exactly the `component/*` checks,
  and per-component contract fetching is already a proven, working pattern
  (Agent Skill's own documented workflow).
- **Provenance requirements, if ever built:** would need the same
  `sourceGitSha`/`schemaVersion` block Agent Kit contracts already carry —
  not a new requirement, an inherited one.
- **Versioning requirements, if ever built:** would need its own schema
  version, independent of `CANONICAL_AGENT_CONTRACT_SCHEMA_VERSION` (same
  discipline `agent-kit.md` already established for its own four
  independent version concepts).
- **Risk of duplicate truth:** real and avoidable — exactly why this audit
  recommends against building it for v0.1. **If a future increment does
  build one, the canonical registry must remain the sole source it
  compiles from** — restated per instruction, not a new decision.

---

## 16. Versioning model

Minimal, evidence-based — **do not add dimensions beyond what v0.1
actually needs**:

| Dimension | Needed for v0.1? | Reasoning |
|---|---|---|
| Guard tool version | **Yes** | Any published tool needs its own version for bug-report triage — matches `lib/agent-kit/beta-version.ts`'s own precedent (a standalone constant, zero schema coupling) |
| Ruleset version | **No, for v0.1** | Only 7 rules, none likely to change meaning independently of the tool version itself at this scale; folding ruleset identity into the tool version is sufficient until the rule count grows enough to need independent versioning |
| Design-system version | **No, new dimension not needed** | Already exists — `sourceGitSha` (Agent Kit contracts) or the repo's own git state (in-repo mode) already answers "which DS snapshot was this validated against" |
| Fact-bundle schema version | **N/A** | No fact bundle exists (§15) |

**v0.1 needs exactly one new version concept: the Guard tool's own
version**, following the exact `beta-version.ts` precedent already
established for Agent Kit — a standalone constant, not embedded in any
compiled contract, zero schema risk.

---

## 17. Diagnostic contract (reviewed, revised from PH-0)

PH-0's shape (`docs/architecture/pre-guard-hardening.md` §21) is
re-affirmed with one refinement: **`location` must be explicitly optional
and its absence must be a normal, expected case**, not an edge case — both
internal-repo rules (§5's `token/undeclared-css-var`,
`distribution/hostrequirements-leak`, `distribution/hosthost-schema-consistency`)
are registry-wide/generated-artifact-wide checks with no single JSX call
site to point at.

```ts
type GuardDiagnostic = {
  ruleId: string;              // required
  severity: "error" | "warning" | "info"; // required
  message: string;             // required — one sentence, see §18 examples
  location?: { file: string; line?: number; column?: number }; // optional — absent for registry-wide checks
  subject: { kind: "component" | "prop" | "token" | "recipe"; id: string }; // required
  evidence: { source: string; sourceGitSha?: string }; // required — source; sourceGitSha only for external-mode runs
  remediation?: string;        // optional
};
```

**Required:** `ruleId`, `severity`, `message`, `subject`, `evidence.source`.
**Optional:** `location` (registry-wide checks have none),
`evidence.sourceGitSha` (only meaningful for external/published-snapshot
runs), `remediation` (nice-to-have, not load-bearing).

**No giant canonical payloads** — `evidence.source` is a path/identifier
string, never the full registry entry or contract JSON embedded inline,
per instruction.

Portable across CLI/CI/editor tooling — same reasoning as PH-0, unchanged.

---

## 18. Message quality — one example diagnostic per locked rule

| Rule | Example diagnostic |
|---|---|
| `component/nonexistent-slug` | `error component/nonexistent-slug: "CommandPalette" is imported from "@/components/ui/CommandPalette" but no such Skrewww component exists. Command Palette remains unimplemented (see docs/reference-app-plan.md §12). Remove the import or use Menu + Dialog composition instead.` |
| `api/nonexistent-prop` | `error api/nonexistent-prop: Button has no prop "glowIntensity" (real props: variant, size, loading, fullWidth, leadingIcon, trailingIcon, className, children). Remove "glowIntensity" or check the Button contract at public/agent/contracts/button.json.` |
| `maturity/false-stable-claim` | `error maturity/false-stable-claim: Toggle Group was claimed "Stable" but its real status is "beta" (v0.1.0-beta). Use the real maturity or promote the component first.` |
| `distribution/false-installable-claim` | `error distribution/false-installable-claim: "npx shadcn add @skrewww/banking-account-card" was suggested, but banking-account-card is implemented and not yet distributed (Figma parity pending — see docs/distribution-expansion.md Part 10). No install command exists for it.` |
| `distribution/hostrequirements-leak` | `error distribution/hostrequirements-leak: r/button.json's "dependencies" array contains "react" — host requirements (react, react-dom, next) must appear only in the "docs" field, never as an installable dependency.` |
| `token/undeclared-css-var` | `error token/undeclared-css-var: table.module.css references var(--table-scroll-shadow), which is not listed in the "table" registry entry's tokensUsed array. Add "--table-scroll-shadow" to tokensUsed.` |
| `distribution/hosthost-schema-consistency` | `error distribution/hosthost-schema-consistency: public/agent/contracts/button.json contains a "$schema" field — Agent Kit contracts must never carry shadcn transport fields. Check for an accidental merge in the compiler.` |

Every example names the exact conflicting fact and a concrete fix — none
say "invalid usage" alone, matching the instruction.

---

## 19. Exit-code contract

```
0 = no ERROR-severity diagnostics (WARNING/INFO may still be present)
1 = one or more ERROR-severity diagnostics
2 = Guard/tool/config failure (e.g. couldn't parse a target file, canonical fact source unreachable)
```

**Warnings never fail CI by default** — matches instruction, and matches
the fact that v0.1 ships **zero WARNING-severity rules** (§5 — every
locked rule is ERROR; the deferred rules that would have been WARNING are
simply not in v0.1 at all). This makes the exit-code contract trivially
simple for v0.1: it is effectively binary (any locked-rule violation = 1),
with the three-code contract defined now so it doesn't need a breaking
change when WARNING-severity rules are added in a future increment.

---

## 20. Configuration policy

**Zero-config for v0.1.** All 7 locked rules are canonical-fact
comparisons with no legitimate per-project variance — there is no
reasonable scenario where a project should be allowed to disable
"this component doesn't exist" or "this manifest leaks hostRequirements as
a dependency." **No configuration surface is proposed for v0.1.**

If configuration is ever needed (e.g. a future WARNING-severity rule with
known legitimate exceptions, like §3.8's raw-hex rule once it exists),
that need is recorded for a future increment, not designed now — building
a config surface for rules that don't exist yet would be speculative
engineering the task explicitly warns against ("avoid building a large
config surface").

---

## 21. Suppression policy

**None for v0.1.** Every locked rule is LOW false-positive risk by
construction (§5) — matching the task's own steer: "if pilot rules are
truly low-risk, no suppression may be best for v0.1." Adding any
suppression mechanism (file-level, line-level, or config-based) to a
7-rule, all-ERROR, all-LOW-risk v0.1 would only introduce a bypass surface
with no corresponding real need. **Recorded as a deliberate decision, not
an oversight** — revisit only if/when a WARNING-severity rule with known
legitimate exceptions actually ships.

---

## 22. Public vs. internal vs. Figma scope

**v0.1 targets PUBLIC CONSUMER usage as the primary mode**, per the task's
preferred default, **with 3 of the 7 locked rules scoped internal-repo-only
by their own nature** (§8's finding: token/registry-integrity checks
require the canonical registry entry, which only exists inside this
repository):

| Rule | Scope |
|---|---|
| `component/nonexistent-slug` | Public |
| `api/nonexistent-prop` | Public |
| `maturity/false-stable-claim` | Public |
| `distribution/false-installable-claim` | Public |
| `token/undeclared-css-var` | **Internal only** |
| `distribution/hostrequirements-leak` | **Internal only** |
| `distribution/hosthost-schema-consistency` | **Internal only** |

**This mixing is intentional, not a violation of the task's "should not
mix all three" instruction** — the instruction warns against mixing
*public/internal/Figma parity* rule *domains* indiscriminately in one
release; it does not require every individual rule to be public-only.
Internal-repo validation reuses **existing tests as tests** (unchanged,
per instruction — "internal Skrewww repo validation can remain existing
tests for now"). The 3 internal-only rules listed above are included in
the locked set specifically because they're the ones this audit found
**already implemented as passing tests today** — promoting them to Guard
rule IDs costs nothing beyond the diagnostic-formatting layer (§13's
stage 4), and gives Guard's own CI a first, trivially-safe, zero-new-
extraction-logic pilot subset to validate the engine boundary itself
against, before the public/consumer rules' new JSX-extraction code exists.
**Figma parity rules remain fully excluded**, unchanged from PH-0.

---

## 23. CLI proposal (planning only)

```
skrewww guard [path]       # default path: current directory
```

- **Default target:** current directory, recursively finding `.tsx`/`.ts`
  files that contain at least one import from a known Skrewww path (§9's
  gating) — files with no such import are skipped entirely, not "passed"
  (nothing to check).
- **Output format:** human-readable by default (one line per diagnostic,
  file:line prefix where `location` exists, grouped by severity).
- **Future JSON output:** `--json` flag emitting `GuardDiagnostic[]` (§17)
  — not built in v0.1, but the diagnostic shape is already JSON-serializable
  by design, so this is additive, not a redesign.
- **Exit codes:** §19.

Kept narrow per instruction — no watch mode, no incremental caching, no
config file resolution proposed for v0.1.

---

## 24. Repo/package location

**Recommend `lib/guard/` inside this repository for a first internal pilot
— not a separate package, not a new workspace.** Reasoning, audited
against the actual repo structure: every other cross-cutting system in
this repo (`lib/agent-kit/`, `lib/shadcn-registry-generator.ts`) lives as
a plain directory under `lib/`, imported directly by scripts and tests —
no monorepo/package-boundary infrastructure exists anywhere in this repo
today (confirmed: no `packages/` directory, no workspace config in
`package.json`). Introducing one solely for Guard would be exactly the
kind of premature architecture the task warns against.

`lib/guard/` should internally mirror §13's four-stage boundary as
separate files/modules (`parse.ts`, `extract.ts`, `rules/*.ts`,
`diagnostics.ts`) — this keeps a future extraction into a standalone
publishable package straightforward (the stage boundary already isolates
what would need to move) without paying that cost now.

---

## 25. Test strategy

All 8 required categories, each mapped to what actually needs coverage
given the locked v0.1 set:

| Category | What it covers for v0.1 |
|---|---|
| A. Rule unit tests | One test file per locked rule (7 files), each testing the pure evaluation function against extracted-fact fixtures — mirrors `evaluation-scorer.test.ts`'s own per-check structure |
| B. Canonical fact loader tests | Verify the in-repo loader reads `lib/component-registry*.ts` correctly; verify the external loader reads `/agent/*.json` correctly and rejects a `sourceGitSha` mismatch appropriately |
| C. Diagnostic tests | Verify `GuardDiagnostic` shape/serialization, required-vs-optional field handling |
| D. Fixture-based valid examples | Real, passing Skrewww usage (a real Button/Card/Table composition) — zero diagnostics expected |
| E. Fixture-based invalid examples | One deliberately-broken fixture per locked rule — exactly one diagnostic of the matching `ruleId` expected |
| F. Determinism test | Run the same fixture set twice, assert byte-identical `GuardDiagnostic[]` output — mirrors `retrieval.test.ts`'s own "delete and regenerate twice, diff" pattern |
| G. False-positive regression fixtures | **The highest-value category given this audit's findings** — must include: a spread-prop Button usage (must produce zero diagnostics, proving §10's limitation is honored, not silently violated); `RequestForm`/`ReferencePageHeader`-shaped user components (must produce zero diagnostics, proving §9's import-gating works); a Toggle-Group-shaped component with no Figma reference (must produce zero diagnostics for any maturity/existence rule, proving §13's PH-0-carried-forward "Figma absence ≠ broken" lesson isn't violated); a locally-renamed import (`Button as SkButton`) correctly still recognized |
| H. CLI exit-code tests | Once a CLI exists: fixture producing 0 errors → exit 0; fixture producing 1+ errors → exit 1; malformed/unparseable input file → exit 2 |

**Adversarial fixtures are mandatory, not optional** — category G above is
where this audit expects most of the real engineering risk to surface,
directly following from §3's narrowed dispositions.

---

## 26. Golden fixture set (proposed structure, not created)

```
lib/guard/__fixtures__/
  valid/
    button-basic.tsx              # real, correct Button usage
    button-renamed-import.tsx     # import { Button as SkButton }
    table-composition.tsx         # real Table + TableHeader + ...
  invalid/
    button-nonexistent-prop.tsx   # <Button glowIntensity={2} />
    nonexistent-component.tsx     # import { CommandPalette } from "@/components/ui/CommandPalette"
    false-stable-claim.json       # structured declaration claiming toggle-group is Stable
    banking-install-claim.json    # structured declaration claiming banking-account-card is installable
  edge-cases/
    spread-props.tsx              # <Button {...props} /> — must NOT flag
    wrapper-component.tsx         # MyButton forwarding to Button — must NOT flag (known v0.1 limitation)
    user-component-lookalike.tsx  # RequestForm-shaped, non-Skrewww-path import — must NOT flag
    figma-unavailable-component.tsx  # a Toggle-Group-shaped usage — must NOT flag on Figma-absence
```

Not created in this audit — proposed structure only, per instruction.

---

## 27. PH-0 test-flake / CI-readiness findings (re-evaluated for Guard specifically)

| Finding | Guard relevance |
|---|---|
| Known `Combobox.test.tsx` timing flake | **IRRELEVANT TO GUARD CORE** — no locked v0.1 rule touches Combobox or any browser-rendered component behavior; this flake lives entirely in Vitest+Testing-Library timing, a different test layer than Guard's own deterministic fixture tests (§25) would be |
| Playwright not part of CI at all | **NON-BLOCKING DEBT** — none of the 7 locked rules require browser execution (all operate on static source text/AST or generated JSON); Guard's own test suite (§25) would run entirely under Vitest, same as the rest of this repo's deterministic tests, with no Playwright dependency at all. This remains real debt *for the repository generally* (a regression in browser-verified behavior wouldn't be caught by CI) but does not block Guard v0.1 specifically. |

**Neither finding is a BLOCKER for Guard v0.1.**

---

## 28. Future CI placement (re-evaluated against real scripts)

PH-0 proposed "after unit tests, before build." Re-checked against the
actual current CI steps (`.github/workflows/ci.yml`, unchanged, re-read
this session):

```
checkout → setup-node → npm ci → lint → typecheck → npm test (Vitest) → npm run build → verify-untracked
```

**Confirmed placement: after `npm test`, before `npm run build`.**
Reasoning re-verified, not just restated: Guard's own test suite (§25) is
itself a Vitest suite and would naturally run as part of `npm test` (like
every other `lib/**/*.test.ts` file already does) — so "Guard's tests
pass" is already covered by the existing `npm test` step with zero new CI
wiring. A **separate** "run Guard against this repo's own source" step
(distinct from Guard's unit tests) is the one that would sit as a new,
distinct step positioned right after `npm test` and before `npm run
build` — verifying the *build inputs* are clean before spending the more
expensive build step. **Not added to CI in this audit** — recommendation
only, per the explicit "do NOT modify CI" instruction.

---

## 29. Performance budget

No implementation exists to benchmark — qualitative target only, per
instruction: **a normal consumer project (per `smoke-test-consumer.ts`'s
own fixture scale — a handful of installed component files) should
validate in low single-digit seconds, not minutes.**

| Rule scope (from §22) | Classification |
|---|---|
| `component/nonexistent-slug`, `api/nonexistent-prop`, `maturity/false-stable-claim`, `distribution/false-installable-claim` | Single-file, checked per target file, against a registry-wide allow-list loaded once |
| `token/undeclared-css-var`, `distribution/hostrequirements-leak`, `distribution/hosthost-schema-consistency` | Registry-wide / generated-artifact-wide, run once per validation pass, not per consumer file |

At the confirmed real scale (55 components, single-digit registry files,
53 generated manifests — §2/§28 of PH-0, unchanged), every locked rule is
comfortably within the qualitative target; **no numeric benchmark is
asserted without evidence**, per instruction.

---

## 30. Offline / network requirement

**Every one of the 7 locked v0.1 rules runs fully offline once the
canonical fact source is loaded** (either the in-repo TypeScript registry
or a previously-fetched `/agent/*.json` snapshot) — reconfirmed rule-by-
rule in §3, none require live Figma, live `skrewww.com`, live GitHub, or
any LLM/API call. **Preferred v0.1 posture (fully local deterministic
validation) is achieved by construction, not by exception-carving** — no
locked rule was excluded specifically to preserve offline operation;
offline-safety fell out naturally from every rule already being a
canonical-fact lookup.

---

## 31. Security / privacy (reverified)

Confirmed no locked rule's diagnostic (§17's shape) can carry a secret,
credential, or full-source dump — `evidence.source` is a path/identifier
string; `location` is `{file, line, column}`, never file content;
`message`/`remediation` are template strings interpolating only
component/prop/token names, never arbitrary user code. **Recommended safe
default, made explicit here (not stated this plainly in PH-0):** Guard's
CLI output must never echo back the full text of a matched JSX expression
or CSS declaration — only the extracted `{component, prop}` /
`{file, token}` identifiers — to avoid any risk of a diagnostic
accidentally including a secret a consumer had inlined nearby (e.g. an API
key in a sibling JSX attribute on the same line as a flagged prop).

---

## 32. Release model

**Recommendation: experimental local command first, gated the same way
Agent Kit itself was gated (AK-1 through AK-6's own dated progression) —
never a public Beta on the first release.** Concretely: ship `lib/guard/`
+ a `npm run guard` script runnable only from inside this repository
first (validating this repo's own source against the 3 internal-only
rules — the lowest-risk possible first exercise of the engine, per §22's
own reasoning), prove it stable and false-positive-free against this
repo's real, large, already-known-correct codebase, **then** extend to
the 4 public-consumer rules with the adversarial fixture set (§25 category
G) as the explicit graduation gate before any external-facing CLI ships.
This mirrors Skrewww's own established Beta-maturity discipline (every
component ships Beta before Stable; Agent Kit itself shipped AK-1 local-
only before AK-6 Public Beta) rather than inventing a new release
philosophy for Guard specifically.

---

## 33. Failure-mode analysis

| Failure mode | Prevention |
|---|---|
| Duplicate source of truth | §14/§15 explicitly reject a new fact bundle for v0.1; both consumption paths read from the two already-sanctioned projections |
| Regex parsing JSX where structure matters | §12 explicitly commits to the TypeScript Compiler API for JSX/import extraction; regex reserved only for CSS var() scanning, a genuinely simpler grammar with a proven precedent |
| Wrapper-component false positives | §10 explicitly scopes this out of v0.1 rather than attempting and getting it wrong; §25 category G fixtures assert this stays true |
| Spread-prop false positives | Same — §10, §25 category G |
| Confusing installability vs. implementation | §9's 5-category model, with a fixture (§26) specifically for this |
| Stale fact bundle | No fact bundle exists (§15); the two real sources (in-repo registry, Agent Kit contracts) each already have their own freshness guarantee (git state / `sourceGitSha`) |
| Warnings treated as errors | §19 — v0.1 ships zero WARNING rules, sidestepping this entirely for the first release; the exit-code contract is defined to distinguish them regardless |
| Guard depending on network | §30 — every locked rule reconfirmed offline-capable |
| LLM output influencing a deterministic verdict | §29 of PH-0, unchanged and re-confirmed: zero locked rules invoke a model; every one is metadata lookup or reused deterministic logic |
| Name-based component-existence false positives (the RequestForm-class risk) | §9's import-path-gating mechanism, made explicit and fixture-tested (§25/§26) |
| Value validation over-promising (flagging `variant="huge"` as if names were being checked) | §10 explicitly states v0.1 checks prop *names* only, never values — documented, not silently absent |

---

## 34. GO / NO-GO matrix

| Category | Verdict | Evidence |
|---|---|---|
| A. Canonical facts | **PASS** | §2 — 13 VERIFIED, 1 VERIFIED WITH DEBT (cleanly split by direction), 2 correctly NOT VERIFIED and locked out (§6) rather than worked around |
| B. v0.1 rule safety | **PASS** | §3/§4/§5 — 7 rules locked, all independently re-derived LOW risk; 5 candidates correctly deferred, 2 narrowed rather than shipped as-proposed |
| C. Parsing feasibility | **PASS WITH DEBT** | §12 — no new dependency needed (`typescript` already installed), but the actual extractor code does not exist yet; this is real, scoped, bounded implementation work, not a design gap |
| D. Diagnostics | **PASS** | §17/§18 — shape reviewed and refined (optional `location`), 7 concrete example messages drafted, none generic |
| E. Determinism | **PASS** | §2/§25 — every locked rule's canonical source is proven deterministic (git-state-based provenance, pure compile functions); determinism testing pattern (F) directly modeled on an existing, working precedent (`retrieval.test.ts`) |
| F. Offline operation | **PASS** | §30 — achieved by construction, not exception |
| G. False-positive control | **PASS WITH DEBT** | §3/§9/§10/§25 — the mechanism (import-path gating) is sound and evidenced, but **zero adversarial fixtures have actually been run against it yet** — this audit designed the fixture set (§26), it did not execute it, because doing so requires the extractor code from §12/§13, which does not exist |
| H. Testability | **PASS** | §25 — 8-category strategy, each mapped to real precedent in this repo (`evaluation-scorer.test.ts`, `retrieval.test.ts` shapes) |
| I. Performance feasibility | **PASS** | §29 — comfortably within scale at current 55-component/53-manifest size, no premature optimization needed |
| J. Security/privacy | **PASS** | §31 — no risk found, one explicit new safe-default recommendation added (never echo matched source text) |
| K. Release scope | **PASS** | §32 — staged internal-first rollout recommended, mirroring existing Skrewww Beta discipline |

**No category is FAIL. Two categories are PASS WITH DEBT** — both trace to
the same root cause: **the extraction/parsing implementation does not
exist yet, so its correctness against real adversarial input is
unproven, not merely undocumented.** This is the deciding factor in §35's
verdict.

---

## 35. Final readiness verdict

# CONDITIONAL GO

**Not a plain GO**, because two PASS-WITH-DEBT categories (C, G) share a
single real, unresolved risk: the JSX/import extraction layer that 4 of
the 7 locked rules depend on has never been built or tested against a
single real line of code, adversarial or otherwise. Every other part of
this audit — the canonical facts, the rule logic, the diagnostic design,
the determinism/offline/security posture — is genuinely, evidence-backed
solid. But "the comparison logic is proven" (true, via
`evaluation-scorer.ts`) is not the same claim as "the extraction that
feeds it is proven" (false — it doesn't exist). Shipping straight to GO
would mean asserting confidence in code that has not been written, which
is exactly the kind of unearned precision this audit exists to prevent.

**Not NO-GO**, because nothing found in this audit is a canonical-truth
problem, an architecture problem, or a determinism/security problem —
every gap identified is a bounded, well-scoped, already-precedented
implementation task (the TypeScript Compiler API is already installed;
the exact per-rule fixture set is already designed in §26; the
comparison-logic half of every rule already has a working, tested
precedent to model). NO-GO would be the wrong signal for a plan this
concrete.

**CONDITIONAL GO — prerequisites in §36 must be satisfied before Guard v0.1
implementation begins**, not after.

---

## 36. Locked implementation brief

Effective immediately as the contract for the next implementation phase.
**Not executed here.**

### Prerequisites (must be satisfied before implementation starts)

1. Build the fact-extraction layer (§12/§13 stage 1–2) using
   `ts.createSourceFile` — import-statement parsing + JSX
   tag/attribute/spread-detection — as a standalone, independently
   testable module, before any rule-evaluation code is written.
2. Build and run the full adversarial fixture set (§25 category G, §26's
   structure) against the extraction layer **before** wiring it to any
   rule — prove `RequestForm`-class user components, spread-prop usages,
   and renamed imports behave exactly as §9/§10 predict, with real test
   output, not just design-doc assertions.
3. Only after (1) and (2) pass: implement the 7 locked rules (§5) as pure
   evaluation functions per §13 stage 3, each with its own unit test
   (§25 category A/E).

### v0.1 user

A Skrewww contributor or an external consumer's source file, validated one
file at a time (§11).

### v0.1 input

Mode A (individual source files) primary; Mode E (this repo's own
registry/generated artifacts) secondary, for the 3 internal-only rules
(§11, §22).

### Exact rule IDs and severities (locked)

```
component/nonexistent-slug              ERROR  public
api/nonexistent-prop (non-spread only)  ERROR  public
maturity/false-stable-claim (structured) ERROR  public
distribution/false-installable-claim    ERROR  public
token/undeclared-css-var                ERROR  internal
distribution/hostrequirements-leak      ERROR  internal
distribution/hosthost-schema-consistency ERROR internal
```

### Canonical fact source (locked)

In-repo mode: `lib/component-registry*.ts` directly. External mode:
`public/agent/index.json` + `public/agent/contracts/<slug>.json`. Never a
new fact bundle (§14/§15).

### Parser approach (locked)

TypeScript Compiler API (`ts.createSourceFile`, no `ts.createProgram`/
full `TypeChecker` needed for the locked rule set) — zero new
dependencies (§12).

### Engine boundaries (locked)

Four stages, four separately-testable modules: parse → extract → evaluate
→ diagnose (§13). No stage may call into a later stage's concerns.

### Diagnostic contract (locked)

§17's `GuardDiagnostic` shape, `location` optional.

### CLI concept (locked, not built in this phase)

`skrewww guard [path]`, human-readable default output, exit codes per
§19, `--json` flag deferred to a later increment.

### Test strategy (locked)

§25's 8 categories; category G (adversarial fixtures) is a **hard
prerequisite gate**, not a nice-to-have — see Prerequisites above.

### CI placement (recommended, not wired)

After `npm test`, before `npm run build` (§28) — for a future "run Guard
against this repo's own source" CI step; Guard's own unit tests join
`npm test` automatically as ordinary `lib/**/*.test.ts` files.

### Explicit non-goals (locked, unchanged from PH-0 §24, reconfirmed)

Visual pixel parity, subjective spacing quality, Figma screenshot
comparison, design taste, responsive aesthetic quality, Command Palette
semantics, searchable Multi Select semantics, broad composition judgment,
automated component generation, LLM-as-validator. **Additionally locked by
this audit:** prop *value* validation (§10), wrapper-component prop-
forwarding tracking (§10), Shape/Surface rules of any kind (§6),
accessibility rules of any kind (§7), the freeform-prose variant of
`maturity/false-stable-claim` (§3.3), the spread-prop variant of
`api/nonexistent-prop` (§3.2).

### Stop conditions (locked)

If, during implementation, the adversarial fixture set (prerequisite 2)
reveals a false-positive rate the implementer judges unacceptable for any
one of the 4 public rules, that specific rule must be individually
deferred (not the whole v0.1) and the remaining rules may still ship —
matching this audit's own per-rule (not all-or-nothing) disposition
discipline throughout §3–§5.

---

## 37. G-0 status (2026-09-17)

**Prerequisites 1–2 of §36's locked implementation brief are satisfied.**
The parser/fact-extraction layer 4 of the 7 locked rules depend on — the
single reason this audit's verdict was CONDITIONAL GO rather than a plain
GO (§35) — has been built and proven against a 14-fixture adversarial set
plus all 127 real `.tsx` files in `components/ui/` and `components/
reference-app/` (zero parse failures). Full record, including the exact
import-provenance mechanism, extraction capabilities, and a G-1 readiness
checklist re-verified item-by-item against this section's own prerequisite
list: [`docs/architecture/guard-foundation.md`](guard-foundation.md).

**G-1 (locked rule implementation) remains NOT STARTED**, pending explicit
human approval — this section records that its prerequisites are met, not
that G-1 has begun.

---

## See also

- `docs/architecture/guard-foundation.md` — G-0's own implementation
  record: parser approach, extraction capabilities, adversarial fixture
  evidence, G-1 readiness checklist.
- `docs/architecture/pre-guard-hardening.md` — the prior audit this
  document reverifies and, in several places, narrows or corrects; not
  duplicated here except where a specific claim changed.
- `docs/architecture/agent-kit.md` — `evaluation-scorer.ts`'s exact
  matching logic, referenced throughout §3 as the reusable half of every
  api/maturity/distribution rule.
- `docs/architecture/source-of-truth.md`, `docs/architecture/
  shadcn-distribution.md`, `docs/architecture/token-source-of-truth.md` —
  unchanged canonical sources this audit re-read directly rather than
  trusting secondhand.
- `lib/agent-kit/project-context.ts` — `isDistributedViaSkrewwwRegistry`,
  re-read directly this session (§2, row 4).
- `lib/component-registry.test.ts` — the cssTokens-accuracy test, run
  fresh this session (§2, row 9; §3.7).
- `lib/agent-kit/evaluation-scorer.ts` / `evaluation-scorer.test.ts` — the
  closest existing precedent for Guard's own rule-evaluation shape.

## Addendum: G-1 outcome (not a revision of the verdict above)

Recorded after G-1 (locked rule implementation) shipped; the CONDITIONAL
GO verdict and every disposition above are left as originally written —
this addendum only records what actually happened against them. Full
detail: `docs/architecture/guard-foundation.md` §16.

- 6 of the 7 locked rules implemented as specified. `api/nonexistent-prop`
  was **not** implemented — its "narrowed" disposition above did not, in
  the end, yield a safe deterministic implementation once native/
  inherited React DOM props were checked against real `apiProps` data
  across the registry (43/116 entries use `className` without declaring
  it), so it was BLOCKED per this document's own instruction to stop
  rather than invent a manual allow-list. This is the one place G-1's
  outcome differs from this audit's own expectation. Of the other 6
  rules, `distribution/hosthost-schema-consistency`'s spelling was
  confirmed intentional (not a typo) and kept verbatim.
- All 4 deferred rules remained deferred; none were implemented.
- Zero violations against all 127 real `.tsx` files in `components/ui/`
  and `components/reference-app/`.

## Addendum: G-1A — formal deferral of `api/nonexistent-prop` (governance)

**Date:** 2026-09-17. **Outcome B.** Does not rewrite §3.2 / §5 historical
text above; records that implementation evidence **refined** the original
7-rule locked plan.

| Item | Decision |
|---|---|
| `api/nonexistent-prop` | **DEFERRED post-v0.1** (was G-1 BLOCKED; G-1A closes the open question) |
| Approved Guard v0.1 rules | **6** (catalog length) |
| Type-aware `ts.Program` implementation | Not adopted for v0.1 — duplicates `tsc`, fails `data-*` VALID gate on real Button types, conflates local vs canonical API |
| Manual HTML/React prop allow-list | Still rejected |
| G-1 status | ✅ COMPLETE (revised 6-rule set) |
| G-2 | ✅ COMPLETE — see Addendum: G-2 below |
| G-3 | ✅ COMPLETE — **CONDITIONAL RELEASE READY** (see Addendum: G-3) |

Evidence: `lib/guard/rules/api-nonexistent-prop.ts`,
`docs/architecture/guard-foundation.md` §16.1.

## Addendum: G-2 — Diagnostics + CLI (COMPLETE)

**Date:** 2026-09-17. Does not rewrite §17–§23 historical planning text;
records that G-2 implemented those locked contracts.

| Item | Decision / result |
|---|---|
| Diagnostic shape | Implemented per §17 (`lib/guard/diagnostics.ts`) |
| Human formatter | `lib/guard/format.ts` — compact plain text + summary |
| CLI | `npm run guard -- [path]` (`scripts/guard.ts` + `lib/guard/cli.ts`) |
| Default path | Current working directory (§23) |
| Modes | Consumer default; `--internal` for repo-only rules |
| Structured claims | Optional `--claims` JSON **data** (`maturity` / `installability` only) |
| Exit codes | 0 / 1 / 2 per §19; parse errors → exit 2 |
| `--json` | Still deferred |
| Config / suppressions | Still none |
| Tool version | `0.1.0-beta.1` (`lib/guard/version.ts`) |
| `api/nonexistent-prop` | Still deferred / absent |
| CI / public release | Still NOT STARTED |
| G-3 | Completed — see Addendum: G-3 |

Full record: `docs/architecture/guard-foundation.md` §17.

## Addendum: G-3 — Pilot / Release Validation (COMPLETE)

**Date:** 2026-09-17. Does not rewrite historical planning sections.

| Item | Result |
|---|---|
| Release verdict | **CONDITIONAL RELEASE READY** |
| Six-rule lock | PASS |
| Internal dogfood | PASS (exit 0) |
| Consumer FP stress | PASS (0 findings) |
| Process exit 0/1/2 | PASS |
| Privacy / offline / determinism | PASS |
| External fact packaging | **Pre-release prerequisite** (blocker for public install) |
| Package `bin` / publish surface | **Pre-release prerequisite** (`skrewww-docs` private, no bin) |
| CI / npm publish / GitHub release | Still NOT DONE (correct) |
| Next | GUARD PRE-RELEASE HARDENING — NOT STARTED |

Full record: `docs/architecture/guard-foundation.md` §18.
