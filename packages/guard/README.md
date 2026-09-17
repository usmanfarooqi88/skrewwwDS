# @skrewww/guard (Beta release candidate)

**Status:** Beta package candidate — **not published** by this repository phase.

Offline, local CLI that checks deterministic Skrewww **canonical-contract**
violations. It does **not** replace TypeScript, and does **not** validate
accessibility, Figma parity, Shape/Surface, or visual quality.

## Public consumer rules (3)

1. `component/nonexistent-slug`
2. `maturity/false-stable-claim`
3. `distribution/false-installable-claim`

The Guard engine also contains 3 **internal Skrewww-repo** rules; those are
**not** included in this public package.

## Install (when published)

```bash
npm install -D @skrewww/guard
```

This phase only validates packing/install via local tarball — do not assume
registry availability.

## Usage

```bash
skrewww-guard [path]
skrewww-guard [path] --claims claims.json
```

Exit codes: `0` no errors · `1` rule errors · `2` tool/parse/facts failure.

## Provenance (v0.1)

Only source files carrying an `@skrewww-component <slug>` origin marker
(injected into Skrewww registry install payloads) establish a Skrewww claim.
Import path or component **name alone never does**.

Marker meaning: **originated from a Skrewww registry installation** — not
“still byte-identical to canonical Skrewww.”

Unknown provenance → no finding.

## Structured claims

`--claims` accepts JSON **data** (not configuration):

```json
{
  "maturity": [{ "componentSlug": "button", "claimedStatus": "stable" }],
  "installability": [{ "componentSlug": "button", "claimedInstallable": true }]
}
```

## Privacy / offline

- Runs locally
- No network, Figma, GitHub, or LLM calls
- No source upload / telemetry
- Diagnostics use project-relative paths; no source dumps

## Zero-config

No `.guardrc` / severity overrides / suppressions.
