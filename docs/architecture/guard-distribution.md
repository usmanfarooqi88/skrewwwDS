# Guard distribution (pre-release hardening)

**Status:** Pre-release package candidate. Guard is **NOT published**.

## Public vs internal

| Surface | Rules | Facts | Provenance |
|---|---|---|---|
| Public package `@skrewww/guard` | 3 consumer | packaged `facts/consumer-facts.json` | `@skrewww-component` origin marker only |
| Repo `npm run guard` | 3 consumer (default) | live registry (`factSource: internal`) | `@/components/ui` path claim |
| Repo `npm run guard -- --internal` | 3 internal | repo registry/artifacts | N/A (artifact checks) |

Engine catalog remains **6** rules. Public package does **not** expose `--internal`.

## Portable facts

- Generator: `npm run generate:guard-facts` / `build:guard-package`
- Committed: `lib/guard/generated/consumer-facts.json`
- Packaged copy: `packages/guard/facts/consumer-facts.json`
- Authority: `componentRegistry` + `isDistributedViaSkrewwwRegistry`
- Fields: slug, displayName, status, installable
- Corrupt/missing packaged facts → exit **2** (no silent registry fallback)

## Provenance contract (v0.1)

**Meaning:** originated from a Skrewww registry installation  
**Not:** still byte-identical to canonical Skrewww

Supported (public package):

- Resolved import whose target file contains `/** @skrewww-component <slug> */`
- Marker is injected into **registry-transported** owned `.ts`/`.tsx` payloads by `lib/shadcn-registry-generator.ts` (repo disk sources unchanged)

Unknown / no finding:

- Unmarked local components (even at `components/ui/Button`)
- Unresolvable imports
- Name-only similarity

## Package

- Name: `@skrewww/guard`
- Bin: `skrewww-guard`
- Location: `packages/guard/` (standalone directory; no workspace monorepo migration)
- Runtime: bundled ESM `dist/cli.js` + `typescript` dependency
- License: MIT (inherits repo LICENSE)
- Version: `0.1.0-beta.1`

## Isolated proof

Local tarball install outside the repo tree succeeds for help / valid / invalid /
claims / parse / corrupt-facts / moved-copy (see `packages/guard/package.test.ts`
and pre-release pilot notes in `guard-foundation.md`).
