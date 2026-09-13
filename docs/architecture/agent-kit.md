# Skrewww Agent Kit — architecture (AK-1)

## What this is

A deterministic, build-time compiler that projects the two existing
canonical design-system sources — the component registry
(`lib/component-registry*.ts`) and authored docs (`content/*.ts`) — into a
machine-readable **Agent Contract** per component, plus one authored
**System Contract**. Output is local-only (`public/agent/`, gitignored, not
publicly routed) as of AK-1.

Agent Kit is **not** a second registry, not an enforcement engine, not an
MCP server, not a CLI, and not a source of truth. It adds exactly one new
authored file (`lib/agent-kit/system-contract.ts`) and zero new sources of
truth — see the AK-0 architecture audit for the full boundary rationale.

## Why this exists

An AI coding agent asked to "build a settings form using Skrewww" needs to
know which components are real, what their actual props are, which tokens
they genuinely consume, and what judgment (when to use / when not to /
common mistakes) a human already wrote down — without loading the entire
design system into every prompt, and without inventing plausible-sounding
answers when a fact isn't modeled. That's what a Component Contract is for.

## Source-of-truth ownership

| Data | Owner | Agent Kit role |
|---|---|---|
| Component existence, API (`apiProps`), status, version, `tokensUsed` | `lib/component-registry*.ts` | consume (canonical) |
| Usage judgment (`purpose`, `whenToUse`, `whenNotToUse`, `commonMistakes`, `accessibility` narrative) | `content/*.ts` (`ComponentDoc`) | consume (canonical) |
| System-level agent policy (never-invent rules, Shape/Surface framing, naming rules) | `lib/agent-kit/system-contract.ts` | **own** — the one new authored artifact |
| Compiled contracts | `public/agent/**/*.json` | own (generated, never hand-edited) |

`lib/component-registry*.ts` and `content/*.ts` are never modified by the
compiler or generator — see `docs/architecture/source-of-truth.md`, which
this document defers to for general conflict-resolution rules and does not
restate.

## The R1 token-precedence rule (locked)

`tokensUsed` exists on **both** the registry entry and its `ComponentDoc`,
and they answer different questions:

- **`registry.tokensUsed`** — the canonical, machine-readable token
  dependency set. For components with a dedicated registry test (Avatar,
  Calendar Day, Pagination as of AK-1), this is **verified against live
  Figma bindings**, not merely "whatever the component's own CSS module
  happens to reference" — a real component's stylesheet can reference
  fallback/computed CSS custom properties that are genuinely rendered but
  were deliberately excluded from a prior Figma-verification pass. For
  every other component, it reflects tokens confirmed against the
  component's actual implementation at reconciliation time.
- **`content.tokensUsed`** — authored/editorial metadata, a human-curated
  (often partial) subset shown in prose documentation.

**Rule:** `content.tokensUsed ⊆ registry.tokensUsed` for every joinable
pair. Equality is not required — a docs entry may intentionally show only
a representative subset. The compiler enforces this defensively at compile
time (`compileComponentContract` throws a `ContractCompilerError` naming
the exact offending token, rather than silently emitting a contract with
contradictory guidance) even though the 2026-09-13 reconciliation pass
already brought all 47 joinable pairs into compliance.

**Never:** merge the two arrays, union them, parse an "A → B" annotation
string as two tokens, or add a per-component exception. A violation means a
source is stale and must be corrected at the source — see the
2026-09-13 reconciliation commit for the worked examples (12 components,
4 classifications: registry-stale, content-stale, formatting-only, and the
"content named a real token but the registry entry is Figma-binding-locked
narrower than the CSS" case found on Avatar/Pagination).

## Compiled fields vs. deliberately unmodeled fields

**Compiled (AK-1):** identity, status/version/availability, `apiProps`
→ `api.properties`, `tokensUsed` → `tokens.used` (registry-only),
`supportedVariants`/`supportedSizes`, sparse behavioral metadata (keyboard/
focus/dismissal/motion/announcement — omitted, never fabricated, when
absent), Figma reference (`figma.verified: false` when no `figmaNodeId`
exists — never assumed true), distribution/CLI-resolution fields (omitted
entirely when the registry carries none), `relatedComponents`,
`openQuestions`, and the authored guidance fields from `ComponentDoc`.

**Deliberately NOT modeled in AK-1** (see AK-0 §"DO NOT INVENT" and the
approved AK-1 scope): component **states** (a Figma variant is not
automatically a React prop, and no `states` field exists on either
canonical source to compile from), **Slots**, **composition structures**,
**forbidden patterns**, **responsive contracts**. Inventing any of these
would mean fabricating data no canonical source currently carries —
deferred to AK-4 (recipes/composition) once a real source exists.

The known `supportedStates = supportedVariants` debt in
`lib/registry-public.ts` (the **public** `/registry.json` projection) is
separate from this document's `tokens.used`/API modeling and is
intentionally **not** consumed, copied, or repaired by Agent Kit.

## Determinism and provenance

The compiler (`lib/agent-kit/contract-compiler.ts`) is pure: given the same
`componentRegistry`/`allComponents` module state and the same
`{ sourceGitSha, sourceGitCommitTimestamp }` options, it produces
byte-identical output on every call — no wall-clock timestamps, no
randomness, no non-deterministic iteration order (it walks
`componentRegistry`'s own declared array order). The generator script
(`scripts/generate-agent-context.ts`) is the only I/O-performing layer: it
resolves `git rev-parse HEAD` and the commit's own ISO 8601 committer date
(`git log -1 --format=%cI`) — never `new Date()` at generation time — and
writes files.

Every emitted contract and the index carry a `provenance` block
(`schemaVersion`, `generatorVersion`, `sourceGitSha`,
`sourceGitCommitTimestamp`) so a consumer can detect staleness.

## Generated output

```
public/agent/
├── index.json              # allow-list: every component's slug/name/category/status + apiPropertyNames
├── system.json              # the compiled systemAgentContract
└── contracts/
    └── <slug>.json          # one ComponentAgentContract per registry entry
```

`public/agent/` is gitignored (same treatment as `public/r/` for the
shadcn distribution layer) and **not** publicly routed as of AK-1 — no
`app/agent*` route exists. Regenerate with `npm run generate:agent-context`.
This is intentionally **not** wired into `npm run build`, unlike
`generate:registry` — AK-1 output has no current consumer that needs it
present at build time, and keeping it opt-in avoids coupling the existing
`/registry.json` / `/r/*` / `/llms.txt` build surfaces to a new,
still-unconsumed artifact.

## Schema versioning

`CANONICAL_AGENT_CONTRACT_SCHEMA_VERSION` (`lib/agent-kit/contract-schema.ts`,
starting at `1.0.0`) versions the shape of `ComponentAgentContract` /
`SystemAgentContract` / `AgentContractIndex`. It is independent of, and must
never be conflated with:

- `CANONICAL_REGISTRY_SCHEMA_VERSION` (`lib/component-registry.ts`) — versions the canonical registry entry shape.
- `PublicRegistryMetadata.schemaVersion` (`lib/registry-public.ts`, currently `1.4.0`) — versions the public `/registry.json` projection.
- A component's own `version` field — versions that component's implementation.

`AGENT_CONTRACT_GENERATOR_VERSION` versions the compiler's own generation
logic separately from the schema it emits, following the same discipline.

## What AK-1 explicitly does not do

No Skill (AK-2), no retrieval/hosting/MCP (AK-3), no recipes/composition
modeling (AK-4), no eval harness (AK-5), no Guard, no CLI, no public
route for `public/agent/`, no change to `/registry.json`, `/r/*`, the
shadcn generator, `/llms.txt`, `/llms-full.txt`, or Figma.

## AK-2 — Universal Skrewww Agent Skill

### What this is

The instruction layer teaching an AI coding agent *how* to use Skrewww
safely — a companion to AK-1's compiled *facts*, never a duplicate of
them. AK-2 adds zero new component data; it adds one authored file of
rules and a deterministic workflow that points at AK-1's generated
contracts.

### Canonical source and adapter

**Canonical:** `agent/skill/SKILL.md` (206 lines, well under the 500-line
budget). Frontmatter `name: skrewww-ui` + a trigger `description`; body is
rules + workflow only — no component catalog, no token list, no hardcoded
Stable/Beta/prop counts (those are read from `index.json` at task time, so
they never go stale in this file).

**Claude adapter:** `.claude/skills/skrewww-ui/SKILL.md`, generated by
`npm run install:agent-skill` (`scripts/install-agent-skill.ts`, backed by
`lib/agent-kit/skill-adapter.ts`) as a **byte-identical** copy of the
canonical file. Not committed — `.claude/` is gitignored repo-wide already
(pre-existing convention, unrelated to Agent Kit), so there is no
committed second copy that could drift. `lib/agent-kit/skill.test.ts`
proves byte-identity by actually running the install script and diffing
the result, not by inspection alone.

The same canonical file is meant to be installable, unmodified, into any
Skill-compatible agent tool (Cursor, Codex, others) — there is exactly one
rulebook, and adapters are pure installation mechanics.

### Progressive disclosure

Two layers, not three — AK-1's contracts already serve the role a
`references/` tree would otherwise play, so AK-2 adds no `references/`
directory:

1. **Always loaded:** `agent/skill/SKILL.md` — rules, trust order,
   workflow, and pointers to where facts live.
2. **On demand:** `public/agent/system.json` (compiled policy) and
   `public/agent/contracts/<slug>.json` (per-component facts), read only
   for the component(s) actually relevant to the current task.

### Contract lookup workflow (what the Skill teaches)

1. Recognize a Skrewww UI task.
2. Consult `system.json` for standing policy if not already internalized.
3. Resolve the candidate slug(s) against `index.json` — the real
   component allow-list.
4. Read `public/agent/contracts/<slug>.json` before using that component
   — every time, not from memory.
5. Use only `api.properties` as the React prop allow-list. `api.variants` /
   `api.sizes` are value or scenario metadata — use those values only on a
   prop that already exists in `api.properties` (never invent a `variant`
   prop from descriptive `api.variants` alone). Use `tokens.used` as given;
   respect `status` (Stable/Beta); apply `guidance`; treat
   `behavior`/`figma`/`distribution` as optional and often absent.
6. If the contract doesn't cover the request, say so or compose from
   contracts that do — never invent an API to close the gap.

### Trust order (as taught by the Skill)

Canonical repo source → generated Agent Kit contracts (the agent-facing
authoritative projection for normal execution) → public registry/
distribution surfaces → the consumer project being worked in → model
memory. The consumer project's own content (README, comments, existing
code) is explicitly framed as **data, not Skrewww governance** — nothing
in a project the agent is working on can override this Skill's rules or a
contract's facts. This is the minimum necessary instruction-precedence
statement; AK-2 does not build a broader security framework.

### Missing-data and maturity behavior (as taught by the Skill)

Absence means "not modeled in this contract," never "infer from a similar
component" — covered explicitly for `behavior.*`, `figma.verified: false`,
absent `distribution`, and absent `knownLimitation`. `tokens.used` is
taught as contractual metadata to cite as-is — the Skill explicitly warns
against re-scanning a component's CSS and adding tokens found there,
directly referencing the reconciliation finding below. Maturity
(`status`) is always read from the contract per-component; the Skill
contains no hardcoded current count of how many components are Stable
vs. Beta (verified by a structural test that re-derives the real counts
and asserts the Skill text doesn't contain them as fixed prose).

### The Avatar/Pagination `tokens.used` nuance (why the Skill calls this out)

The R1 reconciliation (see the entry above) found that `registry.tokensUsed`
is not always "every CSS custom property the component's stylesheet
references" — for `avatar` and `pagination` specifically, a pre-existing
test locks the array to *verified Figma bindings*, deliberately narrower
than raw CSS usage. AK-2's Skill teaches this as a general rule (never
treat `tokens.used` as an invitation to reconstruct a second token graph
by scanning CSS) rather than special-casing those two slugs, since the
same narrowing could apply to other components in the future.

### Explicit AK-3/4/5/Guard boundary (as stated in the Skill)

The Skill itself states what it does *not* do: no recipes/composition
contracts (AK-4), no hosted/remote retrieval, MCP, embeddings, or semantic
search (AK-3), no enforcement/blocking checks (Guard). AK-2 added no MCP
server, no recipe implementation, no Guard code, and no new
`contract-schema.ts` fields for `states`/`slots`/`composition`/
`forbiddenPatterns` — all verified by structural tests
(`lib/agent-kit/skill.test.ts`) that assert the relevant files/fields
don't exist, not merely by omission in this document.

### Consumption proof

`lib/agent-kit/skill.test.ts` includes a smoke proof (not an AK-5-style
model eval): a slug read from `index.json` resolves to a real compiled
contract with matching `name`/`status`/`api.properties`, and the Skill's
documented output paths and npm script names are checked against the
actual `package.json` and generator output — infrastructure verification,
no LLM involved.

## AK-3 — Registry / Retrieval + Project Context

### What this is

Connects the three layers that already existed independently — Agent Kit
contracts (AK-1/AK-2), the shadcn-compatible distribution registry, and a
real consumer project — without creating a second registry, a second
component catalog, or a custom Skrewww MCP server.

### Retrieval architecture — `/agent/*` vs `/r/*`

`public/agent/` (AK-1's local-only output) is now wired into
`npm run build` (`"build": "npm run generate:registry && npm run
generate:agent-context && next build"`) and served exactly like
`public/r/` already is: as **static files under `public/`**, with **no
Next.js route handler**. `app/agent/` does not exist. This is
deliberate and is itself the security boundary — a dynamic
`[slug]/route.ts` would need to defend against path traversal and
malformed input; static file serving needs no such defense, because
Next.js only ever resolves a literal, pre-existing file under `public/`.
An unknown slug 404s because no file exists for it, not because of
application logic that could have a bug.

Verified live (production build + `next start`, see
`lib/agent-kit/retrieval.test.ts` for the automated form):

| Request | Result |
|---|---|
| `/agent/index.json` | 200 |
| `/agent/system.json` | 200 |
| `/agent/contracts/button.json` | 200 |
| `/agent/contracts/not-a-real-slug.json` | 404 |
| `/agent/contracts/..%2f..%2f..%2fpackage.json` | 404 |

**Roles stay separate, by construction, not by convention alone:**

| | `/r/<name>.json` | `/agent/contracts/<slug>.json` |
|---|---|---|
| Answers | "How is this installed?" | "What is this, how should it be used?" |
| Owner | `lib/shadcn-registry-generator.ts` | `lib/agent-kit/contract-compiler.ts` |
| Shape | shadcn `registry-item.json` (`files[].content`, `dependencies`, `registryDependencies`) | `ComponentAgentContract` (`guidance`, `tokens.used`, `api.properties`, `behavior`, `figma`) |
| Coverage | 9 items (foundation + 8 components) | 47 (every implemented component) |

AK-3 added no field to either schema to make them "look symmetrical" —
`lib/agent-kit/registry-integration.test.ts` asserts a real contract has
no `$schema`/transport fields and a real manifest has no
`guidance`/`tokens` fields, catching an accidental merge in either
direction.

### Public retrieval safety

Every field on every generated contract was already covered by AK-1's
leak guard (no absolute paths, no secrets/env values). AK-3 re-verifies
this against the **actual bytes on disk** that a production deploy would
serve (`lib/agent-kit/retrieval.test.ts`), not just the in-memory
compiler output, and additionally locks `provenance` down to exactly four
public-safe fields (`schemaVersion`, `generatorVersion`, `sourceGitSha`,
`sourceGitCommitTimestamp`) — a real, already-public git commit SHA and
its own commit date, nothing about the machine or account that built it.

### Determinism through the build wiring

`lib/agent-kit/retrieval.test.ts` deletes `public/agent/` entirely,
regenerates, and SHA-256-compares every file against a prior generation —
proving the build-wired path is exactly as deterministic as the AK-1
standalone script, not a new code path with new risk.

### MCP compatibility — result

**No custom Skrewww MCP server was built or is planned for AK-3.** Audited
the currently-installable shadcn CLI's own `mcp` subcommand instead
(`npx shadcn mcp init --client <claude|cursor|vscode|codex|opencode>`):

- It writes a standard `.mcp.json` pointing the client at `npx
  shadcn@latest mcp` — **shadcn's own MCP server**, not a new package.
- Live-verified (JSON-RPC over stdio, in an isolated scratch project with
  `components.json` declaring `"@skrewww": "https://skrewww.com/r/{name}.json"`):
  the server responds to `initialize` (`serverInfo.name: "shadcn"`) and
  exposes `get_project_registries`, `list_items_in_registries`,
  `search_items_in_registries`, `view_items_in_registries`,
  `get_add_command_for_items` — all resolved against whatever registries
  `components.json` declares, `@skrewww` included, with zero Skrewww-authored
  server code.
- **Genuine, evidence-backed gap found, documented, not fixed:**
  `list_items_in_registries`/`search_items_in_registries` additionally
  require a browsable index file at `<base>/r/registry.json`, which
  Skrewww does not currently publish (confirmed by the live error:
  `Request to https://skrewww.com/r/registry.json?limit=100 failed`).
  Item-level tools (`view_items_in_registries`, `get_add_command_for_items`)
  need no index — they resolve `@skrewww/<name>` directly, the same
  resolution the already-proven `npx shadcn view/add @skrewww/<name>`
  path uses (see `npm run smoke:consumer`, re-run clean in this pass,
  82.2s, all assertions).
- **Not fixed in AK-3**: publishing a `registry.json` index is
  shadcn-distribution-surface work, not Agent Kit retrieval work — doing
  it now would be exactly the "expand `/r/` to make AK-3 look complete"
  outcome this phase's brief explicitly forbids. Recorded as an
  independent, optional follow-up for whichever future phase owns
  distribution-surface completeness.

### Registry integration — installability detection

`isDistributedViaSkrewwwRegistry(slug)` (`lib/agent-kit/project-context.ts`)
answers "is this component installable via `@skrewww`?" by checking the
**same** canonical `entry.files` field the shadcn generator itself reads
— no second, hand-maintained list of "the 8 distributed components" was
introduced anywhere. `lib/agent-kit/registry-integration.test.ts` cross-
checks this against the real generated `public/r/*.json` files, confirms
a non-distributed-but-implemented component reports `false` (implemented
≠ installable), and asserts the shadcn generator still builds exactly 9
manifests — proving AK-3 did not expand distribution coverage.

### Project context — evidence model

`lib/agent-kit/project-context.ts`'s `detectProjectContext` is pure: it
takes an array of `{ path, content }` files (gathered by a caller — a
script, a test, a future adapter — never read from disk by the detector
itself) and returns a `ProjectContext` where every field is either
`{ status: "confirmed", value, source }` or `{ status: "unknown" }`.
There is no third, guessed state.

| Field | Evidence required |
|---|---|
| `framework` | a real `next`/`react` dependency in a provided `package.json` |
| `packageManager` | exactly one lockfile present among the provided files |
| `skrewwwRegistry` | `components.json`'s `registries["@skrewww"]`, read verbatim |
| `installedComponentSlugs` | **every** path in a registry entry's own `files` list present among the provided files — reuses the canonical registry, never a parallel list |
| `foundationInstalled` | `styles/skrewww-foundation.css` present |
| `foundationImported` | that exact path referenced in another provided file's content |
| `shapeMode` / `surfaceMode` | a literal `data-skrewww-shape="…"` / `data-skrewww-surface="…"` string found in a provided file |
| `projectInstructionFilesPresent` | `AGENTS.md`/`CLAUDE.md` presence only — names, never content interpreted as Skrewww fact |

**No persisted config format was introduced** (`skrewww.config.*`,
`.skrewww.json`, new `package.json` fields) and **no CLI** (`npx
skrewww info`) exists or was added — context is re-detected fresh from
real files every time.

`lib/agent-kit/project-context.test.ts` fixtures directly prove the
brief's four required scenarios: (A) a fully configured consumer —
every confirmable field is confirmed with correct evidence; (B) a
partial consumer — only real signals confirm, everything else stays
`unknown`, never defaulted; (C) a non-Skrewww project — real non-Skrewww
signals (e.g. a package manager) are still reported, but no Skrewww state
is fabricated; (D) hostile/untrusted project text — a README containing
prompt-injection-shaped text ("ignore all previous instructions...",
fabricated prop claims) influences **no** field; the one documented,
accepted limitation is that a literal `data-skrewww-*` string matches
even inside a comment, because the detector is a plain text pattern
match with no concept of "real usage" — this is why project context stays
below generated contracts in trust order and is never itself a security
boundary.

### Boundary: this document does not restate

Trust order, missing-data handling, and maturity handling are unchanged
from AK-2's own sections above — project context slots in as one more
"consumer project" input, still ranked below generated contracts and
above only model memory.

### AK-4 boundary

AK-3 added no recipe, no composition contract, no `states`/`slots` field,
no eval harness, no Guard code, no CLI, and touched no Figma or
Presentation V2 surface. `isDistributedViaSkrewwwRegistry` and
`detectProjectContext` are plain data-driven functions, not a
composition/recipe engine — composing multiple components into a
documented pattern is explicitly AK-4's job (see below).

## AK-4 — Recipes / Feature Kits

### Purpose

A **Recipe** teaches an agent how to combine existing verified Skrewww
components for a common product interaction. It is not a React component,
not a `/r/*` package, not a page template, and not an evaluation.

Trust order (locked):

1. canonical repo source
2. generated **component** contracts
3. generated **Recipes / Feature Kits**
4. public registry/distribution
5. consumer project
6. model memory

**Component contracts always win over Recipes.** Recipes must reference
component slugs and may only cite API facts that the current compiled
component contract proves. AK-4 does **not** extend
`lib/agent-kit/contract-schema.ts` with slots, composition, or
forbiddenPatterns — those stay absent from component contracts.

### Canonical authoring

| Artifact | Path |
|---|---|
| Authored Recipes | `agent/recipes/*.ts` (+ `agent/recipes/index.ts`) |
| Authored Feature Kits | same barrel (`authoredFeatureKits`) — thin Recipe-id lists only |
| Schema | `lib/agent-kit/recipe-schema.ts` |
| Compiler | `lib/agent-kit/recipe-compiler.ts` (pure; contracts passed in) |

### Generated public paths

```
public/agent/recipes/index.json
public/agent/recipes/<recipe-id>.json
public/agent/feature-kits/index.json
public/agent/feature-kits/<kit-id>.json
```

Produced by `npm run generate:agent-context` (same git provenance as
component contracts; still gitignored under `public/agent/`). Discovery
is under `/agent`, never via shadcn MCP/`/r/registry.json`.

### Derived fields (never authored)

- `componentMaturity`: `allStable` | `containsBeta` from referenced contracts
- `installableViaSkrewwwRegistry` / `installCommand`: via
  `isDistributedViaSkrewwwRegistry` (AK-3) — no invented install commands

### Feature Kits

A Feature Kit is a lightweight named list of Recipe IDs for a broader
capability. It must not copy Recipe bodies. AK-4 ships one pilot kit.

### ProjectContext

Recipes may note confirmed-or-unknown Shape/Surface/install/registry
considerations. AK-4 does not add a second detector.

### AK-5 boundary

AK-4 adds no OFF/ON eval harness, scoring rubric, LLM prompt suite, or
Guard enforcement. Those remain AK-5 / Guard (see below).

## AK-5 — Evaluations

### Purpose

Answer: does Agent Kit ON materially reduce hard design-system errors versus
the same model/task with Agent Kit OFF?

### OFF vs ON

| Condition | Receives |
|---|---|
| **OFF** | Same user task + consumer fixture. No Skill, contracts, Recipes, Feature Kits. |
| **ON** | Same task/fixture + canonical Skill + relevant contracts/Recipes (progressive disclosure) + ProjectContext rules. |

Isolation: separate fresh contexts per case/condition. Do not run OFF after
teaching the same conversation the Agent Kit answers.

### Deterministic vs subjective

Hard scoring is pure and contract-backed (`lib/agent-kit/evaluation-scorer.ts`).
Primary metrics: invented components/APIs, installability errors, maturity
errors, context errors, authority errors, accessibility-fact misses,
forbidden claims, malformed output. Aggregate score is convenience only —
critical counts gate release. Optional human review stays separate and is
not mixed into hard scores. No model-as-judge in AK-5.

**API allow-list:** `api.properties` is the React prop allow-list.
`api.variants` / `api.sizes` are descriptive value/scenario metadata — they
do **not** create props. A scenario name in `api.variants` must never become
`variant={...}` unless `variant` itself is listed in `api.properties`.

**Forbidden-claim scan:** structured fields (`componentSlugs`,
`apiReferences`, `installCommands`, `maturityClaims`, `recipeIdsUsed`) are
substring-checked. `implementation` is checked only for **usage-shaped**
references (e.g. `glowIntensity=`, JSX attributes). Mentions inside
`unresolvedGaps` / `assumptions`, and rejection prose in `implementation`
("Do not use glowIntensity"), do **not** count as claiming the invalid API.

**Isolation (mandatory):** every OFF and every ON case must run in a
**separate fresh execution context** — no multi-case batching within a
condition. Batched ON execution is a methodology failure even if scores
look strong.

### Baseline freeze

Before the first real paired run, record the Agent Kit freeze SHA. Do not
edit Skill/contracts/Recipes/ProjectContext/distribution mid-run to improve
scores. Fix harness bugs only. Remediations after baseline use a **new**
run id; never overwrite the baseline artifacts.

### Artifacts

Canonical cases: `evals/agent-kit/cases.ts`. Generated prompts (gitignored):
`evals/agent-kit/generated/`. Runs: `evals/agent-kit/runs/<run-id>/` with
`metadata.json`, `off|on/<case-id>.json`, `report.json`, `SUMMARY.md`.

### AK-6 gate

AK-6 Public Beta starts only if the AK-5 release gate passes (documented in
`docs/project-status.md`). Failures require an AK-5 remediation sub-pass.

## AK-6 — Public Beta

### What this is

Productization and release readiness only — no material behavioral
change to the Skill, contract semantics, Recipe semantics, or
ProjectContext. AK-6 ships the exact system AK-5 evaluated: documentation,
discovery, packaging metadata, and release surfaces around it.

### Behavior integrity (verify before trusting any AK-6 change)

`agent/skill/SKILL.md`'s workflow/rules content is byte-for-byte unchanged
from the V3 freeze (`08fc020fede99d6d97df49126f5f4efb081547d9`) — AK-6
only added it as a second, publicly-served static file
(`public/agent/skill/SKILL.md`), never edited its content.
`lib/agent-kit/contract-schema.ts` (the file
governing contract/Recipe/ProjectContext *shape*) was not touched.
`lib/agent-kit/beta-version.ts` is a new, standalone constant module used
only by documentation surfaces (the `/agent-kit` page, changelog) — it is
deliberately not wired into any compiled JSON contract, so adding it
carries zero schema risk.

### Beta version model

Four independent version concepts, never collapsed:

| Concept | Lives in | Example |
|---|---|---|
| A component's own version | `lib/component-registry*.ts` | Button `0.1.0-beta` |
| Contract schema version | `contract-schema.ts` (`CANONICAL_AGENT_CONTRACT_SCHEMA_VERSION`) | `1.0.0` |
| Generator version | `contract-schema.ts` (`AGENT_CONTRACT_GENERATOR_VERSION`) | `1.0.0` |
| **Agent Kit product version** | `lib/agent-kit/beta-version.ts` (**new**) | `0.1.0-beta.1` |

The product version is documentation-surface metadata (the `/agent-kit`
page, the changelog entry) — it is not embedded in any generated
`public/agent/*.json` file, to avoid touching `contract-schema.ts` for a
release-readiness concern.

### Skill distribution model

Still exactly one canonical source: `agent/skill/SKILL.md`. Two
mechanical projections, both generated, both byte-identical, neither a
second hand-maintained rulebook:

1. **Local Claude adapter** (AK-2, unchanged): `npm run install:agent-skill` → `.claude/skills/skrewww-ui/SKILL.md`, not committed.
2. **Public static file** (**new**, AK-6): `scripts/generate-agent-context.ts` also writes it to `public/agent/skill/SKILL.md`, served exactly like every other `/agent/*` artifact — static file, no route handler, wired into `npm run build`.

An external consumer with no access to this repository can now fetch the
real Skill directly: `GET /agent/skill/SKILL.md`.

### Public interfaces — Beta support boundary

**Supported:** `/agent/index.json`, `/agent/system.json`,
`/agent/contracts/<slug>.json`, `/agent/recipes/index.json` +
`/agent/recipes/<id>.json`, `/agent/feature-kits/index.json` +
`/agent/feature-kits/<id>.json`, `/agent/skill/SKILL.md`,
`/r/<name>.json` (where a manifest exists). **Not yet:** a custom MCP
server, `/r/registry.json` (shadcn list/search index — see the AK-3
section above), a Skrewww CLI, Skrewww Guard.

### Consumer installation reality (audited, not assumed)

`npm run install:agent-skill` only works from inside this source
repository — it is not a public Beta installation mechanism for an
external project. The truthful public path documented on `/agent-kit` is:
fetch `/agent/skill/SKILL.md` directly (plain Markdown + YAML
frontmatter, no build step, no package) and save it wherever the
consumer's agent tool loads project Skills from. No package was
published and no CLI was built merely to make this feel more polished —
a raw file fetch is the smallest thing that is actually true.

### MCP — reconfirmed, no new decision

Unchanged from AK-3: no custom Skrewww MCP server. Public docs point
consumers at the shadcn CLI's own `npx shadcn mcp init`, with the same
`registry.json`-index limitation already documented and still not fixed
(publishing that index remains distribution-surface work, out of Agent
Kit's scope).

### Guard boundary

Not included in Beta. Documented explicitly as such on `/agent-kit` and
in this doc: Guard is enforcement/CI/drift work, a distinct later
roadmap item, and AK-6 implements none of it (no compliance blocker, no
lint package, no merge gate).

### Feedback path — resolved at OS-1 launch (previously a genuine reported gap)

Originally audited (during AK-6 Beta productization, repository still
private): no public GitHub Issues link, contact form, or support email
existed anywhere in this site's code, content, or `siteConfig`
(`repositoryUrl`/`figmaUrl` were both explicitly `undefined`). The
project's git remote was a **private** repository — confirmed via
`gh repo view` (`"visibility":"PRIVATE"`) — so a GitHub Issues link would
have both misled external users (404/access-denied) and disclosed a
private repository's existence. AK-6 deliberately did not invent a channel
to paper over this; the public `/agent-kit` page stated the gap honestly
instead of linking anywhere. The doc recorded this as requiring a human
decision (make the repo public with Issues enabled, or supply a real
support email/form) before Beta had a working feedback loop.

**Resolved as part of OS-1 Open Source Launch**: the repository is now
public and GitHub Issues is the live feedback channel. `siteConfig.repositoryUrl`
now points at `https://github.com/usmanfarooqi88/skrewwwDS`; the public
`/agent-kit` Feedback section links to GitHub Issues (Agent Kit issue /
Bug report templates) and to `SECURITY.md` for vulnerabilities. See
`docs/open-source-readiness.md` for the full launch record.

### Evaluation evidence — public framing

Public wording (`/agent-kit`, changelog) is intentionally more
conservative than the internal `docs/project-status.md` AK-5 record:
states the 14-case suite, the 35→1 hard-error result, that it was run
with Cursor Task subagents with the vendor model identifier not exposed,
and explicitly disclaims universal/statistical significance. Does not
publish the `identity-icon-button` residual by name (internal eval
jargon) — it's covered by the general "Recipes/Skill gaps may exist,
please report them" framing instead, since surfacing one specific
internal case ID would be exposing test mechanics, not user-facing
information.

### AK-6 release checklist (reusable for future Agent Kit Beta releases)

- [ ] `git status` clean, `main == origin/main`
- [ ] AK-5 release gate still PASSED (no unapproved behavioral change since freeze)
- [ ] `agent/skill/SKILL.md` content unchanged from the frozen behavioral baseline (diff against the freeze SHA if any edit touched it)
- [ ] `lib/agent-kit/contract-schema.ts` untouched, or any change explicitly reviewed and approved
- [ ] Focused Agent Kit tests green (`lib/agent-kit/*.test.ts`)
- [ ] `npm run lint`, `npm run typecheck`, full `npm test`, `npm run build` all green
- [ ] `npm run generate:agent-context` (and `generate:registry`) succeed from a deleted `public/agent/`/`public/r/` state
- [ ] Determinism: two generations at one source SHA byte-identical
- [ ] Public HTTP smoke: `/agent-kit`, `/agent/index.json`, `/agent/system.json`, a known contract, the Recipe index, a known Recipe, the Feature Kit index, `/agent/skill/SKILL.md` all 200; an unknown slug and a traversal-shaped path 404
- [ ] External-consumer smoke (`npm run smoke:consumer`) still green
- [ ] Beta version bumped consistently across `/agent-kit` and the changelog entry
- [ ] Changelog entry added, using only the existing `new`/`improved`/`fixed` item types, no internal phase jargon or commit SHAs
- [ ] Known limitations section current and honest
- [ ] Feedback path either resolved or explicitly re-flagged as open
- [ ] Sitemap includes the new/updated public docs route
- [ ] `git diff --check` clean

## See also

- `docs/architecture/source-of-truth.md` — general conflict-resolution rules this document inherits.
- `docs/architecture/shadcn-distribution.md` — the distribution surface AK-3 integrates with, not replaces.
- `docs/project-status.md` — dated status entries for the R1 reconciliation, AK-1, AK-2, AK-3, and AK-4 completion.
- `lib/agent-kit/contract-compiler.test.ts` — the enforced AK-1 contract (join integrity, R1 guard, determinism, leak protection).
- `lib/agent-kit/skill.test.ts` — the enforced AK-2 contract (Skill structure, catalog/count-free, adapter byte-identity, out-of-scope boundaries, consumption proof).
- `lib/agent-kit/retrieval.test.ts`, `lib/agent-kit/registry-integration.test.ts`, `lib/agent-kit/project-context.test.ts` — the enforced AK-3 contract.
- `lib/agent-kit/recipe-compiler.test.ts` — the enforced AK-4 contract.
- `lib/agent-kit/evaluation-scorer.test.ts` — the enforced AK-5 harness contract.
- `evals/agent-kit/` — authored cases, fixtures, and baseline runs.
- `agent/skill/SKILL.md` — the canonical Skill itself.
- `agent/recipes/` — authored Recipe / Feature Kit sources.
