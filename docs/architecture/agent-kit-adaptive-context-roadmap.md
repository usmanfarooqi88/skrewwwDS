# Agent Kit — Adaptive Context & Decision Efficiency Roadmap

**Date:** 2026-10-23  
**Status:** Sequence locked as planning; implementation not authorized by this document.  
**Gate:** No ADOPT / EXPERIMENT recommendation is made until the read-only audit and its evidence review are complete.

This is a follow-up to the completed Agent Kit phases, not a restart of AK-0…AK-5. The canonical phase roadmap in [project status](../project-status.md#active-roadmap) records AK-0 through AK-6 as complete, including AK-3 Retrieval + Project Context and AK-5 Evaluations.

## Why this sequence is gated

The Colibri analogy suggests selective loading and hot-context caching, but its model-weight placement mechanism is not itself evidence that summarizing or omitting design-system contracts is safe. Skrewww must prove that its canonical metadata can rank relevant context without dropping required facts or dependencies.

The existing sources already expose several different kinds of information. They must not be conflated:

- **Relevance signals:** component identity, category, summary, status, API properties, supported variants/sizes, token usage, authored `whenToUse` / `whenNotToUse` guidance, and related-component links.
- **Install/distribution edges:** `registryDependencies`, `internalDependencies`, package dependencies, host requirements, and CSS/core dependencies where present. These answer delivery/installation questions; they do not automatically describe UI composition.
- **Recipe-level composition:** `requiredComponents` and `optionalComponents` on authored Recipes, with compiler validation against component contracts.
- **Not yet established by source inspection alone:** complete field coverage across the current registry, a complete machine-readable composition graph for arbitrary component pairs, and reliable usage-derived hot-component signals.

A `relatedComponents` link is not a formal dependency edge. An install dependency is not automatically a composition requirement. Missing metadata means unknown, not “no dependency.”

## Locked sequence

### AC-0 — Adaptive Context Audit (required gate; read-only)

**Dependency:** explicitly depends on and refreshes the original AK-0 architecture findings for this new use case. The original AK-0 is complete; AC-0 is a scoped audit refresh, not a claim that AK-0 never happened.

Audit the current canonical registry, Agent Contracts, Recipes, registry manifests, and existing retrieval/project-context behavior. No schema edits, telemetry, implementation, or recommendation labels during this stage.

Required evidence:

1. Produce current counts/coverage by field for all current contract slugs, not historical counts copied from the original AK-0 report.
2. Classify each edge/source separately: install dependency, internal file dependency, package/host dependency, explicit Recipe composition, related-component hint, and any other evidence-backed composition relation.
3. Identify which fields can support deterministic relevance ranking, and which are too sparse, editorial, ambiguous, or non-machine-actionable.
4. Build representative retrieval cases and record the baseline selected contracts, dependency closure, token/context size, and any omitted required facts.
5. Document false-negative risks: especially required components, API allow-lists, maturity, accessibility constraints, and missing/unknown metadata.
6. Return an evidence-backed decision record: **existing metadata sufficient for a first safe ranking pass**, **canonical source metadata gap**, or **insufficient evidence**.

**Exit gate:** audit evidence and the source-of-truth map reviewed before moving to any ADOPT / EXPERIMENT recommendation.

### AC-1 — Schema and source-of-truth decision (conditional; before retrieval changes)

This is a decision gate, not an automatic AK-1 reopen.

- If existing fields support the intended first-pass ranking and all required dependency closure can be preserved, keep AK-1 schema/compiler unchanged.
- If an essential composition edge is missing, first identify the authoritative place where that fact can be maintained and verified. A schema field alone cannot make an unknown relationship true.
- Only if the audit proves the canonical source needs new structured data, propose a narrow source/schema/compiler change, versioning impact, migration, deterministic generation, and regression tests. This must happen **before** adaptive retrieval consumes that new field.
- Do not infer dependency edges from labels, filenames, visual similarity, usage frequency, or model memory.

**Exit gate:** an explicit no-schema-change or schema-change decision, with evidence and test obligations.

### AC-2 — Adaptive retrieval extension to existing AK-3 (conditional)

If AC-0 and AC-1 pass, extend the already completed AK-3 retrieval/project-context layer; do not rebuild AK-3.

- Rank candidate contracts using only audit-approved, evidence-backed signals.
- Preserve mandatory system policy and load complete contracts for selected components when correctness depends on their full facts.
- Expand verified install/dependency closure where applicable; include Recipe composition only when the Recipe is relevant.
- Treat sparse or unknown metadata conservatively. Fall back to broader context or explicit uncertainty rather than silently dropping a required contract.
- Keep any compact summaries as navigational aids, never as replacements for authoritative API, maturity, token, accessibility, or dependency facts.
- Do not add usage telemetry or hot caching in this step.

**Exit gate:** deterministic selection/closure tests pass; unknown metadata never becomes a negative dependency assertion.

### AC-3 — Extend AK-5 evaluation before deciding to adopt

Compare paired runs on the same task set and model/configuration:

1. Full-context baseline.
2. Compact-context baseline (if safely constructible).
3. Adaptive retrieval with mandatory closure.

Record task success, invented components/props, contract violations, missing required components, maturity/API mistakes, token count, latency, and cost. Freeze non-inferiority and efficiency thresholds before evaluating results. The adaptive variant must not regress correctness or omit a required contract/dependency; token or latency savings alone cannot pass the gate.

**Exit gate:** reproducible paired results, with all failures and unknowns reported. No positive outcome is assumed in advance.

### AC-4 — Usage-aware hot-context cache (experiment only if AC-3 justifies it)

Only after adaptive retrieval passes its correctness gate, test whether opt-in/minimal usage signals improve cache hits or latency. Frequency may affect ordering or prefetching, but must never remove required context, override canonical facts, or establish a dependency. Define privacy, retention, reset, and project-boundary rules before collecting any usage data.

### AC-5 — Low-risk decision layer (separate experiment)

After the context/eval foundation is stable, assess whether simple choices can be resolved with deterministic rules and contract lookups before considering a classifier. Low confidence, conflicting evidence, or an unmodeled case must escalate to the full agent/retrieval path. This layer may recommend a candidate; it must not invent or authorize component APIs.

## Explicit non-goals for this planning gate

- No immediate `contract-schema.ts` change.
- No reimplementation of AK-3 or AK-5.
- No automatic ADOPT / EXPERIMENT classification of the Colibri-inspired ideas.
- No usage logging, telemetry collection, hot cache, classifier, model call, public API change, or production behavior change.
- No claim that a missing metadata field means a component has no dependency.

## Decision principle

**Audit current facts first → decide whether canonical data/schema must change → extend existing retrieval → evaluate correctness and efficiency together → only then decide which optimizations to adopt or experiment with.**
