# Versioning policy

Skrewww uses several version identifiers. They serve different purposes and **do not need to match numerically**.

## Identifiers

| Identifier | Location | Meaning |
|------------|----------|---------|
| **Package version** | `package.json` `version` | npm package / documentation site release tag (currently `0.2.0-beta`). |
| **Design system version** | `lib/site-config.ts` `designSystemVersion` | Overall platform maturity surfaced in metadata, LLM indexes, and JSON-LD. |
| **Documentation version** | `lib/site-config.ts` `documentationVersion` | Documentation site content generation baseline. |
| **Registry schema version** | `lib/registry-public.ts` `metadata.schemaVersion` | Shape of `/registry.json` (currently `1.2.0`). Breaking registry field changes bump this. |
| **Component version** | Each `ComponentRegistryEntry.version` | Per-component API/visual maturity (e.g. calendar batch `0.5.0-beta`, early forms `0.2.0-beta`). |
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
