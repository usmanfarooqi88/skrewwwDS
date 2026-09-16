# Guard G-0 — Parser / Fact Extraction Foundation

**Phase:** G-0 ✅ COMPLETE (parser + fact extraction + adversarial fixtures
only — no rules, no CLI, no CI integration)
**Baseline:** `6e86028` (Guard Readiness Audit ✅ COMPLETE, verdict
CONDITIONAL GO)
**Locked prerequisite satisfied:** the readiness audit's implementation
brief (`docs/architecture/guard-readiness-audit.md` §36) named building and
fixture-testing the extraction layer as prerequisites 1–2, **before** any
of the 7 locked v0.1 rules are implemented. This document records that
work. Guard v0.1 rule implementation (G-1) is a **separate, later, not-yet-
approved phase** — nothing here evaluates any rule.

This document does not restate the readiness audit's own verdict, source-
of-truth map, or locked rule set — see
[`guard-readiness-audit.md`](guard-readiness-audit.md) for those. It
records what G-0 actually built and the evidence that it's safe to build
G-1 against.

---

## 1. What G-0 is

```
PARSE → EXTRACT FACTS
```

Two pipeline stages only, matching the readiness audit's own architecture
(§13 of that document). No `EVALUATE RULES` or `DIAGNOSTICS` stage exists
yet — `lib/guard/` currently contains zero rule logic, zero severities,
zero diagnostic formatting. Every type in `lib/guard/types.ts` is
explicitly scoped: "no field here encodes 'this is wrong.'"

## 2. File structure

```
lib/guard/
  types.ts               — GuardSourceInput, ImportFact, JsxElementFact,
                            JsxAttributeFact, ExtractedSourceFacts — all
                            source-extraction types, zero rule verdicts
  parse-source.ts         — wraps the TypeScript Compiler API
  extract-imports.ts      — import-declaration → ImportFact[]
  extract-jsx.ts           — JSX elements/attributes → JsxElementFact[]
  provenance.ts             — Skrewww import-path classification +
                              slug resolution (the false-positive safety
                              mechanism)
  component-facts.ts        — canonical-fact loader (internal + consumer)
  facts.ts                  — orchestrates parse → extract into one
                              `extractSourceFacts()` entry point
  facts.test.ts, provenance.test.ts, component-facts.test.ts
  __fixtures__/
    valid/                 — 6 real, correct usage fixtures
    edge-cases/            — 8 adversarial fixtures
```

Deviates slightly from the G-0 brief's suggested filenames (`extract-
jsx.ts` split further isn't needed; `facts.ts` is the orchestrator, and a
separate `component-facts.ts` holds the canonical-fact loader, since that
is a materially different concern — design-system facts, not source-file
extraction facts) — an explicitly sanctioned deviation ("exact filenames
may differ if repo conventions suggest something better").

No `packages/`, no monorepo boundary, no CLI file, no rule files — matches
`docs/architecture/guard-readiness-audit.md` §24's own recommendation
(`lib/guard/` inside this repo, not a separate package) and the G-0
brief's explicit prohibitions (Parts 27–29).

## 3. Parser approach (confirmed, not just planned)

**Zero new dependencies** — confirmed directly: `typescript` (resolved
version `5.9.3`, satisfying the `^5.5.4` `package.json` constraint) was
already installed; no `ts-morph`, Babel parser, SWC parser, or ESLint-
parser package was added.

`parse-source.ts` uses a real, minimal, single-file `ts.Program` (via a
hand-built `ts.CompilerHost` serving one in-memory file) rather than a bare
`ts.createSourceFile()` call — specifically so `program
.getSyntacticDiagnostics()` (fully public API) can be used for error
detection, instead of relying on the internal, undocumented `sourceFile
.parseDiagnostics` property some lighter-weight tools use. No filesystem
access, no `node_modules` resolution, no `tsconfig.json` consumption — this
tool never resolves imports against real files, only records their literal
specifier strings (module resolution belongs to `provenance.ts`, a
separate, explicit, narrowly-scoped step — see §5).

**`.ts` vs. `.tsx`:** `parse-source.ts` selects `ts.ScriptKind.TS` for
`.ts` and `ts.ScriptKind.TSX` for `.tsx` (and defaults to TSX for anything
else, since every real Skrewww/consumer source file this tool is meant to
analyze is one of those two extensions — confirmed via the Part 1 audit
below).

## 4. Part 1 audit — confirmed before writing any extraction code

- **TypeScript version:** `5.9.3` resolved (`npx tsc --version`), against
  a `^5.5.4` constraint in `package.json`.
- **Module resolution / import alias:** `tsconfig.json`'s own `paths`:
  `"@/*": ["./*"]` — confirmed this is the real, single alias convention
  used throughout the repo (`import { Button } from "@/components/ui/
  Button"`, `import { cn } from "@/lib/cn"`), by reading real source
  (`components/reference-app/RequestsDataView.tsx`) directly, not
  assumed.
- **Barrel export reality:** `components/ui/index.ts` is a real, simple,
  statically-analyzable re-export file (`export { Button } from
  "@/components/ui/Button";` — one line per component, no conditional or
  computed exports) — confirmed by reading it directly.
- **No prior TypeScript Compiler API usage anywhere in this repo**
  (confirmed via `grep -rl "from \"typescript\""` across `lib/`) — G-0 is
  the first consumer of it.
- **Existing test conventions followed:** paired `<name>.ts` +
  `<name>.test.ts` files (matching `lib/agent-kit/`'s own convention,
  e.g. `project-context.ts` / `project-context.test.ts`), pure functions
  taking already-gathered inputs rather than reading the filesystem
  themselves (matching `detectProjectContext`'s own documented
  discipline), and a confirmed-or-explicit-undefined return style rather
  than guessing (matching `Evidence<T>`'s `{status: "confirmed"} |
  {status: "unknown"}` shape, though G-0's own `JsxTagResolution` uses a
  discriminated union of concrete cases rather than that exact type,
  since "not yet resolved" here has more than two meaningfully different
  shapes — intrinsic, local-or-unresolved, member-expression).

## 5. Skrewww import provenance — the core false-positive safety mechanism

**The single rule that keeps `RequestForm`/`ReferencePageHeader`/any user
component from ever being flagged as an invented Skrewww component:** a
component/prop fact may only ever resolve to a real Skrewww slug through
an import whose **module specifier** matches a known Skrewww path —
**never through name matching alone.**

Confirmed, real, audited (not guessed) supported patterns for **internal
(this-repository) analysis**:

| Pattern | Example | Resolution |
|---|---|---|
| Direct file import | `import { Button } from "@/components/ui/Button"` | `internal-ui-direct`, resolves via the literal file base name |
| Barrel import | `import { Button } from "@/components/ui"` | `internal-ui-barrel`, resolves via the **imported** name (not the local alias) against the same file-path check |
| Anything else | `@/components/reference-app/RequestForm`, `./local-button`, a third-party package, `@/components/ui/internal/TreeItem` | `unknown` — never resolved, regardless of the imported identifier's name |

`resolveInternalComponentSlug()` (`provenance.ts`) turns a classified,
known-Skrewww-path import into a real registry slug **only if** the
resulting candidate file path (`components/ui/<Name>.tsx`) actually
appears in some real registry entry's `files` array — so even a
plausible-looking fake (`import { CommandPalette } from "@/components/ui/
CommandPalette"`) correctly resolves to `undefined`, proven directly by a
test (`provenance.test.ts`).

**Explicit, honest limitation recorded (not solved here), matching the
readiness audit's own finding:** the `@/components/ui` prefix is fixed
and safe to hardcode for analyzing **this repository's own source** only.
An external consumer project's alias root is configurable via their own
`components.json` — `@/components/ui` is the **documented default**
(`docs/architecture/shadcn-distribution.md`), not a guarantee. G-0's
`classifyInternalImportProvenance` is explicitly named `*Internal*` for
this reason; a consumer-mode prefix matcher, if ever built, needs its own
caller-supplied prefix list, never an assumed universal one. This is
recorded as real G-1/G-2 scope, not invented here.

## 6. Extraction capabilities — confirmed via tests, not asserted

### Imports (Part 5/`extract-imports.ts`)

All four `ImportKind`s extracted, distinguishing imported name from local
binding name in every case:

- Named (`import { Button } from "..."`) — `importedName === localName`
- Named-aliased (`import { Button as PrimaryAction } from "..."`) —
  `importedName: "Button"`, `localName: "PrimaryAction"`
- Default (`import Default from "..."`) — `importedName: "default"`
  (a synthetic literal, since there's no real exported name to preserve)
- Namespace (`import * as NS from "..."`) — `importedName: "*"`

Combined declarations (`import Default, { Named } from "..."`) correctly
produce two independent `ImportFact`s from the one declaration, matching
real TypeScript AST shape (`ImportClause.name` and `.namedBindings` can
both be present). Dynamic/computed module specifiers
(`import(someVariable)`-shaped or non-string-literal specifiers) are
skipped, never guessed.

### JSX elements and tag resolution (Part 7/`extract-jsx.ts`)

Four-way `JsxTagResolution`:

- **`intrinsic`** — lowercase tags (`<div>`, `<button>`), never checked
  against imports at all (matches JSX's own case-sensitivity convention).
- **`imported`** — a capitalized tag whose local identifier matches a
  real `ImportFact` in the same file. Structural resolution only — this
  does **not** itself assert Skrewww provenance; that's a separate,
  explicit step (§5).
- **`local-or-unresolved`** — a capitalized tag with no matching import
  (a locally-declared component, most commonly) — **never** treated as a
  Skrewww reference merely because the name matches.
- **`member-expression`** — `<UI.Button />`-shaped tags. Represented
  (tag text preserved), never resolved to an import. **Confirmed not
  needed for v0.1:** no real Skrewww import convention anywhere in this
  codebase produces a namespace-import-plus-dot-access JSX usage (grep-
  confirmed during the readiness audit and reconfirmed here) — building
  real resolution for this shape now would be speculative. Fixture:
  `edge-cases/member-expression-jsx.tsx`.

**Wrapper components never get resolved into** (Part 11) — proven by
`edge-cases/wrapper-component.tsx`: `<MyButton fakeProp="x" />` (outer,
no matching import → `local-or-unresolved`) and the real `<Button
{...props} />` inside `MyButton`'s own body (inner, correctly resolves to
`button`) are extracted as two **independent** `JsxElementFact`s. The
extractor achieves this simply by never following control flow — each
JSX element's own literal tag and attributes are read in isolation,
regardless of what function body contains it.

**Local name collisions never get resolved as Skrewww** (Part 12) —
proven by two distinct fixtures: `edge-cases/local-button-name.tsx` (a
locally-*declared* `function Button() {}`, no import at all — resolves
`local-or-unresolved`) and `edge-cases/local-button-import.tsx` (`Button`
imported, but from `"./local-button"` — resolves `imported` structurally,
but `resolveInternalComponentSlug` correctly rejects the non-Skrewww
module path, returning `undefined`). Both cases are needed and distinct:
the first tests JSX-tag resolution, the second tests provenance
rejection.

### JSX attributes (Part 9)

Four `JsxAttributeValueKind`s: `boolean-shorthand` (`disabled`),
`static-string` (`size="sm"`, decoded value captured — see §7's note on
why), `dynamic` (`size={value}` — name known, value never captured,
matching the G-0 brief's own example exactly), `spread` (`{...props}` —
**no name, no expansion, ever**).

**Spread safety proven, not just designed** (Part 10) —
`edge-cases/spread-props.tsx`'s test asserts the spread fact has no
`name` property at all (`expect(...).not.toHaveProperty("name")`), and
that it coexists correctly alongside an explicit literal attribute on the
same element (`<Button {...props} variant="primary" />` → one spread
fact, one static-string fact, both present, neither absorbing the
other).

### Barrel/re-export resolution (Part 13) — SUPPORTED

**Decision: SUPPORTED, without full module resolution.** Evidence: the
same file-path check used for direct imports (`components/ui/<Name>.tsx`
present in a real registry entry's `files`) also answers barrel imports —
`import { Button } from "@/components/ui"` resolves because "Button" (the
*imported* name, not the local alias) maps to the same real file path a
direct import of it would. This required **zero** parsing of
`components/ui/index.ts`'s own AST and **zero** general project module
resolution — proven by `facts.test.ts`'s `barrel-import.tsx` case (two
real components, `Button` and `Card`, both correctly resolved) and
`provenance.test.ts`'s aliased-through-barrel case.

## 7. Attribute value capture — a deliberate, documented choice

`static-string` attributes capture the decoded literal value (e.g.
`"primary"`), not just the name. This was reconsidered explicitly against
the readiness audit's own security recommendation ("never echo back
matched source text" — `guard-readiness-audit.md` §31) before deciding to
keep it: that recommendation is scoped to a future **diagnostic/CLI
output** layer (G-2, not built here), not to what this **internal
extraction** data structure is allowed to compute. No locked v0.1 rule
reads `value` at all (every one only checks attribute *names* — see the
readiness audit §10's explicit "v0.1 only checks prop names, never
values"); it's captured now, cheaply, so a possible future value-
validation rule (currently DEFERRED, not proposed for v0.1) doesn't need
this module re-parsed later. `lib/guard/types.ts`'s own JSDoc on this
field records this reasoning inline, not just here.

## 8. Canonical fact loader (Parts 14–16)

One normalized `ComponentFact` shape (`slug`, `displayName`, `status`,
`installable`, `publicPropertyNames`) — deliberately narrow, containing
only what the 7 locked v0.1 rules need. No Shape, Surface, Figma, or
accessibility field — those rule candidates are DEFERRED
(`guard-readiness-audit.md` §6/§7), and adding fields for them now would
be exactly the speculative schema growth both PH-0 and the readiness
audit warn against.

**Internal mode** (`loadInternalComponentFacts()`): reads `lib/
component-registry.ts`'s `componentRegistry` directly. `installable`
**reuses** `isDistributedViaSkrewwwRegistry()` from `lib/agent-kit/
project-context.ts` — imported, not reimplemented, so this loader can
never drift from that function's own definition of "installable." Proven
against real registry data: Button resolves `status: "stable"`,
`installable: true`; a banking component resolves `installable: false`
(implemented, deliberately not distributed); a nonexistent slug resolves
`undefined`.

**Consumer/external mode**: two pure builder functions —
`componentFactFromIndexEntry()` (partial facts, **no** `installable` —
the lightweight `index.json` genuinely doesn't carry that signal) and
`componentFactFromContract()` (full facts, including `installable`, from
a complete per-component contract). Both proven against **real,
currently-generated artifacts on disk** (`public/agent/index.json`,
`public/agent/contracts/button.json`) — not invented sample data. A test
confirms consumer-mode and internal-mode `installable` agree for the same
real component (both ultimately trace to the same underlying `files`
signal).

**Packaging debt recorded, not solved:** a real external CLI validating
many files would need a fetching/caching strategy for contracts (eager
vs. lazy per-referenced-slug) — explicitly G-2/G-3 scope, unsolved here,
matching the readiness audit's own §14/§15 findings.

## 9. Golden fixture set (Parts 18–19) — all 14 built, no placeholders

```
lib/guard/__fixtures__/
  valid/
    direct-import.tsx              — #1 direct known Skrewww import
    aliased-import.tsx             — #2 aliased known import
    barrel-import.tsx              — barrel resolution (Button + Card)
    boolean-prop.tsx                — #9 boolean shorthand
    multiple-components.tsx         — #11 three distinct components, one file
    native-elements.tsx             — #12 ordinary lowercase HTML elements
  edge-cases/
    spread-props.tsx                — #6/#7 spread + explicit prop together
    wrapper-component.tsx           — #5 wrapper around a Skrewww primitive
    local-button-name.tsx           — #4 locally-declared same-name component
    local-button-import.tsx         — #3 same name, imported from a local module
    dynamic-prop-value.tsx          — #8 dynamic prop value
    malformed-source.tsx            — #10 malformed TSX / real parse error
    default-and-namespace-import.tsx — default + namespace import extraction
    member-expression-jsx.tsx       — <UI.Button /> represented, unresolved
```

All 12 numbered scenarios from the G-0 brief's Part 19 checklist are
covered (2 of the 14 files exist purely to prove general import-kind
extraction beyond the Skrewww-specific scenarios). `malformed-source.tsx`
and its sibling fixtures are excluded from the repo's own
`lint`/`typecheck` gates (`eslint.config.js`, `tsconfig.json` — the
malformed one is *supposed* to fail parsing; including it in the
project-wide sweep would fail CI on content that's deliberately invalid)
— a real, necessary, minimal-scope change, not scope creep.

## 10. Extraction test evidence

**35 new tests, all passing** (`facts.test.ts`: 16, `provenance.test.ts`:
12, `component-facts.test.ts`: 7), using
targeted assertions (`expect.objectContaining`, exact array/object
equality on the specific fact being tested) rather than giant serialized
snapshots, per instruction.

Two real bugs were found and fixed **in the test assertions themselves**
during this work — not in the extraction code, which was correct both
times:

1. A test assumed Button's canonical `status` was `"beta"`; the real
   value (confirmed directly from `lib/component-registry.ts`) is
   `"stable"`. Fixed the test.
2. A test assumed a default-kind import from a **direct** file path
   (`@/components/ui/Button`) should resolve to `undefined`. On
   reflection this was the wrong expectation: for a direct path, the
   *path itself* unambiguously names one file, regardless of import
   kind — `resolveInternalComponentSlug` correctly resolves it via path,
   a structural fact, not a claim that the import is semantically valid
   (Button.tsx has no real default export; that's a different, unbuilt
   rule's concern, not G-0's). Rewrote the test to correctly distinguish
   this from the *barrel* case (where `importedName` genuinely is the
   literal string `"default"`/`"*"`, which **is** correctly rejected).

## 11. Determinism proof

`facts.test.ts`'s determinism suite runs `extractSourceFacts()` twice on
every one of the 14 fixtures and asserts deep equality — mirroring the
same "run twice, diff" discipline `lib/agent-kit/retrieval.test.ts` uses
for generated Agent Kit artifacts. No timestamps, random IDs, filesystem-
order dependence, or locale-sensitive output exist anywhere in the
extraction path (confirmed by code inspection — nothing in `lib/guard/`
calls `Date`, `Math.random`, `crypto.randomUUID`, or reads directory
listings).

## 12. Performance sanity (Part 24)

Ran `extractSourceFacts()` (via a throwaway, not-committed script) against
every real `.tsx` file in `components/ui/` and `components/reference-app/`
— **127 files, 1,453 imports extracted, 1,608 JSX elements extracted, zero
parse failures, 364ms total (≈2.9ms/file).** This is stronger evidence than
the 14 curated fixtures alone: it proves the extractor handles the full
real diversity of this codebase's actual production JSX/TSX, not just
hand-picked adversarial shapes. No pathological behavior observed; no
optimization attempted, per instruction.

## 13. Offline and security guarantees (Parts 25–26)

Confirmed by direct code inspection (`grep -rn "fetch(\|http\.\|https\.\|
process\.env\|XMLHttpRequest" lib/guard/*.ts`, excluding test files):
**zero matches** — no network call, no environment-variable read,
anywhere in the implementation. Every test in `lib/guard/*.test.ts` runs
against in-memory strings or already-generated local files
(`public/agent/*`), never a live fetch. See §7 above for the reasoning on
why capturing literal attribute values internally does not violate the
"don't echo source unnecessarily" principle (that principle governs a
future diagnostic/output layer, not this internal data structure).

## 14. Unsupported / explicitly-deferred extraction cases

Recorded honestly, not silently absent:

- **Full recursive project module resolution** — never attempted;
  import provenance is a fixed-prefix string match, not real TypeScript
  module resolution (Part 13's own instruction: "do not implement
  recursive project module resolution unless required" — the barrel case
  didn't require it).
- **Wrapper-component prop forwarding** — by design, never traced (§6,
  Part 11) — this is the load-bearing false-positive protection, not a
  gap.
- **Prop *value* validation** — attribute names are extracted; values are
  captured for static strings but no rule (none exist in G-0) validates
  them against anything.
- **`<UI.Button />` member-expression resolution** — represented, not
  resolved; confirmed unnecessary for any real, audited Skrewww import
  convention.
- **Consumer-project alias configurability** — `provenance.ts`'s known-
  path list is explicitly internal-repo-only; an external consumer mode
  needs its own, differently-sourced prefix list (G-1/G-2 concern).

## 15. G-1 readiness gate

Re-checked against every criterion in the readiness audit's own §36
prerequisite list:

| Criterion | Status |
|---|---|
| Parser is deterministic | ✅ §11 |
| Import provenance is represented | ✅ §5 |
| Alias imports proven | ✅ §6, `aliased-import.tsx` |
| JSX elements extracted | ✅ §6 |
| Explicit prop names extracted | ✅ §6 |
| Spreads preserved as unknown | ✅ §6, `spread-props.tsx` |
| Wrappers do not create direct-component false positives | ✅ §6, `wrapper-component.tsx` |
| Local name collisions protected | ✅ §6, both local-name fixtures |
| Canonical fact loader does not duplicate truth | ✅ §8 — reuses `isDistributedViaSkrewwwRegistry`, reads real generated artifacts |
| Adversarial fixture set passes | ✅ §9/§10 — all 14 fixtures, 35 tests, green |
| No network/LLM dependency | ✅ §13 |
| No new parser dependency | ✅ §3 |

**PASS — G-1 (locked rule implementation) is unblocked**, pending
explicit human approval to begin it (not granted by this document).

## See also

- `docs/architecture/guard-readiness-audit.md` — the audit this document
  fulfills the locked prerequisites of; not duplicated here except where
  directly relevant.
- `docs/architecture/pre-guard-hardening.md` — original source-of-truth
  map.
- `lib/agent-kit/project-context.ts` — `isDistributedViaSkrewwwRegistry`,
  reused directly by `component-facts.ts`, never reimplemented.
- `lib/agent-kit/contract-schema.ts` — `ComponentAgentContract`/
  `AgentContractIndexEntry`, the real generated shapes the consumer-mode
  loader is proven against.

## 16. G-1 (locked rule implementation) — ✅ COMPLETE

**Phase:** G-1 ✅ COMPLETE (`EVALUATE RULES` stage added on top of G-0's
`PARSE → EXTRACT FACTS`; still no `DIAGNOSTICS`/CLI/CI stage — that is
G-2, not started).

**G-1A (2026-09-17):** `api/nonexistent-prop` was **formally deferred from
the revised Guard v0.1 set** after a type-aware feasibility pass. See
§16.1. Catalog remains **6 approved ERROR rules**.

Built against the readiness audit's original locked IDs; governance
outcome after G-1A:

| Rule ID | Domain | Status |
|---|---|---|
| `component/nonexistent-slug` | public | ✅ approved v0.1 |
| `api/nonexistent-prop` | public | ⛔ **DEFERRED post-v0.1** (G-1A) — `lib/guard/rules/api-nonexistent-prop.ts` |
| `maturity/false-stable-claim` | public | ✅ approved v0.1 |
| `distribution/false-installable-claim` | public | ✅ approved v0.1 |
| `token/undeclared-css-var` | internal | ✅ approved v0.1 |
| `distribution/hostrequirements-leak` | internal | ✅ approved v0.1 |
| `distribution/hosthost-schema-consistency` | internal | ✅ approved v0.1 |

**Spelling check performed as instructed:** `distribution/hosthost-
schema-consistency`'s doubled "host" was verified against both `pre-
guard-hardening.md` and this audit — it appears consistently, is not a
typo, and was kept verbatim.

**`api/nonexistent-prop` DEFERRED (not implemented):** see §16.1. No rule
logic exists for it; absent from `GUARD_RULE_CATALOG` (length 6).

**Deferred rules confirmed absent** (`distribution/missing-registry-
dependency`, `token/hardcoded-primitive-where-provable`, `api/icon-only-
button-missing-name`, `accessibility/table-role-grid-misuse`) —
structurally proven by `lib/guard/evaluate.test.ts`'s own "no deferred
rules were implemented" test, not just a docs claim. `api/nonexistent-prop`
is additionally asserted deferred (no `evaluate*` export).

### 16.1 G-1A — `api/nonexistent-prop` formal deferral

**Outcome B.** Implementation evidence refined the readiness audit's
original 7-rule locked set to **6 approved v0.1 rules**.

| Experiment | Result |
|---|---|
| Canonical `api.properties` allow-list as ERROR | **Reject** — false positives on legal inherited props (`className`, `onClick`, …); PH-0 already said this field is not proof of invalidity |
| Manual React/DOM attribute allow-list | **Reject** — explicitly forbidden by G-1 / G-1A |
| Project `ts.Program` + `TypeChecker` prop existence | **Reject for v0.1** — (1) duplicates precise `TS2322` already emitted by typecheck; (2) Button's real props type does **not** accept `data-testid` (`getPropertyOfType` missing; `tsc` rejects it), failing the G-1A VALID gate; (3) requires full project resolution, not G-0 single-file; (4) answers **local** accepted types (shadcn copies), not canonical Skrewww API |

**Canonical vs local:** readiness audit wording targeted model A
(canonical `api.properties`). Type-aware checking is model B (local TS).
They must not be conflated under the same rule ID without an explicit
architecture decision — not taken for v0.1.

**Component prop-type patterns audited (representative):** Button
(`ButtonHTMLAttributes` intersection), Text Input / Textarea (native
control omit + label fields), Select (`SelectHTMLAttributes` omit),
Table (`ComponentPropsWithoutRef<"table">`), Dialog root (custom
`DialogProps`, non-DOM wrapper), DrawerTrigger (compound barrel export).

Full rationale: `lib/guard/rules/api-nonexistent-prop.ts`.

**Absolute stop:** G-2 remains NOT STARTED until human approval after this
governance state is explicit (now: G-1 COMPLETE with 6-rule revised set).

### Architecture added

```
PARSE → EXTRACT FACTS → EVALUATE RULES
```

- `lib/guard/rule-types.ts` — `RuleId`, `RuleSeverity` (`"error"` only —
  no WARNING/INFO in this locked set), `RuleDomain` (`"public"` |
  `"internal"`), `Finding`, `RuleEvaluation` (`violation` | `pass` |
  `not-applicable` | `unknown` — "unknown is never a violation" carried
  from G-0).
- `lib/guard/rules/*.ts` — one file per implemented rule.
- `lib/guard/rules/index.ts` — `GUARD_RULE_CATALOG`, 6 entries.
- `lib/guard/evaluate.ts` — three entry points matching three genuinely
  different input shapes, never forced through one: `evaluateSourceRules`
  (per-file, source-based), `evaluateStructuredClaims` (explicit claim
  objects — maturity/installability claims are never inferred from
  freeform prose), `evaluateInternalRegistryRules` (this-repo-only, reads
  `public/r/*.json` and `public/agent/contracts/*.json` via the new
  `lib/guard/generated-artifacts.ts` loaders).
- `lib/css-custom-properties.ts` — `extractCssVarRefs`, extracted (not
  forked) from `lib/component-registry.test.ts`'s own private scanner so
  the rule and the existing registry-accuracy test share one
  deterministic implementation.
- `lib/guard/structured-claims.ts` — `MaturityClaim`, `InstallabilityClaim`.

### Provenance safety — compound-component fix

G-0's `resolveInternalComponentSlug` assumed a barrel-imported name
always equals some component's own file base name. Running the full
rule pipeline against every real `.tsx` file in `components/ui/` and
`components/reference-app/` (127 files, not just curated fixtures)
proved this false: `import { DrawerTrigger } from "@/components/ui"` is
a real, legitimate import in this repo's own
`components/reference-app/RequestsDataView.tsx` — `DrawerTrigger` is one
of nine names (`Drawer`, `DrawerBody`, `DrawerClose`,
`DrawerDescription`, `DrawerFooter`, `DrawerHeader`, `DrawerTitle`,
`DrawerTrigger`, plus `Drawer` itself) all re-exported from the *same*
`Drawer.tsx` file — and was false-flagged as an invented component.

Fixed by having `provenance.ts` parse the real barrel file
(`components/ui/index.ts`) itself with G-0's own parser, building a
genuine `exportedName -> fileBaseName` map from its actual
`export { A, B, C } from "@/components/ui/X"` statements
(`barrelReexportToFileBaseName`) — the real, canonical source of truth
for which name comes from which file, not a naming guess. A new shared
`resolveImportedFileBaseName` (used by both `resolveInternalComponentSlug`
and the rule's internal-helper fallback check) applies this translation
consistently. Regression-covered by
`lib/guard/__fixtures__/g1/compound-component-barrel-import.tsx` and
`component-nonexistent-slug.test.ts`'s corresponding case.

This is the same "test against the real repo, not only curated
fixtures" methodology that also caught three earlier provenance bugs
during this phase (undistributed-but-implemented components needing a
`reactExample`-based fallback; that fallback needing `entry.files`
checked first, not replaced; internal helpers like `icons.tsx` needing a
Category-C not-applicable path, not a violation) — all fixed the same
way, all real-repo-proven, none present in the final `0 violations`
state below.

### Adversarial + release-critical evidence

- Adversarial test matrix across all 6 implemented rules (component
  identity, native/inherited props N/A since that rule is blocked,
  maturity, installability, tokens, distribution) — 82 tests in
  `lib/guard/`, all green.
- Release-critical zero-findings fixture
  (`lib/guard/__fixtures__/g1/zero-findings-realistic.tsx`) — aliased
  import, wrapper component, spread props alongside explicit props,
  aria-/data- attributes, dynamic prop values — produces zero violations
  across every source rule, every internal-registry rule, and every
  truthful structured claim. Verified non-vacuous by temporarily
  injecting a fake nonexistent-component element and confirming the test
  fails, then restoring the fixture.
- Running the full pipeline against all 127 real `.tsx` files in
  `components/ui/` and `components/reference-app/`: **0 violations**
  (down from 113 across the bug-fixing sequence above).
- Determinism: `evaluateSourceRules`/`evaluateInternalRegistryRules`/
  `evaluateStructuredClaims` proven deep-equal across repeated runs, for
  every G-0 + G-1 fixture and against the real repo.
- No new dependency — TypeScript Compiler API only (already installed);
  `package.json`/`package-lock.json` unchanged.
- No CLI, no `npm guard` script, no CI integration, no editor
  integration, no MCP, no LLM validation, no Shape/Surface/accessibility
  rules — none built, none present in this diff.

### G-1 gates run clean

`npm run lint`, `npm run typecheck`, `npm test` (1240 passed), `npm run
build` (includes `generate:registry` + `generate:agent-context` as
prebuild steps — registry stayed at 53 items + `registry.json`, Agent
contracts stayed at 55), `git diff --check` — all clean.

**Absolute stop boundary honored at G-1 ship: G-2 / G-3 / CI / public
release were not started in that commit.** G-2 was approved and completed
separately — see §17.

---

## 17. G-2 — Diagnostics + CLI (COMPLETE)

**Phase:** G-2 ✅ COMPLETE (`DIAGNOSE` + human formatter + local CLI).
**Does not start G-3, CI integration, or public release.**

### Pipeline

```
PARSE → EXTRACT FACTS → EVALUATE RULES → DIAGNOSE → FORMAT
```

### Architecture

| Module | Role |
|---|---|
| `lib/guard/diagnostics.ts` | `GuardDiagnostic` (§17 contract), `findingToDiagnostic`, deterministic sort |
| `lib/guard/format.ts` | Human-readable formatter + summary (`formatGuardResult`) |
| `lib/guard/run.ts` | `runGuard(...)` programmatic API — findings, execution errors, evaluated rule IDs, summary, exit code |
| `lib/guard/cli.ts` | Arg parsing, help, exit-code wiring |
| `lib/guard/discover.ts` | `.ts`/`.tsx` discovery; skips `node_modules`, `.next`, `dist`, `build`, `coverage`, … |
| `lib/guard/claims-file.ts` | Narrow JSON structured-claims **data** loader (not config) |
| `lib/guard/paths.ts` | Project-relative path normalization |
| `lib/guard/version.ts` | `GUARD_TOOL_VERSION = "0.1.0-beta.1"` |
| `scripts/guard.ts` | Thin entry → `npm run guard -- …` |

Rule evaluators still emit machine `Finding`s only. Presentation
(message / remediation) is exclusively the diagnostic adapter's job.

### Diagnostic contract

Required: `ruleId`, `severity` (`error` \| `warning` \| `info`), `message`,
`subject`, `evidence.source`. Optional: `location` (`file`, 1-based
`line`/`column`), `evidence.sourceGitSha`, `remediation`. No giant
canonical payloads.

v0.1 ships ERROR rules only; WARNING/INFO vocabulary is reserved.

### Modes / domains

- **Consumer (default):** `component/nonexistent-slug` on discovered
  source; optional `--claims` for maturity/installability structured data.
- **`--internal`:** `token/undeclared-css-var`,
  `distribution/hostrequirements-leak`,
  `distribution/hosthost-schema-consistency` against this repo's
  registry/artifacts only.

`--claims` + `--internal` is a usage error. Internal rules never run in
consumer mode.

### Exit codes

| Code | Meaning |
|---|---|
| 0 | No ERROR findings |
| 1 | One or more ERROR findings |
| 2 | Tool/parse/input failure (missing path, unreadable file, malformed TS/TSX, invalid CLI/claims JSON) |

Parse failures are **not** rule violations: reported as `tool/parse`,
exit 2, and rules are not evaluated against that file.

### Deferred / absent (unchanged)

- `--json` CLI flag — deferred (use `runGuard()` for structured results)
- Config / suppressions — none
- `api/nonexistent-prop` — deferred; absent from catalog, help, diagnostics
- CI workflows — untouched
- Public npm publish / website promotion — not done

### Invocation

```
npm run guard -- [path]                 # default path: cwd
npm run guard -- --internal [path]
npm run guard -- [path] --claims claims.json
```

Provenance remains conservative: unknown import paths → no finding.

### Gates

`npm run lint`, `npm run typecheck`, `npm test` (**1267** passed; 1240 G-1
baseline + G-2 diagnostics/CLI tests), `npm run build`,
`generate:registry` (53 items + index), `generate:agent-context` (55
contracts), `git diff --check` — all clean. No new runtime dependencies.
Performance sanity (local): fixtures ~210ms, `components/reference-app`
~100ms, `components/ui` ~1s, `--internal` ~165ms.

### Absolute stop

**At G-2 ship:** G-3 / CI / public release were not started. G-3 was
approved and completed separately — see §18.

---

## 18. G-3 — Pilot / Release Validation (COMPLETE)

**Phase:** G-3 ✅ COMPLETE.
**Release verdict:** **CONDITIONAL RELEASE READY**
**Guard remains NOT RELEASED. CI unchanged. No npm publish.**

### What G-3 did

Piloted the six-rule v0.1 engine against real repo code, adversarial
fixtures, process-level CLI exits, privacy/offline/determinism gates, and
packaging/fact-distribution honesty. Allowed hardening only (path privacy
for outside-root paths; help honesty for TypeScript / a11y / Figma
non-claims). No new rules. No CI. No publish.

### Draft future public usage (architecture only — not announced)

```
npm run guard -- [path]
npm run guard -- --internal [path]
npm run guard -- [path] --claims claims.json
```

Guard checks deterministic Skrewww canonical-contract violations (six ERROR
rules). It does **not** replace TypeScript, validate accessibility/WCAG,
or check Figma/Shape/Surface/visual parity. Claims JSON is input **data**,
not configuration. Exit codes: 0 / 1 / 2. Offline/local only.

### Pilot matrix

| Gate | Result |
|---|---|
| A Rule safety | PASS |
| B False-positive rate | PASS (0 FP on Reference App, `components/ui`, adversarial fixtures) |
| C False-negative scope honesty | PASS (documented accepted misses) |
| D CLI UX | PASS |
| E Exit behavior | PASS (process-spawn proven) |
| F Diagnostic quality | PASS |
| G Determinism | PASS |
| H Privacy | PASS (G-3 outside-root basename hardening) |
| I Offline | PASS |
| J Performance | PASS (fixtures ~58ms, ref ~34ms, ui ~317ms, internal ~27ms) |
| K Consumer fact availability | **PASS WITH DEBT** — in-repo only today |
| L Packaging feasibility | **PASS WITH DEBT** — `skrewww-docs` private, no `bin` |
| M Documentation accuracy | PASS |
| N Test reliability | PASS (`lib/guard/release-validation.test.ts`) |

### Release blockers (must fix before *public* release)

1. **External canonical-fact packaging** — consumer mode + claims load
   `loadInternalComponentFacts()` → in-repo `componentRegistry`. An
   externally installed Guard would not automatically have those facts.
2. **Provenance prefixes are internal conventions** (`@/components/ui`) —
   true external consumers need an explicit, documented provenance model
   (unknown today = no finding, correctly, but also means weak external coverage).
3. **Package exposure** — repo is `private: true`, no `bin`, no Guard-focused
   publish surface. `npm pack --dry-run` would ship the docs site, not a
   Guard tool package.

### Accepted debt (post-v0.1 / pre-release prep)

- `--json` deferred
- No `skrewww guard` bin yet
- `api/nonexistent-prop` deferred
- Known false-negatives: invalid props, spread-contained facts, wrapper
  propagation, freeform maturity prose, unsupported import aliases,
  Shape/Surface/a11y

### Accepted false-negative scope (not blockers)

Matches locked v0.1: no prop rule; unknown provenance → no finding; no
prose scanning; no a11y/Figma rules.

### Unknown behavior

`RuleEvaluation` statuses `not-applicable` / `unknown` never become
diagnostics. CLI does not invent WARNING noise for unknowns.

### Parse isolation

Directory with valid + invalid sources: valid files still evaluated;
parse failures reported as `tool/parse`; overall exit **2** (not 1).

### Packaging / bin decision

**Do not add bin in G-3.** Outcome: packaging work required before public
CLI (`B`/`C`). Local `npm run guard` is sufficient for in-repo pilot.

### Proposed release sequence (planning only — not executed)

1. Package/fact-bundle strategy for external mode
2. Provenance model for consumer aliases
3. Thin `bin` or separate package decision
4. Public docs (after approval)
5. Beta version confirm (`0.1.0-beta.1`)
6. Publish only with human approval
7. CI adoption later: observe → optional → required

### CI-adoption recommendation (planning only)

Do **not** add Guard to Skrewww CI yet. After a public/internal Beta
period with zero unexplained FPs, consider observe-only, then optional,
then required.

### Absolute stop

**GUARD PRE-RELEASE HARDENING / v0.1 RELEASE PREPARATION — NOT STARTED.**
No publish. No CI workflow edits. No post-v0.1 rules.
