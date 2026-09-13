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
5. Use only `api.properties`/`variants`/`sizes` and `tokens.used` as
   given; respect `status` (Stable/Beta); apply `guidance`; treat
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
Guard enforcement. Those remain AK-5 / Guard.

## See also

- `docs/architecture/source-of-truth.md` — general conflict-resolution rules this document inherits.
- `docs/architecture/shadcn-distribution.md` — the distribution surface AK-3 integrates with, not replaces.
- `docs/project-status.md` — dated status entries for the R1 reconciliation, AK-1, AK-2, AK-3, and AK-4 completion.
- `lib/agent-kit/contract-compiler.test.ts` — the enforced AK-1 contract (join integrity, R1 guard, determinism, leak protection).
- `lib/agent-kit/skill.test.ts` — the enforced AK-2 contract (Skill structure, catalog/count-free, adapter byte-identity, out-of-scope boundaries, consumption proof).
- `lib/agent-kit/retrieval.test.ts`, `lib/agent-kit/registry-integration.test.ts`, `lib/agent-kit/project-context.test.ts` — the enforced AK-3 contract.
- `lib/agent-kit/recipe-compiler.test.ts` — the enforced AK-4 contract.
- `agent/skill/SKILL.md` — the canonical Skill itself.
- `agent/recipes/` — authored Recipe / Feature Kit sources.
