# Source of truth

This document defines how conflicting claims are resolved in the Skrewww Design System repository.

## React implementation status

1. **`lib/component-registry.ts` (and category registry files)** — canonical list of components, implementation flags, indexing, and metadata.
2. **`components/ui/index.ts`** — confirms public React exports; internal paths are not registry components.
3. **Tests and production build** — confirm executable status.
4. **`README.md` implemented-component table** — must match registry (enforced by `lib/readme-status.test.ts`).
5. **Standing instruction files** — durable principles only; no volatile counts without a last-verified date.

The README must not override registry facts.

## Figma status

1. **Figma MCP inspection** — authoritative for pages, component sets, variables, and verified node IDs when the connection succeeds.
2. **`content/*.ts` documentation inventory** — Figma-derived prose; may lag React implementation.
3. **Historical instruction snapshots** — labelled historical; not current state.
4. **Unverified counts** — must include last-verified date or “MCP verification required”.

Do not infer current Figma state from old prose or README tables.

## Tokens

| Layer | Authority |
|-------|-----------|
| Verified Figma variable | Figma MCP + parity metadata |
| React runtime value | `styles/tokens.css` |
| Tailwind docs-shell palette | Documented in [`token-source-of-truth.md`](token-source-of-truth.md) |
| Parity labels | Verified, Alias, Temporary, Experimental, Unresolved |

Public component CSS modules must use CSS custom properties — not ad hoc hex values.

## Documentation

| Artifact | Role |
|----------|------|
| `README.md` | Concise overview, commands, limitations |
| `docs/getting-started.md` | **Canonical developer onboarding** |
| `docs/contributing.md` | Contribution, staging, and Git safety |
| `CONTRIBUTING.md` | Pointer to `docs/contributing.md` |
| `docs/project-status.md` | Volatile current status and inventory |
| `docs/architecture/*.md` | Durable architecture and parity notes |
| Registry-generated routes | `/registry.json`, sitemap, JSON-LD, llms outputs |
| Standing Claude/Figma instruction files | Durable working rules |

## Domains and URLs

| Origin | Role |
|--------|------|
| `NEXT_PUBLIC_SITE_URL` | Deployment authority for canonical metadata |
| `http://localhost:3000` | Local development default |
| `https://skrewww.com` | Confirmed live production domain; also the code fallback when env unset |
| `https://skrewww.test` | Test-only origin in unit tests |

Do not hardcode assumptions about which domain is live in a given environment —
canonical URLs follow `NEXT_PUBLIC_SITE_URL` (or the documented fallback).

## Build directories

| Directory | Purpose |
|-----------|---------|
| `.next` | Development and production builds |
| `.next-playwright` | Isolated Playwright production build |

Never run two builds against the same `distDir`. Playwright must not corrupt the active dev cache.

## Generated artifacts (not source)

- `*.tsbuildinfo`
- `.next/`, `.next-playwright/`
- `test-results/`, `playwright-report/`, `coverage/`

These are gitignored and excluded from clean archives.
