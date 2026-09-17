# @skrewww/guard

**Skrewww Guard Beta `0.1.0-beta.1`**

Docs: [skrewww.com/guard](https://skrewww.com/guard) · Changelog: [skrewww.com/changelog](https://skrewww.com/changelog)

Offline, local CLI for deterministic validation of selected Skrewww
**canonical-contract** claims.

Guard does **not** replace TypeScript. It does **not** validate accessibility,
WCAG, Shape, Surface, Figma parity, visual quality, or arbitrary design-system
correctness. Prop inventiveness (`api/nonexistent-prop`) is deferred.

## Install

```bash
npm install --save-dev @skrewww/guard@beta
```

Prefer the `beta` dist-tag until a stable release. (`latest` currently also
points at `0.1.0-beta.1` because this was the first published version.)

## Usage

```bash
npx skrewww-guard .
npx skrewww-guard path/to/file.tsx
npx skrewww-guard path --claims claims.json
```

Or via the local binary after install: `skrewww-guard`.

### Exit codes

| Code | Meaning |
|---|---|
| 0 | no ERROR findings |
| 1 | one or more Guard ERROR findings |
| 2 | tool / parse / input / facts failure |

## Public consumer rules (exactly 3)

1. `component/nonexistent-slug`
2. `maturity/false-stable-claim`
3. `distribution/false-installable-claim`

The Guard **engine** also implements 3 Skrewww-repo **internal** invariants
(`token/undeclared-css-var`, `distribution/hostrequirements-leak`,
`distribution/hosthost-schema-consistency`). Those are **not** part of this
public consumer CLI.

## Provenance

Guard only treats files carrying a generated `@skrewww-component <slug>`
origin marker (injected into Skrewww registry install payloads) as
Skrewww-origin.

- **Meaning:** originated from a Skrewww registry installation
- **Not:** still byte-identical to canonical Skrewww (local edits are OK)
- Installs created **before** markers shipped may be unrecognized until
  components are reinstalled/updated
- Unmarked local components (even named `Button` under `components/ui`) →
  **unknown → no ERROR**

Import path or component name alone never establishes a claim.

## Structured claims (data, not config)

```json
{
  "maturity": [{ "componentSlug": "button", "claimedStatus": "stable" }],
  "installability": [{ "componentSlug": "button", "claimedInstallable": true }]
}
```

Zero-config happy path. No `.guardrc`, severity overrides, or suppressions.

## Privacy / offline

- Runs locally after install
- No source upload, no telemetry
- No LLM, Figma, or GitHub required for validation
- Diagnostics use project-relative paths; no source dumps
