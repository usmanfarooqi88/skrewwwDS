# Versioning policy

Skrewww uses several version identifiers. They serve different purposes and **do not need to match numerically**.

## Identifiers

| Identifier | Location | Meaning |
|------------|----------|---------|
| **Package version** | `package.json` `version` | npm package / documentation site release tag (currently `1.0.0`). |
| **Design system version** | `lib/site-config.ts` `designSystemVersion` | Overall platform maturity surfaced in metadata, LLM indexes, and JSON-LD. |
| **Documentation version** | `lib/site-config.ts` `documentationVersion` | Documentation site content generation baseline. |
| **GitHub release tag** | `v1.0.0` on GitHub Releases | Same platform/docs release family as package version — not a per-component or Agent Kit version. |
| **Registry schema version** | `lib/registry-public.ts` `metadata.schemaVersion` | Shape of `/registry.json` (currently `1.4.0`). Breaking registry field semantics or shape bump this. |
| **Canonical entry schema** | `CANONICAL_REGISTRY_SCHEMA_VERSION` in `lib/component-registry.ts` | Internal `ComponentRegistryEntry` contract (currently `1.0.0`). Independent of public `/registry.json` schemaVersion. |
| **Component version** | Each `ComponentRegistryEntry.version` | Per-component API/visual maturity (e.g. calendar batch `0.5.0-beta`, early forms `0.2.0-beta`). |
| **Agent Kit product version** | `lib/agent-kit/beta-version.ts` `AGENT_KIT_PRODUCT_VERSION` | Maturity of the Agent Kit integration layer (currently `0.1.0-beta.1`). Independent of platform `1.0.0` and of any component version. See [`agent-kit.md`](agent-kit.md). |
| **Agent contract schema** | `lib/agent-kit/contract-schema.ts` `CANONICAL_AGENT_CONTRACT_SCHEMA_VERSION` | Shape of `/agent/contracts/*.json` (currently `1.0.0`). Not the Agent Kit product version. |
| **Core version** | Each `ComponentRegistryEntry.coreVersion` (optional) | Minimum `@skrewww/core` version a component's tokens require — real only once that package exists and is versioned; see the Distribution Model section in `skrewww-claude-project-instructions.md` for the SemVer policy (a token custom-property rename/deletion is a `@skrewww/core` major bump). Currently unpopulated everywhere — the package doesn't exist yet. |
| **Component status** | `ComponentRegistryEntry.status` | `beta` = production-usable with possible API/visual change; `documented` = Figma-only; `stable` reserved for future promotion. |
| **lastUpdated** | `lib/site-config.ts` `lastUpdated` | Fixed source-controlled editorial date for site-wide metadata — **never auto-set from build time**. |
| **reactLastUpdated** | Per registry entry | Fixed date when the React implementation last materially changed. |

## Beta status

A component marked **Beta** in the registry:

- Has a live React implementation and preview on the docs site
- Is included in `/registry.json` when `hasImplementation: true`
- May change props, visuals, or keyboard behavior until promoted to `stable`
- Is indexed for SEO/LLM when `indexing: "index"`

A component marked **Stable**:

- Meets the Stable-v1 promotion bar (settled public API, parity or documented intentional difference, a11y/responsive coverage, green tests, accurate registry)
- Uses component `version: "1.0.0"` (independent of platform `designSystemVersion`, which is also `1.0.0`)
- Still may receive non-breaking fixes; breaking API changes require a major component version bump

## Implemented component count

The canonical implemented count is derived at runtime:

```ts
getImplementedRegistryEntries().length // hasImplementation === true
```

Do not hardcode counts in README, tests, or category copy. Redirect aliases and internal utilities are excluded.

## Dates

All documentation dates (`lastUpdated`, `reactLastUpdated`, `documentationLastUpdated`) are **fixed strings in source**. CI/build must not rewrite them to the current date.

## Environment

Production deployments must set `NEXT_PUBLIC_SITE_URL` to the canonical absolute origin. See `.env.example`.
