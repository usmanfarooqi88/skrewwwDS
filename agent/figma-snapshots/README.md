# Figma snapshots (AG-1B)

**Captured evidence, not canonical truth.** Each file records what one exact
Figma node contained at `capturedAt`. Live Figma owns Figma structure; the
registry owns documented metadata; React/TypeScript owns runtime API. A
snapshot never overrides any of them, never maps Figma to React, and is never a
parity verdict.

- Path: `<fileKey>/<slug>.json`. The identity inside must equal the registry's
  `figmaIdentity` for that slug — a snapshot cannot choose its own node.
- Blocks: `observed` (read from Figma, names exact), `derived` (deterministic
  from `observed` only), `unknowns` (deliberately not captured).
- Schema `1.1.0` adds `observed.aliasClosure`: every variable reachable from the
  bound variables through alias values in any mode, so absence from the master's
  dependency graph is provable when `unresolvedIds` is empty. `capture.aliasClosureCapturedAt`
  is present when the closure was read in a later read-only pass than the node.
- Only `capturedAt` changes between captures of an unchanged node.
- Committed because it cannot be regenerated from the repo alone (it needs live
  Figma). The build never writes here.

## Refreshing

1. In the Figma plugin runtime (e.g. the Figma Desktop Bridge's
   `figma_execute`), with the **file named by the identity** open, run
   `scripts/figma-snapshot/capture-in-figma.js` followed by
   `return await captureSkrewwwFigmaNodes([{ slug, fileKey, nodeId }, …])`.
   The script is read-only and refuses targets from any other file.
2. Save the returned JSON, then:

   ```bash
   npx tsx scripts/figma-snapshot/write-snapshots.ts <raw-capture.json>
   ```

   Identities come from the registry; nothing is written unless every
   snapshot validates (`lib/figma-snapshot/validate.ts`).

The capture script (version 1.1.0) follows alias targets transitively, so a fresh
capture carries its own closure. `scripts/figma-snapshot/add-alias-closure.ts`
upgrades existing 1.0.0 snapshots in place from a read-only capture of the
alias-target variables (idempotent; refuses an incomplete closure).

Schema: `lib/figma-snapshot/schema.ts`. Architecture:
`docs/architecture/agent-readiness.md` §21.
