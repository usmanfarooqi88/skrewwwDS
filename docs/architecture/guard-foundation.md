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
