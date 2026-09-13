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

## See also

- `docs/architecture/source-of-truth.md` — general conflict-resolution rules this document inherits.
- `docs/project-status.md` — dated status entries for the R1 reconciliation and AK-1 completion.
- `lib/agent-kit/contract-compiler.test.ts` — the enforced contract (join integrity, R1 guard, determinism, leak protection).
